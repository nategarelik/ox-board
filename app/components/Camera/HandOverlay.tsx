'use client'

import { useRef, useEffect, useCallback } from 'react'

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

interface HandOverlayProps {
  videoElement: HTMLVideoElement | null
  hands: Hand[]
  width?: number
  height?: number
  className?: string
  showConnections?: boolean
  showLandmarks?: boolean
  showLabels?: boolean
}

// MediaPipe hand landmark connections
const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index finger
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle finger
  [9, 10], [10, 11], [11, 12],
  // Ring finger
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [17, 18], [18, 19], [19, 20],
  // Palm connections
  [0, 17], [5, 9], [9, 13], [13, 17]
] as const

export default function HandOverlay({
  videoElement,
  hands,
  width = 1280,
  height = 720,
  className = '',
  showConnections = true,
  showLandmarks = true,
  showLabels = true
}: HandOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()

  // Draw hands with optimized rendering
  const drawHands = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !videoElement) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size if needed
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Skip if no hands detected
    if (!hands || hands.length === 0) return

    // Configure drawing styles
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    hands.forEach((hand, handIndex) => {
      const isLeft = hand.handedness === 'Left'
      const primaryColor = isLeft ? '#00FF00' : '#FF0000' // Green for left, red for right
      const secondaryColor = isLeft ? '#00CC00' : '#CC0000'

      // Draw connections first (behind landmarks)
      if (showConnections) {
        ctx.strokeStyle = primaryColor
        ctx.lineWidth = 2
        ctx.globalAlpha = 0.8

        HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
          const start = hand.landmarks[startIdx]
          const end = hand.landmarks[endIdx]

          if (start && end) {
            ctx.beginPath()
            ctx.moveTo(start.x * canvas.width, start.y * canvas.height)
            ctx.lineTo(end.x * canvas.width, end.y * canvas.height)
            ctx.stroke()
          }
        })
      }

      // Draw landmarks
      if (showLandmarks) {
        ctx.globalAlpha = 1.0

        hand.landmarks.forEach((landmark, landmarkIndex) => {
          const x = landmark.x * canvas.width
          const y = landmark.y * canvas.height

          // Different sizes for different landmark types
          let radius = 4
          if (landmarkIndex === 0) radius = 6 // Wrist
          if ([4, 8, 12, 16, 20].includes(landmarkIndex)) radius = 5 // Fingertips

          // Draw landmark with glow effect
          ctx.shadowColor = primaryColor
          ctx.shadowBlur = 6
          ctx.fillStyle = primaryColor

          ctx.beginPath()
          ctx.arc(x, y, radius, 0, 2 * Math.PI)
          ctx.fill()

          // Add inner highlight
          ctx.shadowBlur = 0
          ctx.fillStyle = '#FFFFFF'
          ctx.beginPath()
          ctx.arc(x, y, radius / 2, 0, 2 * Math.PI)
          ctx.fill()
        })
      }

      // Draw hand label
      if (showLabels && hand.landmarks[0]) {
        const wrist = hand.landmarks[0]
        const x = wrist.x * canvas.width
        const y = wrist.y * canvas.height - 30

        ctx.shadowBlur = 0
        ctx.fillStyle = primaryColor
        ctx.font = '12px JetBrains Mono, monospace'
        ctx.textAlign = 'center'

        const label = `${hand.handedness} (${Math.round(hand.score * 100)}%)`
        ctx.fillText(label, x, y)
      }
    })

    // Reset global alpha
    ctx.globalAlpha = 1.0
    ctx.shadowBlur = 0
  }, [hands, videoElement, width, height, showConnections, showLandmarks, showLabels])

  // Optimized animation loop
  const animate = useCallback(() => {
    drawHands()
    animationFrameRef.current = requestAnimationFrame(animate)
  }, [drawHands])

  // Start/stop animation based on hands presence
  useEffect(() => {
    if (hands && hands.length > 0) {
      // Start animation if not already running
      if (!animationFrameRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate)
      }
    } else {
      // Stop animation and clear canvas when no hands
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }

      // Clear canvas
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
    }

    // Cleanup animation frame on unmount
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = undefined
      }
    }
  }, [hands, animate])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`absolute top-0 left-0 w-full h-full pointer-events-none ${className}`}
      style={{ mixBlendMode: 'screen' }}
    />
  )
}