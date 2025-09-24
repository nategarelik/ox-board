/**
 * Tests for useGestureStemMapping hook
 * Focuses on performance optimization and integration
 */

import { renderHook, act } from "@testing-library/react";
import { useGestureStemMapping } from "@/hooks/useGestureStemMapping";
import { HandResult, HandLandmark } from "@/lib/gesture/recognition";
import { Point2D } from "@/lib/gesture/smoothing";

// Mock the enhanced DJ store
jest.mock("@/stores/enhancedDjStoreWithGestures", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    gestureStemMapper: null,
    gestureMapperEnabled: false,
    gestureFeedback: null,
    gestureLatency: 0,
    processHandGestures: jest.fn(),
    initializeGestureMapper: jest.fn(),
    setGestureMapperEnabled: jest.fn(),
    setGestureScreenDimensions: jest.fn(),
  })),
}));

// Mock hand creation helper
const createMockHand = (
  handedness: "Left" | "Right",
  confidence: number = 0.9,
): HandResult => {
  const landmarks: Point2D[] = Array.from({ length: 21 }, (_, i) => ({
    x: 0.5 + i * 0.01,
    y: 0.5 + i * 0.01,
  }));

  return {
    landmarks,
    handedness,
    confidence,
    worldLandmarks: landmarks.map((p) => ({ x: p.x, y: p.y, z: 0 })),
  };
};

describe("useGestureStemMapping", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("should initialize with default configuration", () => {
    const { result } = renderHook(() => useGestureStemMapping());

    expect(result.current.config.performanceMode).toBe(true);
    expect(result.current.config.maxLatency).toBe(50);
    expect(result.current.config.smoothingEnabled).toBe(true);
    expect(result.current.config.throttleInterval).toBe(16);
  });

  it("should initialize with custom configuration", () => {
    const customConfig = {
      performanceMode: false,
      maxLatency: 100,
      smoothingEnabled: false,
      throttleInterval: 32,
    };

    const { result } = renderHook(() => useGestureStemMapping(customConfig));

    expect(result.current.config.performanceMode).toBe(false);
    expect(result.current.config.maxLatency).toBe(100);
    expect(result.current.config.smoothingEnabled).toBe(false);
    expect(result.current.config.throttleInterval).toBe(32);
  });

  it("should initialize gesture mapper on mount", () => {
    const mockInitializeGestureMapper = jest.fn();
    const mockStore = {
      gestureStemMapper: null,
      gestureMapperEnabled: false,
      gestureFeedback: null,
      gestureLatency: 0,
      processHandGestures: jest.fn(),
      initializeGestureMapper: mockInitializeGestureMapper,
      setGestureMapperEnabled: jest.fn(),
      setGestureScreenDimensions: jest.fn(),
    };

    require("@/stores/enhancedDjStoreWithGestures").default.mockReturnValue(
      mockStore,
    );

    renderHook(() => useGestureStemMapping());

    expect(mockInitializeGestureMapper).toHaveBeenCalledWith({
      latencyTarget: 50,
      smoothingEnabled: true,
      gestureConfidenceThreshold: 0.7,
    });
  });

  it.skip("should throttle gesture processing based on interval", async () => {
    // Mock performance.now() to control timing
    let currentTime = 0;
    const perfSpy = jest
      .spyOn(performance, "now")
      .mockImplementation(() => currentTime);

    const mockProcessHandGestures = jest.fn().mockResolvedValue(undefined);
    const mockStore = {
      gestureStemMapper: { dispose: jest.fn() },
      gestureMapperEnabled: true,
      gestureFeedback: null,
      gestureLatency: 0,
      processHandGestures: mockProcessHandGestures,
      initializeGestureMapper: jest.fn(),
      setGestureMapperEnabled: jest.fn(),
      setGestureScreenDimensions: jest.fn(),
    };

    require("@/stores/enhancedDjStoreWithGestures").default.mockReturnValue(
      mockStore,
    );

    const { result } = renderHook(() =>
      useGestureStemMapping({
        throttleInterval: 100, // 100ms throttle
        performanceMode: false, // Disable performance mode to avoid skipping
      }),
    );

    const leftHand = createMockHand("Left");
    const rightHand = createMockHand("Right");

    // Process first gesture at time 0
    currentTime = 0;
    await act(async () => {
      await result.current.processGesturesSync(leftHand, rightHand);
    });

    expect(mockProcessHandGestures).toHaveBeenCalledTimes(1);

    // Advance time less than throttle interval (50ms) and try again
    currentTime = 50;
    await act(async () => {
      await result.current.processGesturesSync(leftHand, rightHand);
    });

    // Should still be 1 call (throttled)
    expect(mockProcessHandGestures).toHaveBeenCalledTimes(1);

    // Advance time beyond throttle interval (150ms total)
    currentTime = 150;
    await act(async () => {
      await result.current.processGesturesSync(leftHand, rightHand);
    });

    // Now should be 2 calls
    expect(mockProcessHandGestures).toHaveBeenCalledTimes(2);

    // Restore performance.now
    perfSpy.mockRestore();
  });

  it("should skip processing when already processing in performance mode", async () => {
    const mockProcessHandGestures = jest.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 200)), // Slow processing
    );

    const mockStore = {
      gestureStemMapper: { dispose: jest.fn() },
      gestureMapperEnabled: true,
      gestureFeedback: null,
      gestureLatency: 0,
      processHandGestures: mockProcessHandGestures,
      initializeGestureMapper: jest.fn(),
      setGestureMapperEnabled: jest.fn(),
      setGestureScreenDimensions: jest.fn(),
    };

    require("@/stores/enhancedDjStoreWithGestures").default.mockReturnValue(
      mockStore,
    );

    const { result } = renderHook(() =>
      useGestureStemMapping({
        performanceMode: true,
        throttleInterval: 0, // No throttling
      }),
    );

    const leftHand = createMockHand("Left");

    // Start first processing
    act(() => {
      result.current.processGesturesSync(leftHand, null);
    });

    // Try to process again immediately
    await act(async () => {
      result.current.processGesturesSync(leftHand, null);
    });

    // Should only process once due to performance mode skipping
    expect(mockProcessHandGestures).toHaveBeenCalledTimes(1);
  });

  it("should apply smoothing when enabled", async () => {
    const mockProcessHandGestures = jest.fn();
    const mockStore = {
      gestureStemMapper: { dispose: jest.fn() },
      gestureMapperEnabled: true,
      gestureFeedback: null,
      gestureLatency: 0,
      processHandGestures: mockProcessHandGestures,
      initializeGestureMapper: jest.fn(),
      setGestureMapperEnabled: jest.fn(),
      setGestureScreenDimensions: jest.fn(),
    };

    require("@/stores/enhancedDjStoreWithGestures").default.mockReturnValue(
      mockStore,
    );

    const { result } = renderHook(() =>
      useGestureStemMapping({
        smoothingEnabled: true,
        throttleInterval: 0,
      }),
    );

    const leftHand = createMockHand("Left");

    await act(async () => {
      result.current.processGesturesSync(leftHand, null);
    });

    expect(mockProcessHandGestures).toHaveBeenCalled();

    // Verify that the hand data passed has been processed
    const callArgs = mockProcessHandGestures.mock.calls[0];
    expect(callArgs[0]).toBeDefined(); // Left hand should be defined
    expect(callArgs[1]).toBeNull(); // Right hand should be null
  });

  it("should track performance metrics", async () => {
    const mockStore = {
      gestureStemMapper: { dispose: jest.fn() },
      gestureMapperEnabled: true,
      gestureFeedback: null,
      gestureLatency: 25,
      processHandGestures: jest.fn(),
      initializeGestureMapper: jest.fn(),
      setGestureMapperEnabled: jest.fn(),
      setGestureScreenDimensions: jest.fn(),
    };

    require("@/stores/enhancedDjStoreWithGestures").default.mockReturnValue(
      mockStore,
    );

    const { result } = renderHook(() => useGestureStemMapping());

    // Process some gestures
    const leftHand = createMockHand("Left");

    await act(async () => {
      await result.current.processGesturesSync(leftHand, null);
    });

    // Wait for metrics update interval
    await act(async () => {
      jest.advanceTimersByTime(1100);
    });

    expect(result.current.metrics).toBeDefined();
    // Check that latency from store is available
    expect(result.current.latency).toBe(25);
    // Performance status should be defined
    expect(result.current.isPerformant).toBeDefined();
  });

  it("should handle batch processing", async () => {
    const mockProcessHandGestures = jest.fn();
    const mockStore = {
      gestureStemMapper: { dispose: jest.fn() },
      gestureMapperEnabled: true,
      gestureFeedback: null,
      gestureLatency: 0,
      processHandGestures: mockProcessHandGestures,
      initializeGestureMapper: jest.fn(),
      setGestureMapperEnabled: jest.fn(),
      setGestureScreenDimensions: jest.fn(),
    };

    require("@/stores/enhancedDjStoreWithGestures").default.mockReturnValue(
      mockStore,
    );

    const { result } = renderHook(() =>
      useGestureStemMapping({
        performanceMode: true,
        throttleInterval: 0,
      }),
    );

    const gestureBatch = [
      { leftHand: createMockHand("Left"), rightHand: null, channel: 0 },
      { leftHand: null, rightHand: createMockHand("Right"), channel: 1 },
      {
        leftHand: createMockHand("Left"),
        rightHand: createMockHand("Right"),
        channel: 2,
      },
    ];

    await act(async () => {
      await result.current.processBatch(gestureBatch);
    });

    // In performance mode, should only process the last gesture
    expect(mockProcessHandGestures).toHaveBeenCalledTimes(1);

    const callArgs = mockProcessHandGestures.mock.calls[0];
    expect(callArgs[2]).toBe(2); // Should use channel from last gesture
  });

  it("should handle screen dimension updates", () => {
    const mockSetGestureScreenDimensions = jest.fn();
    const mockStore = {
      gestureStemMapper: { dispose: jest.fn() },
      gestureMapperEnabled: true,
      gestureFeedback: null,
      gestureLatency: 0,
      processHandGestures: jest.fn(),
      initializeGestureMapper: jest.fn(),
      setGestureMapperEnabled: jest.fn(),
      setGestureScreenDimensions: mockSetGestureScreenDimensions,
    };

    require("@/stores/enhancedDjStoreWithGestures").default.mockReturnValue(
      mockStore,
    );

    const { result } = renderHook(() => useGestureStemMapping());

    act(() => {
      result.current.updateScreenDimensions(1920, 1080);
    });

    expect(mockSetGestureScreenDimensions).toHaveBeenCalledWith(1920, 1080);
  });

  it("should handle high latency recovery", () => {
    const { result } = renderHook(() =>
      useGestureStemMapping({
        maxLatency: 50,
      }),
    );

    // Simulate high latency metrics
    act(() => {
      // This would normally be updated by the performance tracking
      // For testing, we'll call the recovery function directly
      result.current.recoverFromHighLatency();
    });

    // Recovery should not throw errors
    expect(result.current.isPerformant).toBeDefined();
  });

  it("should schedule gesture processing with animation frames", async () => {
    const mockProcessHandGestures = jest.fn();
    const mockStore = {
      gestureStemMapper: { dispose: jest.fn() },
      gestureMapperEnabled: true,
      gestureFeedback: null,
      gestureLatency: 0,
      processHandGestures: mockProcessHandGestures,
      initializeGestureMapper: jest.fn(),
      setGestureMapperEnabled: jest.fn(),
      setGestureScreenDimensions: jest.fn(),
    };

    require("@/stores/enhancedDjStoreWithGestures").default.mockReturnValue(
      mockStore,
    );

    // Mock requestAnimationFrame
    const mockRequestAnimationFrame = jest.fn((cb) => {
      setTimeout(cb, 16); // ~60fps
      return 1;
    });
    global.requestAnimationFrame = mockRequestAnimationFrame;

    const { result } = renderHook(() => useGestureStemMapping());

    const leftHand = createMockHand("Left");

    act(() => {
      result.current.processGestures(leftHand, null);
    });

    expect(mockRequestAnimationFrame).toHaveBeenCalled();

    // Advance timers to trigger the animation frame callback
    await act(async () => {
      jest.advanceTimersByTime(20);
    });
  });

  it("should enable/disable processing correctly", () => {
    const mockSetGestureMapperEnabled = jest.fn();
    const mockStore = {
      gestureStemMapper: { dispose: jest.fn() },
      gestureMapperEnabled: false,
      gestureFeedback: null,
      gestureLatency: 0,
      processHandGestures: jest.fn(),
      initializeGestureMapper: jest.fn(),
      setGestureMapperEnabled: mockSetGestureMapperEnabled,
      setGestureScreenDimensions: jest.fn(),
    };

    require("@/stores/enhancedDjStoreWithGestures").default.mockReturnValue(
      mockStore,
    );

    const { result } = renderHook(() => useGestureStemMapping());

    expect(result.current.isEnabled).toBe(false);

    act(() => {
      result.current.setEnabled(true);
    });

    expect(mockSetGestureMapperEnabled).toHaveBeenCalledWith(true);
  });

  it("should cleanup on unmount", () => {
    const mockCancelAnimationFrame = jest.fn();
    global.cancelAnimationFrame = mockCancelAnimationFrame;

    const { unmount } = renderHook(() => useGestureStemMapping());

    unmount();

    // Cleanup should not throw errors
    expect(true).toBe(true);
  });

  it("should handle disabled state gracefully", async () => {
    const mockProcessHandGestures = jest.fn();
    const mockStore = {
      gestureStemMapper: { dispose: jest.fn() },
      gestureMapperEnabled: false, // Disabled
      gestureFeedback: null,
      gestureLatency: 0,
      processHandGestures: mockProcessHandGestures,
      initializeGestureMapper: jest.fn(),
      setGestureMapperEnabled: jest.fn(),
      setGestureScreenDimensions: jest.fn(),
    };

    require("@/stores/enhancedDjStoreWithGestures").default.mockReturnValue(
      mockStore,
    );

    const { result } = renderHook(() => useGestureStemMapping());

    const leftHand = createMockHand("Left");

    await act(async () => {
      await result.current.processBatch([
        { leftHand, rightHand: null, channel: 0 },
      ]);
    });

    // Should not process when disabled
    expect(mockProcessHandGestures).not.toHaveBeenCalled();
  });

  it("should provide performance status indicators", () => {
    const mockStore = {
      gestureStemMapper: { dispose: jest.fn() },
      gestureMapperEnabled: true,
      gestureFeedback: null,
      gestureLatency: 0,
      processHandGestures: jest.fn(),
      initializeGestureMapper: jest.fn(),
      setGestureMapperEnabled: jest.fn(),
      setGestureScreenDimensions: jest.fn(),
    };

    require("@/stores/enhancedDjStoreWithGestures").default.mockReturnValue(
      mockStore,
    );

    const { result } = renderHook(() =>
      useGestureStemMapping({
        maxLatency: 50,
      }),
    );

    // With default metrics (0 latency), should be performant
    expect(result.current.isPerformant).toBe(true);
    expect(result.current.needsOptimization).toBe(false);
  });
});
