"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Square,
  Settings,
  Maximize2,
  Minimize2,
  Zap,
  Signal,
  HardDrive,
  Camera,
  Upload,
  Download,
} from "lucide-react";
import { useGestures } from "../../hooks/useGestures";
import { performanceMonitor } from "../../lib/optimization/performanceMonitor";
import { usePlayer } from "../../hooks/usePlayer";
import GestureVisualization from "../GestureVisualization";
import AdvancedStemControls from "./AdvancedStemControls";
import AudioUploadInterface from "./AudioUploadInterface";
import PerformanceMonitorUI from "../PerformanceMonitorUI";
import GestureControlPanel from "../GestureControlPanel";
import Stem3DVisualizer from "./Stem3DVisualizer";
import MobileStemPlayer from "../mobile/MobileStemPlayer";

interface EnhancedStemPlayerDashboardProps {
  isMobile?: boolean;
  debugMode?: boolean;
}

export default function EnhancedStemPlayerDashboard({
  isMobile = false,
  debugMode = false,
}: EnhancedStemPlayerDashboardProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] =
    useState(debugMode);
  const [showGesturePanel, setShowGesturePanel] = useState(false);
  const [showUploadInterface, setShowUploadInterface] = useState(false);
  const [currentView, setCurrentView] = useState<"dashboard" | "mobile">(
    "dashboard",
  );

  const {
    currentTrack,
    playbackState,
    isProcessing,
    uploadProgress,
    setStemVolume,
    toggleStemMute,
    setStemSolo,
    finalizeUpload,
    setProcessing,
    setUploadProgress,
  } = usePlayer();

  // Initialize gesture system
  const gestureSystem = useGestures({
    enableCalibration: true,
    enablePerformanceMonitoring: true,
    advancedSmoothingEnabled: true,
    gesturePredictionEnabled: true,
  });

  // Initialize performance monitoring
  useEffect(() => {
    performanceMonitor.start();
    return () => performanceMonitor.stop();
  }, []);

  const handlePlay = async () => {
    const startTime = performance.now();
    performanceMonitor.startLatencyMeasurement("ui");

    // Implementation would call actual play function
    console.log("Play button pressed");

    performanceMonitor.endLatencyMeasurement("ui");
  };

  const handlePause = () => {
    console.log("Pause button pressed");
  };

  const handleStop = () => {
    console.log("Stop button pressed");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleGestureControl = useCallback(
    (control: any) => {
      performanceMonitor.startLatencyMeasurement("gesture");

      // Apply gesture-based controls to stems
      switch (control.type) {
        case "stem_volume":
          if (control.stemType) {
            setStemVolume(control.stemType, control.value);
          }
          break;
        case "mute":
          if (control.stemType) {
            toggleStemMute(control.stemType);
          }
          break;
        case "solo":
          if (control.stemType) {
            setStemSolo(control.stemType);
          }
          break;
      }

      performanceMonitor.endLatencyMeasurement("gesture");
    },
    [setStemVolume, toggleStemMute, setStemSolo],
  );

  // Listen to gesture controls
  useEffect(() => {
    gestureSystem.controls.forEach(handleGestureControl);
  }, [gestureSystem.controls, handleGestureControl]);

  // PWA Install Prompt
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () =>
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
  }, []);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log("PWA install outcome:", outcome);
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  // Offline indicator
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isMobile) {
    return <MobileStemPlayer />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-black/20 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Signal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">
                    OX Gesture Studio
                  </h1>
                  <p className="text-xs text-white/60">
                    Professional Stem Player
                  </p>
                </div>
              </div>

              {/* Status Indicators */}
              <div className="flex items-center space-x-3">
                {/* Performance Status */}
                <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs text-green-400 font-medium">
                    {performanceMonitor.getCurrentSnapshot()?.fps || 0} FPS
                  </span>
                </div>

                {/* Gesture Status */}
                {gestureSystem.gestureData && (
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500/30">
                    <Camera className="w-3 h-3 text-blue-400" />
                    <span className="text-xs text-blue-400 font-medium">
                      {gestureSystem.gestureData.confidence > 0.7
                        ? "Active"
                        : "Standby"}
                    </span>
                  </div>
                )}

                {/* Offline Indicator */}
                {!isOnline && (
                  <div className="flex items-center space-x-1 px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
                    <HardDrive className="w-3 h-3 text-orange-400" />
                    <span className="text-xs text-orange-400 font-medium">
                      Offline
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* PWA Install Prompt */}
              {showInstallPrompt && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={handleInstallApp}
                  className="flex items-center space-x-2 px-3 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg text-white text-sm font-medium hover:from-cyan-600 hover:to-purple-600 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>Install App</span>
                </motion.button>
              )}

              {/* Control Buttons */}
              <button
                onClick={() =>
                  setShowPerformanceMonitor(!showPerformanceMonitor)
                }
                className={`p-2 rounded-lg transition-all ${
                  showPerformanceMonitor
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
                title="Performance Monitor"
              >
                <Zap className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowGesturePanel(!showGesturePanel)}
                className={`p-2 rounded-lg transition-all ${
                  showGesturePanel
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
                title="Gesture Controls"
              >
                <Camera className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowUploadInterface(!showUploadInterface)}
                className="p-2 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-all"
                title="Upload Audio"
              >
                <Upload className="w-4 h-4" />
              </button>

              <button
                onClick={toggleFullscreen}
                className="p-2 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-all"
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Gesture Visualization */}
          <div className="col-span-3 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Camera className="w-5 h-5 mr-2 text-cyan-400" />
                Gesture Control
              </h3>
              <GestureVisualization
                gestureData={gestureSystem.gestureData}
                isProcessing={gestureSystem.isProcessing}
                performanceMetrics={gestureSystem.performanceMetrics}
                className="h-64"
              />
            </motion.div>

            {/* Quick Controls */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6"
            >
              <h3 className="text-lg font-semibold text-white mb-4">
                Playback
              </h3>
              <div className="flex items-center justify-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePlay}
                  disabled={isProcessing}
                  className="w-12 h-12 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <Play className="w-5 h-5 ml-0.5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handlePause}
                  className="w-12 h-12 bg-yellow-500 hover:bg-yellow-600 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <Pause className="w-5 h-5" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleStop}
                  className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
                >
                  <Square className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Track Info */}
              {currentTrack && (
                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                  <p className="text-sm text-white/80 truncate">
                    {currentTrack.title}
                  </p>
                  <p className="text-xs text-white/60">{currentTrack.artist}</p>
                </div>
              )}
            </motion.div>
          </div>

          {/* Center Panel - 3D Visualizer */}
          <div className="col-span-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 h-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full mr-2 animate-pulse" />
                  3D Stem Visualizer
                </h3>
                <div className="text-xs text-white/60">
                  {gestureSystem.gestureData?.confidence
                    ? `${Math.round(gestureSystem.gestureData.confidence * 100)}% confidence`
                    : "No gesture detected"}
                </div>
              </div>

              <div className="h-[calc(100%-4rem)]">
                <Stem3DVisualizer
                  gestureData={gestureSystem.gestureData}
                  currentTrack={currentTrack}
                  playbackState={
                    playbackState === "idle"
                      ? "stopped"
                      : playbackState === "loading"
                        ? "loading"
                        : playbackState === "playing"
                          ? "playing"
                          : playbackState === "paused"
                            ? "paused"
                            : "stopped"
                  }
                />
              </div>
            </motion.div>
          </div>

          {/* Right Panel - Stem Controls */}
          <div className="col-span-3">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-black/20 backdrop-blur-sm border border-white/10 rounded-xl p-6 h-full"
            >
              <AdvancedStemControls
                playbackState={
                  playbackState === "idle"
                    ? "stopped"
                    : playbackState === "loading"
                      ? "loading"
                      : playbackState === "playing"
                        ? "playing"
                        : playbackState === "paused"
                          ? "paused"
                          : "stopped"
                }
                gestureData={gestureSystem.gestureData}
                onVolumeChange={setStemVolume}
                onMuteToggle={toggleStemMute}
                onSoloToggle={setStemSolo}
              />
            </motion.div>
          </div>
        </div>
      </main>

      {/* Performance Monitor (Debug Mode) */}
      <AnimatePresence>
        {showPerformanceMonitor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 bg-black/20 backdrop-blur-sm"
          >
            <div className="max-w-7xl mx-auto px-6 py-4">
              <PerformanceMonitorUI
                performanceMonitor={performanceMonitor}
                gestureSystem={gestureSystem}
                onClose={() => setShowPerformanceMonitor(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gesture Control Panel */}
      <AnimatePresence>
        {showGesturePanel && (
          <GestureControlPanel
            gestureSystem={gestureSystem}
            onClose={() => setShowGesturePanel(false)}
          />
        )}
      </AnimatePresence>

      {/* Upload Interface Modal */}
      <AnimatePresence>
        {showUploadInterface && (
          <AudioUploadInterface
            isProcessing={isProcessing}
            uploadProgress={uploadProgress}
            onUploadStart={(progress) => {
              setProcessing(true);
              setUploadProgress(progress);
            }}
            onUploadProgress={setUploadProgress}
            onUploadComplete={(track) => {
              finalizeUpload(track);
              setShowUploadInterface(false);
            }}
            onUploadError={() => {
              setProcessing(false);
              setUploadProgress(null);
            }}
            onClose={() => setShowUploadInterface(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
