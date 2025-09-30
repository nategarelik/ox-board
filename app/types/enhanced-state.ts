// Enhanced State Management Types for OX Gesture Stem Player

export interface StemVolumeState {
  drums: number;
  bass: number;
  melody: number;
  vocals: number;
  original: number;
}

export interface StemMuteState {
  drums: boolean;
  bass: boolean;
  melody: boolean;
  vocals: boolean;
  original: boolean;
}

export interface StemSoloState {
  drums: boolean;
  bass: boolean;
  melody: boolean;
  vocals: boolean;
  original: boolean;
}

export interface StemEQState {
  drums: { low: number; mid: number; high: number };
  bass: { low: number; mid: number; high: number };
  melody: { low: number; mid: number; high: number };
  vocals: { low: number; mid: number; high: number };
  original: { low: number; mid: number; high: number };
}

export interface StemPanState {
  drums: number;
  bass: number;
  melody: number;
  vocals: number;
  original: number;
}

export interface StemPlaybackRateState {
  drums: number;
  bass: number;
  melody: number;
  vocals: number;
  original: number;
}

export interface AudioAnalysisResults {
  bpm: number;
  key: string;
  energy: number;
  danceability: number;
  loudness: number;
  spectralCentroid: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
  mfcc: number[];
  chroma: number[];
  beats: number[];
  segments: Array<{
    start: number;
    duration: number;
    confidence: number;
  }>;
}

export interface AudioBufferState {
  drums?: AudioBuffer;
  bass?: AudioBuffer;
  melody?: AudioBuffer;
  vocals?: AudioBuffer;
  original?: AudioBuffer;
  loading: boolean;
  error?: string;
}

export interface EffectsState {
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
    type: "lowpass" | "highpass" | "bandpass";
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

export interface AudioState {
  // Core audio properties
  stems: StemVolumeState;
  mute: StemMuteState;
  solo: StemSoloState;
  eq: StemEQState;
  pan: StemPanState;
  playbackRate: StemPlaybackRateState;
  mix: number; // Stem mix balance (0 = original only, 1 = stems only)

  // Playback state
  playback: {
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    position: number; // 0-1
    playbackRate: number;
    loop: boolean;
    loopStart?: number;
    loopEnd?: number;
  };

  // Analysis and metadata
  analysis: AudioAnalysisResults | null;
  buffers: AudioBufferState;

  // Effects
  effects: EffectsState;

  // Recording
  recording: {
    isRecording: boolean;
    recordedStems: Partial<StemVolumeState>;
    duration: number;
  };

  // Stream health
  streamHealth: {
    bufferHealth: number; // 0-1
    latency: number;
    droppedFrames: number;
    underruns: number;
  };
}

export interface GestureState {
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

  mappings: {
    [mappingId: string]: {
      gesture: string;
      controlType:
        | "volume"
        | "mute"
        | "solo"
        | "pan"
        | "eq"
        | "playback_rate"
        | "crossfade"
        | "effect";
      targetStem:
        | "drums"
        | "bass"
        | "melody"
        | "vocals"
        | "original"
        | "crossfader"
        | "master";
      params?: {
        eqBand?: "low" | "mid" | "high";
        effectType?: string;
        action?: string;
      };
      sensitivity: number;
      deadzone: number;
      smoothing: number;
    };
  };

  performance: {
    averageLatency: number;
    frameRate: number;
    droppedFrames: number;
    gestureAccuracy: number;
    processingTime: number;
  };

  recording: {
    isRecording: boolean;
    recordedGestures: Array<{
      timestamp: number;
      gesture: string;
      landmarks: number[][];
      confidence: number;
    }>;
    playback: {
      isPlaying: boolean;
      speed: number;
      currentIndex: number;
    };
  };
}

export interface UIState {
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

  theme: {
    mode: "light" | "dark" | "auto";
    accentColor: string;
    fontSize: "small" | "medium" | "large";
    animations: boolean;
    highContrast: boolean;
  };

  preferences: {
    autoSave: boolean;
    confirmActions: boolean;
    showTooltips: boolean;
    gestureFeedback: boolean;
    audioVisualization: boolean;
    keyboardShortcuts: boolean;
  };

  tutorial: {
    currentStep: number;
    totalSteps: number;
    completedSteps: number[];
    isActive: boolean;
    progress: number;
  };

  responsive: {
    isMobile: boolean;
    isTablet: boolean;
    screenSize: "xs" | "sm" | "md" | "lg" | "xl";
    orientation: "portrait" | "landscape";
    touchDevice: boolean;
  };

  debug: {
    showFPS: boolean;
    showLatency: boolean;
    showGestureData: boolean;
    showAudioBuffer: boolean;
    showStoreState: boolean;
    logLevel: "error" | "warn" | "info" | "debug";
  };
}

export interface PerformanceState {
  vitals: {
    fcp: number; // First Contentful Paint
    lcp: number; // Largest Contentful Paint
    cls: number; // Cumulative Layout Shift
    fid: number; // First Input Delay
    ttfb: number; // Time to First Byte
  };

  audio: {
    latency: number;
    bufferUnderruns: number;
    droppedFrames: number;
    processingLoad: number; // CPU usage 0-1
    memoryUsage: number; // MB
  };

  gesture: {
    processingLatency: number;
    frameRate: number;
    accuracy: number;
    confidence: number;
  };

  system: {
    cpuUsage: number;
    memoryUsage: number;
    batteryLevel?: number;
    networkLatency: number;
    isOnline: boolean;
  };

  alerts: Array<{
    id: string;
    type: "error" | "warning" | "info";
    message: string;
    timestamp: number;
    acknowledged: boolean;
    threshold?: {
      metric: string;
      value: number;
      operator: "gt" | "lt" | "eq";
    };
  }>;
}

export interface PWAState {
  online: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  updateAvailable: boolean;
  cacheStatus: {
    stems: number; // Cached stems count
    tracks: number; // Cached tracks count
    totalSize: number; // Cache size in MB
    lastUpdated: number;
  };

  backgroundSync: {
    enabled: boolean;
    pendingUploads: number;
    lastSync: number;
    syncError?: string;
  };
}

export interface SyncState {
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

// Main store state interface
export interface EnhancedStemPlayerState {
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

// Action types for type safety
export interface StemPlayerActions {
  // Audio actions
  setStemVolume: (stemId: keyof StemVolumeState, volume: number) => void;
  setStemMute: (stemId: keyof StemMuteState, muted: boolean) => void;
  setStemSolo: (stemId: keyof StemSoloState, solo: boolean) => void;
  setStemEQ: (
    stemId: keyof StemEQState,
    band: "low" | "mid" | "high",
    value: number,
  ) => void;
  setStemPan: (stemId: keyof StemPanState, pan: number) => void;
  setStemPlaybackRate: (
    stemId: keyof StemPlaybackRateState,
    rate: number,
  ) => void;
  setStemMix: (mix: number) => void;

  // Playback actions
  setPlaybackState: (
    state: "idle" | "loading" | "stopped" | "playing" | "paused",
  ) => void;
  setPlaybackTime: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleLoop: () => void;

  // Analysis actions
  updateAnalysis: (analysis: AudioAnalysisResults) => void;
  updateBufferState: (buffers: Partial<AudioBufferState>) => void;

  // Effects actions
  setEffectParam: (
    effect: keyof EffectsState,
    param: string,
    value: any,
  ) => void;
  toggleEffect: (effect: keyof EffectsState) => void;
  resetEffects: () => void;

  // Recording actions
  startRecording: () => void;
  stopRecording: () => void;
  updateRecordingDuration: (duration: number) => void;

  // Stream health actions
  updateStreamHealth: (health: Partial<AudioState["streamHealth"]>) => void;

  // Gesture actions
  updateGesture: (
    leftHand: HandResult | null,
    rightHand: HandResult | null,
  ) => void;
  addGestureHistory: (entry: GestureState["history"][0]) => void;
  startGestureCalibration: (gesture: string) => void;
  stopGestureCalibration: () => void;
  addCalibrationSample: (
    sample: GestureState["calibration"]["samples"][0],
  ) => void;
  updateGestureMapping: (
    mappingId: string,
    mapping: Partial<GestureState["mappings"][string]>,
  ) => void;
  updateGesturePerformance: (
    metrics: Partial<GestureState["performance"]>,
  ) => void;

  // Gesture recording actions
  startGestureRecording: () => void;
  stopGestureRecording: () => void;
  setGesturePlaybackSpeed: (speed: number) => void;
  setGesturePlaybackIndex: (index: number) => void;

  // UI actions
  togglePanel: (panel: keyof UIState["panels"]) => void;
  setModalState: (modal: keyof UIState["modals"], open: boolean) => void;
  setDrawerState: (drawer: keyof UIState["drawers"], open: boolean) => void;
  setTheme: (theme: Partial<UIState["theme"]>) => void;
  setPreferences: (preferences: Partial<UIState["preferences"]>) => void;
  setTutorialStep: (step: number) => void;
  updateTutorialProgress: (progress: number) => void;
  setResponsiveState: (state: Partial<UIState["responsive"]>) => void;
  setDebugSettings: (settings: Partial<UIState["debug"]>) => void;

  // Performance actions
  updateWebVitals: (vitals: Partial<PerformanceState["vitals"]>) => void;
  updateAudioMetrics: (metrics: Partial<PerformanceState["audio"]>) => void;
  updateGestureMetrics: (metrics: Partial<PerformanceState["gesture"]>) => void;
  updateSystemMetrics: (metrics: Partial<PerformanceState["system"]>) => void;
  addAlert: (
    alert: Omit<PerformanceState["alerts"][0], "id" | "timestamp">,
  ) => void;
  acknowledgeAlert: (alertId: string) => void;
  removeAlert: (alertId: string) => void;

  // PWA actions
  setOnlineStatus: (online: boolean) => void;
  setInstallPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setUpdateAvailable: (available: boolean) => void;
  updateCacheStatus: (status: Partial<PWAState["cacheStatus"]>) => void;
  setBackgroundSyncEnabled: (enabled: boolean) => void;
  addOfflineAction: (
    action: Omit<
      SyncState["offline"]["queue"][0],
      "id" | "timestamp" | "retryCount"
    >,
  ) => void;
  removeOfflineAction: (actionId: string) => void;

  // Sync actions
  setCrossTabEnabled: (enabled: boolean) => void;
  updateTabActivity: (tabId: string, url: string) => void;
  setRealtimeConnected: (connected: boolean) => void;
  updateRealtimeLatency: (latency: number) => void;

  // Session actions
  updateSessionActivity: () => void;
  setSessionId: (id: string) => void;

  // Hydration actions
  setHydrated: (hydrated: boolean) => void;
  updateHydrationVersion: (version: string) => void;

  // Utility actions
  reset: () => void;
  exportState: () => EnhancedStemPlayerState;
  importState: (state: Partial<EnhancedStemPlayerState>) => void;
}

// Import types from existing files
import type { HandResult } from "../lib/gesture/recognition";

// PWA types
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}
