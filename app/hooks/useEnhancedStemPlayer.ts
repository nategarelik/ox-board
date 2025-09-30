import { useCallback } from "react";
import { useEnhancedStemPlayerStore } from "../stores/enhancedStemPlayerStore";
import type { HandResult } from "../lib/gesture/recognition";

// Audio control hooks
export const useStemControls = () => {
  const store = useEnhancedStemPlayerStore() as any;

  const setStemVolume = useCallback(
    (
      stemId: "drums" | "bass" | "melody" | "vocals" | "original",
      volume: number,
    ) => {
      store.setStemVolume(stemId, volume);
    },
    [store],
  );

  const setStemMute = useCallback(
    (
      stemId: "drums" | "bass" | "melody" | "vocals" | "original",
      muted: boolean,
    ) => {
      store.setStemMute(stemId, muted);
    },
    [store],
  );

  const setStemSolo = useCallback(
    (
      stemId: "drums" | "bass" | "melody" | "vocals" | "original",
      solo: boolean,
    ) => {
      store.setStemSolo(stemId, solo);
    },
    [store],
  );

  const setStemEQ = useCallback(
    (
      stemId: "drums" | "bass" | "melody" | "vocals" | "original",
      band: "low" | "mid" | "high",
      value: number,
    ) => {
      store.setStemEQ(stemId, band, value);
    },
    [store],
  );

  return {
    stems: (store.audio as any)?.stems || {},
    mute: (store.audio as any)?.mute || {},
    solo: (store.audio as any)?.solo || {},
    eq: (store.audio as any)?.eq || {},
    pan: (store.audio as any)?.pan || {},
    playbackRate: (store.audio as any)?.playbackRate || {},
    mix: (store.audio as any)?.mix || 1,
    playback: (store.audio as any)?.playback || {
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isLoading: false,
    },
    effects: (store.audio as any)?.effects || {},
    setStemVolume,
    setStemMute,
    setStemSolo,
    setStemEQ,
    setStemPan: store.setStemPan,
    setStemPlaybackRate: store.setStemPlaybackRate,
    setStemMix: store.setStemMix,
    setPlaybackState: store.setPlaybackState,
    setPlaybackTime: store.setPlaybackTime,
    setPlaybackRate: store.setPlaybackRate,
    toggleLoop: store.toggleLoop,
    setEffectParam: store.setEffectParam,
    toggleEffect: store.toggleEffect,
    resetEffects: store.resetEffects,
    startRecording: store.startRecording,
    stopRecording: store.stopRecording,
    updateRecordingDuration: store.updateRecordingDuration,
  };
};

// Gesture control hooks
export const useGestureControls = () => {
  const store = useEnhancedStemPlayerStore() as any;

  const updateGestures = useCallback(
    (leftHand: HandResult | null, rightHand: HandResult | null) => {
      store.updateGesture(leftHand, rightHand);
    },
    [store],
  );

  const startCalibration = useCallback(
    (gesture: string) => {
      store.startGestureCalibration(gesture);
    },
    [store],
  );

  const stopCalibration = useCallback(() => {
    store.stopGestureCalibration();
  }, [store]);

  const startRecording = useCallback(() => {
    store.startGestureRecording();
  }, [store]);

  const stopRecording = useCallback(() => {
    store.stopGestureRecording();
  }, [store]);

  return {
    current: (store.gesture as any)?.current || null,
    history: (store.gesture as any)?.history || [],
    calibration: (store.gesture as any)?.calibration || {
      isCalibrating: false,
      samples: [],
      baseline: {},
    },
    mappings: (store.gesture as any)?.mappings || {},
    performance: (store.gesture as any)?.performance || {
      processingLatency: 0,
      frameRate: 0,
      accuracy: 0,
      confidence: 0,
    },
    recording: (store.gesture as any)?.recording || {
      isRecording: false,
      startTime: 0,
      frames: [],
    },
    updateGestures,
    addGestureHistory: store.addGestureHistory,
    startCalibration,
    stopCalibration,
    addCalibrationSample: store.addCalibrationSample,
    updateGestureMapping: store.updateGestureMapping,
    updateGesturePerformance: store.updateGesturePerformance,
    startRecording,
    stopRecording,
    setGesturePlaybackSpeed: store.setGesturePlaybackSpeed,
    setGesturePlaybackIndex: store.setGesturePlaybackIndex,
  };
};

// UI control hooks
export const useUIControls = () => {
  const store = useEnhancedStemPlayerStore() as any;

  return {
    panels: store.ui?.panels || {},
    modals: store.ui?.modals || {},
    drawers: store.ui?.drawers || {},
    theme: store.ui?.theme || { mode: "light", accentColor: "#0070f3" },
    preferences: store.ui?.preferences || {},
    tutorial: store.ui?.tutorial || { step: 0, progress: 0, isActive: false },
    responsive: store.ui?.responsive || {
      breakpoint: "desktop",
      orientation: "landscape",
    },
    debug: store.ui?.debug || { enabled: false, logLevel: "info" },
    togglePanel: store.togglePanel,
    setModalState: store.setModalState,
    setDrawerState: store.setDrawerState,
    setTheme: store.setTheme,
    setPreferences: store.setPreferences,
    setTutorialStep: store.setTutorialStep,
    updateTutorialProgress: store.updateTutorialProgress,
    setResponsiveState: store.setResponsiveState,
    setDebugSettings: store.setDebugSettings,
  };
};

// Performance monitoring hooks
export const usePerformanceMonitor = () => {
  const store = useEnhancedStemPlayerStore() as any;

  return {
    vitals: (store.performance as any)?.vitals || {},
    audio: (store.performance as any)?.audio || {
      latency: 0,
      bufferUnderruns: 0,
      droppedFrames: 0,
      processingLoad: 0,
      memoryUsage: 0,
    },
    gesture: (store.performance as any)?.gesture || {
      processingLatency: 0,
      frameRate: 0,
      accuracy: 0,
      confidence: 0,
    },
    system: (store.performance as any)?.system || {},
    alerts: (store.performance as any)?.alerts || [],
    updateWebVitals: store.updateWebVitals,
    updateAudioMetrics: store.updateAudioMetrics,
    updateGestureMetrics: store.updateGestureMetrics,
    updateSystemMetrics: store.updateSystemMetrics,
    addAlert: store.addAlert,
    acknowledgeAlert: store.acknowledgeAlert,
    removeAlert: store.removeAlert,
  };
};

// PWA and sync hooks
export const usePWAFeatures = () => {
  const store = useEnhancedStemPlayerStore() as any;

  return {
    online: (store.pwa as any)?.online || false,
    installPrompt: (store.pwa as any)?.installPrompt || null,
    updateAvailable: (store.pwa as any)?.updateAvailable || false,
    cacheStatus: (store.pwa as any)?.cacheStatus || {
      stems: 0,
      tracks: 0,
      totalSize: 0,
      lastUpdated: 0,
    },
    backgroundSync: (store.pwa as any)?.backgroundSync || {
      enabled: false,
      pendingUploads: 0,
      lastSync: 0,
    },
    setOnlineStatus: store.setOnlineStatus,
    setInstallPrompt: store.setInstallPrompt,
    setUpdateAvailable: store.setUpdateAvailable,
    updateCacheStatus: store.updateCacheStatus,
    setBackgroundSyncEnabled: store.setBackgroundSyncEnabled,
    addOfflineAction: store.addOfflineAction,
    removeOfflineAction: store.removeOfflineAction,
  };
};

export const useSyncFeatures = () => {
  const store = useEnhancedStemPlayerStore() as any;

  return {
    crossTab: (store.sync as any)?.crossTab || { enabled: false, tabs: [] },
    offline: (store.sync as any)?.offline || { queue: [], lastSync: 0 },
    realtime: (store.sync as any)?.realtime || { connected: false, latency: 0 },
    setCrossTabEnabled: store.setCrossTabEnabled,
    updateTabActivity: store.updateTabActivity,
    setRealtimeConnected: store.setRealtimeConnected,
    updateRealtimeLatency: store.updateRealtimeLatency,
  };
};

// Session management hooks
export const useSession = () => {
  const store = useEnhancedStemPlayerStore() as any;

  return {
    session: (store.session as any) || {
      id: "",
      startTime: 0,
      lastActivity: 0,
      version: "1.0.0",
    },
    updateSessionActivity: store.updateSessionActivity,
    setSessionId: store.setSessionId,
  };
};

// Store utility hooks
export const useStoreUtils = () => {
  const store = useEnhancedStemPlayerStore() as any;

  return {
    isHydrated: (store.hydration as any)?.isHydrated || false,
    reset: store.reset,
    exportState: store.exportState,
    importState: store.importState,
  };
};

// Combined hook for full store access
export const useEnhancedStemPlayer = () => {
  const store = useEnhancedStemPlayerStore() as any;

  return {
    // Audio
    audio: store.audio as any,

    // Gesture
    gesture: store.gesture as any,

    // UI
    ui: store.ui as any,

    // Performance
    performance: store.performance as any,

    // PWA
    pwa: store.pwa as any,

    // Sync
    sync: store.sync as any,

    // Session
    session: store.session as any,

    // Hydration
    hydration: store.hydration as any,

    // Actions
    setStemVolume: store.setStemVolume,
    setStemMute: store.setStemMute,
    setStemSolo: store.setStemSolo,
    setStemEQ: store.setStemEQ,
    setStemPan: store.setStemPan,
    setStemPlaybackRate: store.setStemPlaybackRate,
    setStemMix: store.setStemMix,

    setPlaybackState: store.setPlaybackState,
    setPlaybackTime: store.setPlaybackTime,
    setPlaybackRate: store.setPlaybackRate,
    toggleLoop: store.toggleLoop,

    updateAnalysis: store.updateAnalysis,
    updateBufferState: store.updateBufferState,

    setEffectParam: store.setEffectParam,
    toggleEffect: store.toggleEffect,
    resetEffects: store.resetEffects,

    startRecording: store.startRecording,
    stopRecording: store.stopRecording,
    updateRecordingDuration: store.updateRecordingDuration,

    updateStreamHealth: store.updateStreamHealth,

    updateGesture: store.updateGesture,
    addGestureHistory: store.addGestureHistory,
    startGestureCalibration: store.startGestureCalibration,
    stopGestureCalibration: store.stopGestureCalibration,
    addCalibrationSample: store.addCalibrationSample,
    updateGestureMapping: store.updateGestureMapping,
    updateGesturePerformance: store.updateGesturePerformance,

    startGestureRecording: store.startGestureRecording,
    stopGestureRecording: store.stopGestureRecording,
    setGesturePlaybackSpeed: store.setGesturePlaybackSpeed,
    setGesturePlaybackIndex: store.setGesturePlaybackIndex,

    togglePanel: store.togglePanel,
    setModalState: store.setModalState,
    setDrawerState: store.setDrawerState,
    setTheme: store.setTheme,
    setPreferences: store.setPreferences,
    setTutorialStep: store.setTutorialStep,
    updateTutorialProgress: store.updateTutorialProgress,
    setResponsiveState: store.setResponsiveState,
    setDebugSettings: store.setDebugSettings,

    updateWebVitals: store.updateWebVitals,
    updateAudioMetrics: store.updateAudioMetrics,
    updateGestureMetrics: store.updateGestureMetrics,
    updateSystemMetrics: store.updateSystemMetrics,
    addAlert: store.addAlert,
    acknowledgeAlert: store.acknowledgeAlert,
    removeAlert: store.removeAlert,

    setOnlineStatus: store.setOnlineStatus,
    setInstallPrompt: store.setInstallPrompt,
    setUpdateAvailable: store.setUpdateAvailable,
    updateCacheStatus: store.updateCacheStatus,
    setBackgroundSyncEnabled: store.setBackgroundSyncEnabled,
    addOfflineAction: store.addOfflineAction,
    removeOfflineAction: store.removeOfflineAction,

    setCrossTabEnabled: store.setCrossTabEnabled,
    updateTabActivity: store.updateTabActivity,
    setRealtimeConnected: store.setRealtimeConnected,
    updateRealtimeLatency: store.updateRealtimeLatency,

    updateSessionActivity: store.updateSessionActivity,
    setSessionId: store.setSessionId,

    setHydrated: store.setHydrated,
    updateHydrationVersion: store.updateHydrationVersion,

    reset: store.reset,
    exportState: store.exportState,
    importState: store.importState,
  };
};
