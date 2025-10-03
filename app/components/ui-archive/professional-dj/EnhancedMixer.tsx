"use client";

import React, { useCallback, useEffect, useState } from "react";
import useEnhancedDJStore from "@/stores/enhancedDjStoreWithGestures";
import { Volume2, Headphones, Disc3, Activity } from "lucide-react";

interface ChannelStripProps {
  channel: number;
  label: string;
}

const ChannelStrip: React.FC<ChannelStripProps> = ({ channel, label }) => {
  const { channelConfigs, setChannelGain, setChannelEQ } = useEnhancedDJStore();

  const config = channelConfigs[channel];

  return (
    <div className="flex flex-col h-full">
      <h4 className="text-xs text-gray-400 mb-2 text-center">{label}</h4>

      {/* 3-Band EQ */}
      <div className="flex-1 flex gap-2 mb-3">
        <div className="flex flex-col items-center flex-1">
          <span className="text-xs text-gray-500 mb-1">HI</span>
          <input
            type="range"
            min="-20"
            max="20"
            value={config?.eq.high || 0}
            onChange={(e) =>
              setChannelEQ(channel, "high", parseFloat(e.target.value))
            }
            className="vertical-slider"
            style={{ writingMode: "vertical-lr" }}
          />
          <span className="text-xs font-mono mt-1">{config?.eq.high || 0}</span>
        </div>

        <div className="flex flex-col items-center flex-1">
          <span className="text-xs text-gray-500 mb-1">MID</span>
          <input
            type="range"
            min="-20"
            max="20"
            value={config?.eq.mid || 0}
            onChange={(e) =>
              setChannelEQ(channel, "mid", parseFloat(e.target.value))
            }
            className="vertical-slider"
            style={{ writingMode: "vertical-lr" }}
          />
          <span className="text-xs font-mono mt-1">{config?.eq.mid || 0}</span>
        </div>

        <div className="flex flex-col items-center flex-1">
          <span className="text-xs text-gray-500 mb-1">LOW</span>
          <input
            type="range"
            min="-20"
            max="20"
            value={config?.eq.low || 0}
            onChange={(e) =>
              setChannelEQ(channel, "low", parseFloat(e.target.value))
            }
            className="vertical-slider"
            style={{ writingMode: "vertical-lr" }}
          />
          <span className="text-xs font-mono mt-1">{config?.eq.low || 0}</span>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-3">
        <select
          value={config?.filterType || "off"}
          onChange={(e) => console.log("Filter change:", e.target.value)}
          className="w-full bg-gray-800 rounded px-2 py-1 text-xs"
        >
          <option value="off">Filter OFF</option>
          <option value="lpf">Low Pass</option>
          <option value="hpf">High Pass</option>
        </select>
      </div>

      {/* Channel Fader */}
      <div className="flex flex-col items-center mb-3">
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={config?.gain || 0.75}
          onChange={(e) => setChannelGain(channel, parseFloat(e.target.value))}
          className="vertical-slider h-24"
          style={{ writingMode: "vertical-lr" }}
        />
        <span className="text-xs font-mono mt-1">
          {((config?.gain || 0.75) * 100).toFixed(0)}%
        </span>
      </div>

      {/* Cue Button */}
      <button
        onClick={() => console.log("Cue channel:", channel)}
        className={`p-2 rounded ${
          config?.cueEnable
            ? "bg-ox-warning text-black"
            : "bg-gray-800 hover:bg-gray-700"
        } transition-colors`}
      >
        <Headphones size={14} />
      </button>
    </div>
  );
};

export const EnhancedMixer: React.FC = () => {
  const {
    crossfaderConfig,
    masterConfig,
    setCrossfaderPosition,
    setMasterGain,
    decks,
  } = useEnhancedDJStore();

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Auto-sync indicator
  const syncStatus = useCallback(() => {
    const deck1 = decks[0];
    const deck2 = decks[1];

    if (!deck1?.track || !deck2?.track) return null;

    if (deck1.isPlaying && deck2.isPlaying) {
      return { status: "drifting", color: "text-yellow-500" };
    }
    return null;
  }, [decks]);

  const sync = syncStatus();

  return (
    <div className="ox-surface p-4 h-full">
      <h3 className="text-lg font-display mb-4 text-center">MIXER</h3>

      {/* Sync Status */}
      {sync && (
        <div className={`text-center mb-3 ${sync.color}`}>
          <Activity size={16} className="inline mr-1" />
          <span className="text-xs uppercase">{sync.status}</span>
        </div>
      )}

      {/* Channel Strips */}
      <div
        className="grid grid-cols-4 gap-3 mb-4"
        style={{ minHeight: "300px" }}
      >
        <ChannelStrip channel={0} label="CH 1" />
        <ChannelStrip channel={1} label="CH 2" />
        <ChannelStrip channel={2} label="CH 3" />
        <ChannelStrip channel={3} label="CH 4" />
      </div>

      {/* Crossfader Section */}
      <div className="border-t border-gray-700 pt-4">
        <div className="mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">CROSSFADER</span>
            <select
              value={crossfaderConfig.curve}
              onChange={(e) => console.log("Curve change:", e.target.value)}
              className="bg-gray-800 rounded px-2 py-1 text-xs"
            >
              <option value="linear">Linear</option>
              <option value="smooth">Smooth</option>
              <option value="sharp">Sharp</option>
            </select>
          </div>

          <div className="relative">
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={crossfaderConfig.position}
              onChange={(e) =>
                setCrossfaderPosition(parseFloat(e.target.value))
              }
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>A</span>
              <span>{(crossfaderConfig.position * 100).toFixed(0)}%</span>
              <span>B</span>
            </div>
          </div>
        </div>

        {/* Master Section */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400">MASTER</span>
              <span className="font-mono">
                {(masterConfig.gain * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterConfig.gain}
              onChange={(e) => setMasterGain(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
          >
            <Volume2 size={16} />
          </button>
        </div>

        {/* Advanced Master Controls */}
        {showAdvanced && (
          <div className="mt-3 p-3 bg-gray-900 rounded">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={masterConfig.limiterEnabled}
                  onChange={(e) => console.log("Limiter:", e.target.checked)}
                  className="rounded"
                />
                <span>Limiter</span>
                <span className="text-gray-500">
                  {masterConfig.limiterThreshold}dB
                </span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={masterConfig.compressorEnabled}
                  onChange={(e) => console.log("Compressor:", e.target.checked)}
                  className="rounded"
                />
                <span>Compressor</span>
                <span className="text-gray-500">
                  {masterConfig.compressorRatio}:1
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .vertical-slider {
          appearance: slider-vertical;
          width: 20px;
          height: 100px;
        }
      `}</style>
    </div>
  );
};

export default EnhancedMixer;
