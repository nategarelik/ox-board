"use client";

import React, {
  memo,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { StemType } from "../../../lib/audio/demucsProcessor";
import useEnhancedDJStore from "../../../stores/enhancedDjStoreWithGestures";
import StemControls from "../../StemControls";
import StemWaveform from "../../StemWaveform";
// import StemMixer from "./StemMixer"; // Removed in cleanup

interface StemVisualizerPanelProps {
  className?: string;
  defaultExpanded?: boolean;
  enableKeyboardShortcuts?: boolean;
  enableTouchGestures?: boolean;
  maxWidth?: number;
  maxHeight?: number;
}

interface PanelLayout {
  showControls: boolean;
  showWaveforms: boolean;
  showMixer: boolean;
  orientation: "horizontal" | "vertical";
  compactMode: boolean;
}

interface KeyboardShortcuts {
  [key: string]: () => void;
}

const defaultLayout: PanelLayout = {
  showControls: true,
  showWaveforms: true,
  showMixer: true,
  orientation: "horizontal",
  compactMode: false,
};

const StemVisualizerPanel: React.FC<StemVisualizerPanelProps> = ({
  className = "",
  defaultExpanded = true,
  enableKeyboardShortcuts = true,
  enableTouchGestures = true,
  maxWidth = 1400,
  maxHeight = 800,
}) => {
  const {
    decks,
    selectedDeck,
    stemViewMode,
    setSelectedDeck,
    setStemViewMode,
    enableStemPlayer,
    disableStemPlayer,
  } = useEnhancedDJStore();

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [layout, setLayout] = useState<PanelLayout>(defaultLayout);
  const [activeChannel, setActiveChannel] = useState(selectedDeck ?? 0);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    element: "panel" | "divider" | null;
  }>({
    isDragging: false,
    startX: 0,
    startY: 0,
    element: null,
  });

  const setChannel = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(decks.length - 1, index));
      setActiveChannel(clamped);
      setSelectedDeck(clamped);
    },
    [decks.length, setSelectedDeck],
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Responsive layout detection
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);

    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  // Auto-adjust layout based on viewport size
  useEffect(() => {
    const isSmallScreen = viewportSize.width < 768;
    const isMediumScreen = viewportSize.width < 1200;

    setLayout((prev) => ({
      ...prev,
      compactMode: isSmallScreen,
      orientation: isSmallScreen ? "vertical" : "horizontal",
      showWaveforms: !isSmallScreen || prev.showWaveforms,
    }));
  }, [viewportSize]);

  // Keyboard shortcuts
  const keyboardShortcuts = useMemo<KeyboardShortcuts>(
    () => ({
      KeyS: () => setIsExpanded((prev) => !prev), // Toggle stem panel
      KeyV: () =>
        setStemViewMode(
          stemViewMode === "individual" ? "combined" : "individual",
        ),
      Digit1: () => setChannel(0),
      Digit2: () => setChannel(1),
      Digit3: () => setChannel(2),
      Digit4: () => setChannel(3),
      KeyC: () =>
        setLayout((prev) => ({ ...prev, compactMode: !prev.compactMode })),
      KeyH: () =>
        setLayout((prev) => ({
          ...prev,
          orientation:
            prev.orientation === "horizontal" ? "vertical" : "horizontal",
        })),
      KeyM: () =>
        setLayout((prev) => ({ ...prev, showMixer: !prev.showMixer })),
      KeyW: () =>
        setLayout((prev) => ({ ...prev, showWaveforms: !prev.showWaveforms })),
    }),
    [stemViewMode, setStemViewMode, setChannel],
  );

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle shortcuts when panel is focused or no input is focused
      const activeElement = document.activeElement;
      const isInputFocused =
        activeElement &&
        (activeElement.tagName === "INPUT" ||
          activeElement.tagName === "TEXTAREA" ||
          (activeElement as HTMLElement).contentEditable === "true");

      if (isInputFocused) return;

      const shortcut = keyboardShortcuts[event.code];
      if (shortcut && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        shortcut();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enableKeyboardShortcuts, keyboardShortcuts]);

  // Touch gesture handling
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(
    null,
  );

  const handleTouchStart = useCallback(
    (event: React.TouchEvent) => {
      if (!enableTouchGestures || event.touches.length !== 1) return;

      const touch = event.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    },
    [enableTouchGestures],
  );

  const handleTouchEnd = useCallback(
    (event: React.TouchEvent) => {
      if (!enableTouchGestures || !touchStartRef.current) return;

      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;

      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const velocity = distance / deltaTime;

      // Swipe gestures
      if (velocity > 0.5 && distance > 50) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          // Horizontal swipe
          if (deltaX > 0) {
            // Swipe right - next channel
            setChannel(Math.min(decks.length - 1, activeChannel + 1));
          } else {
            // Swipe left - previous channel
            setChannel(Math.max(0, activeChannel - 1));
          }
        } else {
          // Vertical swipe
          if (deltaY < 0) {
            // Swipe up - expand panel
            setIsExpanded(true);
          } else {
            // Swipe down - collapse panel
            setIsExpanded(false);
          }
        }
      }

      touchStartRef.current = null;
    },
    [enableTouchGestures, decks.length, activeChannel, setChannel],
  );

  // Panel resize handling
  const handlePanelResize = useCallback((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      const { width, height } = entry.contentRect;

      // Auto-adjust layout based on panel size
      if (width < 600) {
        setLayout((prev) => ({
          ...prev,
          compactMode: true,
          orientation: "vertical",
        }));
      } else if (width > 1000) {
        setLayout((prev) => ({
          ...prev,
          compactMode: false,
          orientation: "horizontal",
        }));
      }
    }
  }, []);

  useEffect(() => {
    if (!panelRef.current) return;

    resizeObserverRef.current = new ResizeObserver(handlePanelResize);
    resizeObserverRef.current.observe(panelRef.current);

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
      }
    };
  }, [handlePanelResize]);

  const handleChannelToggle = useCallback(
    async (channel: number) => {
      const deck = decks[channel];

      if (deck.stemPlayerEnabled) {
        disableStemPlayer(channel);
      } else {
        try {
          await enableStemPlayer(channel);
        } catch (error) {
          console.error(
            `Failed to enable stem player for channel ${channel}:`,
            error,
          );
        }
      }
    },
    [decks, enableStemPlayer, disableStemPlayer],
  );

  const renderChannelTabs = () => (
    <div className="flex bg-gray-800 border-b border-gray-700">
      {decks.map((deck, index) => (
        <button
          key={index}
          onClick={() => setChannel(index)}
          className={`
            flex-1 px-4 py-3 text-sm font-medium transition-all duration-150
            ${
              activeChannel === index
                ? "bg-gray-700 text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-gray-300 hover:bg-gray-750"
            }
          `}
        >
          <div className="flex items-center justify-center gap-2">
            <span>CH{index + 1}</span>
            {deck.track && (
              <div
                className={`w-2 h-2 rounded-full ${
                  deck.stemPlayerEnabled ? "bg-green-500" : "bg-gray-500"
                }`}
              />
            )}
          </div>
          {deck.track && (
            <div className="text-xs text-gray-500 truncate mt-1">
              {deck.track.title}
            </div>
          )}
        </button>
      ))}
    </div>
  );

  const renderLayoutControls = () => (
    <div className="flex items-center gap-2 bg-gray-800 px-4 py-2 border-b border-gray-700">
      {/* View mode toggle */}
      <div className="flex bg-gray-700 rounded">
        <button
          onClick={() => setStemViewMode("individual")}
          className={`px-3 py-1 text-xs rounded-l ${
            stemViewMode === "individual"
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:bg-gray-600"
          }`}
        >
          Individual
        </button>
        <button
          onClick={() => setStemViewMode("combined")}
          className={`px-3 py-1 text-xs rounded-r ${
            stemViewMode === "combined"
              ? "bg-blue-600 text-white"
              : "text-gray-300 hover:bg-gray-600"
          }`}
        >
          Combined
        </button>
      </div>

      {/* Layout toggles */}
      <div className="flex gap-1 ml-4">
        <button
          onClick={() =>
            setLayout((prev) => ({ ...prev, showControls: !prev.showControls }))
          }
          className={`px-2 py-1 text-xs rounded ${
            layout.showControls
              ? "bg-gray-600 text-white"
              : "bg-gray-700 text-gray-400"
          }`}
          title="Toggle Controls"
        >
          CTL
        </button>
        <button
          onClick={() =>
            setLayout((prev) => ({
              ...prev,
              showWaveforms: !prev.showWaveforms,
            }))
          }
          className={`px-2 py-1 text-xs rounded ${
            layout.showWaveforms
              ? "bg-gray-600 text-white"
              : "bg-gray-700 text-gray-400"
          }`}
          title="Toggle Waveforms"
        >
          WAV
        </button>
        <button
          onClick={() =>
            setLayout((prev) => ({ ...prev, showMixer: !prev.showMixer }))
          }
          className={`px-2 py-1 text-xs rounded ${
            layout.showMixer
              ? "bg-gray-600 text-white"
              : "bg-gray-700 text-gray-400"
          }`}
          title="Toggle Mixer"
        >
          MIX
        </button>
      </div>

      {/* Orientation toggle */}
      <button
        onClick={() =>
          setLayout((prev) => ({
            ...prev,
            orientation:
              prev.orientation === "horizontal" ? "vertical" : "horizontal",
          }))
        }
        className="px-2 py-1 text-xs bg-gray-700 text-gray-400 rounded hover:bg-gray-600 ml-2"
        title="Toggle Orientation"
      >
        {layout.orientation === "horizontal" ? "⟷" : "↕"}
      </button>

      {/* Compact mode toggle */}
      <button
        onClick={() =>
          setLayout((prev) => ({ ...prev, compactMode: !prev.compactMode }))
        }
        className={`px-2 py-1 text-xs rounded ${
          layout.compactMode
            ? "bg-gray-600 text-white"
            : "bg-gray-700 text-gray-400"
        }`}
        title="Toggle Compact Mode"
      >
        ⌘
      </button>

      {/* Channel enable/disable */}
      <div className="ml-auto flex gap-1">
        <button
          onClick={() => handleChannelToggle(activeChannel)}
          className={`px-3 py-1 text-xs rounded font-medium ${
            decks[activeChannel].stemPlayerEnabled
              ? "bg-red-600 text-white hover:bg-red-700"
              : "bg-green-600 text-white hover:bg-green-700"
          }`}
        >
          {decks[activeChannel].stemPlayerEnabled ? "Disable" : "Enable"} Stems
        </button>
      </div>
    </div>
  );

  const renderStemContent = () => {
    const deck = decks[activeChannel];

    if (!deck.track) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-800">
          <div className="text-center text-gray-500">
            <div className="text-lg font-medium mb-2">No Track Loaded</div>
            <div className="text-sm">
              Load a track to channel {activeChannel + 1} to see stem controls
            </div>
          </div>
        </div>
      );
    }

    if (!deck.stemPlayerEnabled) {
      return (
        <div className="flex-1 flex items-center justify-center bg-gray-800">
          <div className="text-center text-gray-500">
            <div className="text-lg font-medium mb-2">Stem Player Disabled</div>
            <div className="text-sm mb-4">
              Enable stem player to access advanced controls
            </div>
            <button
              onClick={() => handleChannelToggle(activeChannel)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Enable Stem Player
            </button>
          </div>
        </div>
      );
    }

    const stemTypes: (StemType | "original")[] = [
      "drums",
      "bass",
      "melody",
      "vocals",
      "original",
    ];

    return (
      <div
        className={`flex-1 p-4 overflow-auto ${
          layout.orientation === "horizontal"
            ? "flex flex-row gap-4"
            : "flex flex-col gap-4"
        }`}
        style={{
          maxWidth: layout.orientation === "horizontal" ? maxWidth : undefined,
          maxHeight: layout.orientation === "vertical" ? maxHeight : undefined,
        }}
      >
        {/* Stem Controls */}
        {layout.showControls && (
          <div
            className={`
            ${layout.orientation === "horizontal" ? "flex flex-row gap-4" : "grid grid-cols-5 gap-2"}
            ${layout.compactMode ? "scale-90" : ""}
          `}
          >
            {stemTypes.map((stemType) => (
              <StemControls
                key={stemType}
                channel={activeChannel}
                stemType={stemType}
              />
            ))}
          </div>
        )}

        {/* Waveforms */}
        {layout.showWaveforms && (
          <div
            className={`flex flex-col gap-2 ${layout.orientation === "horizontal" ? "flex-1" : ""}`}
          >
            {stemViewMode === "individual" ? (
              stemTypes.map((stemType) => (
                <StemWaveform
                  key={stemType}
                  channel={activeChannel}
                  stemType={stemType}
                  width={layout.orientation === "horizontal" ? 600 : undefined}
                  height={layout.compactMode ? 80 : 120}
                  className="mb-2"
                />
              ))
            ) : (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="text-sm font-medium text-gray-300 mb-4">
                  Combined Stem View
                </div>
                {/* Combined waveform view would be implemented here */}
                <div className="h-32 bg-gray-800 rounded flex items-center justify-center text-gray-500">
                  Combined stem visualization (coming soon)
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mixer */}
        {layout.showMixer && (
          <div className={layout.orientation === "horizontal" ? "w-80" : ""}>
            {/* <StemMixer
              channel={activeChannel}
              showAdvancedControls={!layout.compactMode}
            /> */}
            <div className="text-white/60 text-sm p-4">
              Stem Mixer (removed in cleanup)
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isExpanded) {
    return (
      <div className={`bg-gray-900 border-t border-gray-700 ${className}`}>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-4 py-2 text-sm text-gray-400 hover:text-gray-300 hover:bg-gray-800 transition-all duration-150"
        >
          <div className="flex items-center justify-center gap-2">
            <span>Show Stem Controls</span>
            <svg
              className="w-4 h-4 transform rotate-180"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div
      ref={panelRef}
      className={`bg-gray-900 border-t border-gray-700 flex flex-col ${className}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        maxHeight: isExpanded ? maxHeight : undefined,
        transition: "max-height 0.3s ease-in-out",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white">STEM VISUALIZER</span>
          <div className="text-xs text-gray-400">
            Channel {activeChannel + 1}
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-gray-300 transition-colors duration-150"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {/* Channel tabs */}
      {renderChannelTabs()}

      {/* Layout controls */}
      {renderLayoutControls()}

      {/* Main content */}
      {renderStemContent()}

      {/* Keyboard shortcuts help */}
      {enableKeyboardShortcuts && (
        <div className="px-4 py-2 bg-gray-800 border-t border-gray-700">
          <div className="text-xs text-gray-500">
            Shortcuts: Ctrl+S (toggle), Ctrl+V (view), Ctrl+1-4 (channels),
            Ctrl+C (compact), Ctrl+H (orientation)
          </div>
        </div>
      )}
    </div>
  );
};

const MemoizedStemVisualizerPanel = memo(StemVisualizerPanel);
MemoizedStemVisualizerPanel.displayName = "StemVisualizerPanel";

export default MemoizedStemVisualizerPanel;
export { StemVisualizerPanel };
