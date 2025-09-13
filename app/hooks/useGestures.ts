/**
 * React hook for gesture detection and processing
 * Integrates with MediaPipe hand tracking to provide smooth gesture recognition
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  HandLandmarkSmoother,
  GESTURE_SMOOTHING_CONFIG,
  ExponentialMovingAverage
} from '../lib/gesture/smoothing';
import {
  HandResult,
  GestureResult,
  CrossfaderGesture,
  CoordinateNormalizer,
  CrossfaderGestureRecognizer,
  GestureConfidenceCalculator
} from '../lib/gesture/recognition';

/**
 * Gesture detection configuration
 */
export interface GestureConfig {
  /** Minimum confidence threshold for gesture detection */
  confidenceThreshold: number;
  /** Enable smoothing for gesture output values */
  enableSmoothing: boolean;
  /** Smoothing alpha for crossfader values (0-1) */
  smoothingAlpha: number;
  /** Maximum time between gesture updates (ms) */
  maxGestureAge: number;
  /** History size for temporal stability calculation */
  historySize: number;
  /** Crossfader gesture distance thresholds */
  crossfader: {
    minDistance: number;
    maxDistance: number;
  };
}

/**
 * Default gesture configuration optimized for DJ controls
 */
export const DEFAULT_GESTURE_CONFIG: GestureConfig = {
  confidenceThreshold: 0.7,
  enableSmoothing: true,
  smoothingAlpha: 0.15,
  maxGestureAge: 100, // 100ms
  historySize: 10,
  crossfader: {
    minDistance: 0.1,
    maxDistance: 0.7
  }
};

/**
 * Gesture detection state
 */
export interface GestureState {
  /** Currently detected gestures */
  gestures: GestureResult[];
  /** Current crossfader gesture (if detected) */
  crossfaderGesture: CrossfaderGesture | null;
  /** Smoothed crossfader position (0-1) */
  crossfaderPosition: number;
  /** Raw hand detection results */
  hands: HandResult[];
  /** Is gesture detection active */
  isActive: boolean;
  /** Detection performance metrics */
  performance: {
    fps: number;
    averageConfidence: number;
    processingTime: number;
  };
  /** Error state */
  error: string | null;
}

/**
 * Internal processing state
 */
interface ProcessingState {
  smoother: HandLandmarkSmoother;
  crossfaderRecognizer: CrossfaderGestureRecognizer;
  crossfaderSmoother: ExponentialMovingAverage;
  gestureHistory: GestureResult[];
  performanceMetrics: {
    frameCount: number;
    totalProcessingTime: number;
    lastFpsCalculation: number;
    confidenceSum: number;
    confidenceCount: number;
  };
}

/**
 * Hook for gesture detection and processing
 */
export function useGestures(
  config: Partial<GestureConfig> = {},
  screenDimensions: { width: number; height: number } = { width: 1280, height: 720 }
) {
  const fullConfig = { ...DEFAULT_GESTURE_CONFIG, ...config };

  // State
  const [gestureState, setGestureState] = useState<GestureState>({
    gestures: [],
    crossfaderGesture: null,
    crossfaderPosition: 0.5, // Center position
    hands: [],
    isActive: false,
    performance: {
      fps: 0,
      averageConfidence: 0,
      processingTime: 0
    },
    error: null
  });

  // Processing components - use refs to maintain instances across renders
  const processingRef = useRef<ProcessingState | null>(null);

  // Initialize processing components
  useEffect(() => {
    processingRef.current = {
      smoother: new HandLandmarkSmoother(GESTURE_SMOOTHING_CONFIG),
      crossfaderRecognizer: new CrossfaderGestureRecognizer(
        fullConfig.crossfader.minDistance,
        fullConfig.crossfader.maxDistance
      ),
      crossfaderSmoother: new ExponentialMovingAverage(fullConfig.smoothingAlpha),
      gestureHistory: [],
      performanceMetrics: {
        frameCount: 0,
        totalProcessingTime: 0,
        lastFpsCalculation: Date.now(),
        confidenceSum: 0,
        confidenceCount: 0
      }
    };
  }, [fullConfig.crossfader.minDistance, fullConfig.crossfader.maxDistance, fullConfig.smoothingAlpha]);

  /**
   * Process hand detection results and extract gestures
   */
  const processHands = useCallback((
    handResults: HandResult[],
    timestamp: number = Date.now()
  ): void => {
    if (!processingRef.current) return;

    const startTime = performance.now();
    const { smoother, crossfaderRecognizer, crossfaderSmoother, gestureHistory, performanceMetrics } = processingRef.current;

    try {
      // Update active state
      const isActive = handResults.length > 0;

      // Process hand landmarks with smoothing
      const processedHands = handResults.map(hand => ({
        ...hand,
        landmarks: fullConfig.enableSmoothing
          ? smoother.smoothLandmarks(
              hand.landmarks,
              hand.landmarks.map((_, index) => index)
            )
          : hand.landmarks
      }));

      // Detect crossfader gesture
      let crossfaderGesture: CrossfaderGesture | null = null;
      let smoothedCrossfaderPosition = gestureState.crossfaderPosition;

      if (processedHands.length >= 2) {
        // Find left and right hands
        const leftHand = processedHands.find(h => h.handedness === 'Left');
        const rightHand = processedHands.find(h => h.handedness === 'Right');

        if (leftHand && rightHand) {
          const detectedGesture = crossfaderRecognizer.recognizeGesture(
            leftHand,
            rightHand,
            screenDimensions.width,
            screenDimensions.height
          );

          if (detectedGesture && detectedGesture.confidence >= fullConfig.confidenceThreshold) {
            crossfaderGesture = detectedGesture;

            // Apply smoothing to crossfader position
            if (fullConfig.enableSmoothing) {
              smoothedCrossfaderPosition = crossfaderSmoother.update(detectedGesture.data.position);
            } else {
              smoothedCrossfaderPosition = detectedGesture.data.position;
            }
          }
        }
      }

      // Update gesture history
      const allGestures: GestureResult[] = crossfaderGesture ? [crossfaderGesture] : [];

      // Add to history and maintain size limit
      gestureHistory.push(...allGestures);
      if (gestureHistory.length > fullConfig.historySize) {
        gestureHistory.splice(0, gestureHistory.length - fullConfig.historySize);
      }

      // Remove old gestures
      const maxAge = fullConfig.maxGestureAge;
      const cutoffTime = timestamp - maxAge;
      const recentGestures = gestureHistory.filter(g => g.timestamp > cutoffTime);

      // Update performance metrics
      const processingTime = performance.now() - startTime;
      performanceMetrics.frameCount++;
      performanceMetrics.totalProcessingTime += processingTime;

      if (allGestures.length > 0) {
        const avgConfidence = allGestures.reduce((sum, g) => sum + g.confidence, 0) / allGestures.length;
        performanceMetrics.confidenceSum += avgConfidence;
        performanceMetrics.confidenceCount++;
      }

      // Calculate FPS every second
      const now = Date.now();
      let fps = gestureState.performance.fps;
      if (now - performanceMetrics.lastFpsCalculation > 1000) {
        fps = performanceMetrics.frameCount;
        performanceMetrics.frameCount = 0;
        performanceMetrics.lastFpsCalculation = now;
      }

      // Update state
      setGestureState(prevState => ({
        ...prevState,
        gestures: recentGestures,
        crossfaderGesture,
        crossfaderPosition: smoothedCrossfaderPosition,
        hands: processedHands,
        isActive,
        performance: {
          fps,
          averageConfidence: performanceMetrics.confidenceCount > 0
            ? performanceMetrics.confidenceSum / performanceMetrics.confidenceCount
            : 0,
          processingTime
        },
        error: null
      }));

    } catch (error) {
      console.error('Gesture processing error:', error);
      setGestureState(prevState => ({
        ...prevState,
        error: error instanceof Error ? error.message : 'Unknown gesture processing error'
      }));
    }
  }, [fullConfig, screenDimensions, gestureState.crossfaderPosition]);

  /**
   * Reset gesture processing state
   */
  const resetGestures = useCallback(() => {
    if (processingRef.current) {
      processingRef.current.smoother.reset();
      processingRef.current.crossfaderSmoother.reset();
      processingRef.current.gestureHistory = [];
      processingRef.current.performanceMetrics = {
        frameCount: 0,
        totalProcessingTime: 0,
        lastFpsCalculation: Date.now(),
        confidenceSum: 0,
        confidenceCount: 0
      };
    }

    setGestureState({
      gestures: [],
      crossfaderGesture: null,
      crossfaderPosition: 0.5,
      hands: [],
      isActive: false,
      performance: {
        fps: 0,
        averageConfidence: 0,
        processingTime: 0
      },
      error: null
    });
  }, []);

  /**
   * Update gesture configuration
   */
  const updateConfig = useCallback((newConfig: Partial<GestureConfig>) => {
    if (processingRef.current && newConfig.crossfader) {
      processingRef.current.crossfaderRecognizer.updateThresholds(
        newConfig.crossfader.minDistance ?? fullConfig.crossfader.minDistance,
        newConfig.crossfader.maxDistance ?? fullConfig.crossfader.maxDistance
      );
    }
  }, [fullConfig.crossfader]);

  /**
   * Get gesture temporal stability score
   */
  const getTemporalStability = useCallback((): number => {
    if (!processingRef.current) return 0;
    return GestureConfidenceCalculator.temporalStability(
      processingRef.current.gestureHistory,
      fullConfig.maxGestureAge
    );
  }, [fullConfig.maxGestureAge]);

  /**
   * Get current gesture processing statistics
   */
  const getStatistics = useCallback(() => {
    if (!processingRef.current) return null;

    const { gestureHistory, performanceMetrics } = processingRef.current;

    return {
      totalGestures: gestureHistory.length,
      averageProcessingTime: performanceMetrics.frameCount > 0
        ? performanceMetrics.totalProcessingTime / performanceMetrics.frameCount
        : 0,
      temporalStability: getTemporalStability(),
      activeSmoothingFilters: processingRef.current.smoother.getActiveFilterCount()
    };
  }, [getTemporalStability]);

  return {
    // State
    gestureState,

    // Actions
    processHands,
    resetGestures,
    updateConfig,

    // Utilities
    getTemporalStability,
    getStatistics,

    // Configuration
    config: fullConfig
  };
}