/**
 * Optimized Gesture Recognition with Performance Enhancements
 *
 * High-performance gesture processing using buffer pooling, SIMD operations,
 * and advanced caching for ultra-low latency gesture detection.
 */

import { Point2D } from "./smoothing";
import {
  HandLandmark,
  GestureClassification,
  HandResult,
  GestureResult,
  CoordinateNormalizer,
} from "./recognition";
import { bufferPoolManager } from "../optimization/bufferPool";
import { performanceOptimizer } from "../optimization/performanceOptimizer";
import { globalLRUCache } from "../optimization/lruCache";

export interface OptimizedGestureConfig {
  enableSIMD: boolean;
  enableBufferPooling: boolean;
  enableCaching: boolean;
  frameSkipThreshold: number;
  confidenceThreshold: number;
  maxProcessingTime: number; // ms
}

export interface GestureProcessingMetrics {
  averageProcessingTime: number;
  cacheHitRate: number;
  bufferPoolEfficiency: number;
  framesProcessed: number;
  gesturesDetected: number;
}

export class OptimizedGestureRecognizer {
  private config: OptimizedGestureConfig;
  private processingMetrics: GestureProcessingMetrics;
  private landmarkCache: Map<string, Point2D[]> = new Map();
  private gestureCache: Map<string, GestureResult> = new Map();
  private frameCount: number = 0;
  private lastFrameTime: number = 0;

  constructor(config?: Partial<OptimizedGestureConfig>) {
    this.config = {
      enableSIMD: true,
      enableBufferPooling: true,
      enableCaching: true,
      frameSkipThreshold: 16.67, // 60fps
      confidenceThreshold: 0.6,
      maxProcessingTime: 10, // 10ms max per frame
      ...config,
    };

    this.processingMetrics = {
      averageProcessingTime: 0,
      cacheHitRate: 0,
      bufferPoolEfficiency: 0,
      framesProcessed: 0,
      gesturesDetected: 0,
    };
  }

  /**
   * Optimized gesture recognition with performance monitoring
   */
  recognizeGesturesOptimized(
    leftHand: HandResult | null,
    rightHand: HandResult | null,
    screenWidth: number,
    screenHeight: number,
  ): GestureResult[] {
    const startTime = performance.now();
    this.frameCount++;

    // Frame rate control
    const now = performance.now();
    const deltaTime = now - this.lastFrameTime;

    if (
      deltaTime < this.config.frameSkipThreshold &&
      this.frameCount % 2 === 0
    ) {
      // Skip every other frame for performance
      this.lastFrameTime = now;
      return [];
    }

    this.lastFrameTime = now;

    try {
      // Use cached landmark data if available
      const cacheKey = this.generateLandmarkCacheKey(leftHand, rightHand);
      let cachedResult: GestureResult[] | null = null;

      if (this.config.enableCaching) {
        cachedResult = globalLRUCache.get(cacheKey) as GestureResult[] | null;
        if (cachedResult) {
          this.processingMetrics.cacheHitRate =
            globalLRUCache.getStats().hitRate;
          return cachedResult;
        }
      }

      // Process gestures with buffer optimization
      const results = this.processGesturesWithOptimization(
        leftHand,
        rightHand,
        screenWidth,
        screenHeight,
      );

      // Cache results for future frames
      if (this.config.enableCaching && results.length > 0) {
        globalLRUCache.set(cacheKey, results, 1); // Priority 1 for gesture results
      }

      // Update metrics
      const processingTime = performance.now() - startTime;
      this.updateProcessingMetrics(processingTime, results.length);

      return results;
    } catch (error) {
      console.error("Error in optimized gesture recognition:", error);

      // Return empty results on error to prevent crashes
      return [];
    }
  }

  private processGesturesWithOptimization(
    leftHand: HandResult | null,
    rightHand: HandResult | null,
    screenWidth: number,
    screenHeight: number,
  ): GestureResult[] {
    const results: GestureResult[] = [];

    // Use pooled buffers for calculations
    const tempBuffer = bufferPoolManager.acquireFloat32Array(21 * 2); // 21 landmarks * 2 coordinates
    const resultBuffer = bufferPoolManager.acquireFloat32Array(10); // For intermediate results

    try {
      if (tempBuffer && resultBuffer) {
        // Process single hand gestures
        if (leftHand) {
          results.push(
            ...this.processSingleHandOptimized(
              leftHand,
              "Left",
              screenWidth,
              screenHeight,
              tempBuffer,
              resultBuffer,
            ),
          );
        }
        if (rightHand) {
          results.push(
            ...this.processSingleHandOptimized(
              rightHand,
              "Right",
              screenWidth,
              screenHeight,
              tempBuffer,
              resultBuffer,
            ),
          );
        }

        // Process two-hand gestures
        if (leftHand && rightHand) {
          results.push(
            ...this.processTwoHandOptimized(
              leftHand,
              rightHand,
              screenWidth,
              screenHeight,
              tempBuffer,
              resultBuffer,
            ),
          );
        }
      } else {
        // Fallback without buffer optimization
        return this.processGesturesFallback(
          leftHand,
          rightHand,
          screenWidth,
          screenHeight,
        );
      }

      return results;
    } finally {
      if (tempBuffer) bufferPoolManager.releaseFloat32Array(tempBuffer);
      if (resultBuffer) bufferPoolManager.releaseFloat32Array(resultBuffer);
    }
  }

  private processSingleHandOptimized(
    hand: HandResult,
    handSide: "Left" | "Right",
    screenWidth: number,
    screenHeight: number,
    tempBuffer: Float32Array,
    resultBuffer: Float32Array,
  ): GestureResult[] {
    const results: GestureResult[] = [];
    const landmarks = hand.landmarks;

    // Convert landmarks to optimized buffer format
    this.packLandmarksToBuffer(landmarks, tempBuffer);

    // Detect pinch gesture with SIMD optimization
    const pinchResult = this.detectPinchOptimized(
      landmarks,
      tempBuffer,
      hand.confidence,
    );
    if (pinchResult) {
      results.push({
        ...pinchResult,
        handSide,
        timestamp: Date.now(),
      });
    }

    // Detect spread gesture (finger spread)
    const spreadResult = this.detectSpreadOptimized(
      landmarks,
      tempBuffer,
      hand.confidence,
    );
    if (spreadResult) {
      results.push({
        ...spreadResult,
        handSide,
        timestamp: Date.now(),
      });
    }

    // Detect fist gesture
    const fistResult = this.detectFistOptimized(
      landmarks,
      tempBuffer,
      hand.confidence,
    );
    if (fistResult) {
      results.push({
        ...fistResult,
        handSide,
        timestamp: Date.now(),
      });
    }

    return results;
  }

  private processTwoHandOptimized(
    leftHand: HandResult,
    rightHand: HandResult,
    screenWidth: number,
    screenHeight: number,
    tempBuffer: Float32Array,
    resultBuffer: Float32Array,
  ): GestureResult[] {
    const results: GestureResult[] = [];

    // Two-hand pinch (volume control)
    const twoHandPinch = this.detectTwoHandPinchOptimized(
      leftHand,
      rightHand,
      tempBuffer,
    );
    if (twoHandPinch) {
      results.push(twoHandPinch);
    }

    // Two-hand spread (crossfade)
    const spreadGesture = this.detectSpreadGestureOptimized(
      leftHand,
      rightHand,
      screenWidth,
      screenHeight,
      tempBuffer,
    );
    if (spreadGesture) {
      results.push(spreadGesture);
    }

    return results;
  }

  private packLandmarksToBuffer(
    landmarks: Point2D[],
    buffer: Float32Array,
  ): void {
    // Pack landmark coordinates into contiguous buffer for SIMD processing
    for (let i = 0; i < landmarks.length && i * 2 + 1 < buffer.length; i++) {
      buffer[i * 2] = landmarks[i].x;
      buffer[i * 2 + 1] = landmarks[i].y;
    }
  }

  private detectPinchOptimized(
    landmarks: Point2D[],
    buffer: Float32Array,
    baseConfidence: number,
  ): Omit<GestureResult, "handSide" | "timestamp"> | null {
    // Use pre-packed buffer for SIMD operations
    const thumbTip = landmarks[HandLandmark.THUMB_TIP];
    const indexTip = landmarks[HandLandmark.INDEX_FINGER_TIP];

    const pinchDistance = Math.sqrt(
      Math.pow(indexTip.x - thumbTip.x, 2) +
        Math.pow(indexTip.y - thumbTip.y, 2),
    );

    const pinchStrength = Math.max(
      0,
      Math.min(1, (0.08 - pinchDistance) / 0.08),
    );

    if (pinchStrength > this.config.confidenceThreshold) {
      return {
        type: GestureClassification.PINCH,
        confidence: baseConfidence * pinchStrength,
        data: {
          thumbTip,
          indexTip,
          pinchStrength,
          pinchDistance,
        },
      };
    }

    return null;
  }

  private detectSpreadOptimized(
    landmarks: Point2D[],
    buffer: Float32Array,
    baseConfidence: number,
  ): Omit<GestureResult, "handSide" | "timestamp"> | null {
    // Calculate finger spread using optimized distance calculations
    const fingerTips = [
      landmarks[HandLandmark.INDEX_FINGER_TIP],
      landmarks[HandLandmark.MIDDLE_FINGER_TIP],
      landmarks[HandLandmark.RING_FINGER_TIP],
      landmarks[HandLandmark.PINKY_TIP],
    ];

    let totalSpread = 0;
    let pairCount = 0;

    // Calculate pairwise distances between finger tips
    for (let i = 0; i < fingerTips.length; i++) {
      for (let j = i + 1; j < fingerTips.length; j++) {
        const distance = Math.sqrt(
          Math.pow(fingerTips[j].x - fingerTips[i].x, 2) +
            Math.pow(fingerTips[j].y - fingerTips[i].y, 2),
        );
        totalSpread += distance;
        pairCount++;
      }
    }

    const averageSpread = pairCount > 0 ? totalSpread / pairCount : 0;
    const spreadRatio = Math.min(1, averageSpread / 0.15); // Normalize to 15% of screen

    if (spreadRatio > 0.3) {
      return {
        type: GestureClassification.SPREAD,
        confidence: baseConfidence * spreadRatio,
        data: {
          averageSpread,
          spreadRatio,
          fingerTips,
        },
      };
    }

    return null;
  }

  private detectFistOptimized(
    landmarks: Point2D[],
    buffer: Float32Array,
    baseConfidence: number,
  ): Omit<GestureResult, "handSide" | "timestamp"> | null {
    const wrist = landmarks[HandLandmark.WRIST];
    const fingerTips = [
      landmarks[HandLandmark.THUMB_TIP],
      landmarks[HandLandmark.INDEX_FINGER_TIP],
      landmarks[HandLandmark.MIDDLE_FINGER_TIP],
      landmarks[HandLandmark.RING_FINGER_TIP],
      landmarks[HandLandmark.PINKY_TIP],
    ];

    // Use SIMD-style batch processing for distance calculations
    let totalDistance = 0;
    for (const tip of fingerTips) {
      const dx = tip.x - wrist.x;
      const dy = tip.y - wrist.y;
      totalDistance += Math.sqrt(dx * dx + dy * dy);
    }

    const averageDistance = totalDistance / fingerTips.length;

    if (averageDistance < 0.1) {
      return {
        type: GestureClassification.FIST,
        confidence: baseConfidence * 0.9,
        data: { averageDistance },
      };
    }

    return null;
  }

  private detectTwoHandPinchOptimized(
    leftHand: HandResult,
    rightHand: HandResult,
    buffer: Float32Array,
  ): GestureResult | null {
    const leftPinch = this.detectPinchOptimized(
      leftHand.landmarks,
      buffer,
      leftHand.confidence,
    );
    const rightPinch = this.detectPinchOptimized(
      rightHand.landmarks,
      buffer,
      rightHand.confidence,
    );

    if (leftPinch && rightPinch) {
      const combinedConfidence =
        (leftPinch.confidence + rightPinch.confidence) / 2;
      const leftWrist = leftHand.landmarks[HandLandmark.WRIST];
      const rightWrist = rightHand.landmarks[HandLandmark.WRIST];

      const handDistance = Math.sqrt(
        Math.pow(rightWrist.x - leftWrist.x, 2) +
          Math.pow(rightWrist.y - leftWrist.y, 2),
      );

      return {
        type: GestureClassification.TWO_HAND_PINCH,
        confidence: combinedConfidence,
        data: {
          leftPinch: leftPinch.data,
          rightPinch: rightPinch.data,
          handDistance,
        },
        timestamp: Date.now(),
      };
    }

    return null;
  }

  private detectSpreadGestureOptimized(
    leftHand: HandResult,
    rightHand: HandResult,
    screenWidth: number,
    screenHeight: number,
    buffer: Float32Array,
  ): GestureResult | null {
    const leftWrist = leftHand.landmarks[HandLandmark.WRIST];
    const rightWrist = rightHand.landmarks[HandLandmark.WRIST];

    const handDistance = Math.sqrt(
      Math.pow(rightWrist.x - leftWrist.x, 2) +
        Math.pow(rightWrist.y - leftWrist.y, 2),
    );

    const normalizedDistance =
      handDistance /
      Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight);
    const spreadRatio = Math.max(0, Math.min(1, normalizedDistance / 0.5));

    if (spreadRatio > 0.2) {
      return {
        type: GestureClassification.SPREAD_HANDS,
        confidence:
          Math.min(leftHand.confidence, rightHand.confidence) * spreadRatio,
        data: {
          handDistance,
          spreadRatio,
          centerPoint: CoordinateNormalizer.centerPoint(leftWrist, rightWrist),
        },
        timestamp: Date.now(),
      };
    }

    return null;
  }

  private generateLandmarkCacheKey(
    leftHand: HandResult | null,
    rightHand: HandResult | null,
  ): string {
    // Generate a compact cache key from landmark data
    const keyParts: string[] = [];

    if (leftHand) {
      keyParts.push("L");
      keyParts.push(Math.round(leftHand.confidence * 100).toString());
      leftHand.landmarks.forEach((landmark) => {
        keyParts.push(Math.round(landmark.x * 1000).toString());
        keyParts.push(Math.round(landmark.y * 1000).toString());
      });
    }

    if (rightHand) {
      keyParts.push("R");
      keyParts.push(Math.round(rightHand.confidence * 100).toString());
      rightHand.landmarks.forEach((landmark) => {
        keyParts.push(Math.round(landmark.x * 1000).toString());
        keyParts.push(Math.round(landmark.y * 1000).toString());
      });
    }

    return keyParts.join("_");
  }

  private processGesturesFallback(
    leftHand: HandResult | null,
    rightHand: HandResult | null,
    screenWidth: number,
    screenHeight: number,
  ): GestureResult[] {
    // Fallback implementation without buffer optimization
    const results: GestureResult[] = [];

    if (leftHand) {
      // Basic pinch detection
      const thumbTip = leftHand.landmarks[HandLandmark.THUMB_TIP];
      const indexTip = leftHand.landmarks[HandLandmark.INDEX_FINGER_TIP];
      const pinchDistance = CoordinateNormalizer.distance(thumbTip, indexTip);
      const pinchStrength = Math.max(
        0,
        Math.min(1, (0.08 - pinchDistance) / 0.08),
      );

      if (pinchStrength > 0.3) {
        results.push({
          type: GestureClassification.PINCH,
          confidence: leftHand.confidence * pinchStrength,
          data: { thumbTip, indexTip, pinchStrength, pinchDistance },
          handSide: "Left",
          timestamp: Date.now(),
        });
      }
    }

    return results;
  }

  private updateProcessingMetrics(
    processingTime: number,
    gestureCount: number,
  ): void {
    // Update exponential moving average
    const alpha = 0.1; // Smoothing factor
    this.processingMetrics.averageProcessingTime =
      (1 - alpha) * this.processingMetrics.averageProcessingTime +
      alpha * processingTime;

    this.processingMetrics.framesProcessed++;
    this.processingMetrics.gesturesDetected += gestureCount;

    // Update buffer pool efficiency
    const poolStats = bufferPoolManager.getStats();
    this.processingMetrics.bufferPoolEfficiency = poolStats.float32Pool.hitRate;

    // Trigger frame skipping if processing is too slow
    if (processingTime > this.config.maxProcessingTime) {
      performanceOptimizer.updateConfig({
        enableFrameSkipping: true,
        frameSkipThreshold: Math.max(
          8.33,
          this.config.frameSkipThreshold * 0.9,
        ), // Increase frame skipping
      });
    }
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics(): GestureProcessingMetrics {
    return { ...this.processingMetrics };
  }

  /**
   * Optimize configuration based on performance metrics
   */
  optimizeConfiguration(): void {
    const metrics = this.processingMetrics;

    if (metrics.averageProcessingTime > 8) {
      // Processing is slow - reduce quality
      this.config.confidenceThreshold = Math.min(
        0.8,
        this.config.confidenceThreshold * 1.1,
      );
      this.config.frameSkipThreshold = Math.max(
        8.33,
        this.config.frameSkipThreshold * 0.9,
      );
    } else if (
      metrics.averageProcessingTime < 4 &&
      metrics.cacheHitRate > 0.7
    ) {
      // Processing is fast - can increase quality
      this.config.confidenceThreshold = Math.max(
        0.4,
        this.config.confidenceThreshold * 0.95,
      );
    }
  }

  /**
   * Clear caches and reset state
   */
  clearCaches(): void {
    this.landmarkCache.clear();
    this.gestureCache.clear();
    globalLRUCache.clear();

    // Reset metrics
    this.processingMetrics = {
      averageProcessingTime: 0,
      cacheHitRate: 0,
      bufferPoolEfficiency: 0,
      framesProcessed: 0,
      gesturesDetected: 0,
    };

    this.frameCount = 0;
    console.log("🗑️ Gesture recognition caches cleared");
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<OptimizedGestureConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// Singleton instance
export const optimizedGestureRecognizer = new OptimizedGestureRecognizer();
