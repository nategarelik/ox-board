"use client";

import { useEffect, useState } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { getScreenReaderAnnouncer } from "@/lib/accessibility/screenReaderAnnouncer";
import useEnhancedDJStore from "@/stores/enhancedDjStoreWithGestures";

interface KeyboardShortcutsProviderProps {
  children: React.ReactNode;
}

export default function KeyboardShortcutsProvider({
  children,
}: KeyboardShortcutsProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const {
    playDeck,
    pauseDeck,
    setDeckVolume,
    setCrossfaderPosition,
    decks,
    crossfaderConfig,
    masterConfig,
    setMasterGain,
    initializeAudioOnUserGesture,
  } = useEnhancedDJStore();

  const announcer = getScreenReaderAnnouncer();

  // Define DJ-specific keyboard shortcuts
  const shortcuts = [
    {
      key: " ",
      action: async () => {
        // Initialize audio on user gesture first
        try {
          await initializeAudioOnUserGesture();
        } catch (error) {
          console.error("Failed to initialize audio:", error);
          return;
        }

        // Toggle play/pause for active deck
        const activeDeck = decks[0]?.isPlaying
          ? 0
          : decks[1]?.isPlaying
            ? 1
            : 0;
        if (decks[activeDeck]?.isPlaying) {
          pauseDeck(activeDeck);
          announcer.announceDeckState(activeDeck === 0 ? "A" : "B", "paused");
        } else {
          playDeck(activeDeck);
          announcer.announceDeckState(activeDeck === 0 ? "A" : "B", "playing");
        }
      },
      description: "Play/Pause active deck",
    },
    {
      key: "q",
      action: () => {
        // Cue point functionality would be implemented here
        announcer.announceCuePoint("A");
      },
      description: "Set cue point on Deck A",
    },
    {
      key: "p",
      action: () => {
        // Cue point functionality would be implemented here
        announcer.announceCuePoint("B");
      },
      description: "Set cue point on Deck B",
    },
    {
      key: "ArrowLeft",
      action: () => {
        const currentPosition = crossfaderConfig?.position || 0;
        const newPosition = Math.max(-1, currentPosition - 0.1);
        setCrossfaderPosition(newPosition);
        announcer.announceCrossfaderPosition(newPosition);
      },
      description: "Move crossfader left",
    },
    {
      key: "ArrowRight",
      action: () => {
        const currentPosition = crossfaderConfig?.position || 0;
        const newPosition = Math.min(1, currentPosition + 0.1);
        setCrossfaderPosition(newPosition);
        announcer.announceCrossfaderPosition(newPosition);
      },
      description: "Move crossfader right",
    },
    {
      key: "ArrowUp",
      action: () => {
        const currentGain = masterConfig?.gain || 0.85;
        const newGain = Math.min(1, currentGain + 0.05);
        setMasterGain(newGain);
        announcer.announceVolumeChange("master", newGain);
      },
      description: "Master volume up",
    },
    {
      key: "ArrowDown",
      action: () => {
        const currentGain = masterConfig?.gain || 0.85;
        const newGain = Math.max(0, currentGain - 0.05);
        setMasterGain(newGain);
        announcer.announceVolumeChange("master", newGain);
      },
      description: "Master volume down",
    },
    {
      key: "s",
      action: () => {
        if (decks[0]?.isPlaying && decks[1]?.isPlaying) {
          // Sync functionality would be implemented here
          announcer.announceSyncState(true, "A");
        }
      },
      description: "Sync decks",
    },
    {
      key: "l",
      action: () => {
        const activeDeck = decks[0]?.isPlaying
          ? 0
          : decks[1]?.isPlaying
            ? 1
            : 0;
        // Loop functionality would be implemented here
        announcer.announceLoopState(activeDeck === 0 ? "A" : "B", true, 4);
      },
      description: "Toggle loop",
    },
    {
      key: "r",
      action: () => {
        // Recording functionality would be implemented here
        announcer.announceRecordingState(true);
      },
      description: "Toggle recording",
    },
    {
      key: "1",
      action: async () => {
        try {
          await initializeAudioOnUserGesture();
        } catch (error) {
          console.error("Failed to initialize audio:", error);
          return;
        }
        playDeck(0);
        announcer.announceDeckState("A", "playing");
      },
      description: "Select and play Deck A",
    },
    {
      key: "2",
      action: async () => {
        try {
          await initializeAudioOnUserGesture();
        } catch (error) {
          console.error("Failed to initialize audio:", error);
          return;
        }
        playDeck(1);
        announcer.announceDeckState("B", "playing");
      },
      description: "Select and play Deck B",
    },
    {
      key: "Tab",
      action: () => {
        // Switch focus between decks
        const focusedDeck = document.activeElement?.closest('[role="region"]');
        const deckA = document.querySelector('[aria-label*="Deck A"]');
        const deckB = document.querySelector('[aria-label*="Deck B"]');

        if (focusedDeck === deckA && deckB) {
          (deckB.querySelector("button") as HTMLElement)?.focus();
        } else if (deckA) {
          (deckA.querySelector("button") as HTMLElement)?.focus();
        }
      },
      description: "Switch focus between decks",
    },
    {
      key: "Escape",
      action: () => {
        pauseDeck(0);
        pauseDeck(1);
        setCrossfaderPosition(0);
        setMasterGain(0.85);
        announcer.announce("All playback stopped");
      },
      description: "Stop all playback",
    },
    {
      key: "h",
      ctrl: true,
      action: () => {
        // Show keyboard shortcuts help
        setShowHelp(true);
        announcer.announce("Keyboard shortcuts help opened");
      },
      description: "Show keyboard shortcuts help",
    },
  ];

  useKeyboardShortcuts(shortcuts);

  // Only mount modal on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  // Track keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Add keyboard navigation class for focus styles
      document.body.classList.add("keyboard-nav");
    };

    const handleMouseDown = () => {
      // Remove keyboard navigation class when using mouse
      document.body.classList.remove("keyboard-nav");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("mousedown", handleMouseDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return (
    <>
      {children}
      {/* Only render modal on client side when explicitly shown */}
      {mounted && showHelp && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="dialog"
          aria-label="Keyboard shortcuts help"
          onClick={(e) => {
            // Close when clicking backdrop
            if (e.target === e.currentTarget) {
              setShowHelp(false);
              announcer.announce("Keyboard shortcuts help closed");
            }
          }}
        >
          <div className="bg-gray-900 p-6 rounded-lg max-w-2xl max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-ox-accent">
              Keyboard Shortcuts
            </h2>
            <div className="space-y-2">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-400">{shortcut.description}:</span>
                  <kbd className="px-2 py-1 bg-gray-800 rounded text-white">
                    {shortcut.ctrl ? "Ctrl + " : ""}
                    {shortcut.key === " " ? "Space" : shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
            <button
              className="mt-6 px-4 py-2 bg-ox-primary text-white rounded hover:bg-ox-primary/80 focus:outline-none focus:ring-2 focus:ring-ox-accent"
              onClick={() => {
                setShowHelp(false);
                announcer.announce("Keyboard shortcuts help closed");
              }}
              aria-label="Close help"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
