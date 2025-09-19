// Type definitions for DJ Interface components

import { GestureControl } from '../hooks/useGestures';
import { HandResult } from '../lib/gesture/recognition';
import { Point2D } from '../lib/gesture/smoothing';
import type { Deck } from '../stores/enhancedDjStoreWithGestures';

export type ViewMode = 'decks' | 'mixer' | 'stems' | 'effects' | 'library'

// Re-export Deck from the store to ensure consistency
export type { Deck };

export interface DJState {
  isDJModeActive: boolean
  cameraActive: boolean
  gestureEnabled: boolean
  gestureMapperEnabled: boolean
  decks: Deck[]
  viewMode: ViewMode
}

export interface DJActions {
  initializeMixer: () => Promise<void>
  setDJModeActive: (active: boolean) => void
  setCameraActive: (active: boolean) => void
  setGestureEnabled: (enabled: boolean) => void
  setViewMode: (mode: ViewMode) => void
  initializeGestureMapper: () => void
  updateGestureControls: (controls: GestureControl[]) => void
}

export interface GestureData {
  gestureData: object | null // Legacy field - consider removing
  controls: GestureControl[]
  updateGestures: (hands: HandResult[]) => void
  reset: () => void
}

export interface HandData {
  landmarks: Point2D[]
  handedness: 'Left' | 'Right'
  score: number
}

export interface DJInterfaceProps {
  djState: DJState
  djActions: DJActions
  gestureData: GestureData
}

export interface AudioMixerProps {
  viewMode: ViewMode
  decks: Deck[]
}

export interface GestureControlProps {
  cameraActive: boolean
  gestureEnabled: boolean
  onHandsDetected: (hands: HandData[]) => void
}

export interface TrackManagerProps {
  decks: Deck[]
  viewMode: ViewMode
}

export interface TutorialOverlayProps {
  isVisible: boolean
  onClose: () => void
}