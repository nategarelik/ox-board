"use client";

import { useState } from "react";
import { Zap, Waves, Timer, Volume2, Disc, Shuffle } from "lucide-react";

interface EffectsRackProps {
  deck1Effects?: any;
  deck2Effects?: any;
}

interface EffectUnitProps {
  deckId: number;
  color: string;
}

function EffectUnit({ deckId, color }: EffectUnitProps) {
  const [activeEffect, setActiveEffect] = useState<string | null>(null);
  const [wetDry, setWetDry] = useState(50);
  const [param1, setParam1] = useState(50);
  const [param2, setParam2] = useState(50);

  const effects = [
    { id: "reverb", name: "Reverb", icon: Waves },
    { id: "delay", name: "Delay", icon: Timer },
    { id: "filter", name: "Filter", icon: Disc },
    { id: "flanger", name: "Flanger", icon: Shuffle },
  ];

  return (
    <div className="glass-dark rounded-lg p-3">
      <div className="text-center mb-3">
        <div className={`text-sm font-display font-bold text-${color}-400`}>
          FX {deckId === 0 ? "A" : "B"}
        </div>
      </div>

      {/* Effect Selector */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {effects.map((effect) => (
          <button
            key={effect.id}
            onClick={() =>
              setActiveEffect(activeEffect === effect.id ? null : effect.id)
            }
            className={`flex items-center justify-center gap-1 p-2 rounded transition-all ${
              activeEffect === effect.id
                ? `bg-${color}-600/30 border border-${color}-500/50 text-${color}-400`
                : "bg-gray-800/50 hover:bg-gray-700/50 text-gray-400 border border-gray-700"
            }`}
          >
            <effect.icon className="w-4 h-4" />
            <span className="text-xs">{effect.name}</span>
          </button>
        ))}
      </div>

      {/* Effect Parameters */}
      {activeEffect && (
        <div className="space-y-3">
          {/* Wet/Dry */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-500">WET/DRY</span>
              <span className="text-xs font-mono text-gray-400">{wetDry}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={wetDry}
              onChange={(e) => setWetDry(Number(e.target.value))}
              className="w-full h-6"
              style={{
                background: `linear-gradient(to right, ${color === "cyan" ? "#00ffff" : "#ff00ff"} ${wetDry}%, #374151 ${wetDry}%)`,
              }}
            />
          </div>

          {/* Parameter 1 */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-500">
                {activeEffect === "delay"
                  ? "TIME"
                  : activeEffect === "filter"
                    ? "FREQ"
                    : "SIZE"}
              </span>
              <span className="text-xs font-mono text-gray-400">{param1}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={param1}
              onChange={(e) => setParam1(Number(e.target.value))}
              className="w-full h-6"
              style={{
                background: `linear-gradient(to right, #9333ea ${param1}%, #374151 ${param1}%)`,
              }}
            />
          </div>

          {/* Parameter 2 */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-xs text-gray-500">
                {activeEffect === "delay"
                  ? "FEEDBACK"
                  : activeEffect === "filter"
                    ? "RES"
                    : "DEPTH"}
              </span>
              <span className="text-xs font-mono text-gray-400">{param2}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={param2}
              onChange={(e) => setParam2(Number(e.target.value))}
              className="w-full h-6"
              style={{
                background: `linear-gradient(to right, #9333ea ${param2}%, #374151 ${param2}%)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Beat Sync */}
      <div className="mt-3 flex justify-between items-center">
        <button className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/30 rounded text-xs text-purple-400 transition-all">
          BEAT SYNC
        </button>
        <button
          className={`px-2 py-1 bg-${color}-600/20 hover:bg-${color}-600/30 rounded text-xs text-${color}-400 transition-all`}
        >
          BYPASS
        </button>
      </div>
    </div>
  );
}

export default function EffectsRack({
  deck1Effects,
  deck2Effects,
}: EffectsRackProps) {
  return (
    <div className="flex gap-4 h-full">
      <div className="flex-1">
        <EffectUnit deckId={0} color="cyan" />
      </div>
      <div className="flex-1">
        <EffectUnit deckId={1} color="magenta" />
      </div>

      {/* Master Effects */}
      <div className="w-48 glass-dark rounded-lg p-3">
        <div className="text-center mb-3">
          <div className="text-sm font-display font-bold text-purple-400">
            MASTER FX
          </div>
        </div>

        <div className="space-y-3">
          {/* Limiter */}
          <div className="p-2 bg-gray-800/50 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">LIMITER</span>
              <button className="w-8 h-4 bg-green-600/30 rounded-full relative">
                <div className="absolute top-0.5 right-0.5 w-3 h-3 bg-green-400 rounded-full" />
              </button>
            </div>
            <div className="h-1 bg-gray-700 rounded-full">
              <div className="h-full w-3/4 bg-gradient-to-r from-green-500 to-yellow-500 rounded-full" />
            </div>
          </div>

          {/* Compressor */}
          <div className="p-2 bg-gray-800/50 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">COMPRESS</span>
              <span className="text-xs font-mono text-purple-400">4:1</span>
            </div>
            <div className="h-1 bg-gray-700 rounded-full">
              <div className="h-full w-1/2 bg-purple-500 rounded-full" />
            </div>
          </div>

          {/* Visualizer */}
          <div className="p-2 bg-gray-800/50 rounded">
            <div className="text-xs text-gray-400 mb-2">SPECTRUM</div>
            <div className="flex items-end justify-between h-12 gap-0.5">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t"
                  style={{ height: `${Math.random() * 100}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
