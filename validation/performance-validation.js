#!/usr/bin/env node

/**
 * Performance Validation Script
 * OX Gesture Stem Player - Automated Performance Testing
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

class PerformanceValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      lighthouse: null,
      webVitals: null,
      bundleAnalysis: null,
      errors: [],
    };
  }

  /**
   * Run Lighthouse CI audits
   */
  async runLighthouseAudits() {
    console.log("🗼 Running Lighthouse CI audits...");

    try {
      // Run Lighthouse CI
      execSync("npx lighthouse-ci autorun", {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      // Read results
      const resultsPath = path.join(process.cwd(), ".lighthouseci");
      if (fs.existsSync(resultsPath)) {
        const reports = fs
          .readdirSync(resultsPath)
          .filter((file) => file.endsWith(".json"))
          .map((file) => {
            const content = fs.readFileSync(
              path.join(resultsPath, file),
              "utf8",
            );
            return JSON.parse(content);
          });

        this.results.lighthouse = this.analyzeLighthouseResults(reports);
      }
    } catch (error) {
      console.error("❌ Lighthouse CI failed:", error.message);
      this.results.errors.push({
        type: "lighthouse",
        error: error.message,
      });
    }
  }

  /**
   * Analyze Lighthouse results
   */
  analyzeLighthouseResults(reports) {
    const summary = {
      totalRuns: reports.length,
      scores: {
        performance: [],
        accessibility: [],
        "best-practices": [],
        seo: [],
        pwa: [],
      },
      metrics: {
        firstContentfulPaint: [],
        largestContentfulPaint: [],
        firstInputDelay: [],
        cumulativeLayoutShift: [],
        totalBlockingTime: [],
      },
    };

    reports.forEach((report) => {
      const categories = report.categories || {};
      const audits = report.audits || {};

      // Collect scores
      Object.keys(summary.scores).forEach((category) => {
        if (categories[category]) {
          summary.scores[category].push(categories[category].score * 100);
        }
      });

      // Collect metrics
      Object.keys(summary.metrics).forEach((metric) => {
        if (audits[metric]) {
          const value = audits[metric].numericValue;
          if (value !== undefined) {
            summary.metrics[metric].push(value);
          }
        }
      });
    });

    // Calculate averages
    Object.keys(summary.scores).forEach((category) => {
      const scores = summary.scores[category];
      summary.scores[category] = {
        average: this.average(scores),
        min: Math.min(...scores),
        max: Math.max(...scores),
      };
    });

    Object.keys(summary.metrics).forEach((metric) => {
      const values = summary.metrics[metric];
      summary.metrics[metric] = {
        average: this.average(values),
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });

    return summary;
  }

  /**
   * Run bundle analysis
   */
  async runBundleAnalysis() {
    console.log("📦 Running bundle analysis...");

    try {
      // Build with bundle analyzer
      execSync("npm run build:analyze", {
        stdio: "inherit",
        cwd: process.cwd(),
      });

      // Read bundle analysis results
      const reportPath = path.join(
        process.cwd(),
        "bundle-analyzer-report.html",
      );
      if (fs.existsSync(reportPath)) {
        this.results.bundleAnalysis = {
          reportGenerated: true,
          reportPath: reportPath,
        };
      }
    } catch (error) {
      console.error("❌ Bundle analysis failed:", error.message);
      this.results.errors.push({
        type: "bundle-analysis",
        error: error.message,
      });
    }
  }

  /**
   * Run Web Vitals monitoring
   */
  async runWebVitalsMonitoring() {
    console.log("📊 Running Web Vitals monitoring...");

    try {
      // Import web-vitals if available
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = require("web-vitals");

      const metrics = [];

      // Collect metrics
      await Promise.all([
        new Promise((resolve) => {
          getCLS((metric) => {
            metrics.push({ name: "CLS", value: metric.value });
            resolve();
          });
        }),
        new Promise((resolve) => {
          getFID((metric) => {
            metrics.push({ name: "FID", value: metric.value });
            resolve();
          });
        }),
        new Promise((resolve) => {
          getFCP((metric) => {
            metrics.push({ name: "FCP", value: metric.value });
            resolve();
          });
        }),
        new Promise((resolve) => {
          getLCP((metric) => {
            metrics.push({ name: "LCP", value: metric.value });
            resolve();
          });
        }),
        new Promise((resolve) => {
          getTTFB((metric) => {
            metrics.push({ name: "TTFB", value: metric.value });
            resolve();
          });
        }),
      ]);

      this.results.webVitals = this.analyzeWebVitals(metrics);
    } catch (error) {
      console.error("❌ Web Vitals monitoring failed:", error.message);
      this.results.errors.push({
        type: "web-vitals",
        error: error.message,
      });
    }
  }

  /**
   * Analyze Web Vitals results
   */
  analyzeWebVitals(metrics) {
    const analysis = {};

    metrics.forEach((metric) => {
      analysis[metric.name] = {
        value: metric.value,
        rating: this.getWebVitalRating(metric.name, metric.value),
      };
    });

    return analysis;
  }

  /**
   * Get Web Vital rating
   */
  getWebVitalRating(name, value) {
    const thresholds = {
      FCP: { good: 1800, needsImprovement: 3000 },
      LCP: { good: 2500, needsImprovement: 4000 },
      FID: { good: 100, needsImprovement: 300 },
      CLS: { good: 0.1, needsImprovement: 0.25 },
      TTFB: { good: 800, needsImprovement: 1800 },
    };

    const threshold = thresholds[name];
    if (!threshold) return "unknown";

    if (value <= threshold.good) return "good";
    if (value <= threshold.needsImprovement) return "needs-improvement";
    return "poor";
  }

  /**
   * Generate performance report
   */
  async generateReport() {
    console.log("📋 Generating performance report...");

    const reportPath = path.join(
      process.cwd(),
      "validation/performance-report.json",
    );

    // Ensure validation directory exists
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    console.log(`✅ Performance report generated: ${reportPath}`);

    return reportPath;
  }

  /**
   * Check if performance meets requirements
   */
  validatePerformanceRequirements() {
    console.log("🔍 Validating performance requirements...");

    const issues = [];

    // Check Lighthouse scores
    if (this.results.lighthouse) {
      const scores = this.results.lighthouse.scores;

      Object.entries(scores).forEach(([category, data]) => {
        if (data.average < 95) {
          issues.push({
            type: "lighthouse",
            category,
            issue: `Average ${category} score ${data.average.toFixed(1)}% is below 95%`,
            severity: "warning",
          });
        }
      });
    }

    // Check Web Vitals
    if (this.results.webVitals) {
      Object.entries(this.results.webVitals).forEach(([metric, data]) => {
        if (data.rating === "poor") {
          issues.push({
            type: "web-vitals",
            metric,
            issue: `${metric} value ${data.value} is rated as poor`,
            severity: "error",
          });
        }
      });
    }

    return issues;
  }

  /**
   * Run all validations
   */
  async run() {
    console.log("🚀 Starting performance validation...\n");

    try {
      // Run all validation steps
      await this.runLighthouseAudits();
      await this.runBundleAnalysis();
      await this.runWebVitalsMonitoring();

      // Generate report
      await this.generateReport();

      // Validate requirements
      const issues = this.validatePerformanceRequirements();

      // Print summary
      this.printSummary(issues);

      // Exit with appropriate code
      const hasErrors = issues.some((issue) => issue.severity === "error");
      process.exit(hasErrors ? 1 : 0);
    } catch (error) {
      console.error("💥 Performance validation failed:", error);
      process.exit(1);
    }
  }

  /**
   * Print validation summary
   */
  printSummary(issues) {
    console.log("\n📊 Performance Validation Summary");
    console.log("================================\n");

    // Lighthouse results
    if (this.results.lighthouse) {
      console.log("🗼 Lighthouse Scores:");
      Object.entries(this.results.lighthouse.scores).forEach(
        ([category, data]) => {
          console.log(
            `  ${category}: ${data.average.toFixed(1)}% (min: ${data.min.toFixed(1)}%, max: ${data.max.toFixed(1)}%)`,
          );
        },
      );
      console.log("");
    }

    // Web Vitals results
    if (this.results.webVitals) {
      console.log("📊 Web Vitals:");
      Object.entries(this.results.webVitals).forEach(([metric, data]) => {
        console.log(`  ${metric}: ${data.value} (${data.rating})`);
      });
      console.log("");
    }

    // Issues
    if (issues.length > 0) {
      console.log("⚠️  Issues Found:");
      issues.forEach((issue) => {
        const icon = issue.severity === "error" ? "❌" : "⚠️";
        console.log(`  ${icon} ${issue.issue}`);
      });
      console.log("");
    } else {
      console.log("✅ No performance issues found!\n");
    }
  }

  /**
   * Calculate average of array
   */
  average(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new PerformanceValidator();
  validator.run();
}

module.exports = PerformanceValidator;
