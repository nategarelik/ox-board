/**
 * OX Board - Offline Status Indicator Component
 * Shows current online/offline status with smooth animations
 */

"use client";

import React, { useState, useEffect } from "react";
import { offlineManager, OfflineState } from "../../lib/offline/offlineManager";
import { SyncStatus } from "../../lib/sync/offlineSync";

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = "",
  showDetails = false,
  compact = false,
}) => {
  const [offlineState, setOfflineState] = useState<OfflineState>(
    offlineManager.getState(),
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Subscribe to offline state changes
    const unsubscribeOffline = offlineManager.onStateChange((newState) => {
      setOfflineState(newState);
      setIsVisible(true);

      // Auto-hide after 5 seconds if online and no issues
      if (newState.isOnline && newState.capabilities.canUseStems) {
        setTimeout(() => setIsVisible(false), 5000);
      }
    });

    // Get initial sync status
    const getSyncStatus = async () => {
      try {
        // This would normally come from the offlineSync manager
        // For now, we'll simulate it
        setSyncStatus({
          isOnline: navigator.onLine,
          pendingActions: 0,
          lastSyncTime: Date.now(),
          syncInProgress: false,
          errors: [],
        });
      } catch (error) {
        console.error("Failed to get sync status:", error);
      }
    };

    getSyncStatus();

    return () => {
      unsubscribeOffline();
    };
  }, []);

  const getStatusColor = () => {
    if (!offlineState.isOnline) return "text-red-400";
    if (offlineState.capabilities.networkLatency > 1000)
      return "text-yellow-400";
    return "text-green-400";
  };

  const getStatusIcon = () => {
    if (!offlineState.isOnline) return "📴";
    if (offlineState.capabilities.networkLatency > 1000) return "⚠️";
    return "🌐";
  };

  const getStatusText = () => {
    if (!offlineState.isOnline) return "Offline";
    if (offlineState.capabilities.networkLatency > 1000)
      return "Slow Connection";
    return "Online";
  };

  const formatLatency = (latency: number) => {
    if (latency < 1000) return `${Math.round(latency)}ms`;
    return `${(latency / 1000).toFixed(1)}s`;
  };

  const formatCacheSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${Math.round(mb)}MB`;
    return `${(mb / 1024).toFixed(1)}GB`;
  };

  if (!isVisible && offlineState.isOnline && !showDetails) {
    return null;
  }

  if (compact) {
    return (
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 ${className}`}
      >
        <span className="text-lg">{getStatusIcon()}</span>
        <span className={`text-sm font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
        {offlineState.capabilities.networkLatency > 0 && (
          <span className="text-xs text-gray-400">
            {formatLatency(offlineState.capabilities.networkLatency)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`bg-black/80 backdrop-blur-md border border-white/20 rounded-lg p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{getStatusIcon()}</span>
          <div>
            <h3 className={`font-semibold ${getStatusColor()}`}>
              {getStatusText()}
            </h3>
            <p className="text-sm text-gray-400">
              {offlineState.connectionType !== "unknown"
                ? `${offlineState.connectionType.toUpperCase()} • ${offlineState.connectionSpeed} Mbps`
                : "Checking connection..."}
            </p>
          </div>
        </div>

        {/* Sync indicator */}
        {syncStatus && (
          <div className="flex items-center gap-2">
            {syncStatus.syncInProgress && (
              <div className="flex items-center gap-2 text-blue-400">
                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">Syncing...</span>
              </div>
            )}
            {syncStatus.pendingActions > 0 && (
              <div className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
                {syncStatus.pendingActions} pending
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details */}
      {showDetails && (
        <div className="space-y-3">
          {/* Connection Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Latency:</span>
              <span className={`ml-2 ${getStatusColor()}`}>
                {formatLatency(offlineState.capabilities.networkLatency)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Cache Size:</span>
              <span className="ml-2 text-white">
                {formatCacheSize(offlineState.capabilities.cacheSize)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Available Stems:</span>
              <span className="ml-2 text-white">
                {offlineState.capabilities.availableStems}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Last Sync:</span>
              <span className="ml-2 text-white">
                {syncStatus?.lastSyncTime
                  ? new Date(syncStatus.lastSyncTime).toLocaleTimeString()
                  : "Never"}
              </span>
            </div>
          </div>

          {/* Capabilities */}
          <div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              Available Features:
            </h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(offlineState.capabilities).map(([key, value]) => {
                if (
                  key === "networkLatency" ||
                  key === "cacheSize" ||
                  key === "availableStems"
                ) {
                  return null;
                }

                return (
                  <span
                    key={key}
                    className={`px-2 py-1 rounded text-xs ${
                      value
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {key
                      .replace("canUse", "")
                      .replace(/([A-Z])/g, " $1")
                      .trim()}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          {offlineState.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                Recommendations:
              </h4>
              <ul className="space-y-1">
                {offlineState.recommendations.map((rec, index) => (
                  <li
                    key={index}
                    className="text-xs text-gray-400 flex items-start gap-2"
                  >
                    <span className="text-blue-400 mt-0.5">💡</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
