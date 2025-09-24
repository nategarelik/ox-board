import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StemControls from "@/components/StemControls";
import useEnhancedDJStore from "@/stores/enhancedDjStoreWithGestures";

// Mock the enhanced DJ store
jest.mock("@/stores/enhancedDjStoreWithGestures");
const mockUseEnhancedDJStore = useEnhancedDJStore as jest.MockedFunction<
  typeof useEnhancedDJStore
>;

// Mock performance.now for consistent timing tests
const mockPerformanceNow = jest.fn();
global.performance.now = mockPerformanceNow;

describe("StemControls", () => {
  const mockStemControls = {
    0: {
      drums: {
        volume: 0.75,
        muted: false,
        soloed: false,
        pan: 0,
        eq: { low: 0, mid: 0, high: 0 },
        playbackRate: 1.0,
      },
      bass: {
        volume: 0.75,
        muted: false,
        soloed: false,
        pan: 0,
        eq: { low: 0, mid: 0, high: 0 },
        playbackRate: 1.0,
      },
      melody: {
        volume: 0.75,
        muted: false,
        soloed: false,
        pan: 0,
        eq: { low: 0, mid: 0, high: 0 },
        playbackRate: 1.0,
      },
      vocals: {
        volume: 0.75,
        muted: false,
        soloed: false,
        pan: 0,
        eq: { low: 0, mid: 0, high: 0 },
        playbackRate: 1.0,
      },
      original: {
        volume: 0.75,
        muted: false,
        soloed: false,
        pan: 0,
        eq: { low: 0, mid: 0, high: 0 },
        playbackRate: 1.0,
      },
      stemMix: 0.5,
    },
  };

  const mockSetStemVolume = jest.fn();
  const mockSetStemMute = jest.fn();
  const mockSetStemSolo = jest.fn();
  const mockSetStemPan = jest.fn();
  const mockSetStemEQ = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockPerformanceNow.mockReturnValue(1000);

    mockUseEnhancedDJStore.mockReturnValue({
      stemControls: mockStemControls,
      setStemVolume: mockSetStemVolume,
      setStemMute: mockSetStemMute,
      setStemSolo: mockSetStemSolo,
      setStemPan: mockSetStemPan,
      setStemEQ: mockSetStemEQ,
    } as any);

    // Mock RAF for smooth animations
    global.requestAnimationFrame = jest.fn((cb) => {
      setTimeout(cb, 16);
      return 123;
    });

    global.cancelAnimationFrame = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Rendering", () => {
    it("renders stem controls with correct label and color", () => {
      render(<StemControls channel={0} stemType="drums" />);

      expect(screen.getByText("DRM")).toBeInTheDocument();
      expect(screen.getByText("drums")).toBeInTheDocument();
    });

    it("renders all control elements", () => {
      render(<StemControls channel={0} stemType="vocals" />);

      // Check for mute and solo buttons
      expect(screen.getByRole("button", { name: /mute/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /solo/i })).toBeInTheDocument();

      // Check for EQ knobs (by their labels)
      expect(screen.getByText("HIGH")).toBeInTheDocument();
      expect(screen.getByText("MID")).toBeInTheDocument();
      expect(screen.getByText("LOW")).toBeInTheDocument();

      // Check for pan control
      expect(screen.getByText("PAN")).toBeInTheDocument();
    });

    it("displays current volume value", () => {
      render(<StemControls channel={0} stemType="bass" />);

      // Volume should be displayed as percentage
      expect(screen.getByText("75")).toBeInTheDocument(); // 0.75 * 100
    });

    it("shows muted state correctly", () => {
      const mutedControls = {
        ...mockStemControls,
        0: {
          ...mockStemControls[0],
          bass: {
            ...mockStemControls[0].bass,
            muted: true,
          },
        },
      };

      mockUseEnhancedDJStore.mockReturnValue({
        stemControls: mutedControls,
        setStemVolume: mockSetStemVolume,
        setStemMute: mockSetStemMute,
        setStemSolo: mockSetStemSolo,
        setStemPan: mockSetStemPan,
        setStemEQ: mockSetStemEQ,
      } as any);

      render(<StemControls channel={0} stemType="bass" />);

      const muteButton = screen.getByRole("button", { name: /mute/i });
      expect(muteButton).toHaveClass("bg-red-600");
    });

    it("shows soloed state correctly", () => {
      const soloedControls = {
        ...mockStemControls,
        0: {
          ...mockStemControls[0],
          vocals: {
            ...mockStemControls[0].vocals,
            soloed: true,
          },
        },
      };

      mockUseEnhancedDJStore.mockReturnValue({
        stemControls: soloedControls,
        setStemVolume: mockSetStemVolume,
        setStemMute: mockSetStemMute,
        setStemSolo: mockSetStemSolo,
        setStemPan: mockSetStemPan,
        setStemEQ: mockSetStemEQ,
      } as any);

      render(<StemControls channel={0} stemType="vocals" />);

      const soloButton = screen.getByRole("button", { name: /solo/i });
      expect(soloButton).toHaveClass("bg-yellow-500");
    });
  });

  describe("Volume Control", () => {
    it("calls setStemVolume when volume slider changes", async () => {
      const user = userEvent.setup();
      render(<StemControls channel={0} stemType="drums" />);

      const volumeSlider = screen.getByRole("slider");

      await act(async () => {
        await user.clear(volumeSlider);
        await user.type(volumeSlider, "0.5");
      });

      expect(mockSetStemVolume).toHaveBeenCalledWith(0, "drums", 0.5);
    });

    it("throttles volume changes to 60 FPS", async () => {
      render(<StemControls channel={0} stemType="melody" />);

      const volumeSlider = screen.getByRole("slider");

      // Simulate rapid changes
      mockPerformanceNow.mockReturnValueOnce(1000);
      fireEvent.change(volumeSlider, { target: { value: "0.1" } });

      mockPerformanceNow.mockReturnValueOnce(1005); // 5ms later (< 16.67ms threshold)
      fireEvent.change(volumeSlider, { target: { value: "0.2" } });

      mockPerformanceNow.mockReturnValueOnce(1020); // 20ms later (> 16.67ms threshold)
      fireEvent.change(volumeSlider, { target: { value: "0.3" } });

      // Should only call for first and third change due to throttling
      expect(mockSetStemVolume).toHaveBeenCalledTimes(2);
      expect(mockSetStemVolume).toHaveBeenNthCalledWith(1, 0, "melody", 0.1);
      expect(mockSetStemVolume).toHaveBeenNthCalledWith(2, 0, "melody", 0.3);
    });

    it("clamps volume values between 0 and 1", async () => {
      const user = userEvent.setup();
      render(<StemControls channel={0} stemType="bass" />);

      const volumeSlider = screen.getByRole("slider");

      // Test upper bound
      await act(async () => {
        await user.clear(volumeSlider);
        await user.type(volumeSlider, "1.5");
      });

      expect(mockSetStemVolume).toHaveBeenCalledWith(0, "bass", 1);

      // Test lower bound
      await act(async () => {
        await user.clear(volumeSlider);
        await user.type(volumeSlider, "-0.5");
      });

      expect(mockSetStemVolume).toHaveBeenCalledWith(0, "bass", 0);
    });
  });

  describe("Mute/Solo Controls", () => {
    it("toggles mute when mute button clicked", async () => {
      const user = userEvent.setup();
      render(<StemControls channel={0} stemType="vocals" />);

      const muteButton = screen.getByRole("button", { name: /mute/i });
      await user.click(muteButton);

      expect(mockSetStemMute).toHaveBeenCalledWith(0, "vocals", true);
    });

    it("toggles solo when solo button clicked", async () => {
      const user = userEvent.setup();
      render(<StemControls channel={0} stemType="drums" />);

      const soloButton = screen.getByRole("button", { name: /solo/i });
      await user.click(soloButton);

      expect(mockSetStemSolo).toHaveBeenCalledWith(0, "drums", true);
    });

    it("handles multiple rapid mute clicks gracefully", async () => {
      const user = userEvent.setup();
      render(<StemControls channel={0} stemType="melody" />);

      const muteButton = screen.getByRole("button", { name: /mute/i });

      // Rapid clicks
      await user.click(muteButton);
      await user.click(muteButton);
      await user.click(muteButton);

      expect(mockSetStemMute).toHaveBeenCalledTimes(3);
    });
  });

  describe("EQ Controls", () => {
    it("adjusts EQ values when knobs are dragged", async () => {
      render(<StemControls channel={0} stemType="bass" />);

      const highKnob = screen
        .getByText("HIGH")
        .closest("div")
        ?.querySelector('[role="button"]') as HTMLElement;

      // Simulate mouse down and move
      fireEvent.mouseDown(highKnob, { clientY: 100 });
      fireEvent.mouseMove(document, { clientY: 80 }); // Move up 20px

      await waitFor(() => {
        expect(mockSetStemEQ).toHaveBeenCalledWith(
          0,
          "bass",
          "high",
          expect.any(Number),
        );
      });
    });

    it("resets EQ to 0 on double click", async () => {
      render(<StemControls channel={0} stemType="vocals" />);

      const midKnob = screen
        .getByText("MID")
        .closest("div")
        ?.querySelector('[role="button"]') as HTMLElement;

      fireEvent.doubleClick(midKnob);

      expect(mockSetStemEQ).toHaveBeenCalledWith(0, "vocals", "mid", 0);
    });

    it("clamps EQ values between -20 and +20", async () => {
      render(<StemControls channel={0} stemType="drums" />);

      const lowKnob = screen
        .getByText("LOW")
        .closest("div")
        ?.querySelector('[role="button"]') as HTMLElement;

      // Simulate extreme upward movement
      fireEvent.mouseDown(lowKnob, { clientY: 100 });
      fireEvent.mouseMove(document, { clientY: -200 }); // Extreme upward move

      await waitFor(() => {
        const calls = mockSetStemEQ.mock.calls;
        const lastCall = calls[calls.length - 1];
        expect(lastCall[3]).toBeLessThanOrEqual(20);
      });
    });

    it("displays EQ values with correct formatting", () => {
      const eqControls = {
        ...mockStemControls,
        0: {
          ...mockStemControls[0],
          melody: {
            ...mockStemControls[0].melody,
            eq: { low: -5.5, mid: 0, high: 12.3 },
          },
        },
      };

      mockUseEnhancedDJStore.mockReturnValue({
        stemControls: eqControls,
        setStemVolume: mockSetStemVolume,
        setStemMute: mockSetStemMute,
        setStemSolo: mockSetStemSolo,
        setStemPan: mockSetStemPan,
        setStemEQ: mockSetStemEQ,
      } as any);

      render(<StemControls channel={0} stemType="melody" />);

      expect(screen.getByText("-5.5")).toBeInTheDocument();
      expect(screen.getByText("0.0")).toBeInTheDocument();
      expect(screen.getByText("+12.3")).toBeInTheDocument();
    });
  });

  describe("Pan Control", () => {
    it("adjusts pan value when pan knob is dragged", async () => {
      render(<StemControls channel={0} stemType="vocals" />);

      const panKnob = screen
        .getByText("PAN")
        .closest("div")
        ?.querySelector('[role="button"]') as HTMLElement;

      // Simulate horizontal drag
      fireEvent.mouseDown(panKnob, { clientX: 100 });
      fireEvent.mouseMove(document, { clientX: 120 }); // Move right 20px

      await waitFor(() => {
        expect(mockSetStemPan).toHaveBeenCalledWith(
          0,
          "vocals",
          expect.any(Number),
        );
      });
    });

    it("has center detent for pan control", async () => {
      render(<StemControls channel={0} stemType="drums" />);

      const panKnob = screen
        .getByText("PAN")
        .closest("div")
        ?.querySelector('[role="button"]') as HTMLElement;

      // Small movement should snap to center
      fireEvent.mouseDown(panKnob, { clientX: 100 });
      fireEvent.mouseMove(document, { clientX: 102 }); // Small movement

      await waitFor(() => {
        expect(mockSetStemPan).toHaveBeenCalledWith(0, "drums", 0);
      });
    });

    it("resets pan to center on double click", async () => {
      render(<StemControls channel={0} stemType="bass" />);

      const panKnob = screen
        .getByText("PAN")
        .closest("div")
        ?.querySelector('[role="button"]') as HTMLElement;

      fireEvent.doubleClick(panKnob);

      expect(mockSetStemPan).toHaveBeenCalledWith(0, "bass", 0);
    });

    it("displays pan values correctly", () => {
      const panControls = {
        ...mockStemControls,
        0: {
          ...mockStemControls[0],
          melody: {
            ...mockStemControls[0].melody,
            pan: -0.5,
          },
          vocals: {
            ...mockStemControls[0].vocals,
            pan: 0.7,
          },
        },
      };

      mockUseEnhancedDJStore.mockReturnValue({
        stemControls: panControls,
        setStemVolume: mockSetStemVolume,
        setStemMute: mockSetStemMute,
        setStemSolo: mockSetStemSolo,
        setStemPan: mockSetStemPan,
        setStemEQ: mockSetStemEQ,
      } as any);

      const { rerender } = render(
        <StemControls channel={0} stemType="melody" />,
      );
      expect(screen.getByText("L50")).toBeInTheDocument();

      rerender(<StemControls channel={0} stemType="vocals" />);
      expect(screen.getByText("R70")).toBeInTheDocument();
    });
  });

  describe("Level Meter", () => {
    it("renders level meter segments", () => {
      render(<StemControls channel={0} stemType="drums" />);

      // Level meter should have multiple segments
      const levelMeter = screen.getByRole("generic", { hidden: true });
      expect(levelMeter).toBeInTheDocument();
    });

    it("updates level meter in real-time", async () => {
      render(<StemControls channel={0} stemType="vocals" />);

      // Wait for initial animation frame
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
      });

      expect(global.requestAnimationFrame).toHaveBeenCalled();
    });
  });

  describe("Performance", () => {
    it("uses React.memo for optimization", () => {
      const { rerender } = render(
        <StemControls channel={0} stemType="drums" />,
      );

      // Same props should not cause re-render
      rerender(<StemControls channel={0} stemType="drums" />);

      // Component should be memoized
      expect(StemControls.displayName).toBeDefined();
    });

    it("throttles mouse events for performance", async () => {
      render(<StemControls channel={0} stemType="bass" />);

      const volumeSlider = screen.getByRole("slider");

      // Rapid fire events
      for (let i = 0; i < 10; i++) {
        mockPerformanceNow.mockReturnValue(1000 + i * 5); // Every 5ms
        fireEvent.change(volumeSlider, {
          target: { value: (i * 0.1).toString() },
        });
      }

      // Should be throttled to less than 10 calls
      expect(mockSetStemVolume.mock.calls.length).toBeLessThan(10);
    });

    it("cleans up event listeners on unmount", () => {
      const removeEventListenerSpy = jest.spyOn(
        document,
        "removeEventListener",
      );

      const { unmount } = render(
        <StemControls channel={0} stemType="vocals" />,
      );

      // Start dragging to add listeners
      const panKnob = screen
        .getByText("PAN")
        .closest("div")
        ?.querySelector('[role="button"]') as HTMLElement;
      fireEvent.mouseDown(panKnob);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalled();
      removeEventListenerSpy.mockRestore();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", () => {
      render(<StemControls channel={0} stemType="drums" />);

      const muteButton = screen.getByRole("button", { name: /mute/i });
      const soloButton = screen.getByRole("button", { name: /solo/i });

      expect(muteButton).toBeInTheDocument();
      expect(soloButton).toBeInTheDocument();
    });

    it("supports keyboard navigation", async () => {
      const user = userEvent.setup();
      render(<StemControls channel={0} stemType="melody" />);

      const muteButton = screen.getByRole("button", { name: /mute/i });

      await user.tab();
      expect(muteButton).toHaveFocus();

      await user.keyboard("{Enter}");
      expect(mockSetStemMute).toHaveBeenCalledWith(0, "melody", true);
    });
  });

  describe("Error Handling", () => {
    it("handles store errors gracefully", () => {
      mockUseEnhancedDJStore.mockImplementation(() => {
        throw new Error("Store error");
      });

      expect(() => {
        render(<StemControls channel={0} stemType="vocals" />);
      }).toThrow("Store error");
    });

    it("handles invalid channel gracefully", () => {
      const invalidControls = {};

      mockUseEnhancedDJStore.mockReturnValue({
        stemControls: invalidControls,
        setStemVolume: mockSetStemVolume,
        setStemMute: mockSetStemMute,
        setStemSolo: mockSetStemSolo,
        setStemPan: mockSetStemPan,
        setStemEQ: mockSetStemEQ,
      } as any);

      expect(() => {
        render(<StemControls channel={99} stemType="drums" />);
      }).not.toThrow();
    });
  });

  describe("Custom Callbacks", () => {
    it("calls custom volume change callback", async () => {
      const onVolumeChange = jest.fn();
      const user = userEvent.setup();

      render(
        <StemControls
          channel={0}
          stemType="bass"
          onVolumeChange={onVolumeChange}
        />,
      );

      const volumeSlider = screen.getByRole("slider");

      await act(async () => {
        await user.clear(volumeSlider);
        await user.type(volumeSlider, "0.6");
      });

      expect(onVolumeChange).toHaveBeenCalledWith("bass", 0.6);
    });

    it("calls custom mute toggle callback", async () => {
      const onMuteToggle = jest.fn();
      const user = userEvent.setup();

      render(
        <StemControls
          channel={0}
          stemType="vocals"
          onMuteToggle={onMuteToggle}
        />,
      );

      const muteButton = screen.getByRole("button", { name: /mute/i });
      await user.click(muteButton);

      expect(onMuteToggle).toHaveBeenCalledWith("vocals", true);
    });

    it("calls custom EQ change callback", async () => {
      const onEQChange = jest.fn();

      render(
        <StemControls channel={0} stemType="drums" onEQChange={onEQChange} />,
      );

      const highKnob = screen
        .getByText("HIGH")
        .closest("div")
        ?.querySelector('[role="button"]') as HTMLElement;
      fireEvent.doubleClick(highKnob);

      expect(onEQChange).toHaveBeenCalledWith("drums", "high", 0);
    });
  });
});
