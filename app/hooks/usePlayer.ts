"use client";

import { useCallback, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import useStemPlayerStore from "../stores/stemPlayerStore";
import {
  AutoMixSuggestion,
  GenerationTask,
  Recommendation,
  StemTrack,
  SubscriptionTier,
} from "../types/stem-player";

export function usePlayer() {
  const selectors = useStemPlayerStore(
    useShallow((state) => ({
      currentTrackId: state.currentTrackId,
      tracks: state.tracks,
      playbackState: state.playbackState,
      autoMixSuggestion: state.autoMixSuggestion,
      subscriptionTier: state.subscriptionTier,
      uploadProgress: state.uploadProgress,
      isProcessing: state.isProcessing,
      recommendations: state.recommendations,
      generationTasks: state.generationTasks,
      analytics: state.analytics,
    })),
  );

  const currentTrack: StemTrack | null = useMemo(() => {
    if (!selectors.currentTrackId) return null;
    return selectors.tracks[selectors.currentTrackId] ?? null;
  }, [selectors.currentTrackId, selectors.tracks]);

  const setPlaybackState = useStemPlayerStore(
    (state) => state.setPlaybackState,
  );
  const setStemVolume = useStemPlayerStore((state) => state.setStemVolume);
  const toggleStemMute = useStemPlayerStore((state) => state.toggleStemMute);
  const setStemSolo = useStemPlayerStore((state) => state.setStemSolo);
  const applyAutoMixInternal = useStemPlayerStore(
    (state) => state.applyAutoMix,
  );
  const resetAutoMix = useStemPlayerStore((state) => state.resetAutoMix);
  const setSubscriptionTier = useStemPlayerStore(
    (state) => state.setSubscriptionTier,
  );
  const setUploadProgress = useStemPlayerStore(
    (state) => state.setUploadProgress,
  );
  const setProcessing = useStemPlayerStore((state) => state.setProcessing);
  const finalizeUpload = useStemPlayerStore((state) => state.finalizeUpload);
  const addGenerationTask = useStemPlayerStore(
    (state) => state.addGenerationTask,
  );
  const updateGenerationTask = useStemPlayerStore(
    (state) => state.updateGenerationTask,
  );
  const setRecommendations = useStemPlayerStore(
    (state) => state.setRecommendations,
  );
  const updateAnalytics = useStemPlayerStore((state) => state.updateAnalytics);
  const bootstrap = useStemPlayerStore((state) => state.bootstrap);

  const handleSetStemVolume = useCallback(
    (stemId: string, volume: number) => {
      setStemVolume(stemId, volume);
    },
    [setStemVolume],
  );

  const handleToggleMute = useCallback(
    (stemId: string) => {
      toggleStemMute(stemId);
    },
    [toggleStemMute],
  );

  const handleSetSolo = useCallback(
    (stemId: string) => {
      setStemSolo(stemId);
    },
    [setStemSolo],
  );

  const applyAutoMix = useCallback(
    (suggestion: AutoMixSuggestion) => {
      applyAutoMixInternal(suggestion);
    },
    [applyAutoMixInternal],
  );

  const completeUpload = useCallback(
    (track: StemTrack) => {
      finalizeUpload(track);
    },
    [finalizeUpload],
  );

  const pushGenerationTask = useCallback(
    (task: GenerationTask) => {
      addGenerationTask(task);
    },
    [addGenerationTask],
  );

  const mutateGenerationTask = useCallback(
    (task: GenerationTask) => {
      updateGenerationTask(task);
    },
    [updateGenerationTask],
  );

  const updateRecommendationFeed = useCallback(
    (items: Recommendation[]) => {
      setRecommendations(items);
    },
    [setRecommendations],
  );

  const changeSubscription = useCallback(
    (tier: SubscriptionTier) => {
      setSubscriptionTier(tier);
    },
    [setSubscriptionTier],
  );

  return {
    currentTrack,
    playbackState: selectors.playbackState,
    autoMixSuggestion: selectors.autoMixSuggestion,
    subscriptionTier: selectors.subscriptionTier,
    uploadProgress: selectors.uploadProgress,
    isProcessing: selectors.isProcessing,
    recommendations: selectors.recommendations,
    generationTasks: selectors.generationTasks,
    analytics: selectors.analytics,
    bootstrap,
    setPlaybackState,
    setStemVolume: handleSetStemVolume,
    toggleStemMute: handleToggleMute,
    setStemSolo: handleSetSolo,
    applyAutoMix,
    resetAutoMix,
    setSubscriptionTier: changeSubscription,
    setUploadProgress,
    setProcessing,
    finalizeUpload: completeUpload,
    addGenerationTask: pushGenerationTask,
    updateGenerationTask: mutateGenerationTask,
    setRecommendations: updateRecommendationFeed,
    updateAnalytics,
  };
}
