"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Headphones,
  Settings,
  Sliders,
  Mic,
  Music,
  Radio,
  Zap,
  Eye,
  EyeOff,
  RotateCcw,
} from "lucide-react";
import { GestureData } from "../../hooks/useGestures";

interface Stem {
  id: string;
  name: string;
  type: "vocals" | "drums" | "bass" | "melody" | "other";
  volume: number;
  muted: boolean;
  solo: boolean;
  pan: number;
  eq: {
    low: number;
    mid: number;
    high: number;
  };
  effects: {
    reverb: number;
    delay: number;
    distortion: number;
  };
  color: string;
  waveform?: number[];
}

interface AdvancedStemControlsProps {
  currentTrack?: {
    id: string;
    title: string;
    artist: string;
    stems: Stem[];
  } | null;
  playbackState: "playing" | "paused" | "stopped" | "loading";
  gestureData?: GestureData | null;
  gestureControls?: any[];
  onVolumeChange: (stemId: string, volume: number) => void;
  onMuteToggle: (stemId: string) => void;
  onSoloToggle: (stemId: string, solo: boolean) => void;
  onPanChange?: (stemId: string, pan: number) => void;
  onEQChange?: (
    stemId: string,
    band: "low" | "mid" | "high",
    value: number,
  ) => void;
  onEffectChange?: (
    stemId: string,
    effect: "reverb" | "delay" | "distortion",
    value: number,
  ) => void;
}

const STEM_ICONS = {
  vocals: Mic,
  drums: Radio,
  bass: Music,
  melody: Music,
  other: Sliders,
};

const STEM_COLORS = {
  vocals: "from-pink-500 to-rose-500",
  drums: "from-orange-500 to-red-500",
  bass: "from-purple-500 to-indigo-500",
  melody: "from-cyan-500 to-blue-500",
  other: "from-gray-500 to-slate-500",
};

export default function AdvancedStemControls({
  currentTrack,
  playbackState,
  gestureData,
  gestureControls = [],
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onPanChange,
  onEQChange,
  onEffectChange,
}: AdvancedStemControlsProps) {
  const [selectedStem, setSelectedStem] = useState<string | null>(null);
  const [showEQ, setShowEQ] = useState(false);
  const [showEffects, setShowEffects] = useState(false);
  const [gestureOverrides, setGestureOverrides] = useState<
    Map<string, boolean>
  >(new Map());

  // Generate mock stems if none provided
  const stems = useMemo(() => {
    if (currentTrack?.stems) return currentTrack.stems;

    return [
      {
        id: "vocals",
        name: "Vocals",
        type: "vocals" as const,
        volume: 0.8,
        muted: false,
        solo: false,
        pan: 0,
        eq: { low: 0, mid: 0, high: 0 },
        effects: { reverb: 0.3, delay: 0.1, distortion: 0 },
        color: "from-pink-500 to-rose-500",
        waveform: Array.from({ length: 50 }, () => Math.random()),
      },
      {
        id: "drums",
        name: "Drums",
        type: "drums" as const,
        volume: 0.9,
        muted: false,
        solo: false,
        pan: 0,
        eq: { low: 0.2, mid: -0.1, high: 0.1 },
        effects: { reverb: 0.2, delay: 0, distortion: 0 },
        color: "from-orange-500 to-red-500",
        waveform: Array.from({ length: 50 }, () => Math.random()),
      },
      {
        id: "bass",
        name: "Bass",
        type: "bass" as const,
        volume: 0.7,
        muted: false,
        solo: false,
        pan: 0,
        eq: { low: 0.3, mid: 0, high: -0.2 },
        effects: { reverb: 0.1, delay: 0, distortion: 0 },
        color: "from-purple-500 to-indigo-500",
        waveform: Array.from({ length: 50 }, () => Math.random()),
      },
      {
        id: "melody",
        name: "Melody",
        type: "melody" as const,
        volume: 0.85,
        muted: false,
        solo: false,
        pan: 0,
        eq: { low: -0.1, mid: 0.2, high: 0.1 },
        effects: { reverb: 0.4, delay: 0.2, distortion: 0 },
        color: "from-cyan-500 to-blue-500",
        waveform: Array.from({ length: 50 }, () => Math.random()),
      },
    ];
  }, [currentTrack]);

  // Handle gesture-based control overrides
  useEffect(() => {
    if (!gestureControls || gestureControls.length === 0) return;

    gestureControls.forEach((control) => {
      if (control.type === "stem_volume" && control.stemType) {
        setGestureOverrides(
          (prev) => new Map(prev.set(control.stemType, true)),
        );

        // Find the stem and update its volume
        const stem = stems.find((s) => s.id === control.stemType);
        if (stem) {
          onVolumeChange(stem.id, control.value);

          // Clear override after a delay
          setTimeout(() => {
            setGestureOverrides((prev) => {
              const next = new Map(prev);
              next.delete(control.stemType!);
              return next;
            });
          }, 1000);
        }
      }
    });
  }, [gestureControls, stems, onVolumeChange]);

  const handleVolumeChange = (stemId: string, volume: number) => {
    onVolumeChange(stemId, volume);
  };

  const handleMuteToggle = (stemId: string) => {
    onMuteToggle(stemId);
  };

  const handleSoloToggle = (stemId: string, solo: boolean) => {
    onSoloToggle(stemId, solo);
  };

  const handlePanChange = (stemId: string, pan: number) => {
    onPanChange?.(stemId, pan);
  };

  const handleEQChange = (
    stemId: string,
    band: "low" | "mid" | "high",
    value: number,
  ) => {
    onEQChange?.(stemId, band, value);
  };

  const handleEffectChange = (
    stemId: string,
    effect: "reverb" | "delay" | "distortion",
    value: number,
  ) => {
    onEffectChange?.(stemId, effect, value);
  };

  const resetStem = (stemId: string) => {
    const stem = stems.find((s) => s.id === stemId);
    if (stem) {
      onVolumeChange(stemId, 0.8);
      onPanChange?.(stemId, 0);
      onEQChange?.(stemId, "low", 0);
      onEQChange?.(stemId, "mid", 0);
      onEQChange?.(stemId, "high", 0);
    }
  };

  if (stems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-white/60">
        <div className="text-center">
          <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No stems available</p>
          <p className="text-sm">Upload audio to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white flex items-center">
          <Sliders className="w-5 h-5 mr-2 text-purple-400" />
          Stem Controls
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowEQ(!showEQ)}
            className={`p-2 rounded-lg transition-all ${
              showEQ
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
            title="EQ Controls"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowEffects(!showEffects)}
            className={`p-2 rounded-lg transition-all ${
              showEffects
                ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
            }`}
            title="Effects"
          >
            <Zap className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stem Controls */}
      <div className="space-y-4">
        {stems.map((stem, index) => {
          const IconComponent = STEM_ICONS[stem.type];
          const isGestureControlled = gestureOverrides.get(stem.id);
          const isSelected = selectedStem === stem.id;

          return (
            <motion.div
              key={stem.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-r ${stem.color} p-4 rounded-xl border border-white/10 ${
                isSelected ? "ring-2 ring-white/30" : ""
              } ${stem.muted ? "opacity-60" : ""}`}
            >
              {/* Stem Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-medium text-white">{stem.name}</h4>
                    <div className="flex items-center space-x-2">
                      {isGestureControlled && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                          <span className="text-xs text-cyan-400">Gesture</span>
                        </div>
                      )}
                      {stem.solo && (
                        <div className="flex items-center space-x-1">
                          <Headphones className="w-3 h-3 text-yellow-400" />
                          <span className="text-xs text-yellow-400">Solo</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleMuteToggle(stem.id)}
                    className={`p-1.5 rounded-lg transition-all ${
                      stem.muted
                        ? "bg-red-500/20 text-red-400"
                        : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                    }`}
                    title={stem.muted ? "Unmute" : "Mute"}
                  >
                    {stem.muted ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => handleSoloToggle(stem.id, !stem.solo)}
                    className={`p-1.5 rounded-lg transition-all ${
                      stem.solo
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                    }`}
                    title={stem.solo ? "Unsolo" : "Solo"}
                  >
                    <Headphones className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => resetStem(stem.id)}
                    className="p-1.5 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-lg transition-all"
                    title="Reset"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Volume Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">Volume</span>
                  <span className="text-sm text-white/60">
                    {Math.round(stem.volume * 100)}%
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={stem.volume}
                    onChange={(e) =>
                      handleVolumeChange(stem.id, parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                    style={{
                      background: `linear-gradient(to right, rgb(59, 130, 246) 0%, rgb(59, 130, 246) ${stem.volume * 100}%, rgba(255,255,255,0.2) ${stem.volume * 100}%, rgba(255,255,255,0.2) 100%)`,
                    }}
                  />
                  {isGestureControlled && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -top-1 w-4 h-4 bg-cyan-400 rounded-full -mt-1 border-2 border-white"
                      style={{ left: `${stem.volume * 100}%` }}
                    />
                  )}
                </div>
              </div>

              {/* Pan Control */}
              <div className="space-y-2 mt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">Pan</span>
                  <span className="text-sm text-white/60">
                    {stem.pan > 0 ? "R" : stem.pan < 0 ? "L" : "C"}
                  </span>
                </div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={stem.pan}
                  onChange={(e) =>
                    handlePanChange(stem.id, parseFloat(e.target.value))
                  }
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Waveform Visualization */}
              <div className="mt-3 h-8 bg-black/20 rounded-lg overflow-hidden">
                <div className="flex items-end h-full space-x-0.5 px-1">
                  {stem.waveform?.slice(0, 20).map((amplitude, i) => (
                    <motion.div
                      key={i}
                      initial={{ height: "10%" }}
                      animate={{ height: `${Math.max(10, amplitude * 100)}%` }}
                      transition={{ duration: 0.3, delay: i * 0.02 }}
                      className="bg-white/60 rounded-sm flex-1 min-w-[2px]"
                      style={{
                        backgroundColor:
                          playbackState === "playing"
                            ? "rgba(255,255,255,0.8)"
                            : "rgba(255,255,255,0.4)",
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Expanded Controls */}
              <AnimatePresence>
                {isSelected && (showEQ || showEffects) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-4 pt-4 border-t border-white/20"
                  >
                    {/* EQ Controls */}
                    {showEQ && (
                      <div className="space-y-3">
                        <h5 className="text-sm font-medium text-white/90">
                          EQ
                        </h5>
                        {(["low", "mid", "high"] as const).map((band) => (
                          <div key={band} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white/70 capitalize">
                                {band}
                              </span>
                              <span className="text-xs text-white/60">
                                {stem.eq[band] > 0 ? "+" : ""}
                                {Math.round(stem.eq[band] * 10)}dB
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-10"
                              max="10"
                              step="0.1"
                              value={stem.eq[band] * 10}
                              onChange={(e) =>
                                handleEQChange(
                                  stem.id,
                                  band,
                                  parseFloat(e.target.value) / 10,
                                )
                              }
                              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Effects Controls */}
                    {showEffects && (
                      <div className="space-y-3 mt-4">
                        <h5 className="text-sm font-medium text-white/90">
                          Effects
                        </h5>
                        {(["reverb", "delay", "distortion"] as const).map(
                          (effect) => (
                            <div key={effect} className="space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-white/70 capitalize">
                                  {effect}
                                </span>
                                <span className="text-xs text-white/60">
                                  {Math.round(stem.effects[effect] * 100)}%
                                </span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.01"
                                value={stem.effects[effect]}
                                onChange={(e) =>
                                  handleEffectChange(
                                    stem.id,
                                    effect,
                                    parseFloat(e.target.value),
                                  )
                                }
                                className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer"
                              />
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Master Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-slate-600 to-slate-700 p-4 rounded-xl border border-white/10"
      >
        <h4 className="font-medium text-white mb-3 flex items-center">
          <Settings className="w-4 h-4 mr-2 text-slate-300" />
          Master
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/70 block mb-1">
              Master Volume
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              defaultValue="0.8"
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs text-white/70 block mb-1">
              Crossfader
            </label>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              defaultValue="0"
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
