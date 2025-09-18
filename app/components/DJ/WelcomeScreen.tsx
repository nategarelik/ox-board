'use client'

interface WelcomeScreenProps {
  onStart: () => void
}

export default function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
      <div className="text-center">
        <h2 className="text-5xl font-bold text-white mb-4">Welcome to Ox Board</h2>
        <p className="text-xl text-gray-400 mb-8">Professional DJ Interface with Gesture Control</p>
        <button
          onClick={onStart}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xl font-bold rounded-lg hover:scale-105 transition-transform"
        >
          🎵 Start Mixing
        </button>
      </div>
    </div>
  )
}