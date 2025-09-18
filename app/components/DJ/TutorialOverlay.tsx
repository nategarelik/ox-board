'use client'

import { TutorialOverlayProps } from '@/app/types/dj'

export default function TutorialOverlay({ isVisible, onClose }: TutorialOverlayProps) {
  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8">
      <div className="bg-gray-900 rounded-xl p-8 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <h2 className="text-3xl font-bold text-white mb-6">Welcome to Ox Board DJ</h2>

        <div className="space-y-4 text-gray-300">
          <div className="border-l-4 border-blue-500 pl-4">
            <h3 className="text-xl font-semibold text-white mb-2">🎛️ Getting Started</h3>
            <p>Click &quot;Start DJ Mode&quot; to initialize the audio system and enable mixing capabilities.</p>
          </div>

          <div className="border-l-4 border-green-500 pl-4">
            <h3 className="text-xl font-semibold text-white mb-2">👋 Gesture Controls</h3>
            <p>Enable camera and gestures to control the mixer with your hands:</p>
            <ul className="list-disc ml-5 mt-2">
              <li>Left hand: Controls crossfader and effects</li>
              <li>Right hand: Controls volume and filters</li>
              <li>Pinch gesture: Engage/disengage controls</li>
            </ul>
          </div>

          <div className="border-l-4 border-purple-500 pl-4">
            <h3 className="text-xl font-semibold text-white mb-2">🎵 View Modes</h3>
            <ul className="list-disc ml-5">
              <li><strong>Decks:</strong> Full deck control with waveforms</li>
              <li><strong>Mixer:</strong> Expanded mixing controls</li>
              <li><strong>Stems:</strong> AI-powered stem separation</li>
              <li><strong>Effects:</strong> Advanced audio effects rack</li>
            </ul>
          </div>

          <div className="border-l-4 border-yellow-500 pl-4">
            <h3 className="text-xl font-semibold text-white mb-2">🤖 AI Assistant</h3>
            <p>The Mix Assistant provides real-time suggestions for:</p>
            <ul className="list-disc ml-5 mt-2">
              <li>Harmonic mixing recommendations</li>
              <li>BPM matching and transitions</li>
              <li>Energy level management</li>
              <li>Track selection suggestions</li>
            </ul>
          </div>

          <div className="border-l-4 border-red-500 pl-4">
            <h3 className="text-xl font-semibold text-white mb-2">⌨️ Keyboard Shortcuts</h3>
            <ul className="list-disc ml-5">
              <li><kbd>Space</kbd> - Play/Pause active deck</li>
              <li><kbd>Q/P</kbd> - Cue point Deck A/B</li>
              <li><kbd>←/→</kbd> - Move crossfader</li>
              <li><kbd>↑/↓</kbd> - Master volume</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end mt-8">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Got it, let&apos;s mix!
          </button>
        </div>
      </div>
    </div>
  )
}