'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import useEnhancedDJStore from './stores/enhancedDjStoreWithGestures'
import { useGestures } from './hooks/useGestures'

// Dynamic imports to avoid SSR issues
const CameraFeed = dynamic(() => import('./components/Camera/CameraFeed'), { ssr: false })
const DeckPlayer = dynamic(() => import('./components/DJ/DeckPlayer'), { ssr: false })
const EnhancedMixer = dynamic(() => import('./components/DJ/EnhancedMixer'), { ssr: false })
const StemMixer = dynamic(() => import('./components/StemMixer'), { ssr: false })
const MixAssistantDashboard = dynamic(() => import('./components/AI/MixAssistantDashboard'), { ssr: false })
const GestureFeedback = dynamic(() => import('./components/GestureFeedback'), { ssr: false })

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)

  const {
    isDJModeActive,
    cameraActive,
    gestureEnabled,
    gestureMapperEnabled,
    decks,
    viewMode,
    initializeMixer,
    setDJModeActive,
    setCameraActive,
    setGestureEnabled,
    setViewMode,
    initializeGestureMapper,
    updateGestureControls
  } = useEnhancedDJStore()

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
    try {
      setDJModeActive(true)
      // Initialize mixer with user gesture (button click)
      await initializeMixer()
      console.log('Audio mixer initialized successfully')

      // Initialize gesture mapper for stem control
      await initializeGestureMapper()

      setCameraActive(true)
      setGestureEnabled(true)
    } catch (error) {
      console.error('Failed to start DJ mode:', error)
      setDJModeActive(false)
      alert('Failed to start audio. Please make sure to allow audio in your browser.')
    }
  }, [setDJModeActive, initializeMixer, initializeGestureMapper, setCameraActive, setGestureEnabled])

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
            <span className="text-sm text-gray-400 font-mono">v2.0.0</span>
          </div>

          <div className="flex items-center gap-6">
            {/* View Mode Selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('decks')}
                className={`px-3 py-1 rounded text-sm ${viewMode === 'decks' ? 'bg-ox-primary' : 'bg-gray-800'}`}
              >
                Decks
              </button>
              <button
                onClick={() => setViewMode('mixer')}
                className={`px-3 py-1 rounded text-sm ${viewMode === 'mixer' ? 'bg-ox-primary' : 'bg-gray-800'}`}
              >
                Mixer
              </button>
              <button
                onClick={() => setViewMode('stems')}
                className={`px-3 py-1 rounded text-sm ${viewMode === 'stems' ? 'bg-ox-primary' : 'bg-gray-800'}`}
              >
                Stems
              </button>
              <button
                onClick={() => setViewMode('effects')}
                className={`px-3 py-1 rounded text-sm ${viewMode === 'effects' ? 'bg-ox-primary' : 'bg-gray-800'}`}
              >
                Effects
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-green-500' : 'bg-gray-600'}`}></div>
              <span className="text-sm text-gray-400">
                {cameraActive ? 'Camera Active' : 'Camera Ready'}
              </span>
            </div>

            <button
              onClick={isDJModeActive ? handleStopDJMode : handleStartDJMode}
              className={`ox-button text-sm px-4 py-2 ${isDJModeActive ? 'bg-red-600 hover:bg-red-700' : ''}`}
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
              <div className="w-32 h-32 mx-auto mb-8 relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-ox-primary to-ox-accent animate-spin"></div>
                <div className="absolute inset-2 rounded-full bg-ox-background"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-16 h-16 text-ox-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
              </div>
              <h2 className="text-3xl font-display mb-2 text-ox-primary">OX BOARD</h2>
              <p className="text-gray-400">Loading DJ Platform...</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 p-4">
            {/* Camera/Gesture Feedback Section */}
            <section className="h-[25vh] mb-4 grid grid-cols-[2fr_1fr] gap-4">
              <div className="ox-surface p-4">
                {cameraActive ? (
                  <div className="relative h-full">
                    <CameraFeed
                      onHandsDetected={handleHandsDetected}
                      onCameraReady={() => console.log('Camera ready')}
                      onError={(error) => console.error('Camera error:', error)}
                    />
                    {gestureMapperEnabled && (
                      <div className="absolute top-2 right-2">
                        <GestureFeedback />
                      </div>
                    )}
                  </div>
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
              </div>

              {/* AI Mix Assistant */}
              <MixAssistantDashboard />
            </section>

            {/* Main DJ Interface based on view mode */}
            {viewMode === 'decks' && (
              <section className="grid grid-cols-[1fr_300px_1fr] gap-4 mb-4">
                <DeckPlayer deckId={0} />
                <EnhancedMixer />
                <DeckPlayer deckId={1} />
              </section>
            )}

            {viewMode === 'mixer' && (
              <section className="grid grid-cols-[1fr_400px_1fr] gap-4 mb-4">
                <DeckPlayer deckId={0} />
                <EnhancedMixer />
                <DeckPlayer deckId={1} />
              </section>
            )}

            {viewMode === 'stems' && (
              <section className="grid grid-cols-2 gap-4 mb-4">
                <StemMixer channel={0} showAdvancedControls={true} />
                <StemMixer channel={1} showAdvancedControls={true} />
              </section>
            )}

            {viewMode === 'effects' && (
              <section className="grid grid-cols-[1fr_2fr] gap-4 mb-4">
                <div className="ox-surface p-4">
                  <h3 className="text-lg font-display mb-4">Effects Rack</h3>
                  <div className="space-y-4">
                    {/* Effects controls would go here */}
                    <div className="text-gray-500 text-center py-8">
                      Effects visualization and controls
                    </div>
                  </div>
                </div>
                <div className="ox-surface p-4">
                  <h3 className="text-lg font-display mb-4">Visualizer</h3>
                  {/* Would render EffectVisualizer here */}
                  <div className="h-64 bg-gray-900 rounded flex items-center justify-center">
                    <span className="text-gray-600">Audio Visualization</span>
                  </div>
                </div>
              </section>
            )}

            {/* Stem Controls for all view modes */}
            {(viewMode === 'decks' || viewMode === 'mixer') && (
              <section className="grid grid-cols-2 gap-4">
                <StemMixer channel={0} className="h-[30vh]" />
                <StemMixer channel={1} className="h-[30vh]" />
              </section>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-gray-400">
          <p>OX Board © 2024 - Theta Chi, UW Madison</p>
          <p className="mt-1 font-mono text-xs">AI-Powered DJ Platform</p>
        </div>
      </footer>
    </main>
  )
}