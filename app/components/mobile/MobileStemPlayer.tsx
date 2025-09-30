"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Settings,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Home,
  Music,
  Mic,
  Radio,
  Zap,
  Maximize2,
} from "lucide-react";
import { useGestures } from "../../hooks/useGestures";
import { usePlayer } from "../../hooks/usePlayer";

interface MobileStemPlayerProps {
  onNavigateToDesktop?: () => void;
}

const STEM_TYPES = [
  {
    id: "vocals",
    name: "Vocals",
    icon: Mic,
    color: "from-pink-500 to-rose-500",
  },
  {
    id: "drums",
    name: "Drums",
    icon: Radio,
    color: "from-orange-500 to-red-500",
  },
  {
    id: "bass",
    name: "Bass",
    icon: Music,
    color: "from-purple-500 to-indigo-500",
  },
  {
    id: "melody",
    name: "Melody",
    icon: Music,
    color: "from-cyan-500 to-blue-500",
  },
];

export default function MobileStemPlayer({
  onNavigateToDesktop,
}: MobileStemPlayerProps) {
  const [currentStemIndex, setCurrentStemIndex] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [stemVolumes, setStemVolumes] = useState<Record<string, number>>({
    vocals: 0.8,
    drums: 0.9,
    bass: 0.7,
    melody: 0.85,
  });
  const [mutedStems, setMutedStems] = useState<Set<string>>(new Set());

  const swipeThreshold = 50;
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  const { currentTrack, playbackState } = usePlayer();

  // Gesture system for mobile
  const gestureSystem = useGestures({
    enableCalibration: false,
    enablePerformanceMonitoring: true,
    gestureThreshold: 0.05, // Lower threshold for touch
  });

  // Auto-hide controls
  const resetControlsTimeout = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);

    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [playbackState]);

  // Handle swipe gestures for stem navigation
  const handleSwipe = (event: any, info: PanInfo) => {
    const { offset } = info;

    if (Math.abs(offset.x) > swipeThreshold) {
      if (offset.x > 0 && currentStemIndex > 0) {
        // Swipe right - previous stem
        setCurrentStemIndex((prev) => prev - 1);
      } else if (offset.x < 0 && currentStemIndex < STEM_TYPES.length - 1) {
        // Swipe left - next stem
        setCurrentStemIndex((prev) => prev + 1);
      }
    }
  };

  // Handle vertical swipe for volume control
  const handleVolumeSwipe = (event: any, info: PanInfo) => {
    const { offset } = info;
    const currentStem = STEM_TYPES[currentStemIndex];

    if (Math.abs(offset.y) > swipeThreshold) {
      const volumeChange = offset.y > 0 ? -0.1 : 0.1; // Swipe up = volume down, down = up
      const newVolume = Math.max(
        0,
        Math.min(1, stemVolumes[currentStem.id] + volumeChange),
      );

      setStemVolumes((prev) => ({
        ...prev,
        [currentStem.id]: newVolume,
      }));
    }
  };

  const handleStemVolumeChange = (stemId: string, volume: number) => {
    setStemVolumes((prev) => ({ ...prev, [stemId]: volume }));
  };

  const toggleStemMute = (stemId: string) => {
    setMutedStems((prev) => {
      const next = new Set(prev);
      if (next.has(stemId)) {
        next.delete(stemId);
      } else {
        next.add(stemId);
      }
      return next;
    });
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const currentStem = STEM_TYPES[currentStemIndex];

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden"
      onClick={resetControlsTimeout}
    >
      {/* Background Visualizer */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 animate-pulse" />
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-500/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
      </div>

      {/* Header */}
      <AnimatePresence>
        {showControls && (
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-0 left-0 right-0 z-40 bg-black/40 backdrop-blur-sm border-b border-white/10"
          >
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Music className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">OX Mobile</h1>
                  <p className="text-xs text-white/60">Gesture Stem Player</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {onNavigateToDesktop && (
                  <button
                    onClick={onNavigateToDesktop}
                    className="p-2 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-lg transition-all"
                    title="Desktop View"
                  >
                    <Home className="w-5 h-5" />
                  </button>
                )}

                <button
                  onClick={toggleFullscreen}
                  className="p-2 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-lg transition-all"
                  title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
                >
                  <Maximize2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex flex-col h-full pt-16 pb-32">
        {/* Current Track Info */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="text-center py-6"
            >
              {currentTrack ? (
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    {currentTrack.title}
                  </h2>
                  <p className="text-white/60">{currentTrack.artist}</p>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-bold text-white mb-1">
                    No Track Loaded
                  </h2>
                  <p className="text-white/60">Upload audio to get started</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stem Navigation Dots */}
        <div className="flex justify-center space-x-2 mb-6">
          {STEM_TYPES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStemIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentStemIndex ? "bg-cyan-400" : "bg-white/30"
              }`}
            />
          ))}
        </div>

        {/* Current Stem Display */}
        <div className="flex-1 flex items-center justify-center px-6">
          <motion.div
            key={currentStemIndex}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-sm"
          >
            {/* Stem Visual */}
            <div className="relative mb-8">
              <motion.div
                className={`w-32 h-32 mx-auto rounded-2xl bg-gradient-to-r ${currentStem.color} flex items-center justify-center shadow-lg`}
                whileTap={{ scale: 0.95 }}
                animate={{
                  boxShadow:
                    playbackState === "playing"
                      ? "0 0 30px rgba(59, 130, 246, 0.5)"
                      : "0 0 10px rgba(255, 255, 255, 0.1)",
                }}
              >
                <currentStem.icon className="w-16 h-16 text-white" />
              </motion.div>

              {/* Volume Indicator */}
              <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-black/40 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                  <span className="text-white font-medium text-sm">
                    {Math.round(stemVolumes[currentStem.id] * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Stem Name */}
            <h3 className="text-2xl font-bold text-white text-center mb-2">
              {currentStem.name}
            </h3>

            {/* Mute Indicator */}
            {mutedStems.has(currentStem.id) && (
              <div className="flex items-center justify-center space-x-2 text-red-400 mb-4">
                <VolumeX className="w-5 h-5" />
                <span className="text-sm">Muted</span>
              </div>
            )}

            {/* Volume Control */}
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() =>
                    handleStemVolumeChange(
                      currentStem.id,
                      Math.max(0, stemVolumes[currentStem.id] - 0.1),
                    )
                  }
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                >
                  <ArrowDown className="w-6 h-6" />
                </button>

                <div className="flex-1 mx-4">
                  <div className="relative">
                    <div className="w-full h-2 bg-white/20 rounded-full">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{
                          width: `${stemVolumes[currentStem.id] * 100}%`,
                        }}
                        transition={{ duration: 0.2 }}
                        className={`h-full rounded-full bg-gradient-to-r ${currentStem.color}`}
                      />
                    </div>
                    <motion.div
                      className="absolute -top-1 w-4 h-4 bg-white rounded-full border-2 border-white shadow-lg -mt-1"
                      style={{ left: `${stemVolumes[currentStem.id] * 100}%` }}
                      animate={{
                        left: `${stemVolumes[currentStem.id] * 100}%`,
                      }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>

                <button
                  onClick={() =>
                    handleStemVolumeChange(
                      currentStem.id,
                      Math.min(1, stemVolumes[currentStem.id] + 0.1),
                    )
                  }
                  className="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-all"
                >
                  <ArrowUp className="w-6 h-6" />
                </button>
              </div>

              {/* Mute/Solo Buttons */}
              <div className="flex items-center justify-center space-x-3">
                <button
                  onClick={() => toggleStemMute(currentStem.id)}
                  className={`p-3 rounded-full transition-all ${
                    mutedStems.has(currentStem.id)
                      ? "bg-red-500/20 text-red-400 border border-red-500/30"
                      : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                  }`}
                >
                  {mutedStems.has(currentStem.id) ? (
                    <VolumeX className="w-6 h-6" />
                  ) : (
                    <Volume2 className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Swipe Gestures for Stem Navigation */}
        <div className="absolute inset-y-0 left-0 w-16 flex items-center justify-center">
          {currentStemIndex > 0 && (
            <div className="text-white/40 text-sm">
              <ArrowRight className="w-6 h-6" />
            </div>
          )}
        </div>

        <div className="absolute inset-y-0 right-0 w-16 flex items-center justify-center">
          {currentStemIndex < STEM_TYPES.length - 1 && (
            <div className="text-white/40 text-sm">
              <ArrowLeft className="w-6 h-6" />
            </div>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm border-t border-white/10"
          >
            <div className="flex items-center justify-center space-x-6 p-6">
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
              >
                {playbackState === "playing" ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8 ml-1" />
                )}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <Square className="w-6 h-6" />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                className="w-12 h-12 bg-purple-500 hover:bg-purple-600 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <Settings className="w-6 h-6" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gesture Hints */}
      <div className="absolute bottom-24 left-0 right-0 text-center">
        <div className="text-white/40 text-xs space-y-1">
          <p>Swipe left/right to change stems</p>
          <p>Swipe up/down to adjust volume</p>
        </div>
      </div>
    </div>
  );
}
