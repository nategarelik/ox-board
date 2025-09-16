'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { StemType } from '../lib/audio/stemPlayer';
import type { AudioAnalysisRequest, AudioAnalysisResult } from '../lib/workers/audioAnalyzer.worker';

interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  memoryUsage: number;
  activeWorkers: number;
  renderTime: number;
  lastUpdate: number;
}

interface WorkerPool {
  workers: Worker[];
  activeRequests: Map<string, { resolve: Function; reject: Function; timestamp: number }>;
  currentWorkerIndex: number;
  maxWorkers: number;
}

interface VirtualScrollConfig {
  itemHeight: number;
  bufferSize: number;
  containerHeight: number;
  totalItems: number;
}

interface VirtualScrollState {
  startIndex: number;
  endIndex: number;
  visibleItems: number;
  scrollTop: number;
  totalHeight: number;
}

const useStemPerformance = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    frameTime: 16.67,
    memoryUsage: 0,
    activeWorkers: 0,
    renderTime: 0,
    lastUpdate: Date.now()
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const workerPoolRef = useRef<WorkerPool | null>(null);
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameTimesRef = useRef<number[]>([]);

  // Initialize worker pool
  const initializeWorkerPool = useCallback(() => {
    const maxWorkers = Math.min(4, navigator.hardwareConcurrency || 2);
    const workers: Worker[] = [];

    for (let i = 0; i < maxWorkers; i++) {
      try {
        const worker = new Worker(
          new URL('../lib/workers/audioAnalyzer.worker.ts', import.meta.url),
          { type: 'module' }
        );

        worker.onmessage = (event) => {
          const result = event.data as AudioAnalysisResult;
          const request = workerPoolRef.current?.activeRequests.get(result.id);

          if (request) {
            request.resolve(result);
            workerPoolRef.current?.activeRequests.delete(result.id);
            updateWorkerMetrics();
          }
        };

        worker.onerror = (error) => {
          console.error('Worker error:', error);
          // Handle worker errors gracefully
        };

        workers.push(worker);
      } catch (error) {
        console.warn('Web Worker not available, falling back to main thread processing');
        break;
      }
    }

    workerPoolRef.current = {
      workers,
      activeRequests: new Map(),
      currentWorkerIndex: 0,
      maxWorkers: workers.length
    };

    return workers.length > 0;
  }, []);

  // Performance monitoring
  const startPerformanceMonitoring = useCallback(() => {
    // Frame rate monitoring
    const trackFrameRate = (timestamp: number) => {
      if (lastFrameTimeRef.current) {
        const frameTime = timestamp - lastFrameTimeRef.current;
        frameTimesRef.current.push(frameTime);

        // Keep only last 60 frames
        if (frameTimesRef.current.length > 60) {
          frameTimesRef.current.shift();
        }

        // Calculate average frame time and FPS
        const avgFrameTime = frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const fps = Math.round(1000 / avgFrameTime);

        setMetrics(prev => ({
          ...prev,
          fps,
          frameTime: avgFrameTime,
          lastUpdate: timestamp
        }));
      }

      lastFrameTimeRef.current = timestamp;
      animationFrameRef.current = requestAnimationFrame(trackFrameRate);
    };

    animationFrameRef.current = requestAnimationFrame(trackFrameRate);

    // Memory monitoring
    const trackMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 // MB
        }));
      }
    };

    const memoryInterval = setInterval(trackMemoryUsage, 1000);

    // Performance Observer for render timing
    if (typeof PerformanceObserver !== 'undefined') {
      performanceObserverRef.current = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const renderEntries = entries.filter(entry => entry.name.includes('render'));

        if (renderEntries.length > 0) {
          const avgRenderTime = renderEntries.reduce((sum, entry) => sum + entry.duration, 0) / renderEntries.length;
          setMetrics(prev => ({
            ...prev,
            renderTime: avgRenderTime
          }));
        }
      });

      performanceObserverRef.current.observe({ entryTypes: ['measure'] });
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      clearInterval(memoryInterval);
      if (performanceObserverRef.current) {
        performanceObserverRef.current.disconnect();
      }
    };
  }, []);

  // Worker management
  const updateWorkerMetrics = useCallback(() => {
    if (workerPoolRef.current) {
      setMetrics(prev => ({
        ...prev,
        activeWorkers: workerPoolRef.current!.activeRequests.size
      }));
    }
  }, []);

  const analyzeAudioData = useCallback(async (
    audioData: Float32Array,
    sampleRate: number,
    channelIndex: number,
    stemType: StemType | 'original',
    options?: any
  ): Promise<AudioAnalysisResult | null> => {
    if (!workerPoolRef.current || workerPoolRef.current.workers.length === 0) {
      // Fallback to main thread processing (simplified)
      console.warn('No workers available, skipping audio analysis');
      return null;
    }

    const requestId = `${channelIndex}-${stemType}-${Date.now()}`;
    const worker = workerPoolRef.current.workers[workerPoolRef.current.currentWorkerIndex];

    // Round-robin worker selection
    workerPoolRef.current.currentWorkerIndex =
      (workerPoolRef.current.currentWorkerIndex + 1) % workerPoolRef.current.workers.length;

    const request: AudioAnalysisRequest = {
      id: requestId,
      type: 'analyze',
      audioData,
      sampleRate,
      channelIndex,
      stemType,
      options
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        workerPoolRef.current?.activeRequests.delete(requestId);
        reject(new Error('Worker request timeout'));
      }, 5000);

      workerPoolRef.current!.activeRequests.set(requestId, {
        resolve: (result: AudioAnalysisResult) => {
          clearTimeout(timeout);
          resolve(result);
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: Date.now()
      });

      worker.postMessage(request);
      updateWorkerMetrics();
    });
  }, [updateWorkerMetrics]);

  // Performance optimization strategies
  const optimizePerformance = useCallback(() => {
    setIsOptimizing(true);

    // Adaptive quality based on performance
    const { fps, frameTime, memoryUsage } = metrics;

    let optimizations: string[] = [];

    if (fps < 30 || frameTime > 33) {
      optimizations.push('Reducing visual quality');
      // Implement quality reduction logic
    }

    if (memoryUsage > 100) { // MB
      optimizations.push('Cleaning up unused resources');
      // Implement garbage collection hints
      if ('gc' in window) {
        (window as any).gc();
      }
    }

    if (workerPoolRef.current && workerPoolRef.current.activeRequests.size > 10) {
      optimizations.push('Throttling worker requests');
      // Cancel old requests
      const now = Date.now();
      for (const [id, request] of workerPoolRef.current.activeRequests.entries()) {
        if (now - request.timestamp > 1000) {
          request.reject(new Error('Request cancelled due to performance optimization'));
          workerPoolRef.current.activeRequests.delete(id);
        }
      }
    }

    console.log('Performance optimizations applied:', optimizations);

    setTimeout(() => setIsOptimizing(false), 1000);
  }, [metrics]);

  // Virtual scrolling utilities
  const createVirtualScrollState = useCallback((config: VirtualScrollConfig): VirtualScrollState => {
    const { itemHeight, bufferSize, containerHeight, totalItems } = config;
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    const bufferedItems = visibleItems + bufferSize * 2;

    return {
      startIndex: 0,
      endIndex: Math.min(bufferedItems, totalItems),
      visibleItems,
      scrollTop: 0,
      totalHeight: totalItems * itemHeight
    };
  }, []);

  const updateVirtualScrollState = useCallback((
    config: VirtualScrollConfig,
    scrollTop: number
  ): VirtualScrollState => {
    const { itemHeight, bufferSize, containerHeight, totalItems } = config;
    const visibleItems = Math.ceil(containerHeight / itemHeight);

    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
    const endIndex = Math.min(totalItems, startIndex + visibleItems + bufferSize * 2);

    return {
      startIndex,
      endIndex,
      visibleItems,
      scrollTop,
      totalHeight: totalItems * itemHeight
    };
  }, []);

  // Throttled rendering for high-frequency updates
  const createThrottledRenderer = useCallback(<T extends any[]>(
    renderFunction: (...args: T) => void,
    maxFPS: number = 60
  ) => {
    let lastRender = 0;
    let animationId: number | null = null;
    let pendingArgs: T | null = null;

    const throttledRender = (...args: T) => {
      pendingArgs = args;

      if (animationId) return;

      const now = performance.now();
      const timeSinceLastRender = now - lastRender;
      const minInterval = 1000 / maxFPS;

      if (timeSinceLastRender >= minInterval) {
        // Render immediately
        renderFunction(...args);
        lastRender = now;
        pendingArgs = null;
      } else {
        // Schedule render for next frame
        animationId = requestAnimationFrame(() => {
          animationId = null;
          if (pendingArgs) {
            renderFunction(...pendingArgs);
            lastRender = performance.now();
            pendingArgs = null;
          }
        });
      }
    };

    return throttledRender;
  }, []);

  // Memory-efficient object pooling
  const createObjectPool = useCallback(<T>(
    createObject: () => T,
    resetObject: (obj: T) => void,
    initialSize: number = 10
  ) => {
    const pool: T[] = [];
    const activeObjects = new Set<T>();

    // Pre-populate pool
    for (let i = 0; i < initialSize; i++) {
      pool.push(createObject());
    }

    const acquire = (): T => {
      let obj = pool.pop();
      if (!obj) {
        obj = createObject();
      }
      activeObjects.add(obj);
      return obj;
    };

    const release = (obj: T): void => {
      if (activeObjects.has(obj)) {
        resetObject(obj);
        activeObjects.delete(obj);
        pool.push(obj);
      }
    };

    const clear = (): void => {
      activeObjects.clear();
      pool.length = 0;
    };

    return { acquire, release, clear, size: () => pool.length, active: () => activeObjects.size };
  }, []);

  // Initialize performance monitoring
  useEffect(() => {
    const hasWorkers = initializeWorkerPool();
    const cleanup = startPerformanceMonitoring();

    return () => {
      cleanup();

      // Clean up workers
      if (workerPoolRef.current) {
        workerPoolRef.current.workers.forEach(worker => worker.terminate());
        workerPoolRef.current.activeRequests.clear();
      }
    };
  }, [initializeWorkerPool, startPerformanceMonitoring]);

  // Auto-optimization based on performance thresholds
  useEffect(() => {
    const { fps, frameTime, memoryUsage } = metrics;

    // Trigger optimization if performance is poor
    if (fps < 30 || frameTime > 50 || memoryUsage > 150) {
      optimizePerformance();
    }
  }, [metrics, optimizePerformance]);

  return {
    // Metrics
    metrics,
    isOptimizing,

    // Worker management
    analyzeAudioData,

    // Virtual scrolling
    createVirtualScrollState,
    updateVirtualScrollState,

    // Performance utilities
    createThrottledRenderer,
    createObjectPool,
    optimizePerformance,

    // Worker availability
    hasWorkers: workerPoolRef.current?.workers.length > 0
  };
};

export default useStemPerformance;
export type { PerformanceMetrics, VirtualScrollConfig, VirtualScrollState };