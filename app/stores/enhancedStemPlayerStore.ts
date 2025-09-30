"use client";

import { create, type StateCreator } from "zustand";
import { devtools, subscribeWithSelector } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { enhancedStorage } from "../lib/storage/enhancedStorage";
import type {
  EnhancedStemPlayerState,
  StemPlayerActions,
} from "../types/enhanced-state";

// Note: Slice interfaces are defined locally in this file to avoid conflicts

// PWA types
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// Basic store interface
interface CombinedStoreState {
  // State slices
  audio: any;
  gesture: any;
  ui: any;
  performance: any;
  pwa: any;
  sync: any;
  session: any;
  hydration: any;

  // Actions
  setStemVolume: (stemId: string, volume: number) => void;
  setStemMute: (stemId: string, muted: boolean) => void;
  setStemSolo: (stemId: string, solo: boolean) => void;
  setStemEQ: (stemId: string, band: string, value: number) => void;
  setStemPan: (stemId: string, pan: number) => void;
  setStemPlaybackRate: (stemId: string, rate: number) => void;
  setStemMix: (mix: number) => void;
  setPlaybackState: (state: string) => void;
  setPlaybackTime: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleLoop: () => void;
  updateAnalysis: (analysis: any) => void;
  updateBufferState: (buffers: any) => void;
  setEffectParam: (effect: string, param: string, value: any) => void;
  toggleEffect: (effect: string) => void;
  resetEffects: () => void;
  startRecording: () => void;
  stopRecording: () => void;
  updateRecordingDuration: (duration: number) => void;
  updateStreamHealth: (health: any) => void;
  updateGesture: (leftHand: any, rightHand: any) => void;
  addGestureHistory: (entry: any) => void;
  startGestureCalibration: (gesture: string) => void;
  stopGestureCalibration: () => void;
  addCalibrationSample: (sample: any) => void;
  updateGestureMapping: (mappingId: string, mapping: any) => void;
  updateGesturePerformance: (metrics: any) => void;
  startGestureRecording: () => void;
  stopGestureRecording: () => void;
  setGesturePlaybackSpeed: (speed: number) => void;
  setGesturePlaybackIndex: (index: number) => void;
  togglePanel: (panel: string) => void;
  setModalState: (modal: string, open: boolean) => void;
  setDrawerState: (drawer: string, open: boolean) => void;
  setTheme: (theme: any) => void;
  setPreferences: (preferences: any) => void;
  setTutorialStep: (step: number) => void;
  updateTutorialProgress: (progress: number) => void;
  setResponsiveState: (state: any) => void;
  setDebugSettings: (settings: any) => void;
  updateWebVitals: (vitals: any) => void;
  updateAudioMetrics: (metrics: any) => void;
  updateGestureMetrics: (metrics: any) => void;
  updateSystemMetrics: (metrics: any) => void;
  addAlert: (alert: any) => void;
  acknowledgeAlert: (alertId: string) => void;
  removeAlert: (alertId: string) => void;
  setOnlineStatus: (online: boolean) => void;
  setInstallPrompt: (prompt: any) => void;
  setUpdateAvailable: (available: boolean) => void;
  updateCacheStatus: (status: any) => void;
  setBackgroundSyncEnabled: (enabled: boolean) => void;
  addOfflineAction: (action: any) => void;
  removeOfflineAction: (actionId: string) => void;
  setCrossTabEnabled: (enabled: boolean) => void;
  updateTabActivity: (tabId: string, url: string) => void;
  setRealtimeConnected: (connected: boolean) => void;
  updateRealtimeLatency: (latency: number) => void;
  updateSessionActivity: () => void;
  setSessionId: (id: string) => void;
  setHydrated: (hydrated: boolean) => void;
  updateHydrationVersion: (version: string) => void;
  reset: () => void;
}

// Import all slices
import {
  createAudioStateSlice,
  type AudioStateSlice,
} from "./slices/audioStateSlice";
import {
  createGestureStateSlice,
  type GestureStateSlice,
} from "./slices/gestureStateSlice";
import { createUIStateSlice, type UIStateSlice } from "./slices/uiStateSlice";
import {
  createPerformanceStateSlice,
  type PerformanceStateSlice,
} from "./slices/performanceStateSlice";

// PWA State Management
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

interface PWAStateSlice extends PWAState {
  setOnlineStatus: (online: boolean) => void;
  setInstallPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  setUpdateAvailable: (available: boolean) => void;
  updateCacheStatus: (status: Partial<PWAState["cacheStatus"]>) => void;
  setBackgroundSyncEnabled: (enabled: boolean) => void;
  addOfflineAction: (action: { type: string; payload: any }) => void;
  removeOfflineAction: (actionId: string) => void;
}

const initialPWAState: PWAState = {
  online: navigator.onLine,
  installPrompt: null,
  updateAvailable: false,
  cacheStatus: {
    stems: 0,
    tracks: 0,
    totalSize: 0,
    lastUpdated: Date.now(),
  },
  backgroundSync: {
    enabled: false,
    pendingUploads: 0,
    lastSync: Date.now(),
  },
};

// Sync State Management
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

interface SyncStateSlice extends SyncState {
  setCrossTabEnabled: (enabled: boolean) => void;
  updateTabActivity: (tabId: string, url: string) => void;
  setRealtimeConnected: (connected: boolean) => void;
  updateRealtimeLatency: (latency: number) => void;
  addOfflineAction: (action: { action: string; payload: any }) => void;
  processOfflineQueue: () => void;
}

const initialSyncState: SyncState = {
  crossTab: {
    enabled: false,
    tabs: [],
    broadcastChannel: null,
  },
  offline: {
    queue: [],
    isOnline: navigator.onLine,
    lastSync: Date.now(),
  },
  realtime: {
    connected: false,
    latency: 0,
    lastMessage: Date.now(),
    reconnectAttempts: 0,
  },
};

// Session Management
interface SessionState {
  id: string;
  startTime: number;
  lastActivity: number;
  version: string;
}

interface SessionStateSlice extends SessionState {
  updateSessionActivity: () => void;
  setSessionId: (id: string) => void;
}

const initialSessionState: SessionState = {
  id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  startTime: Date.now(),
  lastActivity: Date.now(),
  version: "1.0.0",
};

// Hydration Management
interface HydrationState {
  isHydrated: boolean;
  lastHydrated: number;
  version: string;
}

interface HydrationStateSlice extends HydrationState {
  setHydrated: (hydrated: boolean) => void;
  updateHydrationVersion: (version: string) => void;
}

const initialHydrationState: HydrationState = {
  isHydrated: false,
  lastHydrated: 0,
  version: "1.0.0",
};

// PWA State Slice Implementation
const createPWAStateSlice: StateCreator<
  EnhancedStemPlayerState,
  [],
  [],
  PWAStateSlice
> = (set, get) => ({
  ...initialPWAState,

  setOnlineStatus: (online) => {
    set((state) => ({
      pwa: {
        ...state.pwa,
        online,
        sync: {
          ...state.sync,
          offline: {
            ...state.sync.offline,
            isOnline: online,
          },
        },
      },
    }));
  },

  setInstallPrompt: (prompt) => {
    set((state) => ({
      pwa: {
        ...state.pwa,
        installPrompt: prompt,
      },
    }));
  },

  setUpdateAvailable: (available) => {
    set((state) => ({
      pwa: {
        ...state.pwa,
        updateAvailable: available,
      },
    }));
  },

  updateCacheStatus: (status) => {
    set((state) => ({
      pwa: {
        ...state.pwa,
        cacheStatus: {
          ...state.pwa.cacheStatus,
          ...status,
        },
      },
    }));
  },

  setBackgroundSyncEnabled: (enabled) => {
    set((state) => ({
      pwa: {
        ...state.pwa,
        backgroundSync: {
          ...state.pwa.backgroundSync,
          enabled,
        },
      },
    }));
  },

  addOfflineAction: (action) => {
    set((state) => ({
      pwa: {
        ...state.pwa,
        backgroundSync: {
          ...state.pwa.backgroundSync,
          pendingUploads: state.pwa.backgroundSync.pendingUploads + 1,
        },
      },
      sync: {
        ...state.sync,
        offline: {
          ...state.sync.offline,
          queue: [
            ...state.sync.offline.queue,
            {
              id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              action: action.type,
              payload: action.payload,
              timestamp: Date.now(),
              retryCount: 0,
            },
          ],
        },
      },
    }));
  },

  removeOfflineAction: (actionId) => {
    set((state) => ({
      pwa: {
        ...state.pwa,
        backgroundSync: {
          ...state.pwa.backgroundSync,
          pendingUploads: Math.max(
            0,
            state.pwa.backgroundSync.pendingUploads - 1,
          ),
        },
      },
      sync: {
        ...state.sync,
        offline: {
          ...state.sync.offline,
          queue: state.sync.offline.queue.filter(
            (action) => action.id !== actionId,
          ),
        },
      },
    }));
  },
});

// Sync State Slice Implementation
const createSyncStateSlice: StateCreator<
  EnhancedStemPlayerState,
  [],
  [],
  SyncStateSlice
> = (set, get) => ({
  ...initialSyncState,

  setCrossTabEnabled: (enabled) => {
    set((state) => ({
      sync: {
        ...state.sync,
        crossTab: {
          ...state.sync.crossTab,
          enabled,
          broadcastChannel: enabled
            ? new BroadcastChannel("ox-board-sync")
            : null,
        },
      },
    }));

    // Set up cross-tab communication
    if (enabled) {
      const channel = get().sync.crossTab.broadcastChannel;
      if (channel) {
        channel.addEventListener("message", (event) => {
          const { type, payload } = event.data;
          if (type === "STATE_UPDATE") {
            // Handle state updates from other tabs
            console.log("Received state update from another tab:", payload);
          }
        });

        // Announce this tab's presence
        channel.postMessage({
          type: "TAB_JOIN",
          payload: {
            id: get().session.id,
            url: window.location.href,
            timestamp: Date.now(),
          },
        });
      }
    }
  },

  updateTabActivity: (tabId, url) => {
    set((state) => ({
      sync: {
        ...state.sync,
        crossTab: {
          ...state.sync.crossTab,
          tabs: [
            ...state.sync.crossTab.tabs.filter((tab) => tab.id !== tabId),
            { id: tabId, url, lastActivity: Date.now() },
          ].slice(-10), // Keep last 10 tabs
        },
      },
    }));
  },

  setRealtimeConnected: (connected) => {
    set((state) => ({
      sync: {
        ...state.sync,
        realtime: {
          ...state.sync.realtime,
          connected,
          reconnectAttempts: connected
            ? 0
            : state.sync.realtime.reconnectAttempts + 1,
        },
      },
    }));
  },

  updateRealtimeLatency: (latency) => {
    set((state) => ({
      sync: {
        ...state.sync,
        realtime: {
          ...state.sync.realtime,
          latency,
          lastMessage: Date.now(),
        },
      },
    }));
  },

  addOfflineAction: (action) => {
    set((state) => ({
      sync: {
        ...state.sync,
        offline: {
          ...state.sync.offline,
          queue: [
            ...state.sync.offline.queue,
            {
              id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              action: action.action,
              payload: action.payload,
              timestamp: Date.now(),
              retryCount: 0,
            },
          ],
        },
      },
    }));
  },

  processOfflineQueue: () => {
    const { queue, isOnline } = get().sync.offline;

    if (!isOnline || queue.length === 0) return;

    // Process queued actions when back online
    queue.forEach(async (queuedAction) => {
      try {
        // Here you would implement the actual action processing
        console.log("Processing offline action:", queuedAction);

        // Remove from queue after successful processing
        get().sync.offline.queue = get().sync.offline.queue.filter(
          (action) => action.id !== queuedAction.id,
        );
      } catch (error) {
        console.error("Failed to process offline action:", error);
      }
    });
  },
});

// Session State Slice Implementation
const createSessionStateSlice: StateCreator<
  EnhancedStemPlayerState,
  [],
  [],
  SessionStateSlice
> = (set, get) => ({
  ...initialSessionState,

  updateSessionActivity: () => {
    set((state) => ({
      session: {
        ...state.session,
        lastActivity: Date.now(),
      },
    }));
  },

  setSessionId: (id) => {
    set((state) => ({
      session: {
        ...state.session,
        id,
      },
    }));
  },
});

// Hydration State Slice Implementation
const createHydrationStateSlice: StateCreator<
  EnhancedStemPlayerState,
  [],
  [],
  HydrationStateSlice
> = (set, get) => ({
  ...initialHydrationState,

  setHydrated: (hydrated) => {
    set((state) => ({
      hydration: {
        ...state.hydration,
        isHydrated: hydrated,
        lastHydrated: hydrated ? Date.now() : state.hydration.lastHydrated,
      },
    }));
  },

  updateHydrationVersion: (version) => {
    set((state) => ({
      hydration: {
        ...state.hydration,
        version,
      },
    }));
  },
});

// Store persistence configuration
const STORE_VERSION = "1.0.0";
const PERSISTENCE_KEY = "enhanced-stem-player-store";

// Persistence helpers
const saveToStorage = async (state: EnhancedStemPlayerState) => {
  try {
    const stateToSave = {
      version: STORE_VERSION,
      timestamp: Date.now(),
      audio: {
        stems: state.audio.stems,
        mute: state.audio.mute,
        solo: state.audio.solo,
        eq: state.audio.eq,
        pan: state.audio.pan,
        playbackRate: state.audio.playbackRate,
        mix: state.audio.mix,
        playback: {
          loop: state.audio.playback.loop,
          playbackRate: state.audio.playback.playbackRate,
        },
      },
      gesture: {
        mappings: state.gesture.mappings,
        calibration: state.gesture.calibration,
      },
      ui: {
        theme: state.ui.theme,
        preferences: state.ui.preferences,
        panels: state.ui.panels,
        debug: state.ui.debug,
      },
      session: state.session,
    };

    await enhancedStorage.set("store", PERSISTENCE_KEY, stateToSave);
  } catch (error) {
    console.error("Failed to save store to storage:", error);
  }
};

const loadFromStorage =
  async (): Promise<Partial<EnhancedStemPlayerState> | null> => {
    try {
      const saved = await enhancedStorage.get<
        Partial<EnhancedStemPlayerState> & { version: string }
      >("store", PERSISTENCE_KEY);
      if (!saved) return null;

      // Check version compatibility
      if (saved.version !== STORE_VERSION) {
        console.warn("Store version mismatch, using defaults");
        return null;
      }

      return saved;
    } catch (error) {
      console.error("Failed to load store from storage:", error);
      return null;
    }
  };

// Main store creation
export const useEnhancedStemPlayerStore = create<CombinedStoreState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initialize all slices
        audio: (createAudioStateSlice as any)(set, get),
        gesture: (createGestureStateSlice as any)(set, get),
        ui: (createUIStateSlice as any)(set, get),
        performance: (createPerformanceStateSlice as any)(set, get),
        pwa: (createPWAStateSlice as any)(set, get),
        sync: (createSyncStateSlice as any)(set, get),
        session: (createSessionStateSlice as any)(set, get),
        hydration: (createHydrationStateSlice as any)(set, get),

        // Action implementations (delegated to slices)
        setStemVolume: (stemId, volume) =>
          get().audio.setStemVolume(stemId, volume),
        setStemMute: (stemId, muted) => get().audio.setStemMute(stemId, muted),
        setStemSolo: (stemId, solo) => get().audio.setStemSolo(stemId, solo),
        setStemEQ: (stemId, band, value) =>
          get().audio.setStemEQ(stemId, band, value),
        setStemPan: (stemId, pan) => get().audio.setStemPan(stemId, pan),
        setStemPlaybackRate: (stemId, rate) =>
          get().audio.setStemPlaybackRate(stemId, rate),
        setStemMix: (mix) => get().audio.setStemMix(mix),

        setPlaybackState: (state) => get().audio.setPlaybackState(state),
        setPlaybackTime: (time) => get().audio.setPlaybackTime(time),
        setPlaybackRate: (rate) => get().audio.setPlaybackRate(rate),
        toggleLoop: () => get().audio.toggleLoop(),

        updateAnalysis: (analysis) => get().audio.updateAnalysis(analysis),
        updateBufferState: (buffers) => get().audio.updateBufferState(buffers),

        setEffectParam: (effect, param, value) =>
          get().audio.setEffectParam(effect, param, value),
        toggleEffect: (effect) => get().audio.toggleEffect(effect),
        resetEffects: () => get().audio.resetEffects(),

        startRecording: () => get().audio.startRecording(),
        stopRecording: () => get().audio.stopRecording(),
        updateRecordingDuration: (duration) =>
          get().audio.updateRecordingDuration(duration),

        updateStreamHealth: (health) => get().audio.updateStreamHealth(health),

        updateGesture: (leftHand, rightHand) =>
          get().gesture.updateGesture(leftHand, rightHand),
        addGestureHistory: (entry) => get().gesture.addGestureHistory(entry),
        startGestureCalibration: (gesture) =>
          get().gesture.startGestureCalibration(gesture),
        stopGestureCalibration: () => get().gesture.stopGestureCalibration(),
        addCalibrationSample: (sample) =>
          get().gesture.addCalibrationSample(sample),
        updateGestureMapping: (mappingId, mapping) =>
          get().gesture.updateGestureMapping(mappingId, mapping),
        updateGesturePerformance: (metrics) =>
          get().gesture.updateGesturePerformance(metrics),

        startGestureRecording: () => get().gesture.startGestureRecording(),
        stopGestureRecording: () => get().gesture.stopGestureRecording(),
        setGesturePlaybackSpeed: (speed) =>
          get().gesture.setGesturePlaybackSpeed(speed),
        setGesturePlaybackIndex: (index) =>
          get().gesture.setGesturePlaybackIndex(index),

        togglePanel: (panel) => get().ui.togglePanel(panel),
        setModalState: (modal, open) => get().ui.setModalState(modal, open),
        setDrawerState: (drawer, open) => get().ui.setDrawerState(drawer, open),
        setTheme: (theme) => get().ui.setTheme(theme),
        setPreferences: (preferences) => get().ui.setPreferences(preferences),
        setTutorialStep: (step) => get().ui.setTutorialStep(step),
        updateTutorialProgress: (progress) =>
          get().ui.updateTutorialProgress(progress),
        setResponsiveState: (state) => get().ui.setResponsiveState(state),
        setDebugSettings: (settings) => get().ui.setDebugSettings(settings),

        updateWebVitals: (vitals) => get().performance.updateWebVitals(vitals),
        updateAudioMetrics: (metrics) =>
          get().performance.updateAudioMetrics(metrics),
        updateGestureMetrics: (metrics) =>
          get().performance.updateGestureMetrics(metrics),
        updateSystemMetrics: (metrics) =>
          get().performance.updateSystemMetrics(metrics),
        addAlert: (alert) => get().performance.addAlert(alert),
        acknowledgeAlert: (alertId) =>
          get().performance.acknowledgeAlert(alertId),
        removeAlert: (alertId) => get().performance.removeAlert(alertId),

        setOnlineStatus: (online) => get().pwa.setOnlineStatus(online),
        setInstallPrompt: (prompt) => get().pwa.setInstallPrompt(prompt),
        setUpdateAvailable: (available) =>
          get().pwa.setUpdateAvailable(available),
        updateCacheStatus: (status) => get().pwa.updateCacheStatus(status),
        setBackgroundSyncEnabled: (enabled) =>
          get().pwa.setBackgroundSyncEnabled(enabled),
        addOfflineAction: (action) => get().pwa.addOfflineAction(action),
        removeOfflineAction: (actionId) =>
          get().pwa.removeOfflineAction(actionId),

        setCrossTabEnabled: (enabled) => get().sync.setCrossTabEnabled(enabled),
        updateTabActivity: (tabId, url) =>
          get().sync.updateTabActivity(tabId, url),
        setRealtimeConnected: (connected) =>
          get().sync.setRealtimeConnected(connected),
        updateRealtimeLatency: (latency) =>
          get().sync.updateRealtimeLatency(latency),

        updateSessionActivity: () => get().session.updateSessionActivity(),
        setSessionId: (id) => get().session.setSessionId(id),

        setHydrated: (hydrated) => get().hydration.setHydrated(hydrated),
        updateHydrationVersion: (version) =>
          get().hydration.updateHydrationVersion(version),

        reset: () => {
          set({
            audio: {
              stems: {
                drums: 0.75,
                bass: 0.75,
                melody: 0.75,
                vocals: 0.75,
                original: 0.75,
              },
              mute: {
                drums: false,
                bass: false,
                melody: false,
                vocals: false,
                original: false,
              },
              solo: {
                drums: false,
                bass: false,
                melody: false,
                vocals: false,
                original: false,
              },
              eq: {
                drums: { low: 0, mid: 0, high: 0 },
                bass: { low: 0, mid: 0, high: 0 },
                melody: { low: 0, mid: 0, high: 0 },
                vocals: { low: 0, mid: 0, high: 0 },
                original: { low: 0, mid: 0, high: 0 },
              },
              pan: { drums: 0, bass: 0, melody: 0, vocals: 0, original: 0 },
              playbackRate: {
                drums: 1.0,
                bass: 1.0,
                melody: 1.0,
                vocals: 1.0,
                original: 1.0,
              },
              mix: 0.5,
              playback: {
                isPlaying: false,
                currentTime: 0,
                duration: 0,
                position: 0,
                playbackRate: 1.0,
                loop: false,
              },
              analysis: null,
              buffers: { loading: false },
              effects: {
                reverb: {
                  enabled: false,
                  roomSize: 0.5,
                  dampening: 0.5,
                  wet: 0.3,
                },
                delay: {
                  enabled: false,
                  delayTime: 0.25,
                  feedback: 0.3,
                  wet: 0.2,
                },
                filter: {
                  enabled: false,
                  frequency: 1000,
                  resonance: 1,
                  type: "lowpass",
                },
                distortion: { enabled: false, amount: 0.5, tone: 0.5 },
                compressor: {
                  enabled: false,
                  threshold: -24,
                  ratio: 4,
                  attack: 0.003,
                  release: 0.25,
                },
              },
              recording: { isRecording: false, recordedStems: {}, duration: 0 },
              streamHealth: {
                bufferHealth: 1.0,
                latency: 0,
                droppedFrames: 0,
                underruns: 0,
              },
            },
            gesture: {
              current: {
                leftHand: null,
                rightHand: null,
                confidence: 0,
                timestamp: 0,
              },
              history: [],
              calibration: { isCalibrating: false, samples: [], baseline: {} },
              mappings: {
                "volume-drums": {
                  gesture: "fist",
                  controlType: "volume",
                  targetStem: "drums",
                  sensitivity: 1.0,
                  deadzone: 0.1,
                  smoothing: 0.3,
                },
              },
              performance: {
                averageLatency: 0,
                frameRate: 0,
                droppedFrames: 0,
                gestureAccuracy: 0,
                processingTime: 0,
              },
              recording: {
                isRecording: false,
                recordedGestures: [],
                playback: { isPlaying: false, speed: 1.0, currentIndex: 0 },
              },
            },
            ui: {
              panels: {
                stemMixer: true,
                gestureControl: true,
                performanceMonitor: false,
                aiAssistant: false,
                effectsRack: false,
                trackBrowser: false,
                settings: false,
              },
              modals: {
                trackUpload: false,
                stemSeparation: false,
                gestureCalibration: false,
                settings: false,
                help: false,
                confirmation: false,
              },
              drawers: { left: false, right: false, bottom: false },
              theme: {
                mode: "auto",
                accentColor: "#3b82f6",
                fontSize: "medium",
                animations: true,
                highContrast: false,
              },
              preferences: {
                autoSave: true,
                confirmActions: true,
                showTooltips: true,
                gestureFeedback: true,
                audioVisualization: true,
                keyboardShortcuts: true,
              },
              tutorial: {
                currentStep: 0,
                totalSteps: 5,
                completedSteps: [],
                isActive: false,
                progress: 0,
              },
              responsive: {
                isMobile: false,
                isTablet: false,
                screenSize: "lg",
                orientation: "landscape",
                touchDevice: false,
              },
              debug: {
                showFPS: false,
                showLatency: false,
                showGestureData: false,
                showAudioBuffer: false,
                showStoreState: false,
                logLevel: "warn",
              },
            },
            performance: {
              vitals: { fcp: 0, lcp: 0, cls: 0, fid: 0, ttfb: 0 },
              audio: {
                latency: 0,
                bufferUnderruns: 0,
                droppedFrames: 0,
                processingLoad: 0,
                memoryUsage: 0,
              },
              gesture: {
                processingLatency: 0,
                frameRate: 0,
                accuracy: 0,
                confidence: 0,
              },
              system: {
                cpuUsage: 0,
                memoryUsage: 0,
                networkLatency: 0,
                isOnline: navigator.onLine,
              },
              alerts: [],
            },
            pwa: {
              online: navigator.onLine,
              installPrompt: null,
              updateAvailable: false,
              cacheStatus: {
                stems: 0,
                tracks: 0,
                totalSize: 0,
                lastUpdated: Date.now(),
              },
              backgroundSync: {
                enabled: false,
                pendingUploads: 0,
                lastSync: Date.now(),
              },
            },
            sync: {
              crossTab: { enabled: false, tabs: [], broadcastChannel: null },
              offline: {
                queue: [],
                isOnline: navigator.onLine,
                lastSync: Date.now(),
              },
              realtime: {
                connected: false,
                latency: 0,
                lastMessage: Date.now(),
                reconnectAttempts: 0,
              },
            },
            session: {
              id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              startTime: Date.now(),
              lastActivity: Date.now(),
              version: "1.0.0",
            },
            hydration: {
              isHydrated: true,
              lastHydrated: Date.now(),
              version: "1.0.0",
            },
          });
        },

        exportState: () => get(),
        importState: (state: Partial<EnhancedStemPlayerState>) => {
          set((store) => ({
            ...store,
            ...state,
          }));
        },
      })),
    ),
    {
      name: "enhanced-stem-player-store",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);

// Initialize store with persistence
export const initializeStore = async () => {
  try {
    const savedState = await loadFromStorage();

    if (savedState) {
      useEnhancedStemPlayerStore.setState(savedState);
    }

    // Mark as hydrated
    useEnhancedStemPlayerStore.setState((state) => ({
      ...state,
      hydration: {
        ...state.hydration,
        isHydrated: true,
        lastHydrated: Date.now(),
      },
    }));

    // Set up auto-save
    useEnhancedStemPlayerStore.subscribe(
      (state) => state,
      (state) => {
        // Debounced save to prevent excessive writes
        const timeoutId = setTimeout(() => saveToStorage(state), 1000);
        return () => clearTimeout(timeoutId);
      },
      { equalityFn: () => false }, // Always trigger to ensure saves
    );

    console.log("Enhanced Stem Player Store initialized");
  } catch (error) {
    console.error("Failed to initialize store:", error);
  }
};

// Store hydration check
export const useStoreHydration = () => {
  const isHydrated = useEnhancedStemPlayerStore(
    (state) => state.hydration.isHydrated,
  );

  if (!isHydrated) {
    throw new Error("Store not hydrated yet");
  }

  return true;
};

// Export types
export type {
  EnhancedStemPlayerState,
  StemPlayerActions,
  AudioStateSlice,
  GestureStateSlice,
  UIStateSlice,
  PerformanceStateSlice,
  PWAStateSlice,
  SyncStateSlice,
  SessionStateSlice,
  HydrationStateSlice,
};
