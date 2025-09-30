// Gesture-specific test setup
import { jest } from "@jest/globals";

// Mock MediaPipe Hands
jest.mock("@mediapipe/hands", () => ({
  Hands: jest.fn().mockImplementation(() => ({
    setOptions: jest.fn(),
    onResults: jest.fn(),
    send: jest.fn(),
    initialize: jest.fn(),
    close: jest.fn(),
  })),
}));

// Mock MediaPipe Camera Utils
jest.mock("@mediapipe/camera_utils", () => ({
  Camera: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
  })),
}));

// Mock MediaPipe Drawing Utils
jest.mock("@mediapipe/drawing_utils", () => ({
  drawConnectors: jest.fn(),
  drawLandmarks: jest.fn(),
}));

// Global gesture test utilities
(global as any).createMockHandLandmarks = (landmarkData: number[][] = []) => {
  return {
    multiHandLandmarks: landmarkData.length > 0 ? [landmarkData] : [],
    multiHandedness:
      landmarkData.length > 0 ? [{ index: 0, score: 0.9, label: "Right" }] : [],
  };
};

// Gesture simulation utilities for testing
(global as any).simulateGesture = {
  pinch: (intensity: number = 1.0) => {
    const thumbTip = [0.5, 0.5, 0];
    const indexTip = [0.5 + intensity * 0.1, 0.5, 0];
    return [thumbTip, indexTip];
  },

  spread: (intensity: number = 1.0) => {
    const thumbTip = [0.3, 0.5, 0];
    const indexTip = [0.7, 0.5, 0];
    return [thumbTip, indexTip];
  },

  rotate: (angle: number = 0) => {
    const centerX = 0.5;
    const centerY = 0.5;
    const radius = 0.2;
    const thumbTip = [
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius,
      0,
    ];
    const indexTip = [
      centerX + Math.cos(angle + Math.PI) * radius,
      centerY + Math.sin(angle + Math.PI) * radius,
      0,
    ];
    return [thumbTip, indexTip];
  },
};
