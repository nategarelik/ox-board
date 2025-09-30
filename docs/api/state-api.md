# State Management API

## Overview

The OX Board State Management API provides a comprehensive, type-safe state management system using Zustand with modular slices. The system manages audio state, gesture state, UI state, performance metrics, PWA features, and cross-tab synchronization.

## Core Architecture

### EnhancedStemPlayerStore

Main Zustand store combining all state slices with middleware and persistence.

```typescript
interface EnhancedStemPlayerState {
  // Core state slices
  audio: AudioState;
  gesture: GestureState;
  ui: UIState;
  performance: PerformanceState;
  pwa: PWAState;
  sync: SyncState;

  // Session management
  session: {
    id: string;
    startTime: number;
    lastActivity: number;
    version: string;
  };

  // Hydration state
  hydration: {
    isHydrated: boolean;
    lastHydrated: number;
    version: string;
  };
}
```

### State Slices

The store is organized into modular slices for better maintainability:

- **AudioStateSlice**: Stem volumes, playback, effects
- **GestureStateSlice**: Gesture recognition, mappings, performance
- **UIStateSlice**: UI panels, themes, preferences
- **PerformanceStateSlice**: Web vitals, metrics, alerts
- **PWASlice**: Offline support, caching, installation
- **SyncSlice**: Cross-tab sync, real-time updates

## Audio State Management

### Stem Control

```typescript
interface StemVolumeState {
  drums: number;    // 0-1
  bass: number;     // 0-1
  melody: number;   // 0-1
  vocals: number;   // 0-1
  original: number; // 0-1
}

// Volume control actions
setStemVolume(stemId: keyof StemVolumeState, volume: number): void
setStemMute(stemId: keyof StemMuteState, muted: boolean): void
setStemSolo(stemId: keyof StemSoloState, solo: boolean): void
setStemEQ(stemId: keyof StemEQState, band: 'low' | 'mid' | 'high', value: number): void
setStemPan(stemId: keyof StemPanState, pan: number): void
setStemPlaybackRate(stemId: keyof StemPlaybackRateState, rate: number): void
```

**Usage**:

```typescript
// Set individual stem volume
useEnhancedStemPlayerStore.getState().setStemVolume("vocals", 0.8);

// Mute drums
useEnhancedStemPlayerStore.getState().setStemMute("drums", true);

// Solo vocals
useEnhancedStemPlayerStore.getState().setStemSolo("vocals", true);

// Adjust EQ
useEnhancedStemPlayerStore.getState().setStemEQ("bass", "low", 2);
```

### Playback Control

```typescript
interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  position: number;        // 0-1 normalized
  playbackRate: number;    // 0.5-2.0
  loop: boolean;
  loopStart?: number;
  loopEnd?: number;
}

// Playback actions
setPlaybackState(state: 'idle' | 'loading' | 'stopped' | 'playing' | 'paused'): void
setPlaybackTime(time: number): void
setPlaybackRate(rate: number): void
toggleLoop(): void
```

**Usage**:

```typescript
// Playback control
useEnhancedStemPlayerStore.getState().setPlaybackState("playing");
useEnhancedStemPlayerStore.getState().setPlaybackTime(45.5);
useEnhancedStemPlayerStore.getState().setPlaybackRate(1.1);
useEnhancedStemPlayerStore.getState().toggleLoop();
```

### Effects State

```typescript
interface EffectsState {
  reverb: {
    enabled: boolean;
    roomSize: number;
    dampening: number;
    wet: number;
  };
  delay: {
    enabled: boolean;
    delayTime: number;
    feedback: number;
    wet: number;
  };
  filter: {
    enabled: boolean;
    frequency: number;
    resonance: number;
    type: 'lowpass' | 'highpass' | 'bandpass';
  };
  distortion: {
    enabled: boolean;
    amount: number;
    tone: number;
  };
  compressor: {
    enabled: boolean;
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
  };
}

// Effects actions
setEffectParam(effect: keyof EffectsState, param: string, value: any): void
toggleEffect(effect: keyof EffectsState): void
resetEffects(): void
```

**Usage**:

```typescript
// Enable and configure reverb
useEnhancedStemPlayerStore.getState().toggleEffect("reverb");
useEnhancedStemPlayerStore.getState().setEffectParam("reverb", "roomSize", 0.8);
useEnhancedStemPlayerStore.getState().setEffectParam("reverb", "wet", 0.3);

// Configure filter sweep
useEnhancedStemPlayerStore
  .getState()
  .setEffectParam("filter", "type", "lowpass");
useEnhancedStemPlayerStore
  .getState()
  .setEffectParam("filter", "frequency", 1000);
```

## Gesture State Management

### Gesture Recognition State

```typescript
interface GestureState {
  current: {
    leftHand: HandResult | null;
    rightHand: HandResult | null;
    confidence: number;
    timestamp: number;
  };
  history: Array<{
    timestamp: number;
    leftHand: HandResult | null;
    rightHand: HandResult | null;
    gesture: string;
    confidence: number;
  }>;
  calibration: {
    isCalibrating: boolean;
    samples: Array<{
      gesture: string;
      landmarks: number[][];
      timestamp: number;
    }>;
    baseline: {
      [gesture: string]: {
        landmarks: number[][];
        confidence: number;
      };
    };
  };
  // ... performance and recording state
}
```

### Gesture Mapping

```typescript
interface GestureMappings {
  [mappingId: string]: {
    gesture: string;
    controlType: 'volume' | 'mute' | 'solo' | 'pan' | 'eq' | 'playback_rate' | 'crossfade' | 'effect';
    targetStem: 'drums' | 'bass' | 'melody' | 'vocals' | 'original' | 'crossfader' | 'master';
    params?: {
      eqBand?: 'low' | 'mid' | 'high';
      effectType?: string;
      action?: string;
    };
    sensitivity: number;
    deadzone: number;
    smoothing: number;
  };
}

// Gesture actions
updateGesture(leftHand: HandResult | null, rightHand: HandResult | null): void
addGestureHistory(entry: GestureState['history'][0]): void
startGestureCalibration(gesture: string): void
stopGestureCalibration(): void
updateGestureMapping(mappingId: string, mapping: Partial<GestureState['mappings'][string]>): void
```

**Usage**:

```typescript
// Update current gesture
useEnhancedStemPlayerStore.getState().updateGesture(leftHand, rightHand);

// Add to gesture history
const historyEntry = {
  timestamp: Date.now(),
  leftHand,
  rightHand,
  gesture: "PINCH",
  confidence: 0.9,
};
useEnhancedStemPlayerStore.getState().addGestureHistory(historyEntry);

// Configure gesture mapping
useEnhancedStemPlayerStore.getState().updateGestureMapping("mapping_1", {
  gesture: "PINCH",
  controlType: "volume",
  targetStem: "vocals",
  sensitivity: 1.0,
  deadzone: 0.1,
  smoothing: 0.3,
});
```

## UI State Management

### Panel Management

```typescript
interface UIState {
  panels: {
    stemMixer: boolean;
    gestureControl: boolean;
    performanceMonitor: boolean;
    aiAssistant: boolean;
    effectsRack: boolean;
    trackBrowser: boolean;
    settings: boolean;
  };
  modals: {
    trackUpload: boolean;
    stemSeparation: boolean;
    gestureCalibration: boolean;
    settings: boolean;
    help: boolean;
    confirmation: boolean;
  };
  drawers: {
    left: boolean;
    right: boolean;
    bottom: boolean;
  };
  // ... theme, preferences, tutorial, responsive state
}

// UI actions
togglePanel(panel: keyof UIState['panels']): void
setModalState(modal: keyof UIState['modals'], open: boolean): void
setDrawerState(drawer: keyof UIState['drawers'], open: boolean): void
setTheme(theme: Partial<UIState['theme']>): void
setPreferences(preferences: Partial<UIState['preferences']>): void
```

**Usage**:

```typescript
// Toggle UI panels
useEnhancedStemPlayerStore.getState().togglePanel("stemMixer");
useEnhancedStemPlayerStore.getState().togglePanel("gestureControl");

// Open modals
useEnhancedStemPlayerStore.getState().setModalState("trackUpload", true);
useEnhancedStemPlayerStore.getState().setModalState("settings", true);

// Configure theme
useEnhancedStemPlayerStore.getState().setTheme({
  mode: "dark",
  accentColor: "#ff6b6b",
  fontSize: "medium",
});
```

## Performance State Management

### Web Vitals Tracking

```typescript
interface PerformanceState {
  vitals: {
    fcp: number;    // First Contentful Paint
    lcp: number;    // Largest Contentful Paint
    cls: number;    // Cumulative Layout Shift
    fid: number;    // First Input Delay
    ttfb: number;   // Time to First Byte
  };
  audio: {
    latency: number;
    bufferUnderruns: number;
    droppedFrames: number;
    processingLoad: number;
    memoryUsage: number;
  };
  gesture: {
    processingLatency: number;
    frameRate: number;
    accuracy: number;
    confidence: number;
  };
  // ... system metrics and alerts
}

// Performance actions
updateWebVitals(vitals: Partial<PerformanceState['vitals']>): void
updateAudioMetrics(metrics: Partial<PerformanceState['audio']>): void
updateGestureMetrics(metrics: Partial<PerformanceState['gesture']>): void
addAlert(alert: Omit<PerformanceState['alerts'][0], 'id' | 'timestamp'>): void
```

**Usage**:

```typescript
// Update Web Vitals
useEnhancedStemPlayerStore.getState().updateWebVitals({
  lcp: 1250,
  fid: 50,
  cls: 0.05,
});

// Update audio metrics
useEnhancedStemPlayerStore.getState().updateAudioMetrics({
  latency: 8.5,
  processingLoad: 0.12,
  memoryUsage: 45,
});

// Add performance alert
useEnhancedStemPlayerStore.getState().addAlert({
  type: "warning",
  message: "High audio latency detected",
  acknowledged: false,
  threshold: {
    metric: "latency",
    value: 15,
    operator: "gt",
  },
});
```

## PWA State Management

### Offline Support

```typescript
interface PWAState {
  online: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  updateAvailable: boolean;
  cacheStatus: {
    stems: number;
    tracks: number;
    totalSize: number;
    lastUpdated: number;
  };
  backgroundSync: {
    enabled: boolean;
    pendingUploads: number;
    lastSync: number;
    syncError?: string;
  };
}

// PWA actions
setOnlineStatus(online: boolean): void
setInstallPrompt(prompt: BeforeInstallPromptEvent | null): void
setUpdateAvailable(available: boolean): void
updateCacheStatus(status: Partial<PWAState['cacheStatus']>): void
```

**Usage**:

```typescript
// Handle online/offline status
useEnhancedStemPlayerStore.getState().setOnlineStatus(navigator.onLine);

// Handle PWA install prompt
window.addEventListener("beforeinstallprompt", (e) => {
  useEnhancedStemPlayerStore.getState().setInstallPrompt(e);
});

// Update cache status
useEnhancedStemPlayerStore.getState().updateCacheStatus({
  stems: 15,
  tracks: 8,
  totalSize: 250,
  lastUpdated: Date.now(),
});
```

## Cross-Tab Synchronization

### Sync State

```typescript
interface SyncState {
  crossTab: {
    enabled: boolean;
    tabs: Array<{
      id: string;
      url: string;
      lastActivity: number;
    }>;
    broadcastChannel: BroadcastChannel | null;
  };
  offline: {
    queue: Array<{
      id: string;
      action: string;
      payload: any;
      timestamp: number;
      retryCount: number;
    }>;
    isOnline: boolean;
    lastSync: number;
  };
  realtime: {
    connected: boolean;
    latency: number;
    lastMessage: number;
    reconnectAttempts: number;
  };
}

// Sync actions
setCrossTabEnabled(enabled: boolean): void
updateTabActivity(tabId: string, url: string): void
setRealtimeConnected(connected: boolean): void
addOfflineAction(action: Omit<SyncState['offline']['queue'][0], 'id' | 'timestamp' | 'retryCount'>): void
```

**Usage**:

```typescript
// Enable cross-tab sync
useEnhancedStemPlayerStore.getState().setCrossTabEnabled(true);

// Add offline action for later sync
useEnhancedStemPlayerStore.getState().addOfflineAction({
  action: "setStemVolume",
  payload: { stemId: "vocals", volume: 0.8 },
});

// Update real-time connection status
useEnhancedStemPlayerStore.getState().setRealtimeConnected(true);
useEnhancedStemPlayerStore.getState().updateRealtimeLatency(45);
```

## Store Middleware

### DevTools Middleware

```typescript
// Development tools with Redux DevTools compatibility
const store = create<EnhancedStemPlayerState>()(
  devtools(
    combine({
      audio: audioSlice,
      gesture: gestureSlice,
      ui: uiSlice,
      performance: performanceSlice,
      pwa: pwaSlice,
      sync: syncSlice,
    }),
    {
      name: "ox-board-store",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);
```

### Persistence Middleware

```typescript
// Persist critical state to localStorage
const persistedStore = persist(store, {
  name: "ox-board-storage",
  partialize: (state) => ({
    // Only persist essential state
    audio: {
      stems: state.audio.stems,
      mute: state.audio.mute,
      solo: state.audio.solo,
      eq: state.audio.eq,
      pan: state.audio.pan,
    },
    ui: {
      theme: state.ui.theme,
      preferences: state.ui.preferences,
    },
    gesture: {
      mappings: state.gesture.mappings,
      calibration: state.gesture.calibration,
    },
  }),
  version: 1,
});
```

### Subscription Middleware

```typescript
// React to state changes
const unsubscribers = new Set<() => void>();

// Subscribe to specific state changes
const unsubscribe = useEnhancedStemPlayerStore.subscribe(
  (state) => state.audio.playback.isPlaying,
  (isPlaying) => {
    if (isPlaying) {
      // Start audio visualization
      startVisualization();
    } else {
      // Stop audio visualization
      stopVisualization();
    }
  },
);

// Cleanup subscriptions
unsubscribers.add(unsubscribe);
```

## Advanced Usage Patterns

### State Selectors

```typescript
// Create optimized selectors
const stemVolumes = (state: EnhancedStemPlayerState) => state.audio.stems;
const isAnyStemSolo = (state: EnhancedStemPlayerState) =>
  Object.values(state.audio.solo).some(Boolean);
const activeGestures = (state: EnhancedStemPlayerState) =>
  state.gesture.history.filter(h => h.confidence > 0.8);

// Use selectors with hooks
const StemVolumesDisplay = () => {
  const volumes = useEnhancedStemPlayerStore(stemVolumes);
  return (
    <div>
      {Object.entries(volumes).map(([stem, volume]) => (
        <div key={stem}>{stem}: {volume}</div>
      ))}
    </div>
  );
};
```

### State Immutability

```typescript
// Correct: Use immer for immutable updates
useEnhancedStemPlayerStore.setState((state) => {
  state.audio.stems.vocals = 0.8;
  state.audio.mute.drums = true;
});

// Incorrect: Direct mutation (will break time-travel debugging)
const state = useEnhancedStemPlayerStore.getState();
// state.audio.stems.vocals = 0.8; // DON'T DO THIS
```

### Performance Optimization

```typescript
// Use shallow equality for better performance
const shallowStore = useEnhancedStemPlayerStore(
  (state) => ({
    stems: state.audio.stems,
    playback: state.audio.playback,
  }),
  shallow, // Only re-render if shallow equal objects change
);

// Batch state updates
useEnhancedStemPlayerStore.setState((state) => {
  // Multiple updates in single transaction
  state.audio.stems.drums = 0.9;
  state.audio.stems.bass = 0.7;
  state.audio.effects.reverb.enabled = true;
});
```

### State Debugging

```typescript
// Export current state for debugging
const exportState = () => {
  const state = useEnhancedStemPlayerStore.getState();
  console.log("Current state:", state);
  return state;
};

// Import state for testing
const importState = (stateData: Partial<EnhancedStemPlayerState>) => {
  useEnhancedStemPlayerStore.setState(stateData);
};

// Reset to default state
const resetState = () => {
  useEnhancedStemPlayerStore.getState().reset();
};
```

## Integration Examples

### React Components

```typescript
// Custom hook for stem control
const useStemControl = (stemId: StemId) => {
  const volume = useEnhancedStemPlayerStore(
    (state) => state.audio.stems[stemId]
  );
  const muted = useEnhancedStemPlayerStore(
    (state) => state.audio.mute[stemId]
  );
  const solo = useEnhancedStemPlayerStore(
    (state) => state.audio.solo[stemId]
  );

  const setVolume = useCallback((vol: number) => {
    useEnhancedStemPlayerStore.getState().setStemVolume(stemId, vol);
  }, [stemId]);

  const setMute = useCallback((mute: boolean) => {
    useEnhancedStemPlayerStore.getState().setStemMute(stemId, mute);
  }, [stemId]);

  const setSolo = useCallback((soloState: boolean) => {
    useEnhancedStemPlayerStore.getState().setStemSolo(stemId, soloState);
  }, [stemId]);

  return { volume, muted, solo, setVolume, setMute, setSolo };
};

// Gesture-controlled stem mixer
const GestureStemMixer = ({ stemId }: { stemId: StemId }) => {
  const { volume, setVolume } = useStemControl(stemId);
  const gestureData = useEnhancedStemPlayerStore(
    (state) => state.gesture.current
  );

  // Update volume based on gesture
  useEffect(() => {
    if (gestureData.leftHand) {
      const pinchGesture = detectPinchGesture(gestureData.leftHand);
      if (pinchGesture && pinchGesture.confidence > 0.7) {
        const newVolume = 1 - pinchGesture.data.pinchStrength;
        setVolume(newVolume);
      }
    }
  }, [gestureData, setVolume]);

  return (
    <StemVolumeSlider
      stemId={stemId}
      value={volume}
      onChange={setVolume}
    />
  );
};
```

### External API Integration

```typescript
// Sync with external audio APIs
class AudioAPIIntegration {
  private store = useEnhancedStemPlayerStore.getState();

  async loadTrackFromAPI(trackId: string) {
    try {
      // Load track metadata
      const metadata = await audioAPI.getTrackMetadata(trackId);

      // Update store with track info
      this.store.setState((state) => {
        state.audio.analysis = metadata.analysis;
        state.audio.playback.duration = metadata.duration;
      });

      // Load audio buffer
      const audioBuffer = await audioAPI.getTrackBuffer(trackId);
      await AudioService.getInstance().loadStems({
        original: audioBuffer,
      });
    } catch (error) {
      console.error("Failed to load track from API:", error);
      this.store.getState().addAlert({
        type: "error",
        message: "Failed to load track from external API",
      });
    }
  }

  // Sync gesture mappings with cloud
  async syncGestureMappings() {
    const mappings = this.store.getState().gesture.mappings;

    try {
      await cloudAPI.syncGestureMappings(mappings);

      this.store.getState().addAlert({
        type: "info",
        message: "Gesture mappings synced to cloud",
      });
    } catch (error) {
      this.store.getState().addAlert({
        type: "error",
        message: "Failed to sync gesture mappings",
      });
    }
  }
}
```

## Best Practices

### State Organization

1. **Slice Modularity**: Keep slices focused and single-purpose
2. **Action Naming**: Use clear, descriptive action names
3. **Type Safety**: Leverage TypeScript for compile-time safety
4. **Immutability**: Always use immutable state updates

### Performance

1. **Selective Subscriptions**: Only subscribe to needed state
2. **Shallow Equality**: Use shallow comparison for better performance
3. **Batched Updates**: Batch multiple state updates together
4. **Computed Values**: Use selectors for derived state

### Debugging

1. **Redux DevTools**: Enable for development debugging
2. **State Logging**: Log state changes in development
3. **Action Tracing**: Track action execution flow
4. **Performance Monitoring**: Monitor state update performance

### Persistence

1. **Selective Persistence**: Only persist essential state
2. **Version Management**: Handle state schema migrations
3. **Storage Limits**: Be aware of localStorage limitations
4. **Error Recovery**: Handle corrupted persisted state

## Browser Compatibility

All state management features work across all supported browsers with consistent behavior and performance characteristics.
