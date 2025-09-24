"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import useEnhancedDJStore from "../stores/enhancedDjStoreWithGestures";
import { useGestures } from "../hooks/useGestures";
import ErrorBoundary from "./ErrorBoundary";
import "../lib/suppressWarnings"; // Auto-suppress expected warnings

// Dynamic imports for components with SSR disabled
const ProfessionalDJInterface = dynamic(
  () => import("./DJ/ProfessionalDJInterface"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white">Loading DJ Interface...</div>
      </div>
    ),
  },
);

const ImmersiveGestureInterface = dynamic(
  () => import("./DJ/ImmersiveGestureInterface"),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="text-white">Loading Immersive Interface...</div>
      </div>
    ),
  },
);

const TutorialOverlay = dynamic(() => import("./DJ/TutorialOverlay"), {
  ssr: false,
});
const LoadingScreen = dynamic(() => import("./DJ/LoadingScreen"), {
  ssr: false,
});
const Header = dynamic(() => import("./DJ/Header"), { ssr: false });
const WelcomeScreen = dynamic(() => import("./DJ/WelcomeScreen"), {
  ssr: false,
});

export default function ClientApp() {
  const [isLoading, setIsLoading] = useState(false); // Don't show loading screen initially
  const [showTutorial, setShowTutorial] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [audioRetryCount, setAudioRetryCount] = useState(0);
  const [uiMode, setUiMode] = useState<"professional" | "immersive">(
    "professional",
  );
  const djStore = useEnhancedDJStore();
  const gestureData = useGestures();

  // Initialize UI mode from localStorage after mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("oxboard-ui-mode");
      if (savedMode === "professional" || savedMode === "immersive") {
        setUiMode(savedMode);
      }
    }
  }, []);

  // Prevent SSR hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Save UI mode preference to localStorage when it changes
  useEffect(() => {
    if (mounted && typeof window !== "undefined") {
      localStorage.setItem("oxboard-ui-mode", uiMode);
    }
  }, [uiMode, mounted]);

  const handleStartDJMode = async () => {
    try {
      setInitError(null);

      // First, initialize AudioService (requires user gesture)
      const { getAudioService } = await import("../services/AudioService");
      const audioService = getAudioService();

      // Initialize audio with user gesture
      if (!audioService.isReady()) {
        await audioService.initialize();
      }

      // Then initialize mixer
      await djStore.initializeMixer();

      // Finally initialize DeckManager
      const { getDeckManager } = await import("../services/DeckManager");
      const deckManager = getDeckManager();

      // Check if decks need initialization
      if (!deckManager.isReady()) {
        await deckManager.initializeDecks();
      }

      djStore.initializeGestureMapper();
      djStore.setDJModeActive(true);
      djStore.setCameraActive(true);
      djStore.setGestureEnabled(true);
    } catch (error) {
      console.error("Failed to initialize DJ mode:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      if (
        errorMessage.includes(
          "AudioService must be initialized before creating DeckManager",
        )
      ) {
        // This is the specific error we're seeing - it means audio init failed
        if (audioRetryCount === 0) {
          setInitError(
            'Click "Start DJ Mode" again to enable audio. First click activates browser audio permissions.',
          );
          setAudioRetryCount(1);
        } else {
          setInitError(
            "Audio initialization failed. Please ensure your browser allows audio playback and try again.",
          );
        }
      } else if (
        errorMessage.includes("user gesture") ||
        errorMessage.includes("AudioContext") ||
        errorMessage.includes("not allowed to start")
      ) {
        setInitError(
          'Browser blocked audio playback. This is normal - just click "Start DJ Mode" again to enable audio.',
        );
        setAudioRetryCount(audioRetryCount + 1);
      } else if (errorMessage.includes("camera")) {
        setInitError(
          "Camera permissions required for gesture control. Please allow camera access.",
        );
      } else {
        setInitError(`Failed to initialize DJ mode: ${errorMessage}`);
      }

      // Attempt partial recovery - try without camera if audio works
      if (!errorMessage.includes("audio")) {
        try {
          djStore.setDJModeActive(true);
          djStore.setCameraActive(false);
          djStore.setGestureEnabled(false);
        } catch (recoveryError) {
          console.error("Recovery failed:", recoveryError);
        }
      }
    }
  };

  const handleStopDJMode = () => {
    djStore.setDJModeActive(false);
    djStore.setCameraActive(false);
    djStore.setGestureEnabled(false);
    gestureData.reset();
  };

  if (!mounted) return null;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary level="page">
      <div className="min-h-screen flex flex-col bg-black">
        {/* Error notification */}
        {initError && (
          <div className="fixed top-4 right-4 z-[200] max-w-md p-4 bg-red-900/90 text-white rounded-lg shadow-xl">
            <div className="flex items-start gap-3">
              <svg
                className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Initialization Error</h3>
                <p className="text-sm text-red-200">{initError}</p>
                <button
                  onClick={() => setInitError(null)}
                  className="mt-3 px-3 py-1 bg-red-800 hover:bg-red-700 rounded text-sm transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
        {uiMode !== "immersive" && (
          <Header
            isDJModeActive={djStore.isDJModeActive}
            cameraActive={djStore.cameraActive}
            viewMode={djStore.viewMode}
            onViewModeChange={djStore.setViewMode}
            onStartDJ={handleStartDJMode}
            onStopDJ={handleStopDJMode}
            onShowTutorial={() => setShowTutorial(true)}
          />
        )}

        {uiMode === "immersive" ? (
          <ImmersiveGestureInterface />
        ) : djStore.isDJModeActive ? (
          <ProfessionalDJInterface
            djState={{
              isDJModeActive: djStore.isDJModeActive,
              cameraActive: djStore.cameraActive,
              gestureEnabled: djStore.gestureEnabled,
              gestureMapperEnabled: djStore.gestureMapperEnabled,
              decks: djStore.decks,
              viewMode: djStore.viewMode,
              crossfaderPosition: djStore.crossfaderPosition || 0,
              masterBPM: djStore.masterBPM || 128,
              isRecording: djStore.isRecording || false,
            }}
            djActions={{
              initializeMixer: djStore.initializeMixer,
              setDJModeActive: djStore.setDJModeActive,
              setCameraActive: djStore.setCameraActive,
              setGestureEnabled: djStore.setGestureEnabled,
              setViewMode: djStore.setViewMode,
              initializeGestureMapper: djStore.initializeGestureMapper,
              updateGestureControls: djStore.updateGestureControls,
              playDeck: djStore.playDeck || (() => {}),
              pauseDeck: djStore.pauseDeck || (() => {}),
              setCuePoint: djStore.setCuePoint || (() => {}),
              setCrossfaderPosition:
                djStore.setCrossfaderPosition || (() => {}),
              loadTrack: djStore.loadTrack || (() => {}),
            }}
            gestureData={gestureData}
          />
        ) : (
          <>
            <WelcomeScreen onStart={handleStartDJMode} />
            {/* UI Mode Selector - Always visible on welcome screen */}
            <div className="fixed bottom-4 left-4 z-[100] flex flex-col gap-2">
              <span className="text-xs text-gray-400 mb-1">
                Select UI Mode:
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setUiMode("professional")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-lg ${
                    uiMode === "professional"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800/90 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  Professional
                </button>
                <button
                  onClick={() => setUiMode("immersive")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-lg ${
                    (uiMode as "professional" | "immersive") === "immersive"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-800/90 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  Immersive
                </button>
              </div>
            </div>
          </>
        )}

        <TutorialOverlay
          isVisible={showTutorial}
          onClose={() => setShowTutorial(false)}
        />

        {/* UI Mode Toggle Button - Show during DJ mode */}
        {djStore.isDJModeActive && uiMode !== "immersive" && (
          <div className="fixed bottom-4 left-4 z-[100] flex gap-2">
            <button
              onClick={() => setUiMode("professional")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-lg ${
                uiMode === "professional"
                  ? "bg-purple-600 text-white"
                  : "bg-gray-800/90 text-gray-300 hover:bg-gray-700"
              }`}
            >
              Professional
            </button>
            <button
              onClick={() => setUiMode("immersive")}
              className="px-3 py-1.5 bg-gray-800/90 text-gray-300 hover:bg-gray-700 rounded-lg text-xs font-medium transition-all shadow-lg"
            >
              Immersive
            </button>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
}
