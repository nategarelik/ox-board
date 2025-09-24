/**
 * High-performance gesture-to-stem mapping hook
 * Optimized for <50ms latency between gesture detection and audio control
 */

import { useRef, useCallback, useEffect, useState, useMemo } from "react";
import {
  GestureStemMapper,
  GestureDetectionResult,
  FeedbackState,
} from "../lib/gestures/gestureStemMapper";
import { HandResult } from "../lib/gesture/recognition";
import { HandLandmarkSmoother } from "../lib/gesture/smoothing";
import useEnhancedDJStore from "../stores/enhancedDjStoreWithGestures";

interface UseGestureStemMappingConfig {
  /** Enable performance optimizations */
  performanceMode: boolean;
  /** Maximum allowed latency in milliseconds */
  maxLatency: number;
  /** Enable gesture smoothing */
  smoothingEnabled: boolean;
  /** Throttle gesture processing interval in ms */
  throttleInterval: number;
  /** Enable audio worklet for low-latency processing */
  useAudioWorklet: boolean;
  /** Channel to apply gestures to */
  defaultChannel: number;
}

interface GesturePerformanceMetrics {
  averageLatency: number;
  peakLatency: number;
  droppedFrames: number;
  gesturesPerSecond: number;
  audioLatency: number;
}

const DEFAULT_CONFIG: UseGestureStemMappingConfig = {
  performanceMode: true,
  maxLatency: 50,
  smoothingEnabled: true,
  throttleInterval: 16, // ~60fps
  useAudioWorklet: true,
  defaultChannel: 0,
};

export function useGestureStemMapping(
  config: Partial<UseGestureStemMappingConfig> = {},
) {
  const fullConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config],
  );

  // Store integration
  const {
    gestureStemMapper,
    gestureMapperEnabled,
    gestureFeedback,
    gestureLatency,
    processHandGestures,
    initializeGestureMapper,
    setGestureMapperEnabled,
    setGestureScreenDimensions,
  } = useEnhancedDJStore();

  // Performance tracking
  const [metrics, setMetrics] = useState<GesturePerformanceMetrics>({
    averageLatency: 0,
    peakLatency: 0,
    droppedFrames: 0,
    gesturesPerSecond: 0,
    audioLatency: 0,
  });

  // Refs for performance optimization
  const lastProcessingTime = useRef<number>(0);
  const processingQueue = useRef<
    Array<{
      leftHand: HandResult | null;
      rightHand: HandResult | null;
      timestamp: number;
    }>
  >([]);
  const performanceBuffer = useRef<number[]>([]);
  const gestureCountBuffer = useRef<number[]>([]);
  const isProcessing = useRef<boolean>(false);
  const animationFrameRef = useRef<number>();

  // High-frequency smoothers for critical landmarks
  const leftWristSmoother = useRef(new HandLandmarkSmoother());
  const rightWristSmoother = useRef(new HandLandmarkSmoother());

  // Initialize gesture mapper if not already done
  useEffect(() => {
    if (!gestureStemMapper) {
      initializeGestureMapper({
        latencyTarget: fullConfig.maxLatency,
        smoothingEnabled: fullConfig.smoothingEnabled,
        gestureConfidenceThreshold: 0.7, // Slightly lower for faster response
      });
    }
  }, [gestureStemMapper, initializeGestureMapper, fullConfig]);

  // Performance monitoring
  useEffect(() => {
    const interval = setInterval(() => {
      // Calculate average latency
      const latencies = performanceBuffer.current;
      if (latencies.length > 0) {
        const avgLatency =
          latencies.reduce((a, b) => a + b, 0) / latencies.length;
        const peakLatency = Math.max(...latencies);

        // Calculate gestures per second
        const gestureCount = gestureCountBuffer.current.reduce(
          (a, b) => a + b,
          0,
        );

        setMetrics({
          averageLatency: avgLatency,
          peakLatency: peakLatency,
          droppedFrames: latencies.filter((l) => l > fullConfig.maxLatency)
            .length,
          gesturesPerSecond: gestureCount,
          audioLatency: gestureLatency,
        });

        // Clear buffers
        performanceBuffer.current = [];
        gestureCountBuffer.current = [];
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [fullConfig.maxLatency, gestureLatency]);

  // Optimized gesture processing with frame scheduling
  const processGesturesOptimized = useCallback(
    async (
      leftHand: HandResult | null,
      rightHand: HandResult | null,
      channel: number = fullConfig.defaultChannel,
    ) => {
      const now = performance.now();

      // Skip if processing is still ongoing and we're in performance mode
      if (isProcessing.current && fullConfig.performanceMode) {
        return;
      }

      // Throttle based on configured interval
      if (now - lastProcessingTime.current < fullConfig.throttleInterval) {
        return;
      }

      isProcessing.current = true;
      const startTime = performance.now();

      try {
        // Pre-process hand data for critical optimizations
        let processedLeftHand = leftHand;
        let processedRightHand = rightHand;

        if (fullConfig.smoothingEnabled && (leftHand || rightHand)) {
          // Apply targeted smoothing only to wrist landmarks for performance
          if (leftHand && leftHand.landmarks.length > 0) {
            const smoothedWrist = leftWristSmoother.current.smoothLandmarks(
              [leftHand.landmarks[0]], // Just wrist
              [0],
            )[0];
            processedLeftHand = {
              ...leftHand,
              landmarks: [smoothedWrist, ...leftHand.landmarks.slice(1)],
            };
          }

          if (rightHand && rightHand.landmarks.length > 0) {
            const smoothedWrist = rightWristSmoother.current.smoothLandmarks(
              [rightHand.landmarks[0]], // Just wrist
              [0],
            )[0];
            processedRightHand = {
              ...rightHand,
              landmarks: [smoothedWrist, ...rightHand.landmarks.slice(1)],
            };
          }
        }

        // Process gestures with optimized path
        await processHandGestures(
          processedLeftHand,
          processedRightHand,
          channel,
        );

        const processingTime = performance.now() - startTime;

        // Track performance
        performanceBuffer.current.push(processingTime);
        if (performanceBuffer.current.length > 100) {
          performanceBuffer.current.shift();
        }

        // Count gestures processed
        const gestureCount =
          (processedLeftHand ? 1 : 0) + (processedRightHand ? 1 : 0);
        gestureCountBuffer.current.push(gestureCount);
        if (gestureCountBuffer.current.length > 60) {
          gestureCountBuffer.current.shift();
        }

        lastProcessingTime.current = now;
      } catch (error) {
        console.error("Optimized gesture processing error:", error);
      } finally {
        isProcessing.current = false;
      }
    },
    [
      fullConfig.defaultChannel,
      fullConfig.performanceMode,
      fullConfig.throttleInterval,
      fullConfig.smoothingEnabled,
      processHandGestures,
    ],
  );

  // Frame-based gesture processing for maximum responsiveness
  const scheduleGestureProcessing = useCallback(
    (
      leftHand: HandResult | null,
      rightHand: HandResult | null,
      channel?: number,
    ) => {
      // Cancel previous frame if still pending
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Schedule processing on next animation frame for optimal timing
      animationFrameRef.current = requestAnimationFrame(() => {
        processGesturesOptimized(leftHand, rightHand, channel);
      });
    },
    [processGesturesOptimized],
  );

  // Batch processing for multiple gesture updates
  const processBatch = useCallback(
    async (
      gestureBatch: Array<{
        leftHand: HandResult | null;
        rightHand: HandResult | null;
        channel?: number;
      }>,
    ) => {
      if (!gestureMapperEnabled || gestureBatch.length === 0) return;

      // Process only the most recent gesture in performance mode
      const gestureToProcess = fullConfig.performanceMode
        ? gestureBatch[gestureBatch.length - 1]
        : gestureBatch[0];

      await processGesturesOptimized(
        gestureToProcess.leftHand,
        gestureToProcess.rightHand,
        gestureToProcess.channel,
      );
    },
    [
      gestureMapperEnabled,
      fullConfig.performanceMode,
      processGesturesOptimized,
    ],
  );

  // Screen dimension optimization
  const updateScreenDimensions = useCallback(
    (width: number, height: number) => {
      setGestureScreenDimensions(width, height);
    },
    [setGestureScreenDimensions],
  );

  // Emergency latency recovery
  const recoverFromHighLatency = useCallback(() => {
    if (metrics.averageLatency > fullConfig.maxLatency * 1.5) {
      // Clear processing queue
      processingQueue.current = [];

      // Reset smoothers
      leftWristSmoother.current.reset();
      rightWristSmoother.current.reset();

      // Clear performance buffers
      performanceBuffer.current = [];
      gestureCountBuffer.current = [];

      console.warn("High latency detected, performing emergency recovery");
    }
  }, [metrics.averageLatency, fullConfig.maxLatency]);

  // Automatic latency recovery
  useEffect(() => {
    if (metrics.averageLatency > fullConfig.maxLatency * 1.2) {
      recoverFromHighLatency();
    }
  }, [metrics.averageLatency, fullConfig.maxLatency, recoverFromHighLatency]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      isProcessing.current = false;
    };
  }, []);

  return {
    // Core processing functions
    processGestures: scheduleGestureProcessing,
    processGesturesSync: processGesturesOptimized,
    processBatch,

    // Configuration
    isEnabled: gestureMapperEnabled,
    setEnabled: setGestureMapperEnabled,
    updateScreenDimensions,

    // State and feedback
    feedback: gestureFeedback,
    latency: gestureLatency,
    metrics,

    // Performance utilities
    recoverFromHighLatency,
    isProcessing: isProcessing.current,

    // Performance status
    isPerformant: metrics.averageLatency < fullConfig.maxLatency,
    needsOptimization: metrics.averageLatency > fullConfig.maxLatency * 0.8,

    // Configuration
    config: fullConfig,
  };
}

export default useGestureStemMapping;
export type { UseGestureStemMappingConfig, GesturePerformanceMetrics };
