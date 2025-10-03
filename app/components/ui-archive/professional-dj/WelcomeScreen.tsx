"use client";

interface WelcomeScreenProps {
  onStart: () => void;
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
      <div className="text-center max-w-2xl px-6">
        <h2 className="text-5xl font-bold text-white mb-4">
          Welcome to Ox Board
        </h2>
        <p className="text-xl text-gray-400 mb-6">
          Professional DJ Interface with Gesture Control
        </p>

        <button
          onClick={onStart}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold rounded-lg hover:scale-105 transition-transform shadow-lg shadow-purple-500/30"
        >
          🎵 Start Mixing
        </button>

        <div className="mt-8 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <h3 className="text-sm font-semibold text-yellow-400 mb-2">
            ℹ️ Important Information
          </h3>
          <ul className="text-xs text-gray-400 text-left space-y-1">
            <li>
              • Click &quot;Start Mixing&quot; to initialize audio (required by
              browsers)
            </li>
            <li>
              • YouTube/Spotify URLs cannot be played due to copyright
              protection
            </li>
            <li>
              • Use the demo tracks provided or upload local MP3/WAV files
            </li>
            <li>• Enable camera permissions for gesture control</li>
          </ul>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          Supported formats: MP3, WAV, OGG, M4A, WebM
        </div>
      </div>
    </div>
  );
}
