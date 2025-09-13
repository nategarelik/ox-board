'use client'

import { useEffect, useState } from 'react'

interface Hand {
  landmarks: { x: number; y: number; z: number }[]
  handedness: 'Left' | 'Right'
  score: number
}

interface GestureState {
  type: 'crossfader' | 'volume' | 'effect' | 'none'
  confidence: number
  value?: number // 0-1 range for gesture values
  leftHand?: boolean
  rightHand?: boolean
}

interface GestureIndicatorProps {
  hands: Hand[]
  className?: string
}

// Calculate distance between two hands
function calculateTwoHandDistance(leftHand?: Hand, rightHand?: Hand): number | null {
  if (!leftHand || !rightHand) return null

  // Use index finger tips (landmark 8) for distance calculation
  const leftIndex = leftHand.landmarks[8]
  const rightIndex = rightHand.landmarks[8]

  if (!leftIndex || !rightIndex) return null

  const dx = leftIndex.x - rightIndex.x
  const dy = leftIndex.y - rightIndex.y

  return Math.sqrt(dx * dx + dy * dy)
}

// Detect gesture based on hand positions
function detectGesture(hands: Hand[]): GestureState {
  if (hands.length === 0) {
    return { type: 'none', confidence: 0 }
  }

  const leftHand = hands.find(h => h.handedness === 'Left')
  const rightHand = hands.find(h => h.handedness === 'Right')

  // Two-hand crossfader gesture
  if (leftHand && rightHand) {
    const distance = calculateTwoHandDistance(leftHand, rightHand)

    if (distance !== null) {
      // Normalize distance to 0-1 range (adjust based on camera setup)
      const normalizedDistance = Math.max(0, Math.min(1, (distance - 0.1) / 0.6))

      return {
        type: 'crossfader',
        confidence: Math.min(leftHand.score, rightHand.score),
        value: normalizedDistance,
        leftHand: true,
        rightHand: true
      }
    }
  }

  // Single hand gestures (volume, effects)
  const primaryHand = hands[0]
  const wrist = primaryHand.landmarks[0]
  const middleTip = primaryHand.landmarks[12]

  if (wrist && middleTip) {
    // Vertical hand position for volume control
    const verticalPosition = 1 - wrist.y // Invert Y axis

    return {
      type: 'volume',
      confidence: primaryHand.score,
      value: Math.max(0, Math.min(1, verticalPosition)),
      leftHand: primaryHand.handedness === 'Left',
      rightHand: primaryHand.handedness === 'Right'
    }
  }

  return { type: 'none', confidence: 0 }
}

export default function GestureIndicator({ hands, className = '' }: GestureIndicatorProps) {
  const [gestureState, setGestureState] = useState<GestureState>({ type: 'none', confidence: 0 })
  const [smoothedValue, setSmoothedValue] = useState(0)

  // Update gesture detection
  useEffect(() => {
    const newGesture = detectGesture(hands)
    setGestureState(newGesture)
  }, [hands])

  // Smooth gesture values
  useEffect(() => {
    if (gestureState.value !== undefined) {
      const targetValue = gestureState.value
      setSmoothedValue(prev => {
        const smoothing = 0.7 // Smoothing factor (0-1, higher = smoother)
        return prev * smoothing + targetValue * (1 - smoothing)
      })
    }
  }, [gestureState.value])

  if (gestureState.type === 'none') {
    return null
  }

  const renderCrossfaderIndicator = () => (
    <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
          <span className="text-xs font-mono text-green-400">LEFT</span>
        </div>
        <div className="text-xs font-mono text-white">CROSSFADER</div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-red-400">RIGHT</span>
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
        </div>
      </div>

      {/* Crossfader visualization */}
      <div className="relative w-32 h-6 bg-gray-700 rounded-full">
        <div className="absolute inset-0 bg-gradient-to-r from-green-400 via-yellow-400 to-red-400 rounded-full opacity-30"></div>
        <div
          className="absolute top-1 w-4 h-4 bg-ox-primary rounded-full shadow-lg transition-all duration-100 ease-out border-2 border-white"
          style={{ left: `${smoothedValue * 100}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute inset-0 bg-ox-primary rounded-full animate-pulse"></div>
        </div>
      </div>

      <div className="mt-2 flex justify-between text-xs font-mono text-gray-400">
        <span>A</span>
        <span>{Math.round(smoothedValue * 100)}%</span>
        <span>B</span>
      </div>
    </div>
  )

  const renderVolumeIndicator = () => (
    <div className="bg-black/70 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className={`w-3 h-3 rounded-full ${gestureState.leftHand ? 'bg-green-400' : 'bg-red-400'}`}></div>
        <span className="text-xs font-mono text-white">VOLUME</span>
        <span className="text-xs font-mono text-gray-400">
          {gestureState.leftHand ? 'DECK A' : 'DECK B'}
        </span>
      </div>

      {/* Volume bar */}
      <div className="w-8 h-24 bg-gray-700 rounded-full relative">
        <div
          className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-ox-primary to-ox-accent rounded-full transition-all duration-100 ease-out"
          style={{ height: `${smoothedValue * 100}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-red-500 to-yellow-400 rounded-full opacity-80"></div>
        </div>
        <div className="absolute -right-8 top-0 h-full flex items-end">
          <span className="text-xs font-mono text-white transform rotate-90 origin-center whitespace-nowrap">
            {Math.round(smoothedValue * 100)}%
          </span>
        </div>
      </div>
    </div>
  )

  const renderConfidenceIndicator = () => (
    <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-sm rounded px-2 py-1">
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            gestureState.confidence > 0.8 ? 'bg-ox-success' :
            gestureState.confidence > 0.5 ? 'bg-ox-warning' : 'bg-ox-error'
          }`}
        ></div>
        <span className="text-xs font-mono text-white">
          {Math.round(gestureState.confidence * 100)}%
        </span>
      </div>
    </div>
  )

  return (
    <div className={`absolute bottom-4 left-4 ${className}`}>
      <div className="relative">
        {gestureState.type === 'crossfader' && renderCrossfaderIndicator()}
        {gestureState.type === 'volume' && renderVolumeIndicator()}
        {renderConfidenceIndicator()}
      </div>
    </div>
  )
}