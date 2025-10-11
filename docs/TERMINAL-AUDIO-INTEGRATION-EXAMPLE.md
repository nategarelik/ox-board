# Terminal UI Audio Integration Example

This document shows how to integrate the `useDeckManager` hook with `TerminalStudio.tsx`.

## Complete Integration Example

```tsx
"use client";

import React from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Sliders,
  Disc,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/terminal/TerminalCard";
import { useDeckManager } from "@/hooks/useDeckManager";

export function TerminalStudio() {
  const {
    // State
    deckA,
    deckB,
    crossfader,
    master,
    audioInit,

    // Controls
    initialize,
    playDeck,
    pauseDeck,
    togglePlayDeck,
    setDeckVolume,
    setCrossfader,
    setMasterVolume,
  } = useDeckManager();

  const stems = ["drums", "bass", "vocals", "other"] as const;

  // ============================================================================
  // AUDIO INITIALIZATION UI
  // ============================================================================

  if (!audioInit.isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="text-center space-y-6 p-8 border-2 border-green-500 bg-black/80">
          <div className="text-green-400 font-mono text-2xl font-bold tracking-wider">
            AUDIO_SYSTEM_INITIALIZATION
          </div>

          {audioInit.isInitializing ? (
            <div className="text-green-600 font-mono animate-pulse">
              <div>INITIALIZING...</div>
              <div className="text-xs mt-2">
                Loading AudioService and DeckManager
              </div>
            </div>
          ) : (
            <>
              <div className="text-green-600 font-mono text-sm">
                {audioInit.requiresUserGesture
                  ? "User interaction required to start audio"
                  : "Click to initialize audio system"}
              </div>

              {audioInit.error && (
                <div className="text-red-500 font-mono text-xs border border-red-500 p-3 bg-red-500/10">
                  ERROR: {audioInit.error.message}
                </div>
              )}

              <button
                onClick={initialize}
                disabled={audioInit.isInitializing}
                className="border-2 border-green-500 bg-green-500/20 hover:bg-green-500/30
                           px-8 py-4 text-green-400 font-mono font-bold text-xl tracking-wider
                           transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                INITIALIZE_AUDIO_SYSTEM
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // MAIN DJ INTERFACE (AFTER INITIALIZATION)
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-2 border-green-500/50 bg-black/60 p-4">
        <h1 className="text-2xl font-bold text-green-400 tracking-wider font-mono">
          DJ_STUDIO
        </h1>
        <p className="text-green-600 text-sm mt-1 font-mono">
          GESTURE-CONTROLLED MIXING // STEM SEPARATION ENGINE
        </p>
        <div className="text-green-700 text-xs mt-2 font-mono">
          STATUS: {audioInit.isReady ? "✅ READY" : "⏳ INITIALIZING"}
        </div>
      </div>

      {/* Deck Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deck A */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-green-900/30 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Disc className="w-5 h-5" />
              DECK_A
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Track Info */}
            <div className="border border-green-700/50 bg-black/40 p-3 font-mono text-sm">
              <div className="text-green-400 font-bold">
                {deckA.track
                  ? `Track: ${deckA.track.title}`
                  : "Track: [NO TRACK LOADED]"}
              </div>
              <div className="text-green-600 text-xs mt-1">
                {deckA.track ? (
                  <>
                    BPM: {deckA.track.bpm || "---"} | KEY:{" "}
                    {deckA.track.key || "---"} | STATUS:{" "}
                    {deckA.isPlaying
                      ? "PLAYING"
                      : deckA.isPaused
                        ? "PAUSED"
                        : "STOPPED"}
                  </>
                ) : (
                  "BPM: --- | KEY: --- | STATUS: NO_TRACK"
                )}
              </div>
            </div>

            {/* Transport Controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                className="border-2 border-green-700 hover:border-green-500 bg-black/60 p-3
                           text-green-400 hover:text-green-300 transition-all"
                disabled={!deckA.hasTrack}
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={() => togglePlayDeck("A")}
                disabled={!deckA.hasTrack}
                className="border-2 border-green-500 bg-green-500/20 hover:bg-green-500/30 p-4
                           text-green-400 hover:text-green-300 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deckA.isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>

              <button
                className="border-2 border-green-700 hover:border-green-500 bg-black/60 p-3
                           text-green-400 hover:text-green-300 transition-all"
                disabled={!deckA.hasTrack}
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-green-600 text-xs font-mono">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-4 h-4" />
                  VOLUME
                </span>
                <span className="text-green-400">
                  {Math.round(deckA.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={deckA.volume * 100}
                onChange={(e) =>
                  setDeckVolume("A", parseInt(e.target.value) / 100)
                }
                className="w-full h-2 bg-black border-2 border-green-700 appearance-none
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-green-400
                           [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-green-500"
              />
            </div>

            {/* Stem Controls (Placeholder - Not yet implemented) */}
            <div className="space-y-3 opacity-50">
              <div className="flex items-center gap-2 text-green-600 text-xs font-mono">
                <Sliders className="w-4 h-4" />
                STEM_CONTROLS [COMING SOON]
              </div>
              {stems.map((stem) => (
                <div key={stem} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-green-600">
                    <span className="uppercase">{stem}</span>
                    <span className="text-green-400">100%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="100"
                    disabled
                    className="w-full h-1 bg-black border border-green-700 appearance-none
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                               [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-green-400
                               [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-green-500"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Deck B (same structure as Deck A) */}
        <Card>
          <CardHeader className="bg-gradient-to-r from-blue-900/30 to-transparent">
            <CardTitle className="flex items-center gap-2">
              <Disc className="w-5 h-5" />
              DECK_B
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Track Info */}
            <div className="border border-green-700/50 bg-black/40 p-3 font-mono text-sm">
              <div className="text-green-400 font-bold">
                {deckB.track
                  ? `Track: ${deckB.track.title}`
                  : "Track: [NO TRACK LOADED]"}
              </div>
              <div className="text-green-600 text-xs mt-1">
                {deckB.track ? (
                  <>
                    BPM: {deckB.track.bpm || "---"} | KEY:{" "}
                    {deckB.track.key || "---"} | STATUS:{" "}
                    {deckB.isPlaying
                      ? "PLAYING"
                      : deckB.isPaused
                        ? "PAUSED"
                        : "STOPPED"}
                  </>
                ) : (
                  "BPM: --- | KEY: --- | STATUS: NO_TRACK"
                )}
              </div>
            </div>

            {/* Transport Controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                className="border-2 border-green-700 hover:border-green-500 bg-black/60 p-3
                           text-green-400 hover:text-green-300 transition-all"
                disabled={!deckB.hasTrack}
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={() => togglePlayDeck("B")}
                disabled={!deckB.hasTrack}
                className="border-2 border-green-500 bg-green-500/20 hover:bg-green-500/30 p-4
                           text-green-400 hover:text-green-300 transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deckB.isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>

              <button
                className="border-2 border-green-700 hover:border-green-500 bg-black/60 p-3
                           text-green-400 hover:text-green-300 transition-all"
                disabled={!deckB.hasTrack}
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Volume Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-green-600 text-xs font-mono">
                <span className="flex items-center gap-1">
                  <Volume2 className="w-4 h-4" />
                  VOLUME
                </span>
                <span className="text-green-400">
                  {Math.round(deckB.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={deckB.volume * 100}
                onChange={(e) =>
                  setDeckVolume("B", parseInt(e.target.value) / 100)
                }
                className="w-full h-2 bg-black border-2 border-green-700 appearance-none
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                           [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-green-400
                           [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-green-500"
              />
            </div>

            {/* Stem Controls (Placeholder) */}
            <div className="space-y-3 opacity-50">
              <div className="flex items-center gap-2 text-green-600 text-xs font-mono">
                <Sliders className="w-4 h-4" />
                STEM_CONTROLS [COMING SOON]
              </div>
              {stems.map((stem) => (
                <div key={stem} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono text-green-600">
                    <span className="uppercase">{stem}</span>
                    <span className="text-green-400">100%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    defaultValue="100"
                    disabled
                    className="w-full h-1 bg-black border border-green-700 appearance-none
                               [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3
                               [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-green-400
                               [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-green-500"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Crossfader */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-green-600 text-sm font-mono">
              <span>DECK_A</span>
              <span className="text-green-400 text-lg font-bold">
                CROSSFADER
              </span>
              <span>DECK_B</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="0"
                max="100"
                value={crossfader.position * 100}
                onChange={(e) => setCrossfader(parseInt(e.target.value) / 100)}
                className="w-full h-4 bg-black border-2 border-green-500 appearance-none
                           [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8
                           [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-green-400
                           [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-green-500
                           [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-green-500/50"
              />
              <div className="flex justify-between mt-2 text-green-600 text-xs font-mono">
                <span>← 100%</span>
                <span className="text-green-400">
                  {Math.round(crossfader.position * 100)}%
                </span>
                <span>100% →</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Master Volume */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-green-600 text-sm font-mono">
              <span className="text-green-400 text-lg font-bold">
                MASTER_VOLUME
              </span>
              <span className="text-green-400">
                {Math.round(master.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={master.volume * 100}
              onChange={(e) => setMasterVolume(parseInt(e.target.value) / 100)}
              className="w-full h-4 bg-black border-2 border-green-500 appearance-none
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6
                         [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-green-400
                         [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-green-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Gesture Status */}
      <Card>
        <CardHeader>
          <CardTitle>GESTURE_RECOGNITION_STATUS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-green-600 font-mono text-sm">
              System ready for hand tracking input
            </div>
            <button
              className="border-2 border-green-500 bg-green-500/20 hover:bg-green-500/30
                         px-6 py-2 text-green-400 font-mono font-bold tracking-wider
                         transition-all duration-200"
            >
              ENABLE_CAMERA
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Key Changes from Original

### 1. Import useDeckManager Hook

```tsx
import { useDeckManager } from "@/hooks/useDeckManager";
```

### 2. Destructure Hook Return

```tsx
const {
  deckA,
  deckB,
  crossfader,
  master,
  audioInit,
  initialize,
  playDeck,
  pauseDeck,
  togglePlayDeck,
  setDeckVolume,
  setCrossfader,
  setMasterVolume,
} = useDeckManager();
```

### 3. Initialization UI

Show button if audio not ready:

```tsx
if (!audioInit.isReady) {
  return <button onClick={initialize}>INITIALIZE_AUDIO_SYSTEM</button>;
}
```

### 4. Wire Controls to Real Audio

**Play/Pause:**

```tsx
<button onClick={() => togglePlayDeck("A")}>
  {deckA.isPlaying ? <Pause /> : <Play />}
</button>
```

**Volume:**

```tsx
<input
  type="range"
  value={deckA.volume * 100}
  onChange={(e) => setDeckVolume("A", parseInt(e.target.value) / 100)}
/>
```

**Crossfader:**

```tsx
<input
  type="range"
  value={crossfader.position * 100}
  onChange={(e) => setCrossfader(parseInt(e.target.value) / 100)}
/>
```

### 5. Display Real State

**Track info:**

```tsx
{
  deckA.track ? `Track: ${deckA.track.title}` : "NO TRACK LOADED";
}
```

**Playback status:**

```tsx
STATUS: {
  deckA.isPlaying ? "PLAYING" : deckA.isPaused ? "PAUSED" : "STOPPED";
}
```

## Testing Checklist

- [ ] Click "INITIALIZE_AUDIO_SYSTEM" button
- [ ] AudioService initializes successfully
- [ ] DeckManager initializes successfully
- [ ] Play/pause buttons trigger real audio (once tracks loaded)
- [ ] Volume sliders control actual audio volume
- [ ] Crossfader mixes between decks
- [ ] Master volume controls overall output
- [ ] UI reflects real deck state (playing, volume, etc.)
- [ ] Error handling shows user-friendly messages

## Next Steps

1. **Track Loading**: Add file upload to load actual audio files
2. **Stem Controls**: Extend Deck class to support per-stem volume/mute
3. **Waveform Visualization**: Add real-time waveform display
4. **Performance Monitoring**: Display audio latency and CPU usage
5. **Gesture Integration**: Connect gesture recognition to deck controls

## File Locations

- **Hook**: `app/hooks/useDeckManager.ts`
- **Types**: `app/types/deckManager.ts`
- **Component**: `app/components/terminal/TerminalStudio.tsx`
- **Services**: `app/services/DeckManager.ts`, `app/services/AudioService.ts`
