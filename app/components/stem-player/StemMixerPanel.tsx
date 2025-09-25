"use client";

import clsx from "clsx";
import { useMemo } from "react";
import { PlaybackState, StemTrack } from "../../types/stem-player";

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
        <span className="rounded-full border border-white/20 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
          {statusLabel}
        </span>
      </div>

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
