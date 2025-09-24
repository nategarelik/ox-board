"use client";

import { useState, useCallback } from "react";
import { Volume2, VolumeX, Headphones, Mic, Radio, Zap } from "lucide-react";

interface ProfessionalMixerProps {
  decks: any[];
  crossfaderPosition: number;
  onCrossfaderChange: (value: number) => void;
  orientation?: "vertical" | "horizontal";
}

interface ChannelStripProps {
  channelId: number;
  deck: any;
  color: string;
}

function ChannelStrip({ channelId, deck, color }: ChannelStripProps) {
  const [gain, setGain] = useState(0);
  const [high, setHigh] = useState(0);
  const [mid, setMid] = useState(0);
  const [low, setLow] = useState(0);
  const [filter, setFilter] = useState(0);
  const [volume, setVolume] = useState(75);
  const [isMuted, setIsMuted] = useState(false);
  const [cueActive, setCueActive] = useState(false);

  const channelName =
    channelId === 0 ? "A" : channelId === 1 ? "B" : channelId === 2 ? "C" : "D";

  return (
    <div className="flex flex-col h-full glass-dark rounded-lg p-3">
      {/* Channel Header */}
      <div className="text-center mb-3">
        <div className={`text-sm font-display font-bold text-${color}-400`}>
          CH {channelName}
        </div>
        {deck?.track && (
          <div className="text-[10px] text-gray-500 truncate">
            {deck.track.title}
          </div>
        )}
      </div>

      {/* Gain Knob */}
      <div className="mb-4">
        <div className="text-[10px] text-gray-500 text-center mb-1">GAIN</div>
        <div className="relative w-10 h-10 mx-auto">
          <input
            type="range"
            min="-20"
            max="20"
            value={gain}
            onChange={(e) => setGain(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className={`w-full h-full rounded-full bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-${color}-500/30`}
          >
            <div
              className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-white rounded-full"
              style={{
                transform: `translateX(-50%) rotate(${(gain / 20) * 135}deg)`,
              }}
            />
          </div>
        </div>
        <div className="text-[10px] text-gray-400 text-center mt-1">
          {gain > 0 ? "+" : ""}
          {gain}
        </div>
      </div>

      {/* EQ Section */}
      <div className="flex flex-col gap-3 mb-4">
        {/* High */}
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-gray-500 w-6">HI</div>
          <div className="flex-1 relative h-1.5 bg-gray-800 rounded-full">
            <input
              type="range"
              min="-20"
              max="20"
              value={high}
              onChange={(e) => setHigh(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
            <div
              className={`absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full`}
              style={{ width: `${((high + 20) / 40) * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"
              style={{ left: `calc(${((high + 20) / 40) * 100}% - 6px)` }}
            />
          </div>
          <button
            className={`w-6 h-6 rounded bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 transition-all flex items-center justify-center`}
          >
            <span className="text-[10px] font-bold text-blue-400">K</span>
          </button>
        </div>

        {/* Mid */}
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-gray-500 w-6">MID</div>
          <div className="flex-1 relative h-1.5 bg-gray-800 rounded-full">
            <input
              type="range"
              min="-20"
              max="20"
              value={mid}
              onChange={(e) => setMid(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
            <div
              className={`absolute top-0 left-0 h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full`}
              style={{ width: `${((mid + 20) / 40) * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"
              style={{ left: `calc(${((mid + 20) / 40) * 100}% - 6px)` }}
            />
          </div>
          <button
            className={`w-6 h-6 rounded bg-green-600/20 hover:bg-green-600/30 border border-green-500/40 transition-all flex items-center justify-center`}
          >
            <span className="text-[10px] font-bold text-green-400">K</span>
          </button>
        </div>

        {/* Low */}
        <div className="flex items-center gap-2">
          <div className="text-[10px] text-gray-500 w-6">LOW</div>
          <div className="flex-1 relative h-1.5 bg-gray-800 rounded-full">
            <input
              type="range"
              min="-20"
              max="20"
              value={low}
              onChange={(e) => setLow(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
            <div
              className={`absolute top-0 left-0 h-full bg-gradient-to-r from-red-500 to-red-400 rounded-full`}
              style={{ width: `${((low + 20) / 40) * 100}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"
              style={{ left: `calc(${((low + 20) / 40) * 100}% - 6px)` }}
            />
          </div>
          <button
            className={`w-6 h-6 rounded bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 transition-all flex items-center justify-center`}
          >
            <span className="text-[10px] font-bold text-red-400">K</span>
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <div className="text-[10px] text-gray-500 text-center mb-1">FILTER</div>
        <div className="relative w-10 h-10 mx-auto">
          <input
            type="range"
            min="-100"
            max="100"
            value={filter}
            onChange={(e) => setFilter(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-700 to-purple-800 border-2 border-purple-500/30">
            <div
              className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-white rounded-full"
              style={{
                transform: `translateX(-50%) rotate(${(filter / 100) * 135}deg)`,
              }}
            />
          </div>
        </div>
        <div className="text-[10px] text-gray-400 text-center mt-1">
          {filter > 0 ? "HP" : filter < 0 ? "LP" : "OFF"}
        </div>
      </div>

      {/* VU Meter */}
      <div className="flex-1 flex justify-center mb-3">
        <div className="w-2 bg-gray-800 rounded-full relative overflow-hidden">
          <div
            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-green-500 via-yellow-500 to-red-500 transition-all"
            style={{ height: `${volume}%` }}
          />
          {/* Peak indicator */}
          {volume > 90 && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse" />
          )}
        </div>
      </div>

      {/* Volume Fader */}
      <div className="mb-3">
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-full h-16 bg-gray-800 rounded cursor-pointer"
          style={{
            background: `linear-gradient(to top, ${color === "cyan" ? "#00ffff" : "#ff00ff"} ${volume}%, #374151 ${volume}%)`,
          }}
        />
      </div>

      {/* Channel Controls */}
      <div className="flex gap-1">
        <button
          onClick={() => setCueActive(!cueActive)}
          className={`flex-1 p-1.5 rounded text-[10px] font-bold transition-all ${
            cueActive
              ? "bg-orange-600 text-white"
              : "bg-orange-600/20 text-orange-400 hover:bg-orange-600/30 border border-orange-500/40"
          }`}
        >
          CUE
        </button>
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`flex-1 p-1.5 rounded transition-all ${
            isMuted ? "bg-red-600 text-white" : "bg-gray-700 hover:bg-gray-600"
          }`}
        >
          {isMuted ? (
            <VolumeX className="w-3 h-3 mx-auto" />
          ) : (
            <Volume2 className="w-3 h-3 mx-auto text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function ProfessionalMixer({
  decks,
  crossfaderPosition,
  onCrossfaderChange,
  orientation = "vertical",
}: ProfessionalMixerProps) {
  const [masterVolume, setMasterVolume] = useState(85);
  const [boothVolume, setBoothVolume] = useState(75);
  const [isRecording, setIsRecording] = useState(false);
  const [crossfaderCurve, setCrossfaderCurve] = useState("smooth"); // smooth, sharp, scratch

  return (
    <div className="glass-dark rounded-xl p-4 h-full flex flex-col">
      {/* Mixer Header */}
      <div className="text-center mb-4">
        <div className="text-lg font-display font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
          MIXER
        </div>
      </div>

      {/* Channel Strips */}
      <div className="flex gap-2 flex-1">
        <ChannelStrip channelId={0} deck={decks[0]} color="cyan" />
        <ChannelStrip channelId={1} deck={decks[1]} color="magenta" />
      </div>

      {/* Crossfader Section */}
      <div className="mt-4 p-3 glass rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-gray-500">CROSSFADER</span>
          <select
            value={crossfaderCurve}
            onChange={(e) => setCrossfaderCurve(e.target.value)}
            className="bg-black/50 border border-gray-700 rounded px-2 py-0.5 text-[10px] text-gray-400"
          >
            <option value="smooth">Smooth</option>
            <option value="sharp">Sharp</option>
            <option value="scratch">Scratch</option>
          </select>
        </div>
        <div className="relative h-12 bg-gray-800 rounded-lg">
          <input
            type="range"
            min="-1"
            max="1"
            step="0.01"
            value={crossfaderPosition}
            onChange={(e) => onCrossfaderChange(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="absolute top-1/2 -translate-y-1/2 left-2 text-[10px] text-cyan-400 font-bold">
            A
          </div>
          <div className="absolute top-1/2 -translate-y-1/2 right-2 text-[10px] text-magenta-400 font-bold">
            B
          </div>
          <div
            className="absolute top-1/2 -translate-y-1/2 w-8 h-10 bg-gradient-to-b from-gray-100 to-gray-300 rounded shadow-lg"
            style={{
              left: `calc(${((crossfaderPosition + 1) / 2) * 100}% - 16px)`,
            }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-6 bg-gray-600" />
          </div>
        </div>
      </div>

      {/* Master Section */}
      <div className="mt-4 flex gap-3">
        {/* Master Volume */}
        <div className="flex-1">
          <div className="text-[10px] text-gray-500 mb-1">MASTER</div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-3 h-3 text-gray-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={masterVolume}
              onChange={(e) => setMasterVolume(Number(e.target.value))}
              className="flex-1 h-6"
              style={{
                background: `linear-gradient(to right, #9333ea ${masterVolume}%, #374151 ${masterVolume}%)`,
              }}
            />
            <span className="text-[10px] font-mono text-gray-400 w-8">
              {masterVolume}%
            </span>
          </div>
        </div>

        {/* Booth Volume */}
        <div className="flex-1">
          <div className="text-[10px] text-gray-500 mb-1">BOOTH</div>
          <div className="flex items-center gap-2">
            <Headphones className="w-3 h-3 text-gray-400" />
            <input
              type="range"
              min="0"
              max="100"
              value={boothVolume}
              onChange={(e) => setBoothVolume(Number(e.target.value))}
              className="flex-1 h-6"
              style={{
                background: `linear-gradient(to right, #9333ea ${boothVolume}%, #374151 ${boothVolume}%)`,
              }}
            />
            <span className="text-[10px] font-mono text-gray-400 w-8">
              {boothVolume}%
            </span>
          </div>
        </div>

        {/* Rec Button */}
        <button
          onClick={() => setIsRecording(!isRecording)}
          className={`px-3 py-1 rounded-lg transition-all ${
            isRecording
              ? "bg-red-600 text-white animate-pulse"
              : "bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-500/40"
          }`}
        >
          <div className="text-xs font-bold">REC</div>
        </button>
      </div>
    </div>
  );
}
