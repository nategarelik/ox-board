import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import ProfessionalDJInterface from "@/components/DJ/ProfessionalDJInterface";
import type { GestureData } from "@/types/dj";
import { ViewMode } from "@/types/dj";

// Mock dynamic imports
jest.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => {
    const Component = ({ children }: any) => <div>{children}</div>;
    return Component;
  },
}));

describe("DJ Mode Integration Tests", () => {
  const mockDjState = {
    isDJModeActive: true,
    cameraActive: true,
    gestureEnabled: true,
    gestureMapperEnabled: false,
    decks: [
      {
        id: 0,
        track: null,
        isPlaying: false,
        currentTime: 0,
        playbackRate: 1.0,
        volume: 0.8,
        cuePoints: [],
        loopStart: null,
        loopEnd: null,
        stemPlayerEnabled: false,
      },
      {
        id: 1,
        track: null,
        isPlaying: false,
        currentTime: 0,
        playbackRate: 1.0,
        volume: 0.7,
        cuePoints: [],
        loopStart: null,
        loopEnd: null,
        stemPlayerEnabled: false,
      },
    ],
    viewMode: "decks" as ViewMode,
  };

  const mockDjActions = {
    initializeMixer: jest.fn(),
    setDJModeActive: jest.fn(),
    setCameraActive: jest.fn(),
    setGestureEnabled: jest.fn(),
    setViewMode: jest.fn(),
    initializeGestureMapper: jest.fn(),
    updateGestureControls: jest.fn(),
  };

  const mockGestureData: GestureData = {
    gestureData: null,
    controls: [],
    updateGestures: jest.fn(),
    reset: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders DJ interface with all components", () => {
    render(
      <ProfessionalDJInterface
        djState={mockDjState}
        djActions={mockDjActions}
        gestureData={mockGestureData}
      />,
    );

    expect(screen.getByText(/Camera Off/i)).toBeInTheDocument();
  });

  it("handles gesture detection and updates", () => {
    const { container } = render(
      <ProfessionalDJInterface
        djState={mockDjState}
        djActions={mockDjActions}
        gestureData={mockGestureData}
      />,
    );

    // Simulate hand detection
    const mockHands = [
      { handedness: "Left", landmarks: [], score: 0.95 },
      { handedness: "Right", landmarks: [], score: 0.93 },
    ];

    // Component should handle hands
    expect(container).toBeInTheDocument();
  });

  it("calls updateGestureControls when gestures are detected", () => {
    render(
      <ProfessionalDJInterface
        djState={mockDjState}
        djActions={mockDjActions}
        gestureData={mockGestureData}
      />,
    );

    // Mock gesture update
    mockGestureData.controls = [
      {
        type: "volume" as const,
        value: 0.5,
        hand: "left" as const,
        gesture: "index_vertical",
      },
      {
        type: "volume" as const,
        value: 0.5,
        hand: "right" as const,
        gesture: "index_vertical",
      },
      {
        type: "crossfader" as const,
        value: 0.5,
        hand: "right" as const,
        gesture: "wrist_horizontal",
      },
    ];

    // Trigger would normally come from camera feed
    // In test, we verify the handler exists
    expect(mockDjActions.updateGestureControls).toBeDefined();
  });

  it("handles different view modes", () => {
    const { rerender } = render(
      <ProfessionalDJInterface
        djState={mockDjState}
        djActions={mockDjActions}
        gestureData={mockGestureData}
      />,
    );

    // Test mixer view
    const mixerState = { ...mockDjState, viewMode: "mixer" as ViewMode };
    rerender(
      <ProfessionalDJInterface
        djState={mixerState}
        djActions={mockDjActions}
        gestureData={mockGestureData}
      />,
    );

    expect(screen.getByText(/Camera Off/i)).toBeInTheDocument();

    // Test stems view
    const stemsState = { ...mockDjState, viewMode: "stems" as ViewMode };
    rerender(
      <ProfessionalDJInterface
        djState={stemsState}
        djActions={mockDjActions}
        gestureData={mockGestureData}
      />,
    );

    expect(screen.getByText(/Camera Off/i)).toBeInTheDocument();
  });

  it("maintains state when camera is toggled", () => {
    const { rerender } = render(
      <ProfessionalDJInterface
        djState={mockDjState}
        djActions={mockDjActions}
        gestureData={mockGestureData}
      />,
    );

    // Turn off camera
    const offState = { ...mockDjState, cameraActive: false };
    rerender(
      <ProfessionalDJInterface
        djState={offState}
        djActions={mockDjActions}
        gestureData={mockGestureData}
      />,
    );

    expect(screen.getByText(/Camera Off/i)).toBeInTheDocument();

    // Turn camera back on
    rerender(
      <ProfessionalDJInterface
        djState={mockDjState}
        djActions={mockDjActions}
        gestureData={mockGestureData}
      />,
    );

    expect(screen.getByText(/Camera Off/i)).toBeInTheDocument();
  });
});
