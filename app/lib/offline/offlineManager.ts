/**
 * OX Board - Centralized Offline State Management
 * Coordinates all offline functionality and provides unified state management
 */

import { offlineSync, SyncStatus } from "../sync/offlineSync";
import { stemCache, CachedStem } from "../storage/stemCache";

export interface OfflineCapabilities {
  canUseStems: boolean;
  canProcessAudio: boolean;
  canSaveSettings: boolean;
  canUploadStems: boolean;
  canUseGestures: boolean;
  canUseAI: boolean;
  networkLatency: number;
  cacheSize: number;
  availableStems: number;
}

export interface OfflineState {
  isOnline: boolean;
  connectionType: "slow-2g" | "2g" | "3g" | "4g" | "5g" | "unknown";
  connectionSpeed: number; // Mbps
  lastOnlineTime: number | null;
  capabilities: OfflineCapabilities;
  restrictions: string[];
  recommendations: string[];
}

export interface NetworkInfo {
  downlink: number;
  effectiveType: string;
  rtt: number;
  type: string;
}

class OfflineManager {
  private state: OfflineState;
  private listeners: Set<(state: OfflineState) => void> = new Set();
  private connectionCheckInterval: NodeJS.Timeout | null = null;
  private performanceObserver: PerformanceObserver | null = null;
  private networkInfo: NetworkInfo | null = null;

  constructor() {
    this.state = this.getDefaultState();

    this.initializeNetworkMonitoring();
    this.initializePerformanceMonitoring();
    this.initializeCapabilityDetection();
    this.setupEventListeners();
  }

  /**
   * Get current offline state
   */
  getState(): OfflineState {
    return { ...this.state };
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(listener: (state: OfflineState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Check if a feature is available offline
   */
  canUseFeature(
    feature: keyof Pick<
      OfflineCapabilities,
      | "canUseStems"
      | "canProcessAudio"
      | "canSaveSettings"
      | "canUploadStems"
      | "canUseGestures"
      | "canUseAI"
    >,
  ): boolean {
    return this.state.capabilities[feature];
  }

  /**
   * Get numeric capability value
   */
  getCapabilityValue(
    feature: "networkLatency" | "cacheSize" | "availableStems",
  ): number {
    return this.state.capabilities[feature];
  }

  /**
   * Get offline recommendations
   */
  getRecommendations(): string[] {
    return [...this.state.recommendations];
  }

  /**
   * Force update of offline capabilities
   */
  async updateCapabilities(): Promise<void> {
    const newCapabilities = await this.detectCapabilities();
    const hasChanged = this.hasCapabilitiesChanged(newCapabilities);

    if (hasChanged) {
      this.state.capabilities = newCapabilities;
      this.updateRecommendations();
      this.notifyStateChange();
    }
  }

  /**
   * Get optimized settings for current connection
   */
  getOptimizedSettings(): {
    audioQuality: "low" | "medium" | "high";
    cacheStrategy: "aggressive" | "balanced" | "conservative";
    preloadEnabled: boolean;
    partialLoading: boolean;
  } {
    const { connectionType, connectionSpeed } = this.state;

    // Adjust settings based on connection
    if (!this.state.isOnline || connectionSpeed < 1) {
      return {
        audioQuality: "low",
        cacheStrategy: "aggressive",
        preloadEnabled: false,
        partialLoading: true,
      };
    }

    if (
      connectionSpeed < 5 ||
      connectionType === "slow-2g" ||
      connectionType === "2g"
    ) {
      return {
        audioQuality: "medium",
        cacheStrategy: "balanced",
        preloadEnabled: true,
        partialLoading: true,
      };
    }

    return {
      audioQuality: "high",
      cacheStrategy: "conservative",
      preloadEnabled: true,
      partialLoading: false,
    };
  }

  /**
   * Initialize network monitoring
   */
  private initializeNetworkMonitoring(): void {
    // Monitor connection changes
    window.addEventListener("online", this.handleConnectionChange.bind(this));
    window.addEventListener("offline", this.handleConnectionChange.bind(this));

    // Use Network Information API if available
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      this.networkInfo = {
        downlink: connection.downlink || 0,
        effectiveType: connection.effectiveType || "unknown",
        rtt: connection.rtt || 0,
        type: connection.type || "unknown",
      };

      connection.addEventListener(
        "change",
        this.handleConnectionChange.bind(this),
      );
    }

    // Periodic connection quality check
    this.connectionCheckInterval = setInterval(() => {
      this.performConnectionQualityTest();
    }, 30000); // Check every 30 seconds
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    if ("PerformanceObserver" in window) {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === "navigation") {
              this.updateLatencyMetrics(entry as PerformanceNavigationTiming);
            }
          }
        });

        this.performanceObserver.observe({ entryTypes: ["navigation"] });
      } catch (error) {
        console.warn("Performance monitoring not available:", error);
      }
    }
  }

  /**
   * Initialize capability detection
   */
  private initializeCapabilityDetection(): void {
    setTimeout(() => {
      this.updateCapabilities();
    }, 1000);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    // Listen to sync status changes
    offlineSync.onStatusChange((syncStatus) => {
      this.state.isOnline = syncStatus.isOnline;
      this.updateCapabilities();
    });

    // Listen to visibility changes
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        this.updateCapabilities();
      }
    });
  }

  /**
   * Handle connection changes
   */
  private async handleConnectionChange(): Promise<void> {
    const isOnline = navigator.onLine;
    const wasOnline = this.state.isOnline;

    this.state.isOnline = isOnline;
    this.state.lastOnlineTime = isOnline
      ? Date.now()
      : this.state.lastOnlineTime;

    if (isOnline && !wasOnline) {
      console.log("🌐 Connection restored, updating capabilities...");
      await this.updateCapabilities();

      // Trigger background sync
      offlineSync.syncPendingActions().catch((error) => {
        console.error("Background sync failed:", error);
      });
    } else if (!isOnline) {
      console.log("📴 Connection lost, switching to offline mode");
      await this.updateCapabilities();
    }

    this.notifyStateChange();
  }

  /**
   * Perform connection quality test
   */
  private async performConnectionQualityTest(): Promise<void> {
    if (!navigator.onLine) return;

    try {
      const startTime = performance.now();
      const response = await fetch("/api/silent-audio", {
        method: "HEAD",
        cache: "no-cache",
      });
      const endTime = performance.now();

      if (response.ok) {
        const latency = endTime - startTime;
        this.state.capabilities.networkLatency = latency;

        // Update connection speed estimate
        if (this.networkInfo) {
          this.state.connectionSpeed = this.networkInfo.downlink;
          this.state.connectionType = this.networkInfo.effectiveType as any;
        }

        await this.updateCapabilities();
      }
    } catch (error) {
      console.warn("Connection quality test failed:", error);
    }
  }

  /**
   * Detect available offline capabilities
   */
  private async detectCapabilities(): Promise<OfflineCapabilities> {
    const isOnline = navigator.onLine;
    const cacheStats = await stemCache.getCacheStats();
    const syncStatus = await offlineSync.getSyncStatus();

    // Base capabilities when online
    const capabilities: OfflineCapabilities = {
      canUseStems: true,
      canProcessAudio: true,
      canSaveSettings: true,
      canUploadStems: true,
      canUseGestures: true,
      canUseAI: true,
      networkLatency: 0,
      cacheSize: cacheStats.totalSize,
      availableStems: cacheStats.itemCount,
    };

    if (!isOnline) {
      // Adjust capabilities for offline mode
      capabilities.canUploadStems = false;
      capabilities.canUseAI = false; // AI requires network for processing

      // Check if we have cached stems
      if (cacheStats.itemCount === 0) {
        capabilities.canUseStems = false;
        capabilities.canProcessAudio = false;
      }

      // Check sync queue for pending settings
      if (syncStatus.pendingActions > 0) {
        capabilities.canSaveSettings = false;
      }
    }

    // Adjust based on connection quality
    if (isOnline && this.state.capabilities.networkLatency > 1000) {
      capabilities.canUseAI = false; // High latency makes AI unusable
    }

    return capabilities;
  }

  /**
   * Check if capabilities have changed
   */
  private hasCapabilitiesChanged(
    newCapabilities: OfflineCapabilities,
  ): boolean {
    const current = this.state.capabilities;
    return Object.keys(current).some((key) => {
      const capabilityKey = key as keyof OfflineCapabilities;
      return current[capabilityKey] !== newCapabilities[capabilityKey];
    });
  }

  /**
   * Update recommendations based on current state
   */
  private updateRecommendations(): void {
    const recommendations: string[] = [];
    const { isOnline, capabilities, connectionType } = this.state;

    if (!isOnline) {
      recommendations.push(
        "You are currently offline. Some features are limited.",
      );
      recommendations.push(
        "Cached stems and local processing are still available.",
      );

      if (capabilities.availableStems === 0) {
        recommendations.push(
          "No cached stems available. Connect to internet to process new tracks.",
        );
      }
    } else {
      if (connectionType === "slow-2g" || connectionType === "2g") {
        recommendations.push(
          "Slow connection detected. Consider using cached stems for better performance.",
        );
      }

      if (capabilities.networkLatency > 500) {
        recommendations.push(
          "High latency detected. AI features may be slower than usual.",
        );
      }

      if (capabilities.cacheSize > 400 * 1024 * 1024) {
        recommendations.push(
          "Cache is getting full. Consider clearing old stems to free up space.",
        );
      }
    }

    this.state.recommendations = recommendations;
  }

  /**
   * Update latency metrics
   */
  private updateLatencyMetrics(entry: PerformanceNavigationTiming): void {
    this.state.capabilities.networkLatency =
      entry.responseStart - entry.requestStart;
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyStateChange(): void {
    this.listeners.forEach((listener) => listener(this.getState()));
  }

  /**
   * Get default state
   */
  private getDefaultState(): OfflineState {
    return {
      isOnline: navigator.onLine,
      connectionType: "unknown",
      connectionSpeed: 0,
      lastOnlineTime: navigator.onLine ? Date.now() : null,
      capabilities: {
        canUseStems: false,
        canProcessAudio: false,
        canSaveSettings: false,
        canUploadStems: false,
        canUseGestures: true, // Gestures work offline
        canUseAI: false,
        networkLatency: 0,
        cacheSize: 0,
        availableStems: 0,
      },
      restrictions: [],
      recommendations: [],
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.connectionCheckInterval) {
      clearInterval(this.connectionCheckInterval);
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
    }

    this.listeners.clear();
  }

  /**
   * Get detailed diagnostics
   */
  async getDiagnostics(): Promise<{
    state: OfflineState;
    syncStatus: SyncStatus;
    cacheStats: any;
    networkInfo: NetworkInfo | null;
    timestamp: number;
  }> {
    const [syncStatus, cacheStats] = await Promise.all([
      offlineSync.getSyncStatus(),
      stemCache.getCacheStats(),
    ]);

    return {
      state: this.getState(),
      syncStatus,
      cacheStats,
      networkInfo: this.networkInfo,
      timestamp: Date.now(),
    };
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager();

// Auto-initialize when module loads
if (typeof window !== "undefined") {
  // Initialize after page load
  if (document.readyState === "complete") {
    // Already loaded, initialize immediately
    setTimeout(() => offlineManager.updateCapabilities(), 100);
  } else {
    window.addEventListener("load", () => {
      setTimeout(() => offlineManager.updateCapabilities(), 100);
    });
  }
}
