"use client";

import { useEffect, useRef } from "react";
import { usePlayer } from "../../hooks/usePlayer";
import { useStemPlayback } from "../../hooks/useStemPlayback";
import { requestAutoMixSuggestion } from "../../services/aiStemService";
import { fetchPersonalizedRecommendations } from "../../services/recommendationService";
import StemMixerPanel from "./StemMixerPanel";
import StemUploadPanel from "./StemUploadPanel";
import AIGenerationPanel from "./AIGenerationPanel";
import RecommendationPanel from "./RecommendationPanel";
import SubscriptionPlans from "./SubscriptionPlans";
import UsageMetrics from "./UsageMetrics";

export default function StemPlayerDashboard() {
  const {
    currentTrack,
    playbackState,
    autoMixSuggestion,
    bootstrap,
    applyAutoMix,
    setPlaybackState,
    setStemVolume,
    toggleStemMute,
    setStemSolo,
    setUploadProgress,
    setProcessing,
    finalizeUpload,
    uploadProgress,
    isProcessing,
    subscriptionTier,
    setSubscriptionTier,
    recommendations,
    setRecommendations,
    analytics,
    updateAnalytics,
  } = usePlayer();

  const { initialize, play, pause, stop, updateStem, ready, state } =
    useStemPlayback(currentTrack);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const lastAppliedAutomix = useRef<string | null>(null);

  useEffect(() => {
    if (!currentTrack || !autoMixSuggestion) return;
    if (lastAppliedAutomix.current === autoMixSuggestion.id) return;
    applyAutoMix(autoMixSuggestion);
    lastAppliedAutomix.current = autoMixSuggestion.id;
  }, [autoMixSuggestion, applyAutoMix, currentTrack]);

  useEffect(() => {
    if (!currentTrack) return;
    fetchPersonalizedRecommendations(currentTrack, subscriptionTier)
      .then((items) => {
        setRecommendations(items);
      })
      .catch(() => {
        // ignore network error in mock environment
      });
  }, [currentTrack, setRecommendations, subscriptionTier]);

  useEffect(() => {
    if (!currentTrack || !ready) return;
    currentTrack.stems.forEach((stem) => {
      updateStem(stem.id, stem.volume, stem.muted);
    });
  }, [currentTrack, ready, updateStem]);

  const handlePlay = async () => {
    if (!ready) {
      await initialize();
    }
    await play();
    setPlaybackState("playing");
    updateAnalytics({ sessionMinutes: analytics.sessionMinutes + 1 });
  };

  const handlePause = async () => {
    await pause();
    setPlaybackState("paused");
  };

  const handleStop = async () => {
    await stop();
    setPlaybackState("stopped");
  };

  const handleAutoMix = async () => {
    if (!currentTrack) return;
    const suggestion = await requestAutoMixSuggestion(currentTrack);
    applyAutoMix(suggestion);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-black via-slate-950 to-black p-10 shadow-2xl shadow-purple-900/30">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-white/60">
              Agentic AI Stem Studio
            </p>
            <h1 className="mt-3 text-4xl font-semibold text-white md:text-5xl">
              Build mix-ready stems in your browser
            </h1>
            <p className="mt-4 max-w-2xl text-base text-white/70">
              Upload multitracks or generate new ideas with AI, then mix every
              stem with sub-100ms latency. Export ready-to-release masters with
              licensing baked in.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 rounded-2xl border border-white/10 bg-black/60 p-6 text-white/80">
            <span className="text-xs uppercase tracking-[0.2em] text-white/50">
              Realtime Engine
            </span>
            <span className="text-lg font-semibold">
              {state === "running"
                ? "Playback Live"
                : state === "suspended"
                  ? "Audio Suspended"
                  : "Ready for Interaction"}
            </span>
            <div className="flex gap-3 text-sm">
              <button
                onClick={handlePlay}
                className="rounded-full bg-white/10 px-4 py-2 font-medium text-white transition hover:bg-white/20"
              >
                Play
              </button>
              <button
                onClick={handlePause}
                className="rounded-full bg-white/10 px-4 py-2 font-medium text-white transition hover:bg-white/20"
              >
                Pause
              </button>
              <button
                onClick={handleStop}
                className="rounded-full bg-white/5 px-4 py-2 text-white/70 transition hover:text-white"
              >
                Stop
              </button>
            </div>
            <button
              onClick={handleAutoMix}
              className="rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-orange-500/40 transition hover:shadow-purple-500/50"
            >
              Auto-mix this track
            </button>
          </div>
        </div>
      </section>

      <section
        id="mixer"
        className="grid grid-cols-1 gap-8 xl:grid-cols-[2fr_1fr]"
      >
        <StemMixerPanel
          track={currentTrack}
          playbackState={playbackState}
          onVolumeChange={setStemVolume}
          onMuteToggle={toggleStemMute}
          onSoloToggle={setStemSolo}
          uploadProgress={uploadProgress}
          isProcessing={isProcessing}
        />
        <div className="flex flex-col gap-6">
          <StemUploadPanel
            onUploadStart={() => {
              setProcessing(true);
              setUploadProgress(0);
            }}
            onUploadProgress={(progress) => setUploadProgress(progress)}
            onUploadComplete={(track) => finalizeUpload(track)}
            onUploadError={() => {
              setProcessing(false);
              setUploadProgress(null);
            }}
            uploadProgress={uploadProgress}
            isProcessing={isProcessing}
          />
          <UsageMetrics analytics={analytics} />
        </div>
      </section>

      <section
        id="generator"
        className="grid grid-cols-1 gap-8 lg:grid-cols-[1.2fr_0.8fr]"
      >
        <AIGenerationPanel />
        <RecommendationPanel
          recommendations={recommendations}
          subscriptionTier={subscriptionTier}
        />
      </section>

      <section id="subscriptions">
        <SubscriptionPlans
          currentTier={subscriptionTier}
          onTierSelect={setSubscriptionTier}
        />
      </section>
    </div>
  );
}
