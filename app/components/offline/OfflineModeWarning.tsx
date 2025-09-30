/**
 * OX Board - Offline Mode Warning Component
 * Warns users about limited functionality when offline
 */

"use client";

import React, { useState, useEffect } from "react";
import { offlineManager, OfflineState } from "../../lib/offline/offlineManager";

interface OfflineModeWarningProps {
  className?: string;
  dismissible?: boolean;
  showRecommendations?: boolean;
}

export const OfflineModeWarning: React.FC<OfflineModeWarningProps> = ({
  className = "",
  dismissible = true,
  showRecommendations = true,
}) => {
  const [offlineState, setOfflineState] = useState<OfflineState>(
    offlineManager.getState(),
  );
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const unsubscribe = offlineManager.onStateChange((newState) => {
      setOfflineState(newState);

      // Auto-show when going offline
      if (!newState.isOnline && offlineState.isOnline) {
        setIsDismissed(false);
      }
    });

    return unsubscribe;
  }, [offlineState.isOnline]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("ox-board-offline-warning-dismissed", "true");
  };

  const handleRetryConnection = () => {
    window.location.reload();
  };

  // Don't show if online or dismissed
  if (offlineState.isOnline || isDismissed) {
    return null;
  }

  // Check if warning was previously dismissed today
  const dismissedToday = localStorage.getItem(
    "ox-board-offline-warning-dismissed",
  );
  if (dismissedToday && dismissible) {
    return null;
  }

  const getRestrictedFeatures = () => {
    const restrictions: string[] = [];

    if (!offlineState.capabilities.canUploadStems) {
      restrictions.push("Stem uploads");
    }
    if (!offlineState.capabilities.canUseAI) {
      restrictions.push("AI features");
    }
    if (!offlineState.capabilities.canSaveSettings) {
      restrictions.push("Settings sync");
    }

    return restrictions;
  };

  const getAvailableFeatures = () => {
    const features: string[] = [];

    if (offlineState.capabilities.canUseStems) {
      features.push("Cached stems");
    }
    if (offlineState.capabilities.canProcessAudio) {
      features.push("Audio processing");
    }
    if (offlineState.capabilities.canUseGestures) {
      features.push("Gesture control");
    }

    return features;
  };

  const restrictedFeatures = getRestrictedFeatures();
  const availableFeatures = getAvailableFeatures();

  return (
    <div
      className={`bg-gradient-to-r from-red-900/20 to-orange-900/20 border border-red-500/30 rounded-lg p-4 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="text-2xl">📡</div>
          <div>
            <h3 className="font-semibold text-red-400">You&apos;re Offline</h3>
            <p className="text-sm text-gray-300">
              Some features are limited without an internet connection
            </p>
          </div>
        </div>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Dismiss warning"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={handleRetryConnection}
          className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 px-3 py-2 rounded text-sm transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="bg-gray-500/20 hover:bg-gray-500/30 text-gray-400 px-3 py-2 rounded text-sm transition-colors"
        >
          {showDetails ? "Hide Details" : "Show Details"}
        </button>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="space-y-4">
          {/* Restricted Features */}
          {restrictedFeatures.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-red-400 mb-2">
                Limited Features:
              </h4>
              <ul className="space-y-1">
                {restrictedFeatures.map((feature, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-300 flex items-center gap-2"
                  >
                    <span className="text-red-400">⚠️</span>
                    {feature} - requires internet connection
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Available Features */}
          {availableFeatures.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-green-400 mb-2">
                Available Offline:
              </h4>
              <ul className="space-y-1">
                {availableFeatures.map((feature, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-300 flex items-center gap-2"
                  >
                    <span className="text-green-400">✅</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Cache Information */}
          <div className="bg-black/30 rounded p-3">
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              Cache Status:
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Cached Stems:</span>
                <span className="ml-2 text-white">
                  {offlineState.capabilities.availableStems}
                </span>
              </div>
              <div>
                <span className="text-gray-400">Cache Size:</span>
                <span className="ml-2 text-white">
                  {(offlineState.capabilities.cacheSize / 1024 / 1024).toFixed(
                    1,
                  )}
                  MB
                </span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          {showRecommendations && offlineState.recommendations.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-blue-400 mb-2">Tips:</h4>
              <ul className="space-y-1">
                {offlineState.recommendations.map((tip, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-300 flex items-start gap-2"
                  >
                    <span className="text-blue-400 mt-0.5">💡</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Connection Info */}
          <div className="text-xs text-gray-400 border-t border-white/10 pt-3">
            <p>
              Last online:{" "}
              {offlineState.lastOnlineTime
                ? new Date(offlineState.lastOnlineTime).toLocaleString()
                : "Unknown"}
            </p>
            <p>Features will automatically restore when connection returns</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineModeWarning;
