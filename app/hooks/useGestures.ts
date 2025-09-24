import { useRef, useCallback, useState, useEffect } from "react";
import {
  HandLandmarkSmoother,
  Point2D,
  KalmanConfig,
  GESTURE_SMOOTHING_CONFIG,
} from "../lib/gesture/smoothing";

export interface GestureData {
  leftHand: Point2D[] | null;
  rightHand: Point2D[] | null;
  timestamp: number;
  confidence: number;
}

export interface GestureControl {
  type: "volume" | "crossfader" | "eq" | "effect";
  value: number;
  hand: "left" | "right";
  gesture: string;
}

export interface UseGesturesConfig {
  smoothingConfig?: Partial<KalmanConfig>;
  minConfidence?: number;
  gestureThreshold?: number;
  updateInterval?: number;
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

export function useGestures(config: UseGesturesConfig = {}) {
  const {
    smoothingConfig = GESTURE_SMOOTHING_CONFIG,
    minConfidence = 0.7,
    gestureThreshold = 0.1,
    updateInterval = 16, // ~60fps
  } = config;

  const [gestureData, setGestureData] = useState<GestureData | null>(null);
  const [controls, setControls] = useState<GestureControl[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const leftHandSmoother = useRef(new HandLandmarkSmoother(smoothingConfig));
  const rightHandSmoother = useRef(new HandLandmarkSmoother(smoothingConfig));
  const lastUpdateTime = useRef(0);

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

  const detectGestures = useCallback(
    (landmarks: Point2D[], hand: "left" | "right"): GestureControl[] => {
      const controls: GestureControl[] = [];

      if (landmarks.length < 21) return controls;

      // Volume control - Index finger Y position
      const indexY = landmarks[LANDMARK_IDS.INDEX_TIP].y;
      const wristY = landmarks[LANDMARK_IDS.WRIST].y;
      const volumeRange = Math.abs(wristY - 0.2); // Normalize range
      const volumeValue = Math.max(
        0,
        Math.min(1, 1 - (indexY - 0.2) / volumeRange),
      );

      controls.push({
        type: "volume",
        value: volumeValue,
        hand,
        gesture: "index_vertical",
      });

      // Crossfader - Wrist X position
      const wristX = landmarks[LANDMARK_IDS.WRIST].x;
      const crossfaderValue = Math.max(0, Math.min(1, wristX));

      if (hand === "right") {
        controls.push({
          type: "crossfader",
          value: crossfaderValue,
          hand,
          gesture: "wrist_horizontal",
        });
      }

      // EQ control - Middle finger for mids
      const middleY = landmarks[LANDMARK_IDS.MIDDLE_TIP].y;
      const eqValue = Math.max(
        0,
        Math.min(1, 1 - (middleY - 0.2) / volumeRange),
      );

      controls.push({
        type: "eq",
        value: eqValue,
        hand,
        gesture: "middle_vertical",
      });

      // Effect intensity - Pinch gesture (thumb to index distance)
      const thumbTip = landmarks[LANDMARK_IDS.THUMB_TIP];
      const indexTip = landmarks[LANDMARK_IDS.INDEX_TIP];
      const pinchDistance = Math.sqrt(
        Math.pow(thumbTip.x - indexTip.x, 2) +
          Math.pow(thumbTip.y - indexTip.y, 2),
      );
      const effectValue = Math.max(0, Math.min(1, 1 - pinchDistance * 5));

      if (pinchDistance < 0.15) {
        controls.push({
          type: "effect",
          value: effectValue,
          hand,
          gesture: "pinch",
        });
      }

      return controls;
    },
    [],
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
          newControls.push(...detectGestures(leftHand, "left"));
        }

        if (rightHandLandmarks) {
          rightHand = processHandLandmarks(rightHandLandmarks, "right");
          newControls.push(...detectGestures(rightHand, "right"));
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
  };
}
