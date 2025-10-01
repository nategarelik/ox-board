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

export function TerminalStudio() {
  const [deckA, setDeckA] = React.useState({
    playing: false,
    volume: 75,
    position: 0,
  });
  const [deckB, setDeckB] = React.useState({
    playing: false,
    volume: 75,
    position: 0,
  });
  const [crossfader, setCrossfader] = React.useState(50);

  const stems = ["drums", "bass", "vocals", "other"] as const;

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
                Track: sample_track_01.mp3
              </div>
              <div className="text-green-600 text-xs mt-1">
                BPM: 128 | KEY: 8A | TIME: 00:00 / 03:45
              </div>
            </div>

            {/* Transport Controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                className="border-2 border-green-700 hover:border-green-500 bg-black/60 p-3
                               text-green-400 hover:text-green-300 transition-all"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDeckA({ ...deckA, playing: !deckA.playing })}
                className="border-2 border-green-500 bg-green-500/20 hover:bg-green-500/30 p-4
                         text-green-400 hover:text-green-300 transition-all"
              >
                {deckA.playing ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>
              <button
                className="border-2 border-green-700 hover:border-green-500 bg-black/60 p-3
                               text-green-400 hover:text-green-300 transition-all"
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
                <span className="text-green-400">{deckA.volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={deckA.volume}
                onChange={(e) =>
                  setDeckA({ ...deckA, volume: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-black border-2 border-green-700 appearance-none
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-green-400
                         [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-green-500"
              />
            </div>

            {/* Stem Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 text-xs font-mono">
                <Sliders className="w-4 h-4" />
                STEM_CONTROLS
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

        {/* Deck B */}
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
                Track: [NO TRACK LOADED]
              </div>
              <div className="text-green-600 text-xs mt-1">
                BPM: --- | KEY: --- | TIME: --:-- / --:--
              </div>
            </div>

            {/* Transport Controls */}
            <div className="flex items-center justify-center gap-2">
              <button
                className="border-2 border-green-700 hover:border-green-500 bg-black/60 p-3
                               text-green-400 hover:text-green-300 transition-all"
              >
                <SkipBack className="w-5 h-5" />
              </button>
              <button
                onClick={() => setDeckB({ ...deckB, playing: !deckB.playing })}
                className="border-2 border-green-500 bg-green-500/20 hover:bg-green-500/30 p-4
                         text-green-400 hover:text-green-300 transition-all"
              >
                {deckB.playing ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6" />
                )}
              </button>
              <button
                className="border-2 border-green-700 hover:border-green-500 bg-black/60 p-3
                               text-green-400 hover:text-green-300 transition-all"
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
                <span className="text-green-400">{deckB.volume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={deckB.volume}
                onChange={(e) =>
                  setDeckB({ ...deckB, volume: parseInt(e.target.value) })
                }
                className="w-full h-2 bg-black border-2 border-green-700 appearance-none
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                         [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-green-400
                         [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-green-500"
              />
            </div>

            {/* Stem Controls */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-600 text-xs font-mono">
                <Sliders className="w-4 h-4" />
                STEM_CONTROLS
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
                value={crossfader}
                onChange={(e) => setCrossfader(parseInt(e.target.value))}
                className="w-full h-4 bg-black border-2 border-green-500 appearance-none
                         [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-8
                         [&::-webkit-slider-thumb]:h-8 [&::-webkit-slider-thumb]:bg-green-400
                         [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-green-500
                         [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-green-500/50"
              />
              <div className="flex justify-between mt-2 text-green-600 text-xs font-mono">
                <span>← 100%</span>
                <span className="text-green-400">{crossfader}%</span>
                <span>100% →</span>
              </div>
            </div>
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
