import * as Tone from "tone";

// Track and Audio Types
export interface Track {
  id: string;
  url: string;
  title: string;
  artist: string;
  duration: number;
  bpm?: number;
  key?: string;
  waveform?: Float32Array;
  metadata?: Record<string, any>;
}

// Deck Types
export interface DeckState {
  track: Track | null;
  isPlaying: boolean;
  isPaused: boolean;
  isLoading: boolean;
  position: number; // 0-1
  pitch: number; // -8 to +8 (percent)
  volume: number; // 0-1
  eq: {
    low: number; // -26 to +26 dB
    mid: number; // -26 to +26 dB
    high: number; // -26 to +26 dB
  };
  filter: {
    frequency: number; // 20-20000 Hz
    resonance: number; // 0-30
    type: "lowpass" | "highpass" | "bandpass" | "notch";
  };
  effects: {
    reverb: number; // 0-1
    delay: number; // 0-1
    flanger: number; // 0-1
    bitcrusher: number; // 0-1
  };
  cuePoints: CuePoint[];
  loops: Loop[];
}

export interface DeckConfig {
  id: "A" | "B";
  channelStrip: {
    gain: number;
    pan: number;
    sends: {
      reverb: number;
      delay: number;
    };
  };
}

export interface DeckControls {
  load: (track: Track) => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  cue: () => void;
  setCuePoint: (index: number) => void;
  jumpToCue: (index: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  setEQ: (band: "low" | "mid" | "high", value: number) => void;
  setFilter: (params: Partial<DeckState["filter"]>) => void;
  setEffect: (effect: keyof DeckState["effects"], value: number) => void;
  seek: (position: number) => void;
  sync: () => void;
  scratch: (speed: number) => void;
}

export interface CuePoint {
  index: number;
  position: number; // 0-1
  name?: string;
  color?: string;
}

export interface Loop {
  start: number; // 0-1
  end: number; // 0-1
  active: boolean;
  beats?: number;
}

// Mixer Types
export interface CrossfaderConfig {
  position: number; // -1 (A) to +1 (B)
  curve: "linear" | "logarithmic" | "exponential" | "scratch" | "smooth";
  cutLag: number; // 0-50ms
  hamsterMode: boolean;
}

// AudioService Types
export interface AudioServiceConfig {
  latencyHint: "interactive" | "playback" | "balanced";
  lookAhead: number;
  updateInterval: number;
  sampleRate?: number;
  channels?: number;
}

export interface AudioServiceStats {
  latency: number;
  cpuUsage: number;
  isRunning: boolean;
  sampleRate: number;
  bufferSize: number;
}

// Event Types
export interface AudioEvent {
  type: "play" | "pause" | "stop" | "cue" | "load" | "sync" | "error";
  deck?: "A" | "B";
  timestamp: number;
  data?: any;
}

export interface BeatEvent {
  deck: "A" | "B";
  beat: number;
  bar: number;
  tempo: number;
  timestamp: number;
}

// Effect Types
export interface EffectRack {
  reverb: Tone.Reverb;
  delay: Tone.FeedbackDelay;
  flanger: any; // Flanger type not exported
  bitcrusher: Tone.BitCrusher;
  distortion: Tone.Distortion;
  phaser: Tone.Phaser;
  chorus: Tone.Chorus;
  tremolo: Tone.Tremolo;
}

// Performance Types
export interface PerformanceMetrics {
  audioLatency: number;
  renderTime: number;
  dropouts: number;
  cpuUsage: number;
  memoryUsage: number;
}

// BPM Detection Types
export interface BPMAnalysis {
  tempo: number;
  confidence: number;
  beats: number[];
  downbeats: number[];
}

// Key Detection Types
export interface KeyAnalysis {
  key: string;
  scale: "major" | "minor";
  confidence: number;
  compatible: string[];
}

// Sync Types
export interface SyncState {
  master: "A" | "B" | null;
  slaveOffset: number;
  isLocked: boolean;
  beatOffset: number;
}

export interface DeckStatus {
  deck: "A" | "B";
  state: DeckState;
  config: DeckConfig;
  performance: PerformanceMetrics;
}

// Service Types
export interface AudioServiceInterface {
  initialize(): Promise<boolean>;
  getContext(): Tone.Context;
  isReady(): boolean;
  dispose(): void;
  cleanup(): void;
  getStats(): AudioServiceStats;
  setMasterVolume(volume: number): void;
  getMasterVolume(): number;
  setCrossfaderValue(value: number): void;
  getCrossfaderValue(): number;
}

export interface DeckManagerInterface {
  deckA: DeckControls;
  deckB: DeckControls;
  crossfader: CrossfaderConfig;
  master: {
    volume: number;
    limiter: boolean;
    recording: boolean;
  };
  getDeckState(deck: "A" | "B"): DeckState;
  setCrossfaderPosition(position: number): void;
  setCrossfaderCurve(curve: CrossfaderConfig["curve"]): void;
  setMasterVolume(volume: number): void;
  sync(master: "A" | "B"): void;
  unsync(): void;
}

// Constants
export const AUDIO_CONSTANTS = {
  DEFAULT_BPM: 120,
  DEFAULT_PITCH_RANGE: 8, // ±8%
  DEFAULT_EQ_RANGE: 26, // ±26dB
  DEFAULT_FILTER_FREQ: 1000, // Hz
  MAX_CUE_POINTS: 8,
  MAX_LOOPS: 8,
  CROSSFADER_CENTER: 0,
  CROSSFADER_A: -1,
  CROSSFADER_B: 1,
} as const;
