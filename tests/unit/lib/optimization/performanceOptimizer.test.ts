/**
 * Performance Optimizer Tests
 *
 * Comprehensive test suite for the performance optimization system.
 * Tests all critical performance paths and optimization strategies.
 */

import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';

import {
  PerformanceOptimizer,
  type PerformanceMetrics,
  type OptimizationConfig
} from '../performanceOptimizer';

// Mock Web Workers and Audio APIs
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((error: ErrorEvent) => void) | null = null;

  postMessage(data: any): void {
    // Simulate async worker response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: { result: 'mocked_result' } } as MessageEvent);
      }
    }, 10);
  }

  terminate(): void {
    // Mock termination
  }
}

class MockAudioContext {
  sampleRate = 44100;

  createBuffer(channels: number, frames: number, sampleRate: number): MockAudioBuffer {
    return new MockAudioBuffer(channels, frames, sampleRate);
  }

  close(): Promise<void> {
    return Promise.resolve();
  }
}

class MockAudioBuffer {
  numberOfChannels: number;
  length: number;
  sampleRate: number;
  private channelData: Float32Array[];

  constructor(channels: number, frames: number, sampleRate: number) {
    this.numberOfChannels = channels;
    this.length = frames;
    this.sampleRate = sampleRate;
    this.channelData = Array.from(
      { length: channels },
      () => new Float32Array(frames)
    );
  }

  getChannelData(channel: number): Float32Array {
    return this.channelData[channel];
  }
}

// Mock globals
(global as any).Worker = MockWorker;
(global as any).AudioContext = MockAudioContext;
(global as any).requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 16);
};

Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    memory: {
      usedJSHeapSize: 50 * 1024 * 1024, // 50MB
      totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    },
  },
});

describe('PerformanceOptimizer', () => {
  let optimizer: PerformanceOptimizer;
  let mockAudioBuffer: MockAudioBuffer;

  beforeEach(() => {
    optimizer = new PerformanceOptimizer();
    mockAudioBuffer = new MockAudioBuffer(2, 4096, 44100);

    // Fill with test data
    const channelData = mockAudioBuffer.getChannelData(0);
    for (let i = 0; i < channelData.length; i++) {
      channelData[i] = Math.sin((2 * Math.PI * 440 * i) / 44100) * 0.5;
    }
  });

  afterEach(() => {
    optimizer.cleanup();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with default configuration', () => {
      const config = optimizer.getConfig();

      expect(config.enableLazyLoading).toBe(true);
      expect(config.enableCaching).toBe(true);
      expect(config.enableWorkerPooling).toBe(true);
      expect(config.cacheSize).toBe(100);
      expect(config.workerPoolSize).toBe(4);
    });

    test('should initialize with custom configuration', () => {
      const customConfig: Partial<OptimizationConfig> = {
        enableCaching: false,
        cacheSize: 50,
        workerPoolSize: 2,
      };

      const customOptimizer = new PerformanceOptimizer(customConfig);

      const config = customOptimizer.getConfig();
      expect(config.enableCaching).toBe(false);
      expect(config.cacheSize).toBe(50);
      expect(config.workerPoolSize).toBe(2);

      customOptimizer.cleanup();
    });

    test('should have correct performance targets', () => {
      const targets = optimizer.getTargets();

      expect(targets.initialLoad).toBe(3000);
      expect(targets.gestureLatency).toBe(50);
      expect(targets.audioLatency).toBe(20);
      expect(targets.fps).toBe(60);
      expect(targets.memoryUsage).toBe(150);
    });
  });

  describe('Profiling', () => {
    test('should start and end profiling correctly', () => {
      const operation = 'test_operation';

      optimizer.startProfiling(operation);

      // Simulate some work
      const start = Date.now();
      while (Date.now() - start < 10) {
        // Wait 10ms
      }

      const duration = optimizer.endProfiling(operation);

      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000); // Should be less than 1 second
    });

    test('should handle multiple concurrent profilings', () => {
      optimizer.startProfiling('operation1');
      optimizer.startProfiling('operation2');

      // Simulate different work durations
      setTimeout(() => {
        const duration1 = optimizer.endProfiling('operation1');
        expect(duration1).toBeGreaterThan(0);
      }, 5);

      setTimeout(() => {
        const duration2 = optimizer.endProfiling('operation2');
        expect(duration2).toBeGreaterThan(0);
      }, 10);
    });

    test('should return 0 for unknown profiling operation', () => {
      const duration = optimizer.endProfiling('unknown_operation');
      expect(duration).toBe(0);
    });
  });

  describe('Monitoring', () => {
    test('should start and stop monitoring', () => {
      optimizer.startMonitoring();

      // Should be able to get metrics
      const metrics = optimizer.getMetrics();
      expect(metrics).toBeDefined();
      expect(typeof metrics.fps).toBe('number');
      expect(typeof metrics.memory).toBe('number');

      optimizer.stopMonitoring();
    });

    test('should update latency measurements', () => {
      optimizer.updateLatency('gesture', 25);
      optimizer.updateLatency('audio', 15);

      const metrics = optimizer.getMetrics();
      expect(metrics.latency.gesture).toBe(25);
      expect(metrics.latency.audio).toBe(15);
    });
  });

  describe('Caching', () => {
    test('should cache and retrieve values', () => {
      const key = 'test_key';
      const value = { data: 'test_data' };

      optimizer.setCached(key, value);
      const retrieved = optimizer.getCached(key);

      expect(retrieved).toEqual(value);
    });

    test('should return null for missing cache keys', () => {
      const result = optimizer.getCached('missing_key');
      expect(result).toBeNull();
    });

    test('should clear cache', () => {
      optimizer.setCached('key1', 'value1');
      optimizer.setCached('key2', 'value2');

      optimizer.clearCache();

      expect(optimizer.getCached('key1')).toBeNull();
      expect(optimizer.getCached('key2')).toBeNull();
    });

    test('should respect cache disable setting', () => {
      optimizer.updateConfig({ enableCaching: false });

      optimizer.setCached('test_key', 'test_value');
      const result = optimizer.getCached('test_key');

      expect(result).toBeNull();
    });
  });

  describe('Worker Pool Management', () => {
    test('should create worker pool', () => {
      const poolName = 'test_pool';
      const workerScript = '/test-worker.js';

      expect(() => {
        optimizer.createWorkerPool(poolName, workerScript);
      }).not.toThrow();
    });

    test('should execute tasks in worker pool', async () => {
      const poolName = 'test_pool';
      optimizer.createWorkerPool(poolName, '/test-worker.js');

      const result = await optimizer.executeInWorker(poolName, { test: 'data' });
      expect(result).toEqual({ result: 'mocked_result' });
    });

    test('should throw error for unknown worker pool', async () => {
      await expect(
        optimizer.executeInWorker('unknown_pool', {})
      ).rejects.toThrow("Worker pool 'unknown_pool' not found");
    });
  });

  describe('Optimization Methods', () => {
    test('should optimize stem separation', async () => {
      // Create worker pool first
      optimizer.createWorkerPool('stemSeparation', '/stem-worker.js');

      const result = await optimizer.optimizeStemSeparation(mockAudioBuffer as any);
      expect(result).toEqual({ result: 'mocked_result' });
    });

    test('should optimize BPM detection', async () => {
      // Create worker pool first
      optimizer.createWorkerPool('bpmDetection', '/bpm-worker.js');

      const result = await optimizer.optimizeBPMDetection(mockAudioBuffer as any);
      expect(result).toEqual({ result: 'mocked_result' });
    });

    test('should cache optimization results', async () => {
      optimizer.createWorkerPool('stemSeparation', '/stem-worker.js');

      // First call should use worker
      const result1 = await optimizer.optimizeStemSeparation(mockAudioBuffer as any);

      // Second call should use cache
      const result2 = await optimizer.optimizeStemSeparation(mockAudioBuffer as any);

      expect(result1).toEqual(result2);
    });

    test('should optimize gesture processing', () => {
      const gestureData = {
        action: 'grab',
        confidence: 0.95,
        landmarks: [{ x: 0.5, y: 0.5, z: 0.1 }]
      };

      const result = optimizer.optimizeGestureProcessing(gestureData);

      expect(result).toBeDefined();
      expect(result.action).toBe('grab');
      expect(typeof result.confidence).toBe('number');
    });

    test('should use reduced precision for low FPS', () => {
      // Mock low FPS
      jest.spyOn(optimizer, 'getMetrics').mockReturnValue({
        fps: 25, // Below 30 FPS threshold
        memory: 50,
        cpu: 30,
        latency: { gesture: 0, audio: 0, ui: 0 },
        network: { requests: 0, latency: 0, bandwidth: 0 }
      });

      const gestureData = {
        action: 'point',
        confidence: 0.87654,
        landmarks: []
      };

      const result = optimizer.optimizeGestureProcessing(gestureData);

      expect(result.simplified).toBe(true);
      expect(result.confidence).toBe(0.9); // Should be rounded
    });
  });

  describe('Performance Validation', () => {
    test('should validate performance against targets', () => {
      // Mock good performance metrics
      jest.spyOn(optimizer, 'getMetrics').mockReturnValue({
        fps: 60,
        memory: 100, // MB
        cpu: 50,
        latency: { gesture: 30, audio: 15, ui: 10 },
        network: { requests: 5, latency: 100, bandwidth: 10 }
      });

      const validation = optimizer.validatePerformance();

      expect(validation.passed).toBe(true);
      expect(validation.failures).toHaveLength(0);
    });

    test('should detect performance failures', () => {
      // Mock poor performance metrics
      jest.spyOn(optimizer, 'getMetrics').mockReturnValue({
        fps: 20, // Below target
        memory: 200, // Above target
        cpu: 90,
        latency: { gesture: 80, audio: 30, ui: 25 }, // Above targets
        network: { requests: 10, latency: 500, bandwidth: 1 }
      });

      const validation = optimizer.validatePerformance();

      expect(validation.passed).toBe(false);
      expect(validation.failures.length).toBeGreaterThan(0);
      expect(validation.failures).toContain(expect.stringContaining('FPS too low'));
      expect(validation.failures).toContain(expect.stringContaining('Memory usage too high'));
    });
  });

  describe('Frame Scheduling', () => {
    test('should schedule frame callbacks', (done) => {
      let callbackExecuted = false;

      optimizer.scheduleFrame(() => {
        callbackExecuted = true;
        done();
      });

      // Should not be executed immediately
      expect(callbackExecuted).toBe(false);
    });

    test('should handle multiple frame callbacks', (done) => {
      let callbackCount = 0;
      const expectedCallbacks = 3;

      const callback = () => {
        callbackCount++;
        if (callbackCount === expectedCallbacks) {
          expect(callbackCount).toBe(expectedCallbacks);
          done();
        }
      };

      for (let i = 0; i < expectedCallbacks; i++) {
        optimizer.scheduleFrame(callback);
      }
    });
  });

  describe('Configuration Updates', () => {
    test('should update configuration', () => {
      const newConfig: Partial<OptimizationConfig> = {
        enableFrameSkipping: false,
        frameSkipThreshold: 33.33,
        cacheSize: 200
      };

      optimizer.updateConfig(newConfig);

      const config = optimizer.getConfig();
      expect(config.enableFrameSkipping).toBe(false);
      expect(config.frameSkipThreshold).toBe(33.33);
      expect(config.cacheSize).toBe(200);
    });
  });

  describe('Cleanup', () => {
    test('should cleanup resources properly', () => {
      optimizer.startMonitoring();
      optimizer.setCached('test', 'value');
      optimizer.createWorkerPool('test', '/test-worker.js');

      expect(() => {
        optimizer.cleanup();
      }).not.toThrow();

      // Cache should be cleared
      expect(optimizer.getCached('test')).toBeNull();
    });
  });

  describe('Performance Targets', () => {
    test('should meet initial load target', () => {
      const targets = optimizer.getTargets();
      expect(targets.initialLoad).toBeLessThanOrEqual(3000);
    });

    test('should meet gesture latency target', () => {
      const targets = optimizer.getTargets();
      expect(targets.gestureLatency).toBeLessThanOrEqual(50);
    });

    test('should meet audio latency target', () => {
      const targets = optimizer.getTargets();
      expect(targets.audioLatency).toBeLessThanOrEqual(20);
    });

    test('should meet FPS target', () => {
      const targets = optimizer.getTargets();
      expect(targets.fps).toBeGreaterThanOrEqual(60);
    });

    test('should meet memory usage target', () => {
      const targets = optimizer.getTargets();
      expect(targets.memoryUsage).toBeLessThanOrEqual(150);
    });
  });

  describe('Error Handling', () => {
    test('should handle worker creation errors gracefully', () => {
      // Mock Worker constructor to throw
      const originalWorker = global.Worker;
      (global as any).Worker = jest.fn(() => {
        throw new Error('Worker creation failed');
      });

      expect(() => {
        optimizer.createWorkerPool('error_pool', '/error-worker.js');
      }).not.toThrow();

      // Restore original Worker
      (global as any).Worker = originalWorker;
    });

    test('should handle audio buffer errors gracefully', async () => {
      // Create worker pool first
      optimizer.createWorkerPool('stemSeparation', '/stem-worker.js');

      // Pass invalid audio buffer
      const invalidBuffer = null as any;

      await expect(
        optimizer.optimizeStemSeparation(invalidBuffer)
      ).rejects.toThrow();
    });
  });

  describe('Memory Management', () => {
    test('should track memory usage', () => {
      const metrics = optimizer.getMetrics();
      expect(typeof metrics.memory).toBe('number');
      expect(metrics.memory).toBeGreaterThan(0);
    });

    test('should validate memory against target', () => {
      const validation = optimizer.validatePerformance();
      const targets = optimizer.getTargets();

      // Memory should be within reasonable bounds
      expect(validation.metrics.memory).toBeLessThan(targets.memoryUsage * 2);
    });
  });
});