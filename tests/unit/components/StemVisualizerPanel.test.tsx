import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StemVisualizerPanel from "@/components/StemVisualizerPanel";
import useEnhancedDJStore from "@/stores/enhancedDjStoreWithGestures";

// Mock the enhanced DJ store
jest.mock("@/stores/enhancedDjStoreWithGestures");
const mockUseEnhancedDJStore = useEnhancedDJStore as jest.MockedFunction<
  typeof useEnhancedDJStore
>;

// Mock child components
jest.mock("@/components/StemControls", () => {
  return function MockStemControls({ channel, stemType }: any) {
    return (
      <div data-testid={`stem-controls-${channel}-${stemType}`}>
        StemControls
      </div>
    );
  };
});

jest.mock("@/components/StemWaveform", () => {
  return function MockStemWaveform({ channel, stemType }: any) {
    return (
      <div data-testid={`stem-waveform-${channel}-${stemType}`}>
        StemWaveform
      </div>
    );
  };
});

jest.mock("@/components/StemMixer", () => {
  return function MockStemMixer({ channel }: any) {
    return <div data-testid={`stem-mixer-${channel}`}>StemMixer</div>;
  };
});

describe("StemVisualizerPanel", () => {
  const mockTrack1 = {
    id: "track-1",
    title: "Test Track 1",
    artist: "Artist 1",
    duration: 180,
    bpm: 128,
    key: "C",
  };

  const mockTrack2 = {
    id: "track-2",
    title: "Test Track 2",
    artist: "Artist 2",
    duration: 240,
    bpm: 130,
    key: "D",
  };

  const mockDecks = [
    {
      id: 0,
      track: mockTrack1,
      isPlaying: false,
      currentTime: 30,
      playbackRate: 1.0,
      volume: 0.75,
      cuePoints: [],
      loopStart: null,
      loopEnd: null,
      stemPlayerEnabled: true,
    },
    {
      id: 1,
      track: mockTrack2,
      isPlaying: true,
      currentTime: 60,
      playbackRate: 1.0,
      volume: 0.8,
      cuePoints: [],
      loopStart: null,
      loopEnd: null,
      stemPlayerEnabled: false,
    },
    {
      id: 2,
      track: null,
      isPlaying: false,
      currentTime: 0,
      playbackRate: 1.0,
      volume: 0.75,
      cuePoints: [],
      loopStart: null,
      loopEnd: null,
      stemPlayerEnabled: false,
    },
    {
      id: 3,
      track: null,
      isPlaying: false,
      currentTime: 0,
      playbackRate: 1.0,
      volume: 0.75,
      cuePoints: [],
      loopStart: null,
      loopEnd: null,
      stemPlayerEnabled: false,
    },
  ];

  const mockSetSelectedDeck = jest.fn();
  const mockSetStemViewMode = jest.fn();
  const mockEnableStemPlayer = jest.fn().mockResolvedValue(undefined);
  const mockDisableStemPlayer = jest.fn().mockImplementation(() => {});

  const createStoreState = (
    overrides: Partial<ReturnType<typeof useEnhancedDJStore>> = {},
  ) =>
    ({
      decks: mockDecks.map((deck) => ({
        ...deck,
        track: deck.track ? { ...deck.track } : null,
      })),
      selectedDeck: 0,
      stemViewMode: "individual" as const,
      setSelectedDeck: mockSetSelectedDeck,
      setStemViewMode: mockSetStemViewMode,
      enableStemPlayer: mockEnableStemPlayer,
      disableStemPlayer: mockDisableStemPlayer,
      ...overrides,
    }) as any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockEnableStemPlayer.mockResolvedValue(undefined);

    mockUseEnhancedDJStore.mockReturnValue(createStoreState());

    global.ResizeObserver = jest.fn().mockImplementation((callback) => ({
      observe: jest.fn(),
      unobserve: jest.fn(),
      disconnect: jest.fn(),
    }));

    Object.defineProperty(window, "innerWidth", {
      writable: true,
      configurable: true,
      value: 1024,
    });

    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 768,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Panel State Management", () => {
    it("renders expanded by default", () => {
      render(<StemVisualizerPanel />);

      expect(screen.getByText("STEM VISUALIZER")).toBeInTheDocument();
      expect(screen.getByText("Channel 1")).toBeInTheDocument();
    });

    it("can be collapsed", async () => {
      const user = userEvent.setup();
      render(<StemVisualizerPanel />);

      const collapseButton = screen.getByRole("button", { name: "" }); // SVG button
      await user.click(collapseButton);

      expect(screen.getByText("Show Stem Controls")).toBeInTheDocument();
    });

    it("can be expanded from collapsed state", async () => {
      const user = userEvent.setup();
      render(<StemVisualizerPanel defaultExpanded={false} />);

      expect(screen.getByText("Show Stem Controls")).toBeInTheDocument();

      const expandButton = screen.getByText("Show Stem Controls");
      await user.click(expandButton);

      await waitFor(() => {
        expect(screen.getByText("STEM VISUALIZER")).toBeInTheDocument();
      });
    });
  });

  describe("Channel Tabs", () => {
    it("renders all channel tabs", () => {
      render(<StemVisualizerPanel />);

      expect(screen.getByText("CH1")).toBeInTheDocument();
      expect(screen.getByText("CH2")).toBeInTheDocument();
      expect(screen.getByText("CH3")).toBeInTheDocument();
      expect(screen.getByText("CH4")).toBeInTheDocument();
    });

    it("shows track titles in channel tabs", () => {
      render(<StemVisualizerPanel />);

      expect(screen.getByText("Test Track 1")).toBeInTheDocument();
      expect(screen.getByText("Test Track 2")).toBeInTheDocument();
    });

    it("shows stem player status indicators", () => {
      render(<StemVisualizerPanel />);

      const channelTabs = screen.getAllByRole("button");
      const ch1Tab = channelTabs.find((tab) =>
        tab.textContent?.includes("CH1"),
      );
      const ch2Tab = channelTabs.find((tab) =>
        tab.textContent?.includes("CH2"),
      );

      // CH1 has stem player enabled (green dot)
      expect(ch1Tab?.querySelector(".bg-green-500")).toBeInTheDocument();

      // CH2 has stem player disabled (gray dot)
      expect(ch2Tab?.querySelector(".bg-gray-500")).toBeInTheDocument();
    });

    it("switches channels when tab clicked", async () => {
      const user = userEvent.setup();
      render(<StemVisualizerPanel />);

      const ch2Tab = screen.getByText("CH2").closest("button")!;
      await user.click(ch2Tab);

      expect(mockSetSelectedDeck).toHaveBeenCalledWith(1);
    });

    it("highlights active channel tab", () => {
      render(<StemVisualizerPanel />);

      const ch1Tab = screen.getByText("CH1").closest("button")!;
      expect(ch1Tab).toHaveClass("bg-gray-700", "text-white");
    });
  });

  describe("Layout Controls", () => {
    it("toggles view mode between individual and combined", async () => {
      const user = userEvent.setup();
      render(<StemVisualizerPanel />);

      const combinedButton = screen.getByText("Combined");
      await user.click(combinedButton);

      expect(mockSetStemViewMode).toHaveBeenCalledWith("combined");
    });

    it("toggles layout components", async () => {
      const user = userEvent.setup();
      render(<StemVisualizerPanel />);

      const controlsToggle = screen.getByText("CTL");
      const waveformsToggle = screen.getByText("WAV");
      const mixerToggle = screen.getByText("MIX");

      await user.click(controlsToggle);
      await user.click(waveformsToggle);
      await user.click(mixerToggle);

      // Should toggle layout state (visual changes)
      expect(controlsToggle).toBeInTheDocument();
      expect(waveformsToggle).toBeInTheDocument();
      expect(mixerToggle).toBeInTheDocument();
    });

    it("toggles orientation", async () => {
      const user = userEvent.setup();
      render(<StemVisualizerPanel />);

      const orientationToggle = screen.getByTitle("Toggle Orientation");
      await user.click(orientationToggle);

      // Should change orientation
      expect(orientationToggle).toBeInTheDocument();
    });

    it("toggles compact mode", async () => {
      const user = userEvent.setup();
      render(<StemVisualizerPanel />);

      const compactToggle = screen.getByTitle("Toggle Compact Mode");
      await user.click(compactToggle);

      // Should toggle compact mode
      expect(compactToggle).toBeInTheDocument();
    });
  });

  describe("Stem Player Management", () => {
    it("enables stem player when enable button clicked", async () => {
      const user = userEvent.setup();

      // Mock channel 1 (disabled)
      mockUseEnhancedDJStore.mockReturnValue(
        createStoreState({ selectedDeck: 1 }),
      );

      render(<StemVisualizerPanel />);

      const enableButton = screen.getByText("Enable Stems");
      await user.click(enableButton);

      expect(mockEnableStemPlayer).toHaveBeenCalledWith(1);
    });

    it("disables stem player when disable button clicked", async () => {
      const user = userEvent.setup();
      render(<StemVisualizerPanel />);

      const disableButton = screen.getByText("Disable Stems");
      await user.click(disableButton);

      expect(mockDisableStemPlayer).toHaveBeenCalledWith(0);
    });

    it("handles stem player enable errors gracefully", async () => {
      const user = userEvent.setup();
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

      mockEnableStemPlayer.mockRejectedValue(new Error("Enable failed"));

      mockUseEnhancedDJStore.mockReturnValue(
        createStoreState({ selectedDeck: 1 }),
      );

      render(<StemVisualizerPanel />);

      const enableButton = screen.getByText("Enable Stems");
      await user.click(enableButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to enable stem player for channel 1:",
          expect.any(Error),
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Content Rendering", () => {
    it("shows no track message when no track loaded", () => {
      mockUseEnhancedDJStore.mockReturnValue(
        createStoreState({ selectedDeck: 2 }),
      );

      render(<StemVisualizerPanel />);

      expect(screen.getByText("No Track Loaded")).toBeInTheDocument();
      expect(
        screen.getByText("Load a track to channel 3 to see stem controls"),
      ).toBeInTheDocument();
    });

    it("shows stem player disabled message when disabled", () => {
      mockUseEnhancedDJStore.mockReturnValue(
        createStoreState({ selectedDeck: 1 }),
      );

      render(<StemVisualizerPanel />);

      expect(screen.getByText("Stem Player Disabled")).toBeInTheDocument();
      expect(
        screen.getByText("Enable stem player to access advanced controls"),
      ).toBeInTheDocument();
    });

    it("renders stem controls when enabled", () => {
      render(<StemVisualizerPanel />);

      // Should render controls for all stem types
      expect(screen.getByTestId("stem-controls-0-drums")).toBeInTheDocument();
      expect(screen.getByTestId("stem-controls-0-bass")).toBeInTheDocument();
      expect(screen.getByTestId("stem-controls-0-melody")).toBeInTheDocument();
      expect(screen.getByTestId("stem-controls-0-vocals")).toBeInTheDocument();
      expect(
        screen.getByTestId("stem-controls-0-original"),
      ).toBeInTheDocument();
    });

    it("renders individual waveforms in individual mode", () => {
      render(<StemVisualizerPanel />);

      expect(screen.getByTestId("stem-waveform-0-drums")).toBeInTheDocument();
      expect(screen.getByTestId("stem-waveform-0-bass")).toBeInTheDocument();
      expect(screen.getByTestId("stem-waveform-0-melody")).toBeInTheDocument();
      expect(screen.getByTestId("stem-waveform-0-vocals")).toBeInTheDocument();
      expect(
        screen.getByTestId("stem-waveform-0-original"),
      ).toBeInTheDocument();
    });

    it("renders combined view in combined mode", async () => {
      const user = userEvent.setup();

      mockUseEnhancedDJStore.mockReturnValue({
        decks: mockDecks,
        selectedDeck: 0,
        stemViewMode: "combined" as const,
        setSelectedDeck: mockSetSelectedDeck,
        setStemViewMode: mockSetStemViewMode,
        enableStemPlayer: mockEnableStemPlayer,
        disableStemPlayer: mockDisableStemPlayer,
      } as any);

      render(<StemVisualizerPanel />);

      expect(screen.getByText("Combined Stem View")).toBeInTheDocument();
      expect(
        screen.getByText("Combined stem visualization (coming soon)"),
      ).toBeInTheDocument();
    });

    it("renders stem mixer", () => {
      render(<StemVisualizerPanel />);

      expect(screen.getByTestId("stem-mixer-0")).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("adapts layout for small screens", async () => {
      // Mock small screen
      Object.defineProperty(window, "innerWidth", {
        value: 600,
      });

      render(<StemVisualizerPanel />);

      // Trigger resize event
      fireEvent(window, new Event("resize"));

      await waitFor(() => {
        // Should adapt to smaller screen
        expect(screen.getByText("STEM VISUALIZER")).toBeInTheDocument();
      });
    });

    it("adapts layout for medium screens", async () => {
      // Mock medium screen
      Object.defineProperty(window, "innerWidth", {
        value: 900,
      });

      render(<StemVisualizerPanel />);

      // Trigger resize event
      fireEvent(window, new Event("resize"));

      await waitFor(() => {
        expect(screen.getByText("STEM VISUALIZER")).toBeInTheDocument();
      });
    });

    it("uses ResizeObserver for panel resize detection", () => {
      render(<StemVisualizerPanel />);

      expect(global.ResizeObserver).toHaveBeenCalled();
    });
  });

  describe("Keyboard Shortcuts", () => {
    it("toggles panel with Ctrl+S", async () => {
      const user = userEvent.setup();
      render(<StemVisualizerPanel enableKeyboardShortcuts={true} />);

      await user.keyboard("{Control>}s{/Control}");

      // Should toggle panel
      await waitFor(() => {
        expect(screen.queryByText("STEM VISUALIZER")).not.toBeInTheDocument();
      });
    });

    it("toggles view mode with Ctrl+V", async () => {
      const user = userEvent.setup();
      render(<StemVisualizerPanel enableKeyboardShortcuts={true} />);

      await user.keyboard("{Control>}v{/Control}");

      expect(mockSetStemViewMode).toHaveBeenCalledWith("combined");
    });

    it("switches channels with Ctrl+1-4", async () => {
      const user = userEvent.setup();
      render(<StemVisualizerPanel enableKeyboardShortcuts={true} />);

      await user.keyboard("{Control>}2{/Control}");

      // Should switch to channel 1 (0-indexed)
      await waitFor(() => {
        expect(screen.getByText("Channel 2")).toBeInTheDocument();
      });
    });

    it("ignores shortcuts when input is focused", async () => {
      const user = userEvent.setup();
      render(
        <div>
          <input type="text" />
          <StemVisualizerPanel enableKeyboardShortcuts={true} />
        </div>,
      );

      const input = screen.getByRole("textbox");
      await user.click(input);

      await user.keyboard("{Control>}s{/Control}");

      // Should not toggle panel when input is focused
      expect(screen.getByText("STEM VISUALIZER")).toBeInTheDocument();
    });

    it("can be disabled", async () => {
      const user = userEvent.setup();
      render(<StemVisualizerPanel enableKeyboardShortcuts={false} />);

      await user.keyboard("{Control>}s{/Control}");

      // Should not respond to shortcuts
      expect(screen.getByText("STEM VISUALIZER")).toBeInTheDocument();
    });
  });

  describe("Touch Gestures", () => {
    it("handles touch start and end events", () => {
      render(<StemVisualizerPanel enableTouchGestures={true} />);

      const panel = screen.getByText("STEM VISUALIZER").closest("div")!;

      fireEvent.touchStart(panel, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(panel, {
        changedTouches: [{ clientX: 150, clientY: 100 }],
      });

      // Should handle touch events without errors
      expect(panel).toBeInTheDocument();
    });

    it("switches channels on horizontal swipe", async () => {
      render(<StemVisualizerPanel enableTouchGestures={true} />);

      const panel = screen.getByText("STEM VISUALIZER").closest("div")!;

      // Mock rapid swipe right
      const startTime = Date.now();
      jest
        .spyOn(Date, "now")
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(startTime + 100);

      fireEvent.touchStart(panel, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(panel, {
        changedTouches: [{ clientX: 200, clientY: 100 }],
      });

      // Should attempt to switch to next channel
      await waitFor(() => {
        expect(screen.getByText("Channel 2")).toBeInTheDocument();
      });
    });

    it("toggles panel on vertical swipe", async () => {
      render(<StemVisualizerPanel enableTouchGestures={true} />);

      const panel = screen.getByText("STEM VISUALIZER").closest("div")!;

      // Mock rapid swipe down
      const startTime = Date.now();
      jest
        .spyOn(Date, "now")
        .mockReturnValueOnce(startTime)
        .mockReturnValueOnce(startTime + 100);

      fireEvent.touchStart(panel, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(panel, {
        changedTouches: [{ clientX: 100, clientY: 200 }],
      });

      // Should collapse panel
      await waitFor(() => {
        expect(screen.getByText("Show Stem Controls")).toBeInTheDocument();
      });
    });

    it("can be disabled", () => {
      render(<StemVisualizerPanel enableTouchGestures={false} />);

      const panel = screen.getByText("STEM VISUALIZER").closest("div")!;

      fireEvent.touchStart(panel, {
        touches: [{ clientX: 100, clientY: 100 }],
      });

      fireEvent.touchEnd(panel, {
        changedTouches: [{ clientX: 150, clientY: 100 }],
      });

      // Should not respond to gestures
      expect(screen.getByText("Channel 1")).toBeInTheDocument();
    });
  });

  describe("Performance", () => {
    it("uses React.memo for optimization", () => {
      const { rerender } = render(<StemVisualizerPanel />);

      // Same props should not cause re-render
      rerender(<StemVisualizerPanel />);

      expect(StemVisualizerPanel.displayName).toBeDefined();
    });

    it("cleans up event listeners on unmount", () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        "removeEventListener",
      );

      const { unmount } = render(
        <StemVisualizerPanel enableKeyboardShortcuts={true} />,
      );

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "keydown",
        expect.any(Function),
      );
      removeEventListenerSpy.mockRestore();
    });

    it("cleans up ResizeObserver on unmount", () => {
      const disconnectSpy = jest.fn();
      const mockResizeObserver = jest.fn().mockImplementation(() => ({
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: disconnectSpy,
      }));

      global.ResizeObserver = mockResizeObserver;

      const { unmount } = render(<StemVisualizerPanel />);

      unmount();

      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("has proper heading structure", () => {
      render(<StemVisualizerPanel />);

      expect(screen.getByText("STEM VISUALIZER")).toBeInTheDocument();
    });

    it("has accessible button labels", () => {
      render(<StemVisualizerPanel />);

      expect(screen.getByText("Individual")).toBeInTheDocument();
      expect(screen.getByText("Combined")).toBeInTheDocument();
      expect(screen.getByTitle("Toggle Orientation")).toBeInTheDocument();
      expect(screen.getByTitle("Toggle Compact Mode")).toBeInTheDocument();
    });

    it("shows keyboard shortcuts help", () => {
      render(<StemVisualizerPanel enableKeyboardShortcuts={true} />);

      expect(screen.getByText(/Shortcuts:/)).toBeInTheDocument();
    });
  });
});
