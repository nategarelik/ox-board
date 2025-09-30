// Gesture test helpers and utilities
import { jest } from "@jest/globals";

// Mock hand landmark data generation
export const generateMockLandmarks = (
  gestureType: string,
  intensity: number = 1.0,
  position: { x: number; y: number; z: number } = { x: 0.5, y: 0.5, z: 0 },
): Array<{ x: number; y: number }> => {
  const baseLandmarks = Array(21)
    .fill(null)
    .map(() => ({
      x: position.x + (Math.random() - 0.5) * 0.1,
      y: position.y + (Math.random() - 0.5) * 0.1,
    }));

  switch (gestureType) {
    case "pinch":
      return generatePinchLandmarks(intensity, position);
    case "spread":
      return generateSpreadLandmarks(intensity, position);
    case "rotate":
      return generateRotationLandmarks(intensity, position);
    case "swipe-left":
      return generateSwipeLeftLandmarks(intensity, position);
    case "swipe-right":
      return generateSwipeRightLandmarks(intensity, position);
    case "swipe-up":
      return generateSwipeUpLandmarks(intensity, position);
    case "swipe-down":
      return generateSwipeDownLandmarks(intensity, position);
    case "tap":
      return generateTapLandmarks(intensity, position);
    case "grab":
      return generateGrabLandmarks(intensity, position);
    case "point":
      return generatePointLandmarks(intensity, position);
    case "peace":
      return generatePeaceLandmarks(intensity, position);
    case "fist":
      return generateFistLandmarks(intensity, position);
    case "thumbs-up":
      return generateThumbsUpLandmarks(intensity, position);
    case "thumbs-down":
      return generateThumbsDownLandmarks(intensity, position);
    case "call-me":
      return generateCallMeLandmarks(intensity, position);
    default:
      return baseLandmarks;
  }
};

// Specific gesture landmark generators
const generatePinchLandmarks = (
  intensity: number,
  position: { x: number; y: number; z: number },
): Array<{ x: number; y: number }> => {
  const thumbTip = { x: position.x, y: position.y };
  const indexTip = {
    x: position.x + intensity * 0.05,
    y: position.y + intensity * 0.05,
  };

  return [
    // Thumb
    { x: position.x - 0.1, y: position.y - 0.1 },
    { x: position.x - 0.05, y: position.y - 0.05 },
    { x: position.x - 0.02, y: position.y - 0.02 },
    thumbTip,
    // Index
    { x: position.x + 0.02, y: position.y + 0.02 },
    { x: position.x + 0.05, y: position.y + 0.05 },
    { x: position.x + 0.08, y: position.y + 0.08 },
    indexTip,
    // Rest of hand (neutral positions)
    ...Array(13)
      .fill(null)
      .map((_, i) => ({
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
      })),
  ];
};

const generateSpreadLandmarks = (
  intensity: number,
  position: { x: number; y: number; z: number },
): Array<{ x: number; y: number }> => {
  const spread = intensity * 0.1;
  return [
    // Thumb
    { x: position.x - spread, y: position.y - spread },
    { x: position.x - spread * 0.7, y: position.y - spread * 0.7 },
    { x: position.x - spread * 0.4, y: position.y - spread * 0.4 },
    { x: position.x - spread * 0.2, y: position.y - spread * 0.2 },
    // Index
    { x: position.x + spread * 0.2, y: position.y + spread * 0.2 },
    { x: position.x + spread * 0.4, y: position.y + spread * 0.4 },
    { x: position.x + spread * 0.7, y: position.y + spread * 0.7 },
    { x: position.x + spread, y: position.y + spread },
    // Rest of hand
    ...Array(13)
      .fill(null)
      .map((_, i) => ({
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
      })),
  ];
};

const generateRotationLandmarks = (
  angle: number,
  position: { x: number; y: number; z: number },
): Array<{ x: number; y: number }> => {
  const radius = 0.15;
  const thumbAngle = angle;
  const indexAngle = angle + Math.PI;

  return [
    // Thumb
    {
      x: position.x + Math.cos(thumbAngle) * radius,
      y: position.y + Math.sin(thumbAngle) * radius,
    },
    {
      x: position.x + Math.cos(thumbAngle + 0.3) * radius * 0.8,
      y: position.y + Math.sin(thumbAngle + 0.3) * radius * 0.8,
    },
    {
      x: position.x + Math.cos(thumbAngle + 0.6) * radius * 0.6,
      y: position.y + Math.sin(thumbAngle + 0.6) * radius * 0.6,
    },
    {
      x: position.x + Math.cos(thumbAngle + 0.9) * radius * 0.4,
      y: position.y + Math.sin(thumbAngle + 0.9) * radius * 0.4,
    },
    // Index
    {
      x: position.x + Math.cos(indexAngle) * radius,
      y: position.y + Math.sin(indexAngle) * radius,
    },
    {
      x: position.x + Math.cos(indexAngle + 0.3) * radius * 0.8,
      y: position.y + Math.sin(indexAngle + 0.3) * radius * 0.8,
    },
    {
      x: position.x + Math.cos(indexAngle + 0.6) * radius * 0.6,
      y: position.y + Math.sin(indexAngle + 0.6) * radius * 0.6,
    },
    {
      x: position.x + Math.cos(indexAngle + 0.9) * radius * 0.4,
      y: position.y + Math.sin(indexAngle + 0.9) * radius * 0.4,
    },
    // Rest of hand
    ...Array(13)
      .fill(null)
      .map((_, i) => ({
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
      })),
  ];
};

const generateSwipeLeftLandmarks = (
  intensity: number,
  position: { x: number; y: number; z: number },
): Array<{ x: number; y: number }> => {
  const offset = intensity * 0.3;
  return [
    { x: position.x - offset, y: position.y },
    { x: position.x - offset * 0.7, y: position.y },
    { x: position.x - offset * 0.4, y: position.y },
    { x: position.x - offset * 0.2, y: position.y },
    { x: position.x + offset * 0.2, y: position.y },
    { x: position.x + offset * 0.4, y: position.y },
    { x: position.x + offset * 0.7, y: position.y },
    { x: position.x + offset, y: position.y },
    // Rest of hand
    ...Array(13)
      .fill(null)
      .map((_, i) => ({
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
      })),
  ];
};

const generateSwipeRightLandmarks = (
  intensity: number,
  position: { x: number; y: number; z: number },
): Array<{ x: number; y: number }> => {
  const offset = intensity * 0.3;
  return [
    { x: position.x + offset, y: position.y },
    { x: position.x + offset * 0.7, y: position.y },
    { x: position.x + offset * 0.4, y: position.y },
    { x: position.x + offset * 0.2, y: position.y },
    { x: position.x - offset * 0.2, y: position.y },
    { x: position.x - offset * 0.4, y: position.y },
    { x: position.x - offset * 0.7, y: position.y },
    { x: position.x - offset, y: position.y },
    // Rest of hand
    ...Array(13)
      .fill(null)
      .map((_, i) => ({
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
      })),
  ];
};

const generateSwipeUpLandmarks = (
  intensity: number,
  position: { x: number; y: number; z: number },
): Array<{ x: number; y: number }> => {
  const offset = intensity * 0.3;
  return [
    { x: position.x, y: position.y + offset },
    { x: position.x, y: position.y + offset * 0.7 },
    { x: position.x, y: position.y + offset * 0.4 },
    { x: position.x, y: position.y + offset * 0.2 },
    { x: position.x, y: position.y - offset * 0.2 },
    { x: position.x, y: position.y - offset * 0.4 },
    { x: position.x, y: position.y - offset * 0.7 },
    { x: position.x, y: position.y - offset },
    // Rest of hand
    ...Array(13)
      .fill(null)
      .map((_, i) => ({
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
      })),
  ];
};

const generateSwipeDownLandmarks = (
  intensity: number,
  position: { x: number; y: number; z: number },
): Array<{ x: number; y: number }> => {
  const offset = intensity * 0.3;
  return [
    { x: position.x, y: position.y - offset },
    { x: position.x, y: position.y - offset * 0.7 },
    { x: position.x, y: position.y - offset * 0.4 },
    { x: position.x, y: position.y - offset * 0.2 },
    { x: position.x, y: position.y + offset * 0.2 },
    { x: position.x, y: position.y + offset * 0.4 },
    { x: position.x, y: position.y + offset * 0.7 },
    { x: position.x, y: position.y + offset },
    // Rest of hand
    ...Array(13)
      .fill(null)
      .map((_, i) => ({
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
      })),
  ];
};

const generateTapLandmarks = (
  intensity: number,
  position: { x: number; y: number; z: number },
): Array<{ x: number; y: number }> => {
  const tapOffset = intensity * 0.1;
  return [
    { x: position.x, y: position.y - tapOffset },
    { x: position.x - 0.02, y: position.y - tapOffset * 0.7 },
    { x: position.x - 0.01, y: position.y - tapOffset * 0.4 },
    { x: position.x, y: position.y - tapOffset * 0.2 },
    { x: position.x + 0.01, y: position.y - tapOffset * 0.4 },
    { x: position.x + 0.02, y: position.y - tapOffset * 0.7 },
    { x: position.x + 0.03, y: position.y - tapOffset },
    { x: position.x + 0.02, y: position.y - tapOffset * 0.7 },
    // Rest of hand
    ...Array(13)
      .fill(null)
      .map((_, i) => ({
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
      })),
  ];
};

const generateGrabLandmarks = (
  intensity: number,
  position: { x: number; y: number; z: number },
): Array<{ x: number; y: number }> => {
  const grab = intensity * 0.05;
  return [
    { x: position.x - grab, y: position.y - grab },
    { x: position.x - grab * 0.8, y: position.y - grab * 0.8 },
    { x: position.x - grab * 0.6, y: position.y - grab * 0.6 },
    { x: position.x - grab * 0.4, y: position.y - grab * 0.4 },
    { x: position.x + grab * 0.4, y: position.y + grab * 0.4 },
    { x: position.x + grab * 0.6, y: position.y + grab * 0.6 },
    { x: position.x + grab * 0.8, y: position.y + grab * 0.8 },
    { x: position.x + grab, y: position.y + grab },
    // Rest of hand
    ...Array(13)
      .fill(null)
      .map((_, i) => ({
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
      })),
  ];
};

const generatePointLandmarks = (
  intensity: number,
  position: { x: number; y: number; z: number },
): Array<{ x: number; y: number }> => {
  return [
    { x: position.x, y: position.y - 0.1 },
    { x: position.x - 0.02, y: position.y - 0.07 },
    { x: position.x - 0.01, y: position.y - 0.04 },
    { x: position.x, y: position.y - 0.02 },
    { x: position.x + 0.01, y: position.y - 0.04 },
    { x: position.x + 0.02, y: position.y - 0.07 },
    { x: position.x + 0.03, y: position.y - 0.1 },
    { x: position.x + 0.02, y: position.y - 0.13 }, // Index tip extended
    // Rest of hand
    ...Array(13)
      .fill(null)
      .map((_, i) => ({
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
      })),
  ];
};

const generatePeaceLandmarks = (
  intensity: number,
  position: { x: number; y: number; z: number },
): Array<{ x: number; y: number }> => {
  const spread = intensity * 0.08;
  return [
    { x: position.x - spread, y: position.y - 0.1 },
    { x: position.x - spread * 0.7, y: position.y - 0.07 },
    { x: position.x - spread * 0.4, y: position.y - 0.04 },
    { x: position.x - spread * 0.2, y: position.y - 0.02 },
    { x: position.x + spread * 0.2, y: position.y - 0.02 },
    { x: position.x + spread * 0.4, y: position.y - 0.04 },
    { x: position.x + spread * 0.7, y: position.y - 0.07 },
    { x: position.x + spread, y: position.y - 0.1 },
    // Rest of hand
    ...Array(13)
      .fill(null)
      .map((_, i) => ({
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
      })),
  ];
};

const generateFistLandmarks = (
  intensity: number,
  position: { x: number; y: number; z: number },
): Array<{ x: number; y: number }> => {
  const fist = intensity * 0.03;
  return [
    { x: position.x, y: position.y },
    { x: position.x - fist, y: position.y - fist },
    { x: position.x - fist * 0.7, y: position.y - fist * 0.7 },
    { x: position.x - fist * 0.4, y: position.y - fist * 0.4 },
    { x: position.x + fist * 0.4, y: position.y + fist * 0.4 },
    { x: position.x + fist * 0.7, y: position.y + fist * 0.7 },
    { x: position.x + fist, y: position.y + fist },
    { x: position.x + fist * 0.7, y: position.y + fist * 0.7 },
    // Rest of hand
    ...Array(13)
      .fill(null)
      .map((_, i) => ({
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
      })),
  ];
};

const generateThumbsUpLandmarks = (
  intensity: number,
  position: { x: number; y: number; z: number },
): Array<{ x: number; y: number }> => {
  return [
    { x: position.x, y: position.y + 0.1 }, // Thumb tip up
    { x: position.x - 0.02, y: position.y + 0.07 },
    { x: position.x - 0.01, y: position.y + 0.04 },
    { x: position.x, y: position.y + 0.02 },
    { x: position.x + 0.01, y: position.y - 0.04 },
    { x: position.x + 0.02, y: position.y - 0.07 },
    { x: position.x + 0.03, y: position.y - 0.1 },
    { x: position.x + 0.02, y: position.y - 0.13 },
    // Rest of hand
    ...Array(13)
      .fill(null)
      .map((_, i) => ({
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
      })),
  ];
};

const generateThumbsDownLandmarks = (
  intensity: number,
  position: { x: number; y: number; z: number },
): Array<{ x: number; y: number }> => {
  return [
    { x: position.x, y: position.y - 0.1 }, // Thumb tip down
    { x: position.x - 0.02, y: position.y - 0.07 },
    { x: position.x - 0.01, y: position.y - 0.04 },
    { x: position.x, y: position.y - 0.02 },
    { x: position.x + 0.01, y: position.y + 0.04 },
    { x: position.x + 0.02, y: position.y + 0.07 },
    { x: position.x + 0.03, y: position.y + 0.1 },
    { x: position.x + 0.02, y: position.y + 0.13 },
    // Rest of hand
    ...Array(13)
      .fill(null)
      .map((_, i) => ({
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
      })),
  ];
};

const generateCallMeLandmarks = (
  intensity: number,
  position: { x: number; y: number; z: number },
): Array<{ x: number; y: number }> => {
  return [
    { x: position.x + 0.1, y: position.y }, // Thumb tip to ear
    { x: position.x + 0.07, y: position.y - 0.02 },
    { x: position.x + 0.04, y: position.y - 0.01 },
    { x: position.x + 0.02, y: position.y },
    { x: position.x - 0.02, y: position.y + 0.04 },
    { x: position.x - 0.04, y: position.y + 0.07 },
    { x: position.x - 0.06, y: position.y + 0.1 },
    { x: position.x - 0.08, y: position.y + 0.13 }, // Pinky tip extended
    // Rest of hand
    ...Array(13)
      .fill(null)
      .map((_, i) => ({
        x: position.x + (Math.random() - 0.5) * 0.2,
        y: position.y + (Math.random() - 0.5) * 0.2,
      })),
  ];
};

// Mock gesture results
export const createMockGestureResult = (
  type: string,
  confidence: number = 0.95,
) => ({
  type,
  confidence,
  data: {},
  landmarks: generateMockLandmarks(type),
  timestamp: Date.now(),
});

// Gesture simulation utilities
export const createGestureSimulator = () => {
  return {
    simulateGesture: (
      gestureType: string,
      duration: number = 1000,
      intensity: number = 1.0,
    ) => {
      const steps = Math.floor(duration / 16); // 60fps
      const results = [];

      for (let i = 0; i < steps; i++) {
        const progress = i / steps;
        const currentIntensity = intensity * Math.sin(progress * Math.PI);
        const landmarks = generateMockLandmarks(gestureType, currentIntensity);
        results.push(
          createMockGestureResult(gestureType, 0.8 + Math.random() * 0.2),
        );
      }

      return results;
    },

    createGestureSequence: (
      sequence: { gesture: string; duration: number; intensity: number }[],
    ) => {
      const results = [];
      let timestamp = Date.now();

      for (const step of sequence) {
        const stepResults = Array(Math.floor(step.duration / 16))
          .fill(null)
          .map(() => {
            const result = createMockGestureResult(
              step.gesture,
              0.8 + Math.random() * 0.2,
            );
            result.timestamp = timestamp;
            timestamp += 16;
            return result;
          });
        results.push(...stepResults);
      }

      return results;
    },
  };
};

// Performance measurement helpers
export const measureGestureRecognitionTime = async (
  operation: () => Promise<any>,
) => {
  const startTime = performance.now();
  await operation();
  return performance.now() - startTime;
};

// Calibration test data
export const createCalibrationData = () => {
  const gestures = [
    "pinch",
    "spread",
    "rotate",
    "swipe-left",
    "swipe-right",
    "tap",
  ];
  const data = {};

  gestures.forEach((gesture) => {
    (data as any)[gesture] = {
      samples: Array(10)
        .fill(null)
        .map(() => generateMockLandmarks(gesture)),
      expectedConfidence: 0.9,
      tolerance: 0.1,
    };
  });

  return data;
};
