"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { DJInterfaceProps } from "@/types/dj";
import {
  Maximize2,
  Minimize2,
  Settings,
  Radio,
  Disc,
  Headphones,
} from "lucide-react";

// Dynamic imports for heavy components
const WaveformDisplay = dynamic(() => import("./WaveformDisplay"), {
  ssr: false,
});
const ProfessionalDeck = dynamic(() => import("./ProfessionalDeck"), {
  ssr: false,
});
const ProfessionalMixer = dynamic(() => import("./ProfessionalMixer"), {
  ssr: false,
});
const EffectsRack = dynamic(() => import("./EffectsRack"), { ssr: false });
const TrackBrowser = dynamic(() => import("./TrackBrowser"), { ssr: false });
const FloatingPanel = dynamic(() => import("./FloatingPanel"), { ssr: false });
const MixAssistantWidget = dynamic(() => import("../AI/MixAssistantWidget"), {
  ssr: false,
});
const GestureCameraWidget = dynamic(() => import("./GestureCameraWidget"), {
  ssr: false,
});

type LayoutMode = "classic" | "battle" | "performance" | "mobile";
type PanelPosition = { x: number; y: number };

export default function ProfessionalDJInterface({
  djState,
  djActions,
  gestureData,
}: DJInterfaceProps) {
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("classic");
  const [fullscreen, setFullscreen] = useState(false);
  const [showEffects, setShowEffects] = useState(true);
  const [showBrowser, setShowBrowser] = useState(false);
  const [showWaveforms, setShowWaveforms] = useState(true);
  const [aiPanelPos, setAiPanelPos] = useState<PanelPosition>({
    x: 20,
    y: 100,
  });
  const [cameraPanelPos, setCameraPanelPos] = useState<PanelPosition>({
    x: 20,
    y: 300,
  });
  const [showAI, setShowAI] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Handle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Prevent shortcuts when typing
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      switch (e.key.toLowerCase()) {
        case "f":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            toggleFullscreen();
          }
          break;
        case "b":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setShowBrowser((prev) => !prev);
          }
          break;
        case "g":
          setShowCamera((prev) => !prev);
          break;
        case "a":
          if (e.altKey) {
            setShowAI((prev) => !prev);
          }
          break;
        case " ":
          e.preventDefault();
          // Play/pause active deck
          if (djState.decks[0]?.isPlaying) {
            djActions.pauseDeck?.(0);
          } else {
            djActions.playDeck?.(0);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [djState, djActions, toggleFullscreen]);

  const handleHandsDetected = useCallback(
    (hands: any[]) => {
      if (!djState.gestureEnabled) return;
      const handResults = hands.map((hand) => ({
        landmarks: hand.landmarks,
        handedness: hand.handedness,
        confidence: hand.score,
      }));
      gestureData.updateGestures(handResults);
      djActions.updateGestureControls(gestureData.controls);
    },
    [djState.gestureEnabled, gestureData, djActions],
  );

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a1a] to-[#0a0a0a] ${fullscreen ? "performance-mode" : ""}`}
    >
      {/* Ultra-thin Header */}
      <header className="h-10 bg-black/90 backdrop-blur-xl border-b border-purple-500/20 px-4 flex items-center justify-between relative z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Disc
              className="w-5 h-5 text-purple-400 animate-spin"
              style={{ animationDuration: "3s" }}
            />
            <span className="font-display text-sm bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent font-bold">
              OX BOARD PRO
            </span>
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-2">
            {djState.isRecording && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-xs text-red-400">REC</span>
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/40">
              <span className="text-xs text-green-400 font-mono">
                {djState.masterBPM || "---"} BPM
              </span>
            </span>
          </div>
        </div>

        {/* Center - Layout Mode Selector */}
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/50 rounded-lg p-1">
          {(["classic", "battle", "performance"] as LayoutMode[]).map(
            (mode) => (
              <button
                key={mode}
                onClick={() => setLayoutMode(mode)}
                className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                  layoutMode === mode
                    ? "bg-purple-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ),
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowWaveforms(!showWaveforms)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Toggle Waveforms (W)"
          >
            <Radio className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setShowBrowser(!showBrowser)}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Toggle Browser (Ctrl+B)"
          >
            <Headphones className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded hover:bg-white/10 transition-colors"
            title="Fullscreen (Ctrl+F)"
          >
            {fullscreen ? (
              <Minimize2 className="w-4 h-4 text-gray-400" />
            ) : (
              <Maximize2 className="w-4 h-4 text-gray-400" />
            )}
          </button>
          <button className="p-1.5 rounded hover:bg-white/10 transition-colors">
            <Settings className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-col h-[calc(100vh-40px)]">
        {/* Waveform Display */}
        {showWaveforms && (
          <div className="h-32 bg-black/60 border-b border-purple-500/20">
            <WaveformDisplay
              deck1={djState.decks[0]}
              deck2={djState.decks[1]}
              crossfaderPosition={djState.crossfaderPosition || 0.5}
            />
          </div>
        )}

        {/* Main Deck Area */}
        <div className="flex-1 flex relative overflow-hidden">
          {layoutMode === "classic" && (
            <>
              {/* Deck A */}
              <div className="flex-1 max-w-[480px] p-4">
                <ProfessionalDeck
                  deckId={0}
                  deck={djState.decks[0]}
                  onPlay={() => djActions.playDeck?.(0)}
                  onPause={() => djActions.pauseDeck?.(0)}
                  onCue={() => djActions.setCuePoint?.(0)}
                />
              </div>

              {/* Mixer */}
              <div className="w-[360px] p-4">
                <ProfessionalMixer
                  decks={djState.decks}
                  crossfaderPosition={djState.crossfaderPosition || 0.5}
                  onCrossfaderChange={
                    djActions.setCrossfaderPosition || (() => {})
                  }
                />
              </div>

              {/* Deck B */}
              <div className="flex-1 max-w-[480px] p-4">
                <ProfessionalDeck
                  deckId={1}
                  deck={djState.decks[1]}
                  onPlay={() => djActions.playDeck?.(1)}
                  onPause={() => djActions.pauseDeck?.(1)}
                  onCue={() => djActions.setCuePoint?.(1)}
                />
              </div>
            </>
          )}

          {layoutMode === "battle" && (
            <div className="flex flex-col w-full">
              <div className="flex flex-1">
                <div className="flex-1 p-4">
                  <ProfessionalDeck
                    deckId={0}
                    deck={djState.decks[0]}
                    onPlay={() => djActions.playDeck?.(0)}
                    onPause={() => djActions.pauseDeck?.(0)}
                    onCue={() => djActions.setCuePoint?.(0)}
                    orientation="horizontal"
                  />
                </div>
                <div className="w-[360px] p-4">
                  <ProfessionalMixer
                    decks={djState.decks}
                    crossfaderPosition={djState.crossfaderPosition || 0.5}
                    onCrossfaderChange={
                      djActions.setCrossfaderPosition || (() => {})
                    }
                    orientation="vertical"
                  />
                </div>
              </div>
              <div className="flex-1 p-4">
                <ProfessionalDeck
                  deckId={1}
                  deck={djState.decks[1]}
                  onPlay={() => djActions.playDeck?.(1)}
                  onPause={() => djActions.pauseDeck?.(1)}
                  onCue={() => djActions.setCuePoint?.(1)}
                  orientation="horizontal"
                />
              </div>
            </div>
          )}

          {layoutMode === "performance" && (
            <div className="flex flex-col w-full items-center justify-center p-8">
              <div className="text-6xl font-display text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 animate-pulse">
                PERFORMANCE MODE
              </div>
              <div className="mt-8 text-gray-400">
                Visualizer coming soon...
              </div>
            </div>
          )}
        </div>

        {/* Effects Rack */}
        {showEffects && layoutMode !== "performance" && (
          <div className="h-40 bg-black/60 border-t border-purple-500/20 p-4">
            <EffectsRack
              deck1Effects={djState.decks[0]?.effects}
              deck2Effects={djState.decks[1]?.effects}
            />
          </div>
        )}

        {/* Track Browser (slide up from bottom) */}
        <div
          className={`absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-xl border-t border-purple-500/30 transition-transform duration-300 z-40 ${
            showBrowser ? "translate-y-0" : "translate-y-full"
          }`}
        >
          {showBrowser && (
            <div className="h-64 p-4">
              <TrackBrowser
                onTrackSelect={(track, deckId) =>
                  djActions.loadTrack?.(deckId, track)
                }
                currentDeck1Track={djState.decks[0]?.track || undefined}
                currentDeck2Track={djState.decks[1]?.track || undefined}
              />
            </div>
          )}
        </div>
      </div>

      {/* Floating Panels */}
      {showAI && (
        <FloatingPanel
          title="AI Assistant"
          position={aiPanelPos}
          onPositionChange={setAiPanelPos}
          onClose={() => setShowAI(false)}
          width={320}
          height={400}
        >
          <MixAssistantWidget />
        </FloatingPanel>
      )}

      {showCamera && (
        <FloatingPanel
          title="Gesture Control"
          position={cameraPanelPos}
          onPositionChange={setCameraPanelPos}
          onClose={() => setShowCamera(false)}
          width={280}
          height={240}
        >
          <GestureCameraWidget
            onHandsDetected={handleHandsDetected}
            enabled={djState.gestureEnabled}
          />
        </FloatingPanel>
      )}

      {/* Quick Access Floating Buttons */}
      <div className="fixed bottom-8 right-8 flex flex-col gap-2 z-50">
        <button
          onClick={() => setShowAI(!showAI)}
          className={`w-12 h-12 rounded-full bg-purple-600/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform ${
            showAI ? "ring-2 ring-purple-400" : ""
          }`}
          title="AI Assistant (Alt+A)"
        >
          <span className="text-xl">🤖</span>
        </button>
        <button
          onClick={() => setShowCamera(!showCamera)}
          className={`w-12 h-12 rounded-full bg-blue-600/90 backdrop-blur-sm flex items-center justify-center hover:scale-110 transition-transform ${
            showCamera ? "ring-2 ring-blue-400" : ""
          }`}
          title="Gesture Camera (G)"
        >
          <span className="text-xl">👋</span>
        </button>
      </div>
    </div>
  );
}
