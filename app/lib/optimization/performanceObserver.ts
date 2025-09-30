/**
 * Performance Observer Integration for OX Board AI Enhancement
 *
 * Advanced performance monitoring with Long Task detection,
 * paint timing and input delays tracking, resource timing for optimization,
 * and performance budget enforcement.
 */

export interface PerformanceBudget {
  maxLongTaskDuration: number; // ms
  maxInputDelay: number; // ms
  maxLayoutShifts: number;
  maxResourceLoadTime: number; // ms
  maxScriptExecutionTime: number; // ms
}

export interface PerformanceObserverConfig {
  enabled: boolean;
  budgets: PerformanceBudget;
  trackLongTasks: boolean;
  trackPaintTiming: boolean;
  trackInputDelay: boolean;
  trackResourceTiming: boolean;
  trackLayoutShifts: boolean;
  trackScriptExecution: boolean;
  onBudgetExceeded?: (violation: BudgetViolation) => void;
  onPerformanceIssue?: (issue: PerformanceIssue) => void;
}

export interface BudgetViolation {
  type:
    | "long-task"
    | "input-delay"
    | "layout-shift"
    | "resource-load"
    | "script-execution";
  value: number;
  threshold: number;
  timestamp: number;
  details: any;
}

export interface PerformanceIssue {
  type:
    | "blocking-operation"
    | "slow-resource"
    | "excessive-layout-shifts"
    | "high-input-delay";
  severity: "low" | "medium" | "high";
  message: string;
  timestamp: number;
  duration?: number;
  affectedResources?: string[];
}

export interface PerformanceMetrics {
  longTasks: Array<{
    duration: number;
    startTime: number;
    endTime: number;
    attribution: string[];
  }>;
  paintTimings: Array<{
    name: string;
    startTime: number;
  }>;
  inputDelays: Array<{
    delay: number;
    timestamp: number;
    inputType: string;
  }>;
  resourceTimings: Array<{
    name: string;
    duration: number;
    startTime: number;
    responseEnd: number;
    transferSize: number;
  }>;
  layoutShifts: Array<{
    value: number;
    timestamp: number;
    hadRecentInput: boolean;
  }>;
  scriptExecutions: Array<{
    duration: number;
    startTime: number;
    name: string;
  }>;
}

class LongTaskDetector {
  private observer?: PerformanceObserver;
  private longTasks: PerformanceMetrics["longTasks"] = [];
  private config: PerformanceBudget;
  private callbacks: Array<(task: PerformanceMetrics["longTasks"][0]) => void> =
    [];

  constructor(config: PerformanceBudget) {
    this.config = config;
  }

  start(): void {
    if (typeof PerformanceObserver === "undefined") return;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "longtask") {
            const longTask = {
              duration: entry.duration,
              startTime: entry.startTime,
              endTime: entry.startTime + entry.duration,
              attribution: this.getAttribution(entry as any),
            };

            this.longTasks.push(longTask);
            this.notifyCallbacks(longTask);

            // Check budget
            if (entry.duration > this.config.maxLongTaskDuration) {
              this.reportBudgetViolation(
                "long-task",
                entry.duration,
                this.config.maxLongTaskDuration,
                {
                  startTime: entry.startTime,
                  endTime: entry.startTime + entry.duration,
                  attribution: longTask.attribution,
                },
              );
            }
          }
        }
      });

      this.observer.observe({ entryTypes: ["longtask"] });
      console.log("Long task detection started");
    } catch (error) {
      console.warn("Long task detection not supported:", error);
    }
  }

  private getAttribution(entry: any): string[] {
    const attribution: string[] = [];

    if (entry.attribution) {
      for (const attr of entry.attribution) {
        if (attr.name) attribution.push(attr.name);
      }
    }

    return attribution;
  }

  private notifyCallbacks(task: PerformanceMetrics["longTasks"][0]): void {
    this.callbacks.forEach((callback) => callback(task));
  }

  onLongTask(
    callback: (task: PerformanceMetrics["longTasks"][0]) => void,
  ): void {
    this.callbacks.push(callback);
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
    this.callbacks = [];
  }

  getLongTasks(): PerformanceMetrics["longTasks"] {
    return [...this.longTasks];
  }

  private reportBudgetViolation(
    type: BudgetViolation["type"],
    value: number,
    threshold: number,
    details: any,
  ): void {
    const violation: BudgetViolation = {
      type,
      value,
      threshold,
      timestamp: Date.now(),
      details,
    };

    // Notify global handler
    if (
      typeof window !== "undefined" &&
      (window as any).performanceBudgetViolation
    ) {
      (window as any).performanceBudgetViolation(violation);
    }
  }
}

class PaintTimingTracker {
  private observer?: PerformanceObserver;
  private paintTimings: PerformanceMetrics["paintTimings"] = [];
  private callbacks: Array<
    (timing: PerformanceMetrics["paintTimings"][0]) => void
  > = [];

  start(): void {
    if (typeof PerformanceObserver === "undefined") return;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "paint") {
            const paintTiming = {
              name: entry.name,
              startTime: entry.startTime,
            };

            this.paintTimings.push(paintTiming);
            this.notifyCallbacks(paintTiming);
          }
        }
      });

      this.observer.observe({ entryTypes: ["paint"] });
      console.log("Paint timing tracking started");
    } catch (error) {
      console.warn("Paint timing tracking not supported:", error);
    }
  }

  private notifyCallbacks(timing: PerformanceMetrics["paintTimings"][0]): void {
    this.callbacks.forEach((callback) => callback(timing));
  }

  onPaint(
    callback: (timing: PerformanceMetrics["paintTimings"][0]) => void,
  ): void {
    this.callbacks.push(callback);
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
    this.callbacks = [];
  }

  getPaintTimings(): PerformanceMetrics["paintTimings"] {
    return [...this.paintTimings];
  }
}

class InputDelayMonitor {
  private observer?: PerformanceObserver;
  private inputDelays: PerformanceMetrics["inputDelays"] = [];
  private config: PerformanceBudget;
  private callbacks: Array<
    (delay: PerformanceMetrics["inputDelays"][0]) => void
  > = [];

  constructor(config: PerformanceBudget) {
    this.config = config;
  }

  start(): void {
    if (typeof PerformanceObserver === "undefined") return;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "first-input") {
            const inputDelay = {
              delay: (entry as any).processingStart - entry.startTime,
              timestamp: entry.startTime,
              inputType: (entry as any).name || "unknown",
            };

            this.inputDelays.push(inputDelay);
            this.notifyCallbacks(inputDelay);

            // Check budget
            if (inputDelay.delay > this.config.maxInputDelay) {
              this.reportBudgetViolation(
                "input-delay",
                inputDelay.delay,
                this.config.maxInputDelay,
                {
                  inputType: inputDelay.inputType,
                  timestamp: inputDelay.timestamp,
                },
              );
            }
          }
        }
      });

      this.observer.observe({ entryTypes: ["first-input"] });
      console.log("Input delay monitoring started");
    } catch (error) {
      console.warn("Input delay monitoring not supported:", error);
    }
  }

  private notifyCallbacks(delay: PerformanceMetrics["inputDelays"][0]): void {
    this.callbacks.forEach((callback) => callback(delay));
  }

  onInputDelay(
    callback: (delay: PerformanceMetrics["inputDelays"][0]) => void,
  ): void {
    this.callbacks.push(callback);
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
    this.callbacks = [];
  }

  getInputDelays(): PerformanceMetrics["inputDelays"] {
    return [...this.inputDelays];
  }

  private reportBudgetViolation(
    type: BudgetViolation["type"],
    value: number,
    threshold: number,
    details: any,
  ): void {
    const violation: BudgetViolation = {
      type,
      value,
      threshold,
      timestamp: Date.now(),
      details,
    };

    if (
      typeof window !== "undefined" &&
      (window as any).performanceBudgetViolation
    ) {
      (window as any).performanceBudgetViolation(violation);
    }
  }
}

class ResourceTimingAnalyzer {
  private observer?: PerformanceObserver;
  private resourceTimings: PerformanceMetrics["resourceTimings"] = [];
  private config: PerformanceBudget;
  private callbacks: Array<
    (resource: PerformanceMetrics["resourceTimings"][0]) => void
  > = [];

  constructor(config: PerformanceBudget) {
    this.config = config;
  }

  start(): void {
    if (typeof PerformanceObserver === "undefined") return;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "resource") {
            const resourceEntry = entry as PerformanceResourceTiming;
            const resourceTiming = {
              name: resourceEntry.name,
              duration: resourceEntry.duration,
              startTime: resourceEntry.startTime,
              responseEnd: resourceEntry.responseEnd,
              transferSize: resourceEntry.transferSize || 0,
            };

            this.resourceTimings.push(resourceTiming);
            this.notifyCallbacks(resourceTiming);

            // Check budget
            if (entry.duration > this.config.maxResourceLoadTime) {
              this.reportBudgetViolation(
                "resource-load",
                entry.duration,
                this.config.maxResourceLoadTime,
                {
                  name: entry.name,
                  startTime: entry.startTime,
                },
              );
            }
          }
        }
      });

      this.observer.observe({ entryTypes: ["resource"] });
      console.log("Resource timing analysis started");
    } catch (error) {
      console.warn("Resource timing analysis not supported:", error);
    }
  }

  private notifyCallbacks(
    resource: PerformanceMetrics["resourceTimings"][0],
  ): void {
    this.callbacks.forEach((callback) => callback(resource));
  }

  onResourceLoad(
    callback: (resource: PerformanceMetrics["resourceTimings"][0]) => void,
  ): void {
    this.callbacks.push(callback);
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
    this.callbacks = [];
  }

  getResourceTimings(): PerformanceMetrics["resourceTimings"] {
    return [...this.resourceTimings];
  }

  getSlowResources(threshold?: number): PerformanceMetrics["resourceTimings"] {
    const limit = threshold || this.config.maxResourceLoadTime;
    return this.resourceTimings.filter((resource) => resource.duration > limit);
  }

  private reportBudgetViolation(
    type: BudgetViolation["type"],
    value: number,
    threshold: number,
    details: any,
  ): void {
    const violation: BudgetViolation = {
      type,
      value,
      threshold,
      timestamp: Date.now(),
      details,
    };

    if (
      typeof window !== "undefined" &&
      (window as any).performanceBudgetViolation
    ) {
      (window as any).performanceBudgetViolation(violation);
    }
  }
}

class LayoutShiftMonitor {
  private observer?: PerformanceObserver;
  private layoutShifts: PerformanceMetrics["layoutShifts"] = [];
  private config: PerformanceBudget;
  private callbacks: Array<
    (shift: PerformanceMetrics["layoutShifts"][0]) => void
  > = [];
  private totalLayoutShift = 0;

  constructor(config: PerformanceBudget) {
    this.config = config;
  }

  start(): void {
    if (typeof PerformanceObserver === "undefined") return;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (
            entry.entryType === "layout-shift" &&
            !(entry as any).hadRecentInput
          ) {
            const layoutShift = {
              value: (entry as any).value || 0,
              timestamp: entry.startTime,
              hadRecentInput: (entry as any).hadRecentInput || false,
            };

            this.layoutShifts.push(layoutShift);
            this.totalLayoutShift += layoutShift.value;
            this.notifyCallbacks(layoutShift);

            // Check budget
            if (this.totalLayoutShift > this.config.maxLayoutShifts) {
              this.reportBudgetViolation(
                "layout-shift",
                this.totalLayoutShift,
                this.config.maxLayoutShifts,
                {
                  currentValue: this.totalLayoutShift,
                  shiftCount: this.layoutShifts.length,
                },
              );
            }
          }
        }
      });

      this.observer.observe({ entryTypes: ["layout-shift"] });
      console.log("Layout shift monitoring started");
    } catch (error) {
      console.warn("Layout shift monitoring not supported:", error);
    }
  }

  private notifyCallbacks(shift: PerformanceMetrics["layoutShifts"][0]): void {
    this.callbacks.forEach((callback) => callback(shift));
  }

  onLayoutShift(
    callback: (shift: PerformanceMetrics["layoutShifts"][0]) => void,
  ): void {
    this.callbacks.push(callback);
  }

  stop(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = undefined;
    }
    this.callbacks = [];
  }

  getLayoutShifts(): PerformanceMetrics["layoutShifts"] {
    return [...this.layoutShifts];
  }

  getTotalLayoutShift(): number {
    return this.totalLayoutShift;
  }

  private reportBudgetViolation(
    type: BudgetViolation["type"],
    value: number,
    threshold: number,
    details: any,
  ): void {
    const violation: BudgetViolation = {
      type,
      value,
      threshold,
      timestamp: Date.now(),
      details,
    };

    if (
      typeof window !== "undefined" &&
      (window as any).performanceBudgetViolation
    ) {
      (window as any).performanceBudgetViolation(violation);
    }
  }
}

export class PerformanceObserverManager {
  private config: PerformanceObserverConfig;
  private longTaskDetector: LongTaskDetector;
  private paintTimingTracker: PaintTimingTracker;
  private inputDelayMonitor: InputDelayMonitor;
  private resourceTimingAnalyzer: ResourceTimingAnalyzer;
  private layoutShiftMonitor: LayoutShiftMonitor;
  private isMonitoring = false;
  private metrics: PerformanceMetrics = {
    longTasks: [],
    paintTimings: [],
    inputDelays: [],
    resourceTimings: [],
    layoutShifts: [],
    scriptExecutions: [],
  };

  constructor(config: Partial<PerformanceObserverConfig> = {}) {
    this.config = {
      enabled: true,
      budgets: {
        maxLongTaskDuration: 50, // ms
        maxInputDelay: 100, // ms
        maxLayoutShifts: 0.1,
        maxResourceLoadTime: 2000, // ms
        maxScriptExecutionTime: 100, // ms
      },
      trackLongTasks: true,
      trackPaintTiming: true,
      trackInputDelay: true,
      trackResourceTiming: true,
      trackLayoutShifts: true,
      trackScriptExecution: false,
      ...config,
    };

    this.longTaskDetector = new LongTaskDetector(this.config.budgets);
    this.paintTimingTracker = new PaintTimingTracker();
    this.inputDelayMonitor = new InputDelayMonitor(this.config.budgets);
    this.resourceTimingAnalyzer = new ResourceTimingAnalyzer(
      this.config.budgets,
    );
    this.layoutShiftMonitor = new LayoutShiftMonitor(this.config.budgets);
  }

  start(): void {
    if (this.isMonitoring || !this.config.enabled) return;

    this.isMonitoring = true;

    // Start all enabled monitors
    if (this.config.trackLongTasks) {
      this.longTaskDetector.start();
      this.longTaskDetector.onLongTask((task) => {
        this.metrics.longTasks.push(task);
        this.handlePerformanceIssue({
          type: "blocking-operation",
          severity:
            task.duration > 100
              ? "high"
              : task.duration > 50
                ? "medium"
                : "low",
          message: `Long task detected: ${task.duration.toFixed(2)}ms`,
          timestamp: Date.now(),
          duration: task.duration,
        });
      });
    }

    if (this.config.trackPaintTiming) {
      this.paintTimingTracker.start();
      this.paintTimingTracker.onPaint((timing) => {
        this.metrics.paintTimings.push(timing);
      });
    }

    if (this.config.trackInputDelay) {
      this.inputDelayMonitor.start();
      this.inputDelayMonitor.onInputDelay((delay) => {
        this.metrics.inputDelays.push(delay);
        if (delay.delay > this.config.budgets.maxInputDelay) {
          this.handlePerformanceIssue({
            type: "high-input-delay",
            severity: delay.delay > 200 ? "high" : "medium",
            message: `High input delay detected: ${delay.delay.toFixed(2)}ms`,
            timestamp: Date.now(),
          });
        }
      });
    }

    if (this.config.trackResourceTiming) {
      this.resourceTimingAnalyzer.start();
      this.resourceTimingAnalyzer.onResourceLoad((resource) => {
        this.metrics.resourceTimings.push(resource);
        if (resource.duration > this.config.budgets.maxResourceLoadTime) {
          this.handlePerformanceIssue({
            type: "slow-resource",
            severity: "medium",
            message: `Slow resource load: ${resource.name} (${resource.duration.toFixed(2)}ms)`,
            timestamp: Date.now(),
            affectedResources: [resource.name],
          });
        }
      });
    }

    if (this.config.trackLayoutShifts) {
      this.layoutShiftMonitor.start();
      this.layoutShiftMonitor.onLayoutShift((shift) => {
        this.metrics.layoutShifts.push(shift);
        if (shift.value > 0.05) {
          this.handlePerformanceIssue({
            type: "excessive-layout-shifts",
            severity: shift.value > 0.1 ? "high" : "medium",
            message: `Significant layout shift: ${shift.value.toFixed(4)}`,
            timestamp: Date.now(),
          });
        }
      });
    }

    console.log("Performance observer monitoring started");
  }

  stop(): void {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;

    this.longTaskDetector.stop();
    this.paintTimingTracker.stop();
    this.inputDelayMonitor.stop();
    this.resourceTimingAnalyzer.stop();
    this.layoutShiftMonitor.stop();

    console.log("Performance observer monitoring stopped");
  }

  private handlePerformanceIssue(issue: PerformanceIssue): void {
    if (this.config.onPerformanceIssue) {
      this.config.onPerformanceIssue(issue);
    }

    console.warn(
      `Performance Issue [${issue.severity.toUpperCase()}]:`,
      issue.message,
    );
  }

  private handleBudgetViolation(violation: BudgetViolation): void {
    if (this.config.onBudgetExceeded) {
      this.config.onBudgetExceeded(violation);
    }

    console.error(
      `Performance Budget Exceeded [${violation.type.toUpperCase()}]:`,
      {
        value: violation.value,
        threshold: violation.threshold,
        details: violation.details,
      },
    );
  }

  // Metrics access
  getMetrics(): PerformanceMetrics {
    return {
      longTasks: this.longTaskDetector.getLongTasks(),
      paintTimings: this.paintTimingTracker.getPaintTimings(),
      inputDelays: this.inputDelayMonitor.getInputDelays(),
      resourceTimings: this.resourceTimingAnalyzer.getResourceTimings(),
      layoutShifts: this.layoutShiftMonitor.getLayoutShifts(),
      scriptExecutions: [], // Would be populated if script execution tracking was enabled
    };
  }

  getCurrentMetrics(): PerformanceMetrics {
    return this.metrics;
  }

  // Specific metric queries
  getLongTasks(): PerformanceMetrics["longTasks"] {
    return this.longTaskDetector.getLongTasks();
  }

  getSlowResources(threshold?: number): PerformanceMetrics["resourceTimings"] {
    return this.resourceTimingAnalyzer.getSlowResources(threshold);
  }

  getTotalLayoutShift(): number {
    return this.layoutShiftMonitor.getTotalLayoutShift();
  }

  // Performance analysis
  getPerformanceAnalysis(): {
    score: "good" | "needs-improvement" | "poor";
    issues: PerformanceIssue[];
    recommendations: string[];
    metrics: {
      averageLongTaskDuration: number;
      totalLayoutShift: number;
      averageInputDelay: number;
      slowResourcesCount: number;
    };
  } {
    const longTasks = this.getLongTasks();
    const inputDelays = this.getCurrentMetrics().inputDelays;
    const totalLayoutShift = this.getTotalLayoutShift();
    const slowResources = this.getSlowResources();

    // Calculate averages
    const averageLongTaskDuration =
      longTasks.length > 0
        ? longTasks.reduce((sum, task) => sum + task.duration, 0) /
          longTasks.length
        : 0;

    const averageInputDelay =
      inputDelays.length > 0
        ? inputDelays.reduce((sum, delay) => sum + delay.delay, 0) /
          inputDelays.length
        : 0;

    // Score calculation
    let score: "good" | "needs-improvement" | "poor" = "good";

    if (
      averageLongTaskDuration > 100 ||
      totalLayoutShift > 0.25 ||
      averageInputDelay > 150
    ) {
      score = "poor";
    } else if (
      averageLongTaskDuration > 50 ||
      totalLayoutShift > 0.1 ||
      averageInputDelay > 100
    ) {
      score = "needs-improvement";
    }

    // Generate recommendations
    const recommendations: string[] = [];

    if (averageLongTaskDuration > 50) {
      recommendations.push(
        "Consider code splitting to reduce long task duration",
      );
    }

    if (totalLayoutShift > 0.1) {
      recommendations.push(
        "Minimize layout shifts by using proper sizing attributes",
      );
    }

    if (averageInputDelay > 100) {
      recommendations.push(
        "Optimize JavaScript execution to reduce input delay",
      );
    }

    if (slowResources.length > 5) {
      recommendations.push(
        "Optimize resource loading and consider lazy loading",
      );
    }

    return {
      score,
      issues: [], // Would be populated from tracked issues
      recommendations,
      metrics: {
        averageLongTaskDuration,
        totalLayoutShift,
        averageInputDelay,
        slowResourcesCount: slowResources.length,
      },
    };
  }

  // Configuration
  updateConfig(config: Partial<PerformanceObserverConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): PerformanceObserverConfig {
    return { ...this.config };
  }

  // Cleanup
  destroy(): void {
    this.stop();
    this.metrics = {
      longTasks: [],
      paintTimings: [],
      inputDelays: [],
      resourceTimings: [],
      layoutShifts: [],
      scriptExecutions: [],
    };
  }
}

// Default configuration
export const defaultPerformanceObserverConfig: PerformanceObserverConfig = {
  enabled: true,
  budgets: {
    maxLongTaskDuration: 50,
    maxInputDelay: 100,
    maxLayoutShifts: 0.1,
    maxResourceLoadTime: 2000,
    maxScriptExecutionTime: 100,
  },
  trackLongTasks: true,
  trackPaintTiming: true,
  trackInputDelay: true,
  trackResourceTiming: true,
  trackLayoutShifts: true,
  trackScriptExecution: false,
};

// Singleton instance
export const performanceObserver = new PerformanceObserverManager(
  defaultPerformanceObserverConfig,
);
