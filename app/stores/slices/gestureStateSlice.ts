import type { StateCreator } from "zustand";
import type {
  GestureState,
  EnhancedStemPlayerState,
} from "../../types/enhanced-state";
import type { HandResult } from "../../lib/gesture/recognition";

export interface GestureStateSlice extends GestureState {
  // Gesture actions
  updateGesture: (
    leftHand: HandResult | null,
    rightHand: HandResult | null,
  ) => void;
  addGestureHistory: (entry: GestureState["history"][0]) => void;
  startGestureCalibration: (gesture: string) => void;
  stopGestureCalibration: () => void;
  addCalibrationSample: (
    sample: GestureState["calibration"]["samples"][0],
  ) => void;
  updateGestureMapping: (
    mappingId: string,
    mapping: Partial<GestureState["mappings"][string]>,
  ) => void;
  updateGesturePerformance: (
    metrics: Partial<GestureState["performance"]>,
  ) => void;

  // Gesture recording actions
  startGestureRecording: () => void;
  stopGestureRecording: () => void;
  setGesturePlaybackSpeed: (speed: number) => void;
  setGesturePlaybackIndex: (index: number) => void;

  // Utility actions
  clearGestureHistory: () => void;
  resetGestureCalibration: () => void;
  resetGestureMappings: () => void;
}

const initialCurrentGesture = {
  leftHand: null,
  rightHand: null,
  confidence: 0,
  timestamp: 0,
};

const initialCalibrationState = {
  isCalibrating: false,
  samples: [],
  baseline: {},
};

const initialMappingsState: GestureState["mappings"] = {
  // Default volume control mappings
  "volume-drums": {
    gesture: "fist",
    controlType: "volume",
    targetStem: "drums",
    sensitivity: 1.0,
    deadzone: 0.1,
    smoothing: 0.3,
  },
  "volume-bass": {
    gesture: "open_hand",
    controlType: "volume",
    targetStem: "bass",
    sensitivity: 1.0,
    deadzone: 0.1,
    smoothing: 0.3,
  },
  "volume-melody": {
    gesture: "thumbs_up",
    controlType: "volume",
    targetStem: "melody",
    sensitivity: 1.0,
    deadzone: 0.1,
    smoothing: 0.3,
  },
  "volume-vocals": {
    gesture: "peace",
    controlType: "volume",
    targetStem: "vocals",
    sensitivity: 1.0,
    deadzone: 0.1,
    smoothing: 0.3,
  },
  crossfader: {
    gesture: "pointing",
    controlType: "crossfade",
    targetStem: "crossfader",
    sensitivity: 1.0,
    deadzone: 0.05,
    smoothing: 0.2,
  },
  "master-volume": {
    gesture: "pinch",
    controlType: "volume",
    targetStem: "master",
    sensitivity: 1.0,
    deadzone: 0.1,
    smoothing: 0.3,
  },
};

const initialPerformanceState = {
  averageLatency: 0,
  frameRate: 0,
  droppedFrames: 0,
  gestureAccuracy: 0,
  processingTime: 0,
};

const initialRecordingState = {
  isRecording: false,
  recordedGestures: [],
  playback: {
    isPlaying: false,
    speed: 1.0,
    currentIndex: 0,
  },
};

const initialGestureHistory: GestureState["history"] = [];

export const createGestureStateSlice: StateCreator<
  EnhancedStemPlayerState,
  [],
  [],
  GestureStateSlice
> = (set, get) => ({
  // Initial state
  current: { ...initialCurrentGesture },
  history: [...initialGestureHistory],
  calibration: { ...initialCalibrationState },
  mappings: { ...initialMappingsState },
  performance: { ...initialPerformanceState },
  recording: { ...initialRecordingState },

  // Gesture actions
  updateGesture: (leftHand, rightHand) => {
    const now = performance.now();
    const confidence =
      leftHand && rightHand
        ? (leftHand.confidence + rightHand.confidence) / 2
        : leftHand?.confidence || rightHand?.confidence || 0;

    set((state) => ({
      gesture: {
        ...state.gesture,
        current: {
          leftHand,
          rightHand,
          confidence,
          timestamp: now,
        },
      },
    }));

    // Add to history if confidence is high enough
    if (confidence > 0.5) {
      const gestureEntry = {
        timestamp: now,
        leftHand,
        rightHand,
        gesture: "unknown", // Would be determined by gesture recognition
        confidence,
      };

      set((state) => ({
        gesture: {
          ...state.gesture,
          history: [...state.gesture.history.slice(-99), gestureEntry], // Keep last 100 entries
        },
      }));
    }
  },

  addGestureHistory: (entry) => {
    set((state) => ({
      gesture: {
        ...state.gesture,
        history: [...state.gesture.history.slice(-99), entry], // Keep last 100 entries
      },
    }));
  },

  startGestureCalibration: (gesture) => {
    set((state) => ({
      gesture: {
        ...state.gesture,
        calibration: {
          ...state.gesture.calibration,
          isCalibrating: true,
          samples: [],
        },
      },
    }));
  },

  stopGestureCalibration: () => {
    const { samples } = get().gesture.calibration;

    if (samples.length > 0) {
      // Calculate baseline from samples
      const firstSample = samples[0];
      const landmarks = firstSample.landmarks;

      // Calculate average landmarks for each landmark point
      const avgLandmarks: number[] = [];
      for (let pointIndex = 0; pointIndex < landmarks.length; pointIndex++) {
        let sum = 0;
        for (const sample of samples) {
          const landmarkValues = sample.landmarks[pointIndex];
          // If landmarkValues is an array, take the first value (x coordinate typically)
          sum += Array.isArray(landmarkValues)
            ? landmarkValues[0]
            : landmarkValues;
        }
        avgLandmarks[pointIndex] = sum / samples.length;
      }

      // Calculate average confidence (using a default since samples don't have confidence)
      const avgConfidence = 0.8;

      set((state) => ({
        gesture: {
          ...state.gesture,
          calibration: {
            ...state.gesture.calibration,
            isCalibrating: false,
            baseline: {
              ...state.gesture.calibration.baseline,
              [firstSample.gesture]: {
                landmarks: [avgLandmarks],
                confidence: avgConfidence,
              },
            },
          },
        },
      }));
    } else {
      set((state) => ({
        gesture: {
          ...state.gesture,
          calibration: {
            ...state.gesture.calibration,
            isCalibrating: false,
          },
        },
      }));
    }
  },

  addCalibrationSample: (sample) => {
    set((state) => ({
      gesture: {
        ...state.gesture,
        calibration: {
          ...state.gesture.calibration,
          samples: [...state.gesture.calibration.samples.slice(-49), sample], // Keep last 50 samples
        },
      },
    }));
  },

  updateGestureMapping: (mappingId, mapping) => {
    set((state) => ({
      gesture: {
        ...state.gesture,
        mappings: {
          ...state.gesture.mappings,
          [mappingId]: {
            ...state.gesture.mappings[mappingId],
            ...mapping,
          },
        },
      },
    }));
  },

  updateGesturePerformance: (metrics) => {
    set((state) => ({
      gesture: {
        ...state.gesture,
        performance: {
          ...state.gesture.performance,
          ...metrics,
        },
      },
    }));
  },

  // Gesture recording actions
  startGestureRecording: () => {
    set((state) => ({
      gesture: {
        ...state.gesture,
        recording: {
          ...state.gesture.recording,
          isRecording: true,
          recordedGestures: [],
        },
      },
    }));
  },

  stopGestureRecording: () => {
    set((state) => ({
      gesture: {
        ...state.gesture,
        recording: {
          ...state.gesture.recording,
          isRecording: false,
        },
      },
    }));
  },

  setGesturePlaybackSpeed: (speed) => {
    set((state) => ({
      gesture: {
        ...state.gesture,
        recording: {
          ...state.gesture.recording,
          playback: {
            ...state.gesture.recording.playback,
            speed: Math.max(0.1, Math.min(5.0, speed)),
          },
        },
      },
    }));
  },

  setGesturePlaybackIndex: (index) => {
    set((state) => ({
      gesture: {
        ...state.gesture,
        recording: {
          ...state.gesture.recording,
          playback: {
            ...state.gesture.recording.playback,
            currentIndex: Math.max(
              0,
              Math.min(
                state.gesture.recording.recordedGestures.length - 1,
                index,
              ),
            ),
          },
        },
      },
    }));
  },

  // Utility actions
  clearGestureHistory: () => {
    set((state) => ({
      gesture: {
        ...state.gesture,
        history: [],
      },
    }));
  },

  resetGestureCalibration: () => {
    set((state) => ({
      gesture: {
        ...state.gesture,
        calibration: { ...initialCalibrationState },
      },
    }));
  },

  resetGestureMappings: () => {
    set((state) => ({
      gesture: {
        ...state.gesture,
        mappings: { ...initialMappingsState },
      },
    }));
  },
});
