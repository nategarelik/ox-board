/**
 * OX Board - Sync Status Component
 * Shows synchronization progress and pending actions
 */

"use client";

import React, { useState, useEffect } from "react";
import {
  offlineSync,
  SyncStatus as SyncStatusType,
  OfflineAction,
} from "../../lib/sync/offlineSync";

interface SyncStatusComponentProps {
  className?: string;
  showDetails?: boolean;
}

export const SyncStatusComponent: React.FC<SyncStatusComponentProps> = ({
  className = "",
  showDetails = false,
}) => {
  const [syncStatus, setSyncStatus] = useState<SyncStatusType | null>(null);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Subscribe to sync status changes
    const unsubscribe = offlineSync.onStatusChange((status) => {
      setSyncStatus(status);

      // If there are pending actions, show details
      if (status.pendingActions > 0) {
        setIsExpanded(true);
      }
    });

    // Load initial data
    loadSyncData();

    return unsubscribe;
  }, []);

  const loadSyncData = async () => {
    try {
      const status = await offlineSync.getSyncStatus();
      setSyncStatus(status);

      // Get pending actions for details view
      if (status.pendingActions > 0) {
        // This would normally get the actual pending actions
        // For now, we'll show a summary
      }
    } catch (error) {
      console.error("Failed to load sync data:", error);
    }
  };

  const getSyncIcon = () => {
    if (!syncStatus) return "⏳";
    if (syncStatus.syncInProgress) return "🔄";
    if (syncStatus.pendingActions > 0) return "⏳";
    if (syncStatus.errors.length > 0) return "⚠️";
    return "✅";
  };

  const getSyncColor = () => {
    if (!syncStatus) return "text-gray-400";
    if (syncStatus.syncInProgress) return "text-blue-400";
    if (syncStatus.pendingActions > 0) return "text-yellow-400";
    if (syncStatus.errors.length > 0) return "text-red-400";
    return "text-green-400";
  };

  const getSyncText = () => {
    if (!syncStatus) return "Loading...";
    if (syncStatus.syncInProgress) return "Syncing...";
    if (syncStatus.pendingActions > 0)
      return `${syncStatus.pendingActions} actions pending`;
    if (syncStatus.errors.length > 0)
      return `${syncStatus.errors.length} sync errors`;
    return "Synced";
  };

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return "Never";
    const now = Date.now();
    const diff = now - timestamp;

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const getActionTypeIcon = (type: OfflineAction["type"]) => {
    switch (type) {
      case "stem_upload":
        return "🎵";
      case "settings_save":
        return "⚙️";
      case "stem_process":
        return "⚡";
      case "user_action":
        return "👤";
      default:
        return "📝";
    }
  };

  const getActionTypeText = (type: OfflineAction["type"]) => {
    switch (type) {
      case "stem_upload":
        return "Upload Stem";
      case "settings_save":
        return "Save Settings";
      case "stem_process":
        return "Process Audio";
      case "user_action":
        return "User Action";
      default:
        return "Unknown Action";
    }
  };

  if (!syncStatus) {
    return (
      <div
        className={`bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg p-3 ${className}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-400">Loading sync status...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-black/50 backdrop-blur-sm border border-white/10 rounded-lg ${className}`}
    >
      {/* Summary */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">{getSyncIcon()}</span>
          <div>
            <p className={`font-medium ${getSyncColor()}`}>{getSyncText()}</p>
            <p className="text-xs text-gray-400">
              Last sync: {formatLastSync(syncStatus.lastSyncTime)}
            </p>
          </div>
        </div>

        {showDetails && (
          <div className="flex items-center gap-2">
            {syncStatus.pendingActions > 0 && (
              <span className="bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded text-xs">
                {syncStatus.pendingActions}
              </span>
            )}
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      {isExpanded && showDetails && (
        <div className="border-t border-white/10 p-3 space-y-3">
          {/* Pending Actions */}
          {syncStatus.pendingActions > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2">
                Pending Actions:
              </h4>
              <div className="space-y-2">
                {/* Mock pending actions for demonstration */}
                {[
                  {
                    type: "stem_upload" as const,
                    timestamp: Date.now() - 300000,
                    priority: "high" as const,
                  },
                  {
                    type: "settings_save" as const,
                    timestamp: Date.now() - 600000,
                    priority: "medium" as const,
                  },
                ].map((action, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 bg-black/30 rounded"
                  >
                    <span className="text-lg">
                      {getActionTypeIcon(action.type)}
                    </span>
                    <div className="flex-1">
                      <p className="text-sm text-white">
                        {getActionTypeText(action.type)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(action.timestamp).toLocaleTimeString()} •
                        Priority: {action.priority}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      <button
                        className="text-xs text-blue-400 hover:text-blue-300"
                        onClick={() => {
                          // Retry action
                          console.log("Retrying action:", action.type);
                        }}
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sync Errors */}
          {syncStatus.errors.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-2">
                Sync Errors:
              </h4>
              <div className="space-y-2">
                {syncStatus.errors.slice(0, 3).map((error, index) => (
                  <div
                    key={index}
                    className="p-2 bg-red-500/10 border border-red-500/20 rounded"
                  >
                    <p className="text-xs text-red-400">{error.error}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(error.timestamp).toLocaleString()} • Retry #
                      {error.retryCount}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sync Statistics */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
            <div>
              <span className="text-xs text-gray-400">Pending Actions</span>
              <p className="text-lg font-semibold text-white">
                {syncStatus.pendingActions}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-400">Errors</span>
              <p className="text-lg font-semibold text-red-400">
                {syncStatus.errors.length}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded text-sm transition-colors"
              onClick={() => {
                offlineSync.syncPendingActions();
              }}
            >
              Sync Now
            </button>
            <button
              className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-3 py-2 rounded text-sm transition-colors"
              onClick={() => {
                offlineSync.clearPendingActions();
              }}
            >
              Clear Queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncStatusComponent;
