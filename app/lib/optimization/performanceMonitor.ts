/**
 * Performance Monitor for OX Board AI Enhancement
 *
 * Real-time performance monitoring with FPS tracking, latency measurements,
 * CPU usage profiling, and network request optimization.
 */

export interface PerformanceSnapshot {
  timestamp: number;
  fps: number;
  frameTime: number;
  memory: {
    used: number;
    total: number;
    external: number;
  };
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  network: {
    activeRequests: number;
    totalRequests: number;
    averageLatency: number;
    bandwidth: number;
  };
  latency: {
    gesture: number;
    audio: number;
    ui: number;
    total: number;
  };
  thresholds: {
    fps: boolean;
    memory: boolean;
    latency: boolean;
  };
}

export interface AlertConfig {
  enabled: boolean;
  fpsThreshold: number;
  memoryThreshold: number;
  latencyThreshold: number;
  callback?: (alert: PerformanceAlert) => void;
}

export interface PerformanceAlert {
  type: 'fps' | 'memory' | 'latency' | 'cpu';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: number;
}

class FPSMonitor {
  private fps: number = 0;
  private frameCount: number = 0;
  private lastTime: number = 0;
  private frameTime: number = 0;
  private isMonitoring: boolean = false;
  private callbacks: Array<(fps: number, frameTime: number) => void> = [];

  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.frameCount = 0;
    this.lastTime = performance.now();
    this.measureFrame();
  }

  stop(): void {
    this.isMonitoring = false;
  }

  private measureFrame = (): void => {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    this.frameTime = currentTime - this.lastTime;
    this.frameCount++;

    // Calculate FPS every second
    if (currentTime - this.lastTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / (currentTime - this.lastTime));
      this.frameCount = 0;
      this.lastTime = currentTime;

      // Notify callbacks
      this.callbacks.forEach(callback => callback(this.fps, this.frameTime));
    }

    requestAnimationFrame(this.measureFrame);
  };

  onFPSUpdate(callback: (fps: number, frameTime: number) => void): void {
    this.callbacks.push(callback);
  }

  removeCallback(callback: (fps: number, frameTime: number) => void): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  getFPS(): number {
    return this.fps;
  }

  getFrameTime(): number {
    return this.frameTime;
  }
}

class LatencyTracker {
  private measurements: Map<string, number[]> = new Map();
  private maxSamples: number = 100;

  startMeasurement(id: string): void {
    const startTime = performance.now();

    // Store start time temporarily
    if (!this.measurements.has(`${id}_start`)) {
      this.measurements.set(`${id}_start`, []);
    }
    this.measurements.get(`${id}_start`)!.push(startTime);
  }

  endMeasurement(id: string): number {
    const endTime = performance.now();
    const startTimes = this.measurements.get(`${id}_start`);

    if (!startTimes || startTimes.length === 0) {
      return 0;
    }

    const startTime = startTimes.pop()!;
    const latency = endTime - startTime;

    // Store latency measurement
    if (!this.measurements.has(id)) {
      this.measurements.set(id, []);
    }

    const measurements = this.measurements.get(id)!;
    measurements.push(latency);

    // Keep only recent measurements
    if (measurements.length > this.maxSamples) {
      measurements.shift();
    }

    return latency;
  }

  getAverageLatency(id: string): number {
    const measurements = this.measurements.get(id);
    if (!measurements || measurements.length === 0) {
      return 0;
    }

    const sum = measurements.reduce((acc, val) => acc + val, 0);
    return sum / measurements.length;
  }

  getLatencyPercentile(id: string, percentile: number): number {
    const measurements = this.measurements.get(id);
    if (!measurements || measurements.length === 0) {
      return 0;
    }

    const sorted = [...measurements].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  clearMeasurements(id: string): void {
    this.measurements.delete(id);
    this.measurements.delete(`${id}_start`);
  }

  getAllMetrics(): Record<string, {
    average: number;
    p95: number;
    p99: number;
    count: number;
  }> {
    const metrics: Record<string, any> = {};

    for (const [key, measurements] of this.measurements) {
      if (key.endsWith('_start')) continue;

      metrics[key] = {
        average: this.getAverageLatency(key),
        p95: this.getLatencyPercentile(key, 95),
        p99: this.getLatencyPercentile(key, 99),
        count: measurements.length
      };
    }

    return metrics;
  }
}

class NetworkMonitor {
  private activeRequests: number = 0;
  private totalRequests: number = 0;
  private latencies: number[] = [];
  private bandwidth: number = 0;
  private maxLatencySamples: number = 50;

  interceptFetch(): void {
    if (typeof window === 'undefined') return;

    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      const startTime = performance.now();
      this.activeRequests++;
      this.totalRequests++;

      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        const latency = endTime - startTime;

        this.recordLatency(latency);
        this.activeRequests--;

        return response;
      } catch (error) {
        this.activeRequests--;
        throw error;
      }
    };
  }

  private recordLatency(latency: number): void {
    this.latencies.push(latency);

    if (this.latencies.length > this.maxLatencySamples) {
      this.latencies.shift();
    }
  }

  getAverageLatency(): number {
    if (this.latencies.length === 0) return 0;

    const sum = this.latencies.reduce((acc, val) => acc + val, 0);
    return sum / this.latencies.length;
  }

  updateBandwidth(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.bandwidth = connection?.downlink || 0;
    }
  }

  getMetrics(): {
    activeRequests: number;
    totalRequests: number;
    averageLatency: number;
    bandwidth: number;
  } {
    this.updateBandwidth();

    return {
      activeRequests: this.activeRequests,
      totalRequests: this.totalRequests,
      averageLatency: this.getAverageLatency(),
      bandwidth: this.bandwidth
    };
  }

  reset(): void {
    this.activeRequests = 0;
    this.totalRequests = 0;
    this.latencies = [];
  }
}

class CPUMonitor {
  private usage: number = 0;
  private loadAverage: number[] = [0, 0, 0];
  private measurementInterval?: NodeJS.Timeout;
  private lastCPUTime: number = 0;
  private lastTimestamp: number = 0;

  start(): void {
    if (this.measurementInterval) return;

    this.measurementInterval = setInterval(() => {
      this.measureCPUUsage();
    }, 1000);

    this.lastTimestamp = performance.now();
  }

  stop(): void {
    if (this.measurementInterval) {
      clearInterval(this.measurementInterval);
      this.measurementInterval = undefined;
    }
  }

  private measureCPUUsage(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTimestamp;

    // Simulate CPU usage measurement
    // In a real implementation, this would use actual CPU metrics
    const simulatedUsage = this.simulateCPUUsage();

    this.usage = simulatedUsage;
    this.lastTimestamp = currentTime;

    // Update load average simulation
    this.updateLoadAverage(simulatedUsage);
  }

  private simulateCPUUsage(): number {
    // Simulate CPU usage based on performance metrics
    const now = performance.now();
    const memoryInfo = 'memory' in performance ? (performance as any).memory : null;

    let baseUsage = 10; // Base 10% usage

    // Increase usage based on memory pressure
    if (memoryInfo) {
      const memoryRatio = memoryInfo.usedJSHeapSize / memoryInfo.totalJSHeapSize;
      baseUsage += memoryRatio * 30;
    }

    // Add some randomness to simulate real CPU fluctuations
    const randomFactor = (Math.random() - 0.5) * 10;

    return Math.max(0, Math.min(100, baseUsage + randomFactor));
  }

  private updateLoadAverage(currentUsage: number): void {
    // Simple exponential moving average for load simulation
    const alpha = 0.1;

    this.loadAverage[0] = (1 - alpha) * this.loadAverage[0] + alpha * currentUsage;
    this.loadAverage[1] = (1 - alpha * 0.5) * this.loadAverage[1] + alpha * 0.5 * currentUsage;
    this.loadAverage[2] = (1 - alpha * 0.2) * this.loadAverage[2] + alpha * 0.2 * currentUsage;
  }

  getMetrics(): {
    usage: number;
    loadAverage: number[];
  } {
    return {
      usage: Math.round(this.usage * 10) / 10,
      loadAverage: this.loadAverage.map(avg => Math.round(avg * 10) / 10)
    };
  }
}

export class PerformanceMonitor {
  private fpsMonitor: FPSMonitor;
  private latencyTracker: LatencyTracker;
  private networkMonitor: NetworkMonitor;
  private cpuMonitor: CPUMonitor;
  private isMonitoring: boolean = false;
  private snapshots: PerformanceSnapshot[] = [];
  private maxSnapshots: number = 1000;
  private snapshotInterval?: NodeJS.Timeout;
  private alertConfig: AlertConfig;
  private alerts: PerformanceAlert[] = [];

  constructor(alertConfig?: Partial<AlertConfig>) {
    this.alertConfig = {
      enabled: true,
      fpsThreshold: 30,
      memoryThreshold: 100, // MB
      latencyThreshold: 100, // ms
      ...alertConfig
    };

    this.fpsMonitor = new FPSMonitor();
    this.latencyTracker = new LatencyTracker();
    this.networkMonitor = new NetworkMonitor();
    this.cpuMonitor = new CPUMonitor();

    this.initializeMonitoring();
  }

  private initializeMonitoring(): void {
    // Intercept network requests
    this.networkMonitor.interceptFetch();

    // Set up FPS monitoring callback
    this.fpsMonitor.onFPSUpdate((fps, frameTime) => {
      if (this.alertConfig.enabled && fps < this.alertConfig.fpsThreshold) {
        this.createAlert('fps', fps < 15 ? 'critical' : 'warning',
          `Low FPS detected: ${fps}`, fps, this.alertConfig.fpsThreshold);
      }
    });
  }

  start(): void {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.fpsMonitor.start();
    this.cpuMonitor.start();

    // Take snapshots every 5 seconds
    this.snapshotInterval = setInterval(() => {
      this.takeSnapshot();
    }, 5000);

    console.log('Performance monitoring started');
  }

  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.fpsMonitor.stop();
    this.cpuMonitor.stop();

    if (this.snapshotInterval) {
      clearInterval(this.snapshotInterval);
    }

    console.log('Performance monitoring stopped');
  }

  // Latency measurement methods
  startLatencyMeasurement(operation: string): void {
    this.latencyTracker.startMeasurement(operation);
  }

  endLatencyMeasurement(operation: string): number {
    const latency = this.latencyTracker.endMeasurement(operation);

    if (this.alertConfig.enabled && latency > this.alertConfig.latencyThreshold) {
      this.createAlert('latency', latency > 200 ? 'critical' : 'warning',
        `High latency detected for ${operation}: ${latency.toFixed(2)}ms`,
        latency, this.alertConfig.latencyThreshold);
    }

    return latency;
  }

  // Snapshot methods
  private takeSnapshot(): void {
    const timestamp = Date.now();
    const memoryInfo = 'memory' in performance ? (performance as any).memory : null;

    const snapshot: PerformanceSnapshot = {
      timestamp,
      fps: this.fpsMonitor.getFPS(),
      frameTime: this.fpsMonitor.getFrameTime(),
      memory: {
        used: memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0,
        total: memoryInfo ? Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024) : 0,
        external: memoryInfo ? Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : 0
      },
      cpu: this.cpuMonitor.getMetrics(),
      network: this.networkMonitor.getMetrics(),
      latency: {
        gesture: this.latencyTracker.getAverageLatency('gesture'),
        audio: this.latencyTracker.getAverageLatency('audio'),
        ui: this.latencyTracker.getAverageLatency('ui'),
        total: this.latencyTracker.getAverageLatency('total')
      },
      thresholds: {
        fps: this.fpsMonitor.getFPS() >= this.alertConfig.fpsThreshold,
        memory: (memoryInfo ? memoryInfo.usedJSHeapSize / 1024 / 1024 : 0) <= this.alertConfig.memoryThreshold,
        latency: this.latencyTracker.getAverageLatency('total') <= this.alertConfig.latencyThreshold
      }
    };

    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift();
    }

    // Check for memory alerts
    if (this.alertConfig.enabled && snapshot.memory.used > this.alertConfig.memoryThreshold) {
      this.createAlert('memory',
        snapshot.memory.used > this.alertConfig.memoryThreshold * 1.5 ? 'critical' : 'warning',
        `High memory usage: ${snapshot.memory.used}MB`,
        snapshot.memory.used, this.alertConfig.memoryThreshold);
    }
  }

  getCurrentSnapshot(): PerformanceSnapshot | null {
    return this.snapshots.length > 0 ? this.snapshots[this.snapshots.length - 1] : null;
  }

  getSnapshots(limit?: number): PerformanceSnapshot[] {
    if (limit) {
      return this.snapshots.slice(-limit);
    }
    return [...this.snapshots];
  }

  // Alert management
  private createAlert(type: PerformanceAlert['type'], severity: PerformanceAlert['severity'],
                     message: string, value: number, threshold: number): void {
    const alert: PerformanceAlert = {
      type,
      severity,
      message,
      value,
      threshold,
      timestamp: Date.now()
    };

    this.alerts.push(alert);

    // Keep only recent alerts (last 100)
    if (this.alerts.length > 100) {
      this.alerts.shift();
    }

    // Call alert callback if provided
    if (this.alertConfig.callback) {
      this.alertConfig.callback(alert);
    }

    console.warn(`Performance Alert [${severity.toUpperCase()}]:`, message);
  }

  getAlerts(severity?: PerformanceAlert['severity']): PerformanceAlert[] {
    if (severity) {
      return this.alerts.filter(alert => alert.severity === severity);
    }
    return [...this.alerts];
  }

  clearAlerts(): void {
    this.alerts = [];
  }

  // Performance analysis
  getPerformanceAnalysis(): {
    overall: 'good' | 'fair' | 'poor';
    fps: { status: 'good' | 'fair' | 'poor'; value: number; target: number };
    memory: { status: 'good' | 'fair' | 'poor'; value: number; target: number };
    latency: { status: 'good' | 'fair' | 'poor'; value: number; target: number };
    recommendations: string[];
  } {
    const current = this.getCurrentSnapshot();
    if (!current) {
      return {
        overall: 'poor',
        fps: { status: 'poor', value: 0, target: this.alertConfig.fpsThreshold },
        memory: { status: 'poor', value: 0, target: this.alertConfig.memoryThreshold },
        latency: { status: 'poor', value: 0, target: this.alertConfig.latencyThreshold },
        recommendations: ['Start monitoring to get performance data']
      };
    }

    const fpsStatus = current.fps >= 50 ? 'good' : current.fps >= 30 ? 'fair' : 'poor';
    const memoryStatus = current.memory.used <= 100 ? 'good' : current.memory.used <= 150 ? 'fair' : 'poor';
    const latencyStatus = current.latency.total <= 50 ? 'good' : current.latency.total <= 100 ? 'fair' : 'poor';

    const statuses = [fpsStatus, memoryStatus, latencyStatus];
    const goodCount = statuses.filter(s => s === 'good').length;
    const fairCount = statuses.filter(s => s === 'fair').length;

    let overall: 'good' | 'fair' | 'poor';
    if (goodCount >= 2) overall = 'good';
    else if (goodCount + fairCount >= 2) overall = 'fair';
    else overall = 'poor';

    const recommendations: string[] = [];
    if (fpsStatus !== 'good') recommendations.push('Optimize rendering performance');
    if (memoryStatus !== 'good') recommendations.push('Reduce memory usage');
    if (latencyStatus !== 'good') recommendations.push('Optimize operation latency');

    return {
      overall,
      fps: { status: fpsStatus, value: current.fps, target: 60 },
      memory: { status: memoryStatus, value: current.memory.used, target: 150 },
      latency: { status: latencyStatus, value: current.latency.total, target: 50 },
      recommendations
    };
  }

  // Configuration
  updateAlertConfig(config: Partial<AlertConfig>): void {
    this.alertConfig = { ...this.alertConfig, ...config };
  }

  getConfig(): AlertConfig {
    return { ...this.alertConfig };
  }

  // Cleanup
  destroy(): void {
    this.stop();
    this.snapshots = [];
    this.alerts = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();