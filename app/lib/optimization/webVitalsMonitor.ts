/**
 * Web Vitals Monitor for OX Board AI Enhancement
 *
 * Comprehensive Web Vitals monitoring with Core Web Vitals tracking,
 * custom metrics for audio/gesture performance, and real user monitoring.
 */

export interface WebVitalsMetrics {
  // Core Web Vitals
  LCP: number; // Largest Contentful Paint
  FID: number; // First Input Delay
  CLS: number; // Cumulative Layout Shift

  // Additional Web Vitals
  FCP: number; // First Contentful Paint
  TTFB: number; // Time to First Byte

  // Custom metrics
  gestureLatency: number;
  audioLatency: number;
  memoryUsage: number;
  frameRate: number;
}

export interface WebVitalsConfig {
  enabled: boolean;
  reportToConsole: boolean;
  reportToAnalytics: boolean;
  analyticsEndpoint?: string;
  customMetrics: boolean;
  thresholds: {
    LCP: number; // ms
    FID: number; // ms
    CLS: number;
    FCP: number; // ms
    gestureLatency: number; // ms
    audioLatency: number; // ms
  };
}

export interface WebVitalsReport {
  timestamp: number;
  url: string;
  userAgent: string;
  metrics: WebVitalsMetrics;
  connection: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  device: {
    memory: number;
    hardwareConcurrency: number;
  };
}

class CoreWebVitalsTracker {
  private observers: PerformanceObserver[] = [];
  private metrics: Partial<WebVitalsMetrics> = {};
  private config: WebVitalsConfig;

  constructor(config: WebVitalsConfig) {
    this.config = config;
  }

  startTracking(): void {
    if (!this.config.enabled) return;

    this.trackLCP();
    this.trackFID();
    this.trackCLS();
    this.trackFCP();
    this.trackTTFB();
    this.trackNavigationTiming();
  }

  stopTracking(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }

  private trackLCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as any;

        if (lastEntry) {
          this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
          if (this.metrics.LCP) {
            this.checkThreshold("LCP", this.metrics.LCP);
          }

          if (this.config.reportToConsole) {
            console.log(`LCP: ${this.metrics.LCP}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ["largest-contentful-paint"] });
      this.observers.push(observer);
    } catch (error) {
      console.warn("LCP tracking not supported:", error);
    }
  }

  private trackFID(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          this.metrics.FID = entry.processingStart - entry.startTime;
          this.checkThreshold("FID", this.metrics.FID);

          if (this.config.reportToConsole) {
            console.log(`FID: ${this.metrics.FID}ms`);
          }
        });
      });

      observer.observe({ entryTypes: ["first-input"] });
      this.observers.push(observer);
    } catch (error) {
      console.warn("FID tracking not supported:", error);
    }
  }

  private trackCLS(): void {
    let clsValue = 0;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            this.metrics.CLS = clsValue;
            this.checkThreshold("CLS", clsValue);

            if (this.config.reportToConsole) {
              console.log(`CLS: ${clsValue}`);
            }
          }
        });
      });

      observer.observe({ entryTypes: ["layout-shift"] });
      this.observers.push(observer);
    } catch (error) {
      console.warn("CLS tracking not supported:", error);
    }
  }

  private trackFCP(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const paintEntry = entries.find(
          (entry) => entry.name === "first-contentful-paint",
        ) as any;

        if (paintEntry) {
          this.metrics.FCP = paintEntry.startTime;
          if (this.metrics.FCP) {
            this.checkThreshold("FCP", this.metrics.FCP);
          }

          if (this.config.reportToConsole) {
            console.log(`FCP: ${this.metrics.FCP}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ["paint"] });
      this.observers.push(observer);
    } catch (error) {
      console.warn("FCP tracking not supported:", error);
    }
  }

  private trackTTFB(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const navigationEntry = entries.find(
          (entry) => entry.entryType === "navigation",
        ) as any;

        if (navigationEntry) {
          this.metrics.TTFB =
            navigationEntry.responseStart - navigationEntry.requestStart;

          if (this.config.reportToConsole) {
            console.log(`TTFB: ${this.metrics.TTFB}ms`);
          }
        }
      });

      observer.observe({ entryTypes: ["navigation"] });
      this.observers.push(observer);
    } catch (error) {
      console.warn("TTFB tracking not supported:", error);
    }
  }

  private trackNavigationTiming(): void {
    // Fallback for browsers that don't support PerformanceObserver
    if (
      typeof window !== "undefined" &&
      "performance" in window &&
      "timing" in performance
    ) {
      const timing = (performance as any).timing;

      if (timing.loadEventEnd > 0) {
        this.metrics.TTFB = timing.responseStart - timing.requestStart;
        this.metrics.FCP = timing.responseEnd - timing.navigationStart;
      }
    }
  }

  private checkThreshold(
    metric: keyof WebVitalsConfig["thresholds"],
    value: number,
  ): void {
    const threshold = this.config.thresholds[metric];
    if (threshold && value > threshold) {
      console.warn(
        `Web Vitals Alert: ${metric} threshold exceeded. Value: ${value}, Threshold: ${threshold}`,
      );
    }
  }

  getMetrics(): Partial<WebVitalsMetrics> {
    return { ...this.metrics };
  }
}

class CustomMetricsTracker {
  private metrics: Partial<WebVitalsMetrics> = {};
  private config: WebVitalsConfig;

  constructor(config: WebVitalsConfig) {
    this.config = config;
  }

  recordGestureLatency(latency: number): void {
    this.metrics.gestureLatency = latency;
    this.checkThreshold("gestureLatency", latency);

    if (this.config.reportToConsole) {
      console.log(`Gesture Latency: ${latency}ms`);
    }
  }

  recordAudioLatency(latency: number): void {
    this.metrics.audioLatency = latency;
    this.checkThreshold("audioLatency", latency);

    if (this.config.reportToConsole) {
      console.log(`Audio Latency: ${latency}ms`);
    }
  }

  recordMemoryUsage(usage: number): void {
    this.metrics.memoryUsage = usage;

    if (this.config.reportToConsole) {
      console.log(`Memory Usage: ${usage}MB`);
    }
  }

  recordFrameRate(fps: number): void {
    this.metrics.frameRate = fps;

    if (this.config.reportToConsole) {
      console.log(`Frame Rate: ${fps}fps`);
    }
  }

  private checkThreshold(
    metric: keyof WebVitalsConfig["thresholds"],
    value: number,
  ): void {
    const threshold = this.config.thresholds[metric];
    if (value > threshold) {
      console.warn(
        `Custom Metrics Alert: ${metric} threshold exceeded. Value: ${value}, Threshold: ${threshold}`,
      );
    }
  }

  getMetrics(): Partial<WebVitalsMetrics> {
    return { ...this.metrics };
  }
}

class AnalyticsReporter {
  private config: WebVitalsConfig;
  private reportsQueue: WebVitalsReport[] = [];

  constructor(config: WebVitalsConfig) {
    this.config = config;
  }

  generateReport(metrics: WebVitalsMetrics): WebVitalsReport {
    const connection = this.getConnectionInfo();
    const device = this.getDeviceInfo();

    return {
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metrics,
      connection,
      device,
    };
  }

  private getConnectionInfo() {
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      return {
        effectiveType: connection.effectiveType || "unknown",
        downlink: connection.downlink || 0,
        rtt: connection.rtt || 0,
      };
    }

    return {
      effectiveType: "unknown",
      downlink: 0,
      rtt: 0,
    };
  }

  private getDeviceInfo() {
    if ("deviceMemory" in navigator && "hardwareConcurrency" in navigator) {
      return {
        memory: (navigator as any).deviceMemory || 0,
        hardwareConcurrency: navigator.hardwareConcurrency || 0,
      };
    }

    return {
      memory: 0,
      hardwareConcurrency: 0,
    };
  }

  async sendReport(report: WebVitalsReport): Promise<void> {
    if (!this.config.reportToAnalytics || !this.config.analyticsEndpoint) {
      return;
    }

    try {
      await fetch(this.config.analyticsEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(report),
      });

      if (this.config.reportToConsole) {
        console.log("Web Vitals report sent:", report);
      }
    } catch (error) {
      console.error("Failed to send Web Vitals report:", error);
      // Queue for retry if offline
      this.reportsQueue.push(report);
    }
  }

  processQueue(): void {
    if (this.reportsQueue.length === 0) return;

    // Process queued reports
    const reportsToSend = [...this.reportsQueue];
    this.reportsQueue = [];

    reportsToSend.forEach((report) => this.sendReport(report));
  }
}

export class WebVitalsMonitor {
  private config: WebVitalsConfig;
  private coreTracker: CoreWebVitalsTracker;
  private customTracker: CustomMetricsTracker;
  private analyticsReporter: AnalyticsReporter;
  private isMonitoring: boolean = false;
  private reportInterval?: NodeJS.Timeout;

  constructor(config: Partial<WebVitalsConfig> = {}) {
    this.config = {
      enabled: true,
      reportToConsole: true,
      reportToAnalytics: false,
      customMetrics: true,
      thresholds: {
        LCP: 2500,
        FID: 100,
        CLS: 0.1,
        FCP: 1800,
        gestureLatency: 50,
        audioLatency: 10,
      },
      ...config,
    };

    this.coreTracker = new CoreWebVitalsTracker(this.config);
    this.customTracker = new CustomMetricsTracker(this.config);
    this.analyticsReporter = new AnalyticsReporter(this.config);
  }

  start(): void {
    if (this.isMonitoring || !this.config.enabled) return;

    this.isMonitoring = true;
    this.coreTracker.startTracking();

    // Send periodic reports
    if (this.config.reportToAnalytics) {
      this.reportInterval = setInterval(() => {
        this.generateAndSendReport();
      }, 30000); // Every 30 seconds
    }

    console.log("Web Vitals monitoring started");
  }

  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    this.coreTracker.stopTracking();

    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }

    console.log("Web Vitals monitoring stopped");
  }

  // Custom metrics recording
  recordGestureLatency(latency: number): void {
    this.customTracker.recordGestureLatency(latency);
  }

  recordAudioLatency(latency: number): void {
    this.customTracker.recordAudioLatency(latency);
  }

  recordMemoryUsage(usage: number): void {
    this.customTracker.recordMemoryUsage(usage);
  }

  recordFrameRate(fps: number): void {
    this.customTracker.recordFrameRate(fps);
  }

  // Get current metrics
  getMetrics(): WebVitalsMetrics {
    const coreMetrics = this.coreTracker.getMetrics();
    const customMetrics = this.customTracker.getMetrics();

    return {
      LCP: coreMetrics.LCP || 0,
      FID: coreMetrics.FID || 0,
      CLS: coreMetrics.CLS || 0,
      FCP: coreMetrics.FCP || 0,
      TTFB: coreMetrics.TTFB || 0,
      gestureLatency: customMetrics.gestureLatency || 0,
      audioLatency: customMetrics.audioLatency || 0,
      memoryUsage: customMetrics.memoryUsage || 0,
      frameRate: customMetrics.frameRate || 0,
    };
  }

  // Analytics reporting
  private async generateAndSendReport(): Promise<void> {
    const metrics = this.getMetrics();

    // Only send report if we have meaningful data
    if (metrics.LCP > 0 || metrics.gestureLatency > 0) {
      const report = this.analyticsReporter.generateReport(metrics);
      await this.analyticsReporter.sendReport(report);
    }

    // Process any queued reports
    this.analyticsReporter.processQueue();
  }

  async sendImmediateReport(): Promise<void> {
    await this.generateAndSendReport();
  }

  // Configuration
  updateConfig(config: Partial<WebVitalsConfig>): void {
    this.config = { ...this.config, ...config };

    // Update trackers with new config
    this.coreTracker = new CoreWebVitalsTracker(this.config);
    this.customTracker = new CustomMetricsTracker(this.config);
    this.analyticsReporter = new AnalyticsReporter(this.config);

    if (this.isMonitoring) {
      this.stop();
      this.start();
    }
  }

  getConfig(): WebVitalsConfig {
    return { ...this.config };
  }

  // Performance analysis
  getPerformanceScore(): {
    overall: "good" | "needs-improvement" | "poor";
    coreWebVitals: "good" | "needs-improvement" | "poor";
    customMetrics: "good" | "needs-improvement" | "poor";
    recommendations: string[];
  } {
    const metrics = this.getMetrics();
    const recommendations: string[] = [];

    // Core Web Vitals scoring (Google's definition)
    const lcpScore =
      metrics.LCP <= 2500
        ? "good"
        : metrics.LCP <= 4000
          ? "needs-improvement"
          : "poor";
    const fidScore =
      metrics.FID <= 100
        ? "good"
        : metrics.FID <= 300
          ? "needs-improvement"
          : "poor";
    const clsScore =
      metrics.CLS <= 0.1
        ? "good"
        : metrics.CLS <= 0.25
          ? "needs-improvement"
          : "poor";

    const coreWebVitalsScores = [lcpScore, fidScore, clsScore];
    const goodCount = coreWebVitalsScores.filter(
      (score) => score === "good",
    ).length;

    let coreWebVitals: "good" | "needs-improvement" | "poor";
    if (goodCount >= 2) coreWebVitals = "good";
    else if (goodCount >= 1) coreWebVitals = "needs-improvement";
    else coreWebVitals = "poor";

    // Custom metrics scoring
    const gestureScore =
      metrics.gestureLatency <= 50
        ? "good"
        : metrics.gestureLatency <= 100
          ? "needs-improvement"
          : "poor";
    const audioScore =
      metrics.audioLatency <= 10
        ? "good"
        : metrics.audioLatency <= 25
          ? "needs-improvement"
          : "poor";
    const frameRateScore =
      metrics.frameRate >= 50
        ? "good"
        : metrics.frameRate >= 30
          ? "needs-improvement"
          : "poor";

    const customScores = [gestureScore, audioScore, frameRateScore];
    const customGoodCount = customScores.filter(
      (score) => score === "good",
    ).length;

    let customMetrics: "good" | "needs-improvement" | "poor";
    if (customGoodCount >= 2) customMetrics = "good";
    else if (customGoodCount >= 1) customMetrics = "needs-improvement";
    else customMetrics = "poor";

    // Overall score
    const overall =
      coreWebVitals === "good" && customMetrics === "good"
        ? "good"
        : coreWebVitals === "poor" || customMetrics === "poor"
          ? "poor"
          : "needs-improvement";

    // Generate recommendations
    if (lcpScore !== "good")
      recommendations.push(
        "Optimize Largest Contentful Paint by reducing server response times and resource load times",
      );
    if (fidScore !== "good")
      recommendations.push(
        "Reduce First Input Delay by minimizing JavaScript execution time",
      );
    if (clsScore !== "good")
      recommendations.push(
        "Minimize Cumulative Layout Shift by including size attributes and avoiding dynamic content insertion",
      );
    if (gestureScore !== "good")
      recommendations.push(
        "Optimize gesture recognition latency by reducing processing time",
      );
    if (audioScore !== "good")
      recommendations.push(
        "Reduce audio latency by optimizing audio buffer sizes and processing",
      );
    if (frameRateScore !== "good")
      recommendations.push(
        "Improve frame rate by optimizing rendering performance",
      );

    return {
      overall,
      coreWebVitals,
      customMetrics,
      recommendations,
    };
  }

  destroy(): void {
    this.stop();
  }
}

// Singleton instance
export const webVitalsMonitor = new WebVitalsMonitor();
