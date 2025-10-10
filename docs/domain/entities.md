# Domain Entities

## Overview

This document catalogs all domain entities in the OX Board gesture-controlled DJ platform. Entities are organized by bounded context.

## Audio Engine Context

### AudioService (Singleton)

**Location**: `app/services/AudioService.ts`

**Purpose**: Core audio context management service. Manages Web Audio API lifecycle, provides factory methods for audio nodes, and monitors performance.

**Key Properties**:

- `context: Tone.Context` - Web Audio context wrapper
- `masterGain: Tone.Gain` - Master output gain node
- `crossfader: Tone.CrossFade` - Crossfader routing
- `stats: AudioServiceStats` - Performance metrics (latency, CPU, sample rate, buffer size)
- `workletSupported: boolean` - AudioWorklet capability flag

**Key Methods**:

- `initialize(): Promise<boolean>` - Async initialization requiring user gesture
- `createGain(gain: number): Tone.Gain` - Factory for gain nodes
- `createEQ3(): Tone.EQ3` - Factory for 3-band EQ
- `loadAudioWorkletModule(path: string): Promise<boolean>` - Load custom audio processors

**Lifecycle**:

1. Construct (private constructor for singleton)
2. Initialize on user gesture (browser autoplay policy)
3. Start performance monitoring (1s interval)
4. Dispose on cleanup (stops monitoring, disposes nodes)

**Dependencies**:

- Requires: `safeAudioContext` for browser compatibility
- Provides: Audio context to all other audio services

---

### DeckManager (Singleton, EventEmitter)

**Location**: `app/services/DeckManager.ts`

**Purpose**: Manages dual-deck DJ architecture with crossfading, beat sync, and master effects chain.

**Key Properties**:

- `deckA: Deck` - Primary deck instance
- `deckB: Deck` - Secondary deck instance
- `crossfaderInstance: Crossfader` - Audio routing between decks
- `masterGain: Tone.Gain` - Master output volume
- `compressor: Tone.Compressor` - Master compression
- `limiter: Tone.Limiter` - Peak limiting
- `syncState: SyncState` - Beat synchronization state
- `recorder: Tone.Recorder | null` - Recording functionality

**Key Methods**:

- `initializeDecks(): Promise<void>` - Async deck initialization (after AudioService)
- `sync(master: "A" | "B"): void` - Beat sync slave deck to master
- `setCrossfaderPosition(position: number): void` - Crossfade control (-1 to 1)
- `startRecording(): Promise<void>` / `stopRecording(): Promise<Blob>` - Session recording

**Events**:

- `deck:play`, `deck:pause`, `deck:stop` - Playback state changes
- `deck:loaded` - Track loaded successfully
- `crossfader:change` - Crossfader position update
- `sync:engaged` / `sync:disengaged` - Beat sync state
- `performance:update` - Performance metrics (1s interval)

**Audio Chain**:

```
Deck A → Crossfader A
                      → Compressor → Limiter → Master Gain → Destination
Deck B → Crossfader B
```

---

### Deck

**Location**: `app/lib/audio/deck.ts`

**Purpose**: Individual deck entity with playback, effects, and cue point management.

**Key Properties**:

- `id: string` - Deck identifier ("A" or "B")
- `player: Tone.Player | null` - Audio player instance
- `output: Tone.Gain` - Deck output routing
- `eq: Tone.EQ3` - 3-band EQ
- `filter: Tone.Filter` - High/Low pass filter
- `state: DeckState` - Current playback state

**DeckState**:

```typescript
{
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  pitch: number; // -100 to +100 (%)
  tempo: number; // Playback rate
  bpm: number | null; // Detected BPM
  key: string | null; // Musical key
  cuePoint: number | null;
  loopEnabled: boolean;
  loopStart: number | null;
  loopEnd: number | null;
}
```

**Key Methods**:

- `loadTrack(url: string, metadata?: TrackMetadata): Promise<void>`
- `play() / pause() / stop(): void` - Playback control
- `setPitch(cents: number): void` - Pitch adjustment (-100 to +100)
- `setEQ(band: 'low' | 'mid' | 'high', value: number): void`
- `setCuePoint(position: number): void` - Mark cue point
- `setLoop(start: number, end: number): void` - Configure loop

---

### Crossfader

**Location**: `app/lib/audio/crossfader.ts`

**Purpose**: Audio routing and crossfading between two sources (typically decks).

**Key Properties**:

- `crossfade: Tone.CrossFade` - Tone.js crossfade node
- `position: number` - Crossfader position (0 = A, 0.5 = center, 1 = B)
- `curve: 'linear' | 'constant-power' | 'exponential'` - Fade curve type
- `cutLag: number` - Cut lag time (ms)

**CrossfaderConfig**:

```typescript
{
  position: number; // 0 to 1
  curve: "linear" | "constant-power" | "exponential";
  cutLag: number; // Transition time (ms)
  hamsterMode: boolean; // Reverse crossfader direction
}
```

**Key Methods**:

- `setPosition(position: number): void` - Set crossfader position
- `setCurve(curve: CurveType): void` - Change fade curve
- `cut(deck: "A" | "B", duration?: number): void` - Quick cut to deck
- `center(): void` - Return to center position

---

## Stem Processing Context

### EnhancedAudioMixer

**Location**: `app/lib/audio/enhancedMixer.ts`

**Purpose**: Advanced 4-channel mixer with per-channel stem player support.

**Key Properties**:

- `channels: Channel[]` - 4 channel array
- `stemPlayers: Map<number, StemPlayer>` - Stem players per channel
- `crossfader: Crossfader` - Channel routing
- `masterCompressor: Tone.Compressor`
- `masterLimiter: Tone.Limiter`

**Channel Structure**:

```typescript
{
  id: number;
  gain: Tone.Gain;
  eq: Tone.EQ3;
  filter: Tone.Filter;
  panner: Tone.Panner;
  stemPlayerEnabled: boolean;
  config: ChannelConfig;
}
```

**ChannelConfig**:

```typescript
{
  gain: number
  eq: { low: number, mid: number, high: number }
  filter: { frequency: number, type: 'lowpass' | 'highpass' }
  pan: number
  stemPlayerEnabled: boolean
}
```

**Key Methods**:

- `enableStemPlayer(channel: number): Promise<void>` - Enable stem mixing on channel
- `loadStemsToChannel(channel: number, demucsOutput: DemucsOutput): Promise<StemLoadResult[]>`
- `setStemVolume(channel: number, stemType: StemType, volume: number): void`
- `playStemPlayer(channel: number): Promise<void>`

---

### StemPlayer

**Location**: `app/lib/audio/stemPlayer.ts`

**Purpose**: Multi-stem audio playback with independent control per stem (drums, bass, melody, vocals, original).

**Key Properties**:

- `players: Map<StemType | 'original', Tone.Player>` - Player per stem
- `gains: Map<StemType | 'original', Tone.Gain>` - Gain node per stem
- `panners: Map<StemType | 'original', Tone.Panner>` - Pan per stem
- `eqs: Map<StemType | 'original', Tone.EQ3>` - EQ per stem
- `stemMix: Tone.CrossFade` - Mix between stems and original

**StemType**: `'drums' | 'bass' | 'melody' | 'vocals'`

**StemControls**:

```typescript
{
  volume: number      // 0 to 1
  muted: boolean
  soloed: boolean
  pan: number         // -1 to 1
  eq: { low: number, mid: number, high: number }
  playbackRate: number
}
```

**StemPlayerState**:

```typescript
{
  isPlaying: boolean
  currentTime: number
  duration: number
  stemsLoaded: StemType[]
  stemControls: Record<StemType | 'original', StemControls>
  stemMix: number  // 0 = stems, 1 = original
}
```

**Key Methods**:

- `loadStem(stemType: StemType, buffer: AudioBuffer): Promise<void>`
- `setStemVolume(stemType: StemType, volume: number): void`
- `setStemMute(stemType: StemType, muted: boolean): void`
- `setStemSolo(stemType: StemType, soloed: boolean): void`
- `play() / pause() / stop(): void` - Synchronized playback

---

### DemucsOutput

**Location**: `app/lib/audio/demucsProcessor.ts`

**Purpose**: Represents output from Demucs stem separation algorithm.

**Structure**:

```typescript
{
  original: string      // URL to original audio
  drums: string         // URL to drums stem
  bass: string          // URL to bass stem
  melody: string        // URL to melody/other stem
  vocals: string        // URL to vocals stem
  metadata?: {
    duration: number
    sampleRate: number
    format: string
  }
}
```

**StemLoadResult**:

```typescript
{
  stemType: StemType
  success: boolean
  duration?: number
  error?: string
}
```

---

## Gesture Recognition Context

### HandResult

**Location**: `app/lib/gesture/recognition.ts`

**Purpose**: Represents detected hand data from MediaPipe.

**Structure**:

```typescript
{
  landmarks: Point2D[]     // 21 hand landmarks (x, y)
  handedness: "Left" | "Right"
  confidence: number       // 0 to 1
  worldLandmarks?: Array<{x, y, z}>  // Optional 3D coordinates
}
```

**HandLandmark Enum**: 21 landmarks

- WRIST (0)
- THUMB_CMC, THUMB_MCP, THUMB_IP, THUMB_TIP (1-4)
- INDEX_FINGER_MCP, INDEX_FINGER_PIP, INDEX_FINGER_DIP, INDEX_FINGER_TIP (5-8)
- MIDDLE_FINGER_MCP, MIDDLE_FINGER_PIP, MIDDLE_FINGER_DIP, MIDDLE_FINGER_TIP (9-12)
- RING_FINGER_MCP, RING_FINGER_PIP, RING_FINGER_DIP, RING_FINGER_TIP (13-16)
- PINKY_MCP, PINKY_PIP, PINKY_DIP, PINKY_TIP (17-20)

---

### GestureResult

**Location**: `app/lib/gesture/recognition.ts`

**Purpose**: Detected gesture with classification and metadata.

**Structure**:

```typescript
{
  type: GestureClassification
  confidence: number
  data: Record<string, any>  // Gesture-specific data
  timestamp: number
  handSide?: "Left" | "Right"
  metadata?: {
    fingerCount?: number
    handDistance?: number
    rotationAngle?: number
    velocity?: Point2D
    direction?: "up" | "down" | "left" | "right"
    clockwise?: boolean
  }
}
```

**GestureClassification** (27 types):

- Basic: PINCH, SWIPE_HORIZONTAL, SWIPE_VERTICAL, ROTATE, SPREAD, FIST, PALM_OPEN
- Complex: TWO_HAND_PINCH, TWO_HAND_ROTATE, FINGER_COUNT, HAND_WAVE, PEACE_SIGN, THUMBS_UP/DOWN
- Two-hand: CLAP, SPREAD_HANDS, CROSSFADER_HANDS, DUAL_CONTROL
- Movement: CIRCLE_GESTURE, ZIGZAG_GESTURE, PUSH_GESTURE, PULL_GESTURE

---

### GestureStemMapper

**Location**: `app/lib/gestures/gestureStemMapper.ts`

**Purpose**: Maps detected gestures to stem player controls with configurable profiles.

**Key Properties**:

- `mappingProfiles: Map<string, MappingProfile>` - Gesture mapping configurations
- `activeMappingProfile: MappingProfile | null` - Current active profile
- `feedbackState: FeedbackState` - Visual/haptic feedback state
- `performanceMetrics: PerformanceMetrics` - Latency tracking

**MappingProfile**:

```typescript
{
  id: string
  name: string
  description: string
  mappings: GestureMapping[]
}
```

**GestureMapping**:

```typescript
{
  id: string
  gestureType: GestureClassification
  handSide: "Left" | "Right" | "Both"
  targetStem: StemType | "master" | "crossfader" | "original"
  controlType: ControlType
  mode: ControlMode
  params?: {
    sensitivity?: number
    deadzone?: number
    curve?: "linear" | "exponential"
    eqBand?: "low" | "mid" | "high"
    action?: string
  }
}
```

**ControlType**: `'volume' | 'pan' | 'eq' | 'mute' | 'solo' | 'playback_rate' | 'crossfade' | 'effect'`

**ControlMode**: `'continuous' | 'toggle' | 'trigger'`

**Key Methods**:

- `detectGestures(leftHand, rightHand, width, height): GestureDetectionResult[]`
- `processGestures(gestures: GestureDetectionResult[], channel: number): void`
- `setActiveProfile(profileId: string): boolean`
- `setControlMode(mappingId: string, mode: ControlMode): void`

---

## State Management Context

### EnhancedDJState (Zustand Store)

**Location**: `app/stores/enhancedDjStoreWithGestures.ts`

**Purpose**: Central state management for entire DJ application.

**Key State Properties**:

```typescript
{
  // Audio
  mixer: EnhancedAudioMixer | null
  channelConfigs: ChannelConfig[]
  crossfaderConfig: CrossfaderConfig
  masterConfig: MasterConfig

  // Decks (4 total)
  decks: Deck[]

  // Stem Controls per channel
  stemControls: Record<number, StemControlState>

  // Gesture Control
  gestureStemMapper: GestureStemMapper | null
  gestureMapperEnabled: boolean
  activeMappingProfile: string | null
  gestureLatency: number
  gestureFeedback: FeedbackState | null

  // UI
  isDJModeActive: boolean
  selectedDeck: number
  viewMode: "mixer" | "decks" | "effects" | "library" | "stems"
  stemViewMode: "individual" | "combined"

  // Processing
  stemProcessing: Record<number, {
    isProcessing: boolean
    progress: number
    error?: string
  }>
}
```

**Deck Entity** (in store):

```typescript
{
  id: number
  track: Track | null
  isPlaying: boolean
  currentTime: number
  playbackRate: number
  volume: number
  cuePoints: number[]
  loopStart: number | null
  loopEnd: number | null
  stemPlayerEnabled: boolean
  stemPlayerState?: StemPlayerState
}
```

**Track Entity**:

```typescript
{
  id: string
  title: string
  artist: string
  duration: number
  bpm: number
  key: string
  energy?: number
  url?: string
  hasStems?: boolean
  stemData?: DemucsOutput
}
```

**StemControlState**:

```typescript
{
  drums: StemControls;
  bass: StemControls;
  melody: StemControls;
  vocals: StemControls;
  original: StemControls;
  stemMix: number; // 0 to 1
}
```

---

## Music Analysis Context

### MusicAnalyzerClient

**Location**: `app/lib/audio/musicAnalyzerClient.ts`

**Purpose**: Web Worker client for music analysis (BPM, key, spectral features).

**Analysis Result**:

```typescript
{
  bpm: number
  key: string          // Camelot wheel notation
  energy: number       // 0 to 1
  spectralCentroid: number
  spectralRolloff: number
  spectralFlux: number
  harmonicCompatibility?: string[]  // Compatible keys
}
```

**Key Methods**:

- `analyzeBPM(audioBuffer: AudioBuffer): Promise<number>`
- `analyzeKey(audioBuffer: AudioBuffer): Promise<string>`
- `analyzeSpectralFeatures(audioBuffer: AudioBuffer): Promise<SpectralFeatures>`
- `getHarmonicMatches(key: string): string[]` - Camelot wheel matching

---

## Performance & Monitoring Context

### PerformanceMetrics

**Location**: `app/services/types/audio.ts`

**Structure**:

```typescript
{
  audioLatency: number; // ms
  renderTime: number; // ms
  dropouts: number; // count
  cpuUsage: number; // 0 to 100
  memoryUsage: number; // MB
}
```

### AudioServiceStats

**Structure**:

```typescript
{
  latency: number; // Total audio latency (ms)
  cpuUsage: number; // Estimated CPU usage (%)
  isRunning: boolean;
  sampleRate: number; // 44100 or 48000 Hz
  bufferSize: number; // samples
}
```

---

## UI Component Context

### ViewMode

**Type**: `"decks" | "mixer" | "stems" | "effects" | "library"`

**Purpose**: Determines active UI view in application.

### FeedbackState

**Location**: `app/lib/gestures/gestureStemMapper.ts`

**Purpose**: Visual feedback for gesture recognition.

**Structure**:

```typescript
{
  activeGestures: string[]
  activeControls: string[]
  latency: number
  confidence: number
  visual: {
    color: string
    intensity: number
    position: Point2D
  }
}
```

---

## Metrics Summary

**Total Entities**: 25 core domain entities
**Bounded Contexts**: 7 (Audio Engine, Stem Processing, Gesture Recognition, State Management, Music Analysis, Performance, UI)
**Singleton Services**: 3 (AudioService, DeckManager, EnhancedDJState store)
**Audio Node Types**: 15+ (Gain, EQ3, Filter, Panner, Compressor, Limiter, CrossFade, Player, etc.)
**Gesture Types**: 27 classifications
**Data Transfer Objects**: 12 (DemucsOutput, StemLoadResult, GestureResult, etc.)

---

## Entity Relationship Summary

```
AudioService (singleton)
  ├─> DeckManager (singleton)
  │     ├─> Deck A
  │     │     ├─> Tone.Player
  │     │     ├─> Tone.EQ3
  │     │     └─> Tone.Filter
  │     ├─> Deck B
  │     └─> Crossfader
  └─> EnhancedAudioMixer
        ├─> Channel[0..3]
        │     ├─> StemPlayer (optional)
        │     │     ├─> Player (drums)
        │     │     ├─> Player (bass)
        │     │     ├─> Player (melody)
        │     │     ├─> Player (vocals)
        │     │     └─> Player (original)
        │     └─> Channel effects chain
        └─> Master effects chain

EnhancedDJState (Zustand store)
  ├─> EnhancedAudioMixer reference
  ├─> Deck[0..3] state
  ├─> GestureStemMapper
  │     ├─> MappingProfile[*]
  │     └─> FeedbackState
  └─> StemControls per channel

HandResult (from MediaPipe)
  └─> AdvancedGestureRecognizer
        └─> GestureResult[*]
              └─> GestureStemMapper
                    └─> Store actions
```

---

_Last Updated: 2025-10-09_
_Total Lines of Analysis: ~200_
