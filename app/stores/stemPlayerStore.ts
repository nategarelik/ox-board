"use client";

import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  AutoMixSuggestion,
  GenerationTask,
  PlaybackState,
  PlayerAnalytics,
  Recommendation,
  StemTrack,
  SubscriptionTier,
} from "../types/stem-player";
import {
  createDefaultAutoMix,
  createDefaultRecommendations,
  createDefaultTrack,
} from "../lib/data/defaultTrack";

type StemPlayerState = {
  tracks: Record<string, StemTrack>;
  currentTrackId: string | null;
  playbackState: PlaybackState;
  isProcessing: boolean;
  uploadProgress: number | null;
  autoMixSuggestion: AutoMixSuggestion | null;
  generationTasks: GenerationTask[];
  recommendations: Recommendation[];
  subscriptionTier: SubscriptionTier;
  analytics: PlayerAnalytics;
  bootstrap: () => void;
  setPlaybackState: (state: PlaybackState) => void;
  setStemVolume: (stemId: string, volume: number) => void;
  toggleStemMute: (stemId: string) => void;
  setStemSolo: (stemId: string) => void;
  applyAutoMix: (suggestion: AutoMixSuggestion) => void;
  resetAutoMix: () => void;
  setSubscriptionTier: (tier: SubscriptionTier) => void;
  setUploadProgress: (progress: number | null) => void;
  setProcessing: (value: boolean) => void;
  finalizeUpload: (track: StemTrack) => void;
  addGenerationTask: (task: GenerationTask) => void;
  updateGenerationTask: (task: GenerationTask) => void;
  setRecommendations: (items: Recommendation[]) => void;
  updateAnalytics: (patch: Partial<PlayerAnalytics>) => void;
};

const INITIAL_ANALYTICS: PlayerAnalytics = {
  averageLatencyMs: 68,
  hlsBufferHealth: 0.92,
  generationQueueDepth: 1,
  downloadQuotaUsed: 0.18,
  sessionMinutes: 12,
};

const useStemPlayerStore = create<StemPlayerState>()(
  immer((set, get) => ({
    tracks: {},
    currentTrackId: null,
    playbackState: "idle",
    isProcessing: false,
    uploadProgress: null,
    autoMixSuggestion: null,
    generationTasks: [],
    recommendations: [],
    subscriptionTier: "free",
    analytics: INITIAL_ANALYTICS,

    bootstrap: () => {
      if (get().currentTrackId) {
        return;
      }
      const track = createDefaultTrack();
      set((state) => {
        state.tracks[track.id] = track;
        state.currentTrackId = track.id;
        state.playbackState = "stopped";
        state.recommendations = createDefaultRecommendations();
        state.autoMixSuggestion = createDefaultAutoMix();
      });
    },

    setPlaybackState: (stateValue) => {
      set((draft) => {
        draft.playbackState = stateValue;
      });
    },

    setStemVolume: (stemId, volume) => {
      const { currentTrackId } = get();
      if (!currentTrackId) return;

      set((draft) => {
        const track = draft.tracks[currentTrackId];
        if (!track) return;
        track.stems = track.stems.map((stem) =>
          stem.id === stemId
            ? {
                ...stem,
                volume: Math.min(1, Math.max(0, volume)),
                muted: volume <= 0.001 ? true : stem.muted,
              }
            : stem,
        );
      });
    },

    toggleStemMute: (stemId) => {
      const { currentTrackId } = get();
      if (!currentTrackId) return;

      set((draft) => {
        const track = draft.tracks[currentTrackId];
        if (!track) return;

        track.stems = track.stems.map((stem) => {
          if (stem.id !== stemId) {
            return stem;
          }

          const willBeMuted = !stem.muted;
          return {
            ...stem,
            muted: willBeMuted,
            solo: willBeMuted ? false : stem.solo,
          };
        });
      });
    },

    setStemSolo: (stemId) => {
      const { currentTrackId } = get();
      if (!currentTrackId) return;

      set((draft) => {
        const track = draft.tracks[currentTrackId];
        if (!track) return;
        const target = track.stems.find((stem) => stem.id === stemId);

        const activating = target ? !target.solo : true;

        if (activating) {
          track.stems = track.stems.map((stem) =>
            stem.id === stemId
              ? { ...stem, solo: true, muted: false }
              : { ...stem, solo: false, muted: true },
          );
        } else {
          track.stems = track.stems.map((stem) => ({
            ...stem,
            solo: false,
            muted: false,
          }));
        }
      });
    },

    applyAutoMix: (suggestion) => {
      const { currentTrackId } = get();
      if (!currentTrackId) return;

      set((draft) => {
        const track = draft.tracks[currentTrackId];
        if (!track) return;
        track.stems = track.stems.map((stem) => {
          const adjustment = suggestion.adjustments.find(
            (item) => item.stemId === stem.id,
          );
          if (!adjustment) {
            return stem;
          }
          return {
            ...stem,
            volume: Math.min(1, Math.max(0, adjustment.targetVolume)),
            muted: adjustment.muted ?? stem.muted,
            solo: false,
          };
        });
        draft.autoMixSuggestion = suggestion;
      });
    },

    resetAutoMix: () => {
      set((draft) => {
        draft.autoMixSuggestion = null;
      });
    },

    setSubscriptionTier: (tier) => {
      set((draft) => {
        draft.subscriptionTier = tier;
      });
    },

    setUploadProgress: (progress) => {
      set((draft) => {
        draft.uploadProgress = progress;
      });
    },

    setProcessing: (value) => {
      set((draft) => {
        draft.isProcessing = value;
      });
    },

    finalizeUpload: (track) => {
      set((draft) => {
        draft.tracks[track.id] = track;
        draft.currentTrackId = track.id;
        draft.uploadProgress = null;
        draft.isProcessing = false;
        draft.playbackState = "stopped";
      });
    },

    addGenerationTask: (task) => {
      set((draft) => {
        draft.generationTasks.unshift(task);
        draft.analytics.generationQueueDepth = Math.max(
          draft.generationTasks.filter((item) => item.status !== "completed")
            .length,
          0,
        );
      });
    },

    updateGenerationTask: (task) => {
      set((draft) => {
        const index = draft.generationTasks.findIndex(
          (item) => item.id === task.id,
        );
        if (index >= 0) {
          draft.generationTasks[index] = task;
        } else {
          draft.generationTasks.unshift(task);
        }
        draft.analytics.generationQueueDepth = Math.max(
          draft.generationTasks.filter((item) => item.status !== "completed")
            .length,
          0,
        );
      });
    },

    setRecommendations: (items) => {
      set((draft) => {
        draft.recommendations = items;
      });
    },

    updateAnalytics: (patch) => {
      set((draft) => {
        draft.analytics = { ...draft.analytics, ...patch };
      });
    },
  })),
);

export default useStemPlayerStore;
