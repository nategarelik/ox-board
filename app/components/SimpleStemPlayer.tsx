"use client";

import { useState, useRef } from "react";
import { usePlayer } from "../hooks/usePlayer";
import { useStemPlayback } from "../hooks/useStemPlayback";

export default function SimpleStemPlayer() {
  const [isInitialized, setIsInitialized] = useState(false);
  const { currentTrack, finalizeUpload } = usePlayer();
  const { initialize, play, pause, stop, ready, state } =
    useStemPlayback(currentTrack);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create a proper track object from the uploaded file
      const track = {
        id: `uploaded_${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        artist: "Uploaded Track",
        durationSeconds: 180, // Default 3 minutes
        bpm: 120,
        musicalKey: "C",
        stems: [
          {
            id: "main",
            label: "Main",
            color: "#3b82f6",
            volume: 0.8,
            muted: false,
            solo: false,
            waveform: [],
            latencyMs: 0,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description: `Uploaded track: ${file.name}`,
      };
      finalizeUpload(track);
    }
  };

  const handleInitialize = async () => {
    try {
      await initialize();
      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize audio:", error);
    }
  };

  const handlePlay = async () => {
    if (!ready && !isInitialized) {
      await handleInitialize();
    }
    await play();
  };

  const handlePause = async () => {
    await pause();
  };

  const handleStop = async () => {
    await stop();
  };

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">
          🎵 OX Board Stem Player
        </h1>
        <p className="text-xl text-gray-400 mb-2">
          Control music with your hands using gesture recognition
        </p>
        <p className="text-sm text-gray-500">
          Upload an audio file and use hand gestures to control playback
        </p>
      </div>

      {/* Status Display */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-700">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-semibold text-white">Status:</span>
          <span
            className={`text-sm px-2 py-1 rounded ${
              state === "running"
                ? "bg-green-500/20 text-green-400"
                : state === "suspended"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-blue-500/20 text-blue-400"
            }`}
          >
            {state === "running"
              ? "🎵 Playing"
              : state === "suspended"
                ? "⏸️ Paused"
                : "⏹️ Stopped"}
          </span>
        </div>
        {currentTrack && (
          <div className="text-sm text-gray-300">
            Now playing:{" "}
            <span className="text-white font-medium">{currentTrack.title}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800/50 rounded-lg p-6 mb-6 border border-gray-700">
        <div className="flex flex-col items-center gap-6">
          {/* Playback Controls */}
          <div className="flex gap-4">
            <button
              onClick={handlePlay}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors"
            >
              ▶️ Play
            </button>
            <button
              onClick={handlePause}
              className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold rounded-lg transition-colors"
            >
              ⏸️ Pause
            </button>
            <button
              onClick={handleStop}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors"
            >
              ⏹️ Stop
            </button>
          </div>

          {/* File Upload */}
          <div className="flex flex-col items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              📁 Upload Audio File
            </button>
            <p className="text-xs text-gray-400">
              Supported formats: MP3, WAV, OGG, M4A, WebM
            </p>
          </div>
        </div>
      </div>

      {/* Gesture Instructions */}
      <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-lg p-6 border border-purple-500/30">
        <h3 className="text-xl font-bold text-white mb-4 text-center">
          🎭 Gesture Controls
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="bg-black/30 rounded-lg p-4">
            <div className="text-purple-400 font-semibold mb-2">
              ✋ Open Hand
            </div>
            <div className="text-gray-300">Play/Pause</div>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <div className="text-purple-400 font-semibold mb-2">
              ✊ Closed Fist
            </div>
            <div className="text-gray-300">Stop</div>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <div className="text-purple-400 font-semibold mb-2">👌 Pinch</div>
            <div className="text-gray-300">Volume Control</div>
          </div>
          <div className="bg-black/30 rounded-lg p-4">
            <div className="text-purple-400 font-semibold mb-2">👆 Point</div>
            <div className="text-gray-300">Navigate</div>
          </div>
        </div>
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Make sure to allow camera access when prompted for gesture control
          </p>
        </div>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-gray-800/30 rounded-lg p-4 border border-gray-700">
        <h4 className="text-lg font-semibold text-white mb-2">💡 Tips</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Start with the demo track if no file is uploaded</li>
          <li>
            • Keep your hand visible to the camera for gesture recognition
          </li>
          <li>• Make clear, deliberate gestures for better recognition</li>
          <li>
            • Use the &quot;Simple Mode&quot; for the best first-time experience
          </li>
        </ul>
      </div>
    </div>
  );
}
