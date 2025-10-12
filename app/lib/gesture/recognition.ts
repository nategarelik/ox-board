/**
 * Enhanced gesture recognition algorithms and coordinate utilities
 * Comprehensive hand gesture detection using MediaPipe with advanced classification
 */

import { Point2D } from "./smoothing";

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
  PINKY_TIP = 20,
}

export enum GestureClassification {
  // Basic Gestures
  PINCH = "pinch",
  SWIPE_HORIZONTAL = "swipe_horizontal",
  SWIPE_VERTICAL = "swipe_vertical",
  ROTATE = "rotate",
  SPREAD = "spread",
  FIST = "fist",
  PALM_OPEN = "palm_open",

  // Complex Gestures
  TWO_HAND_PINCH = "two_hand_pinch",
  TWO_HAND_ROTATE = "two_hand_rotate",
  FINGER_COUNT = "finger_count",
  HAND_WAVE = "hand_wave",
  PEACE_SIGN = "peace_sign",
  THUMBS_UP = "thumbs_up",
  THUMBS_DOWN = "thumbs_down",

  // Two-hand gestures
  CLAP = "clap",
  SPREAD_HANDS = "spread_hands",
  CROSSFADER_HANDS = "crossfader_hands",
  DUAL_CONTROL = "dual_control",

  // Movement Gestures
  CIRCLE_GESTURE = "circle_gesture",
  ZIGZAG_GESTURE = "zigzag_gesture",
  PUSH_GESTURE = "push_gesture",
  PULL_GESTURE = "pull_gesture",
}

export interface HandResult {
  landmarks: Point2D[];
  handedness: "Left" | "Right";
  confidence: number;
  worldLandmarks?: Array<{ x: number; y: number; z: number }>;
}

export interface GestureResult {
  type: GestureClassification;
  confidence: number;
  data: Record<string, any>;
  timestamp: number;
  handSide?: "Left" | "Right";
  metadata?: {
    fingerCount?: number;
    handDistance?: number;
    rotationAngle?: number;
    velocity?: Point2D;
    direction?: "up" | "down" | "left" | "right";
    clockwise?: boolean;
  };
}

export interface GestureHistory {
  results: GestureResult[];
  maxSize: number;
  timeWindow: number;
}

export interface PinchGesture extends GestureResult {
  type: GestureClassification.PINCH;
  data: {
    thumbTip: Point2D;
    indexTip: Point2D;
    pinchStrength: number;
    pinchDistance: number;
  };
}

export interface SwipeGesture extends GestureResult {
  type:
    | GestureClassification.SWIPE_HORIZONTAL
    | GestureClassification.SWIPE_VERTICAL;
  data: {
    startPosition: Point2D;
    endPosition: Point2D;
    velocity: Point2D;
    distance: number;
    direction: "left" | "right" | "up" | "down";
  };
}

export interface RotateGesture extends GestureResult {
  type: GestureClassification.ROTATE;
  data: {
    centerPoint: Point2D;
    radius: number;
    angle: number;
    angularVelocity: number;
    clockwise: boolean;
  };
}

export interface SpreadGesture extends GestureResult {
  type: GestureClassification.SPREAD;
  data: {
    handDistance: number;
    spreadRatio: number;
    centerPoint: Point2D;
  };
}

export class CoordinateNormalizer {
  static normalizeToUnit(
    point: Point2D,
    width: number,
    height: number,
  ): Point2D {
    return {
      x: Math.max(0, Math.min(1, point.x / width)),
      y: Math.max(0, Math.min(1, point.y / height)),
    };
  }

  static denormalizeFromUnit(
    point: Point2D,
    width: number,
    height: number,
  ): Point2D {
    return {
      x: point.x * width,
      y: point.y * height,
    };
  }

  static mediaPipeToScreen(
    landmarks: Array<{ x: number; y: number; z?: number }>,
    width: number,
    height: number,
  ): Point2D[] {
    return landmarks.map((landmark) => ({
      x: landmark.x * width,
      y: landmark.y * height,
    }));
  }

  static distance(p1: Point2D, p2: Point2D): number {
    if (!p1 || !p2) {
      return 0;
    }
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  static normalizedDistance(
    p1: Point2D,
    p2: Point2D,
    width: number,
    height: number,
  ): number {
    const distance = this.distance(p1, p2);
    const diagonal = Math.sqrt(width * width + height * height);
    return Math.min(1, distance / diagonal);
  }

  static centerPoint(p1: Point2D, p2: Point2D): Point2D {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };
  }

  static mapRange(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number,
  ): number {
    const mapped =
      ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
    return Math.max(outMin, Math.min(outMax, mapped));
  }

  static calculateAngle(p1: Point2D, p2: Point2D, p3: Point2D): number {
    if (!p1 || !p2 || !p3) {
      return 0;
    }
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };

    const dot = v1.x * v2.x + v1.y * v2.y;
    const det = v1.x * v2.y - v1.y * v2.x;

    return Math.atan2(det, dot);
  }

  static calculateRotationAngle(center: Point2D, point: Point2D): number {
    return Math.atan2(point.y - center.y, point.x - center.x);
  }

  static calculateVelocity(
    current: Point2D,
    previous: Point2D,
    deltaTime: number,
  ): Point2D {
    if (deltaTime <= 0) return { x: 0, y: 0 };

    return {
      x: (current.x - previous.x) / deltaTime,
      y: (current.y - previous.y) / deltaTime,
    };
  }
}

export class GestureConfidenceCalculator {
  static handDetectionConfidence(hand: HandResult): number {
    let confidence = hand.confidence;
    const edgeThreshold = 0.05;
    const landmarks = hand.landmarks;

    // Penalize landmarks near screen edges (camera view issues)
    for (const landmark of landmarks) {
      if (
        landmark.x < edgeThreshold ||
        landmark.x > 1 - edgeThreshold ||
        landmark.y < edgeThreshold ||
        landmark.y > 1 - edgeThreshold
      ) {
        confidence *= 0.8;
      }
    }

    // Check for landmark consistency
    const landmarkConsistency = this.calculateLandmarkConsistency(landmarks);
    confidence *= 0.7 + 0.3 * landmarkConsistency;

    return Math.max(0, Math.min(1, confidence));
  }

  static twoHandGestureConfidence(
    leftHand: HandResult,
    rightHand: HandResult,
    gestureSpecificFactors: Record<string, number> = {},
  ): number {
    const baseConfidence = Math.sqrt(
      this.handDetectionConfidence(leftHand) *
        this.handDetectionConfidence(rightHand),
    );

    // Hand interaction quality factors
    const handDistance = CoordinateNormalizer.distance(
      leftHand.landmarks[HandLandmark.WRIST],
      rightHand.landmarks[HandLandmark.WRIST],
    );

    let adjustedConfidence = baseConfidence;

    // Optimal interaction distance bonus
    const optimalDistance = 0.3; // ~30% of screen width
    const distanceFactor =
      1 - Math.abs(handDistance - optimalDistance) / optimalDistance;
    adjustedConfidence *= Math.max(0.5, distanceFactor);

    // Apply gesture-specific factors
    for (const [factor, weight] of Object.entries(gestureSpecificFactors)) {
      adjustedConfidence *= 1 + (weight - 1) * 0.2;
    }

    return Math.max(0, Math.min(1, adjustedConfidence));
  }

  static temporalStability(
    recentGestures: GestureResult[],
    timeWindow: number = 500,
  ): number {
    if (recentGestures.length < 2) return 0.5;

    const now = Date.now();
    const recentInWindow = recentGestures.filter(
      (g) => now - g.timestamp <= timeWindow,
    );

    if (recentInWindow.length < 2) return 0.5;

    const gestureTypes = recentInWindow.map((g) => g.type);
    const mostCommonType = this.mostFrequent(gestureTypes);
    const consistency =
      gestureTypes.filter((t) => t === mostCommonType).length /
      gestureTypes.length;

    const confidences = recentInWindow.map((g) => g.confidence);
    const meanConfidence =
      confidences.reduce((a, b) => a + b, 0) / confidences.length;
    const confidenceVariance =
      confidences.reduce(
        (acc, conf) => acc + Math.pow(conf - meanConfidence, 2),
        0,
      ) / confidences.length;

    const stabilityScore = Math.exp(-confidenceVariance * 5);

    return consistency * 0.7 + stabilityScore * 0.3;
  }

  static gestureVelocityStability(
    recentGestures: GestureResult[],
    timeWindow: number = 500,
  ): number {
    if (recentGestures.length < 3) return 0.5;

    const now = Date.now();
    const recentInWindow = recentGestures.filter(
      (g) => now - g.timestamp <= timeWindow,
    );

    if (recentInWindow.length < 3) return 0.5;

    // Calculate velocity consistency
    const velocities = [];
    for (let i = 1; i < recentInWindow.length; i++) {
      const current = recentInWindow[i];
      const previous = recentInWindow[i - 1];
      const deltaTime = (current.timestamp - previous.timestamp) / 1000; // Convert to seconds

      if (
        deltaTime > 0 &&
        current.metadata?.velocity &&
        previous.metadata?.velocity
      ) {
        const velocity = CoordinateNormalizer.distance(
          current.metadata.velocity,
          previous.metadata.velocity,
        );
        velocities.push(velocity);
      }
    }

    if (velocities.length < 2) return 0.5;

    const meanVelocity =
      velocities.reduce((a, b) => a + b, 0) / velocities.length;
    const velocityVariance =
      velocities.reduce(
        (acc, vel) => acc + Math.pow(vel - meanVelocity, 2),
        0,
      ) / velocities.length;

    const velocityStability = Math.exp(-velocityVariance * 10);

    return Math.max(0, Math.min(1, velocityStability));
  }

  private static calculateLandmarkConsistency(landmarks: Point2D[]): number {
    if (landmarks.length < 3) return 0;

    let totalConsistency = 0;
    let pairCount = 0;

    // Calculate pairwise distances and their consistency
    for (let i = 0; i < landmarks.length; i++) {
      for (let j = i + 1; j < landmarks.length; j++) {
        const distance = CoordinateNormalizer.distance(
          landmarks[i],
          landmarks[j],
        );
        // Distance should be reasonable (not too close, not too far)
        const reasonableDistance = distance > 0.01 && distance < 0.5;
        totalConsistency += reasonableDistance ? 1 : 0;
        pairCount++;
      }
    }

    return pairCount > 0 ? totalConsistency / pairCount : 0;
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
 * Comprehensive gesture recognition system with advanced classification
 */
export class AdvancedGestureRecognizer {
  private gestureHistory: Map<string, GestureHistory> = new Map();
  private maxHistorySize = 50;
  private timeWindow = 1000; // 1 second

  constructor() {
    // Initialize gesture history tracking
    Object.values(GestureClassification).forEach((gestureType) => {
      this.gestureHistory.set(gestureType, {
        results: [],
        maxSize: this.maxHistorySize,
        timeWindow: this.timeWindow,
      });
    });
  }

  /**
   * Main gesture recognition method
   */
  recognizeGestures(
    leftHand: HandResult | null,
    rightHand: HandResult | null,
    screenWidth: number,
    screenHeight: number,
  ): GestureResult[] {
    const results: GestureResult[] = [];
    const timestamp = Date.now();

    // Single hand gestures
    if (leftHand) {
      results.push(
        ...this.recognizeSingleHandGestures(
          leftHand,
          "Left",
          screenWidth,
          screenHeight,
        ),
      );
    }
    if (rightHand) {
      results.push(
        ...this.recognizeSingleHandGestures(
          rightHand,
          "Right",
          screenWidth,
          screenHeight,
        ),
      );
    }

    // Two-hand gestures
    if (leftHand && rightHand) {
      results.push(
        ...this.recognizeTwoHandGestures(
          leftHand,
          rightHand,
          screenWidth,
          screenHeight,
        ),
      );
    }

    // Update gesture history
    results.forEach((result) => {
      this.updateGestureHistory(result);
    });

    // Filter by confidence and temporal stability
    return results.filter((result) => {
      const history = this.gestureHistory.get(result.type);
      if (!history) return result.confidence > 0.6;

      const stability = GestureConfidenceCalculator.temporalStability(
        history.results,
      );
      const velocityStability =
        GestureConfidenceCalculator.gestureVelocityStability(history.results);

      return (
        result.confidence > 0.6 && stability > 0.4 && velocityStability > 0.3
      );
    });
  }

  private recognizeSingleHandGestures(
    hand: HandResult,
    handSide: "Left" | "Right",
    screenWidth: number,
    screenHeight: number,
  ): GestureResult[] {
    const results: GestureResult[] = [];
    const landmarks = hand.landmarks;

    // Pinch gesture detection
    const pinchResult = this.detectPinchGesture(landmarks, hand.confidence);
    if (pinchResult) {
      results.push({
        ...pinchResult,
        handSide,
        timestamp: Date.now(),
      });
    }

    // Fist gesture detection
    const fistResult = this.detectFistGesture(landmarks, hand.confidence);
    if (fistResult) {
      results.push({
        ...fistResult,
        handSide,
        timestamp: Date.now(),
      });
    }

    // Palm open gesture detection
    const palmResult = this.detectPalmOpenGesture(landmarks, hand.confidence);
    if (palmResult) {
      results.push({
        ...palmResult,
        handSide,
        timestamp: Date.now(),
      });
    }

    // Finger count gesture detection
    const fingerCountResult = this.detectFingerCountGesture(
      landmarks,
      hand.confidence,
    );
    if (fingerCountResult) {
      results.push({
        ...fingerCountResult,
        handSide,
        timestamp: Date.now(),
      });
    }

    // Movement gestures (swipe, rotate)
    const movementResults = this.detectMovementGestures(
      landmarks,
      handSide,
      screenWidth,
      screenHeight,
    );
    results.push(...movementResults);

    return results;
  }

  private recognizeTwoHandGestures(
    leftHand: HandResult,
    rightHand: HandResult,
    screenWidth: number,
    screenHeight: number,
  ): GestureResult[] {
    const results: GestureResult[] = [];

    // Two-hand pinch (master volume)
    const twoHandPinchResult = this.detectTwoHandPinchGesture(
      leftHand,
      rightHand,
    );
    if (twoHandPinchResult) {
      results.push(twoHandPinchResult);
    }

    // Two-hand rotate (global EQ)
    const twoHandRotateResult = this.detectTwoHandRotateGesture(
      leftHand,
      rightHand,
      screenWidth,
      screenHeight,
    );
    if (twoHandRotateResult) {
      results.push(twoHandRotateResult);
    }

    // Spread gesture (crossfade)
    const spreadResult = this.detectSpreadGesture(
      leftHand,
      rightHand,
      screenWidth,
      screenHeight,
    );
    if (spreadResult) {
      results.push(spreadResult);
    }

    return results;
  }

  private detectPinchGesture(
    landmarks: Point2D[],
    baseConfidence: number,
  ): Omit<PinchGesture, "handSide" | "timestamp"> | null {
    const thumbTip = landmarks[HandLandmark.THUMB_TIP];
    const indexTip = landmarks[HandLandmark.INDEX_FINGER_TIP];

    const pinchDistance = CoordinateNormalizer.distance(thumbTip, indexTip);
    const pinchStrength = Math.max(
      0,
      Math.min(1, (0.08 - pinchDistance) / 0.08),
    );

    if (pinchStrength > 0.3) {
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

  private detectFistGesture(
    landmarks: Point2D[],
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

    const averageDistance =
      fingerTips.reduce(
        (sum, tip) => sum + CoordinateNormalizer.distance(wrist, tip),
        0,
      ) / fingerTips.length;

    if (averageDistance < 0.1) {
      return {
        type: GestureClassification.FIST,
        confidence: baseConfidence * 0.9,
        data: { averageDistance },
      };
    }

    return null;
  }

  private detectPalmOpenGesture(
    landmarks: Point2D[],
    baseConfidence: number,
  ): Omit<GestureResult, "handSide" | "timestamp"> | null {
    const fingerTips = [
      landmarks[HandLandmark.INDEX_FINGER_TIP],
      landmarks[HandLandmark.MIDDLE_FINGER_TIP],
      landmarks[HandLandmark.RING_FINGER_TIP],
      landmarks[HandLandmark.PINKY_TIP],
    ];

    const fingerPips = [
      landmarks[HandLandmark.INDEX_FINGER_PIP],
      landmarks[HandLandmark.MIDDLE_FINGER_PIP],
      landmarks[HandLandmark.RING_FINGER_PIP],
      landmarks[HandLandmark.PINKY_PIP],
    ];

    let extendedCount = 0;
    for (let i = 0; i < fingerTips.length; i++) {
      if (!fingerTips[i] || !fingerPips[i]) continue;
      if (fingerTips[i].y < fingerPips[i].y - 0.02) {
        extendedCount++;
      }
    }

    if (extendedCount >= 3) {
      return {
        type: GestureClassification.PALM_OPEN,
        confidence: baseConfidence * (extendedCount / 4),
        data: { extendedCount },
      };
    }

    return null;
  }

  private detectFingerCountGesture(
    landmarks: Point2D[],
    baseConfidence: number,
  ): Omit<GestureResult, "handSide" | "timestamp"> | null {
    const fingerTips = [
      landmarks[HandLandmark.INDEX_FINGER_TIP],
      landmarks[HandLandmark.MIDDLE_FINGER_TIP],
      landmarks[HandLandmark.RING_FINGER_TIP],
      landmarks[HandLandmark.PINKY_TIP],
    ];

    const fingerPips = [
      landmarks[HandLandmark.INDEX_FINGER_PIP],
      landmarks[HandLandmark.MIDDLE_FINGER_PIP],
      landmarks[HandLandmark.RING_FINGER_PIP],
      landmarks[HandLandmark.PINKY_PIP],
    ];

    let fingerCount = 0;
    for (let i = 0; i < fingerTips.length; i++) {
      if (!fingerTips[i] || !fingerPips[i]) continue;
      if (fingerTips[i].y < fingerPips[i].y - 0.03) {
        fingerCount++;
      }
    }

    // Check thumb separately
    const thumbTip = landmarks[HandLandmark.THUMB_TIP];
    const thumbIp = landmarks[HandLandmark.THUMB_IP];
    if (!thumbTip || !thumbIp) {
      // Skip thumb check if landmarks are undefined
    } else if (thumbTip.y < thumbIp.y - 0.03) {
      fingerCount++;
    }

    if (fingerCount > 0) {
      return {
        type: GestureClassification.FINGER_COUNT,
        confidence: baseConfidence * 0.8,
        data: { fingerCount },
        metadata: { fingerCount },
      };
    }

    return null;
  }

  private detectMovementGestures(
    landmarks: Point2D[],
    handSide: "Left" | "Right",
    screenWidth: number,
    screenHeight: number,
  ): GestureResult[] {
    const results: GestureResult[] = [];

    // Get gesture history for movement detection
    const history = this.gestureHistory.get(
      GestureClassification.SWIPE_HORIZONTAL,
    );
    if (!history || history.results.length < 2) return results;

    const recentGestures = history.results
      .filter((g) => g.timestamp > Date.now() - 500)
      .filter((g) => g.handSide === handSide);

    if (recentGestures.length < 2) return results;

    const current = recentGestures[recentGestures.length - 1];
    const previous = recentGestures[recentGestures.length - 2];

    if (current.metadata?.velocity && previous.metadata?.velocity) {
      const velocity = current.metadata.velocity;
      const deltaTime = (current.timestamp - previous.timestamp) / 1000;

      // Detect swipe gestures based on velocity
      const horizontalVelocity = Math.abs(velocity.x);
      const verticalVelocity = Math.abs(velocity.y);

      if (
        horizontalVelocity > 0.5 &&
        horizontalVelocity > verticalVelocity * 2
      ) {
        const direction = velocity.x > 0 ? "right" : "left";
        results.push({
          type: GestureClassification.SWIPE_HORIZONTAL,
          confidence: current.confidence,
          data: {
            startPosition: previous.data as Point2D,
            endPosition: current.data as Point2D,
            velocity,
            distance: Math.abs(current.data.x - previous.data.x) * screenWidth,
            direction,
          },
          handSide,
          metadata: { velocity, direction },
          timestamp: Date.now(),
        });
      } else if (
        verticalVelocity > 0.5 &&
        verticalVelocity > horizontalVelocity * 2
      ) {
        const direction = velocity.y > 0 ? "down" : "up";
        results.push({
          type: GestureClassification.SWIPE_VERTICAL,
          confidence: current.confidence,
          data: {
            startPosition: previous.data as Point2D,
            endPosition: current.data as Point2D,
            velocity,
            distance: Math.abs(current.data.y - previous.data.y) * screenHeight,
            direction,
          },
          handSide,
          metadata: { velocity, direction },
          timestamp: Date.now(),
        });
      }
    }

    return results;
  }

  private detectTwoHandPinchGesture(
    leftHand: HandResult,
    rightHand: HandResult,
  ): GestureResult | null {
    const leftPinch = this.detectPinchGesture(
      leftHand.landmarks,
      leftHand.confidence,
    );
    const rightPinch = this.detectPinchGesture(
      rightHand.landmarks,
      rightHand.confidence,
    );

    if (leftPinch && rightPinch) {
      const combinedConfidence =
        (leftPinch.confidence + rightPinch.confidence) / 2;
      const leftWrist = leftHand.landmarks[HandLandmark.WRIST];
      const rightWrist = rightHand.landmarks[HandLandmark.WRIST];

      return {
        type: GestureClassification.TWO_HAND_PINCH,
        confidence: combinedConfidence,
        data: {
          leftPinch: leftPinch.data,
          rightPinch: rightPinch.data,
          handDistance: CoordinateNormalizer.distance(leftWrist, rightWrist),
        },
        timestamp: Date.now(),
      };
    }

    return null;
  }

  private detectTwoHandRotateGesture(
    leftHand: HandResult,
    rightHand: HandResult,
    screenWidth: number,
    screenHeight: number,
  ): GestureResult | null {
    const leftWrist = leftHand.landmarks[HandLandmark.WRIST];
    const rightWrist = rightHand.landmarks[HandLandmark.WRIST];
    const centerPoint = CoordinateNormalizer.centerPoint(leftWrist, rightWrist);

    const leftAngle = CoordinateNormalizer.calculateRotationAngle(
      centerPoint,
      leftWrist,
    );
    const rightAngle = CoordinateNormalizer.calculateRotationAngle(
      centerPoint,
      rightWrist,
    );

    const angleDifference = Math.abs(leftAngle - rightAngle);
    const rotationAmount = Math.min(
      angleDifference,
      2 * Math.PI - angleDifference,
    );

    if (rotationAmount > 0.3) {
      // Minimum rotation threshold
      const clockwise = this.calculateRotationDirection(
        leftWrist,
        rightWrist,
        centerPoint,
      );

      return {
        type: GestureClassification.TWO_HAND_ROTATE,
        confidence: Math.min(leftHand.confidence, rightHand.confidence) * 0.8,
        data: {
          centerPoint,
          leftAngle,
          rightAngle,
          rotationAmount,
          clockwise,
        },
        metadata: {
          rotationAngle: rotationAmount,
          clockwise,
        },
        timestamp: Date.now(),
      };
    }

    return null;
  }

  private detectSpreadGesture(
    leftHand: HandResult,
    rightHand: HandResult,
    screenWidth: number,
    screenHeight: number,
  ): GestureResult | null {
    const leftWrist = leftHand.landmarks[HandLandmark.WRIST];
    const rightWrist = rightHand.landmarks[HandLandmark.WRIST];

    const handDistance = CoordinateNormalizer.normalizedDistance(
      leftWrist,
      rightWrist,
      screenWidth,
      screenHeight,
    );
    const spreadRatio = Math.max(0, Math.min(1, handDistance / 0.5)); // Normalize to 50% of screen

    if (spreadRatio > 0.2) {
      return {
        type: GestureClassification.SPREAD,
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

  private calculateRotationDirection(
    p1: Point2D,
    p2: Point2D,
    center: Point2D,
  ): boolean {
    // Calculate cross product to determine rotation direction
    const v1x = p1.x - center.x;
    const v1y = p1.y - center.y;
    const v2x = p2.x - center.x;
    const v2y = p2.y - center.y;

    return v1x * v2y - v1y * v2x > 0;
  }

  private updateGestureHistory(result: GestureResult): void {
    const history = this.gestureHistory.get(result.type);
    if (!history) return;

    history.results.push(result);

    // Remove old gestures outside time window
    const cutoffTime = Date.now() - history.timeWindow;
    history.results = history.results.filter((g) => g.timestamp > cutoffTime);

    // Keep only recent gestures
    if (history.results.length > history.maxSize) {
      history.results = history.results.slice(-history.maxSize);
    }
  }

  // Public methods for configuration and control
  updateGestureHistorySettings(maxSize: number, timeWindow: number): void {
    this.maxHistorySize = maxSize;
    this.timeWindow = timeWindow;

    this.gestureHistory.forEach((history) => {
      history.maxSize = maxSize;
      history.timeWindow = timeWindow;
    });
  }

  getGestureHistory(gestureType: GestureClassification): GestureResult[] {
    const history = this.gestureHistory.get(gestureType);
    return history ? [...history.results] : [];
  }

  clearGestureHistory(): void {
    this.gestureHistory.forEach((history) => {
      history.results = [];
    });
  }
}
