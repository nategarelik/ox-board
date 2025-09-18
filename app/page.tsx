'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import useEnhancedDJStore from './stores/enhancedDjStoreWithGestures'
import { useGestures } from './hooks/useGestures'

// Dynamic imports for components
const DJInterface = dynamic(() => import('./components/DJ/DJInterface'), { ssr: false })
const TutorialOverlay = dynamic(() => import('./components/DJ/TutorialOverlay'), { ssr: false })
const LoadingScreen = dynamic(() => import('./components/DJ/LoadingScreen'), { ssr: false })
const Header = dynamic(() => import('./components/DJ/Header'), { ssr: false })
const WelcomeScreen = dynamic(() => import('./components/DJ/WelcomeScreen'), { ssr: false })
const Footer = dynamic(() => import('./components/DJ/Footer'), { ssr: false })

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [showTutorial, setShowTutorial] = useState(false)
  const [mounted, setMounted] = useState(false)
  const djStore = useEnhancedDJStore()
  const gestureData = useGestures()

  // Prevent SSR hydration issues
  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const handleStartDJMode = async () => {
    try {
      await djStore.initializeMixer()
      djStore.initializeGestureMapper()
      djStore.setDJModeActive(true)
      djStore.setCameraActive(true)
      djStore.setGestureEnabled(true)
    } catch (error) {
      console.error('Failed to initialize DJ mode:', error)
      alert('Please allow audio permissions in your browser to use DJ features.')
    }
  }

  const handleStopDJMode = () => {
    djStore.setDJModeActive(false)
    djStore.setCameraActive(false)
    djStore.setGestureEnabled(false)
    gestureData.reset()
  }

  if (!mounted) return null

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Header
        isDJModeActive={djStore.isDJModeActive}
        cameraActive={djStore.cameraActive}
        viewMode={djStore.viewMode}
        onViewModeChange={djStore.setViewMode}
        onStartDJ={handleStartDJMode}
        onStopDJ={handleStopDJMode}
        onShowTutorial={() => setShowTutorial(true)}
      />

      {djStore.isDJModeActive ? (
        <DJInterface
          djState={{
            isDJModeActive: djStore.isDJModeActive,
            cameraActive: djStore.cameraActive,
            gestureEnabled: djStore.gestureEnabled,
            gestureMapperEnabled: djStore.gestureMapperEnabled,
            decks: djStore.decks,
            viewMode: djStore.viewMode
          }}
          djActions={{
            initializeMixer: djStore.initializeMixer,
            setDJModeActive: djStore.setDJModeActive,
            setCameraActive: djStore.setCameraActive,
            setGestureEnabled: djStore.setGestureEnabled,
            setViewMode: djStore.setViewMode,
            initializeGestureMapper: djStore.initializeGestureMapper,
            updateGestureControls: djStore.updateGestureControls
          }}
          gestureData={gestureData}
        />
      ) : (
        <WelcomeScreen onStart={handleStartDJMode} />
      )}

      <TutorialOverlay
        isVisible={showTutorial}
        onClose={() => setShowTutorial(false)}
      />

      <Footer />
    </div>
  )
}