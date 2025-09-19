'use client'

import dynamic from 'next/dynamic'
import { DJInterfaceProps } from '@/app/types/dj'
import AudioMixer from './AudioMixer'
import GestureControl from './GestureControl'
import TrackManager from './TrackManager'

const MixAssistantDashboard = dynamic(
  () => import('../AI/MixAssistantDashboard'),
  { ssr: false }
)

export default function DJInterface({ djState, djActions, gestureData }: DJInterfaceProps) {
  const handleHandsDetected = (hands: any[]) => {
    if (!djState.gestureEnabled) return

    // Convert Hand[] to HandResult[] format expected by updateGestures
    const handResults = hands.map(hand => ({
      landmarks: hand.landmarks,
      handedness: hand.handedness,
      confidence: hand.score
    }))

    gestureData.updateGestures(handResults)
    djActions.updateGestureControls(gestureData.controls)
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-b from-gray-900 to-black p-4">
      {/* Camera and AI Assistant Section */}
      <div className="flex gap-4 mb-4" style={{ height: '25vh' }}>
        <GestureControl
          cameraActive={djState.cameraActive}
          gestureEnabled={djState.gestureEnabled}
          onHandsDetected={handleHandsDetected}
        />
        <MixAssistantDashboard />
      </div>

      {/* Main DJ Interface */}
      <div className="flex-1 flex flex-col gap-4">
        <TrackManager
          decks={djState.decks}
          viewMode={djState.viewMode}
        />

        <AudioMixer
          viewMode={djState.viewMode}
          decks={djState.decks}
        />
      </div>
    </div>
  )
}