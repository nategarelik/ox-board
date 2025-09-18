/**
 * Performance Benchmark Suite for OX Board AI Enhancement
 *
 * Comprehensive benchmarking system that measures baseline performance,
 * tracks optimization impact, and provides regression testing capabilities.
 */

export interface BenchmarkResult {
  name: string;
  duration: number;
  iterations: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  throughput: number;
  memoryUsage: {
    before: number;
    after: number;
    peak: number;
  };
  passed: boolean;
  target: number;
  timestamp: number;
}

export interface BenchmarkSuite {
  name: string;
  results: BenchmarkResult[];
  overallScore: number;
  status: 'passed' | 'failed' | 'warning';
  executionTime: number;
  timestamp: number;
}

export interface BenchmarkConfig {
  iterations: number;
  warmupRuns: number;
  timeoutMs: number;
  memoryTracking: boolean;
  targets: {
    stemSeparation: number; // ms
    bpmDetection: number; // ms
    gestureProcessing: number; // ms
    audioLatency: number; // ms
    uiRendering: number; // ms
  };
}

class BenchmarkRunner {
  private config: BenchmarkConfig;
  private results: Map<string, BenchmarkResult[]> = new Map();

  constructor(config: BenchmarkConfig) {
    this.config = config;
  }

  async runBenchmark(
    name: string,
    fn: () => Promise<void> | void,
    target: number
  ): Promise<BenchmarkResult> {
    console.log(`Running benchmark: ${name}`);

    // Warmup runs
    for (let i = 0; i < this.config.warmupRuns; i++) {
      try {
        await fn();
      } catch (error) {
        console.warn(`Warmup run ${i + 1} failed:`, error);
      }
    }

    // Force garbage collection before benchmark
    if ('gc' in global && typeof (global as any).gc === 'function') {
      (global as any).gc();
    }

    const durations: number[] = [];
    let memoryBefore = 0;
    let memoryAfter = 0;
    let memoryPeak = 0;

    // Measure memory before
    if (this.config.memoryTracking && 'memory' in performance) {
      memoryBefore = (performance as any).memory.usedJSHeapSize;
    }

    const startTime = performance.now();

    // Run benchmark iterations
    for (let i = 0; i < this.config.iterations; i++) {
      const iterationStart = performance.now();

      try {
        await Promise.race([
          fn(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), this.config.timeoutMs)
          )
        ]);

        const iterationEnd = performance.now();
        const duration = iterationEnd - iterationStart;
        durations.push(duration);

        // Track peak memory usage
        if (this.config.memoryTracking && 'memory' in performance) {
          const currentMemory = (performance as any).memory.usedJSHeapSize;
          memoryPeak = Math.max(memoryPeak, currentMemory);
        }
      } catch (error) {
        console.error(`Benchmark iteration ${i + 1} failed:`, error);
        durations.push(this.config.timeoutMs); // Record as timeout
      }
    }

    const endTime = performance.now();

    // Measure memory after
    if (this.config.memoryTracking && 'memory' in performance) {
      memoryAfter = (performance as any).memory.usedJSHeapSize;
    }

    // Calculate statistics
    const totalDuration = endTime - startTime;
    const averageTime = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const minTime = Math.min(...durations);
    const maxTime = Math.max(...durations);

    // Calculate standard deviation
    const variance = durations.reduce((sum, d) => sum + Math.pow(d - averageTime, 2), 0) / durations.length;
    const standardDeviation = Math.sqrt(variance);

    // Calculate throughput (operations per second)
    const throughput = 1000 / averageTime;

    const result: BenchmarkResult = {
      name,
      duration: totalDuration,
      iterations: this.config.iterations,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      throughput,
      memoryUsage: {
        before: memoryBefore,
        after: memoryAfter,
        peak: memoryPeak
      },
      passed: averageTime <= target,
      target,
      timestamp: Date.now()
    };

    // Store result
    if (!this.results.has(name)) {
      this.results.set(name, []);
    }
    this.results.get(name)!.push(result);

    console.log(`Benchmark ${name} completed: ${averageTime.toFixed(2)}ms avg (target: ${target}ms)`);

    return result;
  }

  getResults(benchmarkName?: string): BenchmarkResult[] {
    if (benchmarkName) {
      return this.results.get(benchmarkName) || [];
    }

    const allResults: BenchmarkResult[] = [];
    for (const results of this.results.values()) {
      allResults.push(...results);
    }
    return allResults;
  }

  clearResults(benchmarkName?: string): void {
    if (benchmarkName) {
      this.results.delete(benchmarkName);
    } else {
      this.results.clear();
    }
  }

  compareResults(benchmarkName: string, baselineIndex: number = 0): {
    baseline: BenchmarkResult;
    current: BenchmarkResult;
    improvement: number;
    regressionDetected: boolean;
  } | null {
    const results = this.results.get(benchmarkName);
    if (!results || results.length < 2) {
      return null;
    }

    const baseline = results[baselineIndex];
    const current = results[results.length - 1];

    const improvement = ((baseline.averageTime - current.averageTime) / baseline.averageTime) * 100;
    const regressionDetected = current.averageTime > baseline.averageTime * 1.1; // 10% regression threshold

    return {
      baseline,
      current,
      improvement,
      regressionDetected
    };
  }
}

export class PerformanceBenchmark {
  private runner: BenchmarkRunner;
  private suites: Map<string, BenchmarkSuite> = new Map();
  private audioContext?: AudioContext;
  private testAudioBuffer?: AudioBuffer;

  constructor(config?: Partial<BenchmarkConfig>) {
    const defaultConfig: BenchmarkConfig = {
      iterations: 100,
      warmupRuns: 10,
      timeoutMs: 5000,
      memoryTracking: true,
      targets: {
        stemSeparation: 1000, // 1 second
        bpmDetection: 500,    // 500ms
        gestureProcessing: 50, // 50ms
        audioLatency: 20,     // 20ms
        uiRendering: 16       // 16ms (60fps)
      }
    };

    this.runner = new BenchmarkRunner({ ...defaultConfig, ...config });
    this.initializeTestAssets();
  }

  private async initializeTestAssets(): Promise<void> {
    try {
      // Initialize audio context and test buffer
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.testAudioBuffer = this.createTestAudioBuffer();
    } catch (error) {
      console.warn('Failed to initialize audio test assets:', error);
    }
  }

  private createTestAudioBuffer(): AudioBuffer {
    if (!this.audioContext) {
      throw new Error('AudioContext not available');
    }

    const sampleRate = 44100;
    const duration = 2; // 2 seconds
    const frameCount = sampleRate * duration;

    const audioBuffer = this.audioContext.createBuffer(2, frameCount, sampleRate);

    // Generate test audio (sine wave)
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.5; // 440Hz sine wave
      }
    }

    return audioBuffer;
  }

  // Core benchmarks
  async benchmarkStemSeparation(): Promise<BenchmarkResult> {
    return this.runner.runBenchmark(
      'stem-separation',
      async () => {
        if (!this.testAudioBuffer) {
          throw new Error('Test audio buffer not available');
        }

        // Simulate stem separation processing
        const channelData = this.testAudioBuffer.getChannelData(0);
        const processedData = new Float32Array(channelData.length);

        // Simulate complex audio processing
        for (let i = 0; i < channelData.length; i++) {
          processedData[i] = channelData[i] * Math.sin(i * 0.01);
        }

        // Simulate additional processing delay
        await new Promise(resolve => setTimeout(resolve, 10));
      },
      this.runner['config'].targets.stemSeparation
    );
  }

  async benchmarkBPMDetection(): Promise<BenchmarkResult> {
    return this.runner.runBenchmark(
      'bpm-detection',
      async () => {
        if (!this.testAudioBuffer) {
          throw new Error('Test audio buffer not available');
        }

        const channelData = this.testAudioBuffer.getChannelData(0);

        // Simulate BPM detection algorithm
        let energy = 0;
        let peaks = 0;
        const windowSize = 1024;

        for (let i = 0; i < channelData.length - windowSize; i += windowSize) {
          let windowEnergy = 0;
          for (let j = 0; j < windowSize; j++) {
            windowEnergy += Math.abs(channelData[i + j]);
          }

          if (windowEnergy > energy * 1.1) {
            peaks++;
          }
          energy = windowEnergy;
        }

        // Simulate BPM calculation
        const bpm = (peaks / (channelData.length / 44100)) * 60;
        // Store result for validation but don't return it
        (this as any).lastBPM = bpm;
      },
      this.runner['config'].targets.bpmDetection
    );
  }

  async benchmarkGestureProcessing(): Promise<BenchmarkResult> {
    return this.runner.runBenchmark(
      'gesture-processing',
      async () => {
        // Simulate gesture data
        const gestureData = {
          landmarks: Array.from({ length: 21 }, (_, i) => ({
            x: Math.random(),
            y: Math.random(),
            z: Math.random()
          })),
          handedness: 'Right',
          confidence: Math.random()
        };

        // Simulate gesture recognition processing
        let actionScore = 0;
        for (const landmark of gestureData.landmarks) {
          actionScore += Math.sqrt(landmark.x ** 2 + landmark.y ** 2 + landmark.z ** 2);
        }

        // Simulate gesture classification
        const action = actionScore > 10 ? 'grab' : actionScore > 5 ? 'point' : 'none';

        // Store result for validation but don't return it
        (this as any).lastGesture = { action, confidence: gestureData.confidence };
      },
      this.runner['config'].targets.gestureProcessing
    );
  }

  async benchmarkAudioLatency(): Promise<BenchmarkResult> {
    return this.runner.runBenchmark(
      'audio-latency',
      async () => {
        if (!this.audioContext) {
          throw new Error('AudioContext not available');
        }

        // Simulate audio processing pipeline
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);

        const startTime = this.audioContext.currentTime;
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.01); // 10ms tone

        // Wait for audio to process
        await new Promise(resolve => setTimeout(resolve, 5));
      },
      this.runner['config'].targets.audioLatency
    );
  }

  async benchmarkUIRendering(): Promise<BenchmarkResult> {
    return this.runner.runBenchmark(
      'ui-rendering',
      async () => {
        // Simulate UI rendering workload
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 600;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas context not available');
        }

        // Simulate complex rendering
        for (let i = 0; i < 100; i++) {
          ctx.fillStyle = `hsl(${i * 3.6}, 50%, 50%)`;
          ctx.fillRect(i * 8, i * 6, 10, 10);
        }

        // Simulate additional rendering operations
        ctx.strokeStyle = 'white';
        for (let i = 0; i < 50; i++) {
          ctx.beginPath();
          ctx.arc(Math.random() * 800, Math.random() * 600, 5, 0, Math.PI * 2);
          ctx.stroke();
        }
      },
      this.runner['config'].targets.uiRendering
    );
  }

  // Comprehensive benchmark suite
  async runFullBenchmarkSuite(suiteName: string = 'full-performance'): Promise<BenchmarkSuite> {
    const startTime = performance.now();
    const results: BenchmarkResult[] = [];

    console.log(`Starting benchmark suite: ${suiteName}`);

    try {
      // Run all core benchmarks
      results.push(await this.benchmarkStemSeparation());
      results.push(await this.benchmarkBPMDetection());
      results.push(await this.benchmarkGestureProcessing());
      results.push(await this.benchmarkAudioLatency());
      results.push(await this.benchmarkUIRendering());

    } catch (error) {
      console.error('Benchmark suite failed:', error);
    }

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    // Calculate overall score (0-100)
    const overallScore = this.calculateOverallScore(results);

    // Determine status
    const passedCount = results.filter(r => r.passed).length;
    let status: 'passed' | 'failed' | 'warning';

    if (passedCount === results.length) {
      status = 'passed';
    } else if (passedCount >= results.length * 0.7) {
      status = 'warning';
    } else {
      status = 'failed';
    }

    const suite: BenchmarkSuite = {
      name: suiteName,
      results,
      overallScore,
      status,
      executionTime,
      timestamp: Date.now()
    };

    this.suites.set(suiteName, suite);
    console.log(`Benchmark suite completed: ${status} (score: ${overallScore})`);

    return suite;
  }

  private calculateOverallScore(results: BenchmarkResult[]): number {
    if (results.length === 0) return 0;

    let totalScore = 0;

    for (const result of results) {
      // Score based on how well it performs relative to target
      const performance = Math.min(result.target / result.averageTime, 2); // Cap at 2x better than target
      const score = Math.min(100, performance * 50); // Scale to 0-100
      totalScore += score;
    }

    return Math.round(totalScore / results.length);
  }

  // Regression testing
  async runRegressionTest(baselineSuiteName: string): Promise<{
    passed: boolean;
    regressions: Array<{
      benchmark: string;
      baseline: number;
      current: number;
      degradation: number;
    }>;
    improvements: Array<{
      benchmark: string;
      baseline: number;
      current: number;
      improvement: number;
    }>;
  }> {
    const baselineSuite = this.suites.get(baselineSuiteName);
    if (!baselineSuite) {
      throw new Error(`Baseline suite '${baselineSuiteName}' not found`);
    }

    const currentSuite = await this.runFullBenchmarkSuite('regression-test');

    const regressions: any[] = [];
    const improvements: any[] = [];

    for (const currentResult of currentSuite.results) {
      const baselineResult = baselineSuite.results.find(r => r.name === currentResult.name);
      if (!baselineResult) continue;

      const change = ((currentResult.averageTime - baselineResult.averageTime) / baselineResult.averageTime) * 100;

      if (change > 10) { // 10% degradation threshold
        regressions.push({
          benchmark: currentResult.name,
          baseline: baselineResult.averageTime,
          current: currentResult.averageTime,
          degradation: change
        });
      } else if (change < -5) { // 5% improvement threshold
        improvements.push({
          benchmark: currentResult.name,
          baseline: baselineResult.averageTime,
          current: currentResult.averageTime,
          improvement: Math.abs(change)
        });
      }
    }

    return {
      passed: regressions.length === 0,
      regressions,
      improvements
    };
  }

  // Analysis and reporting
  getBenchmarkHistory(benchmarkName: string): BenchmarkResult[] {
    return this.runner.getResults(benchmarkName);
  }

  getSuiteHistory(): BenchmarkSuite[] {
    return Array.from(this.suites.values()).sort((a, b) => a.timestamp - b.timestamp);
  }

  exportResults(): {
    suites: BenchmarkSuite[];
    individualResults: Record<string, BenchmarkResult[]>;
    summary: {
      totalSuites: number;
      totalBenchmarks: number;
      averageScore: number;
      lastRun: number;
    };
  } {
    const suites = this.getSuiteHistory();
    const individualResults: Record<string, BenchmarkResult[]> = {};

    // Collect individual benchmark results
    for (const suite of suites) {
      for (const result of suite.results) {
        if (!individualResults[result.name]) {
          individualResults[result.name] = [];
        }
        individualResults[result.name].push(result);
      }
    }

    const averageScore = suites.length > 0 ?
      suites.reduce((sum, s) => sum + s.overallScore, 0) / suites.length : 0;

    return {
      suites,
      individualResults,
      summary: {
        totalSuites: suites.length,
        totalBenchmarks: Object.keys(individualResults).length,
        averageScore: Math.round(averageScore),
        lastRun: suites.length > 0 ? suites[suites.length - 1].timestamp : 0
      }
    };
  }

  // Cleanup
  destroy(): void {
    this.runner.clearResults();
    this.suites.clear();

    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}

// Singleton instance
export const performanceBenchmark = new PerformanceBenchmark();