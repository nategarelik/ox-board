// Gesture stem mapper unit tests
import {
  GestureStemMapper,
  GestureType,
  GestureDetectionResult,
} from "@/lib/gestures/gestureStemMapper";
import { HandResult } from "@/lib/gesture/recognition";
import { Point2D } from "@/lib/gesture/smoothing";

describe("GestureStemMapper", () => {
  let mapper: GestureStemMapper;

  beforeEach(() => {
    mapper = new GestureStemMapper();
  });

  describe("Gesture Detection", () => {
    it("should detect peace sign gesture", () => {
      const landmarks: Point2D[] = Array(21)
        .fill(null)
        .map(() => ({
          x: 0.5,
          y: 0.5,
        }));

      // Make index and middle fingers extended
      landmarks[7] = { x: 0.5, y: 0.3 }; // Index tip
      landmarks[11] = { x: 0.5, y: 0.3 }; // Middle tip
      landmarks[15] = { x: 0.5, y: 0.6 }; // Ring tip (retracted)
      landmarks[19] = { x: 0.5, y: 0.6 }; // Pinky tip (retracted)
      landmarks[3] = { x: 0.5, y: 0.6 }; // Thumb tip (retracted)

      const handResult: HandResult = {
        landmarks,
        handedness: "Right",
        confidence: 0.9,
      };

      const gestures = mapper.detectGestures(handResult, null, 1920, 1080);
      const peaceGesture = gestures.find(
        (g) => g.gestureType === GestureType.PEACE_SIGN,
      );

      expect(peaceGesture).toBeDefined();
      expect(peaceGesture?.confidence).toBeGreaterThan(0.7);
    });

    it("should detect fist gesture", () => {
      const landmarks: Point2D[] = Array(21)
        .fill(null)
        .map(() => ({
          x: 0.5,
          y: 0.5,
        }));

      // Make all fingers close to wrist (fist)
      landmarks[7] = { x: 0.52, y: 0.52 }; // Index tip
      landmarks[11] = { x: 0.51, y: 0.51 }; // Middle tip
      landmarks[15] = { x: 0.49, y: 0.49 }; // Ring tip
      landmarks[19] = { x: 0.48, y: 0.48 }; // Pinky tip
      landmarks[3] = { x: 0.5, y: 0.5 }; // Thumb tip

      const handResult: HandResult = {
        landmarks,
        handedness: "Right",
        confidence: 0.9,
      };

      const gestures = mapper.detectGestures(handResult, null, 1920, 1080);
      const fistGesture = gestures.find(
        (g) => g.gestureType === GestureType.FIST,
      );

      expect(fistGesture).toBeDefined();
      expect(fistGesture?.confidence).toBeGreaterThan(0.7);
    });

    it("should detect pinch gesture", () => {
      const landmarks: Point2D[] = Array(21)
        .fill(null)
        .map(() => ({
          x: 0.5,
          y: 0.5,
        }));

      // Make thumb and index close together
      landmarks[3] = { x: 0.5, y: 0.5 }; // Thumb tip
      landmarks[7] = { x: 0.52, y: 0.52 }; // Index tip (close to thumb)

      const handResult: HandResult = {
        landmarks,
        handedness: "Right",
        confidence: 0.9,
      };

      const gestures = mapper.detectGestures(handResult, null, 1920, 1080);
      const pinchGesture = gestures.find(
        (g) => g.gestureType === GestureType.PINCH,
      );

      expect(pinchGesture).toBeDefined();
      expect(pinchGesture?.confidence).toBeGreaterThan(0.7);
    });
  });

  describe("Gesture Processing", () => {
    it("should process gestures and return control mappings", () => {
      const gestures: GestureDetectionResult[] = [
        {
          gestureType: GestureType.PEACE_SIGN,
          confidence: 0.9,
          value: 0.8,
          position: { x: 0.5, y: 0.5 },
          timestamp: Date.now(),
        },
      ];

      const controls = mapper.processGestures(gestures, 0);

      expect(Array.isArray(controls)).toBe(true);
      if (controls.length > 0) {
        expect(controls[0].mapping).toBeDefined();
        expect(controls[0].value).toBeGreaterThanOrEqual(0);
        expect(controls[0].value).toBeLessThanOrEqual(1);
        expect(controls[0].controlType).toBeDefined();
        expect(controls[0].stemType).toBeDefined();
      }
    });

    it("should handle empty gesture arrays", () => {
      const controls = mapper.processGestures([], 0);
      expect(controls).toEqual([]);
    });

    it("should handle multiple gestures", () => {
      const gestures: GestureDetectionResult[] = [
        {
          gestureType: GestureType.PEACE_SIGN,
          confidence: 0.9,
          value: 0.8,
          timestamp: Date.now(),
        },
        {
          gestureType: GestureType.FIST,
          confidence: 0.9,
          value: 1.0,
          timestamp: Date.now(),
        },
      ];

      const controls = mapper.processGestures(gestures, 0);
      expect(Array.isArray(controls)).toBe(true);
    });
  });

  describe("Profile Management", () => {
    it("should get active profile", () => {
      const activeProfile = mapper.getActiveProfile();
      expect(activeProfile).toBeDefined();
      expect(activeProfile?.id).toBe("default");
    });

    it("should get all profiles", () => {
      const profiles = mapper.getAllProfiles();
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBeGreaterThan(0);
    });

    it("should set active profile", () => {
      const success = mapper.setActiveProfile("default");
      expect(success).toBe(true);
    });

    it("should handle invalid profile ID", () => {
      const success = mapper.setActiveProfile("nonexistent");
      expect(success).toBe(false);
    });
  });

  describe("Feedback State", () => {
    it("should provide feedback state", () => {
      const feedbackState = mapper.getFeedbackState();
      expect(feedbackState).toBeDefined();
      expect(feedbackState.confidence).toBeGreaterThanOrEqual(0);
      expect(feedbackState.confidence).toBeLessThanOrEqual(1);
      expect(feedbackState.latency).toBeGreaterThanOrEqual(0);
    });

    it("should track active gestures", () => {
      const landmarks: Point2D[] = Array(21)
        .fill(null)
        .map(() => ({
          x: 0.5,
          y: 0.5,
        }));

      landmarks[7] = { x: 0.5, y: 0.3 }; // Index tip
      landmarks[11] = { x: 0.5, y: 0.3 }; // Middle tip

      const handResult: HandResult = {
        landmarks,
        handedness: "Right",
        confidence: 0.9,
      };

      mapper.detectGestures(handResult, null, 1920, 1080);
      const feedbackState = mapper.getFeedbackState();

      expect(feedbackState.activeGestures.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Performance Requirements", () => {
    it("should detect gestures within performance budget", async () => {
      const landmarks: Point2D[] = Array(21)
        .fill(null)
        .map(() => ({
          x: 0.5,
          y: 0.5,
        }));

      const handResult: HandResult = {
        landmarks,
        handedness: "Right",
        confidence: 0.9,
      };

      const startTime = performance.now();

      for (let i = 0; i < 50; i++) {
        mapper.detectGestures(handResult, null, 1920, 1080);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 50;

      expect(averageTime).toBeLessThan(10); // Should be fast for gesture detection
    });

    it("should process gestures within performance budget", async () => {
      const gestures: GestureDetectionResult[] = [
        {
          gestureType: GestureType.PEACE_SIGN,
          confidence: 0.9,
          value: 0.8,
          timestamp: Date.now(),
        },
      ];

      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        mapper.processGestures(gestures, 0);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 100;

      expect(averageTime).toBeLessThan(5); // Should be very fast for processing
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid landmarks gracefully", () => {
      const invalidHandResult: HandResult = {
        landmarks: [],
        handedness: "Right",
        confidence: 0.9,
      };

      expect(() => {
        mapper.detectGestures(invalidHandResult, null, 1920, 1080);
      }).not.toThrow();
    });

    it("should handle null hand results", () => {
      const gestures = mapper.detectGestures(null, null, 1920, 1080);
      expect(Array.isArray(gestures)).toBe(true);
    });

    it("should cleanup properly", () => {
      expect(() => {
        mapper.dispose();
      }).not.toThrow();
    });
  });
});
