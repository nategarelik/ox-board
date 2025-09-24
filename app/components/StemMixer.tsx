"use client";

import React, { memo, useCallback, useRef, useEffect, useState } from "react";
import { StemType } from "../lib/audio/demucsProcessor";
import useEnhancedDJStore from "../stores/enhancedDjStoreWithGestures";
import { useOptimization, optimizationManager } from "../lib/optimization";

interface StemMixerProps {
  channel: number;
  className?: string;
  showAdvancedControls?: boolean;
  onStemMixChange?: (mix: number) => void;
  onSyncStatusChange?: (status: "synced" | "drifting" | "error") => void;
}

interface CrossfaderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

interface SyncIndicatorProps {
  status: "synced" | "drifting" | "error";
  latency?: number;
}

interface StemActivityIndicatorProps {
  stemType: StemType | "original";
  isActive: boolean;
  level: number;
  color: string;
}

const stemColors = {
  drums: "#ef4444", // red-500
  bass: "#3b82f6", // blue-500
  melody: "#10b981", // emerald-500
  vocals: "#eab308", // yellow-500
  original: "#6b7280", // gray-500
};

const stemLabels = {
  drums: "DRUMS",
  bass: "BASS",
  melody: "MELODY",
  vocals: "VOCALS",
  original: "ORIGINAL",
};

// High-performance crossfader with smooth curves
const Crossfader = memo<CrossfaderProps>(
  ({ value, onChange, disabled = false }) => {
    const sliderRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const lastChangeRef = useRef<number>(0);

    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        const now = performance.now();
        const newValue = parseFloat(event.target.value);

        // Throttle changes to 60fps max
        if (now - lastChangeRef.current >= 16.67) {
          onChange(newValue);
          lastChangeRef.current = now;
        }
      },
      [onChange],
    );

    const handleMouseDown = useCallback(() => {
      setIsDragging(true);
    }, []);

    const handleMouseUp = useCallback(() => {
      setIsDragging(false);
    }, []);

    useEffect(() => {
      if (isDragging) {
        document.addEventListener("mouseup", handleMouseUp);
        return () => document.removeEventListener("mouseup", handleMouseUp);
      }
    }, [isDragging, handleMouseUp]);

    const getGradient = useCallback((position: number) => {
      const originalIntensity = Math.round((1 - position) * 100);
      const stemsIntensity = Math.round(position * 100);

      return `linear-gradient(to right,
      ${stemColors.original} 0%,
      ${stemColors.original}${originalIntensity > 50 ? "ff" : "80"} ${originalIntensity}%,
      ${stemColors.melody}${stemsIntensity > 50 ? "ff" : "80"} ${stemsIntensity}%,
      ${stemColors.melody} 100%
    )`;
    }, []);

    return (
      <div className="flex flex-col items-center w-full">
        {/* Labels */}
        <div className="flex justify-between w-full mb-2 text-xs font-bold">
          <span
            className="transition-all duration-150"
            style={{
              color: value < 0.5 ? stemColors.original : "#6b7280",
              opacity: value < 0.5 ? 1 : 0.5,
            }}
          >
            ORIGINAL
          </span>
          <span
            className="transition-all duration-150"
            style={{
              color: value > 0.5 ? stemColors.melody : "#6b7280",
              opacity: value > 0.5 ? 1 : 0.5,
            }}
          >
            STEMS
          </span>
        </div>

        {/* Crossfader track */}
        <div className="relative w-full h-8 bg-gray-800 rounded-lg border border-gray-600 overflow-hidden">
          {/* Background gradient */}
          <div
            className="absolute inset-0 opacity-30 transition-all duration-150"
            style={{ background: getGradient(value) }}
          />

          {/* Slider */}
          <input
            ref={sliderRef}
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={value}
            onChange={handleChange}
            onMouseDown={handleMouseDown}
            disabled={disabled}
            className={`
            absolute inset-0 w-full h-full bg-transparent appearance-none cursor-pointer
            ${disabled ? "cursor-not-allowed opacity-50" : ""}
          `}
            style={{
              background: "transparent",
            }}
          />

          {/* Slider thumb visualization */}
          <div
            className={`
            absolute top-1/2 w-6 h-6 bg-white rounded-full border-2 border-gray-400
            transform -translate-y-1/2 -translate-x-1/2 shadow-lg
            transition-all duration-75
            ${isDragging ? "scale-110 shadow-xl" : "hover:scale-105"}
            ${disabled ? "opacity-50" : ""}
          `}
            style={{
              left: `${value * 100}%`,
              borderColor:
                value < 0.5 ? stemColors.original : stemColors.melody,
            }}
          >
            {/* Inner indicator */}
            <div
              className="absolute inset-1 rounded-full transition-all duration-150"
              style={{
                backgroundColor:
                  value < 0.5 ? stemColors.original : stemColors.melody,
                opacity: Math.abs(value - 0.5) * 2,
              }}
            />
          </div>

          {/* Center detent */}
          <div className="absolute top-1/2 left-1/2 w-0.5 h-4 bg-gray-500 transform -translate-x-1/2 -translate-y-1/2" />
        </div>

        {/* Value display */}
        <div className="text-xs text-gray-400 mt-2 font-mono">
          {value === 0.5
            ? "CENTER"
            : value < 0.5
              ? `ORG ${Math.round((0.5 - value) * 200)}%`
              : `STM ${Math.round((value - 0.5) * 200)}%`}
        </div>
      </div>
    );
  },
);

Crossfader.displayName = "Crossfader";

// Sync status indicator with real-time updates
const SyncIndicator = memo<SyncIndicatorProps>(({ status, latency = 0 }) => {
  const [blinkState, setBlinkState] = useState(false);

  useEffect(() => {
    let interval: number;

    if (status === "drifting") {
      interval = window.setInterval(() => {
        setBlinkState((prev) => !prev);
      }, 500);
    } else {
      setBlinkState(false);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status]);

  const getStatusColor = () => {
    switch (status) {
      case "synced":
        return "#10b981"; // emerald-500
      case "drifting":
        return "#eab308"; // yellow-500
      case "error":
        return "#ef4444"; // red-500
      default:
        return "#6b7280"; // gray-500
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "synced":
        return "SYNCED";
      case "drifting":
        return "DRIFT";
      case "error":
        return "ERROR";
      default:
        return "UNKNOWN";
    }
  };

  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
      {/* Status indicator */}
      <div
        className={`w-2 h-2 rounded-full transition-all duration-150 ${
          status === "drifting" && blinkState ? "opacity-30" : "opacity-100"
        }`}
        style={{ backgroundColor: getStatusColor() }}
      />

      {/* Status text */}
      <span
        className="text-xs font-bold transition-all duration-150"
        style={{ color: getStatusColor() }}
      >
        {getStatusText()}
      </span>

      {/* Latency display */}
      {status === "synced" && (
        <span className="text-xs text-gray-400 font-mono">
          {latency.toFixed(1)}ms
        </span>
      )}
    </div>
  );
});

SyncIndicator.displayName = "SyncIndicator";

// Individual stem activity indicator
const StemActivityIndicator = memo<StemActivityIndicatorProps>(
  ({ stemType, isActive, level, color }) => {
    const [animatedLevel, setAnimatedLevel] = useState(0);

    useEffect(() => {
      let animationId: number;

      const animate = () => {
        setAnimatedLevel((prev) => {
          const diff = level - prev;
          return prev + diff * 0.3; // Smooth interpolation
        });

        animationId = requestAnimationFrame(animate);
      };

      animationId = requestAnimationFrame(animate);

      return () => {
        if (animationId) {
          cancelAnimationFrame(animationId);
        }
      };
    }, [level]);

    const label = stemLabels[stemType];

    return (
      <div className="flex flex-col items-center gap-1">
        {/* Label */}
        <div
          className="text-xs font-bold transition-all duration-150"
          style={{
            color: isActive ? color : "#6b7280",
            opacity: isActive ? 1 : 0.5,
          }}
        >
          {label}
        </div>

        {/* Activity indicator */}
        <div className="relative w-8 h-8 rounded-full bg-gray-800 border border-gray-600 overflow-hidden">
          {/* Background ring */}
          <div
            className="absolute inset-0 rounded-full transition-all duration-150"
            style={{
              background: isActive
                ? `conic-gradient(from 0deg, ${color} 0%, ${color} ${animatedLevel * 100}%, transparent ${animatedLevel * 100}%, transparent 100%)`
                : "transparent",
            }}
          />

          {/* Center dot */}
          <div
            className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full transform -translate-x-1/2 -translate-y-1/2 transition-all duration-150"
            style={{
              backgroundColor: isActive ? color : "#6b7280",
              opacity: isActive ? 1 : 0.3,
            }}
          />
        </div>

        {/* Level value */}
        <div className="text-xs text-gray-400 font-mono">
          {isActive ? Math.round(animatedLevel * 100) : 0}
        </div>
      </div>
    );
  },
);

StemActivityIndicator.displayName = "StemActivityIndicator";

// Main StemMixer component
const StemMixerComponent: React.FC<StemMixerProps> = ({
  channel,
  className = "",
  showAdvancedControls = true,
  onStemMixChange,
  onSyncStatusChange,
}) => {
  const { decks, stemControls, setStemMix } = useEnhancedDJStore();

  // Performance optimization hooks
  const { metrics, status, startMeasurement, endMeasurement } =
    useOptimization();

  const deck = decks[channel];
  const controls = stemControls[channel];

  // Mock sync status and levels for demonstration
  const [syncStatus, setSyncStatus] = useState<"synced" | "drifting" | "error">(
    "synced",
  );
  const [syncLatency, setSyncLatency] = useState(12.3);
  const [stemLevels, setStemLevels] = useState({
    drums: 0,
    bass: 0,
    melody: 0,
    vocals: 0,
    original: 0,
  });

  // Simulate real-time sync monitoring and level updates with performance optimization
  useEffect(() => {
    let animationId: number;
    let frameSkipCount = 0;
    const maxFrameSkip = status === "poor" ? 2 : status === "fair" ? 1 : 0;

    const updateMetrics = () => {
      startMeasurement("stem_mixer_update");

      // Frame skipping for performance
      if (maxFrameSkip > 0 && frameSkipCount < maxFrameSkip) {
        frameSkipCount++;
        animationId = requestAnimationFrame(updateMetrics);
        return;
      }
      frameSkipCount = 0;

      // Simulate sync status changes
      const rand = Math.random();
      if (rand < 0.01) {
        setSyncStatus("drifting");
        setSyncLatency(25 + Math.random() * 10);
      } else if (rand < 0.005) {
        setSyncStatus("error");
      } else {
        setSyncStatus("synced");
        setSyncLatency(8 + Math.random() * 8);
      }

      // Simulate audio levels based on controls and playback state
      if (deck.isPlaying) {
        const baseLevel = 0.3 + Math.random() * 0.4;

        setStemLevels({
          drums: controls.drums.muted
            ? 0
            : controls.drums.volume * baseLevel * (0.8 + Math.random() * 0.4),
          bass: controls.bass.muted
            ? 0
            : controls.bass.volume * baseLevel * (0.7 + Math.random() * 0.3),
          melody: controls.melody.muted
            ? 0
            : controls.melody.volume * baseLevel * (0.6 + Math.random() * 0.4),
          vocals: controls.vocals.muted
            ? 0
            : controls.vocals.volume * baseLevel * (0.9 + Math.random() * 0.2),
          original: controls.original.muted
            ? 0
            : controls.original.volume *
              baseLevel *
              (0.8 + Math.random() * 0.3),
        });
      } else {
        setStemLevels({
          drums: 0,
          bass: 0,
          melody: 0,
          vocals: 0,
          original: 0,
        });
      }

      endMeasurement("stem_mixer_update");
      animationId = requestAnimationFrame(updateMetrics);
    };

    updateMetrics();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [
    deck.isPlaying,
    status,
    controls.bass.muted,
    controls.bass.volume,
    controls.drums.muted,
    controls.drums.volume,
    controls.melody.muted,
    controls.melody.volume,
    controls.original.muted,
    controls.original.volume,
    controls.vocals.muted,
    controls.vocals.volume,
    endMeasurement,
    startMeasurement,
  ]);

  // Emit sync status changes
  useEffect(() => {
    onSyncStatusChange?.(syncStatus);
  }, [syncStatus, onSyncStatusChange]);

  const handleStemMixChange = useCallback(
    (mix: number) => {
      setStemMix(channel, mix);
      onStemMixChange?.(mix);
    },
    [channel, setStemMix, onStemMixChange],
  );

  const handleMasterReset = useCallback(() => {
    setStemMix(channel, 0.5);
  }, [channel, setStemMix]);

  const handleFullOriginal = useCallback(() => {
    setStemMix(channel, 0);
  }, [channel, setStemMix]);

  const handleFullStems = useCallback(() => {
    setStemMix(channel, 1);
  }, [channel, setStemMix]);

  const isEnabled = deck.stemPlayerEnabled && deck.stemPlayerState?.stemsLoaded;

  if (!isEnabled) {
    return (
      <div
        className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${className}`}
      >
        <div className="text-center text-gray-500">
          <div className="text-sm font-medium mb-2">Stem Mixer Disabled</div>
          <div className="text-xs">
            {!deck.stemPlayerEnabled
              ? "Enable stem player for this channel"
              : "Load stems to use the mixer"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-gray-900 rounded-lg p-4 border border-gray-700 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="text-sm font-bold text-white">STEM MIXER</div>
          <div className="text-xs text-gray-400">CH{channel + 1}</div>
        </div>

        <SyncIndicator status={syncStatus} latency={syncLatency} />
      </div>

      {/* Stem Activity Indicators */}
      <div className="grid grid-cols-5 gap-3 mb-6">
        <StemActivityIndicator
          stemType="drums"
          isActive={!controls.drums.muted && stemLevels.drums > 0.01}
          level={stemLevels.drums}
          color={stemColors.drums}
        />
        <StemActivityIndicator
          stemType="bass"
          isActive={!controls.bass.muted && stemLevels.bass > 0.01}
          level={stemLevels.bass}
          color={stemColors.bass}
        />
        <StemActivityIndicator
          stemType="melody"
          isActive={!controls.melody.muted && stemLevels.melody > 0.01}
          level={stemLevels.melody}
          color={stemColors.melody}
        />
        <StemActivityIndicator
          stemType="vocals"
          isActive={!controls.vocals.muted && stemLevels.vocals > 0.01}
          level={stemLevels.vocals}
          color={stemColors.vocals}
        />
        <StemActivityIndicator
          stemType="original"
          isActive={!controls.original.muted && stemLevels.original > 0.01}
          level={stemLevels.original}
          color={stemColors.original}
        />
      </div>

      {/* Master Crossfader */}
      <div className="mb-6">
        <div className="text-xs font-bold text-gray-400 mb-2 text-center">
          MASTER STEM MIX
        </div>
        <Crossfader value={controls.stemMix} onChange={handleStemMixChange} />
      </div>

      {/* Quick Controls */}
      {showAdvancedControls && (
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleFullOriginal}
            className={`
              px-3 py-2 text-xs font-bold uppercase rounded transition-all duration-150
              ${
                controls.stemMix === 0
                  ? "bg-gray-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }
            `}
          >
            ORIGINAL
          </button>

          <button
            onClick={handleMasterReset}
            className={`
              px-3 py-2 text-xs font-bold uppercase rounded transition-all duration-150
              ${
                Math.abs(controls.stemMix - 0.5) < 0.01
                  ? "bg-gray-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }
            `}
          >
            BLEND
          </button>

          <button
            onClick={handleFullStems}
            className={`
              px-3 py-2 text-xs font-bold uppercase rounded transition-all duration-150
              ${
                controls.stemMix === 1
                  ? "bg-gray-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }
            `}
          >
            STEMS
          </button>
        </div>
      )}

      {/* Advanced Status */}
      {showAdvancedControls && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
            <div>
              <span className="font-semibold">Active Stems:</span>
              <div className="mt-1">
                {Object.entries(stemLevels)
                  .filter(([stem, level]) => {
                    const control = controls[stem as keyof typeof controls];
                    return (
                      level > 0.01 &&
                      typeof control === "object" &&
                      "muted" in control &&
                      !control.muted
                    );
                  })
                  .map(([stem]) => stem.toUpperCase())
                  .join(", ") || "None"}
              </div>
            </div>
            <div>
              <span className="font-semibold">Mix Position:</span>
              <div className="mt-1 font-mono">
                {(controls.stemMix * 100).toFixed(1)}% STEMS
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(StemMixerComponent);
export { StemMixerComponent as StemMixer };
