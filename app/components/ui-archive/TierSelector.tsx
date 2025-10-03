"use client";

import React from "react";
import { useFeatureFlags } from "@/contexts/FeatureFlagContext";
import { UserTier } from "@/lib/featureFlags";

export function TierSelector() {
  const { userTier, setUserTier, limits } = useFeatureFlags();

  const tiers = [
    {
      tier: UserTier.FREE,
      name: "Free",
      icon: "🆓",
      color: "green",
      features: [
        `${limits.maxTracks} tracks max`,
        `${limits.maxRecordingMinutes}min recording`,
        "Terminal UI",
        "Basic gestures",
      ],
    },
    {
      tier: UserTier.PRO,
      name: "Pro",
      icon: "⭐",
      color: "yellow",
      features: [
        "100 tracks",
        "2hr recording",
        "Stem separation",
        "Advanced effects",
        "AI mixing",
        "Custom themes",
      ],
    },
    {
      tier: UserTier.ENTERPRISE,
      name: "Enterprise",
      icon: "🚀",
      color: "purple",
      features: [
        "Unlimited tracks",
        "Unlimited recording",
        "All features",
        "Priority support",
        "Cloud storage",
      ],
    },
  ];

  return (
    <div className="fixed top-20 right-4 z-50 bg-black/90 border-2 border-green-500/50 p-4 font-mono">
      <div className="text-green-400 font-bold mb-3 text-sm">
        SUBSCRIPTION TIER
      </div>

      <div className="space-y-2">
        {tiers.map((t) => {
          const isActive = userTier === t.tier;
          const borderColor = isActive
            ? `border-${t.color}-500`
            : `border-${t.color}-900`;
          const bgColor = isActive ? `bg-${t.color}-500/20` : `bg-black/40`;
          const textColor = isActive
            ? `text-${t.color}-400`
            : `text-${t.color}-700`;

          return (
            <button
              key={t.tier}
              onClick={() => setUserTier(t.tier)}
              className={`w-full text-left p-3 border-2 transition-all duration-200
                         ${isActive ? "border-green-500 bg-green-500/20" : "border-green-900 bg-black/40"}
                         ${isActive ? "text-green-400" : "text-green-700"}
                         hover:border-green-500 hover:bg-green-500/10`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm">
                  {t.icon} {t.name.toUpperCase()}
                </span>
                {isActive && (
                  <span className="text-xs text-green-400">ACTIVE</span>
                )}
              </div>
              <div className="text-xs space-y-1">
                {t.features.slice(0, 3).map((feature, i) => (
                  <div key={i}>• {feature}</div>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-3 pt-3 border-t border-green-900 text-xs text-green-600">
        <div>
          Max Tracks: {limits.maxTracks === Infinity ? "∞" : limits.maxTracks}
        </div>
        <div>
          Recording:{" "}
          {limits.maxRecordingMinutes === Infinity
            ? "∞"
            : limits.maxRecordingMinutes}
          min
        </div>
        <div>Quality: {limits.exportQuality}</div>
      </div>
    </div>
  );
}
