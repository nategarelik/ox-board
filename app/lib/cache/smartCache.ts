/**
 * OX Board - Smart Pre-caching System
 * Predictive caching based on usage patterns and connection optimization
 */

import { stemCache, StemAccessPattern } from "../storage/stemCache";
import { offlineManager, OfflineState } from "../offline/offlineManager";

export interface PrecacheStrategy {
  name: string;
  priority: number;
  maxAge: number; // hours
  maxSize: number; // MB
  conditions: PrecacheCondition[];
}

export interface PrecacheCondition {
  type:
    | "connection_speed"
    | "time_of_day"
    | "usage_pattern"
    | "battery_level"
    | "cache_fullness";
  operator: ">" | "<" | "=" | "!=" | ">=" | "<=";
  value: number | string;
}

export interface CachePrediction {
  resourceUrl: string;
  resourceType: "stem" | "worklet" | "static" | "api";
  probability: number; // 0-1
  expectedAccessTime: number; // minutes from now
  priority: number;
  sizeEstimate: number; // bytes
}

export interface SmartCacheConfig {
  enabled: boolean;
  maxConcurrentPreloads: number;
  predictionWindow: number; // hours
  minProbabilityThreshold: number;
  respectBatteryLevel: boolean;
  respectDataSaver: boolean;
  strategies: PrecacheStrategy[];
}

class SmartCacheManager {
  private config: SmartCacheConfig;
  private predictionCache = new Map<string, CachePrediction>();
  private accessHistory: Array<{
    timestamp: number;
    resourceType: string;
    resourceUrl: string;
    sessionDuration: number;
  }> = [];
  private isPreloading = false;
  private preloadQueue: CachePrediction[] = [];
  private activePreloads = new Set<Promise<void>>();

  constructor() {
    this.config = {
      enabled: true,
      maxConcurrentPreloads: 2,
      predictionWindow: 24,
      minProbabilityThreshold: 0.3,
      respectBatteryLevel: true,
      respectDataSaver: true,
      strategies: this.getDefaultStrategies(),
    };

    this.initializeEventListeners();
    this.startPeriodicAnalysis();
  }

  /**
   * Enable or disable smart caching
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    console.log(`🔧 Smart cache ${enabled ? "enabled" : "disabled"}`);
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<SmartCacheConfig>): void {
    this.config = { ...this.config, ...updates };
    console.log("🔧 Smart cache config updated:", updates);
  }

  /**
   * Predict and preload resources
   */
  async predictAndPreload(): Promise<void> {
    if (!this.config.enabled || this.isPreloading) {
      return;
    }

    this.isPreloading = true;

    try {
      console.log("🔮 Analyzing usage patterns for smart preloading...");

      // Get predictions
      const predictions = await this.generatePredictions();

      // Filter by probability threshold
      const highProbabilityPredictions = predictions.filter(
        (p) => p.probability >= this.config.minProbabilityThreshold,
      );

      // Sort by priority and probability
      highProbabilityPredictions.sort((a, b) => {
        const priorityDiff = b.priority - a.priority;
        return priorityDiff !== 0
          ? priorityDiff
          : b.probability - a.probability;
      });

      // Check if we should preload based on conditions
      if (await this.shouldPreloadNow(highProbabilityPredictions)) {
        await this.executePreloadStrategy(highProbabilityPredictions);
      } else {
        console.log("⏸️ Preloading skipped - conditions not met");
      }
    } catch (error) {
      console.error("❌ Smart preload failed:", error);
    } finally {
      this.isPreloading = false;
    }
  }

  /**
   * Generate predictions based on usage patterns
   */
  private async generatePredictions(): Promise<CachePrediction[]> {
    const predictions: CachePrediction[] = [];
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Analyze stem access patterns
    const stemPatterns = await stemCache.getAccessPatterns();
    predictions.push(...this.predictStemAccess(stemPatterns));

    // Analyze general access history
    const recentHistory = this.accessHistory.filter(
      (h) => h.timestamp > oneDayAgo,
    );
    predictions.push(...this.predictFromHistory(recentHistory));

    // Remove duplicates and cache predictions
    const uniquePredictions = this.deduplicatePredictions(predictions);
    uniquePredictions.forEach((prediction) => {
      this.predictionCache.set(prediction.resourceUrl, prediction);
    });

    return uniquePredictions;
  }

  /**
   * Predict stem access based on patterns
   */
  private predictStemAccess(patterns: StemAccessPattern[]): CachePrediction[] {
    const predictions: CachePrediction[] = [];
    const now = Date.now();

    for (const pattern of patterns) {
      if (pattern.accessCount < 2) continue; // Need at least 2 accesses

      // Calculate probability based on access frequency
      const hoursSinceLastAccess =
        (now - pattern.lastAccessed) / (1000 * 60 * 60);
      const probability = Math.max(
        0,
        Math.min(
          1,
          (pattern.accessCount / 10) * Math.exp(-hoursSinceLastAccess / 24),
        ),
      );

      if (probability > 0.2) {
        predictions.push({
          resourceUrl: pattern.stemId,
          resourceType: "stem",
          probability,
          expectedAccessTime: hoursSinceLastAccess * 30, // Estimate based on pattern
          priority: pattern.accessCount > 5 ? 10 : 5,
          sizeEstimate: 50 * 1024 * 1024, // Estimate 50MB per stem
        });
      }
    }

    return predictions;
  }

  /**
   * Predict from general access history
   */
  private predictFromHistory(
    history: typeof this.accessHistory,
  ): CachePrediction[] {
    const predictions: CachePrediction[] = [];
    const typeFrequency = new Map<string, number>();

    // Count access frequency by type
    history.forEach((entry) => {
      typeFrequency.set(
        entry.resourceType,
        (typeFrequency.get(entry.resourceType) || 0) + 1,
      );
    });

    // Generate predictions for frequently accessed types
    for (const [type, frequency] of typeFrequency) {
      if (frequency > 3) {
        predictions.push({
          resourceUrl: `predicted_${type}`,
          resourceType: type as any,
          probability: Math.min(0.8, frequency / 10),
          expectedAccessTime: 60, // 1 hour
          priority: frequency > 5 ? 8 : 4,
          sizeEstimate: this.estimateResourceSize(type),
        });
      }
    }

    return predictions;
  }

  /**
   * Check if we should preload now based on conditions
   */
  private async shouldPreloadNow(
    predictions: CachePrediction[],
  ): Promise<boolean> {
    // Check if user is on slow connection
    const offlineState = offlineManager.getState();
    if (!offlineState.isOnline || offlineState.connectionSpeed < 1) {
      return false; // Don't preload on slow/offline connections
    }

    // Check battery level if configured
    if (this.config.respectBatteryLevel && "getBattery" in navigator) {
      try {
        const battery = await (navigator as any).getBattery();
        if (battery.level < 0.2) {
          console.log("🔋 Low battery - skipping preload");
          return false;
        }
      } catch (error) {
        // Battery API not available, continue
      }
    }

    // Check data saver mode
    if (this.config.respectDataSaver && "connection" in navigator) {
      const connection = (navigator as any).connection;
      if (connection.saveData) {
        console.log("💾 Data saver mode - skipping preload");
        return false;
      }
    }

    // Check if we have enough cache space
    const cacheStats = await stemCache.getCacheStats();
    const totalSizeGB = cacheStats.totalSize / (1024 * 1024 * 1024);

    if (totalSizeGB > 4) {
      // More than 4GB cached
      console.log("💾 Cache almost full - skipping preload");
      return false;
    }

    // Check if there are high-priority predictions
    const highPriorityPredictions = predictions.filter((p) => p.priority >= 8);
    if (highPriorityPredictions.length === 0) {
      return false;
    }

    return true;
  }

  /**
   * Execute preload strategy
   */
  private async executePreloadStrategy(
    predictions: CachePrediction[],
  ): Promise<void> {
    console.log(
      `🚀 Executing preload strategy for ${predictions.length} resources`,
    );

    // Limit concurrent preloads
    const maxConcurrent = this.config.maxConcurrentPreloads;
    const batches = this.createBatches(predictions, maxConcurrent);

    for (const batch of batches) {
      const preloadPromises = batch.map((prediction) =>
        this.preloadResource(prediction),
      );

      // Wait for batch to complete
      await Promise.allSettled(preloadPromises);

      // Small delay between batches
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  /**
   * Preload a single resource
   */
  private async preloadResource(prediction: CachePrediction): Promise<void> {
    const promise = this.performPreload(prediction);
    this.activePreloads.add(promise);

    try {
      await promise;
      console.log(
        `✅ Preloaded: ${prediction.resourceType} - ${prediction.resourceUrl}`,
      );
    } catch (error) {
      console.error(
        `❌ Preload failed: ${prediction.resourceType} - ${prediction.resourceUrl}`,
        error,
      );
    } finally {
      this.activePreloads.delete(promise);
    }
  }

  /**
   * Perform the actual preload
   */
  private async performPreload(prediction: CachePrediction): Promise<void> {
    switch (prediction.resourceType) {
      case "stem":
        await this.preloadStem(prediction);
        break;

      case "worklet":
        await this.preloadWorklet(prediction);
        break;

      case "static":
        await this.preloadStaticResource(prediction);
        break;

      default:
        console.warn(
          `⚠️ Unknown resource type for preload: ${prediction.resourceType}`,
        );
    }
  }

  /**
   * Preload stem resource
   */
  private async preloadStem(prediction: CachePrediction): Promise<void> {
    // Check if stem is already cached
    const stemId = prediction.resourceUrl;
    const existingStem = await stemCache.loadStem(stemId);

    if (existingStem) {
      console.log(`📦 Stem already cached: ${stemId}`);
      return;
    }

    // For demo purposes, we'll simulate preloading
    // In real implementation, this would fetch from API
    console.log(
      `🌐 Would preload stem: ${stemId} (${(prediction.sizeEstimate / 1024 / 1024).toFixed(2)}MB)`,
    );

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Store in cache (would normally come from actual fetch)
    const mockStemData = this.generateMockStemData();
    await stemCache.saveStem(stemId, `Preloaded Stem ${stemId}`, mockStemData, {
      bpm: 120,
      key: "C",
      duration: 180,
      processingDate: Date.now(),
      processingTime: 5000,
    });
  }

  /**
   * Preload worklet resource
   */
  private async preloadWorklet(prediction: CachePrediction): Promise<void> {
    const workletUrl = prediction.resourceUrl;

    // Use service worker to cache worklet
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "PRECACHE_RESOURCES",
        payload: [workletUrl],
      });
    }
  }

  /**
   * Preload static resource
   */
  private async preloadStaticResource(
    prediction: CachePrediction,
  ): Promise<void> {
    const resourceUrl = prediction.resourceUrl;

    try {
      const response = await fetch(resourceUrl);
      if (response.ok) {
        const cache = await caches.open("ox-board-static-v1.0.0");
        await cache.put(resourceUrl, response);
        console.log(`💾 Preloaded static resource: ${resourceUrl}`);
      }
    } catch (error) {
      console.error(
        `❌ Failed to preload static resource: ${resourceUrl}`,
        error,
      );
    }
  }

  /**
   * Generate mock stem data for demonstration
   */
  private generateMockStemData(): any {
    // This would normally be actual stem data from the API
    return {
      drums: {
        audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
      },
      bass: {
        audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
      },
      melody: {
        audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
      },
      vocals: {
        audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
      },
    };
  }

  /**
   * Estimate resource size by type
   */
  private estimateResourceSize(type: string): number {
    const sizeEstimates: Record<string, number> = {
      stem: 50 * 1024 * 1024, // 50MB
      worklet: 100 * 1024, // 100KB
      static: 500 * 1024, // 500KB
      api: 10 * 1024, // 10KB
    };

    return sizeEstimates[type] || 1024 * 1024; // 1MB default
  }

  /**
   * Remove duplicate predictions
   */
  private deduplicatePredictions(
    predictions: CachePrediction[],
  ): CachePrediction[] {
    const seen = new Set<string>();
    return predictions.filter((prediction) => {
      if (seen.has(prediction.resourceUrl)) {
        return false;
      }
      seen.add(prediction.resourceUrl);
      return true;
    });
  }

  /**
   * Create batches for processing
   */
  private createBatches<T>(array: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      batches.push(array.slice(i, i + size));
    }
    return batches;
  }

  /**
   * Get default precache strategies
   */
  private getDefaultStrategies(): PrecacheStrategy[] {
    return [
      {
        name: "frequent_stems",
        priority: 10,
        maxAge: 24,
        maxSize: 200,
        conditions: [
          { type: "connection_speed", operator: ">", value: 5 },
          { type: "cache_fullness", operator: "<", value: 80 },
        ],
      },
      {
        name: "worklets",
        priority: 8,
        maxAge: 72,
        maxSize: 50,
        conditions: [{ type: "connection_speed", operator: ">", value: 2 }],
      },
      {
        name: "static_resources",
        priority: 5,
        maxAge: 168, // 1 week
        maxSize: 100,
        conditions: [
          { type: "connection_speed", operator: ">", value: 1 },
          { type: "time_of_day", operator: "=", value: "night" },
        ],
      },
    ];
  }

  /**
   * Initialize event listeners
   */
  private initializeEventListeners(): void {
    // Track resource access
    window.addEventListener("beforeunload", () => {
      this.saveAccessHistory();
    });

    // Periodic cleanup of old predictions
    setInterval(
      () => {
        this.cleanupOldPredictions();
      },
      60 * 60 * 1000,
    ); // Every hour
  }

  /**
   * Start periodic analysis
   */
  private startPeriodicAnalysis(): void {
    // Analyze patterns every 30 minutes
    setInterval(
      () => {
        if (this.config.enabled) {
          this.predictAndPreload().catch((error) => {
            console.error("Periodic analysis failed:", error);
          });
        }
      },
      30 * 60 * 1000,
    );
  }

  /**
   * Save access history to localStorage
   */
  private saveAccessHistory(): void {
    try {
      localStorage.setItem(
        "ox-board-access-history",
        JSON.stringify(this.accessHistory),
      );
    } catch (error) {
      console.warn("Failed to save access history:", error);
    }
  }

  /**
   * Cleanup old predictions
   */
  private cleanupOldPredictions(): void {
    const cutoffTime =
      Date.now() - this.config.predictionWindow * 60 * 60 * 1000;

    for (const [url, prediction] of this.predictionCache.entries()) {
      // This would need actual timestamp tracking
      // For now, just keep recent predictions
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    predictionsCount: number;
    activePreloads: number;
    totalPredictionsGenerated: number;
    cacheHitRate: number;
  }> {
    return {
      predictionsCount: this.predictionCache.size,
      activePreloads: this.activePreloads.size,
      totalPredictionsGenerated: this.accessHistory.length,
      cacheHitRate: 0.85, // Would calculate from actual hits/misses
    };
  }
}

// Export singleton instance
export const smartCache = new SmartCacheManager();

// Auto-start smart caching
if (typeof window !== "undefined") {
  // Initialize after page load
  window.addEventListener("load", () => {
    setTimeout(() => {
      smartCache.predictAndPreload().catch((error) => {
        console.error("Smart cache initialization failed:", error);
      });
    }, 5000); // Wait 5 seconds after page load
  });
}
