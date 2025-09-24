"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Disc,
  Upload,
  Link,
  Loader,
} from "lucide-react";
import * as Tone from "tone";

interface ProfessionalDeckProps {
  deckId: number;
  deck: any;
  onPlay: () => void;
  onPause: () => void;
  onCue: () => void;
  orientation?: "vertical" | "horizontal";
}

export default function ProfessionalDeck({
  deckId,
  deck,
  onPlay,
  onPause,
  onCue,
  orientation = "vertical",
}: ProfessionalDeckProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [pitch, setPitch] = useState(0);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const vinylRef = useRef<HTMLDivElement>(null);

  // Vinyl rotation animation
  useEffect(() => {
    if (vinylRef.current && deck?.isPlaying) {
      vinylRef.current.style.animation = "rotate-vinyl 2s linear infinite";
    } else if (vinylRef.current) {
      vinylRef.current.style.animationPlayState = "paused";
    }
  }, [deck?.isPlaying]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const url = URL.createObjectURL(file);
      // Load track logic here
      setTimeout(() => setIsLoading(false), 1000);
    } catch (error) {
      console.error("Failed to load file:", error);
      setIsLoading(false);
    }
  };

  const handleUrlLoad = async () => {
    if (!urlInput.trim()) return;
    setIsLoading(true);
    try {
      // Load URL logic here
      setShowUrlInput(false);
      setUrlInput("");
      setTimeout(() => setIsLoading(false), 1000);
    } catch (error) {
      console.error("Failed to load URL:", error);
      setIsLoading(false);
    }
  };

  const hotCues = [1, 2, 3, 4, 5, 6, 7, 8];
  const loopSizes = [
    "1/32",
    "1/16",
    "1/8",
    "1/4",
    "1/2",
    "1",
    "2",
    "4",
    "8",
    "16",
    "32",
  ];

  const getDeckColor = () => (deckId === 0 ? "cyan" : "magenta");
  const color = getDeckColor();

  return (
    <div className="glass-dark rounded-xl p-6 h-full flex flex-col">
      {/* Deck Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className={`text-xl font-display font-bold text-${color}-400`}>
            DECK {deckId === 0 ? "A" : "B"}
          </div>
          {deck?.track && (
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-0.5 rounded bg-${color}-500/20 border border-${color}-500/40`}
              >
                <span className="text-xs text-gray-300 font-mono">
                  {deck.track.bpm || "---"} BPM
                </span>
              </span>
              <span
                className={`px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/40`}
              >
                <span className="text-xs text-gray-300 font-mono">
                  {deck.track.key || "--"}
                </span>
              </span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Load File"
          >
            <Upload className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setShowUrlInput(!showUrlInput)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Load URL"
          >
            <Link className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* URL Input */}
      {showUrlInput && (
        <div className="flex gap-2 mb-4">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter track URL..."
            className="flex-1 bg-black/50 border border-gray-700 rounded px-3 py-1 text-sm text-gray-300 focus:border-purple-500 outline-none"
          />
          <button
            onClick={handleUrlLoad}
            className="px-3 py-1 bg-purple-600 rounded text-sm hover:bg-purple-700 transition-colors"
          >
            Load
          </button>
        </div>
      )}

      {/* Vinyl Platter */}
      <div className="flex-1 flex items-center justify-center relative mb-6">
        <div className="relative w-56 h-56">
          {/* Outer Ring */}
          <div
            className={`absolute inset-0 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl border-2 border-${color}-500/30`}
          >
            {/* Inner Vinyl */}
            <div
              ref={vinylRef}
              className="absolute inset-4 rounded-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900"
              style={{
                boxShadow: `inset 0 0 40px rgba(0,0,0,0.8), 0 0 30px rgba(${color === "cyan" ? "0,255,255" : "255,0,255"},0.3)`,
              }}
            >
              {/* Grooves */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute rounded-full border border-gray-700/30"
                  style={{
                    top: `${10 + i * 10}%`,
                    left: `${10 + i * 10}%`,
                    right: `${10 + i * 10}%`,
                    bottom: `${10 + i * 10}%`,
                  }}
                />
              ))}

              {/* Center Label */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg">
                <div className="text-center">
                  <div className="text-xs font-bold text-white">OX</div>
                  <div className="text-[10px] text-gray-300">BOARD</div>
                </div>
              </div>

              {/* Position Marker */}
              <div
                className={`absolute top-4 left-1/2 -translate-x-1/2 w-1 h-8 bg-${color}-400 rounded-full shadow-lg`}
              />
            </div>
          </div>

          {/* Loading Overlay */}
          {isLoading && (
            <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
              <Loader className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          )}
        </div>

        {/* Track Info */}
        {deck?.track && (
          <div className="absolute bottom-0 left-0 right-0 text-center">
            <div className="text-sm font-medium text-gray-300 truncate px-4">
              {deck.track.title || "Unknown Track"}
            </div>
            <div className="text-xs text-gray-500 truncate px-4">
              {deck.track.artist || "Unknown Artist"}
            </div>
          </div>
        )}
      </div>

      {/* Transport Controls */}
      <div className="flex justify-center items-center gap-3 mb-4">
        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <SkipBack className="w-5 h-5 text-gray-400" />
        </button>

        <button
          onClick={() => (deck?.isPlaying ? onPause() : onPlay())}
          className={`p-4 rounded-full bg-gradient-to-br ${
            deck?.isPlaying
              ? `from-${color}-600 to-${color}-700 shadow-lg shadow-${color}-500/50`
              : "from-gray-700 to-gray-800"
          } hover:scale-105 transition-all`}
        >
          {deck?.isPlaying ? (
            <Pause className="w-6 h-6 text-white" />
          ) : (
            <Play className="w-6 h-6 text-white translate-x-0.5" />
          )}
        </button>

        <button
          onClick={onCue}
          className={`p-3 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 transition-all`}
        >
          <div className="text-xs font-bold text-orange-400">CUE</div>
        </button>

        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <SkipForward className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      {/* Pitch Slider */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-500">PITCH</span>
          <span className="text-xs font-mono text-gray-400">
            {pitch > 0 ? "+" : ""}
            {pitch.toFixed(1)}%
          </span>
        </div>
        <div className="relative h-2 bg-gray-800 rounded-full">
          <input
            type="range"
            min="-16"
            max="16"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
          <div
            className={`absolute top-0 left-0 h-full bg-gradient-to-r from-${color}-500 to-${color}-400 rounded-full transition-all`}
            style={{ width: `${((pitch + 16) / 32) * 100}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg"
            style={{ left: `calc(${((pitch + 16) / 32) * 100}% - 8px)` }}
          />
        </div>
      </div>

      {/* Hot Cues */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {hotCues.map((cue) => (
          <button
            key={cue}
            className={`p-2 rounded bg-${color}-600/20 hover:bg-${color}-600/30 border border-${color}-500/40 transition-all`}
          >
            <span className={`text-xs font-bold text-${color}-400`}>
              CUE {cue}
            </span>
          </button>
        ))}
      </div>

      {/* Loop Controls */}
      <div className="flex gap-2">
        <select className="flex-1 bg-black/50 border border-gray-700 rounded px-2 py-1 text-xs text-gray-300 focus:border-purple-500 outline-none">
          {loopSizes.map((size) => (
            <option key={size} value={size}>
              Loop {size}
            </option>
          ))}
        </select>
        <button className="px-3 py-1 rounded bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 transition-all">
          <span className="text-xs font-bold text-green-400">IN</span>
        </button>
        <button className="px-3 py-1 rounded bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 transition-all">
          <span className="text-xs font-bold text-red-400">OUT</span>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />
    </div>
  );
}
