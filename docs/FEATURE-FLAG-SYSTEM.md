# Feature Flag System

> **Created**: 2025-10-01
> **Version**: 1.0.0

## Overview

The Feature Flag system controls access to features based on user subscription tiers (Free, Pro, Enterprise). It enables graceful feature gating with upgrade prompts and usage limits.

## Architecture

### Core Components

```
app/lib/featureFlags.ts          # Core logic, tier definitions
app/contexts/FeatureFlagContext.tsx  # React context & hooks
app/components/TierSelector.tsx  # UI for switching tiers
```

### User Tiers

1. **Free Tier**
   - 5 tracks max
   - 10min recording
   - 100MB storage
   - 3 stem separations
   - Terminal UI access
   - Basic gestures

2. **Pro Tier**
   - 100 tracks
   - 2hr recording
   - 10GB storage
   - 100 stem separations
   - All audio features
   - AI mixing
   - Advanced effects
   - Custom themes

3. **Enterprise Tier**
   - Unlimited everything
   - Priority processing
   - Cloud storage
   - All features unlocked

## Usage

### Check Feature Access

```typescript
import { useFeature } from '@/contexts/FeatureFlagContext';
import { Feature } from '@/lib/featureFlags';

function MyComponent() {
  const hasStemSeparation = useFeature(Feature.STEM_SEPARATION);

  if (!hasStemSeparation) {
    return <div>Upgrade to Pro for stem separation</div>;
  }

  return <StemSeparationUI />;
}
```

### Feature Gate Component

```typescript
import { FeatureGate, UpgradePrompt } from '@/contexts/FeatureFlagContext';
import { Feature } from '@/lib/featureFlags';

function MyComponent() {
  return (
    <FeatureGate
      feature={Feature.AI_MIXING}
      fallback={<UpgradePrompt feature={Feature.AI_MIXING} featureName="AI Mixing" />}
    >
      <AIMixingInterface />
    </FeatureGate>
  );
}
```

### Get Feature Limits

```typescript
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';

function MyComponent() {
  const { limits, isWithinLimit } = useFeatureFlags();

  const canAddTrack = isWithinLimit('maxTracks', currentTrackCount);

  return (
    <div>
      <p>Max tracks: {limits.maxTracks}</p>
      <p>Max recording: {limits.maxRecordingMinutes}min</p>
      {!canAddTrack && <p>Track limit reached. Upgrade for more.</p>}
    </div>
  );
}
```

### Check Current Tier

```typescript
import { useFeatureFlags } from '@/contexts/FeatureFlagContext';
import { UserTier } from '@/lib/featureFlags';

function MyComponent() {
  const { userTier } = useFeatureFlags();

  return (
    <div>
      Current tier: {userTier}
      {userTier === UserTier.FREE && <UpgradeButton />}
    </div>
  );
}
```

## Available Features

### Audio Features

- `STEM_SEPARATION` - Separate audio into stems
- `ADVANCED_EFFECTS` - Access advanced audio effects
- `RECORDING` - Record mixes
- `EXPORT_HIGH_QUALITY` - Export in high quality

### UI Features

- `TERMINAL_UI` - Access retro terminal interface
- `CUSTOM_THEMES` - Customize UI themes
- `ADVANCED_VISUALIZATIONS` - 3D visualizations

### AI Features

- `AI_MIXING` - AI-powered mixing suggestions
- `AUTO_BPM_SYNC` - Automatic BPM synchronization
- `SMART_RECOMMENDATIONS` - Smart track recommendations

### Gesture Features

- `ADVANCED_GESTURES` - Advanced gesture controls
- `GESTURE_RECORDING` - Record gesture macros

### Performance

- `UNLIMITED_TRACKS` - No track limits
- `CLOUD_STORAGE` - Cloud backup
- `PRIORITY_PROCESSING` - Priority queue for processing

## Implementation Pattern

### 1. Define Feature

Add to `Feature` enum in `app/lib/featureFlags.ts`:

```typescript
export enum Feature {
  // ...
  MY_NEW_FEATURE = "my_new_feature",
}
```

### 2. Assign to Tiers

Add to `TIER_FEATURES` in `app/lib/featureFlags.ts`:

```typescript
const TIER_FEATURES: Record<UserTier, Feature[]> = {
  [UserTier.FREE]: [
    // Free features
  ],
  [UserTier.PRO]: [
    // Pro features
    Feature.MY_NEW_FEATURE,
  ],
  [UserTier.ENTERPRISE]: Object.values(Feature),
};
```

### 3. Use in Components

```typescript
import { useFeature } from '@/contexts/FeatureFlagContext';
import { Feature } from '@/lib/featureFlags';

function MyFeatureComponent() {
  const hasAccess = useFeature(Feature.MY_NEW_FEATURE);

  if (!hasAccess) {
    return <UpgradePrompt feature={Feature.MY_NEW_FEATURE} featureName="My Feature" />;
  }

  return <MyFeatureUI />;
}
```

## Testing

### Switch Tiers in Development

Click the "⚙️ TIER" button in the top-right to access the tier selector. Changes persist in localStorage.

### Override Feature Flags

For testing specific features:

```typescript
import { getFeatureFlagManager } from "@/lib/featureFlags";

// In browser console or test setup
const manager = getFeatureFlagManager();
manager.setOverride(Feature.STEM_SEPARATION, true); // Force enable
manager.setOverride(Feature.AI_MIXING, false); // Force disable
```

### Clear Overrides

```typescript
manager.clearOverrides();
```

## Persistence

- **User Tier**: Stored in `localStorage` as `userTier`
- **Overrides**: Not persisted (testing only)
- **Feature Access**: Computed from tier + overrides

## UI Components

### TierSelector

Shows available tiers with features and limits. Click to switch tiers (persists to localStorage).

**Location**: Fixed top-right when visible
**Toggle**: "⚙️ TIER" button

### UpgradePrompt

Shows when feature is locked with upgrade CTA.

**Props**:

- `feature`: Feature enum
- `featureName`: Display name

### FeatureGate

Conditionally renders children based on feature access.

**Props**:

- `feature`: Feature enum
- `children`: Content to show if access granted
- `fallback`: Content to show if access denied (optional)

## Integration Points

### With Authentication

```typescript
// After user login
import { initializeFeatureFlags } from "@/lib/featureFlags";

function handleLogin(user) {
  initializeFeatureFlags(user.tier);
}
```

### With Payment

```typescript
// After successful payment
import { useFeatureFlags } from "@/contexts/FeatureFlagContext";
import { UserTier } from "@/lib/featureFlags";

function handleUpgrade() {
  const { setUserTier } = useFeatureFlags();
  setUserTier(UserTier.PRO);
}
```

### With Usage Tracking

```typescript
import { useFeatureFlags } from "@/contexts/FeatureFlagContext";

function TrackManager() {
  const { isWithinLimit } = useFeatureFlags();

  function addTrack() {
    if (!isWithinLimit("maxTracks", currentCount)) {
      showUpgradeModal();
      return;
    }
    // Add track
  }
}
```

## Best Practices

1. **Check Early**: Check feature access before loading heavy resources
2. **Show Value**: Always explain what the user gets with upgrade
3. **Graceful Degradation**: Provide basic functionality for free tier
4. **Clear Messaging**: Use consistent upgrade prompts
5. **Test All Tiers**: Test features in all tier configurations

## Future Enhancements

- [ ] Server-side tier validation
- [ ] Usage analytics per tier
- [ ] A/B testing for tiers
- [ ] Trial periods
- [ ] Feature usage metrics
- [ ] Automated upgrade flows

---

**Status**: ✅ Phase 5 Complete
**Documentation**: Updated 2025-10-01
