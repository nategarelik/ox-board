/**
 * Feature Flag System
 * Controls access to features based on user tier (free/pro)
 */

export enum UserTier {
  FREE = "free",
  PRO = "pro",
  ENTERPRISE = "enterprise",
}

export enum Feature {
  // Audio Features
  STEM_SEPARATION = "stem_separation",
  ADVANCED_EFFECTS = "advanced_effects",
  RECORDING = "recording",
  EXPORT_HIGH_QUALITY = "export_high_quality",

  // UI Features
  TERMINAL_UI = "terminal_ui",
  CUSTOM_THEMES = "custom_themes",
  ADVANCED_VISUALIZATIONS = "advanced_visualizations",

  // AI Features
  AI_MIXING = "ai_mixing",
  AUTO_BPM_SYNC = "auto_bpm_sync",
  SMART_RECOMMENDATIONS = "smart_recommendations",

  // Gesture Features
  ADVANCED_GESTURES = "advanced_gestures",
  GESTURE_RECORDING = "gesture_recording",

  // Performance
  UNLIMITED_TRACKS = "unlimited_tracks",
  CLOUD_STORAGE = "cloud_storage",
  PRIORITY_PROCESSING = "priority_processing",
}

interface FeatureLimits {
  maxTracks: number;
  maxRecordingMinutes: number;
  maxStorageMB: number;
  maxStemSeparations: number;
  exportQuality: "standard" | "high" | "studio";
}

const TIER_FEATURES: Record<UserTier, Feature[]> = {
  [UserTier.FREE]: [Feature.TERMINAL_UI, Feature.AUTO_BPM_SYNC],
  [UserTier.PRO]: [
    Feature.TERMINAL_UI,
    Feature.STEM_SEPARATION,
    Feature.ADVANCED_EFFECTS,
    Feature.RECORDING,
    Feature.EXPORT_HIGH_QUALITY,
    Feature.CUSTOM_THEMES,
    Feature.ADVANCED_VISUALIZATIONS,
    Feature.AI_MIXING,
    Feature.AUTO_BPM_SYNC,
    Feature.SMART_RECOMMENDATIONS,
    Feature.ADVANCED_GESTURES,
    Feature.GESTURE_RECORDING,
    Feature.UNLIMITED_TRACKS,
  ],
  [UserTier.ENTERPRISE]: Object.values(Feature), // All features
};

const TIER_LIMITS: Record<UserTier, FeatureLimits> = {
  [UserTier.FREE]: {
    maxTracks: 5,
    maxRecordingMinutes: 10,
    maxStorageMB: 100,
    maxStemSeparations: 3,
    exportQuality: "standard",
  },
  [UserTier.PRO]: {
    maxTracks: 100,
    maxRecordingMinutes: 120,
    maxStorageMB: 10000,
    maxStemSeparations: 100,
    exportQuality: "high",
  },
  [UserTier.ENTERPRISE]: {
    maxTracks: Infinity,
    maxRecordingMinutes: Infinity,
    maxStorageMB: Infinity,
    maxStemSeparations: Infinity,
    exportQuality: "studio",
  },
};

/**
 * Feature Flag Manager
 */
export class FeatureFlagManager {
  private userTier: UserTier;
  private overrides: Map<Feature, boolean>;

  constructor(userTier: UserTier = UserTier.FREE) {
    this.userTier = userTier;
    this.overrides = new Map();
  }

  /**
   * Check if user has access to a feature
   */
  hasFeature(feature: Feature): boolean {
    // Check overrides first
    if (this.overrides.has(feature)) {
      return this.overrides.get(feature)!;
    }

    // Check tier features
    return TIER_FEATURES[this.userTier].includes(feature);
  }

  /**
   * Get feature limits for current tier
   */
  getLimits(): FeatureLimits {
    return TIER_LIMITS[this.userTier];
  }

  /**
   * Override a feature flag (for testing/development)
   */
  setOverride(feature: Feature, enabled: boolean): void {
    this.overrides.set(feature, enabled);
  }

  /**
   * Clear all overrides
   */
  clearOverrides(): void {
    this.overrides.clear();
  }

  /**
   * Get current user tier
   */
  getUserTier(): UserTier {
    return this.userTier;
  }

  /**
   * Set user tier
   */
  setUserTier(tier: UserTier): void {
    this.userTier = tier;
  }

  /**
   * Check if within limits
   */
  isWithinLimit(limitType: keyof FeatureLimits, currentValue: number): boolean {
    const limits = this.getLimits();
    const limit = limits[limitType];

    if (typeof limit === "number") {
      return currentValue < limit;
    }

    return true;
  }

  /**
   * Get features available for current tier
   */
  getAvailableFeatures(): Feature[] {
    return TIER_FEATURES[this.userTier];
  }

  /**
   * Get features locked for current tier
   */
  getLockedFeatures(): Feature[] {
    const available = new Set(this.getAvailableFeatures());
    return Object.values(Feature).filter((f) => !available.has(f));
  }
}

/**
 * Singleton instance for global access
 */
let featureFlagManager: FeatureFlagManager | null = null;

export function getFeatureFlagManager(): FeatureFlagManager {
  if (!featureFlagManager) {
    // Default to FREE tier, can be overridden after auth
    featureFlagManager = new FeatureFlagManager(UserTier.FREE);
  }
  return featureFlagManager;
}

/**
 * Initialize with user tier (call after authentication)
 */
export function initializeFeatureFlags(tier: UserTier): FeatureFlagManager {
  featureFlagManager = new FeatureFlagManager(tier);
  return featureFlagManager;
}

/**
 * Helper function to check feature access
 */
export function hasFeature(feature: Feature): boolean {
  return getFeatureFlagManager().hasFeature(feature);
}

/**
 * Helper function to get limits
 */
export function getFeatureLimits(): FeatureLimits {
  return getFeatureFlagManager().getLimits();
}
