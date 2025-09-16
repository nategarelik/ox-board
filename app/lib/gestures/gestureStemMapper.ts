/**
 * Comprehensive gesture-to-stem mapping system for OX Board AI
 * Maps 15+ gestures to specific stem controls with configurable profiles
 */

import { Point2D } from '../gesture/smoothing';
import { HandResult, GestureResult, HandLandmark, CoordinateNormalizer, GestureConfidenceCalculator } from '../gesture/recognition';
import { StemType } from '../audio/demucsProcessor';

export interface GestureMapping {
  id: string;
  name: string;
  description: string;
  targetStem: StemType | 'original' | 'crossfader' | 'master';
  controlType: 'volume' | 'mute' | 'solo' | 'pan' | 'eq' | 'effect' | 'playback_rate' | 'crossfade';
  handRequirement: 'left' | 'right' | 'both' | 'any';
  gestureType: GestureType;
  params?: Record<string, any>;
}

export enum GestureType {
  // Basic hand shapes
  PEACE_SIGN = 'peace_sign',
  ROCK_SIGN = 'rock_sign',
  OK_SIGN = 'ok_sign',
  CALL_SIGN = 'call_sign',
  THUMBS_UP = 'thumbs_up',
  THUMBS_DOWN = 'thumbs_down',
  OPEN_PALM = 'open_palm',
  FIST = 'fist',
  POINTING = 'pointing',

  // Movement gestures
  SWIPE_LEFT = 'swipe_left',
  SWIPE_RIGHT = 'swipe_right',
  SWIPE_UP = 'swipe_up',
  SWIPE_DOWN = 'swipe_down',
  CIRCLE_CLOCKWISE = 'circle_clockwise',
  CIRCLE_COUNTER = 'circle_counter',

  // Two-hand gestures
  CLAP = 'clap',
  SPREAD_HANDS = 'spread_hands',
  CROSSFADER_HANDS = 'crossfader_hands',
  DUAL_CONTROL = 'dual_control',

  // Pinch and grab
  PINCH = 'pinch',
  GRAB = 'grab',
  TWIST = 'twist'
}

export interface GestureDetectionResult {
  gestureType: GestureType;
  confidence: number;
  value?: number;
  position?: Point2D;
  metadata?: Record<string, any>;
  timestamp: number;
}

export interface MappingProfile {
  id: string;
  name: string;
  description: string;
  mappings: GestureMapping[];
  isActive: boolean;
}

export enum ControlMode {
  ABSOLUTE = 'absolute',
  RELATIVE = 'relative'
}

export interface GestureControlState {
  isActive: boolean;
  currentValue: number;
  lastGesture?: GestureDetectionResult;
  mode: ControlMode;
  sensitivity: number;
  deadzone: number;
}

export interface FeedbackState {
  activeGestures: GestureDetectionResult[];
  activeMappings: GestureMapping[];
  stemIndicators: Record<StemType | 'original', boolean>;
  controlValues: Record<string, number>;
  confidence: number;
  latency: number;
}

export interface GestureStemMapperConfig {
  gestureConfidenceThreshold: number;
  latencyTarget: number;
  smoothingEnabled: boolean;
  feedbackEnabled: boolean;
  defaultControlMode: ControlMode;
  gestureSensitivity: number;
  deadzoneSensitivity: number;
}

const DEFAULT_CONFIG: GestureStemMapperConfig = {
  gestureConfidenceThreshold: 0.75,
  latencyTarget: 50, // ms
  smoothingEnabled: true,
  feedbackEnabled: true,
  defaultControlMode: ControlMode.ABSOLUTE,
  gestureSensitivity: 1.0,
  deadzoneSensitivity: 0.05
};

export class GestureStemMapper {
  private config: GestureStemMapperConfig;
  private profiles: Map<string, MappingProfile> = new Map();
  private activeProfile: string | null = null;
  private controlStates: Map<string, GestureControlState> = new Map();
  private feedbackState: FeedbackState;
  private gestureHistory: GestureDetectionResult[] = [];
  private lastProcessingTime: number = 0;
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: Partial<GestureStemMapperConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.feedbackState = this.initializeFeedbackState();
    this.initializeDefaultProfiles();
  }

  private initializeFeedbackState(): FeedbackState {
    return {
      activeGestures: [],
      activeMappings: [],
      stemIndicators: {
        drums: false,
        bass: false,
        melody: false,
        vocals: false,
        original: false
      },
      controlValues: {},
      confidence: 0,
      latency: 0
    };
  }

  private initializeDefaultProfiles(): void {
    // Default profile with basic stem controls
    const defaultMappings: GestureMapping[] = [
      // Individual stem controls
      {
        id: 'peace-drums',
        name: 'Peace → Drums',
        description: 'Peace sign controls drums volume',
        targetStem: 'drums',
        controlType: 'volume',
        handRequirement: 'any',
        gestureType: GestureType.PEACE_SIGN
      },
      {
        id: 'rock-bass',
        name: 'Rock → Bass',
        description: 'Rock sign controls bass volume',
        targetStem: 'bass',
        controlType: 'volume',
        handRequirement: 'any',
        gestureType: GestureType.ROCK_SIGN
      },
      {
        id: 'ok-melody',
        name: 'OK → Melody',
        description: 'OK sign controls melody volume',
        targetStem: 'melody',
        controlType: 'volume',
        handRequirement: 'any',
        gestureType: GestureType.OK_SIGN
      },
      {
        id: 'call-vocals',
        name: 'Call → Vocals',
        description: 'Call sign controls vocals volume',
        targetStem: 'vocals',
        controlType: 'volume',
        handRequirement: 'any',
        gestureType: GestureType.CALL_SIGN
      },

      // Mute/Solo controls
      {
        id: 'fist-mute',
        name: 'Fist → Mute',
        description: 'Fist gesture mutes active stem',
        targetStem: 'drums', // Will be dynamic based on context
        controlType: 'mute',
        handRequirement: 'any',
        gestureType: GestureType.FIST
      },
      {
        id: 'thumbsup-solo',
        name: 'Thumbs Up → Solo',
        description: 'Thumbs up solos active stem',
        targetStem: 'drums', // Will be dynamic based on context
        controlType: 'solo',
        handRequirement: 'any',
        gestureType: GestureType.THUMBS_UP
      },

      // Movement controls
      {
        id: 'swipe-crossfade',
        name: 'Swipe → Crossfade',
        description: 'Horizontal swipe controls crossfader',
        targetStem: 'crossfader',
        controlType: 'crossfade',
        handRequirement: 'both',
        gestureType: GestureType.CROSSFADER_HANDS
      },
      {
        id: 'circle-effect',
        name: 'Circle → Effect',
        description: 'Circular motion controls effect intensity',
        targetStem: 'master',
        controlType: 'effect',
        handRequirement: 'any',
        gestureType: GestureType.CIRCLE_CLOCKWISE
      },

      // Advanced combinations
      {
        id: 'pinch-eq-low',
        name: 'Pinch → EQ Low',
        description: 'Pinch controls low EQ for active stem',
        targetStem: 'drums', // Will be dynamic
        controlType: 'eq',
        handRequirement: 'any',
        gestureType: GestureType.PINCH,
        params: { eqBand: 'low' }
      },
      {
        id: 'grab-eq-mid',
        name: 'Grab → EQ Mid',
        description: 'Grab controls mid EQ for active stem',
        targetStem: 'bass', // Will be dynamic
        controlType: 'eq',
        handRequirement: 'any',
        gestureType: GestureType.GRAB,
        params: { eqBand: 'mid' }
      },
      {
        id: 'twist-eq-high',
        name: 'Twist → EQ High',
        description: 'Twist controls high EQ for active stem',
        targetStem: 'melody', // Will be dynamic
        controlType: 'eq',
        handRequirement: 'any',
        gestureType: GestureType.TWIST,
        params: { eqBand: 'high' }
      },

      // Pan controls
      {
        id: 'point-left-pan',
        name: 'Point Left → Pan',
        description: 'Pointing left pans stem to left',
        targetStem: 'vocals',
        controlType: 'pan',
        handRequirement: 'any',
        gestureType: GestureType.POINTING,
        params: { direction: 'left' }
      },

      // Playback rate controls
      {
        id: 'spread-hands-rate',
        name: 'Spread Hands → Rate',
        description: 'Hand spread controls playback rate',
        targetStem: 'original',
        controlType: 'playback_rate',
        handRequirement: 'both',
        gestureType: GestureType.SPREAD_HANDS
      },

      // Two-hand gestures for mixing
      {
        id: 'dual-volume',
        name: 'Dual Volume Control',
        description: 'Both hands control different stem volumes',
        targetStem: 'master',
        controlType: 'volume',
        handRequirement: 'both',
        gestureType: GestureType.DUAL_CONTROL
      },

      // Quick actions
      {
        id: 'clap-reset',
        name: 'Clap → Reset',
        description: 'Clap resets all stem controls',
        targetStem: 'master',
        controlType: 'effect',
        handRequirement: 'both',
        gestureType: GestureType.CLAP,
        params: { action: 'reset' }
      }
    ];

    const defaultProfile: MappingProfile = {
      id: 'default',
      name: 'Default Profile',
      description: 'Standard gesture mappings for stem control',
      mappings: defaultMappings,
      isActive: true
    };

    this.profiles.set('default', defaultProfile);
    this.activeProfile = 'default';
    this.initializeControlStates(defaultMappings);
  }

  private initializeControlStates(mappings: GestureMapping[]): void {
    mappings.forEach(mapping => {
      this.controlStates.set(mapping.id, {
        isActive: false,
        currentValue: 0,
        mode: this.config.defaultControlMode,
        sensitivity: this.config.gestureSensitivity,
        deadzone: this.config.deadzoneSensitivity
      });
    });
  }

  // Gesture detection methods
  detectGestures(leftHand: HandResult | null, rightHand: HandResult | null, screenWidth: number, screenHeight: number): GestureDetectionResult[] {
    const startTime = performance.now();
    const results: GestureDetectionResult[] = [];

    // Detect single-hand gestures
    if (leftHand) {
      results.push(...this.detectSingleHandGestures(leftHand, 'left', screenWidth, screenHeight));
    }
    if (rightHand) {
      results.push(...this.detectSingleHandGestures(rightHand, 'right', screenWidth, screenHeight));
    }

    // Detect two-hand gestures
    if (leftHand && rightHand) {
      results.push(...this.detectTwoHandGestures(leftHand, rightHand, screenWidth, screenHeight));
    }

    // Update gesture history
    this.updateGestureHistory(results);

    // Calculate latency
    const latency = performance.now() - startTime;
    this.feedbackState.latency = latency;

    // Filter by confidence
    const validResults = results.filter(r => r.confidence >= this.config.gestureConfidenceThreshold);

    // Update feedback state
    this.updateFeedbackState(validResults);

    return validResults;
  }

  private detectSingleHandGestures(hand: HandResult, handType: 'left' | 'right', screenWidth: number, screenHeight: number): GestureDetectionResult[] {
    const results: GestureDetectionResult[] = [];
    const landmarks = hand.landmarks;

    if (landmarks.length < 21) return results;

    // Peace sign detection (index and middle fingers extended)
    const peaceResult = this.detectPeaceSign(landmarks, hand.confidence);
    if (peaceResult) {
      results.push({
        gestureType: GestureType.PEACE_SIGN,
        confidence: peaceResult.confidence,
        value: peaceResult.value,
        position: landmarks[HandLandmark.WRIST],
        timestamp: Date.now()
      });
    }

    // Rock sign detection (index and pinky extended)
    const rockResult = this.detectRockSign(landmarks, hand.confidence);
    if (rockResult) {
      results.push({
        gestureType: GestureType.ROCK_SIGN,
        confidence: rockResult.confidence,
        value: rockResult.value,
        position: landmarks[HandLandmark.WRIST],
        timestamp: Date.now()
      });
    }

    // OK sign detection (thumb and index circle)
    const okResult = this.detectOKSign(landmarks, hand.confidence);
    if (okResult) {
      results.push({
        gestureType: GestureType.OK_SIGN,
        confidence: okResult.confidence,
        value: okResult.value,
        position: landmarks[HandLandmark.WRIST],
        timestamp: Date.now()
      });
    }

    // Call sign detection (thumb and pinky extended)
    const callResult = this.detectCallSign(landmarks, hand.confidence);
    if (callResult) {
      results.push({
        gestureType: GestureType.CALL_SIGN,
        confidence: callResult.confidence,
        value: callResult.value,
        position: landmarks[HandLandmark.WRIST],
        timestamp: Date.now()
      });
    }

    // Thumbs up detection
    const thumbsUpResult = this.detectThumbsUp(landmarks, hand.confidence);
    if (thumbsUpResult) {
      results.push({
        gestureType: GestureType.THUMBS_UP,
        confidence: thumbsUpResult.confidence,
        value: thumbsUpResult.value,
        position: landmarks[HandLandmark.WRIST],
        timestamp: Date.now()
      });
    }

    // Fist detection
    const fistResult = this.detectFist(landmarks, hand.confidence);
    if (fistResult) {
      results.push({
        gestureType: GestureType.FIST,
        confidence: fistResult.confidence,
        value: 1.0,
        position: landmarks[HandLandmark.WRIST],
        timestamp: Date.now()
      });
    }

    // Pinch detection
    const pinchResult = this.detectPinch(landmarks, hand.confidence);
    if (pinchResult) {
      results.push({
        gestureType: GestureType.PINCH,
        confidence: pinchResult.confidence,
        value: pinchResult.value,
        position: landmarks[HandLandmark.WRIST],
        timestamp: Date.now()
      });
    }

    // Open palm detection
    const palmResult = this.detectOpenPalm(landmarks, hand.confidence);
    if (palmResult) {
      results.push({
        gestureType: GestureType.OPEN_PALM,
        confidence: palmResult.confidence,
        value: 1.0,
        position: landmarks[HandLandmark.WRIST],
        timestamp: Date.now()
      });
    }

    // Movement gestures (require gesture history)
    const movementResults = this.detectMovementGestures(landmarks, handType);
    results.push(...movementResults);

    return results;
  }

  private detectTwoHandGestures(leftHand: HandResult, rightHand: HandResult, screenWidth: number, screenHeight: number): GestureDetectionResult[] {
    const results: GestureDetectionResult[] = [];

    // Crossfader gesture
    const crossfaderResult = this.detectCrossfaderGesture(leftHand, rightHand, screenWidth, screenHeight);
    if (crossfaderResult) {
      results.push(crossfaderResult);
    }

    // Spread hands gesture
    const spreadResult = this.detectSpreadHands(leftHand, rightHand, screenWidth, screenHeight);
    if (spreadResult) {
      results.push(spreadResult);
    }

    // Clap gesture
    const clapResult = this.detectClap(leftHand, rightHand);
    if (clapResult) {
      results.push(clapResult);
    }

    // Dual control gesture
    const dualResult = this.detectDualControl(leftHand, rightHand);
    if (dualResult) {
      results.push(dualResult);
    }

    return results;
  }

  // Individual gesture detection implementations
  private detectPeaceSign(landmarks: Point2D[], baseConfidence: number): { confidence: number; value: number } | null {
    const indexTip = landmarks[HandLandmark.INDEX_FINGER_TIP];
    const middleTip = landmarks[HandLandmark.MIDDLE_FINGER_TIP];
    const ringTip = landmarks[HandLandmark.RING_FINGER_TIP];
    const pinkyTip = landmarks[HandLandmark.PINKY_TIP];
    const thumbTip = landmarks[HandLandmark.THUMB_TIP];
    const wrist = landmarks[HandLandmark.WRIST];

    // Check if index and middle are extended
    const indexExtended = indexTip.y < landmarks[HandLandmark.INDEX_FINGER_PIP].y;
    const middleExtended = middleTip.y < landmarks[HandLandmark.MIDDLE_FINGER_PIP].y;

    // Check if ring, pinky, and thumb are retracted
    const ringRetracted = ringTip.y > landmarks[HandLandmark.RING_FINGER_PIP].y;
    const pinkyRetracted = pinkyTip.y > landmarks[HandLandmark.PINKY_PIP].y;
    const thumbRetracted = thumbTip.y > landmarks[HandLandmark.THUMB_IP].y;

    if (indexExtended && middleExtended && ringRetracted && pinkyRetracted && thumbRetracted) {
      // Calculate control value based on hand height
      const handHeight = Math.abs(wrist.y - Math.min(indexTip.y, middleTip.y));
      const value = Math.max(0, Math.min(1, handHeight * 2));

      return {
        confidence: baseConfidence * 0.9,
        value
      };
    }

    return null;
  }

  private detectRockSign(landmarks: Point2D[], baseConfidence: number): { confidence: number; value: number } | null {
    const indexTip = landmarks[HandLandmark.INDEX_FINGER_TIP];
    const middleTip = landmarks[HandLandmark.MIDDLE_FINGER_TIP];
    const ringTip = landmarks[HandLandmark.RING_FINGER_TIP];
    const pinkyTip = landmarks[HandLandmark.PINKY_TIP];
    const thumbTip = landmarks[HandLandmark.THUMB_TIP];
    const wrist = landmarks[HandLandmark.WRIST];

    // Check if index and pinky are extended
    const indexExtended = indexTip.y < landmarks[HandLandmark.INDEX_FINGER_PIP].y;
    const pinkyExtended = pinkyTip.y < landmarks[HandLandmark.PINKY_PIP].y;

    // Check if middle, ring, and thumb are retracted
    const middleRetracted = middleTip.y > landmarks[HandLandmark.MIDDLE_FINGER_PIP].y;
    const ringRetracted = ringTip.y > landmarks[HandLandmark.RING_FINGER_PIP].y;
    const thumbRetracted = thumbTip.y > landmarks[HandLandmark.THUMB_IP].y;

    if (indexExtended && pinkyExtended && middleRetracted && ringRetracted && thumbRetracted) {
      // Calculate control value based on hand height
      const handHeight = Math.abs(wrist.y - Math.min(indexTip.y, pinkyTip.y));
      const value = Math.max(0, Math.min(1, handHeight * 2));

      return {
        confidence: baseConfidence * 0.85,
        value
      };
    }

    return null;
  }

  private detectOKSign(landmarks: Point2D[], baseConfidence: number): { confidence: number; value: number } | null {
    const thumbTip = landmarks[HandLandmark.THUMB_TIP];
    const indexTip = landmarks[HandLandmark.INDEX_FINGER_TIP];
    const middleTip = landmarks[HandLandmark.MIDDLE_FINGER_TIP];
    const ringTip = landmarks[HandLandmark.RING_FINGER_TIP];
    const pinkyTip = landmarks[HandLandmark.PINKY_TIP];
    const wrist = landmarks[HandLandmark.WRIST];

    // Check thumb-index circle
    const thumbIndexDistance = CoordinateNormalizer.distance(thumbTip, indexTip);
    const isCircle = thumbIndexDistance < 0.05;

    // Check if middle, ring, pinky are extended
    const middleExtended = middleTip.y < landmarks[HandLandmark.MIDDLE_FINGER_PIP].y;
    const ringExtended = ringTip.y < landmarks[HandLandmark.RING_FINGER_PIP].y;
    const pinkyExtended = pinkyTip.y < landmarks[HandLandmark.PINKY_PIP].y;

    if (isCircle && middleExtended && ringExtended && pinkyExtended) {
      // Calculate control value based on circle size
      const circleSize = Math.abs(thumbTip.x - indexTip.x) + Math.abs(thumbTip.y - indexTip.y);
      const value = Math.max(0, Math.min(1, circleSize * 10));

      return {
        confidence: baseConfidence * 0.8,
        value
      };
    }

    return null;
  }

  private detectCallSign(landmarks: Point2D[], baseConfidence: number): { confidence: number; value: number } | null {
    const thumbTip = landmarks[HandLandmark.THUMB_TIP];
    const indexTip = landmarks[HandLandmark.INDEX_FINGER_TIP];
    const middleTip = landmarks[HandLandmark.MIDDLE_FINGER_TIP];
    const ringTip = landmarks[HandLandmark.RING_FINGER_TIP];
    const pinkyTip = landmarks[HandLandmark.PINKY_TIP];
    const wrist = landmarks[HandLandmark.WRIST];

    // Check if thumb and pinky are extended
    const thumbExtended = thumbTip.y < landmarks[HandLandmark.THUMB_IP].y;
    const pinkyExtended = pinkyTip.y < landmarks[HandLandmark.PINKY_PIP].y;

    // Check if index, middle, ring are retracted
    const indexRetracted = indexTip.y > landmarks[HandLandmark.INDEX_FINGER_PIP].y;
    const middleRetracted = middleTip.y > landmarks[HandLandmark.MIDDLE_FINGER_PIP].y;
    const ringRetracted = ringTip.y > landmarks[HandLandmark.RING_FINGER_PIP].y;

    if (thumbExtended && pinkyExtended && indexRetracted && middleRetracted && ringRetracted) {
      // Calculate control value based on thumb-pinky distance
      const spanDistance = CoordinateNormalizer.distance(thumbTip, pinkyTip);
      const value = Math.max(0, Math.min(1, spanDistance * 3));

      return {
        confidence: baseConfidence * 0.8,
        value
      };
    }

    return null;
  }

  private detectThumbsUp(landmarks: Point2D[], baseConfidence: number): { confidence: number; value: number } | null {
    const thumbTip = landmarks[HandLandmark.THUMB_TIP];
    const indexTip = landmarks[HandLandmark.INDEX_FINGER_TIP];
    const middleTip = landmarks[HandLandmark.MIDDLE_FINGER_TIP];
    const ringTip = landmarks[HandLandmark.RING_FINGER_TIP];
    const pinkyTip = landmarks[HandLandmark.PINKY_TIP];

    // Check if thumb is extended upward
    const thumbExtended = thumbTip.y < landmarks[HandLandmark.THUMB_IP].y;

    // Check if other fingers are retracted
    const fingersRetracted =
      indexTip.y > landmarks[HandLandmark.INDEX_FINGER_PIP].y &&
      middleTip.y > landmarks[HandLandmark.MIDDLE_FINGER_PIP].y &&
      ringTip.y > landmarks[HandLandmark.RING_FINGER_PIP].y &&
      pinkyTip.y > landmarks[HandLandmark.PINKY_PIP].y;

    if (thumbExtended && fingersRetracted) {
      return {
        confidence: baseConfidence * 0.85,
        value: 1.0
      };
    }

    return null;
  }

  private detectFist(landmarks: Point2D[], baseConfidence: number): { confidence: number; value: number } | null {
    const wrist = landmarks[HandLandmark.WRIST];
    const fingerTips = [
      landmarks[HandLandmark.THUMB_TIP],
      landmarks[HandLandmark.INDEX_FINGER_TIP],
      landmarks[HandLandmark.MIDDLE_FINGER_TIP],
      landmarks[HandLandmark.RING_FINGER_TIP],
      landmarks[HandLandmark.PINKY_TIP]
    ];

    // Check if all fingers are close to wrist (fist is closed)
    const averageDistance = fingerTips.reduce((sum, tip) =>
      sum + CoordinateNormalizer.distance(wrist, tip), 0
    ) / fingerTips.length;

    if (averageDistance < 0.1) {
      return {
        confidence: baseConfidence * 0.9,
        value: 1.0
      };
    }

    return null;
  }

  private detectPinch(landmarks: Point2D[], baseConfidence: number): { confidence: number; value: number } | null {
    const thumbTip = landmarks[HandLandmark.THUMB_TIP];
    const indexTip = landmarks[HandLandmark.INDEX_FINGER_TIP];

    const pinchDistance = CoordinateNormalizer.distance(thumbTip, indexTip);

    if (pinchDistance < 0.08) {
      // Value inversely related to distance (closer = higher value)
      const value = Math.max(0, Math.min(1, (0.08 - pinchDistance) / 0.08));

      return {
        confidence: baseConfidence * 0.8,
        value
      };
    }

    return null;
  }

  private detectOpenPalm(landmarks: Point2D[], baseConfidence: number): { confidence: number; value: number } | null {
    const fingerTips = [
      landmarks[HandLandmark.THUMB_TIP],
      landmarks[HandLandmark.INDEX_FINGER_TIP],
      landmarks[HandLandmark.MIDDLE_FINGER_TIP],
      landmarks[HandLandmark.RING_FINGER_TIP],
      landmarks[HandLandmark.PINKY_TIP]
    ];

    const fingerPips = [
      landmarks[HandLandmark.THUMB_IP],
      landmarks[HandLandmark.INDEX_FINGER_PIP],
      landmarks[HandLandmark.MIDDLE_FINGER_PIP],
      landmarks[HandLandmark.RING_FINGER_PIP],
      landmarks[HandLandmark.PINKY_PIP]
    ];

    // Check if all fingers are extended
    let extendedCount = 0;
    for (let i = 0; i < fingerTips.length; i++) {
      if (fingerTips[i].y < fingerPips[i].y) {
        extendedCount++;
      }
    }

    if (extendedCount >= 4) {
      return {
        confidence: baseConfidence * 0.75,
        value: extendedCount / 5
      };
    }

    return null;
  }

  private detectMovementGestures(landmarks: Point2D[], handType: 'left' | 'right'): GestureDetectionResult[] {
    // Implementation for movement detection would require gesture history
    // For now, return empty array - this would be expanded with velocity tracking
    return [];
  }

  private detectCrossfaderGesture(leftHand: HandResult, rightHand: HandResult, screenWidth: number, screenHeight: number): GestureDetectionResult | null {
    const leftWrist = leftHand.landmarks[HandLandmark.WRIST];
    const rightWrist = rightHand.landmarks[HandLandmark.WRIST];

    const handDistance = CoordinateNormalizer.normalizedDistance(
      leftWrist, rightWrist, screenWidth, screenHeight
    );

    // Check if hands are at appropriate distance for crossfading
    if (handDistance > 0.1 && handDistance < 0.7) {
      const centerPoint = CoordinateNormalizer.centerPoint(leftWrist, rightWrist);
      const crossfaderValue = Math.max(0, Math.min(1, centerPoint.x));

      const confidence = GestureConfidenceCalculator.twoHandGestureConfidence(
        leftHand, rightHand, { distanceOptimal: 1.1 }
      );

      return {
        gestureType: GestureType.CROSSFADER_HANDS,
        confidence,
        value: crossfaderValue,
        position: centerPoint,
        metadata: { handDistance },
        timestamp: Date.now()
      };
    }

    return null;
  }

  private detectSpreadHands(leftHand: HandResult, rightHand: HandResult, screenWidth: number, screenHeight: number): GestureDetectionResult | null {
    const leftWrist = leftHand.landmarks[HandLandmark.WRIST];
    const rightWrist = rightHand.landmarks[HandLandmark.WRIST];

    const handDistance = CoordinateNormalizer.normalizedDistance(
      leftWrist, rightWrist, screenWidth, screenHeight
    );

    // Large hand spread indicates rate control
    if (handDistance > 0.3) {
      const spreadValue = Math.max(0, Math.min(1, (handDistance - 0.3) / 0.4));

      return {
        gestureType: GestureType.SPREAD_HANDS,
        confidence: Math.min(leftHand.confidence, rightHand.confidence) * 0.8,
        value: spreadValue,
        position: CoordinateNormalizer.centerPoint(leftWrist, rightWrist),
        timestamp: Date.now()
      };
    }

    return null;
  }

  private detectClap(leftHand: HandResult, rightHand: HandResult): GestureDetectionResult | null {
    const leftPalm = leftHand.landmarks[HandLandmark.MIDDLE_FINGER_MCP];
    const rightPalm = rightHand.landmarks[HandLandmark.MIDDLE_FINGER_MCP];

    const palmDistance = CoordinateNormalizer.distance(leftPalm, rightPalm);

    // Very close palms indicate clap
    if (palmDistance < 0.05) {
      return {
        gestureType: GestureType.CLAP,
        confidence: Math.min(leftHand.confidence, rightHand.confidence) * 0.9,
        value: 1.0,
        position: CoordinateNormalizer.centerPoint(leftPalm, rightPalm),
        timestamp: Date.now()
      };
    }

    return null;
  }

  private detectDualControl(leftHand: HandResult, rightHand: HandResult): GestureDetectionResult | null {
    // Both hands in control position (open palms)
    const leftPalm = this.detectOpenPalm(leftHand.landmarks, leftHand.confidence);
    const rightPalm = this.detectOpenPalm(rightHand.landmarks, rightHand.confidence);

    if (leftPalm && rightPalm) {
      const leftWrist = leftHand.landmarks[HandLandmark.WRIST];
      const rightWrist = rightHand.landmarks[HandLandmark.WRIST];

      return {
        gestureType: GestureType.DUAL_CONTROL,
        confidence: Math.min(leftPalm.confidence, rightPalm.confidence),
        value: (leftWrist.y + rightWrist.y) / 2, // Average height
        position: CoordinateNormalizer.centerPoint(leftWrist, rightWrist),
        metadata: {
          leftValue: leftWrist.y,
          rightValue: rightWrist.y
        },
        timestamp: Date.now()
      };
    }

    return null;
  }

  // Mapping and control methods
  processGestures(gestures: GestureDetectionResult[], channel: number = 0): Array<{
    mapping: GestureMapping;
    value: number;
    controlType: string;
    stemType: StemType | 'original' | 'crossfader' | 'master';
  }> {
    if (!this.activeProfile) return [];

    const profile = this.profiles.get(this.activeProfile);
    if (!profile) return [];

    const results: Array<{
      mapping: GestureMapping;
      value: number;
      controlType: string;
      stemType: StemType | 'original' | 'crossfader' | 'master';
    }> = [];

    gestures.forEach(gesture => {
      const matchingMappings = profile.mappings.filter(mapping =>
        mapping.gestureType === gesture.gestureType
      );

      matchingMappings.forEach(mapping => {
        const controlState = this.controlStates.get(mapping.id);
        if (!controlState) return;

        let finalValue = gesture.value || 0;

        // Apply control mode processing
        if (controlState.mode === ControlMode.RELATIVE && controlState.lastGesture) {
          const delta = finalValue - (controlState.lastGesture.value || 0);
          finalValue = Math.max(0, Math.min(1, controlState.currentValue + delta * controlState.sensitivity));
        }

        // Apply deadzone
        if (Math.abs(finalValue - controlState.currentValue) < controlState.deadzone) {
          return;
        }

        // Update control state
        controlState.currentValue = finalValue;
        controlState.lastGesture = gesture;
        controlState.isActive = true;

        results.push({
          mapping,
          value: finalValue,
          controlType: mapping.controlType,
          stemType: mapping.targetStem
        });

        // Emit control event
        this.emit('gestureControl', {
          channel,
          mapping,
          value: finalValue,
          gesture
        });
      });
    });

    return results;
  }

  // Profile management
  addProfile(profile: MappingProfile): void {
    this.profiles.set(profile.id, profile);
    this.initializeControlStates(profile.mappings);
  }

  setActiveProfile(profileId: string): boolean {
    if (this.profiles.has(profileId)) {
      this.activeProfile = profileId;
      const profile = this.profiles.get(profileId)!;
      this.initializeControlStates(profile.mappings);
      this.emit('profileChanged', { profileId, profile });
      return true;
    }
    return false;
  }

  getActiveProfile(): MappingProfile | null {
    return this.activeProfile ? this.profiles.get(this.activeProfile) || null : null;
  }

  getAllProfiles(): MappingProfile[] {
    return Array.from(this.profiles.values());
  }

  // Configuration methods
  setControlMode(mappingId: string, mode: ControlMode): void {
    const controlState = this.controlStates.get(mappingId);
    if (controlState) {
      controlState.mode = mode;
      this.emit('controlModeChanged', { mappingId, mode });
    }
  }

  setSensitivity(mappingId: string, sensitivity: number): void {
    const controlState = this.controlStates.get(mappingId);
    if (controlState) {
      controlState.sensitivity = Math.max(0.1, Math.min(2.0, sensitivity));
    }
  }

  setDeadzone(mappingId: string, deadzone: number): void {
    const controlState = this.controlStates.get(mappingId);
    if (controlState) {
      controlState.deadzone = Math.max(0, Math.min(0.2, deadzone));
    }
  }

  // Feedback and state methods
  getFeedbackState(): FeedbackState {
    return { ...this.feedbackState };
  }

  private updateFeedbackState(gestures: GestureDetectionResult[]): void {
    this.feedbackState.activeGestures = gestures;
    this.feedbackState.confidence = gestures.length > 0 ?
      gestures.reduce((sum, g) => sum + g.confidence, 0) / gestures.length : 0;

    // Update active mappings based on gestures
    if (this.activeProfile) {
      const profile = this.profiles.get(this.activeProfile)!;
      this.feedbackState.activeMappings = profile.mappings.filter(mapping =>
        gestures.some(g => g.gestureType === mapping.gestureType)
      );

      // Update stem indicators
      Object.keys(this.feedbackState.stemIndicators).forEach(stem => {
        this.feedbackState.stemIndicators[stem as StemType | 'original'] =
          this.feedbackState.activeMappings.some(m => m.targetStem === stem);
      });
    }

    // Emit feedback update
    this.emit('feedbackUpdate', this.feedbackState);
  }

  private updateGestureHistory(gestures: GestureDetectionResult[]): void {
    this.gestureHistory.push(...gestures);

    // Keep only recent gestures (last 2 seconds)
    const cutoffTime = Date.now() - 2000;
    this.gestureHistory = this.gestureHistory.filter(g => g.timestamp > cutoffTime);
  }

  getLatency(): number {
    return this.feedbackState.latency;
  }

  // Event handling
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in gesture mapper event listener for ${event}:`, error);
        }
      });
    }
  }

  // Cleanup
  dispose(): void {
    this.profiles.clear();
    this.controlStates.clear();
    this.gestureHistory = [];
    this.eventListeners.clear();
    this.activeProfile = null;
  }
}

// Export default mappings for easy configuration
export const DEFAULT_GESTURE_MAPPINGS = {
  PEACE_TO_DRUMS: 'peace-drums',
  ROCK_TO_BASS: 'rock-bass',
  OK_TO_MELODY: 'ok-melody',
  CALL_TO_VOCALS: 'call-vocals',
  FIST_MUTE: 'fist-mute',
  THUMBS_UP_SOLO: 'thumbsup-solo',
  CROSSFADER_HANDS: 'swipe-crossfade',
  DUAL_VOLUME: 'dual-volume'
};