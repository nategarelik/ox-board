import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface DetectedHand {
  landmarks: HandLandmark[];
  handedness: 'Left' | 'Right';
  confidence: number;
}

export interface GestureResult {
  hands: DetectedHand[];
  timestamp: number;
}

export interface GestureDetectorConfig {
  modelAssetPath?: string;
  runningMode?: 'IMAGE' | 'VIDEO';
  numHands?: number;
  minHandDetectionConfidence?: number;
  minHandPresenceConfidence?: number;
  minTrackingConfidence?: number;
  delegate?: 'CPU' | 'GPU';
}

export class GestureDetector {
  private handLandmarker: HandLandmarker | null = null;
  private isInitialized = false;
  private isInitializing = false;
  private config: Required<GestureDetectorConfig>;

  constructor(config: GestureDetectorConfig = {}) {
    this.config = {
      modelAssetPath: '/models/hand_landmarker.task',
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: 0.5,
      minHandPresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
      delegate: 'GPU',
      ...config
    };
  }

  /**
   * Initialize the MediaPipe HandLandmarker
   */
  async initialize(): Promise<void> {
    if (this.isInitialized || this.isInitializing) {
      return;
    }

    this.isInitializing = true;

    try {
      // Initialize the MediaPipe FilesetResolver
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      // Create HandLandmarker instance
      this.handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: this.config.modelAssetPath,
          delegate: this.config.delegate
        },
        runningMode: this.config.runningMode,
        numHands: this.config.numHands,
        minHandDetectionConfidence: this.config.minHandDetectionConfidence,
        minHandPresenceConfidence: this.config.minHandPresenceConfidence,
        minTrackingConfidence: this.config.minTrackingConfidence
      });

      this.isInitialized = true;
      console.log('MediaPipe HandLandmarker initialized successfully');
    } catch (error) {
      console.error('Failed to initialize MediaPipe HandLandmarker:', error);
      throw new Error(`Failed to initialize gesture detector: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Detect hand landmarks from video frame
   */
  async detectFromVideo(videoElement: HTMLVideoElement, timestamp?: number): Promise<GestureResult> {
    if (!this.isInitialized || !this.handLandmarker) {
      throw new Error('GestureDetector not initialized. Call initialize() first.');
    }

    if (this.config.runningMode !== 'VIDEO') {
      throw new Error('Detector must be configured for VIDEO mode to detect from video');
    }

    try {
      const startTime = timestamp ?? performance.now();
      const results = this.handLandmarker.detectForVideo(videoElement, startTime);

      return this.processResults(results, startTime);
    } catch (error) {
      console.error('Error detecting gestures from video:', error);
      throw error;
    }
  }

  /**
   * Detect hand landmarks from image
   */
  async detectFromImage(imageElement: HTMLImageElement): Promise<GestureResult> {
    if (!this.isInitialized || !this.handLandmarker) {
      throw new Error('GestureDetector not initialized. Call initialize() first.');
    }

    if (this.config.runningMode !== 'IMAGE') {
      throw new Error('Detector must be configured for IMAGE mode to detect from image');
    }

    try {
      const timestamp = performance.now();
      const results = this.handLandmarker.detect(imageElement);

      return this.processResults(results, timestamp);
    } catch (error) {
      console.error('Error detecting gestures from image:', error);
      throw error;
    }
  }

  /**
   * Process MediaPipe results into our format
   */
  private processResults(results: any, timestamp: number): GestureResult {
    const hands: DetectedHand[] = [];

    if (results.landmarks && results.handednesses) {
      for (let i = 0; i < results.landmarks.length; i++) {
        const landmarks: HandLandmark[] = results.landmarks[i].map((landmark: any) => ({
          x: landmark.x,
          y: landmark.y,
          z: landmark.z
        }));

        const handedness = results.handednesses[i][0]?.displayName || 'Unknown';
        const confidence = results.handednesses[i][0]?.score || 0;

        hands.push({
          landmarks,
          handedness: handedness as 'Left' | 'Right',
          confidence
        });
      }
    }

    return {
      hands,
      timestamp
    };
  }

  /**
   * Update detector configuration
   */
  async updateConfig(newConfig: Partial<GestureDetectorConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };

    // Re-initialize if already initialized
    if (this.isInitialized) {
      this.isInitialized = false;
      await this.initialize();
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): GestureDetectorConfig {
    return { ...this.config };
  }

  /**
   * Check if detector is ready to use
   */
  isReady(): boolean {
    return this.isInitialized && this.handLandmarker !== null;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.handLandmarker) {
      this.handLandmarker.close();
      this.handLandmarker = null;
    }
    this.isInitialized = false;
    this.isInitializing = false;
  }

  /**
   * Static method to check MediaPipe support
   */
  static isSupported(): boolean {
    try {
      // Check for required APIs
      return !!(
        navigator.mediaDevices &&
        navigator.mediaDevices.getUserMedia &&
        window.WebAssembly &&
        window.SharedArrayBuffer
      );
    } catch (error) {
      return false;
    }
  }
}

// Gesture recognition utilities
export class GestureRecognizer {
  /**
   * Calculate distance between two landmarks
   */
  static getDistance(point1: HandLandmark, point2: HandLandmark): number {
    const dx = point1.x - point2.x;
    const dy = point1.y - point2.y;
    const dz = point1.z - point2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  /**
   * Check if finger is extended based on landmarks
   */
  static isFingerExtended(hand: DetectedHand, fingerIndex: number): boolean {
    const landmarks = hand.landmarks;
    if (!landmarks || landmarks.length < 21) return false;

    // MediaPipe hand landmark indices for fingertips and joints
    const fingerTips = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky
    const fingerJoints = [3, 6, 10, 14, 18]; // Joint before tip

    if (fingerIndex < 0 || fingerIndex >= fingerTips.length) return false;

    const tip = landmarks[fingerTips[fingerIndex]];
    const joint = landmarks[fingerJoints[fingerIndex]];
    const wrist = landmarks[0];

    // Calculate if finger is extended relative to wrist
    const tipDistance = this.getDistance(tip, wrist);
    const jointDistance = this.getDistance(joint, wrist);

    return tipDistance > jointDistance * 1.1; // 10% threshold
  }

  /**
   * Detect basic gestures
   */
  static detectGesture(hand: DetectedHand): string {
    if (!hand.landmarks || hand.landmarks.length < 21) {
      return 'unknown';
    }

    // Count extended fingers
    const extendedFingers = [];
    for (let i = 0; i < 5; i++) {
      if (this.isFingerExtended(hand, i)) {
        extendedFingers.push(i);
      }
    }

    // Basic gesture recognition
    switch (extendedFingers.length) {
      case 0:
        return 'fist';
      case 1:
        if (extendedFingers.includes(1)) return 'point'; // Index finger
        break;
      case 2:
        if (extendedFingers.includes(1) && extendedFingers.includes(2)) return 'peace'; // Index + Middle
        break;
      case 5:
        return 'open_hand';
    }

    return 'unknown';
  }
}