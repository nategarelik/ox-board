'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import useDJStore from './stores/djStore'
import { useGestures } from './hooks/useGestures'

// Dynamic imports to avoid SSR issues
const CameraFeed = dynamic(() => import('./components/Camera/CameraFeed'), { ssr: false })
const Mixer = dynamic(() => import('./components/DJ/Mixer'), { ssr: false })

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)

  const {
    isDJModeActive,
    cameraActive,
    gestureEnabled,
    decks,
    channelConfigs,
    crossfaderConfig,
    masterConfig,
    initializeMixer,
    setDJModeActive,
    setCameraActive,
    setGestureEnabled,
    setChannelGain,
    setChannelEQ,
    setCrossfaderPosition,
    setMasterGain,
    updateGestureControls
  } = useDJStore()

  const {
    gestureData,
    controls,
    updateGestures,
    reset: resetGestures
  } = useGestures()

  // Initialize loading animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  // Update gesture controls
  useEffect(() => {
    if (gestureEnabled && controls.length > 0) {
      updateGestureControls(controls)
    }
  }, [controls, gestureEnabled, updateGestureControls])

  const handleStartDJMode = useCallback(async () => {
    setDJModeActive(true)
    await initializeMixer()
    setCameraActive(true)
    setGestureEnabled(true)
  }, [setDJModeActive, initializeMixer, setCameraActive, setGestureEnabled])

  const handleStopDJMode = useCallback(() => {
    setDJModeActive(false)
    setCameraActive(false)
    setGestureEnabled(false)
    resetGestures()
  }, [setDJModeActive, setCameraActive, setGestureEnabled, resetGestures])

  const handleHandsDetected = useCallback((hands: any) => {
    if (gestureEnabled) {
      updateGestures({
        leftHandLandmarks: hands.find((h: any) => h.handedness === 'Left')?.landmarks,
        rightHandLandmarks: hands.find((h: any) => h.handedness === 'Right')?.landmarks,
        confidence: hands[0]?.score || 0
      })
    }
  }, [gestureEnabled, updateGestures])

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
              <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-ox-success animate-pulse' : 'bg-gray-600'}`}></div>
              <span className="text-sm text-gray-400">
                {cameraActive ? 'Camera Active' : 'Camera Ready'}
              </span>
            </div>
            <button
              onClick={isDJModeActive ? handleStopDJMode : handleStartDJMode}
              className={`ox-button text-sm px-4 py-2 ${isDJModeActive ? 'bg-ox-error' : ''}`}
            >
              {isDJModeActive ? 'Stop DJ Mode' : 'Start DJ Mode'}
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
              {cameraActive ? (
                <CameraFeed
                  onHandsDetected={handleHandsDetected}
                  onCameraReady={() => console.log('Camera ready')}
                  onError={(error) => console.error('Camera error:', error)}
                />
              ) : (
                <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-700 rounded-lg">
                  <div className="text-center">
                    <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <h3 className="text-xl font-display mb-2">Camera Feed</h3>
                    <p className="text-gray-400 text-sm">Click &quot;Start DJ Mode&quot; to begin</p>
                  </div>
                </div>
              )}
            </section>

            {/* Decks Section */}
            <section className="h-[40vh] mb-4 grid grid-cols-[1fr_200px_1fr] gap-4">
              {/* Deck A */}
              <div className="ox-surface p-4">
                <h3 className="text-lg font-display mb-4 text-ox-accent">DECK A</h3>
                <div className="h-32 w-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 ox-deck-shadow flex items-center justify-center">
                  <div className={`w-8 h-8 rounded-full ${decks[0]?.isPlaying ? 'bg-ox-success animate-spin' : 'bg-ox-primary'}`}></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Volume</span>
                    <span className="font-mono">{Math.round((channelConfigs[0]?.gain || 0.75) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(channelConfigs[0]?.gain || 0.75) * 100}
                    onChange={(e) => setChannelGain(0, parseInt(e.target.value) / 100)}
                    className="w-full"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-8">LOW</span>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={channelConfigs[0]?.eq?.low || 0}
                        onChange={(e) => setChannelEQ(0, 'low', parseInt(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-8">MID</span>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={channelConfigs[0]?.eq?.mid || 0}
                        onChange={(e) => setChannelEQ(0, 'mid', parseInt(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-8">HI</span>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={channelConfigs[0]?.eq?.high || 0}
                        onChange={(e) => setChannelEQ(0, 'high', parseInt(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Mixer */}
              <div className="ox-surface p-4">
                <h3 className="text-lg font-display mb-4 text-center">MIXER</h3>
                <div className="h-full flex flex-col items-center justify-center space-y-4">
                  <div className="text-xs text-gray-400">MASTER</div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(masterConfig?.gain || 0.8) * 100}
                    onChange={(e) => setMasterGain(parseInt(e.target.value) / 100)}
                    className="h-32"
                    style={{ writingMode: 'vertical-lr' as any, WebkitAppearance: 'slider-vertical' }}
                  />
                  <div className="text-xs text-gray-400">CROSSFADER</div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(crossfaderConfig?.position || 0.5) * 100}
                    onChange={(e) => setCrossfaderPosition(parseInt(e.target.value) / 100)}
                    className="w-32"
                  />
                  <div className="flex gap-2 text-xs">
                    <span className={`${crossfaderConfig?.position < 0.3 ? 'text-ox-accent' : 'text-gray-600'}`}>A</span>
                    <span className="text-gray-400">|</span>
                    <span className={`${crossfaderConfig?.position > 0.7 ? 'text-ox-accent' : 'text-gray-600'}`}>B</span>
                  </div>
                </div>
              </div>

              {/* Deck B */}
              <div className="ox-surface p-4">
                <h3 className="text-lg font-display mb-4 text-ox-accent">DECK B</h3>
                <div className="h-32 w-32 mx-auto mb-4 rounded-full bg-gradient-to-r from-gray-800 to-gray-900 ox-deck-shadow flex items-center justify-center">
                  <div className={`w-8 h-8 rounded-full ${decks[2]?.isPlaying ? 'bg-ox-success animate-spin' : 'bg-ox-primary'}`}></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Volume</span>
                    <span className="font-mono">{Math.round((channelConfigs[2]?.gain || 0.75) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={(channelConfigs[2]?.gain || 0.75) * 100}
                    onChange={(e) => setChannelGain(2, parseInt(e.target.value) / 100)}
                    className="w-full"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-8">LOW</span>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={channelConfigs[2]?.eq?.low || 0}
                        onChange={(e) => setChannelEQ(2, 'low', parseInt(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-8">MID</span>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={channelConfigs[2]?.eq?.mid || 0}
                        onChange={(e) => setChannelEQ(2, 'mid', parseInt(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-8">HI</span>
                      <input
                        type="range"
                        min="-20"
                        max="20"
                        value={channelConfigs[2]?.eq?.high || 0}
                        onChange={(e) => setChannelEQ(2, 'high', parseInt(e.target.value))}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Status Section */}
            <section className="h-[25vh] grid grid-cols-2 gap-4">
              {/* Gesture Status */}
              <div className="ox-surface p-4">
                <h3 className="text-lg font-display mb-4 text-ox-warning">GESTURE STATUS</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Gesture Control</span>
                    <span className={gestureEnabled ? 'text-ox-success' : 'text-gray-600'}>
                      {gestureEnabled ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Hands Detected</span>
                    <span className="font-mono">
                      {(gestureData?.leftHand ? 1 : 0) + (gestureData?.rightHand ? 1 : 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Active Controls</span>
                    <span className="font-mono">{controls.length}</span>
                  </div>
                  {controls.map((control, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-500">{control.hand} {control.type}</span>
                      <span className="font-mono">{Math.round(control.value * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Status */}
              <div className="ox-surface p-4">
                <h3 className="text-lg font-display mb-4 text-ox-success">SYSTEM</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Audio Engine</span>
                    <span className={isDJModeActive ? 'text-ox-success' : 'text-gray-600'}>
                      {isDJModeActive ? 'RUNNING' : 'STOPPED'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Latency</span>
                    <span className="font-mono">12ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">CPU Usage</span>
                    <span className="font-mono">15%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Frame Rate</span>
                    <span className="font-mono">60 FPS</span>
                  </div>
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