/**
 * @fileoverview React hook for DeckManager integration
 * @description Provides React-friendly interface to DeckManager singleton with automatic
 * state synchronization via EventEmitter. Handles AudioService + DeckManager initialization
 * and provides comprehensive error handling.
 *
 * @example
 * ```tsx
 * function DJInterface() {
 *   const {
 *     deckA,
 *     deckB,
 *     crossfader,
 *     audioInit,
 *     initialize,
 *     playDeck,
 *     setDeckVolume,
 *     setCrossfader
 *   } = useDeckManager();
 *
 *   if (!audioInit.isReady) {
 *     return <button onClick={initialize}>Initialize Audio</button>;
 *   }
 *
 *   return (
 *     <button onClick={() => playDeck('A')}>
 *       {deckA.isPlaying ? 'Pause' : 'Play'} Deck A
 *     </button>
 *   );
 * }
 * ```
 *
 * @since 0.9.0
 */

import { useEffect, useState, useRef, useCallback } from "react";
import { getDeckManager } from "@/services/DeckManager";
import { getAudioService } from "@/services/AudioService";
import type {
  UseDeckManagerReturn,
  ReactDeckState,
  MasterState,
  CrossfaderState,
  AudioInitializationState,
} from "@/types/deckManager";
import type { PerformanceMetrics } from "@/services/types/audio";

/**
 * Initial state for deck
 */
const INITIAL_DECK_STATE: ReactDeckState = {
  isPlaying: false,
  isPaused: false,
  isLoading: false,
  hasTrack: false,
  position: 0,
  volume: 0.75,
  pitch: 0,
  eq: {
    low: 0,
    mid: 0,
    high: 0,
  },
  track: null,
};

/**
 * Initial state for master section
 */
const INITIAL_MASTER_STATE: MasterState = {
  volume: 0.85,
  limiter: true,
  recording: false,
};

/**
 * Initial state for crossfader
 */
const INITIAL_CROSSFADER_STATE: CrossfaderState = {
  position: 0, // Center position
  curve: "linear",
};

/**
 * Initial state for audio initialization
 */
const INITIAL_AUDIO_INIT_STATE: AudioInitializationState = {
  isReady: false,
  isInitializing: false,
  requiresUserGesture: true,
  error: null,
};

/**
 * Initial performance metrics
 */
const INITIAL_PERFORMANCE_METRICS: PerformanceMetrics = {
  audioLatency: 0,
  renderTime: 0,
  dropouts: 0,
  cpuUsage: 0,
  memoryUsage: 0,
};

/**
 * Custom React hook for DeckManager integration
 *
 * Manages:
 * - AudioService + DeckManager lifecycle
 * - Event-driven state synchronization
 * - User gesture requirement handling
 * - Comprehensive error handling
 * - Automatic cleanup on unmount
 *
 * @returns {UseDeckManagerReturn} Deck states and control methods
 */
export function useDeckManager(): UseDeckManagerReturn {
  // State management
  const [deckA, setDeckA] = useState<ReactDeckState>(INITIAL_DECK_STATE);
  const [deckB, setDeckB] = useState<ReactDeckState>(INITIAL_DECK_STATE);
  const [master, setMaster] = useState<MasterState>(INITIAL_MASTER_STATE);
  const [crossfader, setCrossfaderState] = useState<CrossfaderState>(
    INITIAL_CROSSFADER_STATE,
  );
  const [audioInit, setAudioInit] = useState<AudioInitializationState>(
    INITIAL_AUDIO_INIT_STATE,
  );
  const [performance, setPerformance] = useState<PerformanceMetrics>(
    INITIAL_PERFORMANCE_METRICS,
  );
  const [syncState, setSyncState] = useState<{
    isActive: boolean;
    master: "A" | "B" | null;
  }>({
    isActive: false,
    master: null,
  });

  // Refs for singleton instances (avoid state updates triggering re-initialization)
  const deckManagerRef = useRef<ReturnType<typeof getDeckManager> | null>(null);
  const audioServiceRef = useRef<ReturnType<typeof getAudioService> | null>(
    null,
  );

  /**
   * Convert internal DeckState to ReactDeckState
   */
  const mapDeckState = useCallback(
    (internalState: any): ReactDeckState => ({
      isPlaying: internalState.isPlaying || false,
      isPaused: internalState.isPaused || false,
      isLoading: internalState.isLoading || false,
      hasTrack: internalState.isLoaded || false,
      position: internalState.position || 0,
      volume: internalState.volume || 0.75,
      pitch: internalState.pitch || 0,
      eq: internalState.eq || { low: 0, mid: 0, high: 0 },
      track: internalState.track || null,
    }),
    [],
  );

  /**
   * Initialize AudioService and DeckManager
   * MUST be called from a user gesture (click, touch, etc.)
   */
  const initialize = useCallback(async (): Promise<void> => {
    // Prevent multiple simultaneous initializations
    if (audioInit.isInitializing) {
      console.warn("Initialization already in progress");
      return;
    }

    // Already initialized
    if (audioInit.isReady) {
      console.log("Audio system already initialized");
      return;
    }

    setAudioInit((prev) => ({
      ...prev,
      isInitializing: true,
      error: null,
    }));

    try {
      // Step 1: Initialize AudioService
      console.log("Initializing AudioService...");
      const audioService = getAudioService();
      audioServiceRef.current = audioService;

      if (!audioService.isReady()) {
        await audioService.initialize();
      }

      console.log("✅ AudioService initialized");

      // Step 2: Initialize DeckManager
      console.log("Initializing DeckManager...");
      const deckManager = getDeckManager();
      deckManagerRef.current = deckManager;

      if (!deckManager.isReady()) {
        await deckManager.initializeDecks();
      }

      console.log("✅ DeckManager initialized");

      // Step 3: Set initial state from DeckManager
      const initialDeckAState = deckManager.getDeckState("A");
      const initialDeckBState = deckManager.getDeckState("B");

      setDeckA(mapDeckState(initialDeckAState));
      setDeckB(mapDeckState(initialDeckBState));

      setMaster({
        volume: audioService.getMasterVolume(),
        limiter: true,
        recording: false,
      });

      setCrossfaderState({
        position: deckManager.getCrossfaderPosition(),
        curve: deckManager.crossfader.curve,
      });

      // Mark as ready
      setAudioInit({
        isReady: true,
        isInitializing: false,
        requiresUserGesture: false,
        error: null,
      });

      console.log("✅ Audio system fully initialized");
    } catch (error: any) {
      console.error("❌ Failed to initialize audio system:", error);

      // Check if user gesture is required
      const requiresGesture =
        error.message?.includes("User gesture") ||
        error.message?.includes("user interaction");

      setAudioInit({
        isReady: false,
        isInitializing: false,
        requiresUserGesture: requiresGesture,
        error: error as Error,
      });

      throw error;
    }
  }, [audioInit.isInitializing, audioInit.isReady, mapDeckState]);

  /**
   * Setup event listeners for DeckManager state synchronization
   */
  useEffect(() => {
    if (!audioInit.isReady || !deckManagerRef.current) {
      return;
    }

    const manager = deckManagerRef.current;

    // Deck A event handlers
    const handleDeckAChange = () => {
      const state = manager.getDeckState("A");
      setDeckA(mapDeckState(state));
    };

    // Deck B event handlers
    const handleDeckBChange = () => {
      const state = manager.getDeckState("B");
      setDeckB(mapDeckState(state));
    };

    // Crossfader event handlers
    const handleCrossfaderChange = ({ position }: { position: number }) => {
      setCrossfaderState((prev) => ({ ...prev, position }));
    };

    // Master volume event handler
    const handleMasterVolumeChange = ({ volume }: { volume: number }) => {
      setMaster((prev) => ({ ...prev, volume }));
    };

    // Performance metrics handler
    const handlePerformanceUpdate = (metrics: PerformanceMetrics) => {
      setPerformance(metrics);
    };

    // Sync event handlers
    const handleSyncEngaged = ({
      master: masterDeck,
    }: {
      master: "A" | "B";
    }) => {
      setSyncState({ isActive: true, master: masterDeck });
    };

    const handleSyncDisengaged = () => {
      setSyncState({ isActive: false, master: null });
    };

    // Subscribe to all relevant events
    manager.on("deck:play", handleDeckAChange);
    manager.on("deck:pause", handleDeckAChange);
    manager.on("deck:stop", handleDeckAChange);
    manager.on("deck:loaded", handleDeckAChange);
    manager.on("deck:volume", handleDeckAChange);

    manager.on("crossfader:change", handleCrossfaderChange);
    manager.on("master:volume", handleMasterVolumeChange);
    manager.on("performance:update", handlePerformanceUpdate);
    manager.on("sync:engaged", handleSyncEngaged);
    manager.on("sync:disengaged", handleSyncDisengaged);

    // Initial state sync
    handleDeckAChange();
    handleDeckBChange();

    // Cleanup: Remove all event listeners
    return () => {
      manager.off("deck:play", handleDeckAChange);
      manager.off("deck:pause", handleDeckAChange);
      manager.off("deck:stop", handleDeckAChange);
      manager.off("deck:loaded", handleDeckAChange);
      manager.off("deck:volume", handleDeckAChange);
      manager.off("crossfader:change", handleCrossfaderChange);
      manager.off("master:volume", handleMasterVolumeChange);
      manager.off("performance:update", handlePerformanceUpdate);
      manager.off("sync:engaged", handleSyncEngaged);
      manager.off("sync:disengaged", handleSyncDisengaged);
    };
  }, [audioInit.isReady, mapDeckState]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Note: We do NOT dispose the singletons here
      // They should persist across component remounts
      // Only dispose when the app is closing
    };
  }, []);

  // ============================================================================
  // DECK CONTROL METHODS
  // ============================================================================

  const playDeck = useCallback((deck: "A" | "B"): void => {
    if (!deckManagerRef.current) {
      console.warn("DeckManager not initialized");
      return;
    }
    const deckInstance =
      deck === "A"
        ? deckManagerRef.current.deckA
        : deckManagerRef.current.deckB;
    deckInstance.play();
  }, []);

  const pauseDeck = useCallback((deck: "A" | "B"): void => {
    if (!deckManagerRef.current) {
      console.warn("DeckManager not initialized");
      return;
    }
    const deckInstance =
      deck === "A"
        ? deckManagerRef.current.deckA
        : deckManagerRef.current.deckB;
    deckInstance.pause();
  }, []);

  const stopDeck = useCallback((deck: "A" | "B"): void => {
    if (!deckManagerRef.current) {
      console.warn("DeckManager not initialized");
      return;
    }
    const deckInstance =
      deck === "A"
        ? deckManagerRef.current.deckA
        : deckManagerRef.current.deckB;
    deckInstance.stop();
  }, []);

  const togglePlayDeck = useCallback(
    (deck: "A" | "B"): void => {
      const currentDeck = deck === "A" ? deckA : deckB;
      if (currentDeck.isPlaying) {
        pauseDeck(deck);
      } else {
        playDeck(deck);
      }
    },
    [deckA, deckB, pauseDeck, playDeck],
  );

  const setDeckVolume = useCallback((deck: "A" | "B", volume: number): void => {
    if (!deckManagerRef.current) {
      console.warn("DeckManager not initialized");
      return;
    }
    const clamped = Math.max(0, Math.min(1, volume));
    const deckInstance =
      deck === "A"
        ? deckManagerRef.current.deckA
        : deckManagerRef.current.deckB;
    deckInstance.setVolume(clamped);
  }, []);

  const setDeckPitch = useCallback((deck: "A" | "B", pitch: number): void => {
    if (!deckManagerRef.current) {
      console.warn("DeckManager not initialized");
      return;
    }
    const clamped = Math.max(-50, Math.min(50, pitch));
    const deckInstance =
      deck === "A"
        ? deckManagerRef.current.deckA
        : deckManagerRef.current.deckB;
    deckInstance.setPitch(clamped);
  }, []);

  const setDeckEQ = useCallback(
    (deck: "A" | "B", band: "low" | "mid" | "high", value: number): void => {
      if (!deckManagerRef.current) {
        console.warn("DeckManager not initialized");
        return;
      }
      // Clamp to -24 to +24 dB range
      const clamped = Math.max(-24, Math.min(24, value));
      const deckInstance =
        deck === "A"
          ? deckManagerRef.current.deckA
          : deckManagerRef.current.deckB;
      deckInstance.setEQ(band, clamped);

      // Update local state immediately for UI responsiveness
      const updateDeck = deck === "A" ? setDeckA : setDeckB;
      updateDeck((prev) => ({
        ...prev,
        eq: { ...prev.eq, [band]: clamped },
      }));
    },
    [],
  );

  const seekDeck = useCallback((deck: "A" | "B", position: number): void => {
    if (!deckManagerRef.current) {
      console.warn("DeckManager not initialized");
      return;
    }
    // Position is 0-1, but Deck might expect different format
    // This is a placeholder - actual implementation depends on Deck API
    console.warn("seekDeck not yet implemented");
  }, []);

  const loadTrack = useCallback(
    async (
      deck: "A" | "B",
      track: {
        id: string;
        url: string;
        title: string;
        artist: string;
        duration: number;
        bpm?: number;
        key?: string;
      },
    ): Promise<void> => {
      if (!deckManagerRef.current) {
        throw new Error("Audio system not initialized");
      }

      try {
        // Load into deck - Deck.load() handles URL loading internally via Tone.Player
        const deckInstance =
          deck === "A"
            ? deckManagerRef.current.deckA
            : deckManagerRef.current.deckB;
        await deckInstance.load(track);

        console.log(`✅ Loaded ${track.title} into Deck ${deck}`);
      } catch (error) {
        console.error(`❌ Failed to load track into Deck ${deck}:`, error);
        throw error;
      }
    },
    [],
  );

  // ============================================================================
  // MIXER CONTROL METHODS
  // ============================================================================

  const setCrossfader = useCallback((position: number): void => {
    if (!deckManagerRef.current) {
      console.warn("DeckManager not initialized");
      return;
    }
    // Clamp to 0-1 range
    const clamped = Math.max(0, Math.min(1, position));
    deckManagerRef.current.setCrossfaderPosition(clamped);
  }, []);

  const setCrossfaderCurve = useCallback(
    (
      curve: "linear" | "logarithmic" | "exponential" | "scratch" | "smooth",
    ): void => {
      if (!deckManagerRef.current) {
        console.warn("DeckManager not initialized");
        return;
      }
      deckManagerRef.current.setCrossfaderCurve(curve as any);
    },
    [],
  );

  const setMasterVolume = useCallback((volume: number): void => {
    if (!deckManagerRef.current) {
      console.warn("DeckManager not initialized");
      return;
    }
    const clamped = Math.max(0, Math.min(1, volume));
    deckManagerRef.current.setMasterVolume(clamped);
  }, []);

  const setLimiter = useCallback((enabled: boolean): void => {
    if (!deckManagerRef.current) {
      console.warn("DeckManager not initialized");
      return;
    }
    deckManagerRef.current.setLimiter(enabled);
    setMaster((prev) => ({ ...prev, limiter: enabled }));
  }, []);

  const syncDecks = useCallback((masterDeck: "A" | "B"): void => {
    if (!deckManagerRef.current) {
      console.warn("DeckManager not initialized");
      return;
    }
    deckManagerRef.current.sync(masterDeck);
  }, []);

  const unsyncDecks = useCallback((): void => {
    if (!deckManagerRef.current) {
      console.warn("DeckManager not initialized");
      return;
    }
    deckManagerRef.current.unsync();
  }, []);

  // ============================================================================
  // AUDIO SYSTEM METHODS
  // ============================================================================

  const dispose = useCallback((): void => {
    if (deckManagerRef.current) {
      deckManagerRef.current.dispose();
      deckManagerRef.current = null;
    }
    if (audioServiceRef.current) {
      audioServiceRef.current.dispose();
      audioServiceRef.current = null;
    }

    // Reset state
    setAudioInit(INITIAL_AUDIO_INIT_STATE);
    setDeckA(INITIAL_DECK_STATE);
    setDeckB(INITIAL_DECK_STATE);
    setMaster(INITIAL_MASTER_STATE);
    setCrossfaderState(INITIAL_CROSSFADER_STATE);
    setPerformance(INITIAL_PERFORMANCE_METRICS);
    setSyncState({ isActive: false, master: null });
  }, []);

  // ============================================================================
  // RETURN HOOK API
  // ============================================================================

  return {
    // State
    deckA,
    deckB,
    master,
    crossfader,
    audioInit,
    performance,
    syncState,

    // Audio system control
    initialize,
    dispose,

    // Deck controls
    playDeck,
    pauseDeck,
    stopDeck,
    togglePlayDeck,
    setDeckVolume,
    setDeckPitch,
    setDeckEQ,
    seekDeck,
    loadTrack,

    // Mixer controls
    setCrossfader,
    setCrossfaderCurve,
    setMasterVolume,
    setLimiter,
    syncDecks,
    unsyncDecks,
  };
}
