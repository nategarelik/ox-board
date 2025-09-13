/**
 * Gesture recognition algorithms and coordinate utilities
 */

import { Point2D } from './smoothing';

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

export interface HandResult {
  landmarks: Point2D[];
  handedness: 'Left' | 'Right';
  confidence: number;
  worldLandmarks?: Array<{ x: number; y: number; z: number }>;
}

export interface GestureResult {
  type: string;
  confidence: number;
  data: Record<string, any>;
  timestamp: number;
}

export interface CrossfaderGesture extends GestureResult {
  type: 'crossfader';
  data: {
    position: number;
    handDistance: number;
    leftHand: Point2D;
    rightHand: Point2D;
  };
}

export class CoordinateNormalizer {
  static normalizeToUnit(point: Point2D, width: number, height: number): Point2D {
    return {
      x: Math.max(0, Math.min(1, point.x / width)),
      y: Math.max(0, Math.min(1, point.y / height))
    };
  }

  static denormalizeFromUnit(point: Point2D, width: number, height: number): Point2D {
    return {
      x: point.x * width,
      y: point.y * height
    };
  }

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

  static distance(p1: Point2D, p2: Point2D): number {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static normalizedDistance(p1: Point2D, p2: Point2D, width: number, height: number): number {
    const distance = this.distance(p1, p2);
    const diagonal = Math.sqrt(width * width + height * height);
    return Math.min(1, distance / diagonal);
  }

  static centerPoint(p1: Point2D, p2: Point2D): Point2D {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2
    };
  }

  static mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    const mapped = ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    return Math.max(outMin, Math.min(outMax, mapped));
  }
}

export class GestureConfidenceCalculator {
  static handDetectionConfidence(hand: HandResult): number {
    let confidence = hand.confidence;
    const edgeThreshold = 0.05;
    const landmarks = hand.landmarks;

    for (const landmark of landmarks) {
      if (landmark.x < edgeThreshold || landmark.x > 1 - edgeThreshold ||
          landmark.y < edgeThreshold || landmark.y > 1 - edgeThreshold) {
        confidence *= 0.8;
      }
    }

    return Math.max(0, Math.min(1, confidence));
  }

  static twoHandGestureConfidence(
    leftHand: HandResult,
    rightHand: HandResult,
    gestureSpecificFactors: Record<string, number> = {}
  ): number {
    const baseConfidence = Math.sqrt(
      this.handDetectionConfidence(leftHand) *
      this.handDetectionConfidence(rightHand)
    );

    let adjustedConfidence = baseConfidence;
    for (const [factor, weight] of Object.entries(gestureSpecificFactors)) {
      adjustedConfidence *= (1 + (weight - 1) * 0.2);
    }

    return Math.max(0, Math.min(1, adjustedConfidence));
  }

  static temporalStability(recentGestures: GestureResult[], timeWindow: number = 500): number {
    if (recentGestures.length < 2) return 0.5;

    const now = Date.now();
    const recentInWindow = recentGestures.filter(g => now - g.timestamp <= timeWindow);

    if (recentInWindow.length < 2) return 0.5;

    const gestureTypes = recentInWindow.map(g => g.type);
    const mostCommonType = this.mostFrequent(gestureTypes);
    const consistency = gestureTypes.filter(t => t === mostCommonType).length / gestureTypes.length;

    const confidences = recentInWindow.map(g => g.confidence);
    const meanConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const confidenceVariance = confidences.reduce((acc, conf) =>
      acc + Math.pow(conf - meanConfidence, 2), 0
    ) / confidences.length;

    const stabilityScore = Math.exp(-confidenceVariance * 5);

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

export class CrossfaderGestureRecognizer {
  private minHandDistance: number;
  private maxHandDistance: number;

  constructor(minDistance: number = 0.1, maxDistance: number = 0.7) {
    this.minHandDistance = minDistance;
    this.maxHandDistance = maxDistance;
  }

  recognizeGesture(
    leftHand: HandResult,
    rightHand: HandResult,
    screenWidth: number,
    screenHeight: number
  ): CrossfaderGesture | null {
    const leftWrist = leftHand.landmarks[HandLandmark.WRIST];
    const rightWrist = rightHand.landmarks[HandLandmark.WRIST];

    const handDistance = CoordinateNormalizer.normalizedDistance(
      leftWrist,
      rightWrist,
      screenWidth,
      screenHeight
    );

    if (handDistance < this.minHandDistance || handDistance > this.maxHandDistance) {
      return null;
    }

    const centerPoint = CoordinateNormalizer.centerPoint(leftWrist, rightWrist);
    const crossfaderPosition = centerPoint.x;

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

  mapDistanceToCrossfader(distance: number): number {
    return CoordinateNormalizer.mapRange(
      distance,
      this.minHandDistance,
      this.maxHandDistance,
      0,
      1
    );
  }

  private isDistanceOptimal(distance: number): boolean {
    const optimalMin = this.minHandDistance + (this.maxHandDistance - this.minHandDistance) * 0.2;
    const optimalMax = this.minHandDistance + (this.maxHandDistance - this.minHandDistance) * 0.8;
    return distance >= optimalMin && distance <= optimalMax;
  }

  private areHandsHorizontallyAligned(leftHand: Point2D, rightHand: Point2D): boolean {
    const verticalDifference = Math.abs(leftHand.y - rightHand.y);
    const threshold = 0.1;
    return verticalDifference < threshold;
  }

  updateThresholds(minDistance: number, maxDistance: number): void {
    this.minHandDistance = Math.max(0, Math.min(1, minDistance));
    this.maxHandDistance = Math.max(this.minHandDistance, Math.min(1, maxDistance));
  }
}
