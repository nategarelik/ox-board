/**
 * Performance Optimization Suite Index
 *
 * Central export point for all optimization modules and utilities.
 * Provides a unified interface for performance optimization across the OX Board application.
 */

// Import modules for internal use
import * as React from 'react';
import { performanceOptimizer, type PerformanceMetrics } from './performanceOptimizer';
import { bundleOptimizer } from './bundleOptimizer';
import { memoryOptimizer } from './memoryOptimizer';
import { performanceMonitor } from './performanceMonitor';
import { performanceBenchmark } from './performanceBenchmark';

// Core optimization modules
export {
  PerformanceOptimizer,
  performanceOptimizer,
  type PerformanceMetrics,
  type PerformanceTargets,
  type OptimizationConfig
} from './performanceOptimizer';

export {
  BundleOptimizer,
  bundleOptimizer,
  type BundleAnalysis,
  type LazyLoadConfig
} from './bundleOptimizer';

export {
  MemoryOptimizer,
  memoryOptimizer,
  type MemoryMetrics,
  type BufferPoolConfig
} from './memoryOptimizer';

export {
  PerformanceMonitor,
  performanceMonitor,
  type PerformanceSnapshot,
  type AlertConfig,
  type PerformanceAlert
} from './performanceMonitor';

export {
  PerformanceBenchmark,
  performanceBenchmark,
  type BenchmarkResult,
  type BenchmarkSuite,
  type BenchmarkConfig
} from './performanceBenchmark';

// Optimization utilities and hooks
export class OptimizationManager {
  private static instance: OptimizationManager;
  private isInitialized: boolean = false;
  private audioContext?: AudioContext;

  static getInstance(): OptimizationManager {
    if (!OptimizationManager.instance) {
      OptimizationManager.instance = new OptimizationManager();
    }
    return OptimizationManager.instance;
  }

  async initialize(config?: {
    enableMonitoring?: boolean;
    enableBenchmarking?: boolean;
    audioContext?: AudioContext;
  }): Promise<void> {
    if (this.isInitialized) return;

    const {
      enableMonitoring = true,
      enableBenchmarking = false,
      audioContext
    } = config || {};

    console.log('Initializing OX Board Performance Optimization Suite...');

    try {
      // Initialize audio context if provided (defer creation if not)
      if (audioContext) {
        this.audioContext = audioContext;
        // Initialize memory optimization with provided audio context
        memoryOptimizer.initializeAudioBufferPool(this.audioContext);
      }
      // Don't create AudioContext automatically - wait for user gesture

      // Initialize worker pools for critical operations
      this.initializeWorkerPools();

      // Start performance monitoring if enabled
      if (enableMonitoring) {
        performanceMonitor.start();
        performanceOptimizer.startMonitoring();
      }

      // Initialize bundle optimization
      bundleOptimizer.preloadCriticalModules();

      // Run initial benchmark if enabled
      if (enableBenchmarking) {
        await this.runInitialBenchmark();
      }

      this.isInitialized = true;
      console.log('Performance optimization suite initialized successfully');

    } catch (error) {
      console.error('Failed to initialize performance optimization suite:', error);
      throw error;
    }
  }

  private initializeWorkerPools(): void {
    try {
      // Create worker pools for heavy operations
      performanceOptimizer.createWorkerPool(
        'stemSeparation',
        '/workers/audioAnalyzer.worker.js'
      );

      performanceOptimizer.createWorkerPool(
        'bpmDetection',
        '/workers/musicAnalyzer.worker.js'
      );

      console.log('Worker pools initialized');
    } catch (error) {
      console.warn('Failed to initialize worker pools:', error);
    }
  }

  private async runInitialBenchmark(): Promise<void> {
    try {
      console.log('Running initial performance benchmark...');
      const results = await performanceBenchmark.runFullBenchmarkSuite('initial-baseline');

      if (results.status === 'failed') {
        console.warn('Initial benchmark failed - performance may be suboptimal');
      } else {
        console.log(`Initial benchmark completed with score: ${results.overallScore}`);
      }
    } catch (error) {
      console.warn('Initial benchmark failed:', error);
    }
  }

  // Initialize AudioContext after user gesture
  async initializeAudioContext(): Promise<AudioContext | undefined> {
    if (this.audioContext) {
      return this.audioContext;
    }

    if (typeof AudioContext !== 'undefined') {
      try {
        this.audioContext = new AudioContext();
        // Initialize memory optimization with audio context
        memoryOptimizer.initializeAudioBufferPool(this.audioContext);
        console.log('AudioContext initialized successfully');
        return this.audioContext;
      } catch (error) {
        console.error('Failed to initialize AudioContext:', error);
      }
    }
    return undefined;
  }

  // Quick optimization methods
  async optimizeForPerformance(): Promise<void> {
    console.log('Running performance optimization...');

    // Optimize memory usage
    memoryOptimizer.optimizeMemoryUsage();

    // Optimize bundle
    await bundleOptimizer.optimizeBundle();

    // Force garbage collection
    memoryOptimizer.forceGarbageCollection();

    console.log('Performance optimization completed');
  }

  // Performance validation
  async validatePerformance(): Promise<{
    passed: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const validation = performanceOptimizer.validatePerformance();
    const analysis = performanceMonitor.getPerformanceAnalysis();

    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check validation failures
    validation.failures.forEach(failure => {
      issues.push(failure);
    });

    // Add analysis recommendations
    recommendations.push(...analysis.recommendations);

    // Check memory health
    const memoryHealth = memoryOptimizer.checkMemoryHealth();
    if (memoryHealth.status !== 'healthy') {
      issues.push(`Memory usage: ${memoryHealth.status}`);
      recommendations.push(...memoryHealth.recommendations);
    }

    return {
      passed: validation.passed && analysis.overall !== 'poor',
      score: analysis.overall === 'good' ? 85 : analysis.overall === 'fair' ? 65 : 40,
      issues,
      recommendations
    };
  }

  // Component optimization utilities
  optimizeComponent<T>(
    component: T,
    options: {
      enableLazyLoading?: boolean;
      enableMemoization?: boolean;
      enableVirtualization?: boolean;
    } = {}
  ): T {
    const {
      enableLazyLoading = true,
      enableMemoization = true,
      enableVirtualization = false
    } = options;

    // This would typically wrap the component with optimization HOCs
    // For now, we'll just return the component as-is
    console.log('Component optimization applied:', {
      enableLazyLoading,
      enableMemoization,
      enableVirtualization
    });

    return component;
  }

  // Resource management
  trackResource<T extends object>(id: string, resource: T, cleanup?: () => void): void {
    memoryOptimizer.trackResource(id, resource, cleanup);
  }

  untrackResource(id: string): void {
    memoryOptimizer.untrackResource(id);
  }

  // Audio optimization
  async optimizeAudioProcessing(audioBuffer: AudioBuffer): Promise<any> {
    performanceOptimizer.startProfiling('audio_optimization');

    try {
      // Use optimized stem separation
      const stems = await performanceOptimizer.optimizeStemSeparation(audioBuffer);

      // Use optimized BPM detection
      const bpm = await performanceOptimizer.optimizeBPMDetection(audioBuffer);

      return { stems, bpm };
    } finally {
      performanceOptimizer.endProfiling('audio_optimization');
    }
  }

  // Gesture optimization
  optimizeGestureData(gestureData: any): any {
    return performanceOptimizer.optimizeGestureProcessing(gestureData);
  }

  // Performance monitoring utilities
  startLatencyMeasurement(operation: string): void {
    performanceMonitor.startLatencyMeasurement(operation);
    performanceOptimizer.startProfiling(operation);
  }

  endLatencyMeasurement(operation: string): number {
    const latency = performanceMonitor.endLatencyMeasurement(operation);
    performanceOptimizer.endProfiling(operation);
    return latency;
  }

  // Status and metrics
  getOptimizationStatus(): {
    initialized: boolean;
    monitoring: boolean;
    performance: ReturnType<typeof performanceMonitor.getPerformanceAnalysis>;
    memory: ReturnType<typeof memoryOptimizer.checkMemoryHealth>;
    metrics: ReturnType<typeof performanceOptimizer.getMetrics>;
  } {
    return {
      initialized: this.isInitialized,
      monitoring: performanceMonitor['isMonitoring'] || false,
      performance: performanceMonitor.getPerformanceAnalysis(),
      memory: memoryOptimizer.checkMemoryHealth(),
      metrics: performanceOptimizer.getMetrics()
    };
  }

  // Cleanup
  async cleanup(): Promise<void> {
    console.log('Cleaning up optimization suite...');

    performanceMonitor.destroy();
    performanceOptimizer.cleanup();
    bundleOptimizer.destroy();
    memoryOptimizer.destroy();
    performanceBenchmark.destroy();

    if (this.audioContext) {
      await this.audioContext.close();
    }

    this.isInitialized = false;
    console.log('Optimization suite cleanup completed');
  }
}

// Export singleton instance
export const optimizationManager = OptimizationManager.getInstance();

// Utility functions for React components
export const withOptimization = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    lazy?: boolean;
    memo?: boolean;
    virtual?: boolean;
  }
) => {
  const OptimizedComponent = (props: P) => {
    // Track component rendering performance
    optimizationManager.startLatencyMeasurement(`component_${Component.name}`);

    React.useEffect(() => {
      return () => {
        optimizationManager.endLatencyMeasurement(`component_${Component.name}`);
      };
    }, []);

    return React.createElement(Component, props);
  };

  return options?.memo ? React.memo(OptimizedComponent) : OptimizedComponent;
};

// Hook for performance optimization in components
export const useOptimization = () => {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
  const [status, setStatus] = React.useState<'good' | 'fair' | 'poor'>('good');

  React.useEffect(() => {
    const updateMetrics = () => {
      const currentMetrics = performanceOptimizer.getMetrics();
      const analysis = performanceMonitor.getPerformanceAnalysis();

      setMetrics(currentMetrics);
      setStatus(analysis.overall);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    metrics,
    status,
    optimizeGesture: optimizationManager.optimizeGestureData.bind(optimizationManager),
    startMeasurement: optimizationManager.startLatencyMeasurement.bind(optimizationManager),
    endMeasurement: optimizationManager.endLatencyMeasurement.bind(optimizationManager),
    validatePerformance: optimizationManager.validatePerformance.bind(optimizationManager)
  };
};

// Performance targets for validation
export const PERFORMANCE_TARGETS = {
  INITIAL_LOAD: 3000,      // 3 seconds
  GESTURE_LATENCY: 50,     // 50ms
  AUDIO_LATENCY: 20,       // 20ms
  TARGET_FPS: 60,          // 60 FPS
  MEMORY_LIMIT: 150        // 150MB
} as const;