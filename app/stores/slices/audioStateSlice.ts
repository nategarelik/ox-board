import type { StateCreator } from "zustand";
import type {
  AudioState,
  StemPlayerActions,
  EnhancedStemPlayerState,
} from "../../types/enhanced-state";

export interface AudioStateSlice extends AudioState {
  // Audio actions
  setStemVolume: (stemId: keyof AudioState["stems"], volume: number) => void;
  setStemMute: (stemId: keyof AudioState["mute"], muted: boolean) => void;
  setStemSolo: (stemId: keyof AudioState["solo"], solo: boolean) => void;
  setStemEQ: (
    stemId: keyof AudioState["eq"],
    band: "low" | "mid" | "high",
    value: number,
  ) => void;
  setStemPan: (stemId: keyof AudioState["pan"], pan: number) => void;
  setStemPlaybackRate: (
    stemId: keyof AudioState["playbackRate"],
    rate: number,
  ) => void;
  setStemMix: (mix: number) => void;

  // Playback actions
  setPlaybackState: (
    state: AudioState["playback"]["isPlaying"] extends boolean
      ? "playing" | "paused" | "stopped" | "loading" | "idle"
      : never,
  ) => void;
  setPlaybackTime: (time: number) => void;
  setPlaybackRate: (rate: number) => void;
  toggleLoop: () => void;

  // Analysis actions
  updateAnalysis: (analysis: AudioState["analysis"]) => void;
  updateBufferState: (buffers: Partial<AudioState["buffers"]>) => void;

  // Effects actions
  setEffectParam: (
    effect: keyof AudioState["effects"],
    param: string,
    value: any,
  ) => void;
  toggleEffect: (effect: keyof AudioState["effects"]) => void;
  resetEffects: () => void;

  // Recording actions
  startRecording: () => void;
  stopRecording: () => void;
  updateRecordingDuration: (duration: number) => void;

  // Stream health actions
  updateStreamHealth: (health: Partial<AudioState["streamHealth"]>) => void;
}

const initialStemsState = {
  drums: 0.75,
  bass: 0.75,
  melody: 0.75,
  vocals: 0.75,
  original: 0.75,
};

const initialMuteState = {
  drums: false,
  bass: false,
  melody: false,
  vocals: false,
  original: false,
};

const initialSoloState = {
  drums: false,
  bass: false,
  melody: false,
  vocals: false,
  original: false,
};

const initialEQState = {
  drums: { low: 0, mid: 0, high: 0 },
  bass: { low: 0, mid: 0, high: 0 },
  melody: { low: 0, mid: 0, high: 0 },
  vocals: { low: 0, mid: 0, high: 0 },
  original: { low: 0, mid: 0, high: 0 },
};

const initialPanState = {
  drums: 0,
  bass: 0,
  melody: 0,
  vocals: 0,
  original: 0,
};

const initialPlaybackRateState = {
  drums: 1.0,
  bass: 1.0,
  melody: 1.0,
  vocals: 1.0,
  original: 1.0,
};

const initialEffectsState = {
  reverb: {
    enabled: false,
    roomSize: 0.5,
    dampening: 0.5,
    wet: 0.3,
  },
  delay: {
    enabled: false,
    delayTime: 0.25,
    feedback: 0.3,
    wet: 0.2,
  },
  filter: {
    enabled: false,
    frequency: 1000,
    resonance: 1,
    type: "lowpass" as const,
  },
  distortion: {
    enabled: false,
    amount: 0.5,
    tone: 0.5,
  },
  compressor: {
    enabled: false,
    threshold: -24,
    ratio: 4,
    attack: 0.003,
    release: 0.25,
  },
};

const initialPlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  position: 0,
  playbackRate: 1.0,
  loop: false,
};

const initialBufferState = {
  loading: false,
};

const initialRecordingState = {
  isRecording: false,
  recordedStems: {},
  duration: 0,
};

const initialStreamHealthState = {
  bufferHealth: 1.0,
  latency: 0,
  droppedFrames: 0,
  underruns: 0,
};

export const createAudioStateSlice: StateCreator<
  EnhancedStemPlayerState,
  [],
  [],
  AudioStateSlice
> = (set, get) => ({
  // Initial state
  stems: { ...initialStemsState },
  mute: { ...initialMuteState },
  solo: { ...initialSoloState },
  eq: { ...initialEQState },
  pan: { ...initialPanState },
  playbackRate: { ...initialPlaybackRateState },
  mix: 0.5,

  playback: { ...initialPlaybackState },
  analysis: null,
  buffers: { ...initialBufferState },
  effects: { ...initialEffectsState },
  recording: { ...initialRecordingState },
  streamHealth: { ...initialStreamHealthState },

  // Stem control actions
  setStemVolume: (stemId, volume) => {
    const clampedVolume = Math.max(0, Math.min(1, volume));

    // Volume throttling - ignore small changes to prevent update storms
    const currentVolume = get().audio.stems[stemId];
    if (Math.abs(currentVolume - clampedVolume) < 0.01) {
      return;
    }

    set((state) => ({
      audio: {
        ...state.audio,
        stems: {
          ...state.audio.stems,
          [stemId]: clampedVolume,
        },
        mute: {
          ...state.audio.mute,
          [stemId]:
            clampedVolume <= 0.001
              ? true
              : clampedVolume > 0.001
                ? false
                : state.audio.mute[stemId],
        },
      },
    }));
  },

  setStemMute: (stemId, muted) => {
    set((state) => ({
      audio: {
        ...state.audio,
        mute: {
          ...state.audio.mute,
          [stemId]: muted,
        },
        solo: {
          ...state.audio.solo,
          [stemId]: muted ? false : state.audio.solo[stemId],
        },
      },
    }));
  },

  setStemSolo: (stemId, solo) => {
    set((state) => {
      const newSolo = { ...state.audio.solo, [stemId]: solo };
      const newMute = { ...state.audio.mute };

      if (solo) {
        // When soloing a stem, mute all others
        Object.keys(newMute).forEach((key) => {
          newMute[key as keyof AudioState["mute"]] = key !== stemId;
        });
      } else {
        // When un-soloing, unmute all
        Object.keys(newMute).forEach((key) => {
          newMute[key as keyof AudioState["mute"]] = false;
        });
      }

      return {
        audio: {
          ...state.audio,
          mute: newMute,
          solo: newSolo,
        },
      };
    });
  },

  setStemEQ: (stemId, band, value) => {
    const clampedValue = Math.max(-20, Math.min(20, value));

    set((state) => ({
      audio: {
        ...state.audio,
        eq: {
          ...state.audio.eq,
          [stemId]: {
            ...state.audio.eq[stemId],
            [band]: clampedValue,
          },
        },
      },
    }));
  },

  setStemPan: (stemId, pan) => {
    const clampedPan = Math.max(-1, Math.min(1, pan));

    set((state) => ({
      audio: {
        ...state.audio,
        pan: {
          ...state.audio.pan,
          [stemId]: clampedPan,
        },
      },
    }));
  },

  setStemPlaybackRate: (stemId, rate) => {
    const clampedRate = Math.max(0.25, Math.min(4.0, rate));

    set((state) => ({
      audio: {
        ...state.audio,
        playbackRate: {
          ...state.audio.playbackRate,
          [stemId]: clampedRate,
        },
      },
    }));
  },

  setStemMix: (mix) => {
    const clampedMix = Math.max(0, Math.min(1, mix));

    set((state) => ({
      audio: {
        ...state.audio,
        mix: clampedMix,
      },
    }));
  },

  // Playback actions
  setPlaybackState: (playbackState) => {
    set((state) => ({
      audio: {
        ...state.audio,
        playback: {
          ...state.audio.playback,
          isPlaying: playbackState === "playing",
        },
      },
    }));
  },

  setPlaybackTime: (time) => {
    set((state) => ({
      audio: {
        ...state.audio,
        playback: {
          ...state.audio.playback,
          currentTime: Math.max(0, time),
          position:
            state.audio.playback.duration > 0
              ? time / state.audio.playback.duration
              : 0,
        },
      },
    }));
  },

  setPlaybackRate: (rate) => {
    const clampedRate = Math.max(0.25, Math.min(4.0, rate));

    set((state) => ({
      audio: {
        ...state.audio,
        playback: {
          ...state.audio.playback,
          playbackRate: clampedRate,
        },
      },
    }));
  },

  toggleLoop: () => {
    set((state) => ({
      audio: {
        ...state.audio,
        playback: {
          ...state.audio.playback,
          loop: !state.audio.playback.loop,
        },
      },
    }));
  },

  // Analysis actions
  updateAnalysis: (analysis) => {
    set((state) => ({
      audio: {
        ...state.audio,
        analysis,
      },
    }));
  },

  updateBufferState: (buffers) => {
    set((state) => ({
      audio: {
        ...state.audio,
        buffers: { ...state.audio.buffers, ...buffers },
      },
    }));
  },

  // Effects actions
  setEffectParam: (effect, param, value) => {
    set((state) => {
      const currentEffect = state.audio.effects[effect];
      if (!currentEffect || !(param in currentEffect)) {
        return state;
      }

      return {
        audio: {
          ...state.audio,
          effects: {
            ...state.audio.effects,
            [effect]: {
              ...currentEffect,
              [param]: value,
            },
          },
        },
      };
    });
  },

  toggleEffect: (effect) => {
    set((state) => ({
      audio: {
        ...state.audio,
        effects: {
          ...state.audio.effects,
          [effect]: {
            ...state.audio.effects[effect],
            enabled: !state.audio.effects[effect].enabled,
          },
        },
      },
    }));
  },

  resetEffects: () => {
    set((state) => ({
      audio: {
        ...state.audio,
        effects: { ...initialEffectsState },
      },
    }));
  },

  // Recording actions
  startRecording: () => {
    set((state) => ({
      audio: {
        ...state.audio,
        recording: {
          isRecording: true,
          duration: 0,
          recordedStems: {},
        },
      },
    }));
  },

  stopRecording: () => {
    set((state) => ({
      audio: {
        ...state.audio,
        recording: {
          ...state.audio.recording,
          isRecording: false,
        },
      },
    }));
  },

  updateRecordingDuration: (duration) => {
    set((state) => ({
      audio: {
        ...state.audio,
        recording: {
          ...state.audio.recording,
          duration,
        },
      },
    }));
  },

  // Stream health actions
  updateStreamHealth: (health) => {
    set((state) => ({
      audio: {
        ...state.audio,
        streamHealth: { ...state.audio.streamHealth, ...health },
      },
    }));
  },
});
