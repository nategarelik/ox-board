"use client";

import { ViewMode } from "@/types/dj";

interface HeaderProps {
  isDJModeActive: boolean;
  cameraActive: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onStartDJ: () => void;
  onStopDJ: () => void;
  onShowTutorial: () => void;
}

export default function Header({
  isDJModeActive,
  cameraActive,
  viewMode,
  onViewModeChange,
  onStartDJ,
  onStopDJ,
  onShowTutorial,
}: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-purple-900 to-blue-900 p-4 shadow-lg">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white">🎛️ Ox Board</h1>
          <span className="text-sm text-purple-200">v0.2.0</span>
        </div>

        {isDJModeActive && (
          <div className="flex gap-2">
            {(["decks", "mixer", "stems", "effects"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => onViewModeChange(mode)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  viewMode === mode
                    ? "bg-white text-purple-900 font-bold"
                    : "bg-purple-700 text-white hover:bg-purple-600"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4">
          {cameraActive && (
            <span className="flex items-center gap-2 text-green-400">
              <span className="animate-pulse">●</span> Camera Active
            </span>
          )}

          <button
            onClick={onShowTutorial}
            className="px-3 py-2 bg-purple-700 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            ?
          </button>

          <button
            onClick={isDJModeActive ? onStopDJ : onStartDJ}
            className={`px-6 py-3 rounded-lg font-bold transition-all ${
              isDJModeActive
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white animate-pulse"
            }`}
          >
            {isDJModeActive ? "Stop DJ Mode" : "Start DJ Mode"}
          </button>
        </div>
      </div>
    </header>
  );
}
