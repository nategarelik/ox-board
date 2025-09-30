/**
 * Critical Path Optimization for OX Board AI Enhancement
 *
 * Optimizes the critical rendering path, preloads critical resources,
 * and implements performance budgets for production targets.
 */

import { performanceOptimizer } from "./performanceOptimizer";
import { bundleOptimizer } from "./bundleOptimizer";

export interface CriticalResource {
  url: string;
  type: "script" | "style" | "font" | "image";
  priority: "high" | "low";
  crossorigin?: boolean;
}

export interface PerformanceBudget {
  "first-contentful-paint": number;
  "largest-contentful-paint": number;
  "first-input-delay": number;
  "cumulative-layout-shift": number;
  "total-blocking-time": number;
}

export class CriticalPathOptimizer {
  private budgets: PerformanceBudget;
  private criticalResources: CriticalResource[] = [];
  private observer?: PerformanceObserver;

  constructor() {
    this.budgets = {
      "first-contentful-paint": 1500, // < 1.5s target
      "largest-contentful-paint": 2500, // < 2.5s target
      "first-input-delay": 100, // < 100ms target
      "cumulative-layout-shift": 0.1, // < 0.1 target
      "total-blocking-time": 200, // < 200ms target
    };

    this.initializeCriticalResources();
    this.setupPerformanceObserver();
  }

  private initializeCriticalResources(): void {
    // Define critical resources that must be loaded first
    this.criticalResources = [
      // Critical CSS
      {
        url: "/globals.css",
        type: "style",
        priority: "high",
      },
      // Critical fonts
      {
        url: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
        type: "font",
        priority: "high",
        crossorigin: true,
      },
      // Critical audio worklets
      {
        url: "/worklets/stem-processor.js",
        type: "script",
        priority: "high",
      },
      // Critical images/icons
      {
        url: "/icons/logo.svg",
        type: "image",
        priority: "low",
      },
    ];
  }

  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver === "undefined") return;

    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.checkBudget(entry);
        }
      });

      this.observer.observe({
        entryTypes: [
          "paint",
          "first-input",
          "layout-shift",
          "longtask",
          "largest-contentful-paint",
        ],
      });
    } catch (error) {
      console.warn("Performance observer not supported:", error);
    }
  }

  private checkBudget(entry: PerformanceEntry): void {
    const budget = this.budgets[entry.name as keyof PerformanceBudget];
    if (!budget) return;

    const duration = entry.startTime || (entry as any).renderTime || 0;

    if (duration > budget) {
      console.warn(
        `Performance budget exceeded for ${entry.name}: ${duration}ms > ${budget}ms`,
      );
      this.triggerQualityAdjustment(entry.name, duration);
    }
  }

  private triggerQualityAdjustment(metric: string, actualValue: number): void {
    switch (metric) {
      case "first-contentful-paint":
      case "largest-contentful-paint":
        // Reduce visual effects or disable heavy animations
        this.reduceVisualQuality();
        break;
      case "first-input-delay":
      case "total-blocking-time":
        // Reduce JavaScript execution frequency
        this.throttleHeavyOperations();
        break;
      case "cumulative-layout-shift":
        // Optimize layout stability
        this.optimizeLayoutStability();
        break;
    }
  }

  private reduceVisualQuality(): void {
    // Disable or reduce heavy visual effects
    document.documentElement.style.setProperty("--animation-duration", "0.1s");
    document.documentElement.style.setProperty("--blur-intensity", "2px");

    // Notify performance optimizer
    performanceOptimizer.updateConfig({
      enableFrameSkipping: true,
      frameSkipThreshold: 20, // More aggressive frame skipping
    });
  }

  private throttleHeavyOperations(): void {
    // Throttle gesture processing and audio analysis
    performanceOptimizer.updateConfig({
      enableWorkerPooling: false, // Disable worker pooling if causing delays
      cacheSize: 50, // Reduce cache size
    });
  }

  private optimizeLayoutStability(): void {
    // Add CSS containment for better layout stability
    document
      .querySelectorAll(".gesture-visualizer, .stem-3d-view")
      .forEach((el) => {
        el.classList.add("contain-layout", "contain-paint");
      });
  }

  // Preload critical resources
  public preloadCriticalResources(): void {
    this.criticalResources.forEach((resource) => {
      if (resource.priority === "high") {
        this.preloadResource(resource);
      }
    });
  }

  private preloadResource(resource: CriticalResource): void {
    const element = document.createElement("link");
    element.rel = "preload";
    element.href = resource.url;
    element.as = resource.type;

    if (resource.crossorigin) {
      element.crossOrigin = "anonymous";
    }

    document.head.appendChild(element);
  }

  // DNS prefetch for external resources
  public setupDNSPrefetch(): void {
    const externalDomains = [
      "fonts.googleapis.com",
      "cdn.jsdelivr.net",
      "raw.githubusercontent.com",
    ];

    externalDomains.forEach((domain) => {
      const link = document.createElement("link");
      link.rel = "dns-prefetch";
      link.href = `//${domain}`;
      document.head.appendChild(link);
    });
  }

  // Preconnect to critical origins
  public setupPreconnect(): void {
    const origins = [
      { url: "https://fonts.gstatic.com", crossorigin: true },
      { url: "https://cdn.jsdelivr.net", crossorigin: true },
    ];

    origins.forEach(({ url, crossorigin }) => {
      const link = document.createElement("link");
      link.rel = "preconnect";
      link.href = url;

      if (crossorigin) {
        link.crossOrigin = "anonymous";
      }

      document.head.appendChild(link);
    });
  }

  // Font optimization
  public optimizeFonts(): void {
    // Font display swap for better perceived performance
    const fontFace = new FontFace(
      "Inter",
      "url(https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiA.woff2)",
      {
        display: "swap",
        weight: "400",
      },
    );

    fontFace
      .load()
      .then(() => {
        document.fonts.add(fontFace);
      })
      .catch((error) => {
        console.warn("Font loading failed:", error);
      });
  }

  // Critical CSS inlining
  public inlineCriticalCSS(): void {
    // In a real implementation, this would extract and inline critical CSS
    const criticalCSS = `
      * { box-sizing: border-box; }
      html { font-family: Inter, system-ui, sans-serif; }
      body { margin: 0; background: #0f0f0f; color: white; }
      .loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    `;

    const style = document.createElement("style");
    style.textContent = criticalCSS;
    document.head.insertBefore(style, document.head.firstChild);
  }

  // Defer non-critical JavaScript
  public deferNonCriticalJS(): void {
    // Mark non-critical scripts as defer
    document
      .querySelectorAll('script[data-critical="false"]')
      .forEach((script) => {
        (script as HTMLScriptElement).defer = true;
      });
  }

  // Resource hints for likely-to-be-needed resources
  public setupResourceHints(): void {
    const likelyResources = [
      "/components/stem-player/Stem3DVisualizer",
      "/components/AI/MixAssistantWidget",
      "/components/DJ/ProfessionalDJInterface",
    ];

    likelyResources.forEach((resource) => {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = resource;
      document.head.appendChild(link);
    });
  }

  // Intersection Observer for lazy loading below the fold
  public setupLazyLoading(): void {
    if (typeof IntersectionObserver === "undefined") return;

    const lazyElements = document.querySelectorAll("[data-lazy]");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const element = entry.target as HTMLElement;
            const src = element.dataset.lazy;

            if (src) {
              if (element.tagName === "IMG") {
                (element as HTMLImageElement).src = src;
              } else {
                element.style.backgroundImage = `url(${src})`;
              }

              element.removeAttribute("data-lazy");
              observer.unobserve(element);
            }
          }
        });
      },
      {
        rootMargin: "50px",
      },
    );

    lazyElements.forEach((element) => observer.observe(element));
  }

  // Performance monitoring
  public getPerformanceReport(): {
    budgets: PerformanceBudget;
    violations: string[];
    recommendations: string[];
  } {
    const violations: string[] = [];
    const recommendations: string[] = [];

    // Check Core Web Vitals
    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;

    if (navigation) {
      const fcp = performance.getEntriesByName("first-contentful-paint")[0];
      const lcp = performance.getEntriesByName("largest-contentful-paint")[0];

      if (fcp && fcp.startTime > this.budgets["first-contentful-paint"]) {
        violations.push(
          `FCP: ${fcp.startTime}ms > ${this.budgets["first-contentful-paint"]}ms`,
        );
        recommendations.push("Inline critical CSS and optimize font loading");
      }

      if (lcp && lcp.startTime > this.budgets["largest-contentful-paint"]) {
        violations.push(
          `LCP: ${lcp.startTime}ms > ${this.budgets["largest-contentful-paint"]}ms`,
        );
        recommendations.push(
          "Optimize largest contentful paint by compressing images",
        );
      }
    }

    // Check for long tasks
    const longTasks = performance.getEntriesByType("longtask");
    if (longTasks.length > 0) {
      violations.push(`${longTasks.length} long tasks detected`);
      recommendations.push(
        "Break up long JavaScript tasks or move to Web Workers",
      );
    }

    return { budgets: this.budgets, violations, recommendations };
  }

  // Initialize all optimizations
  public initialize(): void {
    // Run on next tick to ensure DOM is ready
    setTimeout(() => {
      this.inlineCriticalCSS();
      this.preloadCriticalResources();
      this.setupDNSPrefetch();
      this.setupPreconnect();
      this.optimizeFonts();
      this.deferNonCriticalJS();
      this.setupResourceHints();
      this.setupLazyLoading();

      console.log("Critical path optimizations initialized");
    }, 0);
  }

  // Cleanup
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Singleton instance
export const criticalPathOptimizer = new CriticalPathOptimizer();
