"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Play, Pause, Music, Loader2, Eye, EyeOff } from "lucide-react";
import useEnhancedDJStore from "@/stores/enhancedDjStoreWithGestures";
import { useGestures, GestureControl } from "@/hooks/useGestures";
import { stemCache } from "@/lib/storage/stemCache";

const CameraFeed = dynamic(() => import("../Camera/CameraFeed"), {
  ssr: false,
});

// Extended GestureControl for immersive interface
interface ExtendedGestureControl extends GestureControl {
  x?: number;
  y?: number;
  rotation?: number;
  spread?: number;
}

interface StemOrb {
  id: string;
  name: string;
  color: string;
  position: { x: number; y: number };
  volume: number;
  active: boolean;
  muted: boolean;
}

interface GestureState {
  leftHand: {
    height: number;
    pinch: boolean;
    rotation: number;
  };
  rightHand: {
    height: number;
    pinch: boolean;
    spread: number;
  };
  twoHands: {
    distance: number;
    height: number;
  };
}

export default function ImmersiveGestureInterface() {
  const djStore = useEnhancedDJStore();
  const gestureData = useGestures();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [ambientMode, setAmbientMode] = useState(true);
  const [currentTrack, setCurrentTrack] = useState<any>(null);
  const [processingProgress, setProcessingProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const isProcessingGestureControls = useRef(false);

  // Stem orbs configuration
  const [stemOrbs, setStemOrbs] = useState<StemOrb[]>([
    {
      id: "vocals",
      name: "Vocals",
      color: "#FF6B6B",
      position: { x: 0.25, y: 0.3 },
      volume: 0.8,
      active: true,
      muted: false,
    },
    {
      id: "drums",
      name: "Drums",
      color: "#4ECDC4",
      position: { x: 0.75, y: 0.3 },
      volume: 0.8,
      active: true,
      muted: false,
    },
    {
      id: "bass",
      name: "Bass",
      color: "#95E77E",
      position: { x: 0.25, y: 0.7 },
      volume: 0.8,
      active: true,
      muted: false,
    },
    {
      id: "melody",
      name: "Melody",
      color: "#FFE66D",
      position: { x: 0.75, y: 0.7 },
      volume: 0.8,
      active: true,
      muted: false,
    },
  ]);

  const [gestureState, setGestureState] = useState<GestureState>({
    leftHand: { height: 0.5, pinch: false, rotation: 0 },
    rightHand: { height: 0.5, pinch: false, spread: 0.5 },
    twoHands: { distance: 0.5, height: 0.5 },
  });

  // Handle file selection
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsProcessing(true);
      setProcessingProgress(0);

      try {
        const url = URL.createObjectURL(file);
        const track = {
          id: `file-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: "Local File",
          duration: 0,
          url,
          bpm: 120,
          key: "C",
          hasStems: false,
        };

        setCurrentTrack(track);

        // Check if stems are cached
        const cachedStems = await stemCache.loadStem(url);

        if (cachedStems) {
          console.log("✅ Using cached stems");
          setProcessingProgress(100);
          // Load cached stems into audio system
          await djStore.loadTrack(0, { ...track, hasStems: true });
        } else {
          console.log("🎵 Processing new track...");
          // Simulate processing (in real implementation, this would call Demucs)
          for (let i = 0; i <= 100; i += 10) {
            setProcessingProgress(i);
            await new Promise((resolve) => setTimeout(resolve, 200));
          }

          // Process and cache stems
          await djStore.loadTrack(0, track);
          await djStore.processStemSeparation(0);
        }

        setIsProcessing(false);
        setAmbientMode(false); // Exit ambient mode when track is loaded
      } catch (error) {
        console.error("Error loading track:", error);
        setIsProcessing(false);
      }
    },
    [djStore],
  );

  // Update gesture state from hand tracking
  useEffect(() => {
    if (!gestureData.controls || gestureData.controls.length === 0) return;

    const leftHandControl = gestureData.controls.find(
      (c) => c.hand === "left",
    ) as ExtendedGestureControl | undefined;
    const rightHandControl = gestureData.controls.find(
      (c) => c.hand === "right",
    ) as ExtendedGestureControl | undefined;

    if (leftHandControl || rightHandControl) {
      setGestureState((prev) => ({
        leftHand: leftHandControl
          ? {
              height: leftHandControl.value,
              pinch: leftHandControl.gesture === "pinch",
              rotation: leftHandControl.rotation || 0,
            }
          : prev.leftHand,
        rightHand: rightHandControl
          ? {
              height: rightHandControl.value,
              pinch: rightHandControl.gesture === "pinch",
              spread: rightHandControl.spread || 0.5,
            }
          : prev.rightHand,
        twoHands: {
          distance: Math.abs(
            (leftHandControl?.x || 0.5) - (rightHandControl?.x || 0.5),
          ),
          height:
            ((leftHandControl?.value || 0.5) +
              (rightHandControl?.value || 0.5)) /
            2,
        },
      }));
    }
  }, [gestureData.controls]);

  // Map gestures to stem controls
  useEffect(() => {
    if (!currentTrack) return;

    // Prevent infinite re-renders by using a ref to track if we're already updating
    if (isProcessingGestureControls.current) return;
    isProcessingGestureControls.current = true;

    try {
      // Left hand controls vocals
      const vocalsOrb = stemOrbs.find((o) => o.id === "vocals");
      if (vocalsOrb) {
        const newVolume = gestureState.leftHand.height;
        if (Math.abs(vocalsOrb.volume - newVolume) > 0.05) {
          setStemOrbs((prev) =>
            prev.map((orb) =>
              orb.id === "vocals" ? { ...orb, volume: newVolume } : orb,
            ),
          );
          djStore.setStemVolume(0, "vocals", newVolume);
        }

        // Pinch to mute/unmute
        if (gestureState.leftHand.pinch && !vocalsOrb.muted) {
          setStemOrbs((prev) =>
            prev.map((orb) =>
              orb.id === "vocals" ? { ...orb, muted: true } : orb,
            ),
          );
          djStore.setStemMute(0, "vocals", true);
        } else if (!gestureState.leftHand.pinch && vocalsOrb.muted) {
          setStemOrbs((prev) =>
            prev.map((orb) =>
              orb.id === "vocals" ? { ...orb, muted: false } : orb,
            ),
          );
          djStore.setStemMute(0, "vocals", false);
        }
      }

      // Right hand controls drums and bass
      const drumsOrb = stemOrbs.find((o) => o.id === "drums");
      if (drumsOrb) {
        const newVolume = gestureState.rightHand.height;
        if (Math.abs(drumsOrb.volume - newVolume) > 0.05) {
          setStemOrbs((prev) =>
            prev.map((orb) =>
              orb.id === "drums" ? { ...orb, volume: newVolume } : orb,
            ),
          );
          djStore.setStemVolume(0, "drums", newVolume);
        }
      }

      // Spread controls bass
      const bassOrb = stemOrbs.find((o) => o.id === "bass");
      if (bassOrb) {
        const newVolume = gestureState.rightHand.spread;
        if (Math.abs(bassOrb.volume - newVolume) > 0.05) {
          setStemOrbs((prev) =>
            prev.map((orb) =>
              orb.id === "bass" ? { ...orb, volume: newVolume } : orb,
            ),
          );
          djStore.setStemVolume(0, "bass", newVolume);
        }
      }

      // Two hands control master volume - only update if significant change
      const currentVolume = djStore.decks[0]?.volume || 0.75;
      const newMasterVolume = gestureState.twoHands.height;
      if (Math.abs(currentVolume - newMasterVolume) > 0.05) {
        djStore.setDeckVolume(0, newMasterVolume);
      }
    } finally {
      isProcessingGestureControls.current = false;
    }
  }, [gestureState, currentTrack, djStore, stemOrbs]);

  // Render visual feedback on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const render = () => {
      // Set canvas size
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      // Clear canvas
      ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw stem orbs
      stemOrbs.forEach((orb) => {
        const x = orb.position.x * canvas.width;
        const y = orb.position.y * canvas.height;
        const radius = 40 + orb.volume * 60;

        // Glow effect
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
        gradient.addColorStop(0, orb.color + "80");
        gradient.addColorStop(0.5, orb.color + "40");
        gradient.addColorStop(1, orb.color + "00");
        ctx.fillStyle = gradient;
        ctx.fillRect(x - radius * 2, y - radius * 2, radius * 4, radius * 4);

        // Main orb
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = orb.muted ? "#333" : orb.color;
        ctx.globalAlpha = orb.active ? 1 : 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;

        // Label
        ctx.fillStyle = "#fff";
        ctx.font = "14px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(orb.name, x, y + radius + 25);

        // Volume indicator
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.font = "12px Inter, sans-serif";
        ctx.fillText(`${Math.round(orb.volume * 100)}%`, x, y + radius + 40);
      });

      // Draw gesture connections
      if (gestureData.controls.length > 0) {
        ctx.strokeStyle = "rgba(147, 51, 234, 0.5)";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);

        // Draw lines from hands to controlled orbs
        gestureData.controls.forEach((ctrl) => {
          const control = ctrl as ExtendedGestureControl;
          if (
            control.hand === "left" &&
            control.x !== undefined &&
            control.y !== undefined
          ) {
            const vocalsOrb = stemOrbs.find((o) => o.id === "vocals");
            if (vocalsOrb) {
              ctx.beginPath();
              ctx.moveTo(control.x * canvas.width, control.y * canvas.height);
              ctx.lineTo(
                vocalsOrb.position.x * canvas.width,
                vocalsOrb.position.y * canvas.height,
              );
              ctx.stroke();
            }
          }
        });

        ctx.setLineDash([]);
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [stemOrbs, gestureData.controls]);

  const handleHandsDetected = (hands: any[]) => {
    gestureData.updateGestures(
      hands.map((hand) => ({
        landmarks: hand.landmarks,
        handedness: hand.handedness,
        confidence: hand.score,
      })),
    );
  };

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Full-screen camera feed */}
      <div className="absolute inset-0 opacity-30">
        <CameraFeed
          onHandsDetected={handleHandsDetected}
          onCameraReady={() => console.log("Camera ready")}
          onError={(error) => console.error("Camera error:", error)}
          showOverlay={false}
        />
      </div>

      {/* Visual feedback canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ mixBlendMode: "screen" }}
      />

      {/* Minimal HUD */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10">
        {/* Track info */}
        <div className="glass-dark rounded-lg px-4 py-2">
          {currentTrack ? (
            <div className="flex items-center gap-3">
              <Music className="w-4 h-4 text-purple-400" />
              <div>
                <div className="text-sm font-medium text-white">
                  {currentTrack.title}
                </div>
                <div className="text-xs text-gray-400">
                  {currentTrack.artist}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-400">No track loaded</div>
          )}
        </div>

        {/* Mode toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowControls(!showControls)}
            className="glass-dark rounded-lg px-3 py-2 flex items-center gap-2 hover:bg-white/10 transition-all"
          >
            {showControls ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
            <span className="text-xs text-gray-400">Controls</span>
          </button>
        </div>
      </div>

      {/* Processing overlay */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
            <div className="text-white mb-2">Processing stems...</div>
            <div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-2">
              {processingProgress}%
            </div>
          </div>
        </div>
      )}

      {/* Ambient mode - file selector */}
      {ambientMode && !currentTrack && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="glass-dark rounded-2xl p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Gesture DJ</h2>
            <p className="text-gray-400 mb-6">Load a track to begin</p>

            <label className="block">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium cursor-pointer hover:scale-105 transition-transform">
                Choose Audio File
              </div>
            </label>

            <div className="mt-6 text-xs text-gray-500">
              <div className="mb-2">Gesture Controls:</div>
              <div className="space-y-1 text-left">
                <div>👋 Left Hand Height → Vocals</div>
                <div>👋 Right Hand Height → Drums</div>
                <div>🤏 Pinch → Mute/Unmute</div>
                <div>👐 Hands Apart → Crossfade</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Playback controls (minimal) */}
      {currentTrack && !ambientMode && (
        <div className="absolute bottom-0 left-0 right-0 p-4 flex justify-center z-10">
          <div className="glass-dark rounded-full px-6 py-3 flex items-center gap-4">
            <button
              onClick={() => djStore.playDeck(0)}
              className="p-2 rounded-full hover:bg-white/10 transition-all"
            >
              {djStore.decks[0]?.isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>

            <div className="text-xs text-gray-400">
              Master: {Math.round(gestureState.twoHands.height * 100)}%
            </div>
          </div>
        </div>
      )}

      {/* Controls panel (hidden by default) */}
      {showControls && (
        <div className="absolute right-4 top-20 w-64 glass-dark rounded-lg p-4 z-10">
          <h3 className="text-sm font-medium text-white mb-3">Stem Controls</h3>
          <div className="space-y-2">
            {stemOrbs.map((orb) => (
              <div key={orb.id} className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{orb.name}</span>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500">
                    {Math.round(orb.volume * 100)}%
                  </div>
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: orb.muted ? "#333" : orb.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .glass-dark {
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>
    </div>
  );
}
