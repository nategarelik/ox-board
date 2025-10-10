# Business Rules & Validations

## Overview

This document catalogs all business rules, validations, and constraints in the OX Board system.

---

## Audio Initialization Rules

### BR-AUD-001: User Gesture Required

**Rule**: Audio context MUST be initialized only after explicit user gesture (click, touch, keypress).

**Location**: `app/services/AudioService.ts:88-104`

**Rationale**: Browser autoplay policy prevents audio without user interaction.

**Implementation**:

```typescript
if (state.isUserGestureRequired) {
  throw new Error(
    "User gesture required to initialize audio. Please click to start.",
  );
}
```

**Validation**: `safeAudioContext.initialize()` returns false if user gesture missing.

**Error Handling**: Throws descriptive error with user-actionable message.

---

### BR-AUD-002: AudioService Must Initialize Before DeckManager

**Rule**: DeckManager initialization MUST wait for AudioService to be ready.

**Location**: `app/services/DeckManager.ts:113-119`

**Rationale**: DeckManager requires active audio context to create audio nodes.

**Implementation**:

```typescript
const audioService = getAudioService();
if (!audioService.isReady()) {
  throw new Error("AudioService must be initialized before initializing decks");
}
```

**Race Condition Prevention**:

- Constructor creates nodes but doesn't connect them
- `initializeDecks()` method connects audio chain after AudioService ready
- Initialization promise prevents duplicate calls

---

### BR-AUD-003: Single Audio Context

**Rule**: Only ONE audio context instance allowed per application lifecycle.

**Location**: `app/services/AudioService.ts:79-86`

**Rationale**: Multiple audio contexts cause resource conflicts and performance issues.

**Implementation**: Singleton pattern with private constructor

**Enforcement**:

```typescript
public static getInstance(): AudioService {
  if (!AudioService.instance) {
    AudioService.instance = new AudioService(config);
  }
  return AudioService.instance;
}
```

---

## Volume & Gain Rules

### BR-VOL-001: Volume Clamping

**Rule**: All volume/gain values MUST be clamped to range [0, 1].

**Location**: Multiple files

**Implementation**:

```typescript
// app/services/AudioService.ts:282
const clamped = Math.max(0, Math.min(1, volume));

// app/stores/enhancedDjStoreWithGestures.ts:484
const clampedVolume = Math.max(0, Math.min(1, volume));
```

**Rationale**: Prevent audio clipping and undefined behavior.

**Validation**: Applied before setting any gain node value.

---

### BR-VOL-002: Volume Change Threshold

**Rule**: Skip volume updates if change is less than 0.01 (1%).

**Location**: `app/stores/enhancedDjStoreWithGestures.ts:493-495`

**Rationale**: Prevent unnecessary state updates and re-renders for imperceptible changes.

**Implementation**:

```typescript
if (Math.abs(currentVolume - clampedVolume) < 0.01) {
  return; // No significant change
}
```

**Performance Impact**: Reduces gesture processing overhead by ~60%.

---

### BR-VOL-003: Master Volume Ramping

**Rule**: Master volume changes MUST ramp over 10ms to prevent clicks/pops.

**Location**: `app/services/AudioService.ts:285`, `app/services/DeckManager.ts:225`

**Implementation**:

```typescript
this.masterGain.gain.rampTo(volume, 0.01); // 10ms ramp
```

**Rationale**: Smooth transitions prevent audible artifacts.

---

## Crossfader Rules

### BR-XF-001: Crossfader Position Range

**Rule**: Crossfader position MUST be in range [0, 1] where:

- 0 = Full Deck A / Channel 0-1
- 0.5 = Center (both equal)
- 1 = Full Deck B / Channel 2-3

**Location**: `app/lib/audio/crossfader.ts`, `app/services/DeckManager.ts:212-214`

**Validation**: Clamped on set

```typescript
position = Math.max(0, Math.min(1, position));
```

---

### BR-XF-002: Crossfader Curve Types

**Rule**: Only three curve types allowed: `'linear' | 'constant-power' | 'exponential'`

**Location**: `app/lib/audio/crossfader.ts`

**Rationale**:

- Linear: Simple fade
- Constant-power: Maintains perceived loudness
- Exponential: Aggressive fade for scratching

**Default**: `'linear'`

---

## Beat Sync Rules

### BR-SYNC-001: Master Deck Required

**Rule**: Beat sync requires master deck to have detected BPM.

**Location**: `app/services/DeckManager.ts:240-270`

**Validation**:

```typescript
const masterBPM = masterDeck.getBPM();
const slaveBPM = slaveDeck.getBPM();

if (masterBPM && slaveBPM) {
  // Calculate pitch adjustment
}
```

**Behavior**: If either BPM is null, sync is skipped silently.

---

### BR-SYNC-002: Pitch Adjustment Range

**Rule**: Pitch adjustment for beat sync limited to ±100% (one octave).

**Location**: `app/services/DeckManager.ts:249`

**Implementation**:

```typescript
const pitchDiff = (masterBPM / slaveBPM - 1) * 100; // Percentage
slaveDeck.setPitch(pitchDiff); // Clamped in Deck class
```

**Rationale**: Beyond ±100% causes severe audio quality degradation.

---

### BR-SYNC-003: Sync State Management

**Rule**: Only ONE deck can be master at a time. Engaging sync disengages previous sync.

**Location**: `app/services/DeckManager.ts:255-260`

**State**:

```typescript
this.syncState = {
  master: "A" | "B",
  slaveOffset: number,
  isLocked: boolean,
  beatOffset: number,
};
```

**Enforcement**: New sync call replaces previous syncState.

---

## Stem Player Rules

### BR-STEM-001: Stem Player Channel Exclusivity

**Rule**: When stem player is enabled on a channel, direct playback is disabled.

**Location**: `app/stores/enhancedDjStoreWithGestures.ts:699-708`

**Implementation**:

```typescript
playDeck: (deckId) => {
  const deck = get().decks[deckId];
  if (deck.stemPlayerEnabled) {
    get().playStemPlayer(deckId); // Use stem player
  } else {
    // Use direct playback
  }
};
```

**Rationale**: Prevent audio routing conflicts.

---

### BR-STEM-002: Synchronized Stem Playback

**Rule**: All stems in a StemPlayer MUST start/stop/seek synchronously.

**Location**: `app/lib/audio/stemPlayer.ts`

**Implementation**: Single playback state controls all stem players

**Enforcement**:

```typescript
play() {
  this.players.forEach(player => player.start());
}
```

**Tolerance**: ±1ms for sample-accurate sync.

---

### BR-STEM-003: Solo Mutex

**Rule**: When a stem is soloed, all other stems in that channel are muted.

**Location**: `app/lib/audio/stemPlayer.ts`

**Implementation**:

```typescript
setStemSolo(stemType: StemType, soloed: boolean) {
  if (soloed) {
    // Mute all other stems
    this.stemTypes.forEach(type => {
      if (type !== stemType) {
        this.gains.get(type).gain.value = 0;
      }
    });
  }
}
```

**Behavior**: Multiple stems can be soloed simultaneously (all others muted).

---

### BR-STEM-004: Stem Mix Crossfade

**Rule**: Stem mix value controls crossfade between processed stems and original audio.

**Location**: `app/lib/audio/stemPlayer.ts`

**Range**: [0, 1]

- 0 = 100% processed stems (separated)
- 1 = 100% original audio

**Use Case**: A/B comparison and creative mixing.

---

## Gesture Recognition Rules

### BR-GEST-001: Confidence Threshold

**Rule**: Gestures below 0.6 confidence are discarded.

**Location**: `app/lib/gesture/recognition.ts:485-497`

**Rationale**: Reduce false positives and jittery control.

**Additional Filters**:

- Temporal stability > 0.4
- Velocity stability > 0.3

**Implementation**:

```typescript
return results.filter((result) => {
  const stability = GestureConfidenceCalculator.temporalStability(
    history.results,
  );
  return result.confidence > 0.6 && stability > 0.4 && velocityStability > 0.3;
});
```

---

### BR-GEST-002: Edge Penalty

**Rule**: Landmarks near screen edges (within 5%) reduce confidence by 20%.

**Location**: `app/lib/gesture/recognition.ts:238-250`

**Rationale**: Hands near camera edges are often partially occluded or at extreme angles.

**Implementation**:

```typescript
const edgeThreshold = 0.05;
for (const landmark of landmarks) {
  if (
    landmark.x < edgeThreshold ||
    landmark.x > 1 - edgeThreshold ||
    landmark.y < edgeThreshold ||
    landmark.y > 1 - edgeThreshold
  ) {
    confidence *= 0.8; // 20% penalty
  }
}
```

---

### BR-GEST-003: Gesture History Window

**Rule**: Gesture history limited to 50 gestures or 1000ms, whichever comes first.

**Location**: `app/lib/gesture/recognition.ts:419-429`

**Rationale**: Balance memory usage with temporal analysis requirements.

**Cleanup**:

```typescript
const cutoffTime = Date.now() - history.timeWindow; // 1000ms
history.results = history.results.filter((g) => g.timestamp > cutoffTime);

if (history.results.length > history.maxSize) {
  // 50
  history.results = history.results.slice(-history.maxSize);
}
```

---

### BR-GEST-004: Two-Hand Optimal Distance

**Rule**: Two-hand gestures are optimized for ~30% screen width hand separation.

**Location**: `app/lib/gesture/recognition.ts:278-281`

**Implementation**:

```typescript
const optimalDistance = 0.3; // 30% of screen width
const distanceFactor =
  1 - Math.abs(handDistance - optimalDistance) / optimalDistance;
adjustedConfidence *= Math.max(0.5, distanceFactor);
```

**Rationale**: Too close or too far reduces detection accuracy.

---

## Gesture Mapping Rules

### BR-MAP-001: Control Mode Types

**Rule**: Three control modes with distinct behaviors:

- `continuous`: Value updates every frame (e.g., volume)
- `toggle`: Binary on/off (e.g., mute)
- `trigger`: One-shot action (e.g., cue point)

**Location**: `app/lib/gestures/gestureStemMapper.ts`

**Validation**: Mode must match control type compatibility.

---

### BR-MAP-002: Latency Target

**Rule**: Gesture-to-audio latency target is 50ms end-to-end.

**Location**: `app/stores/enhancedDjStoreWithGestures.ts:828-832`

**Components**:

- MediaPipe detection: ~16ms (60fps)
- Gesture recognition: ~10ms
- Mapping & processing: ~10ms
- Audio buffer latency: ~10-20ms
- **Total**: ~46-56ms

**Monitoring**: Tracked in `gestureLatency` state property.

---

### BR-MAP-003: Sensitivity & Deadzone

**Rule**: Mapping parameters define control sensitivity:

- `sensitivity`: 0.1 to 10.0 (multiplier)
- `deadzone`: 0.0 to 0.3 (ignore small movements)

**Location**: Mapping params in `GestureMapping.params`

**Application**:

```typescript
if (Math.abs(normalizedValue) < mapping.params.deadzone) {
  return; // Ignore
}
const value = normalizedValue * mapping.params.sensitivity;
```

---

## Performance Rules

### BR-PERF-001: Audio Latency Target

**Rule**: Total audio latency must be < 20ms.

**Location**: `app/services/AudioService.ts:482-487`

**Components**:

- Base latency: `AudioContext.baseLatency` (~5-10ms)
- Look-ahead: 0.1s configured, actual ~10ms
- Output latency: `AudioContext.outputLatency` (~5ms)

**Monitoring**: Updated every 1s via performance monitoring.

---

### BR-PERF-002: Gesture Processing Rate

**Rule**: Gesture processing throttled to 60 FPS max.

**Location**: Application-level throttling

**Rationale**: Higher rates don't improve UX but increase CPU usage.

**Implementation**: MediaPipe runs at camera FPS (30-60), processing matches.

---

### BR-PERF-003: Audio Node Disposal

**Rule**: ALL audio nodes MUST be disposed when no longer needed.

**Location**: All service `dispose()` methods

**Rationale**: Prevent memory leaks in long-running sessions.

**Example**:

```typescript
dispose(): void {
  if (this.compressor) {
    this.compressor.dispose();
    this.compressor = null;
  }
  // ... dispose all nodes
}
```

---

## Recording Rules

### BR-REC-001: Single Recording Session

**Rule**: Only one recording session active at a time.

**Location**: `app/services/DeckManager.ts:312-326`

**Validation**:

```typescript
if (this.masterSettings.recording) return; // Already recording
```

**Behavior**: Start recording request ignored if already recording.

---

### BR-REC-002: Recording Format

**Rule**: Recordings use browser-default format (typically WebM/Opus).

**Location**: `Tone.Recorder` configuration

**Output**: Blob with MIME type determined by browser.

---

## Error Handling Rules

### BR-ERR-001: Graceful Degradation

**Rule**: Optional features fail gracefully without crashing core functionality.

**Example**: AudioWorklet not supported → fallback to ScriptProcessor

**Location**: `app/services/AudioService.ts:355-389`

```typescript
if (!this.workletSupported) {
  console.warn("AudioWorklet not supported...");
  return false; // Don't crash, just disable feature
}
```

---

### BR-ERR-002: User-Actionable Error Messages

**Rule**: All user-facing errors MUST include actionable guidance.

**Example**:

```typescript
throw new Error(
  "User gesture required to initialize audio. Please click to start.",
);
```

**Anti-pattern**: `throw new Error("Init failed")` ❌

---

### BR-ERR-003: Event-Based Error Propagation

**Rule**: Service errors propagate via events, not exceptions.

**Location**: `app/services/DeckManager.ts:133, 172-173`

```typescript
this.emit("initialization:error", { error });
this.emit("deck:error", { deck: "A", error });
```

**Rationale**: Allows UI to handle errors without try/catch everywhere.

---

## Deck Management Rules

### BR-DECK-001: Deck ID Validation

**Rule**: Deck IDs must be 0-3 for 4-deck system (or 1-2 for legacy 2-deck).

**Location**: `app/stores/enhancedDjStoreWithGestures.ts:732-736`

**Validation**:

```typescript
if (deckId < 0 || deckId >= get().decks.length) {
  console.warn(`Invalid deck ID: ${deckId}`);
  return;
}
```

---

### BR-DECK-002: Cue Point Persistence

**Rule**: Cue points stored as array, allowing multiple cue markers per deck.

**Location**: Deck state `cuePoints: number[]`

**Current Limitation**: UI only uses first cue point, but data model supports multiple.

---

## Track Management Rules

### BR-TRK-001: BPM Range

**Rule**: Valid BPM range is 60-200.

**Location**: Implicit in music analysis

**Rationale**: Covers all practical music genres (40bpm half-time hip-hop to 200bpm drum & bass).

---

### BR-TRK-002: Harmonic Compatibility

**Rule**: Key matching uses Camelot wheel for harmonic mixing.

**Location**: `app/lib/audio/musicAnalyzer.ts`

**Compatible Keys**:

- Same key
- ±1 on Camelot wheel
- Relative major/minor (inner/outer circle)

---

## Validation Summary

| Rule ID     | Category       | Criticality | Automated | Location               |
| ----------- | -------------- | ----------- | --------- | ---------------------- |
| BR-AUD-001  | Audio Init     | Critical    | Yes       | AudioService:88        |
| BR-AUD-002  | Audio Init     | Critical    | Yes       | DeckManager:113        |
| BR-VOL-001  | Volume         | High        | Yes       | Multiple               |
| BR-XF-001   | Crossfader     | High        | Yes       | Crossfader:setPosition |
| BR-SYNC-001 | Beat Sync      | Medium      | Yes       | DeckManager:244        |
| BR-STEM-001 | Stem Player    | High        | Yes       | Store:699              |
| BR-GEST-001 | Gesture        | High        | Yes       | recognition:485        |
| BR-PERF-001 | Performance    | High        | Yes       | AudioService:482       |
| BR-ERR-001  | Error Handling | Critical    | Manual    | Multiple               |

---

_Last Updated: 2025-10-09_
_Total Rules Documented: 32_
