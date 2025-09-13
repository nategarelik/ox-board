'use client'

import { useState, useEffect } from 'react'

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <main className="min-h-screen bg-ox-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-ox-surface/80 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-display font-bold text-ox-primary ox-neon-text">
              OX BOARD
            </h1>
            <span className="text-sm text-gray-400 font-mono">v1.0.0</span>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-ox-success animate-pulse"></div>
              <span className="text-sm text-gray-400">Camera Ready</span>
            </div>
            <button className="ox-button text-sm px-4 py-2">
              Start DJ Mode
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-16 min-h-screen flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="relative w-32 h-32 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-ox-primary rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-ox-accent rounded-full animate-spin animation-delay-150"></div>
                <div className="absolute inset-4 border-4 border-ox-warning rounded-full animate-spin animation-delay-300"></div>
              </div>
              <h2 className="text-3xl font-display font-bold mb-2 ox-neon-text">
                INITIALIZING
              </h2>
              <p className="text-gray-400">Preparing your DJ experience...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4">
            {/* Camera Section */}
            <section className="h-[30vh] mb-4 ox-surface p-4">
              <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-700 rounded-lg">
                <div className="text-center">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <h3 className="text-xl font-display mb-2">Camera Feed</h3>
                  <p className="text-gray-400 text-sm">Click "Start DJ Mode" to begin</p>
                </div>
              </div>
            </section>

            {/* Decks Section */}
            <section className="h-[40vh] mb-4 grid grid-cols-[1fr_150px_1fr] gap-4">
              {/* Deck A */}
              <div className="ox-surface p-4">
                <h3 className="text-lg font-display mb-4 text-ox-accent">DECK A</h3>
                <div className="h-32 w-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 ox-deck-shadow flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-ox-primary"></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">BPM</span>
                    <span className="font-mono">128.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">KEY</span>
                    <span className="font-mono">4A</span>
                  </div>
                </div>
              </div>

              {/* Mixer */}
              <div className="ox-surface p-4">
                <h3 className="text-lg font-display mb-4 text-center">MIXER</h3>
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-32 bg-gradient-to-b from-gray-700 to-gray-800 rounded-lg"></div>
                  <div className="text-xs text-gray-400">CROSSFADER</div>
                </div>
              </div>

              {/* Deck B */}
              <div className="ox-surface p-4">
                <h3 className="text-lg font-display mb-4 text-ox-accent">DECK B</h3>
                <div className="h-32 w-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 ox-deck-shadow flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-ox-primary"></div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">BPM</span>
                    <span className="font-mono">128.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">KEY</span>
                    <span className="font-mono">4A</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Effects & Sampler Section */}
            <section className="h-[25vh] grid grid-cols-2 gap-4">
              {/* Effects */}
              <div className="ox-surface p-4">
                <h3 className="text-lg font-display mb-4 text-ox-warning">EFFECTS</h3>
                <div className="grid grid-cols-3 gap-2">
                  {['REVERB', 'DELAY', 'FILTER', 'FLANGER', 'CRUSH', 'PHASE'].map((effect) => (
                    <button key={effect} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs font-mono transition-colors">
                      {effect}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sampler */}
              <div className="ox-surface p-4">
                <h3 className="text-lg font-display mb-4 text-ox-success">SAMPLER</h3>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <button
                      key={i}
                      className="aspect-square bg-gradient-to-br from-gray-700 to-gray-800 hover:from-ox-primary hover:to-red-700 rounded transition-all transform hover:scale-105"
                    >
                      <span className="text-xs font-mono">{i + 1}</span>
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          <p>OX Board © 2024 - Theta Chi, UW Madison</p>
          <p className="mt-1 font-mono text-xs">Throw Your Hands Up</p>
        </div>
      </footer>
    </main>
  )
}