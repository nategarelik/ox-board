// Type definitions for DJ Interface components

export type ViewMode = 'decks' | 'mixer' | 'stems' | 'effects' | 'library'

export interface DJState {
  isDJModeActive: boolean
  cameraActive: boolean
  gestureEnabled: boolean
  gestureMapperEnabled: boolean
  decks: any[] // Replace with proper deck type when available
  viewMode: ViewMode
}

export interface DJActions {
  initializeMixer: () => Promise<void>
  setDJModeActive: (active: boolean) => void
  setCameraActive: (active: boolean) => void
  setGestureEnabled: (enabled: boolean) => void
  setViewMode: (mode: ViewMode) => void
  initializeGestureMapper: () => void
  updateGestureControls: (controls: any) => void
}

export interface GestureData {
  gestureData: any
  controls: any[]
  updateGestures: (hands: any) => void
  reset: () => void
}

export interface HandData {
  landmarks: any
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
  decks: any[]
}

export interface GestureControlProps {
  cameraActive: boolean
  gestureEnabled: boolean
  onHandsDetected: (hands: HandData[]) => void
}

export interface TrackManagerProps {
  decks: any[]
  viewMode: ViewMode
}

export interface TutorialOverlayProps {
  isVisible: boolean
  onClose: () => void
}