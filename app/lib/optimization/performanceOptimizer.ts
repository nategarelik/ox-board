/**
 * Performance Optimizer for OX Board AI Enhancement
 *
 * Comprehensive optimization system that profiles critical paths,
 * implements caching strategies, and monitors performance metrics
 * to ensure production-ready performance targets are met.
 */

export interface PerformanceMetrics {
  fps: number;
  memory: number;
  cpu: number;
  latency: {
    gesture: number;
    audio: number;
    ui: number;
  };
  network: {
    requests: number;
    latency: number;
    bandwidth: number;
  };
}

export interface PerformanceTargets {
  initialLoad: number; // <3 seconds
  gestureLatency: number; // <50ms
  audioLatency: number; // <20ms
  fps: number; // 60 FPS
  memoryUsage: number; // <150MB
}

export interface OptimizationConfig {
  enableLazyLoading: boolean;
  enableCaching: boolean;
  enableWorkerPooling: boolean;
  enableVirtualScrolling: boolean;
  enableFrameSkipping: boolean;
  cacheSize: number;
  workerPoolSize: number;
  frameSkipThreshold: number;
}

class PerformanceProfiler {
  private metrics: PerformanceMetrics;
  private startTimes: Map<string, number> = new Map();
  private isMonitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    this.metrics = {
      fps: 0,
      memory: 0,
      cpu: 0,
      latency: {
        gesture: 0,
        audio: 0,
        ui: 0
      },
      network: {
        requests: 0,
        latency: 0,
        bandwidth: 0
      }
    };
  }

  startProfiling(operation: string): void {
    this.startTimes.set(operation, performance.now());
  }

  endProfiling(operation: string): number {
    const startTime = this.startTimes.get(operation);
    if (!startTime) return 0;

    const duration = performance.now() - startTime;
    this.startTimes.delete(operation);
    return duration;
  }

  measureFPS(): void {
    let frames = 0;
    let lastTime = performance.now();

    const measureFrame = () => {
      frames++;
      const currentTime = performance.now();

      if (currentTime - lastTime >= 1000) {
        this.metrics.fps = Math.round((frames * 1000) / (currentTime - lastTime));
        frames = 0;
        lastTime = currentTime;
      }

      if (this.isMonitoring) {
        requestAnimationFrame(measureFrame);
      }
    };

    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(measureFrame);
    }
  }

  measureMemory(): void {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      this.metrics.memory = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    }
  }

  startMonitoring(): void {
    this.isMonitoring = true;
    this.measureFPS();

    this.monitoringInterval = setInterval(() => {
      this.measureMemory();
      this.measureNetworkMetrics();
    }, 1000);
  }

  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
  }

  private measureNetworkMetrics(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.network.bandwidth = connection.downlink || 0;
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  updateLatency(type: keyof PerformanceMetrics['latency'], value: number): void {
    this.metrics.latency[type] = value;
  }
}

class CacheManager {
  private cache: Map<string, any> = new Map();
  private cacheSize: number;
  private accessOrder: string[] = [];

  constructor(maxSize: number = 100) {
    this.cacheSize = maxSize;
  }

  get<T>(key: string): T | null {
    if (this.cache.has(key)) {
      // Move to end (most recently used)
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
      return this.cache.get(key);
    }
    return null;
  }

  set<T>(key: string, value: T): void {
    if (this.cache.has(key)) {
      // Update existing
      this.cache.set(key, value);
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
    } else {
      // Add new
      if (this.cache.size >= this.cacheSize) {
        const oldestKey = this.accessOrder.shift();
        if (oldestKey) {
          this.cache.delete(oldestKey);
        }
      }
      this.cache.set(key, value);
      this.accessOrder.push(key);
    }
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
  }

  size(): number {
    return this.cache.size;
  }
}

class WorkerPool {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: Array<{
    data: any;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor(workerScript: string, poolSize: number = 4) {
    this.initializeWorkers(workerScript, poolSize);
  }

  private initializeWorkers(workerScript: string, poolSize: number): void {
    for (let i = 0; i < poolSize; i++) {
      try {
        const worker = new Worker(workerScript);
        this.workers.push(worker);
        this.availableWorkers.push(worker);
      } catch (error) {
        console.warn('Failed to create worker:', error);
      }
    }
  }

  async execute<T>(data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const task = { data, resolve, reject };

      if (this.availableWorkers.length > 0) {
        this.executeTask(task);
      } else {
        this.taskQueue.push(task);
      }
    });
  }

  private executeTask(task: any): void {
    const worker = this.availableWorkers.pop();
    if (!worker) return;

    const timeout = setTimeout(() => {
      task.reject(new Error('Worker timeout'));
      this.returnWorker(worker);
    }, 30000); // 30 second timeout

    worker.onmessage = (event) => {
      clearTimeout(timeout);
      task.resolve(event.data);
      this.returnWorker(worker);
    };

    worker.onerror = (error) => {
      clearTimeout(timeout);
      task.reject(error);
      this.returnWorker(worker);
    };

    worker.postMessage(task.data);
  }

  private returnWorker(worker: Worker): void {
    this.availableWorkers.push(worker);

    if (this.taskQueue.length > 0) {
      const nextTask = this.taskQueue.shift();
      if (nextTask) {
        this.executeTask(nextTask);
      }
    }
  }

  terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
  }
}

class FrameScheduler {
  private frameCallbacks: Array<() => void> = [];
  private isScheduled: boolean = false;
  private skipFrames: boolean = false;
  private frameSkipThreshold: number = 16.67; // 60fps threshold

  scheduleFrame(callback: () => void): void {
    this.frameCallbacks.push(callback);

    if (!this.isScheduled) {
      this.isScheduled = true;
      requestAnimationFrame(() => this.processFrame());
    }
  }

  private processFrame(): void {
    const startTime = performance.now();

    // Process callbacks
    const callbacks = [...this.frameCallbacks];
    this.frameCallbacks = [];

    for (const callback of callbacks) {
      if (performance.now() - startTime > this.frameSkipThreshold && this.skipFrames) {
        // Frame taking too long, skip remaining callbacks
        this.frameCallbacks.unshift(...callbacks.slice(callbacks.indexOf(callback)));
        break;
      }
      callback();
    }

    this.isScheduled = false;

    // If there are more callbacks, schedule next frame
    if (this.frameCallbacks.length > 0) {
      this.isScheduled = true;
      requestAnimationFrame(() => this.processFrame());
    }
  }

  enableFrameSkipping(enabled: boolean, threshold: number = 16.67): void {
    this.skipFrames = enabled;
    this.frameSkipThreshold = threshold;
  }
}

export class PerformanceOptimizer {
  private profiler: PerformanceProfiler;
  private cacheManager: CacheManager;
  private workerPools: Map<string, WorkerPool> = new Map();
  private frameScheduler: FrameScheduler;
  private config: OptimizationConfig;
  private targets: PerformanceTargets;

  constructor(config?: Partial<OptimizationConfig>) {
    this.config = {
      enableLazyLoading: true,
      enableCaching: true,
      enableWorkerPooling: true,
      enableVirtualScrolling: true,
      enableFrameSkipping: true,
      cacheSize: 100,
      workerPoolSize: 4,
      frameSkipThreshold: 16.67,
      ...config
    };

    this.targets = {
      initialLoad: 3000,
      gestureLatency: 50,
      audioLatency: 20,
      fps: 60,
      memoryUsage: 150
    };

    this.profiler = new PerformanceProfiler();
    this.cacheManager = new CacheManager(this.config.cacheSize);
    this.frameScheduler = new FrameScheduler();

    this.frameScheduler.enableFrameSkipping(
      this.config.enableFrameSkipping,
      this.config.frameSkipThreshold
    );
  }

  // Profiling methods
  startProfiling(operation: string): void {
    this.profiler.startProfiling(operation);
  }

  endProfiling(operation: string): number {
    return this.profiler.endProfiling(operation);
  }

  startMonitoring(): void {
    this.profiler.startMonitoring();
  }

  stopMonitoring(): void {
    this.profiler.stopMonitoring();
  }

  getMetrics(): PerformanceMetrics {
    return this.profiler.getMetrics();
  }

  updateLatency(type: keyof PerformanceMetrics['latency'], value: number): void {
    this.profiler.updateLatency(type, value);
  }

  // Caching methods
  getCached<T>(key: string): T | null {
    if (!this.config.enableCaching) return null;
    return this.cacheManager.get<T>(key);
  }

  setCached<T>(key: string, value: T): void {
    if (!this.config.enableCaching) return;
    this.cacheManager.set(key, value);
  }

  clearCache(): void {
    this.cacheManager.clear();
  }

  // Worker pool methods
  createWorkerPool(name: string, workerScript: string): void {
    if (!this.config.enableWorkerPooling) return;

    const pool = new WorkerPool(workerScript, this.config.workerPoolSize);
    this.workerPools.set(name, pool);
  }

  async executeInWorker<T>(poolName: string, data: any): Promise<T> {
    const pool = this.workerPools.get(poolName);
    if (!pool) {
      throw new Error(`Worker pool '${poolName}' not found`);
    }
    return pool.execute<T>(data);
  }

  // Frame scheduling methods
  scheduleFrame(callback: () => void): void {
    this.frameScheduler.scheduleFrame(callback);
  }

  // Optimization methods
  optimizeStemSeparation(audioBuffer: AudioBuffer): Promise<any> {
    const cacheKey = `stem_${audioBuffer.length}_${audioBuffer.sampleRate}`;
    const cached = this.getCached(cacheKey);

    if (cached) {
      return Promise.resolve(cached);
    }

    this.startProfiling('stem_separation');

    return this.executeInWorker('stemSeparation', {
      buffer: audioBuffer.getChannelData(0),
      sampleRate: audioBuffer.sampleRate
    }).then(result => {
      this.endProfiling('stem_separation');
      this.setCached(cacheKey, result);
      return result;
    });
  }

  optimizeBPMDetection(audioBuffer: AudioBuffer): Promise<number> {
    const cacheKey = `bpm_${audioBuffer.length}_${audioBuffer.sampleRate}`;
    const cached = this.getCached<number>(cacheKey);

    if (cached) {
      return Promise.resolve(cached);
    }

    this.startProfiling('bpm_detection');

    return this.executeInWorker('bpmDetection', {
      buffer: audioBuffer.getChannelData(0),
      sampleRate: audioBuffer.sampleRate
    }).then(result => {
      const bpm = result as number;
      this.endProfiling('bpm_detection');
      this.setCached(cacheKey, bpm);
      return bpm;
    });
  }

  optimizeGestureProcessing(gestureData: any): any {
    const startTime = performance.now();

    // Process gesture with frame skipping if needed
    const result = this.processGestureOptimized(gestureData);

    const latency = performance.now() - startTime;
    this.updateLatency('gesture', latency);

    return result;
  }

  private processGestureOptimized(gestureData: any): any {
    // Simplified gesture processing for performance
    // Skip complex calculations if frame rate is dropping
    const metrics = this.getMetrics();

    if (metrics.fps < 30) {
      // Reduced precision mode
      return this.processGestureReduced(gestureData);
    }

    return this.processGestureFull(gestureData);
  }

  private processGestureReduced(gestureData: any): any {
    // Reduced precision gesture processing
    return {
      action: gestureData.action || 'none',
      confidence: Math.round((gestureData.confidence || 0) * 10) / 10,
      simplified: true
    };
  }

  private processGestureFull(gestureData: any): any {
    // Full precision gesture processing
    return {
      action: gestureData.action || 'none',
      confidence: gestureData.confidence || 0,
      landmarks: gestureData.landmarks || [],
      timestamp: performance.now()
    };
  }

  // Performance validation
  validatePerformance(): {
    passed: boolean;
    failures: string[];
    metrics: PerformanceMetrics;
  } {
    const metrics = this.getMetrics();
    const failures: string[] = [];

    if (metrics.fps < this.targets.fps) {
      failures.push(`FPS too low: ${metrics.fps} < ${this.targets.fps}`);
    }

    if (metrics.memory > this.targets.memoryUsage) {
      failures.push(`Memory usage too high: ${metrics.memory}MB > ${this.targets.memoryUsage}MB`);
    }

    if (metrics.latency.gesture > this.targets.gestureLatency) {
      failures.push(`Gesture latency too high: ${metrics.latency.gesture}ms > ${this.targets.gestureLatency}ms`);
    }

    if (metrics.latency.audio > this.targets.audioLatency) {
      failures.push(`Audio latency too high: ${metrics.latency.audio}ms > ${this.targets.audioLatency}ms`);
    }

    return {
      passed: failures.length === 0,
      failures,
      metrics
    };
  }

  // Cleanup
  cleanup(): void {
    this.stopMonitoring();
    this.clearCache();

    for (const pool of this.workerPools.values()) {
      pool.terminate();
    }
    this.workerPools.clear();
  }

  // Configuration
  updateConfig(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config };

    this.frameScheduler.enableFrameSkipping(
      this.config.enableFrameSkipping,
      this.config.frameSkipThreshold
    );
  }

  getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  getTargets(): PerformanceTargets {
    return { ...this.targets };
  }
}

// Singleton instance
export const performanceOptimizer = new PerformanceOptimizer();