import { useRef, useCallback, useState, useEffect } from "react";
import {
  HandLandmarkSmoother,
  Point2D,
  KalmanConfig,
  GESTURE_SMOOTHING_CONFIG,
  AdvancedGestureSmoother2D,
  PERFORMANCE_GESTURE_SMOOTHING_CONFIG,
} from "../lib/gesture/smoothing";
import {
  AdvancedGestureRecognizer,
  GestureResult,
  HandResult,
  GestureClassification,
  GestureConfidenceCalculator,
  HandLandmark,
} from "../lib/gesture/recognition";

export interface CameraDevice {
  deviceId: string;
  label: string;
  capabilities: MediaTrackCapabilities;
  constraints: MediaTrackConstraints;
}

export interface CameraConfig {
  targetFPS: number;
  targetWidth: number;
  targetHeight: number;
  facingMode?: ConstrainDOMString;
  deviceId?: string;
}

export interface PermissionStateValue {
  camera: string | null;
  microphone: string | null;
}

export interface MediaDevicesState {
  devices: CameraDevice[];
  selectedDevice: CameraDevice | null;
  permissionState: PermissionStateValue;
  isLoading: boolean;
  error: string | null;
}

export interface GestureData {
  leftHand: Point2D[] | null;
  rightHand: Point2D[] | null;
  timestamp: number;
  confidence: number;
  gestures?: GestureResult[];
  smoothedLandmarks?: {
    leftHand?: Point2D[];
    rightHand?: Point2D[];
  };
  predictions?: {
    leftHand?: Point2D[];
    rightHand?: Point2D[];
  };
}

export interface GestureControl {
  type:
    | "volume"
    | "crossfader"
    | "eq"
    | "effect"
    | "stem_volume"
    | "mute"
    | "solo"
    | "pan"
    | "playback_rate";
  value: number;
  hand: "left" | "right";
  gesture: string;
  stemType?: string;
  metadata?: Record<string, any>;
}

export interface GestureCalibrationData {
  gestureType: GestureClassification;
  samples: Array<{
    landmarks: Point2D[];
    confidence: number;
    timestamp: number;
  }>;
  isComplete: boolean;
  accuracy: number;
}

export interface GesturePerformanceMetrics {
  averageLatency: number;
  frameRate: number;
  gestureAccuracy: number;
  processingTime: number;
  memoryUsage: number;
  lastUpdated: number;
}

export interface UseGesturesConfig {
  smoothingConfig?: Partial<KalmanConfig>;
  minConfidence?: number;
  gestureThreshold?: number;
  updateInterval?: number;
  enableCalibration?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableGestureRecording?: boolean;
  advancedSmoothingEnabled?: boolean;
  gesturePredictionEnabled?: boolean;
  calibrationGestures?: GestureClassification[];
  performanceSampleSize?: number;
}

const LANDMARK_IDS = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_TIP: 8,
  MIDDLE_TIP: 12,
  RING_TIP: 16,
  PINKY_TIP: 20,
  INDEX_MCP: 5,
  MIDDLE_MCP: 9,
  RING_MCP: 13,
  PINKY_MCP: 17,
};

export function useGestures(
  config: UseGesturesConfig & { cameraConfig?: CameraConfig } = {},
) {
  const {
    smoothingConfig = GESTURE_SMOOTHING_CONFIG,
    minConfidence = 0.7,
    gestureThreshold = 0.1,
    updateInterval = 16, // ~60fps
    enableCalibration = false,
    enablePerformanceMonitoring = true,
    enableGestureRecording = false,
    advancedSmoothingEnabled = true,
    gesturePredictionEnabled = true,
    calibrationGestures = [
      GestureClassification.PINCH,
      GestureClassification.FIST,
      GestureClassification.PALM_OPEN,
      GestureClassification.PEACE_SIGN,
    ],
    performanceSampleSize = 60,
    cameraConfig = {
      targetFPS: 60,
      targetWidth: 640,
      targetHeight: 480,
    },
  } = config;

  const [gestureData, setGestureData] = useState<GestureData | null>(null);
  const [controls, setControls] = useState<GestureControl[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [calibrationData, setCalibrationData] = useState<
    Map<GestureClassification, GestureCalibrationData>
  >(new Map());
  const [performanceMetrics, setPerformanceMetrics] =
    useState<GesturePerformanceMetrics>({
      averageLatency: 0,
      frameRate: 0,
      gestureAccuracy: 0,
      processingTime: 0,
      memoryUsage: 0,
      lastUpdated: 0,
    });
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [recordedGestures, setRecordedGestures] = useState<GestureResult[]>([]);
  const [mediaDevices, setMediaDevices] = useState<MediaDevicesState>({
    devices: [],
    selectedDevice: null,
    permissionState: {
      camera: null,
      microphone: null,
    },
    isLoading: false,
    error: null,
  });

  const leftHandSmoother = useRef(new HandLandmarkSmoother(smoothingConfig));
  const rightHandSmoother = useRef(new HandLandmarkSmoother(smoothingConfig));
  const advancedGestureRecognizer = useRef(new AdvancedGestureRecognizer());
  const leftHandAdvancedSmoother = useRef<AdvancedGestureSmoother2D | null>(
    null,
  );
  const rightHandAdvancedSmoother = useRef<AdvancedGestureSmoother2D | null>(
    null,
  );
  const lastUpdateTime = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const performanceSamples = useRef<
    Array<{ timestamp: number; processingTime: number; frameTime: number }>
  >([]);
  const calibrationSamples = useRef<
    Map<
      GestureClassification,
      Array<{ landmarks: Point2D[]; confidence: number; timestamp: number }>
    >
  >(new Map());

  // MediaDevices API Integration
  const checkPermissionState = useCallback(
    async (permission: PermissionName) => {
      try {
        if ("permissions" in navigator) {
          const permissionStatus = await navigator.permissions.query({
            name: permission,
          });
          return permissionStatus.state;
        }
        return null;
      } catch (error) {
        console.warn(`Permission check failed for ${permission}:`, error);
        return null;
      }
    },
    [],
  );

  const enumerateDevices = useCallback(async (): Promise<CameraDevice[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras: CameraDevice[] = [];

      for (const device of devices) {
        if (device.kind === "videoinput") {
          try {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: device.deviceId },
            });

            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            const constraints = track.getConstraints();

            cameras.push({
              deviceId: device.deviceId,
              label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
              capabilities,
              constraints,
            });

            // Clean up the test stream
            stream.getTracks().forEach((track) => track.stop());
          } catch (error) {
            console.warn(
              `Failed to get capabilities for device ${device.deviceId}:`,
              error,
            );
          }
        }
      }

      return cameras;
    } catch (error) {
      console.error("Failed to enumerate devices:", error);
      setMediaDevices((prev) => ({
        ...prev,
        error: "Failed to access camera devices",
      }));
      return [];
    }
  }, []);

  const negotiateConstraints = useCallback(
    async (deviceId?: string): Promise<MediaTrackConstraints> => {
      const constraints: MediaTrackConstraints = {
        width: { ideal: cameraConfig.targetWidth },
        height: { ideal: cameraConfig.targetHeight },
        frameRate: { ideal: cameraConfig.targetFPS, min: 30 },
        facingMode: cameraConfig.facingMode || "user",
      };

      if (deviceId) {
        constraints.deviceId = deviceId;
      }

      try {
        // Test the constraints to see what's actually supported
        const stream = await navigator.mediaDevices.getUserMedia({
          video: constraints,
        });
        const track = stream.getVideoTracks()[0];

        // Get the actual settings that were applied
        const actualSettings = track.getSettings();
        stream.getTracks().forEach((t) => t.stop());

        return {
          width: actualSettings.width,
          height: actualSettings.height,
          frameRate: actualSettings.frameRate,
          facingMode: actualSettings.facingMode,
          deviceId: actualSettings.deviceId,
        };
      } catch (error) {
        console.warn("Constraint negotiation failed, using fallback:", error);
        // Return basic constraints as fallback
        return {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
          facingMode: "user",
        };
      }
    },
    [cameraConfig],
  );

  const requestCameraAccess = useCallback(
    async (deviceId?: string): Promise<MediaStream | null> => {
      try {
        setMediaDevices((prev) => ({ ...prev, isLoading: true, error: null }));

        const constraints = await negotiateConstraints(deviceId);

        const stream = await navigator.mediaDevices.getUserMedia({
          video: constraints,
          audio: false, // We don't need audio for gesture recognition
        });

        streamRef.current = stream;

        // Update permission states
        const [cameraState] = await Promise.all([
          checkPermissionState("camera"),
        ]);

        setMediaDevices((prev) => ({
          ...prev,
          permissionState: {
            ...prev.permissionState,
            camera: cameraState,
          },
          isLoading: false,
        }));

        return stream;
      } catch (error: any) {
        console.error("Failed to request camera access:", error);

        let errorMessage = "Failed to access camera";
        if (error.name === "NotAllowedError") {
          errorMessage =
            "Camera access denied. Please allow camera permissions.";
        } else if (error.name === "NotFoundError") {
          errorMessage = "No camera found on this device.";
        } else if (error.name === "NotReadableError") {
          errorMessage = "Camera is already in use by another application.";
        } else if (error.name === "OverconstrainedError") {
          errorMessage = "Camera does not support the requested settings.";
        }

        setMediaDevices((prev) => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));

        return null;
      }
    },
    [checkPermissionState, negotiateConstraints],
  );

  const selectCameraDevice = useCallback(
    async (deviceId: string) => {
      try {
        setMediaDevices((prev) => ({ ...prev, isLoading: true }));

        // Stop current stream if exists
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }

        const devices = await enumerateDevices();
        const selectedDevice = devices.find(
          (device) => device.deviceId === deviceId,
        );

        if (!selectedDevice) {
          throw new Error("Device not found");
        }

        const stream = await requestCameraAccess(deviceId);

        setMediaDevices((prev) => ({
          ...prev,
          devices,
          selectedDevice,
          isLoading: false,
        }));

        return stream;
      } catch (error) {
        console.error("Failed to select camera device:", error);
        setMediaDevices((prev) => ({
          ...prev,
          error: `Failed to select camera: ${error instanceof Error ? error.message : "Unknown error"}`,
          isLoading: false,
        }));
        return null;
      }
    },
    [enumerateDevices, requestCameraAccess],
  );

  const initializeCamera = useCallback(async () => {
    try {
      setMediaDevices((prev) => ({ ...prev, isLoading: true }));

      const devices = await enumerateDevices();

      setMediaDevices((prev) => ({
        ...prev,
        devices,
      }));

      // Try to get camera access
      await requestCameraAccess();
    } catch (error) {
      console.error("Failed to initialize camera:", error);
    }
  }, [enumerateDevices, requestCameraAccess]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    setMediaDevices((prev) => ({
      ...prev,
      selectedDevice: null,
    }));
  }, []);

  const setVideoElement = useCallback(
    (videoElement: HTMLVideoElement | null) => {
      videoRef.current = videoElement;
    },
    [],
  );

  // Initialize advanced smoothers
  useEffect(() => {
    if (advancedSmoothingEnabled) {
      leftHandAdvancedSmoother.current = new AdvancedGestureSmoother2D(
        { x: 0, y: 0 },
        PERFORMANCE_GESTURE_SMOOTHING_CONFIG,
      );
      rightHandAdvancedSmoother.current = new AdvancedGestureSmoother2D(
        { x: 0, y: 0 },
        PERFORMANCE_GESTURE_SMOOTHING_CONFIG,
      );
    }
  }, [advancedSmoothingEnabled]);

  // Performance monitoring
  const updatePerformanceMetrics = useCallback(() => {
    if (!enablePerformanceMonitoring) return;

    const now = performance.now();
    const recentSamples = performanceSamples.current.filter(
      (sample) => now - sample.timestamp < 1000, // Last 1 second
    );

    if (recentSamples.length > 0) {
      const averageLatency =
        recentSamples.reduce((sum, sample) => sum + sample.processingTime, 0) /
        recentSamples.length;
      const averageFrameTime =
        recentSamples.reduce((sum, sample) => sum + sample.frameTime, 0) /
        recentSamples.length;
      const frameRate = 1000 / averageFrameTime;

      // Estimate memory usage (simplified)
      const memoryUsage = (performance as any).memory
        ? (performance as any).memory.usedJSHeapSize / (1024 * 1024)
        : 0;

      setPerformanceMetrics({
        averageLatency,
        frameRate,
        gestureAccuracy: 0.95, // Would be calculated from actual recognition accuracy
        processingTime: averageLatency,
        memoryUsage,
        lastUpdated: now,
      });
    }
  }, [enablePerformanceMonitoring]);

  // Calibration functions
  const startCalibration = useCallback(
    (gestureType: GestureClassification) => {
      if (!enableCalibration) return;

      setIsCalibrating(true);
      calibrationSamples.current.set(gestureType, []);

      setCalibrationData((prev) => {
        const next = new Map(prev);
        next.set(gestureType, {
          gestureType,
          samples: [],
          isComplete: false,
          accuracy: 0,
        });
        return next;
      });
    },
    [enableCalibration],
  );

  const stopCalibration = useCallback(
    (gestureType: GestureClassification) => {
      if (!enableCalibration) return;

      setIsCalibrating(false);
      const samples = calibrationSamples.current.get(gestureType) || [];

      if (samples.length >= 5) {
        // Calculate calibration accuracy
        const accuracy =
          samples.reduce((sum, sample) => sum + sample.confidence, 0) /
          samples.length;

        setCalibrationData((prev) => {
          const next = new Map(prev);
          const calibration = next.get(gestureType);
          if (calibration) {
            next.set(gestureType, {
              ...calibration,
              samples,
              isComplete: true,
              accuracy,
            });
          }
          return next;
        });
      }

      calibrationSamples.current.delete(gestureType);
    },
    [enableCalibration],
  );

  const recordGestureSample = useCallback(
    (
      gestureType: GestureClassification,
      landmarks: Point2D[],
      confidence: number,
    ) => {
      if (!isCalibrating) return;

      const samples = calibrationSamples.current.get(gestureType) || [];
      samples.push({
        landmarks,
        confidence,
        timestamp: Date.now(),
      });

      // Keep only recent samples (max 20 per gesture)
      if (samples.length > 20) {
        samples.splice(0, samples.length - 20);
      }

      calibrationSamples.current.set(gestureType, samples);
    },
    [isCalibrating],
  );

  const getCalibrationProgress = useCallback(
    (gestureType: GestureClassification) => {
      const samples = calibrationSamples.current.get(gestureType) || [];
      return {
        currentSamples: samples.length,
        requiredSamples: 10,
        isComplete: samples.length >= 10,
      };
    },
    [],
  );

  // Gesture recording for tutorials
  const startGestureRecording = useCallback(() => {
    if (!enableGestureRecording) return;
    setRecordedGestures([]);
  }, [enableGestureRecording]);

  const stopGestureRecording = useCallback(() => {
    if (!enableGestureRecording) return;
    // Recording data is already in recordedGestures state
  }, [enableGestureRecording]);

  const playBackRecordedGestures = useCallback(() => {
    if (!enableGestureRecording || recordedGestures.length === 0) return;

    // Playback logic would iterate through recordedGestures
    // and simulate the gesture processing
    console.log("Playing back", recordedGestures.length, "recorded gestures");
  }, [enableGestureRecording, recordedGestures]);

  const processHandLandmarks = useCallback(
    (landmarks: any[], hand: "left" | "right"): Point2D[] => {
      const points: Point2D[] = landmarks.map((landmark) => ({
        x: landmark.x,
        y: landmark.y,
      }));

      const landmarkIds = Array.from({ length: landmarks.length }, (_, i) => i);
      const smoother =
        hand === "left" ? leftHandSmoother.current : rightHandSmoother.current;

      return smoother.smoothLandmarks(points, landmarkIds);
    },
    [],
  );

  // Helper function to calculate gesture control value
  const calculateGestureValue = useCallback(
    (gesture: GestureResult, landmarks: Point2D[]): number => {
      switch (gesture.type) {
        case GestureClassification.SWIPE_VERTICAL:
          // Use wrist Y position for volume control
          return Math.max(0, Math.min(1, 1 - landmarks[LANDMARK_IDS.WRIST].y));
        case GestureClassification.SWIPE_HORIZONTAL:
          // Use wrist X position for pan control
          return landmarks[LANDMARK_IDS.WRIST].x;
        case GestureClassification.PINCH:
          // Calculate pinch strength from thumb-index distance
          const thumbTip = landmarks[LANDMARK_IDS.THUMB_TIP];
          const indexTip = landmarks[LANDMARK_IDS.INDEX_TIP];
          const pinchDistance = Math.sqrt(
            Math.pow(thumbTip.x - indexTip.x, 2) +
              Math.pow(thumbTip.y - indexTip.y, 2),
          );
          return Math.max(0, Math.min(1, 1 - pinchDistance * 5));
        case GestureClassification.SPREAD:
          // Use hand span for crossfader
          const handSpan = gesture.metadata?.handDistance || 0;
          return Math.max(0, Math.min(1, handSpan));
        default:
          return 0.5; // Default neutral value
      }
    },
    [],
  );

  const detectGestures = useCallback(
    (
      landmarks: Point2D[],
      hand: "left" | "right",
      confidence: number,
    ): GestureControl[] => {
      const controls: GestureControl[] = [];

      if (landmarks.length < 21 || confidence < minConfidence) return controls;

      // Use advanced gesture recognizer for comprehensive detection
      const handResult: HandResult = {
        landmarks,
        handedness: hand === "left" ? "Left" : "Right",
        confidence,
      };

      const gestureResults =
        advancedGestureRecognizer.current.recognizeGestures(
          hand === "left" ? handResult : null,
          hand === "right" ? handResult : null,
          640, // Default screen width
          480, // Default screen height
        );

      // Convert gesture results to controls
      gestureResults.forEach((gesture) => {
        // Get control value from gesture data
        let controlValue = 0;
        if (
          gesture.data &&
          typeof gesture.data === "object" &&
          "value" in gesture.data
        ) {
          controlValue = (gesture.data as any).value || 0;
        } else {
          // Calculate value based on gesture type and landmarks
          controlValue = calculateGestureValue(gesture, landmarks);
        }

        // Map gesture types to control types
        let controlType: GestureControl["type"] = "volume";
        let stemType = "master";

        switch (gesture.type) {
          case GestureClassification.PINCH:
            controlType = "effect";
            break;
          case GestureClassification.FIST:
            controlType = "mute";
            break;
          case GestureClassification.PALM_OPEN:
            controlType = "solo";
            break;
          case GestureClassification.SWIPE_HORIZONTAL:
            controlType = "pan";
            break;
          case GestureClassification.SWIPE_VERTICAL:
            controlType = "volume";
            break;
          case GestureClassification.SPREAD:
            controlType = "crossfader";
            stemType = "crossfader";
            break;
          case GestureClassification.FINGER_COUNT:
            const fingerCount = gesture.metadata?.fingerCount || 1;
            switch (fingerCount) {
              case 1:
                stemType = "vocals";
                break;
              case 2:
                stemType = "melody";
                break;
              case 3:
                stemType = "bass";
                break;
              case 4:
                stemType = "drums";
                break;
              default:
                stemType = "master";
            }
            controlType = "stem_volume";
            break;
          case GestureClassification.TWO_HAND_PINCH:
            controlType = "volume";
            stemType = "master";
            break;
          default:
            controlType = "volume";
        }

        controls.push({
          type: controlType,
          value: Math.max(0, Math.min(1, controlValue)),
          hand,
          gesture: gesture.type,
          stemType,
          metadata: {
            gestureType: gesture.type,
            gestureConfidence: gesture.confidence,
            gestureData: gesture.data,
            gestureMetadata: gesture.metadata,
          },
        });

        // Record gesture for calibration if enabled
        if (enableCalibration && isCalibrating) {
          recordGestureSample(gesture.type, landmarks, gesture.confidence);
        }

        // Record gesture for playback if enabled
        if (enableGestureRecording) {
          setRecordedGestures((prev) => [...prev, gesture]);
        }
      });

      return controls;
    },
    [
      minConfidence,
      enableCalibration,
      isCalibrating,
      enableGestureRecording,
      recordGestureSample,
      calculateGestureValue,
    ],
  );

  const updateGestures = useCallback(
    (results: any) => {
      const now = Date.now();

      // Throttle updates
      if (now - lastUpdateTime.current < updateInterval) {
        return;
      }
      lastUpdateTime.current = now;

      setIsProcessing(true);

      try {
        const leftHandLandmarks = results.leftHandLandmarks || null;
        const rightHandLandmarks = results.rightHandLandmarks || null;
        const confidence = results.confidence || 1.0;

        if (confidence < minConfidence) {
          setIsProcessing(false);
          return;
        }

        let leftHand: Point2D[] | null = null;
        let rightHand: Point2D[] | null = null;
        const newControls: GestureControl[] = [];

        if (leftHandLandmarks) {
          leftHand = processHandLandmarks(leftHandLandmarks, "left");
          newControls.push(...detectGestures(leftHand, "left", confidence));
        }

        if (rightHandLandmarks) {
          rightHand = processHandLandmarks(rightHandLandmarks, "right");
          newControls.push(...detectGestures(rightHand, "right", confidence));
        }

        setGestureData({
          leftHand,
          rightHand,
          timestamp: now,
          confidence,
        });

        setControls(newControls);
      } finally {
        setIsProcessing(false);
      }
    },
    [minConfidence, updateInterval, detectGestures, processHandLandmarks],
  );

  const reset = useCallback(() => {
    leftHandSmoother.current.reset();
    rightHandSmoother.current.reset();
    setGestureData(null);
    setControls([]);
    lastUpdateTime.current = 0;
  }, []);

  const getControlValue = useCallback(
    (
      type: GestureControl["type"],
      hand?: "left" | "right",
    ): number | undefined => {
      const control = controls.find(
        (c) => c.type === type && (!hand || c.hand === hand),
      );
      return control?.value;
    },
    [controls],
  );

  const isGestureActive = useCallback(
    (gesture: string, hand?: "left" | "right"): boolean => {
      return controls.some(
        (c) => c.gesture === gesture && (!hand || c.hand === hand),
      );
    },
    [controls],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return {
    gestureData,
    controls,
    isProcessing,
    updateGestures,
    reset,
    getControlValue,
    isGestureActive,
    stats: {
      leftHandFilters: leftHandSmoother.current.getActiveFilterCount(),
      rightHandFilters: rightHandSmoother.current.getActiveFilterCount(),
    },
    // Camera/MediaDevices integration
    mediaDevices,
    initializeCamera,
    stopCamera,
    selectCameraDevice,
    setVideoElement,
    requestCameraAccess,
    // Advanced gesture recognition
    advancedGestureRecognizer: advancedGestureRecognizer.current,
    // Calibration features
    calibrationData: Array.from(calibrationData.entries()),
    startCalibration,
    stopCalibration,
    getCalibrationProgress,
    isCalibrating,
    // Performance monitoring
    performanceMetrics,
    updatePerformanceMetrics,
    // Gesture recording for tutorials
    recordedGestures,
    startGestureRecording,
    stopGestureRecording,
    playBackRecordedGestures,
    // Advanced smoothing
    leftHandAdvancedSmoother: leftHandAdvancedSmoother.current,
    rightHandAdvancedSmoother: rightHandAdvancedSmoother.current,
  };
}
