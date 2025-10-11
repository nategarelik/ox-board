# useDeckManager Hook - Quick Reference

**File:** `app/hooks/useDeckManager.ts`

## Basic Usage

```tsx
import { useDeckManager } from "@/hooks/useDeckManager";

function DJComponent() {
  const {
    // State
    deckA,
    deckB,
    crossfader,
    master,
    audioInit,
    performance,
    syncState,

    // Controls
    initialize,
    playDeck,
    pauseDeck,
    stopDeck,
    togglePlayDeck,
    setDeckVolume,
    setDeckPitch,
    setCrossfader,
    setMasterVolume,
    loadTrack,
    syncDecks,
    unsyncDecks,
  } = useDeckManager();

  // Must initialize before use
  if (!audioInit.isReady) {
    return <button onClick={initialize}>Start Audio</button>;
  }

  return (
    <div>
      <button onClick={() => playDeck("A")}>Play A</button>
      <input
        type="range"
        value={deckA.volume * 100}
        onChange={(e) => setDeckVolume("A", e.target.value / 100)}
      />
    </div>
  );
}
```

## State Properties

### `deckA` / `deckB` (ReactDeckState)

```typescript
{
  isPlaying: boolean;      // Currently playing
  isPaused: boolean;       // Currently paused
  isLoading: boolean;      // Track loading
  hasTrack: boolean;       // Track loaded
  position: number;        // 0-1
  volume: number;          // 0-1
  pitch: number;           // -50 to +50
  track: {
    id: string;
    title: string;
    artist: string;
    duration: number;
    bpm?: number;
    key?: string;
  } | null;
}
```

### `crossfader` (CrossfaderState)

```typescript
{
  position: number; // 0-1 (0 = full A, 1 = full B)
  curve: "linear" | "logarithmic" | "exponential" | "scratch" | "smooth";
}
```

### `master` (MasterState)

```typescript
{
  volume: number; // 0-1
  limiter: boolean; // Limiter enabled
  recording: boolean; // Recording active
}
```

### `audioInit` (AudioInitializationState)

```typescript
{
  isReady: boolean; // Audio system ready
  isInitializing: boolean; // Initialization in progress
  requiresUserGesture: boolean; // User click needed
  error: Error | null; // Initialization error
}
```

### `performance` (PerformanceMetrics)

```typescript
{
  audioLatency: number; // ms
  renderTime: number; // ms
  dropouts: number; // Count
  cpuUsage: number; // 0-1
  memoryUsage: number; // bytes
}
```

### `syncState`

```typescript
{
  isActive: boolean; // Sync enabled
  master: "A" | "B" | null; // Master deck
}
```

## Control Methods

### Initialization

```typescript
// Initialize audio system (MUST be called from user gesture)
await initialize(): Promise<void>

// Cleanup and dispose
dispose(): void
```

### Deck Controls

```typescript
// Playback
playDeck(deck: "A" | "B"): void
pauseDeck(deck: "A" | "B"): void
stopDeck(deck: "A" | "B"): void
togglePlayDeck(deck: "A" | "B"): void

// Volume (0-1)
setDeckVolume(deck: "A" | "B", volume: number): void

// Pitch (-50 to +50 percent)
setDeckPitch(deck: "A" | "B", pitch: number): void

// Seek (0-1 position)
seekDeck(deck: "A" | "B", position: number): void

// Load track
loadTrack(deck: "A" | "B", track: {
  id: string;
  url: string;
  title: string;
  artist: string;
  duration: number;
  bpm?: number;
  key?: string;
}): Promise<void>
```

### Mixer Controls

```typescript
// Crossfader (0-1)
setCrossfader(position: number): void

// Crossfader curve
setCrossfaderCurve(curve: "linear" | "logarithmic" | "exponential" | "scratch" | "smooth"): void

// Master volume (0-1)
setMasterVolume(volume: number): void

// Limiter
setLimiter(enabled: boolean): void

// Sync
syncDecks(master: "A" | "B"): void
unsyncDecks(): void
```

## Common Patterns

### Initialization with Error Handling

```tsx
const { audioInit, initialize } = useDeckManager();

if (!audioInit.isReady) {
  return (
    <div>
      {audioInit.isInitializing ? (
        <div>Initializing...</div>
      ) : (
        <>
          {audioInit.error && <div>Error: {audioInit.error.message}</div>}
          <button onClick={initialize}>
            {audioInit.requiresUserGesture
              ? "Click to Enable Audio"
              : "Initialize Audio"}
          </button>
        </>
      )}
    </div>
  );
}
```

### Play/Pause Toggle

```tsx
const { deckA, togglePlayDeck } = useDeckManager();

<button onClick={() => togglePlayDeck("A")} disabled={!deckA.hasTrack}>
  {deckA.isPlaying ? "Pause" : "Play"}
</button>;
```

### Volume Slider

```tsx
const { deckA, setDeckVolume } = useDeckManager();

<input
  type="range"
  min="0"
  max="100"
  value={deckA.volume * 100}
  onChange={(e) => setDeckVolume("A", parseInt(e.target.value) / 100)}
/>
<span>{Math.round(deckA.volume * 100)}%</span>
```

### Crossfader

```tsx
const { crossfader, setCrossfader } = useDeckManager();

<input
  type="range"
  min="0"
  max="100"
  value={crossfader.position * 100}
  onChange={(e) => setCrossfader(parseInt(e.target.value) / 100)}
/>;
```

### Load Track from File

```tsx
const { loadTrack } = useDeckManager();

const handleFileUpload = async (file: File) => {
  try {
    // Create object URL for audio file
    const url = URL.createObjectURL(file);

    await loadTrack("A", {
      id: crypto.randomUUID(),
      url,
      title: file.name,
      artist: "Unknown",
      duration: 0, // Will be extracted from audio
    });

    console.log("Track loaded successfully");
  } catch (error) {
    console.error("Failed to load track:", error);
  }
};

<input
  type="file"
  accept="audio/*"
  onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
/>;
```

### Track Info Display

```tsx
const { deckA } = useDeckManager();

<div>
  {deckA.track ? (
    <>
      <div>Title: {deckA.track.title}</div>
      <div>Artist: {deckA.track.artist}</div>
      <div>BPM: {deckA.track.bpm || "---"}</div>
      <div>Key: {deckA.track.key || "---"}</div>
      <div>Status: {deckA.isPlaying ? "PLAYING" : "STOPPED"}</div>
    </>
  ) : (
    <div>No track loaded</div>
  )}
</div>;
```

### Performance Monitoring

```tsx
const { performance } = useDeckManager();

<div>
  <div>Latency: {performance.audioLatency.toFixed(2)}ms</div>
  <div>CPU: {(performance.cpuUsage * 100).toFixed(1)}%</div>
  <div>Dropouts: {performance.dropouts}</div>
</div>;
```

### Sync Decks

```tsx
const { syncState, syncDecks, unsyncDecks } = useDeckManager();

<div>
  {syncState.isActive ? (
    <>
      <div>Synced to Deck {syncState.master}</div>
      <button onClick={unsyncDecks}>Unsync</button>
    </>
  ) : (
    <div>
      <button onClick={() => syncDecks("A")}>Sync to A</button>
      <button onClick={() => syncDecks("B")}>Sync to B</button>
    </div>
  )}
</div>;
```

## Important Notes

### ⚠️ User Gesture Required

Audio initialization **MUST** be triggered by a user gesture (click, touch, etc.) due to browser autoplay policies.

```tsx
// ❌ BAD: Initialize on mount
useEffect(() => {
  initialize(); // Will fail
}, []);

// ✅ GOOD: Initialize on user click
<button onClick={initialize}>Start Audio</button>;
```

### ⚠️ Volume Range

All volume values are **0-1**. Convert to/from percentage for UI:

```tsx
// Convert to percentage for display
const percentage = deckA.volume * 100;

// Convert from percentage for control
setDeckVolume("A", sliderValue / 100);
```

### ⚠️ Crossfader Position

Crossfader position is **0-1** where:

- `0` = Full Deck A
- `0.5` = Center (both decks equal)
- `1` = Full Deck B

### ⚠️ Track Loading

`loadTrack()` is async and may throw errors. Always use try/catch:

```tsx
try {
  await loadTrack("A", track);
} catch (error) {
  console.error("Failed to load:", error);
  alert("Could not load track");
}
```

### ⚠️ Singleton Pattern

AudioService and DeckManager are singletons. The hook manages their lifecycle automatically. Don't create multiple instances.

## TypeScript Support

Full TypeScript support with exported types:

```typescript
import type {
  UseDeckManagerReturn,
  ReactDeckState,
  MasterState,
  CrossfaderState,
  AudioInitializationState,
} from "@/types/deckManager";
```

## Error Handling

```tsx
const { audioInit, initialize } = useDeckManager();

const handleInitialize = async () => {
  try {
    await initialize();
  } catch (error) {
    if (error.message.includes("User gesture")) {
      alert("Please click the button to enable audio");
    } else {
      console.error("Failed to initialize:", error);
      alert("Audio initialization failed. Please refresh the page.");
    }
  }
};
```

## Performance Tips

1. **Use `useCallback`** for event handlers to prevent re-renders
2. **Check `hasTrack`** before enabling controls
3. **Monitor `performance`** metrics to detect issues
4. **Batch state updates** when possible (React does this automatically)

## Browser Compatibility

- ✅ Chrome 66+
- ✅ Firefox 76+
- ✅ Safari 14.1+
- ✅ Edge 79+

Requires:

- Web Audio API
- AudioContext
- Tone.js
- EventEmitter

## Related Files

- **Hook:** `app/hooks/useDeckManager.ts`
- **Types:** `app/types/deckManager.ts`
- **Services:** `app/services/DeckManager.ts`, `app/services/AudioService.ts`
- **Example:** `docs/TERMINAL-AUDIO-INTEGRATION-EXAMPLE.md`
