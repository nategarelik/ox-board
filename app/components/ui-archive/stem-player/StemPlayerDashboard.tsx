"use client";

import { useEffect, useRef, useState, lazy, Suspense } from "react";
import { usePlayer } from "../../../hooks/usePlayer";
import { useStemPlayback } from "../../../hooks/useStemPlayback";
import { useGestures } from "../../../hooks/useGestures";
import { requestAutoMixSuggestion } from "../../../services/aiStemService";
import { fetchPersonalizedRecommendations } from "../../../services/recommendationService";
import useEnhancedDJStore from "../../../stores/enhancedDjStoreWithGestures";
import { performanceMonitor } from "../../../lib/optimization/performanceMonitor";
import StemMixerPanel from "./StemMixerPanel";
import AIGenerationPanel from "./AIGenerationPanel";
import RecommendationPanel from "./RecommendationPanel";
import SubscriptionPlans from "./SubscriptionPlans";
import UsageMetrics from "./UsageMetrics";
import AudioUploadInterface from "./AudioUploadInterface";
import GestureVisualization from "../../GestureVisualization";
import PerformanceMonitorUI from "../../PerformanceMonitorUI";
import { Camera, Activity, Box as BoxIcon, X } from "lucide-react";

// Lazy load 3D visualizer for performance
const Stem3DVisualizer = lazy(() => import("./Stem3DVisualizer"));

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
  const { initializeAudioOnUserGesture } = useEnhancedDJStore();

  // Gesture system integration
  const {
    gestureData,
    isProcessing: gestureProcessing,
    performanceMetrics,
  } = useGestures();

  // UI panel state management
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showGestureViz, setShowGestureViz] = useState(false);
  const [show3DVisualizer, setShow3DVisualizer] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

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
    try {
      // Initialize audio on user gesture first
      await initializeAudioOnUserGesture();
    } catch (error) {
      console.error("Failed to initialize DJ audio:", error);
    }

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
      {/* Feature Toggle Bar */}
      <div className="flex flex-wrap gap-3 items-center justify-end">
        <button
          onClick={() => setShowGestureViz(!showGestureViz)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            showGestureViz
              ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Camera className="w-4 h-4" />
          Gesture Viz
        </button>

        <button
          onClick={() => setShow3DVisualizer(!show3DVisualizer)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            show3DVisualizer
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          <BoxIcon className="w-4 h-4" />
          3D Visualizer
        </button>

        <button
          onClick={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
            showPerformanceMonitor
              ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Activity className="w-4 h-4" />
          Performance
        </button>
      </div>

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
            {currentTrack && (
              <span className="text-xs text-white/50">
                Demo Mode - Upload audio for full experience
              </span>
            )}
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
          {/* Upload Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 hover:from-purple-500/20 hover:to-pink-500/20 transition-all"
          >
            <div className="flex items-center justify-center gap-3 text-white">
              <span className="text-lg font-semibold">Upload Audio</span>
              <span className="text-2xl">⬆️</span>
            </div>
            <p className="text-sm text-white/60 mt-2 text-center">
              Upload multitrack or YouTube URL
            </p>
          </button>
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

      {/* Advanced Feature Panels */}
      {showGestureViz && (
        <section id="gesture-viz" className="relative">
          <button
            onClick={() => setShowGestureViz(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <GestureVisualization
            gestureData={gestureData}
            isProcessing={gestureProcessing}
            performanceMetrics={performanceMetrics}
            className="h-96"
          />
        </section>
      )}

      {show3DVisualizer && (
        <section id="3d-viz" className="relative h-[600px]">
          <button
            onClick={() => setShow3DVisualizer(false)}
            className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full bg-black/40 rounded-lg">
                <div className="text-white/60">Loading 3D Visualizer...</div>
              </div>
            }
          >
            <Stem3DVisualizer
              gestureData={gestureData}
              currentTrack={currentTrack}
              playbackState={
                playbackState === "idle" ? "stopped" : playbackState
              }
              className="rounded-lg overflow-hidden"
            />
          </Suspense>
        </section>
      )}

      {showPerformanceMonitor && (
        <section id="performance">
          <PerformanceMonitorUI
            performanceMonitor={performanceMonitor}
            gestureSystem={{ performanceMetrics }}
            onClose={() => setShowPerformanceMonitor(false)}
          />
        </section>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <AudioUploadInterface
          isProcessing={isProcessing}
          uploadProgress={uploadProgress}
          onUploadStart={() => {
            setProcessing(true);
            setUploadProgress(0);
          }}
          onUploadProgress={(progress) => setUploadProgress(progress)}
          onUploadComplete={(track) => {
            finalizeUpload(track);
            setShowUploadModal(false);
          }}
          onUploadError={() => {
            setProcessing(false);
            setUploadProgress(null);
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
}
