'use client'

import dynamic from 'next/dynamic'
import { GestureControlProps } from '@/app/types/dj'

const CameraFeed = dynamic(
  () => import('../Camera/CameraFeed'),
  { ssr: false }
)

const GestureFeedback = dynamic(
  () => import('../GestureFeedback'),
  { ssr: false }
)


export default function GestureControl({
  cameraActive,
  gestureEnabled,
  onHandsDetected
}: GestureControlProps) {
  return (
    <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden relative">
      {cameraActive && (
        <CameraFeed onHandsDetected={onHandsDetected} />
      )}
      {!cameraActive && (
        <div className="flex items-center justify-center h-full text-gray-500">
          <div className="text-center">
            <p className="text-2xl mb-2">📷</p>
            <p>Camera Off</p>
          </div>
        </div>
      )}
    </div>
  )
}