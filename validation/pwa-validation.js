#!/usr/bin/env node

/**
 * PWA Validation Script
 * OX Gesture Stem Player - PWA Installation & Offline Testing
 */

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

class PWAValidator {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      installation: null,
      offline: null,
      serviceWorker: null,
      manifest: null,
      errors: [],
    };
  }

  /**
   * Validate PWA manifest
   */
  async validateManifest() {
    console.log("📋 Validating PWA manifest...");

    try {
      const response = await fetch("http://localhost:3000/manifest.json");
      const manifest = await response.json();

      const validation = {
        valid: true,
        issues: [],
        warnings: [],
      };

      // Required fields
      const requiredFields = [
        "name",
        "short_name",
        "start_url",
        "display",
        "icons",
      ];

      requiredFields.forEach((field) => {
        if (!manifest[field]) {
          validation.valid = false;
          validation.issues.push(`Missing required field: ${field}`);
        }
      });

      // Icon validation
      if (manifest.icons && manifest.icons.length > 0) {
        const requiredSizes = ["192x192", "512x512"];
        const availableSizes = manifest.icons.map((icon) => icon.sizes);

        requiredSizes.forEach((size) => {
          if (!availableSizes.includes(size)) {
            validation.warnings.push(`Missing recommended icon size: ${size}`);
          }
        });
      } else {
        validation.valid = false;
        validation.issues.push("No icons defined in manifest");
      }

      // Display mode validation
      const validDisplayModes = [
        "fullscreen",
        "standalone",
        "minimal-ui",
        "browser",
      ];
      if (!validDisplayModes.includes(manifest.display)) {
        validation.warnings.push(
          `Display mode '${manifest.display}' is not widely supported`,
        );
      }

      this.results.manifest = validation;
    } catch (error) {
      console.error("❌ Manifest validation failed:", error.message);
      this.results.errors.push({
        type: "manifest",
        error: error.message,
      });
    }
  }

  /**
   * Validate service worker
   */
  async validateServiceWorker() {
    console.log("🔧 Validating service worker...");

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

      // Check if service worker is registered
      const swRegistration = await page.evaluate(async () => {
        if ("serviceWorker" in navigator) {
          try {
            const registration = await navigator.serviceWorker.ready;
            return {
              active: registration.active ? registration.active.state : null,
              waiting: registration.waiting ? registration.waiting.state : null,
              installing: registration.installing
                ? registration.installing.state
                : null,
              scope: registration.scope,
              updateViaCache: registration.updateViaCache,
            };
          } catch (error) {
            return { error: error.message };
          }
        }
        return { error: "Service Worker not supported" };
      });

      await browser.close();

      this.results.serviceWorker = {
        registered: !swRegistration.error,
        details: swRegistration,
      };
    } catch (error) {
      console.error("❌ Service worker validation failed:", error.message);
      this.results.errors.push({
        type: "service-worker",
        error: error.message,
      });
    }
  }

  /**
   * Test PWA installation
   */
  async testInstallation() {
    console.log("📱 Testing PWA installation...");

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

      // Check if app can be installed
      const installable = await page.evaluate(async () => {
        if ("getInstalledRelatedApps" in window) {
          try {
            const relatedApps = await getInstalledRelatedApps();
            return { installable: true, relatedApps };
          } catch (error) {
            return { installable: false, error: error.message };
          }
        }
        return {
          installable: false,
          error: "getInstalledRelatedApps not supported",
        };
      });

      // Check install prompt availability
      const installPrompt = await page.evaluate(() => {
        return new Promise((resolve) => {
          let installPromptEvent = null;

          window.addEventListener("beforeinstallprompt", (e) => {
            installPromptEvent = {
              available: true,
              platforms: e.platforms,
              userChoice: null,
            };
            resolve(installPromptEvent);
          });

          // Timeout after 5 seconds
          setTimeout(() => {
            resolve({ available: false });
          }, 5000);
        });
      });

      await browser.close();

      this.results.installation = {
        installable: installable.installable,
        installPromptAvailable: installPrompt.available,
        details: { installable, installPrompt },
      };
    } catch (error) {
      console.error("❌ Installation test failed:", error.message);
      this.results.errors.push({
        type: "installation",
        error: error.message,
      });
    }
  }

  /**
   * Test offline functionality
   */
  async testOfflineFunctionality() {
    console.log("🔌 Testing offline functionality...");

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

      // Enable offline mode
      await page.setOfflineMode(true);

      // Try to navigate to different pages
      const offlineResults = {
        homePage: false,
        mixPage: false,
        stemsPage: false,
        gesturesPage: false,
      };

      try {
        await page.reload({ waitUntil: "networkidle0" });
        offlineResults.homePage = !(await page.evaluate(() =>
          document.querySelector(".offline-indicator"),
        ));
      } catch (error) {
        offlineResults.homePage = false;
      }

      // Test navigation to other routes
      const routes = ["/mix", "/stems", "/gestures"];
      for (const route of routes) {
        try {
          await page.goto(`http://localhost:3000${route}`, { timeout: 5000 });
          offlineResults[`${route.replace("/", "")}Page`] = true;
        } catch (error) {
          offlineResults[`${route.replace("/", "")}Page`] = false;
        }
      }

      await browser.close();

      this.results.offline = {
        functional: Object.values(offlineResults).some((result) => result),
        results: offlineResults,
      };
    } catch (error) {
      console.error("❌ Offline test failed:", error.message);
      this.results.errors.push({
        type: "offline",
        error: error.message,
      });
    }
  }

  /**
   * Test cache strategies
   */
  async testCacheStrategies() {
    console.log("💾 Testing cache strategies...");

    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();
      await page.goto("http://localhost:3000", { waitUntil: "networkidle0" });

      // Check cache API
      const cacheInfo = await page.evaluate(async () => {
        if ("caches" in window) {
          try {
            const cacheNames = await caches.keys();
            const cacheDetails = {};

            for (const cacheName of cacheNames) {
              const cache = await caches.open(cacheName);
              const requests = await cache.keys();
              cacheDetails[cacheName] = {
                requestCount: requests.length,
                requests: requests.slice(0, 10).map((req) => req.url), // First 10 URLs
              };
            }

            return {
              available: true,
              caches: cacheDetails,
            };
          } catch (error) {
            return { available: false, error: error.message };
          }
        }
        return { available: false, error: "Cache API not supported" };
      });

      await browser.close();

      this.results.cache = cacheInfo;
    } catch (error) {
      console.error("❌ Cache test failed:", error.message);
      this.results.errors.push({
        type: "cache",
        error: error.message,
      });
    }
  }

  /**
   * Generate PWA validation report
   */
  async generateReport() {
    console.log("📋 Generating PWA validation report...");

    const reportPath = path.join(process.cwd(), "validation/pwa-report.json");

    // Ensure validation directory exists
    const dir = path.dirname(reportPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

    console.log(`✅ PWA validation report generated: ${reportPath}`);

    return reportPath;
  }

  /**
   * Check PWA requirements compliance
   */
  validatePWARequirements() {
    console.log("🔍 Validating PWA requirements...");

    const issues = [];

    // Manifest validation
    if (this.results.manifest) {
      if (!this.results.manifest.valid) {
        issues.push({
          type: "manifest",
          issue: "Manifest validation failed",
          severity: "error",
          details: this.results.manifest.issues,
        });
      }

      if (this.results.manifest.warnings.length > 0) {
        issues.push({
          type: "manifest",
          issue: "Manifest warnings found",
          severity: "warning",
          details: this.results.manifest.warnings,
        });
      }
    }

    // Service worker validation
    if (this.results.serviceWorker) {
      if (!this.results.serviceWorker.registered) {
        issues.push({
          type: "service-worker",
          issue: "Service worker not registered",
          severity: "error",
        });
      }
    }

    // Installation validation
    if (this.results.installation) {
      if (!this.results.installation.installable) {
        issues.push({
          type: "installation",
          issue: "App is not installable",
          severity: "warning",
        });
      }
    }

    // Offline validation
    if (this.results.offline) {
      if (!this.results.offline.functional) {
        issues.push({
          type: "offline",
          issue: "Offline functionality not working",
          severity: "error",
        });
      }
    }

    return issues;
  }

  /**
   * Run all PWA validations
   */
  async run() {
    console.log("🚀 Starting PWA validation...\n");

    try {
      // Run all validation steps
      await this.validateManifest();
      await this.validateServiceWorker();
      await this.testInstallation();
      await this.testOfflineFunctionality();
      await this.testCacheStrategies();

      // Generate report
      await this.generateReport();

      // Validate requirements
      const issues = this.validatePWARequirements();

      // Print summary
      this.printSummary(issues);

      // Exit with appropriate code
      const hasErrors = issues.some((issue) => issue.severity === "error");
      process.exit(hasErrors ? 1 : 0);
    } catch (error) {
      console.error("💥 PWA validation failed:", error);
      process.exit(1);
    }
  }

  /**
   * Print validation summary
   */
  printSummary(issues) {
    console.log("\n📱 PWA Validation Summary");
    console.log("=========================\n");

    // Manifest status
    if (this.results.manifest) {
      const status = this.results.manifest.valid ? "✅" : "❌";
      console.log(
        `📋 Manifest: ${status} ${this.results.manifest.valid ? "Valid" : "Invalid"}`,
      );
      if (this.results.manifest.warnings.length > 0) {
        console.log(`  ⚠️  Warnings: ${this.results.manifest.warnings.length}`);
      }
    }

    // Service worker status
    if (this.results.serviceWorker) {
      const status = this.results.serviceWorker.registered ? "✅" : "❌";
      console.log(
        `🔧 Service Worker: ${status} ${this.results.serviceWorker.registered ? "Registered" : "Not Registered"}`,
      );
    }

    // Installation status
    if (this.results.installation) {
      const status = this.results.installation.installable ? "✅" : "⚠️";
      console.log(
        `📱 Installation: ${status} ${this.results.installation.installable ? "Installable" : "Not Installable"}`,
      );
    }

    // Offline status
    if (this.results.offline) {
      const status = this.results.offline.functional ? "✅" : "❌";
      console.log(
        `🔌 Offline: ${status} ${this.results.offline.functional ? "Functional" : "Not Functional"}`,
      );
    }

    // Issues
    if (issues.length > 0) {
      console.log("\n⚠️  Issues Found:");
      issues.forEach((issue) => {
        const icon = issue.severity === "error" ? "❌" : "⚠️";
        console.log(`  ${icon} ${issue.issue}`);
        if (issue.details) {
          issue.details.forEach((detail) => {
            console.log(`    - ${detail}`);
          });
        }
      });
      console.log("");
    } else {
      console.log("\n✅ PWA validation passed!\n");
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new PWAValidator();
  validator.run();
}

module.exports = PWAValidator;
