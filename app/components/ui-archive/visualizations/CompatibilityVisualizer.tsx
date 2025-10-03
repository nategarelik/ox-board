"use client";

import React from "react";
import { CompatibilityScore } from "../../../lib/ai/mixAssistant";

interface CompatibilityVisualizerProps {
  compatibility: CompatibilityScore;
  className?: string;
}

/**
 * Visual representation of track compatibility for mixing
 * Shows harmonic, rhythmic, energetic, and spectral compatibility
 */
export const CompatibilityVisualizer: React.FC<
  CompatibilityVisualizerProps
> = ({ compatibility, className = "" }) => {
  const getScoreColor = (score: number): string => {
    if (score >= 0.8)
      return "text-green-400 bg-green-400/20 border-green-400/50";
    if (score >= 0.6)
      return "text-yellow-400 bg-yellow-400/20 border-yellow-400/50";
    if (score >= 0.4)
      return "text-orange-400 bg-orange-400/20 border-orange-400/50";
    return "text-red-400 bg-red-400/20 border-red-400/50";
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 0.8) return "Excellent";
    if (score >= 0.6) return "Good";
    if (score >= 0.4) return "Fair";
    return "Poor";
  };

  const scoreItems = [
    { label: "Harmonic", score: compatibility.harmonic, icon: "🎵" },
    { label: "Rhythmic", score: compatibility.rhythmic, icon: "🥁" },
    { label: "Energetic", score: compatibility.energetic, icon: "⚡" },
    { label: "Spectral", score: compatibility.spectral, icon: "🌊" },
  ];

  return (
    <div
      className={`bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4 ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Track Compatibility
        </h3>
        <div
          className={`px-3 py-1 rounded-full border ${getScoreColor(compatibility.overall)}`}
        >
          <span className="text-sm font-medium">
            {Math.round(compatibility.overall * 100)}% -{" "}
            {getScoreLabel(compatibility.overall)}
          </span>
        </div>
      </div>

      {/* Overall Compatibility Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-400">Overall Compatibility</span>
          <span className="text-sm text-white font-medium">
            {Math.round(compatibility.overall * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              compatibility.overall >= 0.8
                ? "bg-green-400"
                : compatibility.overall >= 0.6
                  ? "bg-yellow-400"
                  : compatibility.overall >= 0.4
                    ? "bg-orange-400"
                    : "bg-red-400"
            }`}
            style={{ width: `${compatibility.overall * 100}%` }}
          />
        </div>
      </div>

      {/* Individual Scores */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {scoreItems.map((item) => (
          <div key={item.label} className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-lg">{item.icon}</span>
                <span className="text-sm text-gray-300">{item.label}</span>
              </div>
              <span className="text-sm text-white font-medium">
                {Math.round(item.score * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  item.score >= 0.8
                    ? "bg-green-400"
                    : item.score >= 0.6
                      ? "bg-yellow-400"
                      : item.score >= 0.4
                        ? "bg-orange-400"
                        : "bg-red-400"
                }`}
                style={{ width: `${item.score * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Compatibility Details */}
      <div className="border-t border-gray-700 pt-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">
          Compatibility Details
        </h4>
        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-400">Key Compatible:</span>
            <span
              className={
                compatibility.details.keyCompatibility
                  ? "text-green-400"
                  : "text-red-400"
              }
            >
              {compatibility.details.keyCompatibility ? "Yes" : "No"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">BPM Difference:</span>
            <span className="text-white">
              {compatibility.details.bpmDifference.toFixed(1)} BPM
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Energy Match:</span>
            <span className="text-white">
              {Math.round(compatibility.details.energyMatch * 100)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Frequency Clash:</span>
            <span
              className={
                compatibility.details.frequencyClash < 0.3
                  ? "text-green-400"
                  : "text-yellow-400"
              }
            >
              {compatibility.details.frequencyClash < 0.3 ? "Low" : "Medium"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Mix Points:</span>
            <span className="text-white">
              {compatibility.details.compatibleMixPoints.length} compatible
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompatibilityVisualizer;
