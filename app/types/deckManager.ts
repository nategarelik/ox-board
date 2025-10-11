/**
 * @file DeckManager React Hook Types
 * @description TypeScript type definitions for the useDeckManager hook
 * that integrates DeckManager with React state management
 */

import type { DeckState, PerformanceMetrics } from "@/services/types/audio";

/**
 * Simplified deck state for React components
 * Maps internal DeckState to UI-friendly format
 */
export interface ReactDeckState {
  /** Whether the deck is currently playing */
  isPlaying: boolean;
  /** Whether the deck is paused */
  isPaused: boolean;
  /** Whether a track is loading */
  isLoading: boolean;
  /** Whether a track is loaded */
  hasTrack: boolean;
  /** Current playback position (0-1) */
  position: number;
  /** Current volume (0-1) */
  volume: number;
  /** Current pitch adjustment (-8 to +8 percent) */
  pitch: number;
  /** Track metadata if loaded */
  track: {
    id: string;
    title: string;
    artist: string;
    duration: number;
    bpm?: number;
    key?: string;
  } | null;
}

/**
 * Master section state
 */
export interface MasterState {
  /** Master output volume (0-1) */
  volume: number;
  /** Whether the limiter is enabled */
  limiter: boolean;
  /** Whether recording is active */
  recording: boolean;
}

/**
 * Crossfader state
 */
export interface CrossfaderState {
  /** Crossfader position (-1 for A, 0 for center, 1 for B) */
  position: number;
  /** Crossfader curve type */
  curve: "linear" | "logarithmic" | "exponential" | "scratch" | "smooth";
}

/**
 * Audio system initialization state
 */
export interface AudioInitializationState {
  /** Whether audio system is fully initialized and ready */
  isReady: boolean;
  /** Whether initialization is in progress */
  isInitializing: boolean;
  /** Whether a user gesture is required to start audio */
  requiresUserGesture: boolean;
  /** Initialization error if any */
  error: Error | null;
}

/**
 * Control methods for deck operations
 */
export interface DeckControlMethods {
  /** Play the specified deck */
  playDeck: (deck: "A" | "B") => void;
  /** Pause the specified deck */
  pauseDeck: (deck: "A" | "B") => void;
  /** Stop the specified deck */
  stopDeck: (deck: "A" | "B") => void;
  /** Toggle play/pause for the specified deck */
  togglePlayDeck: (deck: "A" | "B") => void;
  /** Set volume for the specified deck (0-1) */
  setDeckVolume: (deck: "A" | "B", volume: number) => void;
  /** Set pitch for the specified deck (-8 to +8 percent) */
  setDeckPitch: (deck: "A" | "B", pitch: number) => void;
  /** Seek to position in the specified deck (0-1) */
  seekDeck: (deck: "A" | "B", position: number) => void;
  /** Load a track into the specified deck */
  loadTrack: (
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
  ) => Promise<void>;
}

/**
 * Control methods for mixer operations
 */
export interface MixerControlMethods {
  /** Set crossfader position (-1 to 1) */
  setCrossfader: (position: number) => void;
  /** Set crossfader curve */
  setCrossfaderCurve: (
    curve: "linear" | "logarithmic" | "exponential" | "scratch" | "smooth",
  ) => void;
  /** Set master output volume (0-1) */
  setMasterVolume: (volume: number) => void;
  /** Enable/disable limiter */
  setLimiter: (enabled: boolean) => void;
  /** Sync slave deck to master deck */
  syncDecks: (master: "A" | "B") => void;
  /** Disable deck sync */
  unsyncDecks: () => void;
}

/**
 * Audio system control methods
 */
export interface AudioSystemMethods {
  /**
   * Initialize audio system
   * Must be called from a user gesture (click, touch, etc.)
   * @returns Promise that resolves when audio is ready
   */
  initialize: () => Promise<void>;
  /**
   * Dispose audio system and clean up resources
   */
  dispose: () => void;
}

/**
 * Complete return type for useDeckManager hook
 */
export interface UseDeckManagerReturn
  extends DeckControlMethods,
    MixerControlMethods,
    AudioSystemMethods {
  // State
  /** Deck A state */
  deckA: ReactDeckState;
  /** Deck B state */
  deckB: ReactDeckState;
  /** Master section state */
  master: MasterState;
  /** Crossfader state */
  crossfader: CrossfaderState;
  /** Audio initialization state */
  audioInit: AudioInitializationState;
  /** Performance metrics */
  performance: PerformanceMetrics;
  /** Whether sync is active and which deck is master */
  syncState: {
    isActive: boolean;
    master: "A" | "B" | null;
  };
}

/**
 * Event data types for DeckManager events
 */
export interface DeckManagerEvents {
  "deck:play": { deck: "A" | "B" };
  "deck:pause": { deck: "A" | "B" };
  "deck:stop": { deck: "A" | "B" };
  "deck:loaded": { deck: "A" | "B"; track: any };
  "deck:volume": { deck: "A" | "B"; volume: number };
  "deck:error": { deck: "A" | "B"; error: any };
  "crossfader:change": { position: number };
  "master:volume": { volume: number };
  "master:limiter": { enabled: boolean };
  "sync:engaged": {
    master: "A" | "B";
    slave: "A" | "B";
    masterBPM: number;
    slaveBPM: number;
    pitchAdjustment: number;
  };
  "sync:disengaged": undefined;
  "performance:update": PerformanceMetrics;
  initialized: undefined;
  "initialization:error": { error: any };
}
