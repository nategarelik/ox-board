"use client";

import clsx from "clsx";
import { useMemo, useState, useEffect, useCallback } from "react";
import { PlaybackState, StemTrack } from "../../types/stem-player";
import { GestureFeedback } from "../GestureFeedback";
import { useGestures } from "../../hooks/useGestures";
import {
  GestureStemMapper,
  GestureDetectionResult,
} from "../../lib/gestures/gestureStemMapper";

interface StemMixerPanelProps {
  track: StemTrack | null;
  playbackState: PlaybackState;
  onVolumeChange: (stemId: string, value: number) => void;
  onMuteToggle: (stemId: string) => void;
  onSoloToggle: (stemId: string) => void;
  uploadProgress: number | null;
  isProcessing: boolean;
}

export default function StemMixerPanel({
  track,
  playbackState,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  uploadProgress,
  isProcessing,
}: StemMixerPanelProps) {
  const stems = track?.stems ?? [];

  // Gesture system integration
  const gestureMapper = useMemo(() => new GestureStemMapper(), []);
  const [gestureActive, setGestureActive] = useState(false);
  const [lastGestureUpdate, setLastGestureUpdate] = useState(0);

  const statusLabel = useMemo(() => {
    switch (playbackState) {
      case "playing":
        return "Live";
      case "paused":
        return "Paused";
      case "stopped":
        return "Ready";
      case "loading":
        return "Loading";
      default:
        return "Idle";
    }
  }, [playbackState]);

  // Gesture control handlers
  const handleGestureControl = useCallback(
    (event: any) => {
      const { mapping, value, gesture } = event;

      if (!track) return;

      switch (mapping.controlType) {
        case "volume":
        case "stem_volume":
          if (
            mapping.targetStem !== "master" &&
            mapping.targetStem !== "crossfader"
          ) {
            onVolumeChange(mapping.targetStem, value);
          }
          break;
        case "mute":
          if (
            mapping.targetStem !== "master" &&
            mapping.targetStem !== "crossfader"
          ) {
            onMuteToggle(mapping.targetStem);
          }
          break;
        case "solo":
          if (
            mapping.targetStem !== "master" &&
            mapping.targetStem !== "crossfader"
          ) {
            onSoloToggle(mapping.targetStem);
          }
          break;
        case "crossfade":
          // Handle crossfader control
          console.log("Crossfader gesture:", value);
          break;
      }

      setLastGestureUpdate(Date.now());
    },
    [track, onVolumeChange, onMuteToggle, onSoloToggle],
  );

  // Setup gesture event listeners
  useEffect(() => {
    gestureMapper.on("gestureControl", handleGestureControl);
    return () => {
      gestureMapper.off("gestureControl", handleGestureControl);
    };
  }, [
    gestureMapper,
    track,
    onVolumeChange,
    onMuteToggle,
    onSoloToggle,
    handleGestureControl,
  ]);

  return (
    <div className="flex h-full flex-col gap-6 rounded-3xl border border-white/10 bg-white/5 bg-gradient-to-b from-slate-900/80 to-black/90 p-8 text-white shadow-xl shadow-black/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold">
            {track?.title ?? "No track loaded"}
          </h2>
          <p className="text-sm text-white/60">
            {track
              ? `${track.artist} • ${track.bpm} BPM • ${track.musicalKey}`
              : "Upload or generate a track to begin"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
            {statusLabel}
          </span>
          <button
            onClick={() => setGestureActive(!gestureActive)}
            className={clsx(
              "rounded-full border px-4 py-1 text-xs uppercase tracking-[0.3em] transition",
              gestureActive
                ? "border-blue-500 bg-blue-500/20 text-blue-400"
                : "border-white/20 text-white/60 hover:text-white",
            )}
          >
            🎭 {gestureActive ? "Gestures ON" : "Gestures OFF"}
          </button>
        </div>
      </div>

      {/* Gesture Performance Monitor */}
      {gestureActive && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 border-t border-white/10 pt-6">
          <div className="lg:col-span-2">
            <GestureFeedback
              mapper={gestureMapper}
              isActive={gestureActive}
              channel={0}
              showConfidence={true}
              showLatency={true}
              compactMode={false}
              tutorialMode={false}
              showGestureTrails={true}
              showPredictions={true}
              enableHapticPreview={true}
            />
          </div>
          <div className="space-y-4">
            {/* Performance Metrics */}
            <div className="bg-black/40 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-white mb-3">
                🎯 Performance
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Latency:</span>
                  <span className="text-green-400">
                    {gestureMapper.getLatency().toFixed(1)}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Confidence:</span>
                  <span className="text-blue-400">
                    {(
                      gestureMapper.getFeedbackState().confidence * 100
                    ).toFixed(1)}
                    %
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Active Gestures:</span>
                  <span className="text-purple-400">
                    {gestureMapper.getFeedbackState().activeGestures.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Gesture Legend */}
            <div className="bg-black/40 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-white mb-3">
                🎭 Gesture Guide
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <span>✌️</span>
                  <span className="text-gray-300">Peace → Drums Volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🤘</span>
                  <span className="text-gray-300">Rock → Bass Volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>👌</span>
                  <span className="text-gray-300">OK → Melody Volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🤙</span>
                  <span className="text-gray-300">Call → Vocals Volume</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✊</span>
                  <span className="text-gray-300">Fist → Mute Stem</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>👍</span>
                  <span className="text-gray-300">Thumbs Up → Solo Stem</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-black/40 rounded-lg p-4 border border-white/10">
              <h4 className="text-sm font-medium text-white mb-3">
                ⚡ Quick Actions
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    gestureMapper.setHapticFeedbackEnabled(
                      !gestureMapper.isHapticFeedbackEnabled(),
                    );
                  }}
                  className="w-full text-left text-xs text-gray-300 hover:text-white transition-colors"
                >
                  {gestureMapper.isHapticFeedbackEnabled() ? "🔊" : "🔇"} Haptic
                  Feedback:{" "}
                  {gestureMapper.isHapticFeedbackEnabled() ? "ON" : "OFF"}
                </button>
                <button
                  onClick={() => {
                    // Reset all gesture controls
                    gestureMapper
                      .getFeedbackState()
                      .activeMappings.forEach((mapping) => {
                        if (
                          mapping.targetStem !== "master" &&
                          mapping.targetStem !== "crossfader"
                        ) {
                          onVolumeChange(mapping.targetStem, 0.8); // Reset to 80%
                        }
                      });
                  }}
                  className="w-full text-left text-xs text-gray-300 hover:text-white transition-colors"
                >
                  🔄 Reset All Volumes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stems.map((stem) => (
          <div
            key={stem.id}
            className={clsx(
              "relative flex flex-col gap-4 rounded-2xl border border-white/10 bg-black/60 p-4 transition",
              stem.solo ? "ring-2 ring-purple-500/60" : "hover:border-white/20",
            )}
          >
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium" style={{ color: stem.color }}>
                {stem.label}
              </span>
              <span className="text-white/50">
                {Math.round(stem.volume * 100)}%
              </span>
            </div>
            <div className="h-20 rounded-lg bg-slate-800/80">
              <div
                className="h-full rounded-lg bg-gradient-to-t from-white/70 to-white/10"
                style={{ height: `${Math.round(stem.volume * 100)}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={stem.volume}
              onChange={(event) =>
                onVolumeChange(stem.id, Number(event.target.value))
              }
              className="w-full accent-white"
            />
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => onMuteToggle(stem.id)}
                className={clsx(
                  "flex-1 rounded-full border px-3 py-2 font-medium transition",
                  stem.muted
                    ? "border-white/10 bg-white/10 text-white"
                    : "border-white/10 text-white/70 hover:text-white",
                )}
              >
                {stem.muted ? "Unmute" : "Mute"}
              </button>
              <button
                onClick={() => onSoloToggle(stem.id)}
                className={clsx(
                  "flex-1 rounded-full border px-3 py-2 font-medium transition",
                  stem.solo
                    ? "border-purple-400/60 bg-purple-500/20 text-white"
                    : "border-white/10 text-white/70 hover:text-white",
                )}
              >
                {stem.solo ? "Soloed" : "Solo"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {isProcessing && (
        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-4 text-sm text-white/70">
          Processing upload…{" "}
          {uploadProgress !== null
            ? `${Math.round(uploadProgress * 100)}%`
            : ""}
        </div>
      )}
    </div>
  );
}
