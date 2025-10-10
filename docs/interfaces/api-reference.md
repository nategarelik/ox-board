# OX Board API Reference

## Service Interfaces

### AudioService API

**Location**: `app/services/AudioService.ts`

#### Core Methods

```typescript
class AudioService {
  /**
   * Initialize the audio context (requires user gesture)
   * @returns Promise<void>
   */
  async initialize(): Promise<void>;

  /**
   * Check if audio service is ready
   * @returns boolean
   */
  isReady(): boolean;

  /**
   * Get the Tone.js context
   * @returns Tone.Context
   */
  getContext(): Tone.Context;

  /**
   * Get the master gain node
   * @returns Tone.Gain
   */
  getMasterGain(): Tone.Gain;

  /**
   * Set master volume
   * @param volume - 0.0 to 1.0
   */
  setMasterVolume(volume: number): void;

  /**
   * Get current master volume
   * @returns number (0.0 to 1.0)
   */
  getMasterVolume(): number;

  /**
   * Clean up and dispose resources
   */
  dispose(): void;
}
```

#### Factory Methods

```typescript
// Audio node creation
createGain(initialValue?: number): Tone.Gain
createEQ3(): Tone.EQ3
createFilter(type?: BiquadFilterType): Tone.Filter
createCompressor(): Tone.Compressor
createLimiter(threshold?: number): Tone.Limiter
createReverb(decay?: number): Tone.Reverb
createDelay(delayTime?: number): Tone.FeedbackDelay
```

#### Performance Monitoring

```typescript
interface AudioServiceStats {
  isInitialized: boolean
  contextState: AudioContextState
  currentTime: number
  baseLatency: number
  outputLatency: number
  audioLatency: number
  sampleRate: number
  cpuUsage: number // Estimated
  activeNodes: number
  dropouts: number
}

getStats(): AudioServiceStats
```

---

### DeckManager API

**Location**: `app/services/DeckManager.ts`

#### Deck Control

```typescript
class DeckManager extends EventEmitter {
  /**
   * Initialize both decks
   * @returns Promise<void>
   */
  async initializeDecks(): Promise<void>;

  /**
   * Check if manager is ready
   * @returns boolean
   */
  isReady(): boolean;

  /**
   * Load track to deck
   * @param deck - 'A' or 'B'
   * @param track - Track object with url, title, etc.
   */
  async loadTrack(deck: "A" | "B", track: Track): Promise<void>;

  /**
   * Play deck
   * @param deck - 'A' or 'B'
   */
  play(deck: "A" | "B"): void;

  /**
   * Pause deck
   * @param deck - 'A' or 'B'
   */
  pause(deck: "A" | "B"): void;

  /**
   * Stop deck
   * @param deck - 'A' or 'B'
   */
  stop(deck: "A" | "B"): void;

  /**
   * Get deck state
   * @param deck - 'A' or 'B'
   * @returns DeckState
   */
  getDeckState(deck: "A" | "B"): DeckState;
}
```

#### Mixer Control

```typescript
/**
 * Set crossfader position
 * @param position - -1 (full A) to 1 (full B)
 */
setCrossfaderPosition(position: number): void

/**
 * Get current crossfader position
 * @returns number (-1 to 1)
 */
getCrossfaderPosition(): number

/**
 * Set crossfader curve
 * @param curve - 'linear' | 'logarithmic' | 'exponential' | 'scratch' | 'smooth'
 */
setCrossfaderCurve(curve: CrossfaderCurve): void

/**
 * Set master volume
 * @param volume - 0.0 to 1.0
 */
setMasterVolume(volume: number): void
```

#### Sync Control

```typescript
/**
 * Sync slave deck to master
 * @param master - 'A' or 'B' (master deck)
 */
sync(master: 'A' | 'B'): void

/**
 * Disengage sync
 */
unsync(): void

/**
 * Check if decks are synced
 * @returns boolean
 */
isSynced(): boolean

/**
 * Get sync state details
 * @returns SyncState
 */
getSyncState(): SyncState
```

#### Recording

```typescript
/**
 * Start recording master output
 * @returns Promise<void>
 */
async startRecording(): Promise<void>

/**
 * Stop recording and get audio blob
 * @returns Promise<Blob>
 */
async stopRecording(): Promise<Blob>

/**
 * Check if currently recording
 * @returns boolean
 */
isRecording(): boolean
```

#### Events

```typescript
// Event types emitted by DeckManager
interface DeckEvents {
  'deck:play': { deck: 'A' | 'B', timestamp: number }
  'deck:pause': { deck: 'A' | 'B', timestamp: number }
  'deck:stop': { deck: 'A' | 'B' }
  'deck:loaded': { deck: 'A' | 'B', track: Track }
  'deck:error': { deck: 'A' | 'B', error: Error }
  'crossfader:change': { position: number }
  'sync:engaged': { master: 'A' | 'B', slave: 'A' | 'B', masterBPM: number, slaveBPM: number }
  'sync:disengaged': {}
  'recording:start': {}
  'recording:stop': { blob: Blob }
  'recording:error': { error: Error }
  'performance:update': AudioServiceStats
}

// Subscribe to events
on<K extends keyof DeckEvents>(event: K, handler: (data: DeckEvents[K]) => void): void
off<K extends keyof DeckEvents>(event: K, handler: (data: DeckEvents[K]) => void): void
once<K extends keyof DeckEvents>(event: K, handler: (data: DeckEvents[K]) => void): void
```

---

### Deck API

**Location**: `app/lib/audio/deck.ts`

#### Core Controls

```typescript
interface DeckControls {
  /**
   * Load audio track
   * @param track - Track with url and metadata
   */
  async load(track: Track): Promise<void>

  /**
   * Start playback
   */
  play(): void

  /**
   * Pause playback
   */
  pause(): void

  /**
   * Stop and reset to beginning
   */
  stop(): void

  /**
   * Jump to cue point (default: start)
   */
  cue(): void

  /**
   * Seek to position
   * @param position - 0.0 (start) to 1.0 (end)
   */
  seek(position: number): void

  /**
   * Get current position
   * @returns number (0.0 to 1.0)
   */
  getPosition(): number

  /**
   * Check if playing
   * @returns boolean
   */
  isPlaying(): boolean
}
```

#### Pitch/Tempo Control

```typescript
/**
 * Set pitch adjustment
 * @param pitch - Percentage (-8 to +8)
 */
setPitch(pitch: number): void

/**
 * Get current pitch
 * @returns number (-8 to +8)
 */
getPitch(): number

/**
 * Get current BPM (including pitch adjustment)
 * @returns number
 */
getCurrentBPM(): number

/**
 * Get original BPM
 * @returns number
 */
getOriginalBPM(): number
```

#### EQ Control

```typescript
/**
 * Set EQ band level
 * @param band - 'low' | 'mid' | 'high'
 * @param value - Gain in dB (-26 to +26)
 */
setEQ(band: 'low' | 'mid' | 'high', value: number): void

/**
 * Get EQ band level
 * @param band - 'low' | 'mid' | 'high'
 * @returns number (-26 to +26)
 */
getEQ(band: 'low' | 'mid' | 'high'): number

/**
 * Reset EQ to flat
 */
resetEQ(): void
```

#### Filter Control

```typescript
interface FilterParams {
  type: 'lowpass' | 'highpass' | 'bandpass' | 'notch'
  frequency: number // Hz
  resonance: number // Q factor
}

/**
 * Set filter parameters
 * @param params - Filter configuration
 */
setFilter(params: FilterParams): void

/**
 * Enable/disable filter
 * @param enabled - boolean
 */
setFilterEnabled(enabled: boolean): void
```

#### Cue Points

```typescript
/**
 * Set cue point at current position
 * @param index - Cue index (0-7)
 */
setCuePoint(index: number): void

/**
 * Jump to cue point
 * @param index - Cue index (0-7)
 */
jumpToCue(index: number): void

/**
 * Delete cue point
 * @param index - Cue index (0-7)
 */
deleteCue(index: number): void

/**
 * Get all cue points
 * @returns CuePoint[]
 */
getCuePoints(): CuePoint[]

interface CuePoint {
  index: number
  position: number // 0.0 to 1.0
  color: string
  label?: string
}
```

#### Effects

```typescript
/**
 * Apply effect
 * @param effect - Effect type
 * @param value - Wet/dry mix (0.0 to 1.0)
 */
setEffect(effect: 'reverb' | 'delay' | 'flanger' | 'phaser', value: number): void

/**
 * Remove effect
 * @param effect - Effect type
 */
removeEffect(effect: string): void

/**
 * Get effect value
 * @param effect - Effect type
 * @returns number (0.0 to 1.0)
 */
getEffectValue(effect: string): number
```

---

### StemPlayer API

**Location**: `app/lib/audio/stemPlayer.ts`

#### Stem Control

```typescript
class StemPlayer {
  /**
   * Load stems from separated audio
   * @param stems - Object with stem AudioBuffers
   */
  async loadStems(stems: {
    drums?: AudioBuffer;
    bass?: AudioBuffer;
    melody?: AudioBuffer;
    vocals?: AudioBuffer;
    original: AudioBuffer;
  }): Promise<void>;

  /**
   * Set stem volume
   * @param stemType - 'drums' | 'bass' | 'melody' | 'vocals' | 'original'
   * @param volume - 0.0 to 1.0
   */
  setStemVolume(stemType: StemType, volume: number): void;

  /**
   * Mute/unmute stem
   * @param stemType - Stem to control
   * @param muted - boolean
   */
  setStemMute(stemType: StemType, muted: boolean): void;

  /**
   * Solo stem (mutes all others)
   * @param stemType - Stem to solo, null to unsolo all
   */
  setStemSolo(stemType: StemType | null): void;

  /**
   * Set stem pan
   * @param stemType - Stem to control
   * @param pan - -1 (left) to 1 (right)
   */
  setStemPan(stemType: StemType, pan: number): void;

  /**
   * Set stem EQ
   * @param stemType - Stem to control
   * @param band - 'low' | 'mid' | 'high'
   * @param value - Gain in dB (-26 to +26)
   */
  setStemEQ(stemType: StemType, band: string, value: number): void;
}
```

#### Playback Control

```typescript
/**
 * Start playback of all stems
 */
play(): void

/**
 * Pause all stems
 */
pause(): void

/**
 * Stop and reset all stems
 */
stop(): void

/**
 * Seek all stems to position
 * @param time - Time in seconds
 */
seek(time: number): void

/**
 * Set playback rate for all stems
 * @param rate - Playback speed multiplier (0.5 to 2.0)
 */
setPlaybackRate(rate: number): void

/**
 * Get current playback time
 * @returns number (seconds)
 */
getCurrentTime(): number

/**
 * Check sync status
 * @returns SyncStatus
 */
getSyncStatus(): SyncStatus

interface SyncStatus {
  synced: boolean
  maxDrift: number // milliseconds
  stems: {
    [key in StemType]: {
      position: number
      drift: number
    }
  }
}
```

#### Crossfading

```typescript
/**
 * Crossfade between original and stems
 * @param position - 0 (full original) to 1 (full stems)
 * @param duration - Fade duration in ms
 */
crossfadeToStems(position: number, duration?: number): void

/**
 * Set crossfade curve
 * @param curve - 'linear' | 'exponential' | 'logarithmic'
 */
setCrossfadeCurve(curve: string): void
```

---

### MusicAnalyzer API

**Location**: `app/lib/audio/musicAnalyzerClient.ts`

#### Analysis Methods

```typescript
interface MusicAnalyzerClient {
  /**
   * Analyze audio buffer for musical features
   * @param buffer - AudioBuffer to analyze
   * @param options - Analysis options
   * @returns Promise<AnalysisResult>
   */
  analyze(
    buffer: AudioBuffer,
    options?: AnalysisOptions,
  ): Promise<AnalysisResult>;

  /**
   * Get real-time analysis (lighter processing)
   * @param buffer - AudioBuffer
   * @returns Promise<RealtimeAnalysis>
   */
  analyzeRealtime(buffer: AudioBuffer): Promise<RealtimeAnalysis>;

  /**
   * Check if worker is ready
   * @returns boolean
   */
  isReady(): boolean;

  /**
   * Terminate worker
   */
  dispose(): void;
}
```

#### Analysis Types

```typescript
interface AnalysisOptions {
  computeBPM?: boolean;
  computeKey?: boolean;
  computeSpectral?: boolean;
  computeOnsets?: boolean;
  computeBeats?: boolean;
}

interface AnalysisResult {
  bpm: number;
  bpmConfidence: number;
  key: string; // e.g., "C", "Am", "F#m"
  keyConfidence: number;
  energy: number; // 0.0 to 1.0
  danceability: number; // 0.0 to 1.0
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlux: number;
  onsets: Float32Array; // Onset times in seconds
  beats: Float32Array; // Beat positions
  downbeats: Float32Array; // Downbeat positions
}

interface RealtimeAnalysis {
  rms: number; // Root mean square (volume)
  peak: number; // Peak level
  spectralCentroid: number;
  zeroCrossingRate: number;
}
```

#### Harmonic Analysis

```typescript
/**
 * Get compatible keys for mixing
 * @param key - Musical key
 * @returns CompatibleKeys
 */
getCompatibleKeys(key: string): CompatibleKeys

interface CompatibleKeys {
  perfect: string[] // Same key
  adjacent: string[] // Camelot adjacent
  relative: string[] // Major/minor relative
  dominant: string[] // Fifth relationship
}

/**
 * Calculate mix compatibility score
 * @param trackA - First track analysis
 * @param trackB - Second track analysis
 * @returns number (0.0 to 1.0)
 */
calculateCompatibility(
  trackA: AnalysisResult,
  trackB: AnalysisResult
): number
```

---

### GestureStemMapper API

**Location**: `app/lib/gestures/gestureStemMapper.ts`

#### Gesture Processing

```typescript
class GestureStemMapper {
  /**
   * Process hand landmarks and detect gestures
   * @param leftHand - Left hand landmarks or null
   * @param rightHand - Right hand landmarks or null
   * @param channel - Target channel (0-3)
   */
  processGestures(
    leftHand: NormalizedLandmark[] | null,
    rightHand: NormalizedLandmark[] | null,
    channel: number
  ): void

  /**
   * Get detected gestures
   * @returns DetectedGestures
   */
  getDetectedGestures(): DetectedGestures

  interface DetectedGestures {
    left: GestureType | null
    right: GestureType | null
    twoHand: GestureType | null
    confidence: number
  }
}
```

#### Mapping Configuration

```typescript
/**
 * Set active mapping profile
 * @param profileId - Profile identifier
 */
setProfile(profileId: string): void

/**
 * Add custom mapping
 * @param mapping - Gesture to control mapping
 */
addMapping(mapping: GestureMapping): void

interface GestureMapping {
  id: string
  gesture: GestureType
  handRequirement: 'left' | 'right' | 'both' | 'any'
  control: StemControlType
  stemType?: StemType
  mode: 'absolute' | 'relative'
  sensitivity: number // 0.1 to 10.0
  priority: number // Higher overrides lower
  enabled: boolean
}

/**
 * Remove mapping
 * @param mappingId - Mapping identifier
 */
removeMapping(mappingId: string): void

/**
 * Get all mappings
 * @returns GestureMapping[]
 */
getMappings(): GestureMapping[]
```

#### Control Settings

```typescript
/**
 * Set control sensitivity
 * @param sensitivity - Global sensitivity (0.1 to 10.0)
 */
setSensitivity(sensitivity: number): void

/**
 * Set deadzone
 * @param deadzone - Deadzone percentage (0.0 to 0.2)
 */
setDeadzone(deadzone: number): void

/**
 * Set smoothing
 * @param smoothing - Smoothing factor (0.0 to 1.0)
 */
setSmoothing(smoothing: number): void

/**
 * Enable/disable mapper
 * @param enabled - boolean
 */
setEnabled(enabled: boolean): void
```

#### Calibration

```typescript
/**
 * Calibrate gesture detection
 * @param options - Calibration options
 */
calibrate(options?: CalibrationOptions): Promise<void>

interface CalibrationOptions {
  duration?: number // Calibration time in ms
  gestures?: GestureType[] // Specific gestures to calibrate
}

/**
 * Reset calibration to defaults
 */
resetCalibration(): void

/**
 * Get calibration data
 * @returns CalibrationData
 */
getCalibrationData(): CalibrationData
```

---

### Store API (Zustand)

**Location**: `app/stores/enhancedDjStoreWithGestures.ts`

#### State Structure

```typescript
interface EnhancedDJState {
  // Deck states (4 decks)
  decks: DeckState[];

  // Mixer state
  mixer: MixerState;

  // Stem players
  stemPlayers: StemPlayerState[];

  // Gesture mapper
  gestureMapper: GestureMapperState;

  // Analysis cache
  analysis: Map<string, AnalysisResult>;

  // Recording
  recording: RecordingState;

  // UI state
  ui: UIState;

  // Actions (70+ methods)
  // ... see actions section
}
```

#### Key Actions

```typescript
// Initialization
initializeMixer(): Promise<void>
initializeAudioOnUserGesture(): Promise<void>

// Deck control
loadTrack(deckId: number, track: Track): Promise<void>
playDeck(deckId: number): void
pauseDeck(deckId: number): void
setDeckVolume(deckId: number, volume: number): void
setDeckPitch(deckId: number, pitch: number): void
setDeckEQ(deckId: number, band: string, value: number): void

// Stem control
enableStemPlayer(channel: number): void
loadStemsToChannel(channel: number, stems: StemData): Promise<void>
setStemVolume(channel: number, stemType: StemType, volume: number): void
setStemMute(channel: number, stemType: StemType, muted: boolean): void
setStemSolo(channel: number, stemType: StemType | null): void

// Gesture control
processHandGestures(left: Landmarks, right: Landmarks, channel: number): void
setGestureMapperEnabled(enabled: boolean): void
setActiveMappingProfile(profileId: string): void

// Mixer control
setCrossfaderPosition(position: number): void
setMasterGain(gain: number): void

// Analysis
analyzeTrack(trackId: string): Promise<AnalysisResult>
getTrackAnalysis(trackId: string): AnalysisResult | null

// Recording
startRecording(): Promise<void>
stopRecording(): Promise<Blob>
```

#### Selectors

```typescript
// Get specific deck state
const deckA = useDJStore((state) => state.decks[0]);

// Get playing decks
const playingDecks = useDJStore((state) =>
  state.decks.filter((d) => d.isPlaying),
);

// Get active gestures
const activeGestures = useDJStore(
  (state) => state.gestureMapper.detectedGestures,
);

// Subscribe to specific slice
const crossfaderPosition = useDJStore(
  (state) => state.mixer.crossfaderPosition,
);
```

---

## Data Types

### Core Types

```typescript
interface Track {
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

interface DeckState {
  id: number;
  isPlaying: boolean;
  isLoading: boolean;
  currentTrack: Track | null;
  position: number; // 0.0 to 1.0
  pitch: number; // -8 to +8
  volume: number; // 0.0 to 1.0
  eq: {
    low: number; // -26 to +26
    mid: number; // -26 to +26
    high: number; // -26 to +26
  };
  filter: {
    enabled: boolean;
    type: string;
    frequency: number;
    resonance: number;
  };
  cuePoints: CuePoint[];
  effects: Map<string, number>;
}

type StemType = "drums" | "bass" | "melody" | "vocals" | "original";

type GestureType =
  | "peace"
  | "rock"
  | "ok"
  | "call"
  | "thumbs_up"
  | "thumbs_down"
  | "fist"
  | "pinch"
  | "point"
  | "swipe"
  | "circle"
  | "clap"
  | "spread_hands"
  | "crossfader_hands";

interface NormalizedLandmark {
  x: number; // 0.0 to 1.0
  y: number; // 0.0 to 1.0
  z: number; // -1.0 to 1.0
  visibility?: number; // 0.0 to 1.0
}
```

---

## Error Handling

### Error Types

```typescript
class AudioInitializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AudioInitializationError";
  }
}

class DeckLoadError extends Error {
  constructor(deck: string, reason: string) {
    super(`Failed to load deck ${deck}: ${reason}`);
    this.name = "DeckLoadError";
  }
}

class GestureDetectionError extends Error {
  constructor(reason: string) {
    super(`Gesture detection failed: ${reason}`);
    this.name = "GestureDetectionError";
  }
}

class WorkerError extends Error {
  constructor(worker: string, reason: string) {
    super(`Worker ${worker} error: ${reason}`);
    this.name = "WorkerError";
  }
}
```

### Error Handling Patterns

```typescript
// Try-catch with specific error types
try {
  await audioService.initialize();
} catch (error) {
  if (error instanceof AudioInitializationError) {
    // Handle audio initialization failure
  } else if (error.name === "NotAllowedError") {
    // Handle permission denial
  } else {
    // Handle unexpected error
  }
}

// Promise error handling
deckManager
  .loadTrack("A", track)
  .then(() => {
    // Success
  })
  .catch((error: DeckLoadError) => {
    // Handle load failure
  });

// Event-based error handling
deckManager.on("deck:error", ({ deck, error }) => {
  console.error(`Deck ${deck} error:`, error);
  // Show user notification
});
```

---

## Usage Examples

### Basic DJ Setup

```typescript
import { AudioService } from "@/services/AudioService";
import { DeckManager } from "@/services/DeckManager";
import { useDJStore } from "@/stores/enhancedDjStoreWithGestures";

// Initialize on user gesture
async function initializeDJ() {
  const audioService = AudioService.getInstance();
  await audioService.initialize();

  const deckManager = DeckManager.getInstance();
  await deckManager.initializeDecks();

  // Load tracks
  await deckManager.loadTrack("A", {
    id: "1",
    url: "/audio/track1.mp3",
    title: "Track 1",
    artist: "Artist 1",
  });

  // Start playback
  deckManager.play("A");

  // Set up crossfader
  deckManager.setCrossfaderPosition(0); // Center
}
```

### Gesture Control Setup

```typescript
import { GestureStemMapper } from "@/lib/gestures/gestureStemMapper";

const mapper = new GestureStemMapper();

// Configure mappings
mapper.addMapping({
  id: "volume-control",
  gesture: "peace",
  handRequirement: "right",
  control: "volume",
  stemType: "vocals",
  mode: "absolute",
  sensitivity: 1.0,
  priority: 50,
  enabled: true,
});

// Process gestures
function handleGestures(landmarks: HandLandmarkResults) {
  mapper.processGestures(
    landmarks.leftHand,
    landmarks.rightHand,
    0, // Channel
  );
}
```

### Music Analysis

```typescript
import { musicAnalyzerClient } from "@/lib/audio/musicAnalyzerClient";

async function analyzeTrack(audioBuffer: AudioBuffer) {
  const analysis = await musicAnalyzerClient.analyze(audioBuffer, {
    computeBPM: true,
    computeKey: true,
    computeSpectral: true,
  });

  console.log(`BPM: ${analysis.bpm}`);
  console.log(`Key: ${analysis.key}`);
  console.log(`Energy: ${analysis.energy}`);

  // Get compatible keys
  const compatible = musicAnalyzerClient.getCompatibleKeys(analysis.key);
  console.log("Mix with:", compatible.adjacent);
}
```

This comprehensive API reference provides the complete interface for OX Board's functionality.
