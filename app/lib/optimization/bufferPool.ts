/**
 * Buffer Pool for Performance Optimization
 *
 * Reusable buffer pools for Float32Array, SharedArrayBuffer, and AudioBuffers
 * to reduce memory allocations and improve performance.
 */

export interface BufferPoolConfig {
  maxPoolSize: number;
  initialPoolSize: number;
  bufferSize: number;
  enableSharedArrayBuffer: boolean;
  cleanupInterval: number;
}

export interface BufferPoolStats {
  pooled: number;
  inUse: number;
  totalAllocated: number;
  memoryUsage: number;
  hitRate: number;
}

export class Float32BufferPool {
  private available: Float32Array[] = [];
  private inUse: Set<Float32Array> = new Set();
  private config: BufferPoolConfig;
  private stats = {
    requests: 0,
    hits: 0,
    allocations: 0,
  };
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: Partial<BufferPoolConfig> = {}) {
    this.config = {
      maxPoolSize: 100,
      initialPoolSize: 20,
      bufferSize: 4096,
      enableSharedArrayBuffer: false,
      cleanupInterval: 30000,
      ...config,
    };

    this.initializePool();
    this.startCleanupInterval();
  }

  private initializePool(): void {
    for (let i = 0; i < this.config.initialPoolSize; i++) {
      this.available.push(new Float32Array(this.config.bufferSize));
      this.stats.allocations++;
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  acquire(size: number = this.config.bufferSize): Float32Array | null {
    this.stats.requests++;

    // Try to get from pool first
    if (this.available.length > 0 && size === this.config.bufferSize) {
      const buffer = this.available.pop()!;
      this.inUse.add(buffer);
      this.stats.hits++;
      return buffer;
    }

    // Create new buffer if under limit
    if (this.getTotalCount() < this.config.maxPoolSize) {
      const buffer = new Float32Array(size);
      this.inUse.add(buffer);
      this.stats.allocations++;
      return buffer;
    }

    return null;
  }

  release(buffer: Float32Array): void {
    if (this.inUse.has(buffer)) {
      this.inUse.delete(buffer);

      // Clear buffer data for security
      buffer.fill(0);

      // Only return to pool if it's the expected size and pool isn't full
      if (
        buffer.length === this.config.bufferSize &&
        this.available.length < this.config.maxPoolSize
      ) {
        this.available.push(buffer);
      }
    }
  }

  private cleanup(): void {
    // Remove excess buffers from pool
    const excess =
      this.available.length - Math.floor(this.config.maxPoolSize * 0.8);
    if (excess > 0) {
      this.available.splice(0, excess);
    }
  }

  private getTotalCount(): number {
    return this.available.length + this.inUse.size;
  }

  getStats(): BufferPoolStats {
    const pooled = this.available.length;
    const inUse = this.inUse.size;
    const total = pooled + inUse;
    const memoryUsage = total * this.config.bufferSize * 4; // 4 bytes per float32

    return {
      pooled,
      inUse,
      totalAllocated: total,
      memoryUsage,
      hitRate:
        this.stats.requests > 0 ? this.stats.hits / this.stats.requests : 0,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.available = [];
    this.inUse.clear();
  }
}

export class SharedBufferPool {
  private available: SharedArrayBuffer[] = [];
  private inUse: Set<SharedArrayBuffer> = new Set();
  private config: BufferPoolConfig;
  private stats = {
    requests: 0,
    hits: 0,
    allocations: 0,
  };

  constructor(config: Partial<BufferPoolConfig> = {}) {
    this.config = {
      maxPoolSize: 50,
      initialPoolSize: 10,
      bufferSize: 4096,
      enableSharedArrayBuffer: true,
      cleanupInterval: 30000,
      ...config,
    };

    this.initializePool();
  }

  private initializePool(): void {
    // Only create SharedArrayBuffers if supported
    if (typeof SharedArrayBuffer !== "undefined") {
      for (let i = 0; i < this.config.initialPoolSize; i++) {
        try {
          const buffer = new SharedArrayBuffer(this.config.bufferSize * 4);
          this.available.push(buffer);
          this.stats.allocations++;
        } catch (error) {
          console.warn("SharedArrayBuffer not supported:", error);
          break;
        }
      }
    }
  }

  acquire(size: number = this.config.bufferSize): SharedArrayBuffer | null {
    this.stats.requests++;

    if (this.available.length > 0 && size === this.config.bufferSize) {
      const buffer = this.available.pop()!;
      this.inUse.add(buffer);
      this.stats.hits++;
      return buffer;
    }

    // Create new buffer if under limit and supported
    if (
      this.getTotalCount() < this.config.maxPoolSize &&
      typeof SharedArrayBuffer !== "undefined"
    ) {
      try {
        const buffer = new SharedArrayBuffer(size * 4);
        this.inUse.add(buffer);
        this.stats.allocations++;
        return buffer;
      } catch (error) {
        console.warn("Failed to create SharedArrayBuffer:", error);
      }
    }

    return null;
  }

  release(buffer: SharedArrayBuffer): void {
    if (this.inUse.has(buffer)) {
      this.inUse.delete(buffer);

      if (this.available.length < this.config.maxPoolSize) {
        this.available.push(buffer);
      }
    }
  }

  private getTotalCount(): number {
    return this.available.length + this.inUse.size;
  }

  getStats(): BufferPoolStats {
    const pooled = this.available.length;
    const inUse = this.inUse.size;
    const total = pooled + inUse;
    const memoryUsage = total * this.config.bufferSize * 4;

    return {
      pooled,
      inUse,
      totalAllocated: total,
      memoryUsage,
      hitRate:
        this.stats.requests > 0 ? this.stats.hits / this.stats.requests : 0,
    };
  }

  destroy(): void {
    this.available = [];
    this.inUse.clear();
  }
}

export class RingBuffer {
  private buffer: SharedArrayBuffer | Float32Array;
  private view: Float32Array;
  private readIndex: number = 0;
  private writeIndex: number = 0;
  private size: number;
  private mask: number;

  constructor(size: number, shared: boolean = false) {
    // Size must be power of 2 for efficient masking
    this.size = Math.pow(2, Math.ceil(Math.log2(size)));
    this.mask = this.size - 1;

    if (shared && typeof SharedArrayBuffer !== "undefined") {
      this.buffer = new SharedArrayBuffer(this.size * 4);
      this.view = new Float32Array(this.buffer);
    } else {
      this.buffer = new Float32Array(this.size);
      this.view = this.buffer as Float32Array;
    }
  }

  write(data: Float32Array): number {
    const length = Math.min(data.length, this.getAvailableSpace());

    for (let i = 0; i < length; i++) {
      this.view[this.writeIndex] = data[i];
      this.writeIndex = (this.writeIndex + 1) & this.mask;
    }

    return length;
  }

  read(length: number): Float32Array {
    const result = new Float32Array(length);
    const actualLength = Math.min(length, this.getAvailableData());

    for (let i = 0; i < actualLength; i++) {
      result[i] = this.view[this.readIndex];
      this.readIndex = (this.readIndex + 1) & this.mask;
    }

    return result;
  }

  peek(length: number): Float32Array {
    const result = new Float32Array(length);
    const actualLength = Math.min(length, this.getAvailableData());

    for (let i = 0; i < actualLength; i++) {
      result[i] = this.view[(this.readIndex + i) & this.mask];
    }

    return result;
  }

  getAvailableSpace(): number {
    return this.size - this.getAvailableData() - 1;
  }

  getAvailableData(): number {
    return (this.writeIndex - this.readIndex + this.size) & this.mask;
  }

  clear(): void {
    this.readIndex = 0;
    this.writeIndex = 0;
    this.view.fill(0);
  }

  isFull(): boolean {
    return this.getAvailableSpace() === 0;
  }

  isEmpty(): boolean {
    return this.getAvailableData() === 0;
  }
}

export class BufferPoolManager {
  private float32Pool: Float32BufferPool;
  private sharedPool: SharedBufferPool;
  private ringBuffers: Map<string, RingBuffer> = new Map();

  constructor() {
    this.float32Pool = new Float32BufferPool({
      maxPoolSize: 100,
      initialPoolSize: 20,
      bufferSize: 4096,
      cleanupInterval: 30000,
    });

    this.sharedPool = new SharedBufferPool({
      maxPoolSize: 50,
      initialPoolSize: 10,
      bufferSize: 4096,
      cleanupInterval: 30000,
    });
  }

  // Float32Array management
  acquireFloat32Array(size: number = 4096): Float32Array | null {
    return this.float32Pool.acquire(size);
  }

  releaseFloat32Array(buffer: Float32Array): void {
    this.float32Pool.release(buffer);
  }

  // SharedArrayBuffer management
  acquireSharedBuffer(size: number = 4096): SharedArrayBuffer | null {
    return this.sharedPool.acquire(size);
  }

  releaseSharedBuffer(buffer: SharedArrayBuffer): void {
    this.sharedPool.release(buffer);
  }

  // Ring buffer management
  createRingBuffer(
    name: string,
    size: number,
    shared: boolean = false,
  ): RingBuffer {
    const ringBuffer = new RingBuffer(size, shared);
    this.ringBuffers.set(name, ringBuffer);
    return ringBuffer;
  }

  getRingBuffer(name: string): RingBuffer | undefined {
    return this.ringBuffers.get(name);
  }

  removeRingBuffer(name: string): boolean {
    return this.ringBuffers.delete(name);
  }

  // Statistics
  getStats(): {
    float32Pool: BufferPoolStats;
    sharedPool: BufferPoolStats;
    ringBufferCount: number;
  } {
    return {
      float32Pool: this.float32Pool.getStats(),
      sharedPool: this.sharedPool.getStats(),
      ringBufferCount: this.ringBuffers.size,
    };
  }

  // Memory optimization
  optimize(): void {
    // Force cleanup of pools
    this.float32Pool.destroy();
    this.sharedPool.destroy();

    // Recreate with smaller sizes for memory pressure
    this.float32Pool = new Float32BufferPool({
      maxPoolSize: 50, // Reduced
      initialPoolSize: 10, // Reduced
      bufferSize: 2048, // Reduced
      cleanupInterval: 15000, // More frequent
    });

    this.sharedPool = new SharedBufferPool({
      maxPoolSize: 25, // Reduced
      initialPoolSize: 5, // Reduced
      bufferSize: 2048, // Reduced
      cleanupInterval: 15000, // More frequent
    });
  }

  destroy(): void {
    this.float32Pool.destroy();
    this.sharedPool.destroy();
    this.ringBuffers.clear();
  }
}

// Singleton instance
export const bufferPoolManager = new BufferPoolManager();
