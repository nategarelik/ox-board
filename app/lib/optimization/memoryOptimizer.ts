/**
 * Memory Optimizer for OX Board AI Enhancement
 *
 * Manages memory usage through buffer pooling, garbage collection optimization,
 * and resource cleanup to maintain the <150MB memory target.
 */

export interface MemoryMetrics {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
  gcCount: number;
  gcDuration: number;
}

export interface BufferPoolConfig {
  maxSize: number;
  initialCount: number;
  bufferSize: number;
  cleanupInterval: number;
}

class AudioBufferPool {
  private availableBuffers: AudioBuffer[] = [];
  private inUseBuffers: Set<AudioBuffer> = new Set();
  private config: BufferPoolConfig;
  private cleanupInterval?: NodeJS.Timeout;
  private audioContext?: AudioContext;

  constructor(audioContext: AudioContext, config: BufferPoolConfig) {
    this.audioContext = audioContext;
    this.config = config;
    this.initializePool();
    this.startCleanupInterval();
  }

  private initializePool(): void {
    if (!this.audioContext) return;

    for (let i = 0; i < this.config.initialCount; i++) {
      const buffer = this.audioContext.createBuffer(2, this.config.bufferSize, 44100);
      this.availableBuffers.push(buffer);
    }
  }

  acquire(): AudioBuffer | null {
    if (this.availableBuffers.length > 0) {
      const buffer = this.availableBuffers.pop()!;
      this.inUseBuffers.add(buffer);
      return buffer;
    }

    // Create new buffer if pool not at max capacity
    if (this.getTotalBufferCount() < this.config.maxSize && this.audioContext) {
      const buffer = this.audioContext.createBuffer(2, this.config.bufferSize, 44100);
      this.inUseBuffers.add(buffer);
      return buffer;
    }

    return null;
  }

  release(buffer: AudioBuffer): void {
    if (this.inUseBuffers.has(buffer)) {
      this.inUseBuffers.delete(buffer);

      // Clear buffer data
      for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        channelData.fill(0);
      }

      this.availableBuffers.push(buffer);
    }
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupInterval);
  }

  private cleanup(): void {
    // Remove excess buffers if pool is too large
    const totalBuffers = this.getTotalBufferCount();
    if (totalBuffers > this.config.maxSize) {
      const excessCount = totalBuffers - this.config.maxSize;
      const toRemove = Math.min(excessCount, this.availableBuffers.length);

      for (let i = 0; i < toRemove; i++) {
        this.availableBuffers.pop();
      }
    }
  }

  getTotalBufferCount(): number {
    return this.availableBuffers.length + this.inUseBuffers.size;
  }

  getMetrics(): {
    available: number;
    inUse: number;
    total: number;
    memoryUsage: number;
  } {
    const total = this.getTotalBufferCount();
    const memoryUsage = total * this.config.bufferSize * 4 * 2; // 4 bytes per float, 2 channels

    return {
      available: this.availableBuffers.length,
      inUse: this.inUseBuffers.size,
      total,
      memoryUsage
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.availableBuffers = [];
    this.inUseBuffers.clear();
  }
}

class Float32ArrayPool {
  private pools: Map<number, Float32Array[]> = new Map();
  private inUse: Map<number, Set<Float32Array>> = new Map();
  private maxPoolSize: number = 50;

  acquire(size: number): Float32Array {
    const pool = this.pools.get(size) || [];
    const inUseSet = this.inUse.get(size) || new Set();

    if (pool.length > 0) {
      const array = pool.pop()!;
      inUseSet.add(array);
      return array;
    }

    // Create new array
    const array = new Float32Array(size);
    inUseSet.add(array);
    this.inUse.set(size, inUseSet);

    return array;
  }

  release(array: Float32Array): void {
    const size = array.length;
    const inUseSet = this.inUse.get(size);

    if (inUseSet && inUseSet.has(array)) {
      inUseSet.delete(array);

      // Clear array data
      array.fill(0);

      // Add back to pool if not at max capacity
      const pool = this.pools.get(size) || [];
      if (pool.length < this.maxPoolSize) {
        pool.push(array);
        this.pools.set(size, pool);
      }
    }
  }

  cleanup(): void {
    // Remove excess arrays from pools
    for (const [size, pool] of this.pools) {
      if (pool.length > this.maxPoolSize) {
        const excess = pool.length - this.maxPoolSize;
        pool.splice(0, excess);
      }
    }
  }

  getMetrics(): Record<number, { pooled: number; inUse: number }> {
    const metrics: Record<number, { pooled: number; inUse: number }> = {};

    for (const [size, pool] of this.pools) {
      const inUseSet = this.inUse.get(size) || new Set();
      metrics[size] = {
        pooled: pool.length,
        inUse: inUseSet.size
      };
    }

    return metrics;
  }

  destroy(): void {
    this.pools.clear();
    this.inUse.clear();
  }
}

class GarbageCollectionOptimizer {
  private gcObserver?: PerformanceObserver;
  private gcMetrics: MemoryMetrics = {
    heapUsed: 0,
    heapTotal: 0,
    external: 0,
    arrayBuffers: 0,
    gcCount: 0,
    gcDuration: 0
  };

  startMonitoring(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      this.gcObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure' && entry.name.includes('gc')) {
            this.gcMetrics.gcCount++;
            this.gcMetrics.gcDuration += entry.duration;
          }
        }
      });

      try {
        this.gcObserver.observe({ entryTypes: ['measure'] });
      } catch (error) {
        console.warn('GC monitoring not available:', error);
      }
    }

    // Monitor memory usage
    this.updateMemoryMetrics();
    setInterval(() => this.updateMemoryMetrics(), 5000);
  }

  private updateMemoryMetrics(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.gcMetrics.heapUsed = memory.usedJSHeapSize;
      this.gcMetrics.heapTotal = memory.totalJSHeapSize;
      this.gcMetrics.external = memory.usedJSHeapSize; // Approximation
    }
  }

  forceGarbageCollection(): void {
    // Trigger garbage collection if available
    if ('gc' in global && typeof (global as any).gc === 'function') {
      (global as any).gc();
    } else {
      // Fallback: create pressure to trigger GC
      this.createGCPressure();
    }
  }

  private createGCPressure(): void {
    // Create temporary objects to trigger GC
    const tempArrays: any[] = [];
    for (let i = 0; i < 1000; i++) {
      tempArrays.push(new Array(1000).fill(0));
    }
    // Arrays will be collected when function exits
  }

  stopMonitoring(): void {
    if (this.gcObserver) {
      this.gcObserver.disconnect();
    }
  }

  getMetrics(): MemoryMetrics {
    return { ...this.gcMetrics };
  }
}

class ResourceTracker {
  private resources: Map<string, WeakRef<any>> = new Map();
  private cleanupCallbacks: Map<string, () => void> = new Map();
  private cleanupInterval?: NodeJS.Timeout;

  constructor() {
    this.startCleanupInterval();
  }

  track<T extends object>(id: string, resource: T, cleanup?: () => void): void {
    this.resources.set(id, new WeakRef(resource));
    if (cleanup) {
      this.cleanupCallbacks.set(id, cleanup);
    }
  }

  untrack(id: string): void {
    const cleanup = this.cleanupCallbacks.get(id);
    if (cleanup) {
      cleanup();
      this.cleanupCallbacks.delete(id);
    }
    this.resources.delete(id);
  }

  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupDeadReferences();
    }, 10000); // Check every 10 seconds
  }

  private cleanupDeadReferences(): void {
    for (const [id, weakRef] of this.resources) {
      if (weakRef.deref() === undefined) {
        // Resource was garbage collected
        const cleanup = this.cleanupCallbacks.get(id);
        if (cleanup) {
          cleanup();
          this.cleanupCallbacks.delete(id);
        }
        this.resources.delete(id);
      }
    }
  }

  getTrackedResourceCount(): number {
    return this.resources.size;
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Run all cleanup callbacks
    for (const cleanup of this.cleanupCallbacks.values()) {
      cleanup();
    }

    this.resources.clear();
    this.cleanupCallbacks.clear();
  }
}

export class MemoryOptimizer {
  private audioBufferPool?: AudioBufferPool;
  private float32ArrayPool: Float32ArrayPool;
  private gcOptimizer: GarbageCollectionOptimizer;
  private resourceTracker: ResourceTracker;
  private memoryTarget: number = 150 * 1024 * 1024; // 150MB in bytes

  constructor() {
    this.float32ArrayPool = new Float32ArrayPool();
    this.gcOptimizer = new GarbageCollectionOptimizer();
    this.resourceTracker = new ResourceTracker();

    this.initializeOptimizations();
  }

  private initializeOptimizations(): void {
    this.gcOptimizer.startMonitoring();
  }

  // Audio buffer pool methods
  initializeAudioBufferPool(audioContext: AudioContext, config?: Partial<BufferPoolConfig>): void {
    const poolConfig: BufferPoolConfig = {
      maxSize: 20,
      initialCount: 5,
      bufferSize: 4096,
      cleanupInterval: 30000, // 30 seconds
      ...config
    };

    this.audioBufferPool = new AudioBufferPool(audioContext, poolConfig);
  }

  acquireAudioBuffer(): AudioBuffer | null {
    return this.audioBufferPool?.acquire() || null;
  }

  releaseAudioBuffer(buffer: AudioBuffer): void {
    this.audioBufferPool?.release(buffer);
  }

  // Float32Array pool methods
  acquireFloat32Array(size: number): Float32Array {
    return this.float32ArrayPool.acquire(size);
  }

  releaseFloat32Array(array: Float32Array): void {
    this.float32ArrayPool.release(array);
  }

  // Resource tracking methods
  trackResource<T extends object>(id: string, resource: T, cleanup?: () => void): void {
    this.resourceTracker.track(id, resource, cleanup);
  }

  untrackResource(id: string): void {
    this.resourceTracker.untrack(id);
  }

  // Memory management methods
  forceGarbageCollection(): void {
    this.gcOptimizer.forceGarbageCollection();
  }

  optimizeMemoryUsage(): void {
    // Clean up pools
    this.float32ArrayPool.cleanup();
    this.audioBufferPool?.cleanup();

    // Force garbage collection if memory usage is high
    const metrics = this.getMemoryMetrics();
    if (metrics.heapUsed > this.memoryTarget * 0.8) {
      this.forceGarbageCollection();
    }
  }

  // Memory monitoring
  getMemoryMetrics(): MemoryMetrics {
    return this.gcOptimizer.getMetrics();
  }

  getBufferPoolMetrics(): {
    audioBuffers?: ReturnType<AudioBufferPool['getMetrics']>;
    float32Arrays: ReturnType<Float32ArrayPool['getMetrics']>;
    trackedResources: number;
  } {
    return {
      audioBuffers: this.audioBufferPool?.getMetrics(),
      float32Arrays: this.float32ArrayPool.getMetrics(),
      trackedResources: this.resourceTracker.getTrackedResourceCount()
    };
  }

  checkMemoryHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    usage: number;
    target: number;
    recommendations: string[];
  } {
    const metrics = this.getMemoryMetrics();
    const usage = metrics.heapUsed;
    const usageRatio = usage / this.memoryTarget;

    let status: 'healthy' | 'warning' | 'critical';
    const recommendations: string[] = [];

    if (usageRatio < 0.7) {
      status = 'healthy';
    } else if (usageRatio < 0.9) {
      status = 'warning';
      recommendations.push('Consider releasing unused resources');
      recommendations.push('Run memory optimization');
    } else {
      status = 'critical';
      recommendations.push('Force garbage collection immediately');
      recommendations.push('Release all non-critical resources');
      recommendations.push('Reduce buffer pool sizes');
    }

    return {
      status,
      usage: Math.round(usage / 1024 / 1024), // MB
      target: Math.round(this.memoryTarget / 1024 / 1024), // MB
      recommendations
    };
  }

  // Configuration
  setMemoryTarget(targetMB: number): void {
    this.memoryTarget = targetMB * 1024 * 1024;
  }

  // Cleanup
  destroy(): void {
    this.gcOptimizer.stopMonitoring();
    this.audioBufferPool?.destroy();
    this.float32ArrayPool.destroy();
    this.resourceTracker.destroy();
  }
}

// Singleton instance
export const memoryOptimizer = new MemoryOptimizer();