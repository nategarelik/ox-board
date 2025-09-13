import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';

// =============================================================================
// TYPES & INTERFACES
// =============================================================================

export interface EQBand {
  low: number;     // 20-250Hz, range: -26dB to +26dB
  mid: number;     // 250-4kHz, range: -26dB to +26dB
  high: number;    // 4k-20kHz, range: -26dB to +26dB
}

export interface FilterState {
  enabled: boolean;
  type: 'lowpass' | 'highpass' | 'bandpass';
  frequency: number;  // 20Hz to 20kHz
  resonance: number;  // 0.1 to 10
}

export interface EffectState {
  reverb: { enabled: boolean; roomSize: number; dampening: number; };
  delay: { enabled: boolean; time: number; feedback: number; };
  chorus: { enabled: boolean; frequency: number; depth: number; };
  distortion: { enabled: boolean; amount: number; oversample: string; };
}

export interface DeckState {
  // Audio Source
  track: {
    url: string | null;
    name: string;
    duration: number;
    loaded: boolean;
    loading: boolean;
    error: string | null;
  };

  // Transport Controls
  playing: boolean;
  paused: boolean;
  position: number;      // Current playback position in seconds
  cuePosition: number;   // Cue point position in seconds
  looping: boolean;
  loopStart: number;     // Loop start position in seconds
  loopEnd: number;       // Loop end position in seconds

  // Audio Controls
  volume: number;        // 0 to 1
  gain: number;          // -60dB to +12dB
  pitch: number;         // 0.92 to 1.08 (±8%)
  tempo: number;         // BPM
  keyshift: number;      // -12 to +12 semitones

  // EQ & Filtering
  eq: EQBand;
  filter: FilterState;

  // Effects
  effects: EffectState;

  // Visual/UI State
  waveform: Float32Array | null;
  beatGrid: number[];    // Beat positions in seconds
  bpm: number;          // Detected or set BPM
}

export interface MixerState {
  // Channel Controls
  channelA: {
    volume: number;      // 0 to 1
    gain: number;        // -60dB to +12dB
    muted: boolean;
    solo: boolean;
    cue: boolean;        // Headphone cue
  };

  channelB: {
    volume: number;
    gain: number;
    muted: boolean;
    solo: boolean;
    cue: boolean;
  };

  // Crossfader
  crossfader: {
    position: number;    // -1 (full A) to +1 (full B)
    curve: 'linear' | 'logarithmic' | 'exponential';
  };

  // Master Controls
  master: {
    volume: number;      // 0 to 1
    gain: number;        // -60dB to +12dB
    limiter: {
      enabled: boolean;
      threshold: number; // -20dB to 0dB
      release: number;   // 0.01s to 1s
    };
  };

  // Headphone/Cue
  cue: {
    volume: number;      // 0 to 1
    split: boolean;      // True: L=Cue, R=Master; False: Both=Mix
    mix: number;         // 0 (all cue) to 1 (all master)
  };
}

export interface PerformanceMetrics {
  // Audio Performance
  audioLatency: number;           // Current audio latency in ms
  bufferUnderruns: number;       // Count of audio dropouts
  cpuUsage: number;              // Current CPU usage %
  memoryUsage: number;           // Current memory usage MB

  // Timing
  lastUpdateTime: number;        // Timestamp of last metrics update
  framerate: number;             // Current UI framerate

  // Audio Context Info
  sampleRate: number;            // Audio context sample rate
  bufferSize: number;            // Audio buffer size
  contextState: 'suspended' | 'running' | 'closed';
}

export interface AudioStore {
  // Core State
  initialized: boolean;
  audioContext: AudioContext | null;

  // Deck States
  deckA: DeckState;
  deckB: DeckState;

  // Mixer State
  mixer: MixerState;

  // Performance Monitoring
  performance: PerformanceMetrics;

  // Settings
  settings: {
    sampleRate: number;          // 44100 or 48000
    bufferSize: number;          // 128, 256, 512, 1024
    autoGain: boolean;           // Auto-gain control
    crossfaderCurve: 'linear' | 'logarithmic' | 'exponential';
    beatSync: boolean;           // Auto beat sync between decks
  };

  // =============================================================================
  // ACTIONS
  // =============================================================================

  // Initialization
  initializeAudio: () => Promise<void>;
  cleanup: () => void;

  // Deck Actions
  loadTrack: (deck: 'A' | 'B', url: string, name?: string) => Promise<void>;
  play: (deck: 'A' | 'B') => void;
  pause: (deck: 'A' | 'B') => void;
  stop: (deck: 'A' | 'B') => void;
  seek: (deck: 'A' | 'B', position: number) => void;
  setCue: (deck: 'A' | 'B', position?: number) => void;
  goToCue: (deck: 'A' | 'B') => void;

  // Loop Controls
  setLoop: (deck: 'A' | 'B', start: number, end: number) => void;
  toggleLoop: (deck: 'A' | 'B') => void;
  clearLoop: (deck: 'A' | 'B') => void;

  // Audio Controls
  setVolume: (deck: 'A' | 'B', volume: number) => void;
  setGain: (deck: 'A' | 'B', gain: number) => void;
  setPitch: (deck: 'A' | 'B', pitch: number) => void;
  setTempo: (deck: 'A' | 'B', tempo: number) => void;
  setKeyshift: (deck: 'A' | 'B', keyshift: number) => void;

  // EQ Controls
  setEQ: (deck: 'A' | 'B', band: 'low' | 'mid' | 'high', value: number) => void;
  resetEQ: (deck: 'A' | 'B') => void;

  // Filter Controls
  setFilter: (deck: 'A' | 'B', filter: Partial<FilterState>) => void;
  toggleFilter: (deck: 'A' | 'B') => void;

  // Effect Controls
  setEffect: (deck: 'A' | 'B', effect: keyof EffectState, settings: any) => void;
  toggleEffect: (deck: 'A' | 'B', effect: keyof EffectState) => void;

  // Mixer Actions
  setCrossfader: (position: number) => void;
  setCrossfaderCurve: (curve: 'linear' | 'logarithmic' | 'exponential') => void;
  setChannelVolume: (channel: 'A' | 'B', volume: number) => void;
  setChannelGain: (channel: 'A' | 'B', gain: number) => void;
  toggleChannelMute: (channel: 'A' | 'B') => void;
  toggleChannelSolo: (channel: 'A' | 'B') => void;
  toggleChannelCue: (channel: 'A' | 'B') => void;

  // Master Controls
  setMasterVolume: (volume: number) => void;
  setMasterGain: (gain: number) => void;
  setLimiter: (settings: Partial<MixerState['master']['limiter']>) => void;

  // Cue/Headphone Controls
  setCueVolume: (volume: number) => void;
  setCueMix: (mix: number) => void;
  toggleCueSplit: () => void;

  // Performance Monitoring
  updatePerformanceMetrics: () => void;
  resetPerformanceCounters: () => void;

  // Settings
  updateSettings: (settings: Partial<AudioStore['settings']>) => void;
}

// =============================================================================
// DEFAULT STATES
// =============================================================================

const createDefaultDeckState = (): DeckState => ({
  track: {
    url: null,
    name: '',
    duration: 0,
    loaded: false,
    loading: false,
    error: null,
  },
  playing: false,
  paused: false,
  position: 0,
  cuePosition: 0,
  looping: false,
  loopStart: 0,
  loopEnd: 0,
  volume: 0.8,
  gain: 0,
  pitch: 1.0,
  tempo: 120,
  keyshift: 0,
  eq: {
    low: 0,
    mid: 0,
    high: 0,
  },
  filter: {
    enabled: false,
    type: 'lowpass',
    frequency: 1000,
    resonance: 1,
  },
  effects: {
    reverb: { enabled: false, roomSize: 0.5, dampening: 0.5 },
    delay: { enabled: false, time: 0.25, feedback: 0.3 },
    chorus: { enabled: false, frequency: 1.5, depth: 0.3 },
    distortion: { enabled: false, amount: 0.4, oversample: '4x' },
  },
  waveform: null,
  beatGrid: [],
  bpm: 120,
});

const createDefaultMixerState = (): MixerState => ({
  channelA: {
    volume: 0.8,
    gain: 0,
    muted: false,
    solo: false,
    cue: false,
  },
  channelB: {
    volume: 0.8,
    gain: 0,
    muted: false,
    solo: false,
    cue: false,
  },
  crossfader: {
    position: 0,
    curve: 'logarithmic',
  },
  master: {
    volume: 0.8,
    gain: 0,
    limiter: {
      enabled: true,
      threshold: -3,
      release: 0.1,
    },
  },
  cue: {
    volume: 0.8,
    split: false,
    mix: 0.5,
  },
});

const createDefaultPerformanceMetrics = (): PerformanceMetrics => ({
  audioLatency: 0,
  bufferUnderruns: 0,
  cpuUsage: 0,
  memoryUsage: 0,
  lastUpdateTime: Date.now(),
  framerate: 60,
  sampleRate: 48000,
  bufferSize: 128,
  contextState: 'suspended',
});

// =============================================================================
// ZUSTAND STORE
// =============================================================================

export const useAudioStore = create<AudioStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial State
        initialized: false,
        audioContext: null,
        deckA: createDefaultDeckState(),
        deckB: createDefaultDeckState(),
        mixer: createDefaultMixerState(),
        performance: createDefaultPerformanceMetrics(),
        settings: {
          sampleRate: 48000,
          bufferSize: 128,
          autoGain: false,
          crossfaderCurve: 'logarithmic',
          beatSync: false,
        },

        // =============================================================================
        // INITIALIZATION
        // =============================================================================

        initializeAudio: async () => {
          const state = get();
          if (state.initialized) return;

          try {
            const context = new AudioContext({
              sampleRate: state.settings.sampleRate,
              latencyHint: 'interactive',
            });

            // Resume context if suspended (required by browsers)
            if (context.state === 'suspended') {
              await context.resume();
            }

            set({
              audioContext: context,
              initialized: true,
              performance: {
                ...state.performance,
                contextState: context.state,
                sampleRate: context.sampleRate,
              }
            });

            // Start performance monitoring
            get().updatePerformanceMetrics();

          } catch (error) {
            console.error('Failed to initialize audio context:', error);
            throw error;
          }
        },

        cleanup: () => {
          const state = get();
          if (state.audioContext) {
            state.audioContext.close();
          }

          set({
            initialized: false,
            audioContext: null,
            performance: createDefaultPerformanceMetrics(),
          });
        },

        // =============================================================================
        // DECK ACTIONS
        // =============================================================================

        loadTrack: async (deck: 'A' | 'B', url: string, name = '') => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';

          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              track: {
                ...state[deckKey].track,
                loading: true,
                error: null,
              }
            }
          }));

          try {
            // This would integrate with the actual audio engine
            // For now, just update the state
            const duration = 240; // Mock duration

            set((state) => ({
              [deckKey]: {
                ...state[deckKey],
                track: {
                  url,
                  name,
                  duration,
                  loaded: true,
                  loading: false,
                  error: null,
                }
              }
            }));

          } catch (error) {
            set((state) => ({
              [deckKey]: {
                ...state[deckKey],
                track: {
                  ...state[deckKey].track,
                  loading: false,
                  error: error instanceof Error ? error.message : 'Load failed',
                }
              }
            }));
          }
        },

        play: (deck: 'A' | 'B') => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              playing: true,
              paused: false,
            }
          }));
        },

        pause: (deck: 'A' | 'B') => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              playing: false,
              paused: true,
            }
          }));
        },

        stop: (deck: 'A' | 'B') => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              playing: false,
              paused: false,
              position: 0,
            }
          }));
        },

        seek: (deck: 'A' | 'B', position: number) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              position: Math.max(0, Math.min(position, state[deckKey].track.duration)),
            }
          }));
        },

        setCue: (deck: 'A' | 'B', position?: number) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              cuePosition: position ?? state[deckKey].position,
            }
          }));
        },

        goToCue: (deck: 'A' | 'B') => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              position: state[deckKey].cuePosition,
            }
          }));
        },

        // =============================================================================
        // LOOP CONTROLS
        // =============================================================================

        setLoop: (deck: 'A' | 'B', start: number, end: number) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              loopStart: start,
              loopEnd: end,
            }
          }));
        },

        toggleLoop: (deck: 'A' | 'B') => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              looping: !state[deckKey].looping,
            }
          }));
        },

        clearLoop: (deck: 'A' | 'B') => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              looping: false,
              loopStart: 0,
              loopEnd: 0,
            }
          }));
        },

        // =============================================================================
        // AUDIO CONTROLS
        // =============================================================================

        setVolume: (deck: 'A' | 'B', volume: number) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              volume: Math.max(0, Math.min(1, volume)),
            }
          }));
        },

        setGain: (deck: 'A' | 'B', gain: number) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              gain: Math.max(-60, Math.min(12, gain)),
            }
          }));
        },

        setPitch: (deck: 'A' | 'B', pitch: number) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          // Pitch range: 0.92 to 1.08 (±8%)
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              pitch: Math.max(0.92, Math.min(1.08, pitch)),
            }
          }));
        },

        setTempo: (deck: 'A' | 'B', tempo: number) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              tempo: Math.max(40, Math.min(200, tempo)),
            }
          }));
        },

        setKeyshift: (deck: 'A' | 'B', keyshift: number) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              keyshift: Math.max(-12, Math.min(12, keyshift)),
            }
          }));
        },

        // =============================================================================
        // EQ CONTROLS
        // =============================================================================

        setEQ: (deck: 'A' | 'B', band: 'low' | 'mid' | 'high', value: number) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          // EQ range: -26dB to +26dB
          const clampedValue = Math.max(-26, Math.min(26, value));

          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              eq: {
                ...state[deckKey].eq,
                [band]: clampedValue,
              }
            }
          }));
        },

        resetEQ: (deck: 'A' | 'B') => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              eq: { low: 0, mid: 0, high: 0 },
            }
          }));
        },

        // =============================================================================
        // FILTER CONTROLS
        // =============================================================================

        setFilter: (deck: 'A' | 'B', filter: Partial<FilterState>) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              filter: {
                ...state[deckKey].filter,
                ...filter,
              }
            }
          }));
        },

        toggleFilter: (deck: 'A' | 'B') => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              filter: {
                ...state[deckKey].filter,
                enabled: !state[deckKey].filter.enabled,
              }
            }
          }));
        },

        // =============================================================================
        // EFFECT CONTROLS
        // =============================================================================

        setEffect: (deck: 'A' | 'B', effect: keyof EffectState, settings: any) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              effects: {
                ...state[deckKey].effects,
                [effect]: {
                  ...state[deckKey].effects[effect],
                  ...settings,
                }
              }
            }
          }));
        },

        toggleEffect: (deck: 'A' | 'B', effect: keyof EffectState) => {
          const deckKey = `deck${deck}` as 'deckA' | 'deckB';
          set((state) => ({
            [deckKey]: {
              ...state[deckKey],
              effects: {
                ...state[deckKey].effects,
                [effect]: {
                  ...state[deckKey].effects[effect],
                  enabled: !state[deckKey].effects[effect].enabled,
                }
              }
            }
          }));
        },

        // =============================================================================
        // MIXER ACTIONS
        // =============================================================================

        setCrossfader: (position: number) => {
          set((state) => ({
            mixer: {
              ...state.mixer,
              crossfader: {
                ...state.mixer.crossfader,
                position: Math.max(-1, Math.min(1, position)),
              }
            }
          }));
        },

        setCrossfaderCurve: (curve: 'linear' | 'logarithmic' | 'exponential') => {
          set((state) => ({
            mixer: {
              ...state.mixer,
              crossfader: {
                ...state.mixer.crossfader,
                curve,
              }
            }
          }));
        },

        setChannelVolume: (channel: 'A' | 'B', volume: number) => {
          const channelKey = `channel${channel}` as 'channelA' | 'channelB';
          set((state) => ({
            mixer: {
              ...state.mixer,
              [channelKey]: {
                ...state.mixer[channelKey],
                volume: Math.max(0, Math.min(1, volume)),
              }
            }
          }));
        },

        setChannelGain: (channel: 'A' | 'B', gain: number) => {
          const channelKey = `channel${channel}` as 'channelA' | 'channelB';
          set((state) => ({
            mixer: {
              ...state.mixer,
              [channelKey]: {
                ...state.mixer[channelKey],
                gain: Math.max(-60, Math.min(12, gain)),
              }
            }
          }));
        },

        toggleChannelMute: (channel: 'A' | 'B') => {
          const channelKey = `channel${channel}` as 'channelA' | 'channelB';
          set((state) => ({
            mixer: {
              ...state.mixer,
              [channelKey]: {
                ...state.mixer[channelKey],
                muted: !state.mixer[channelKey].muted,
              }
            }
          }));
        },

        toggleChannelSolo: (channel: 'A' | 'B') => {
          const channelKey = `channel${channel}` as 'channelA' | 'channelB';
          set((state) => ({
            mixer: {
              ...state.mixer,
              [channelKey]: {
                ...state.mixer[channelKey],
                solo: !state.mixer[channelKey].solo,
              }
            }
          }));
        },

        toggleChannelCue: (channel: 'A' | 'B') => {
          const channelKey = `channel${channel}` as 'channelA' | 'channelB';
          set((state) => ({
            mixer: {
              ...state.mixer,
              [channelKey]: {
                ...state.mixer[channelKey],
                cue: !state.mixer[channelKey].cue,
              }
            }
          }));
        },

        // =============================================================================
        // MASTER CONTROLS
        // =============================================================================

        setMasterVolume: (volume: number) => {
          set((state) => ({
            mixer: {
              ...state.mixer,
              master: {
                ...state.mixer.master,
                volume: Math.max(0, Math.min(1, volume)),
              }
            }
          }));
        },

        setMasterGain: (gain: number) => {
          set((state) => ({
            mixer: {
              ...state.mixer,
              master: {
                ...state.mixer.master,
                gain: Math.max(-60, Math.min(12, gain)),
              }
            }
          }));
        },

        setLimiter: (settings: Partial<MixerState['master']['limiter']>) => {
          set((state) => ({
            mixer: {
              ...state.mixer,
              master: {
                ...state.mixer.master,
                limiter: {
                  ...state.mixer.master.limiter,
                  ...settings,
                }
              }
            }
          }));
        },

        // =============================================================================
        // CUE/HEADPHONE CONTROLS
        // =============================================================================

        setCueVolume: (volume: number) => {
          set((state) => ({
            mixer: {
              ...state.mixer,
              cue: {
                ...state.mixer.cue,
                volume: Math.max(0, Math.min(1, volume)),
              }
            }
          }));
        },

        setCueMix: (mix: number) => {
          set((state) => ({
            mixer: {
              ...state.mixer,
              cue: {
                ...state.mixer.cue,
                mix: Math.max(0, Math.min(1, mix)),
              }
            }
          }));
        },

        toggleCueSplit: () => {
          set((state) => ({
            mixer: {
              ...state.mixer,
              cue: {
                ...state.mixer.cue,
                split: !state.mixer.cue.split,
              }
            }
          }));
        },

        // =============================================================================
        // PERFORMANCE MONITORING
        // =============================================================================

        updatePerformanceMetrics: () => {
          const state = get();
          const now = Date.now();

          // Calculate basic metrics
          const deltaTime = now - state.performance.lastUpdateTime;
          const framerate = deltaTime > 0 ? Math.round(1000 / deltaTime) : 60;

          // Get memory usage if available
          const memoryUsage = (performance as any).memory
            ? Math.round((performance as any).memory.usedJSHeapSize / 1048576)
            : 0;

          // Calculate audio latency (would be computed by audio engine)
          const audioLatency = state.audioContext?.baseLatency
            ? Math.round(state.audioContext.baseLatency * 1000)
            : 0;

          set((state) => ({
            performance: {
              ...state.performance,
              lastUpdateTime: now,
              framerate: Math.min(framerate, 60),
              memoryUsage,
              audioLatency,
              contextState: state.audioContext?.state || 'suspended',
            }
          }));

          // Schedule next update
          if (state.initialized) {
            setTimeout(() => get().updatePerformanceMetrics(), 1000);
          }
        },

        resetPerformanceCounters: () => {
          set((state) => ({
            performance: {
              ...state.performance,
              bufferUnderruns: 0,
              cpuUsage: 0,
            }
          }));
        },

        // =============================================================================
        // SETTINGS
        // =============================================================================

        updateSettings: (settings: Partial<AudioStore['settings']>) => {
          set((state) => ({
            settings: {
              ...state.settings,
              ...settings,
            }
          }));
        },
      }),
      {
        name: 'ox-board-audio-store',
        // Only persist user preferences, not runtime state
        partialize: (state) => ({
          mixer: {
            crossfader: state.mixer.crossfader,
            master: state.mixer.master,
            cue: state.mixer.cue,
          },
          settings: state.settings,
        }),
      }
    )
  )
);

// =============================================================================
// STORE SELECTORS (for performance optimization)
// =============================================================================

// Deck selectors
export const selectDeck = (deck: 'A' | 'B') => (state: AudioStore) =>
  deck === 'A' ? state.deckA : state.deckB;

export const selectDeckTrack = (deck: 'A' | 'B') => (state: AudioStore) =>
  deck === 'A' ? state.deckA.track : state.deckB.track;

export const selectDeckPlayback = (deck: 'A' | 'B') => (state: AudioStore) => ({
  playing: deck === 'A' ? state.deckA.playing : state.deckB.playing,
  paused: deck === 'A' ? state.deckA.paused : state.deckB.paused,
  position: deck === 'A' ? state.deckA.position : state.deckB.position,
});

// Mixer selectors
export const selectMixer = (state: AudioStore) => state.mixer;
export const selectCrossfader = (state: AudioStore) => state.mixer.crossfader;
export const selectChannel = (channel: 'A' | 'B') => (state: AudioStore) =>
  channel === 'A' ? state.mixer.channelA : state.mixer.channelB;

// Performance selectors
export const selectPerformance = (state: AudioStore) => state.performance;
export const selectAudioLatency = (state: AudioStore) => state.performance.audioLatency;

// Settings selectors
export const selectSettings = (state: AudioStore) => state.settings;