/**
 * Types for gesture mapping system
 * Defines mapping between gestures and audio controls
 */

// Audio control targets available for mapping
export interface AudioControlTarget {
  type: 'crossfader' | 'channel' | 'master' | 'effect';
  id: string;
  parameter: string;
  channel?: number; // For channel-specific controls
  minValue: number;
  maxValue: number;
  defaultValue: number;
  unit?: string;
  label: string;
}

// Gesture input types that can be mapped
export interface GestureInput {
  type: 'crossfader' | 'volume' | 'eq' | 'filter' | 'custom';
  id: string;
  label: string;
  description: string;
  parameters: string[]; // Available parameters (e.g., 'position', 'distance', 'angle')
  constraints?: {
    minConfidence?: number;
    requiresTwoHands?: boolean;
    handedness?: 'left' | 'right' | 'both';
  };
}

// Individual gesture-to-control mapping
export interface GestureMapping {
  id: string;
  name: string;
  enabled: boolean;

  // Input configuration
  gestureInput: {
    type: GestureInput['type'];
    parameter: string; // Which parameter of the gesture to use
    deadZone: number; // Minimum change required to trigger
    sensitivity: number; // Multiplier for gesture values (0.1 to 5.0)
  };

  // Output configuration
  audioTarget: AudioControlTarget;

  // Interpolation settings
  interpolation: {
    type: 'linear' | 'exponential' | 'logarithmic' | 'smooth';
    smoothing: number; // 0 to 1, amount of smoothing to apply
    invert: boolean; // Invert the mapping direction
  };

  // Conflict resolution
  priority: number; // Higher numbers have priority over lower
  exclusiveGroup?: string; // Mappings in same group are mutually exclusive

  // Calibration data
  calibration?: {
    minInput: number;
    maxInput: number;
    centerPoint?: number;
  };

  createdAt: number;
  updatedAt: number;
}

// Mapping preset that can be saved/loaded
export interface MappingPreset {
  id: string;
  name: string;
  description?: string;
  author?: string;
  version: string;
  mappings: GestureMapping[];
  globalSettings: {
    globalSensitivity: number;
    globalSmoothing: number;
    conflictResolution: 'priority' | 'average' | 'latest';
  };
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

// Real-time gesture mapping state
export interface MappingState {
  activePreset: string | null;
  mappings: GestureMapping[];
  activeMappings: Set<string>; // Currently active mapping IDs
  conflicts: Array<{
    mappingIds: string[];
    resolution: 'priority' | 'average' | 'disabled';
  }>;
  calibrationMode: boolean;
  calibrationTarget?: string; // Mapping ID being calibrated
}

// Available audio control definitions
export const AUDIO_CONTROLS: Record<string, AudioControlTarget[]> = {
  crossfader: [
    {
      type: 'crossfader',
      id: 'crossfader-position',
      parameter: 'position',
      minValue: -1,
      maxValue: 1,
      defaultValue: 0,
      unit: '',
      label: 'Crossfader Position'
    }
  ],
  channel: [
    {
      type: 'channel',
      id: 'channel-gain',
      parameter: 'gain',
      minValue: 0,
      maxValue: 1,
      defaultValue: 0.8,
      unit: '',
      label: 'Channel Volume'
    },
    {
      type: 'channel',
      id: 'channel-eq-low',
      parameter: 'eq.low',
      minValue: -26,
      maxValue: 26,
      defaultValue: 0,
      unit: 'dB',
      label: 'Low EQ'
    },
    {
      type: 'channel',
      id: 'channel-eq-mid',
      parameter: 'eq.mid',
      minValue: -26,
      maxValue: 26,
      defaultValue: 0,
      unit: 'dB',
      label: 'Mid EQ'
    },
    {
      type: 'channel',
      id: 'channel-eq-high',
      parameter: 'eq.high',
      minValue: -26,
      maxValue: 26,
      defaultValue: 0,
      unit: 'dB',
      label: 'High EQ'
    },
    {
      type: 'channel',
      id: 'channel-filter-freq',
      parameter: 'filterFreq',
      minValue: 20,
      maxValue: 20000,
      defaultValue: 1000,
      unit: 'Hz',
      label: 'Filter Frequency'
    }
  ],
  master: [
    {
      type: 'master',
      id: 'master-gain',
      parameter: 'gain',
      minValue: 0,
      maxValue: 1,
      defaultValue: 0.8,
      unit: '',
      label: 'Master Volume'
    }
  ]
};

// Available gesture inputs
export const GESTURE_INPUTS: GestureInput[] = [
  {
    type: 'crossfader',
    id: 'crossfader-gesture',
    label: 'Two-Hand Crossfader',
    description: 'Control crossfader with distance between two hands',
    parameters: ['position', 'handDistance'],
    constraints: {
      minConfidence: 0.7,
      requiresTwoHands: true,
      handedness: 'both'
    }
  },
  {
    type: 'volume',
    id: 'single-hand-height',
    label: 'Single Hand Height',
    description: 'Control parameters with vertical hand position',
    parameters: ['height', 'y'],
    constraints: {
      minConfidence: 0.6,
      requiresTwoHands: false
    }
  },
  {
    type: 'volume',
    id: 'single-hand-distance',
    label: 'Single Hand Distance',
    description: 'Control parameters with hand distance from center',
    parameters: ['distance', 'x'],
    constraints: {
      minConfidence: 0.6,
      requiresTwoHands: false
    }
  }
];

// Interpolation curve functions
export const INTERPOLATION_CURVES = {
  linear: (t: number) => t,
  exponential: (t: number) => t * t,
  logarithmic: (t: number) => Math.sqrt(t),
  smooth: (t: number) => t * t * (3 - 2 * t) // Smoothstep
};