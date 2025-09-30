/**
 * OX Board - Cache Manager Component
 * Provides user controls for cache management and optimization
 */

"use client";

import React, { useState, useEffect } from "react";
import { stemCache } from "../../lib/storage/stemCache";
import { smartCache } from "../../lib/cache/smartCache";
import { offlineManager } from "../../lib/offline/offlineManager";

interface CacheManagerProps {
  className?: string;
}

export const CacheManager: React.FC<CacheManagerProps> = ({
  className = "",
}) => {
  const [cacheStats, setCacheStats] = useState<any>(null);
  const [smartCacheStats, setSmartCacheStats] = useState<any>(null);
  const [offlineState, setOfflineState] = useState(offlineManager.getState());
  const [isLoading, setIsLoading] = useState(false);
  const [smartCacheEnabled, setSmartCacheEnabled] = useState(true);

  useEffect(() => {
    loadCacheData();

    const unsubscribe = offlineManager.onStateChange((newState) => {
      setOfflineState(newState);
    });

    return unsubscribe;
  }, []);

  const loadCacheData = async () => {
    try {
      const [stats, smartStats] = await Promise.all([
        stemCache.getCacheStats(),
        smartCache.getCacheStats(),
      ]);

      setCacheStats(stats);
      setSmartCacheStats(smartStats);
    } catch (error) {
      console.error("Failed to load cache data:", error);
    }
  };

  const handleClearCache = async () => {
    setIsLoading(true);
    try {
      await stemCache.clearCache();
      await loadCacheData();
      console.log("Cache cleared successfully");
    } catch (error) {
      console.error("Failed to clear cache:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSmartCache = (enabled: boolean) => {
    smartCache.setEnabled(enabled);
    setSmartCacheEnabled(enabled);
  };

  const handleOptimizeCache = async () => {
    setIsLoading(true);
    try {
      // Trigger preloading of frequent stems
      await stemCache.preloadFrequentStems();
      await loadCacheData();
      console.log("Cache optimization completed");
    } catch (error) {
      console.error("Cache optimization failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    return `${(mb / 1024).toFixed(1)} GB`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return date.toLocaleString();
  };

  return (
    <div
      className={`bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg p-6 ${className}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <span className="text-2xl">💾</span>
        <div>
          <h3 className="text-lg font-semibold text-white">Cache Manager</h3>
          <p className="text-sm text-gray-400">
            Manage offline storage and optimization
          </p>
        </div>
      </div>

      {/* Cache Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-black/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Stem Cache</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Total Size:</span>
              <span className="text-white">
                {cacheStats ? formatBytes(cacheStats.totalSize) : "Loading..."}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Items:</span>
              <span className="text-white">
                {cacheStats ? cacheStats.itemCount : "Loading..."}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Oldest Item:</span>
              <span className="text-white">
                {cacheStats ? formatDate(cacheStats.oldestItem) : "Loading..."}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Newest Item:</span>
              <span className="text-white">
                {cacheStats ? formatDate(cacheStats.newestItem) : "Loading..."}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-black/30 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Smart Cache
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Predictions:</span>
              <span className="text-white">
                {smartCacheStats
                  ? smartCacheStats.predictionsCount
                  : "Loading..."}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Active Preloads:</span>
              <span className="text-white">
                {smartCacheStats
                  ? smartCacheStats.activePreloads
                  : "Loading..."}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Hit Rate:</span>
              <span className="text-white">
                {smartCacheStats
                  ? `${(smartCacheStats.cacheHitRate * 100).toFixed(1)}%`
                  : "Loading..."}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span
                className={`text-white ${smartCacheEnabled ? "text-green-400" : "text-gray-400"}`}
              >
                {smartCacheEnabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Info */}
      <div className="bg-black/30 rounded-lg p-4 mb-6">
        <h4 className="text-sm font-medium text-gray-300 mb-3">
          Connection Status
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Status:</span>
            <p
              className={`font-medium ${offlineState.isOnline ? "text-green-400" : "text-red-400"}`}
            >
              {offlineState.isOnline ? "Online" : "Offline"}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Latency:</span>
            <p className="text-white">
              {offlineState.capabilities.networkLatency > 0
                ? `${Math.round(offlineState.capabilities.networkLatency)}ms`
                : "N/A"}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Type:</span>
            <p className="text-white">
              {offlineState.connectionType !== "unknown"
                ? offlineState.connectionType.toUpperCase()
                : "Unknown"}
            </p>
          </div>
          <div>
            <span className="text-gray-400">Speed:</span>
            <p className="text-white">
              {offlineState.connectionSpeed > 0
                ? `${offlineState.connectionSpeed.toFixed(1)} Mbps`
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {/* Smart Cache Toggle */}
        <div className="flex items-center justify-between p-3 bg-black/30 rounded-lg">
          <div>
            <h4 className="text-sm font-medium text-white">
              Smart Pre-caching
            </h4>
            <p className="text-xs text-gray-400">
              Automatically cache frequently used resources
            </p>
          </div>
          <button
            onClick={() => handleToggleSmartCache(!smartCacheEnabled)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              smartCacheEnabled ? "bg-purple-600" : "bg-gray-600"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                smartCacheEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={handleOptimizeCache}
            disabled={isLoading}
            className="bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-50 text-purple-400 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            {isLoading ? "Optimizing..." : "Optimize Cache"}
          </button>

          <button
            onClick={loadCacheData}
            disabled={isLoading}
            className="bg-blue-500/20 hover:bg-blue-500/30 disabled:opacity-50 text-blue-400 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            Refresh Stats
          </button>

          <button
            onClick={handleClearCache}
            disabled={isLoading}
            className="bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-400 px-4 py-3 rounded-lg text-sm font-medium transition-colors"
          >
            {isLoading ? "Clearing..." : "Clear Cache"}
          </button>
        </div>

        {/* Warning for Clear Cache */}
        <div className="text-xs text-gray-400 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
          <p className="flex items-center gap-2">
            <span>⚠️</span>
            Clearing cache will remove all downloaded stems and require
            re-downloading when online.
          </p>
        </div>
      </div>

      {/* Cache Recommendations */}
      <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <h4 className="text-sm font-medium text-blue-400 mb-2">
          Optimization Tips:
        </h4>
        <ul className="space-y-1 text-xs text-gray-300">
          <li>
            • Enable smart caching on fast connections for better performance
          </li>
          <li>• Clear old cache items regularly to free up space</li>
          <li>• Use partial loading on slow connections to save bandwidth</li>
          <li>• High-priority stems are protected from automatic eviction</li>
        </ul>
      </div>
    </div>
  );
};

export default CacheManager;
