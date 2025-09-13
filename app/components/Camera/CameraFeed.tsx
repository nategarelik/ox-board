'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Hands } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'
import HandOverlay from './HandOverlay'

interface HandLandmark {
  x: number
  y: number
  z: number
}

interface Hand {
  landmarks: HandLandmark[]
  handedness: 'Left' | 'Right'
  score: number
}

interface CameraFeedProps {
  onHandsDetected?: (hands: Hand[]) => void
  onCameraReady?: () => void
  onError?: (error: string) => void
  width?: number
  height?: number
  showHandOverlay?: boolean
  className?: string
}

export default function CameraFeed({
  onHandsDetected,
  onCameraReady,
  onError,
  width = 1280,
  height = 720,
  showHandOverlay = true,
  className = ''
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const handsRef = useRef<Hands | null>(null)
  const cameraRef = useRef<Camera | null>(null)
  const frameCountRef = useRef(0)
  const lastFpsUpdateRef = useRef(Date.now())

  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detectedHands, setDetectedHands] = useState<Hand[]>([])
  const [fps, setFps] = useState(0)

  // MediaPipe configuration optimized for performance
  const handsConfig = {
    locateFile: (file: string) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    }
  }

  // Performance monitoring
  const updateFps = useCallback(() => {
    frameCountRef.current++
    const now = Date.now()
    const elapsed = now - lastFpsUpdateRef.current

    if (elapsed >= 1000) {
      const currentFps = Math.round((frameCountRef.current * 1000) / elapsed)
      setFps(currentFps)
      frameCountRef.current = 0
      lastFpsUpdateRef.current = now
    }
  }, [])

  // Initialize MediaPipe Hands with optimized settings
  const initializeMediaPipe = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      if (!videoRef.current) {
        throw new Error('Video element not found')
      }

      // Create optimized Hands instance
      const hands = new Hands(handsConfig)

      // Configure hands detection for optimal performance
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1, // Full model for accuracy
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
        selfieMode: true, // Mirror image for natural interaction
      })

      // Set up optimized results callback
      hands.onResults((results) => {
        updateFps()

        const handsData: Hand[] = []

        if (results.multiHandLandmarks && results.multiHandedness) {
          for (let i = 0; i < results.multiHandLandmarks.length; i++) {
            const landmarks = results.multiHandLandmarks[i]
            const handedness = results.multiHandedness[i]

            if (landmarks && handedness) {
              handsData.push({
                landmarks: landmarks.map(landmark => ({
                  x: landmark.x,
                  y: landmark.y,
                  z: landmark.z
                })),
                handedness: handedness.label === 'Left' ? 'Left' : 'Right',
                score: handedness.score || 0
              })
            }
          }
        }

        setDetectedHands(handsData)
        onHandsDetected?.(handsData)
      })

      // Create optimized camera instance
      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (hands && videoRef.current) {
            await hands.send({ image: videoRef.current })
          }
        },
        width,
        height,
        facingMode: 'user'
      })

      handsRef.current = hands
      cameraRef.current = camera

      // Start camera with error handling
      await camera.start()

      setIsInitialized(true)
      setIsLoading(false)
      onCameraReady?.()

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize camera'
      console.error('MediaPipe initialization error:', err)
      setError(errorMessage)
      setIsLoading(false)
      onError?.(errorMessage)
    }
  }, [onHandsDetected, onCameraReady, onError, updateFps, width, height])

  // Initialize on mount
  useEffect(() => {
    initializeMediaPipe()

    // Cleanup on unmount
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop()
      }
      if (handsRef.current) {
        handsRef.current.close()
      }
    }
  }, [initializeMediaPipe])

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full bg-black rounded-lg overflow-hidden ${className}`}
    >
      {/* Video element for MediaPipe processing */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
        style={{ transform: 'scaleX(-1)' }} // Mirror the video for natural interaction
      />

      {/* Hand overlay */}
      {showHandOverlay && isInitialized && (
        <HandOverlay
          videoElement={videoRef.current}
          hands={detectedHands}
          width={width}
          height={height}
        />
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-ox-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <div className="absolute inset-0 border-4 border-ox-primary rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-4 border-ox-accent rounded-full animate-spin animation-delay-150"></div>
            </div>
            <p className="text-ox-primary font-mono text-sm mb-2">Initializing Camera...</p>
            <p className="text-gray-400 text-xs">Setting up MediaPipe hands tracking</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-ox-error/20 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center max-w-sm mx-auto p-4">
            <div className="w-12 h-12 mx-auto mb-4">
              <svg className="w-full h-full text-ox-error" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-ox-error font-bold mb-2">Camera Error</h3>
            <p className="text-ox-error text-sm mb-4">{error}</p>
            <button
              onClick={initializeMediaPipe}
              className="ox-button text-sm px-4 py-2 bg-ox-error hover:bg-red-600"
            >
              Retry Camera
            </button>
          </div>
        </div>
      )}

      {/* Status indicators */}
      {isInitialized && !error && (
        <>
          {/* Hand tracking status */}
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
            <div className={`w-2 h-2 rounded-full ${detectedHands.length > 0 ? 'bg-ox-success animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-xs font-mono text-white">
              {detectedHands.length === 0 ? 'No Hands' : `${detectedHands.length} Hand${detectedHands.length > 1 ? 's' : ''}`}
            </span>
          </div>

          {/* Performance indicator */}
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
            <span className={`text-xs font-mono ${fps >= 30 ? 'text-ox-success' : fps >= 15 ? 'text-ox-warning' : 'text-ox-error'}`}>
              {fps} FPS
            </span>
          </div>

          {/* Hand details */}
          {detectedHands.length > 0 && (
            <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="text-xs font-mono space-y-1">
                {detectedHands.map((hand, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${hand.handedness === 'Left' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-white">
                      {hand.handedness} ({Math.round(hand.score * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}