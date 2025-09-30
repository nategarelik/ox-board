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
  memoryPressure: "low" | "moderate" | "high" | "critical";
  jsMemoryUsage: number;
  resourceCount: number;
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
      const buffer = this.audioContext.createBuffer(
        2,
        this.config.bufferSize,
        44100,
      );
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
      const buffer = this.audioContext.createBuffer(
        2,
        this.config.bufferSize,
        44100,
      );
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

  public cleanup(): void {
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
      memoryUsage,
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
        inUse: inUseSet.size,
      };
    }

    return metrics;
  }

  destroy(): void {
    this.pools.clear();
    this.inUse.clear();
  }
}

class MemoryPressureMonitor {
  private memoryObserver?: PerformanceObserver;
  private isMonitoring: boolean = false;
  private memoryCallbacks: Array<
    (pressure: "low" | "moderate" | "high" | "critical") => void
  > = [];

  startMonitoring(): void {
    if (this.isMonitoring || typeof PerformanceObserver === "undefined") return;

    this.isMonitoring = true;

    try {
      this.memoryObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "memory") {
            const memoryEntry = entry as any;
            const usageRatio =
              memoryEntry.usedJSHeapSize / memoryEntry.totalJSHeapSize;

            let pressure: "low" | "moderate" | "high" | "critical";
            if (usageRatio < 0.7) pressure = "low";
            else if (usageRatio < 0.85) pressure = "moderate";
            else if (usageRatio < 0.95) pressure = "high";
            else pressure = "critical";

            this.notifyCallbacks(pressure);
          }
        }
      });

      this.memoryObserver.observe({ entryTypes: ["memory"] });
    } catch (error) {
      console.warn("Memory pressure monitoring not available:", error);
      // Fallback to periodic checking
      this.startPeriodicMonitoring();
    }
  }

  private startPeriodicMonitoring(): void {
    setInterval(() => {
      if ("memory" in performance) {
        const memory = (performance as any).memory;
        const usageRatio = memory.usedJSHeapSize / memory.totalJSHeapSize;

        let pressure: "low" | "moderate" | "high" | "critical";
        if (usageRatio < 0.7) pressure = "low";
        else if (usageRatio < 0.85) pressure = "moderate";
        else if (usageRatio < 0.95) pressure = "high";
        else pressure = "critical";

        this.notifyCallbacks(pressure);
      }
    }, 5000);
  }

  private notifyCallbacks(
    pressure: "low" | "moderate" | "high" | "critical",
  ): void {
    this.memoryCallbacks.forEach((callback) => callback(pressure));
  }

  onMemoryPressure(
    callback: (pressure: "low" | "moderate" | "high" | "critical") => void,
  ): void {
    this.memoryCallbacks.push(callback);
  }

  removeCallback(
    callback: (pressure: "low" | "moderate" | "high" | "critical") => void,
  ): void {
    this.memoryCallbacks = this.memoryCallbacks.filter((cb) => cb !== callback);
  }

  stopMonitoring(): void {
    this.isMonitoring = false;

    if (this.memoryObserver) {
      this.memoryObserver.disconnect();
      this.memoryObserver = undefined;
    }

    this.memoryCallbacks = [];
  }

  getCurrentPressure(): "low" | "moderate" | "high" | "critical" {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      const usageRatio = memory.usedJSHeapSize / memory.totalJSHeapSize;

      if (usageRatio < 0.7) return "low";
      else if (usageRatio < 0.85) return "moderate";
      else if (usageRatio < 0.95) return "high";
      else return "critical";
    }

    return "low";
  }
}

class ResourcePool<T extends object> {
  private available: T[] = [];
  private inUse: Set<T> = new Set();
  private factory: () => T;
  private reset: (resource: T) => void;
  private maxSize: number;
  private gcHints: WeakRef<T>[] = [];

  constructor(
    factory: () => T,
    reset: (resource: T) => void,
    maxSize: number = 50,
  ) {
    this.factory = factory;
    this.reset = reset;
    this.maxSize = maxSize;
  }

  acquire(): T | null {
    // Try to get from available pool first
    if (this.available.length > 0) {
      const resource = this.available.pop()!;
      this.inUse.add(resource);

      // Add GC hint
      this.gcHints.push(new WeakRef(resource));
      return resource;
    }

    // Create new resource if under limit
    if (this.getTotalCount() < this.maxSize) {
      const resource = this.factory();
      this.inUse.add(resource);
      this.gcHints.push(new WeakRef(resource));
      return resource;
    }

    return null;
  }

  release(resource: T): void {
    if (this.inUse.has(resource)) {
      this.inUse.delete(resource);
      this.reset(resource);
      this.available.push(resource);

      // Clean up GC hints for old resources
      this.cleanupGCHints();
    }
  }

  private cleanupGCHints(): void {
    this.gcHints = this.gcHints.filter((hint) => hint.deref() !== undefined);
  }

  getTotalCount(): number {
    return this.available.length + this.inUse.size;
  }

  getMetrics(): { available: number; inUse: number; total: number } {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.getTotalCount(),
    };
  }

  cleanup(): void {
    // Remove excess resources
    const excess = this.available.length - Math.floor(this.maxSize * 0.8);
    if (excess > 0) {
      this.available.splice(0, excess);
    }
  }

  destroy(): void {
    this.available = [];
    this.inUse.clear();
    this.gcHints = [];
  }
}

class GarbageCollectionOptimizer {
  private gcObserver?: PerformanceObserver;
  private memoryMonitor!: MemoryPressureMonitor;
  private gcMetrics: MemoryMetrics = {
    heapUsed: 0,
    heapTotal: 0,
    external: 0,
    arrayBuffers: 0,
    gcCount: 0,
    gcDuration: 0,
    memoryPressure: "low",
    jsMemoryUsage: 0,
    resourceCount: 0,
  };

  startMonitoring(): void {
    if (typeof PerformanceObserver !== "undefined") {
      this.gcObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "measure" && entry.name.includes("gc")) {
            this.gcMetrics.gcCount++;
            this.gcMetrics.gcDuration += entry.duration;
          }
        }
      });

      try {
        this.gcObserver.observe({ entryTypes: ["measure"] });
      } catch (error) {
        console.warn("GC monitoring not available:", error);
      }
    }

    // Monitor memory usage
    this.updateMemoryMetrics();
    setInterval(() => this.updateMemoryMetrics(), 5000);
  }

  private updateMemoryMetrics(): void {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      this.gcMetrics.heapUsed = memory.usedJSHeapSize;
      this.gcMetrics.heapTotal = memory.totalJSHeapSize;
      this.gcMetrics.external = memory.usedJSHeapSize; // Approximation
    }
  }

  forceGarbageCollection(): void {
    // Trigger garbage collection if available
    if ("gc" in global && typeof (global as any).gc === "function") {
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

  cleanupDeadReferences(): void {
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
  private memoryMonitor: MemoryPressureMonitor;
  private memoryTarget: number = 150 * 1024 * 1024; // 150MB in bytes

  constructor() {
    this.float32ArrayPool = new Float32ArrayPool();
    this.gcOptimizer = new GarbageCollectionOptimizer();
    this.resourceTracker = new ResourceTracker();
    this.memoryMonitor = new MemoryPressureMonitor();

    this.initializeOptimizations();
  }

  private initializeOptimizations(): void {
    this.gcOptimizer.startMonitoring();
    this.memoryMonitor.startMonitoring();

    // Set up automatic cleanup on memory pressure
    this.memoryMonitor.onMemoryPressure((pressure) => {
      this.handleMemoryPressure(pressure);
    });
  }

  private handleMemoryPressure(
    pressure: "low" | "moderate" | "high" | "critical",
  ): void {
    const metrics = this.getMemoryMetrics();
    metrics.memoryPressure = pressure;

    switch (pressure) {
      case "high":
        console.warn("High memory pressure detected - optimizing resources");
        this.optimizeMemoryUsage();
        break;
      case "critical":
        console.warn("Critical memory pressure detected - aggressive cleanup");
        this.aggressiveCleanup();
        break;
    }
  }

  private aggressiveCleanup(): void {
    // Force immediate garbage collection
    this.forceGarbageCollection();

    // Clear all pools aggressively
    this.float32ArrayPool.cleanup();
    this.audioBufferPool?.cleanup();

    // Reduce pool sizes temporarily
    const originalTarget = this.memoryTarget;
    this.memoryTarget = Math.max(100 * 1024 * 1024, this.memoryTarget * 0.7); // Reduce to 70% or 100MB

    // Schedule restoration after cleanup
    setTimeout(() => {
      this.memoryTarget = originalTarget;
    }, 30000);
  }

  // Audio buffer pool methods
  initializeAudioBufferPool(
    audioContext: AudioContext,
    config?: Partial<BufferPoolConfig>,
  ): void {
    const poolConfig: BufferPoolConfig = {
      maxSize: 20,
      initialCount: 5,
      bufferSize: 4096,
      cleanupInterval: 30000, // 30 seconds
      ...config,
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
  trackResource<T extends object>(
    id: string,
    resource: T,
    cleanup?: () => void,
  ): void {
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

  // Memory pressure monitoring
  getCurrentMemoryPressure(): "low" | "moderate" | "high" | "critical" {
    return this.memoryMonitor.getCurrentPressure();
  }

  onMemoryPressure(
    callback: (pressure: "low" | "moderate" | "high" | "critical") => void,
  ): void {
    this.memoryMonitor.onMemoryPressure(callback);
  }

  // Enhanced resource pooling
  createResourcePool<T extends object>(
    factory: () => T,
    reset: (resource: T) => void,
    maxSize: number = 50,
  ): ResourcePool<T> {
    return new ResourcePool(factory, reset, maxSize);
  }

  // Memory monitoring
  getMemoryMetrics(): MemoryMetrics {
    const baseMetrics = this.gcOptimizer.getMetrics();
    const pressure = this.getCurrentMemoryPressure();
    const jsMemory = this.getJSMemoryUsage();

    return {
      ...baseMetrics,
      memoryPressure: pressure,
      jsMemoryUsage: jsMemory,
      resourceCount: this.resourceTracker.getTrackedResourceCount(),
    };
  }

  private getJSMemoryUsage(): number {
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024); // Convert to MB
    }
    return 0;
  }

  getBufferPoolMetrics(): {
    audioBuffers?: ReturnType<AudioBufferPool["getMetrics"]>;
    float32Arrays: ReturnType<Float32ArrayPool["getMetrics"]>;
    trackedResources: number;
  } {
    return {
      audioBuffers: this.audioBufferPool?.getMetrics(),
      float32Arrays: this.float32ArrayPool.getMetrics(),
      trackedResources: this.resourceTracker.getTrackedResourceCount(),
    };
  }

  checkMemoryHealth(): {
    status: "healthy" | "warning" | "critical";
    usage: number;
    target: number;
    recommendations: string[];
  } {
    const metrics = this.getMemoryMetrics();
    const usage = metrics.heapUsed;
    const usageRatio = usage / this.memoryTarget;

    let status: "healthy" | "warning" | "critical";
    const recommendations: string[] = [];

    if (usageRatio < 0.7) {
      status = "healthy";
    } else if (usageRatio < 0.9) {
      status = "warning";
      recommendations.push("Consider releasing unused resources");
      recommendations.push("Run memory optimization");
    } else {
      status = "critical";
      recommendations.push("Force garbage collection immediately");
      recommendations.push("Release all non-critical resources");
      recommendations.push("Reduce buffer pool sizes");
    }

    return {
      status,
      usage: Math.round(usage / 1024 / 1024), // MB
      target: Math.round(this.memoryTarget / 1024 / 1024), // MB
      recommendations,
    };
  }

  // Configuration
  setMemoryTarget(targetMB: number): void {
    this.memoryTarget = targetMB * 1024 * 1024;
  }

  // Cleanup
  destroy(): void {
    this.memoryMonitor.stopMonitoring();
    this.gcOptimizer.stopMonitoring();
    this.audioBufferPool?.destroy();
    this.float32ArrayPool.destroy();
    this.resourceTracker.destroy();
  }
}

/**
 * Enhanced LRU Cache for Stem Data and Resources
 */
export function createLRUCache<T>(maxSize: number = 100): {
  get: (key: string) => T | null;
  set: (key: string, value: T) => void;
  evict: (percentage?: number) => number;
  getStats: () => any;
  clear: () => void;
  resize: (newSize: number) => void;
} {
  const cache = new Map<string, T>();
  const accessOrder: string[] = [];
  let hitCount = 0;
  let missCount = 0;

  return {
    get: (key: string): T | null => {
      if (cache.has(key)) {
        // Move to end (most recently used)
        const index = accessOrder.indexOf(key);
        if (index > -1) {
          accessOrder.splice(index, 1);
        }
        accessOrder.push(key);
        hitCount++;
        return cache.get(key)!;
      }
      missCount++;
      return null;
    },

    set: (key: string, value: T): void => {
      if (cache.has(key)) {
        // Update existing
        cache.set(key, value);
        const index = accessOrder.indexOf(key);
        if (index > -1) {
          accessOrder.splice(index, 1);
        }
        accessOrder.push(key);
      } else {
        // Add new with LRU eviction
        if (cache.size >= maxSize) {
          const oldestKey = accessOrder.shift();
          if (oldestKey) {
            cache.delete(oldestKey);
          }
        }
        cache.set(key, value);
        accessOrder.push(key);
      }
    },

    evict: (percentage: number = 0.1): number => {
      const toEvict = Math.floor(cache.size * percentage);
      let evicted = 0;

      for (let i = 0; i < toEvict && accessOrder.length > 0; i++) {
        const oldestKey = accessOrder.shift();
        if (oldestKey && cache.has(oldestKey)) {
          cache.delete(oldestKey);
          evicted++;
        }
      }

      return evicted;
    },

    getStats: () => {
      const total = hitCount + missCount;
      return {
        size: cache.size,
        hitRate: total > 0 ? hitCount / total : 0,
        hitCount,
        missCount,
        maxSize,
      };
    },

    clear: () => {
      cache.clear();
      accessOrder.length = 0;
      hitCount = 0;
      missCount = 0;
    },

    resize: (newSize: number) => {
      maxSize = newSize;
      while (cache.size > maxSize) {
        const oldestKey = accessOrder.shift();
        if (oldestKey) {
          cache.delete(oldestKey);
        }
      }
    },
  };
}

// Singleton instance
export const memoryOptimizer = new MemoryOptimizer();
