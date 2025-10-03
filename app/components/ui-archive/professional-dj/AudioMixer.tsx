"use client";

import dynamic from "next/dynamic";
import { AudioMixerProps } from "@/types/dj";

const DeckPlayer = dynamic(() => import("./DeckPlayer"), { ssr: false });
const EnhancedMixer = dynamic(() => import("./EnhancedMixer"), { ssr: false });

export default function AudioMixer({ viewMode, decks }: AudioMixerProps) {
  const renderViewContent = () => {
    switch (viewMode) {
      case "decks":
        return (
          <div className="flex gap-6 items-stretch justify-center h-full">
            <div className="flex-1 max-w-[450px]">
              <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-xl border border-purple-500/20 p-4 h-full">
                <h3 className="text-sm font-medium text-purple-400 mb-3">
                  DECK A
                </h3>
                <DeckPlayer deckId={0} />
              </div>
            </div>
            <div className="w-[320px]">
              <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-xl border border-purple-500/20 p-4 h-full">
                <h3 className="text-sm font-medium text-purple-400 mb-3 text-center">
                  MIXER
                </h3>
                <EnhancedMixer />
              </div>
            </div>
            <div className="flex-1 max-w-[450px]">
              <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-xl border border-purple-500/20 p-4 h-full">
                <h3 className="text-sm font-medium text-purple-400 mb-3">
                  DECK B
                </h3>
                <DeckPlayer deckId={1} />
              </div>
            </div>
          </div>
        );

      case "mixer":
        return (
          <div className="flex gap-6 items-stretch justify-center h-full">
            <div className="w-[380px]">
              <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-xl border border-purple-500/20 p-4 h-full">
                <h3 className="text-sm font-medium text-purple-400 mb-3">
                  DECK A
                </h3>
                <DeckPlayer deckId={0} />
              </div>
            </div>
            <div className="w-[450px]">
              <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-xl border border-purple-500/20 p-4 h-full">
                <h3 className="text-sm font-medium text-purple-400 mb-3 text-center">
                  ENHANCED MIXER
                </h3>
                <EnhancedMixer />
              </div>
            </div>
            <div className="w-[380px]">
              <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-xl border border-purple-500/20 p-4 h-full">
                <h3 className="text-sm font-medium text-purple-400 mb-3">
                  DECK B
                </h3>
                <DeckPlayer deckId={1} />
              </div>
            </div>
          </div>
        );

      case "stems":
        return (
          <div className="flex gap-6 justify-center items-start h-full">
            <div className="flex-1 max-w-2xl">
              <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-xl border border-purple-500/20 p-6 h-full">
                <h3 className="text-lg font-medium text-purple-400 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎧</span> DECK A STEMS
                </h3>
                <div className="text-gray-500 text-center py-8">
                  Stem controls coming soon
                </div>
              </div>
            </div>
            <div className="flex-1 max-w-2xl">
              <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-xl border border-purple-500/20 p-6 h-full">
                <h3 className="text-lg font-medium text-purple-400 mb-4 flex items-center gap-2">
                  <span className="text-2xl">🎧</span> DECK B STEMS
                </h3>
                <div className="text-gray-500 text-center py-8">
                  Stem controls coming soon
                </div>
              </div>
            </div>
          </div>
        );

      case "effects":
        return (
          <div className="flex flex-col gap-4 items-center justify-center h-full">
            <div className="bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-xl border border-purple-500/20 p-8 max-w-4xl w-full">
              <h2 className="text-2xl font-bold text-purple-400 mb-6 text-center flex items-center justify-center gap-3">
                <span className="text-3xl">🎹</span> Effects Rack
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-sm text-gray-400 mb-2">Reverb</h4>
                  <div className="h-24 bg-gray-900/50 rounded flex items-center justify-center">
                    <span className="text-gray-500">Coming Soon</span>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-sm text-gray-400 mb-2">Delay</h4>
                  <div className="h-24 bg-gray-900/50 rounded flex items-center justify-center">
                    <span className="text-gray-500">Coming Soon</span>
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-sm text-gray-400 mb-2">Filter</h4>
                  <div className="h-24 bg-gray-900/50 rounded flex items-center justify-center">
                    <span className="text-gray-500">Coming Soon</span>
                  </div>
                </div>
              </div>
              <p className="text-gray-500 text-center mt-6 text-sm">
                Advanced effects and real-time visualizer in development
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* View Mode Tabs */}
      <div className="flex justify-center mb-4">
        <div className="bg-gray-800/50 rounded-lg p-1 flex gap-1">
          {["decks", "mixer", "stems", "effects"].map((mode) => (
            <button
              key={mode}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === mode
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Main View Content */}
      <div className="flex-1 overflow-hidden">{renderViewContent()}</div>

      {/* Stem Mixer Controls (only for decks/mixer views) */}
      {(viewMode === "decks" || viewMode === "mixer") && (
        <div className="flex gap-4 mt-4 px-4" style={{ height: "20vh" }}>
          <div className="flex-1 bg-gradient-to-b from-gray-800/30 to-gray-900/30 rounded-lg border border-purple-500/10 p-3">
            <h4 className="text-xs font-medium text-purple-400 mb-2">
              DECK A STEMS
            </h4>
            <div className="text-gray-500 text-xs text-center py-4">
              Stem controls integration pending
            </div>
          </div>
          <div className="flex-1 bg-gradient-to-b from-gray-800/30 to-gray-900/30 rounded-lg border border-purple-500/10 p-3">
            <h4 className="text-xs font-medium text-purple-400 mb-2">
              DECK B STEMS
            </h4>
            <div className="text-gray-500 text-xs text-center py-4">
              Stem controls integration pending
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
