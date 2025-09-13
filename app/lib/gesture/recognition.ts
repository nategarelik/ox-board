/**
 * Gesture recognition algorithms and coordinate utilities
 * Handles hand landmark processing and gesture detection
 */

import { Point2D } from './smoothing';

/**
 * MediaPipe hand landmark indices (21 landmarks per hand)
 */
export enum HandLandmark {
  WRIST = 0,
  THUMB_CMC = 1,
  THUMB_MCP = 2,
  THUMB_IP = 3,
  THUMB_TIP = 4,
  INDEX_FINGER_MCP = 5,
  INDEX_FINGER_PIP = 6,
  INDEX_FINGER_DIP = 7,
  INDEX_FINGER_TIP = 8,
  MIDDLE_FINGER_MCP = 9,
  MIDDLE_FINGER_PIP = 10,
  MIDDLE_FINGER_DIP = 11,
  MIDDLE_FINGER_TIP = 12,
  RING_FINGER_MCP = 13,
  RING_FINGER_PIP = 14,
  RING_FINGER_DIP = 15,
  RING_FINGER_TIP = 16,
  PINKY_MCP = 17,
  PINKY_PIP = 18,
  PINKY_DIP = 19,
  PINKY_TIP = 20
}

/**
 * Hand detection result from MediaPipe
 */
export interface HandResult {
  /** Normalized landmarks (0-1 range) */
  landmarks: Point2D[];
  /** Hand classification (Left/Right) */
  handedness: 'Left' | 'Right';
  /** Detection confidence (0-1) */
  confidence: number;
  /** World coordinates (3D, in meters) - optional */
  worldLandmarks?: Array<{ x: number; y: number; z: number }>;
}

/**
 * Detected gesture information
 */
export interface GestureResult {
  /** Gesture type identifier */
  type: string;
  /** Gesture confidence (0-1) */
  confidence: number;
  /** Gesture-specific data */
  data: Record<string, any>;
  /** Timestamp when gesture was detected */
  timestamp: number;
}

/**
 * Two-hand gesture specifically for crossfader control
 */
export interface CrossfaderGesture extends GestureResult {
  type: 'crossfader';
  data: {
    /** Crossfader position (0-1, left to right) */
    position: number;
    /** Distance between hands (normalized) */
    handDistance: number;
    /** Left hand position */
    leftHand: Point2D;
    /** Right hand position */
    rightHand: Point2D;
  };
}

/**
 * Coordinate normalization utilities
 */
export class CoordinateNormalizer {
  /**
   * Normalize coordinates from pixel space to 0-1 range
   */
  static normalizeToUnit(
    point: Point2D,
    width: number,
    height: number
  ): Point2D {
    return {
      x: Math.max(0, Math.min(1, point.x / width)),
      y: Math.max(0, Math.min(1, point.y / height))
    };
  }

  /**
   * Denormalize coordinates from 0-1 range to pixel space
   */
  static denormalizeFromUnit(
    point: Point2D,
    width: number,
    height: number
  ): Point2D {
    return {
      x: point.x * width,
      y: point.y * height
    };
  }

  /**
   * Convert MediaPipe normalized coordinates to screen coordinates
   * MediaPipe uses (0,0) at top-left, (1,1) at bottom-right
   */
  static mediaPipeToScreen(
    landmarks: Array<{ x: number; y: number; z?: number }>,
    width: number,
    height: number
  ): Point2D[] {
    return landmarks.map(landmark => ({
      x: landmark.x * width,
      y: landmark.y * height
    }));
  }

  /**
   * Calculate distance between two points
   */
  static distance(p1: Point2D, p2: Point2D): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate normalized distance (0-1 range based on screen diagonal)
   */
  static normalizedDistance(
    p1: Point2D,
    p2: Point2D,
    width: number,
    height: number
  ): number {
    const distance = this.distance(p1, p2);
    const diagonal = Math.sqrt(width * width + height * height);
    return Math.min(1, distance / diagonal);
  }

  /**
   * Get center point between two points
   */
  static centerPoint(p1: Point2D, p2: Point2D): Point2D {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
  }

  /**
   * Map value from one range to another
   */
  static mapRange(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number
  ): number {
    const mapped = ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    return Math.max(outMin, Math.min(outMax, mapped));
  }
}

/**
 * Gesture confidence calculator
 */
export class GestureConfidenceCalculator {
  /**
   * Calculate confidence based on hand detection quality
   */
  static handDetectionConfidence(hand: HandResult): number {
    // Base confidence from MediaPipe
    let confidence = hand.confidence;

    // Penalize if landmarks are too close to edges (unstable tracking)
    const edgeThreshold = 0.05;
    const landmarks = hand.landmarks;

    for (const landmark of landmarks) {
      if (landmark.x < edgeThreshold || landmark.x > 1 - edgeThreshold ||
          landmark.y < edgeThreshold || landmark.y > 1 - edgeThreshold) {
        confidence *= 0.8; // Reduce confidence for edge landmarks
      }
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate confidence for two-hand gestures
   */
  static twoHandGestureConfidence(
    leftHand: HandResult,
    rightHand: HandResult,
    gestureSpecificFactors: Record<string, number> = {}
  ): number {
    // Base confidence is geometric mean of both hands
    const baseConfidence = Math.sqrt(
      this.handDetectionConfidence(leftHand) *
      this.handDetectionConfidence(rightHand)
    );

    // Apply gesture-specific factors
    let adjustedConfidence = baseConfidence;
    for (const [factor, weight] of Object.entries(gestureSpecificFactors)) {
      adjustedConfidence *= (1 + (weight - 1) * 0.2); // Smooth adjustment
    }

    return Math.max(0, Math.min(1, adjustedConfidence));
  }

  /**
   * Calculate temporal stability (confidence based on gesture consistency)
   */
  static temporalStability(
    recentGestures: GestureResult[],
    timeWindow: number = 500 // ms
  ): number {
    if (recentGestures.length < 2) return 0.5;

    const now = Date.now();
    const recentInWindow = recentGestures.filter(
      g => now - g.timestamp <= timeWindow
    );

    if (recentInWindow.length < 2) return 0.5;

    // Calculate consistency of gesture type
    const gestureTypes = recentInWindow.map(g => g.type);
    const mostCommonType = this.mostFrequent(gestureTypes);
    const consistency = gestureTypes.filter(t => t === mostCommonType).length / gestureTypes.length;

    // Calculate confidence stability
    const confidences = recentInWindow.map(g => g.confidence);
    const meanConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const confidenceVariance = confidences.reduce((acc, conf) =>
      acc + Math.pow(conf - meanConfidence, 2), 0
    ) / confidences.length;

    const stabilityScore = Math.exp(-confidenceVariance * 5); // Lower variance = higher stability

    return consistency * 0.7 + stabilityScore * 0.3;
  }

  private static mostFrequent<T>(arr: T[]): T {
    const counts = new Map<T, number>();
    for (const item of arr) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }

    let maxCount = 0;
    let mostFrequent = arr[0];
    for (const [item, count] of counts) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequent = item;
      }
    }

    return mostFrequent;
  }
}

/**
 * Two-hand crossfader gesture recognizer
 */
export class CrossfaderGestureRecognizer {
  private minHandDistance: number;
  private maxHandDistance: number;

  constructor(
    minDistance: number = 0.1, // Minimum normalized distance
    maxDistance: number = 0.7  // Maximum normalized distance
  ) {
    this.minHandDistance = minDistance;
    this.maxHandDistance = maxDistance;
  }

  /**
   * Recognize crossfader gesture from two hands
   */
  recognizeGesture(
    leftHand: HandResult,
    rightHand: HandResult,
    screenWidth: number,
    screenHeight: number
  ): CrossfaderGesture | null {
    // Get wrist positions as primary reference points
    const leftWrist = leftHand.landmarks[HandLandmark.WRIST];
    const rightWrist = rightHand.landmarks[HandLandmark.WRIST];

    // Calculate hand distance
    const handDistance = CoordinateNormalizer.normalizedDistance(
      leftWrist,
      rightWrist,
      screenWidth,
      screenHeight
    );

    // Check if distance is within valid range
    if (handDistance < this.minHandDistance || handDistance > this.maxHandDistance) {
      return null;
    }

    // Calculate crossfader position based on hand positions
    const centerPoint = CoordinateNormalizer.centerPoint(leftWrist, rightWrist);
    const crossfaderPosition = centerPoint.x; // Use horizontal center position

    // Calculate gesture confidence
    const confidence = GestureConfidenceCalculator.twoHandGestureConfidence(
      leftHand,
      rightHand,
      {
        distanceInRange: this.isDistanceOptimal(handDistance) ? 1.2 : 0.8,
        handsAligned: this.areHandsHorizontallyAligned(leftWrist, rightWrist) ? 1.1 : 0.9
      }
    );

    return {
      type: 'crossfader',
      confidence,
      timestamp: Date.now(),
      data: {
        position: Math.max(0, Math.min(1, crossfaderPosition)),
        handDistance,
        leftHand: leftWrist,
        rightHand: rightWrist
      }
    };
  }

  /**
   * Map hand distance to crossfader value (0-1)
   */
  mapDistanceToCrossfader(distance: number): number {
    return CoordinateNormalizer.mapRange(
      distance,
      this.minHandDistance,
      this.maxHandDistance,
      0,
      1
    );
  }

  /**
   * Check if distance is in optimal range for crossfader control
   */
  private isDistanceOptimal(distance: number): boolean {
    const optimalMin = this.minHandDistance + (this.maxHandDistance - this.minHandDistance) * 0.2;
    const optimalMax = this.minHandDistance + (this.maxHandDistance - this.minHandDistance) * 0.8;
    return distance >= optimalMin && distance <= optimalMax;
  }

  /**
   * Check if hands are roughly horizontally aligned
   */
  private areHandsHorizontallyAligned(leftHand: Point2D, rightHand: Point2D): boolean {
    const verticalDifference = Math.abs(leftHand.y - rightHand.y);
    const threshold = 0.1; // 10% of screen height
    return verticalDifference < threshold;
  }

  /**
   * Update distance thresholds
   */
  updateThresholds(minDistance: number, maxDistance: number): void {
    this.minHandDistance = Math.max(0, Math.min(1, minDistance));
    this.maxHandDistance = Math.max(this.minHandDistance, Math.min(1, maxDistance));
  }
}