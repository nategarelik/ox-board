"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  FeatureFlagManager,
  Feature,
  UserTier,
  getFeatureFlagManager,
  initializeFeatureFlags,
} from "@/lib/featureFlags";

interface FeatureFlagContextValue {
  hasFeature: (feature: Feature) => boolean;
  userTier: UserTier;
  setUserTier: (tier: UserTier) => void;
  limits: {
    maxTracks: number;
    maxRecordingMinutes: number;
    maxStorageMB: number;
    maxStemSeparations: number;
    exportQuality: "standard" | "high" | "studio";
  };
  availableFeatures: Feature[];
  lockedFeatures: Feature[];
  isWithinLimit: (limitType: string, currentValue: number) => boolean;
}

const FeatureFlagContext = createContext<FeatureFlagContextValue | null>(null);

interface FeatureFlagProviderProps {
  children: React.ReactNode;
  initialTier?: UserTier;
}

export function FeatureFlagProvider({
  children,
  initialTier = UserTier.FREE,
}: FeatureFlagProviderProps) {
  const [manager] = useState<FeatureFlagManager>(() =>
    initializeFeatureFlags(initialTier),
  );
  const [userTier, setUserTierState] = useState<UserTier>(initialTier);

  // Load tier from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTier = localStorage.getItem("userTier") as UserTier | null;
      if (savedTier && Object.values(UserTier).includes(savedTier)) {
        setUserTierState(savedTier);
        manager.setUserTier(savedTier);
      }
    }
  }, [manager]);

  const hasFeature = useCallback(
    (feature: Feature) => {
      return manager.hasFeature(feature);
    },
    [manager],
  );

  const setUserTier = useCallback(
    (tier: UserTier) => {
      setUserTierState(tier);
      manager.setUserTier(tier);

      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("userTier", tier);
      }
    },
    [manager],
  );

  const isWithinLimit = useCallback(
    (limitType: string, currentValue: number) => {
      return manager.isWithinLimit(limitType as any, currentValue);
    },
    [manager],
  );

  const value: FeatureFlagContextValue = {
    hasFeature,
    userTier,
    setUserTier,
    limits: manager.getLimits(),
    availableFeatures: manager.getAvailableFeatures(),
    lockedFeatures: manager.getLockedFeatures(),
    isWithinLimit,
  };

  return (
    <FeatureFlagContext.Provider value={value}>
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to access feature flags
 */
export function useFeatureFlags(): FeatureFlagContextValue {
  const context = useContext(FeatureFlagContext);

  if (!context) {
    throw new Error(
      "useFeatureFlags must be used within a FeatureFlagProvider",
    );
  }

  return context;
}

/**
 * Hook to check single feature
 */
export function useFeature(feature: Feature): boolean {
  const { hasFeature } = useFeatureFlags();
  return hasFeature(feature);
}

/**
 * Component to conditionally render based on feature access
 */
interface FeatureGateProps {
  feature: Feature;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function FeatureGate({
  feature,
  children,
  fallback = null,
}: FeatureGateProps) {
  const hasAccess = useFeature(feature);

  return <>{hasAccess ? children : fallback}</>;
}

/**
 * Component to show upgrade prompt for locked features
 */
interface UpgradePromptProps {
  feature: Feature;
  featureName: string;
}

export function UpgradePrompt({ feature, featureName }: UpgradePromptProps) {
  const { userTier } = useFeatureFlags();

  return (
    <div className="border-2 border-yellow-500/50 bg-yellow-500/10 p-4 rounded">
      <div className="flex items-center gap-2 text-yellow-500 font-mono mb-2">
        <span className="text-lg">🔒</span>
        <span className="font-bold">FEATURE LOCKED</span>
      </div>
      <p className="text-sm text-yellow-600 font-mono mb-3">
        {featureName} is not available in your current tier ({userTier}).
      </p>
      <button className="border-2 border-yellow-500 bg-yellow-500/20 hover:bg-yellow-500/30 px-4 py-2 text-yellow-400 font-mono font-bold transition-all">
        UPGRADE TO PRO
      </button>
    </div>
  );
}
