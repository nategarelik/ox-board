/**
 * Comprehensive tests for GestureStemMapper
 * Tests all 15+ gesture mappings, combinations, and control modes
 */

import {
  GestureStemMapper,
  GestureType,
  ControlMode,
  GestureMapping,
  MappingProfile,
  GestureDetectionResult,
  DEFAULT_GESTURE_MAPPINGS,
} from "@/lib/gestures/gestureStemMapper";
import { HandResult, HandLandmark } from "@/lib/gesture/recognition";
import { Point2D } from "@/lib/gesture/smoothing";

// Mock hand landmarks for testing
const createMockHand = (
  handedness: "Left" | "Right",
  confidence: number = 0.9,
  customLandmarks?: Partial<Record<HandLandmark, Point2D>>,
): HandResult => {
  const defaultLandmarks: Point2D[] = Array.from({ length: 21 }, (_, i) => ({
    x: 0.5 + i * 0.01, // Spread landmarks horizontally
    y: 0.5 + i * 0.01, // Spread landmarks vertically
  }));

  // Apply custom landmarks if provided
  if (customLandmarks) {
    Object.entries(customLandmarks).forEach(([landmark, position]) => {
      const index = parseInt(landmark);
      if (index >= 0 && index < 21) {
        defaultLandmarks[index] = position;
      }
    });
  }

  return {
    landmarks: defaultLandmarks,
    handedness,
    confidence,
    worldLandmarks: defaultLandmarks.map((p) => ({ x: p.x, y: p.y, z: 0 })),
  };
};

// Create specific gesture hand configurations
const createPeaceSignHand = (handedness: "Left" | "Right"): HandResult => {
  return createMockHand(handedness, 0.9, {
    [HandLandmark.INDEX_FINGER_TIP]: { x: 0.4, y: 0.3 }, // Extended
    [HandLandmark.MIDDLE_FINGER_TIP]: { x: 0.6, y: 0.3 }, // Extended
    [HandLandmark.RING_FINGER_TIP]: { x: 0.5, y: 0.7 }, // Retracted
    [HandLandmark.PINKY_TIP]: { x: 0.5, y: 0.7 }, // Retracted
    [HandLandmark.THUMB_TIP]: { x: 0.5, y: 0.7 }, // Retracted
    [HandLandmark.WRIST]: { x: 0.5, y: 0.6 },
  });
};

const createRockSignHand = (handedness: "Left" | "Right"): HandResult => {
  return createMockHand(handedness, 0.9, {
    [HandLandmark.INDEX_FINGER_TIP]: { x: 0.4, y: 0.3 }, // Extended
    [HandLandmark.PINKY_TIP]: { x: 0.6, y: 0.3 }, // Extended
    [HandLandmark.MIDDLE_FINGER_TIP]: { x: 0.5, y: 0.7 }, // Retracted
    [HandLandmark.RING_FINGER_TIP]: { x: 0.5, y: 0.7 }, // Retracted
    [HandLandmark.THUMB_TIP]: { x: 0.5, y: 0.7 }, // Retracted
    [HandLandmark.WRIST]: { x: 0.5, y: 0.6 },
  });
};

const createOKSignHand = (handedness: "Left" | "Right"): HandResult => {
  return createMockHand(handedness, 0.9, {
    [HandLandmark.THUMB_TIP]: { x: 0.48, y: 0.45 }, // Close to index
    [HandLandmark.INDEX_FINGER_TIP]: { x: 0.52, y: 0.45 }, // Close to thumb (circle)
    [HandLandmark.MIDDLE_FINGER_TIP]: { x: 0.5, y: 0.3 }, // Extended
    [HandLandmark.RING_FINGER_TIP]: { x: 0.5, y: 0.3 }, // Extended
    [HandLandmark.PINKY_TIP]: { x: 0.5, y: 0.3 }, // Extended
    [HandLandmark.WRIST]: { x: 0.5, y: 0.6 },
  });
};

const createCallSignHand = (handedness: "Left" | "Right"): HandResult => {
  return createMockHand(handedness, 0.9, {
    [HandLandmark.THUMB_TIP]: { x: 0.3, y: 0.4 }, // Extended
    [HandLandmark.PINKY_TIP]: { x: 0.7, y: 0.4 }, // Extended
    [HandLandmark.INDEX_FINGER_TIP]: { x: 0.5, y: 0.7 }, // Retracted
    [HandLandmark.MIDDLE_FINGER_TIP]: { x: 0.5, y: 0.7 }, // Retracted
    [HandLandmark.RING_FINGER_TIP]: { x: 0.5, y: 0.7 }, // Retracted
    [HandLandmark.WRIST]: { x: 0.5, y: 0.6 },
  });
};

const createFistHand = (handedness: "Left" | "Right"): HandResult => {
  return createMockHand(handedness, 0.9, {
    [HandLandmark.THUMB_TIP]: { x: 0.5, y: 0.58 }, // Close to wrist
    [HandLandmark.INDEX_FINGER_TIP]: { x: 0.5, y: 0.58 }, // Close to wrist
    [HandLandmark.MIDDLE_FINGER_TIP]: { x: 0.5, y: 0.58 }, // Close to wrist
    [HandLandmark.RING_FINGER_TIP]: { x: 0.5, y: 0.58 }, // Close to wrist
    [HandLandmark.PINKY_TIP]: { x: 0.5, y: 0.58 }, // Close to wrist
    [HandLandmark.WRIST]: { x: 0.5, y: 0.6 },
  });
};

const createOpenPalmHand = (handedness: "Left" | "Right"): HandResult => {
  return createMockHand(handedness, 0.9, {
    [HandLandmark.THUMB_TIP]: { x: 0.3, y: 0.3 }, // Extended
    [HandLandmark.INDEX_FINGER_TIP]: { x: 0.4, y: 0.2 }, // Extended
    [HandLandmark.MIDDLE_FINGER_TIP]: { x: 0.5, y: 0.2 }, // Extended
    [HandLandmark.RING_FINGER_TIP]: { x: 0.6, y: 0.2 }, // Extended
    [HandLandmark.PINKY_TIP]: { x: 0.7, y: 0.3 }, // Extended
    [HandLandmark.WRIST]: { x: 0.5, y: 0.6 },
  });
};

describe("GestureStemMapper", () => {
  let mapper: GestureStemMapper;

  beforeEach(() => {
    mapper = new GestureStemMapper({
      gestureConfidenceThreshold: 0.7,
      latencyTarget: 50,
      smoothingEnabled: true,
      feedbackEnabled: true,
    });
  });

  afterEach(() => {
    mapper.dispose();
  });

  describe("Initialization", () => {
    it("should initialize with default configuration", () => {
      expect(mapper).toBeDefined();
      const profiles = mapper.getAllProfiles();
      expect(profiles.length).toBeGreaterThan(0);
      expect(profiles[0].id).toBe("default");
    });

    it("should have all default gesture mappings", () => {
      const profile = mapper.getActiveProfile();
      expect(profile).toBeDefined();
      expect(profile!.mappings.length).toBeGreaterThanOrEqual(15);

      // Check for specific mappings
      const mappingIds = profile!.mappings.map((m) => m.id);
      expect(mappingIds).toContain(DEFAULT_GESTURE_MAPPINGS.PEACE_TO_DRUMS);
      expect(mappingIds).toContain(DEFAULT_GESTURE_MAPPINGS.ROCK_TO_BASS);
      expect(mappingIds).toContain(DEFAULT_GESTURE_MAPPINGS.OK_TO_MELODY);
      expect(mappingIds).toContain(DEFAULT_GESTURE_MAPPINGS.CALL_TO_VOCALS);
    });
  });

  describe("Single Hand Gesture Detection", () => {
    const screenWidth = 1920;
    const screenHeight = 1080;

    it("should detect peace sign gesture", () => {
      const leftHand = createPeaceSignHand("Left");
      const gestures = mapper.detectGestures(
        leftHand,
        null,
        screenWidth,
        screenHeight,
      );

      const peaceGesture = gestures.find(
        (g) => g.gestureType === GestureType.PEACE_SIGN,
      );
      expect(peaceGesture).toBeDefined();
      expect(peaceGesture!.confidence).toBeGreaterThan(0.6);
      expect(peaceGesture!.value).toBeGreaterThan(0);
    });

    it("should detect rock sign gesture", () => {
      const rightHand = createRockSignHand("Right");
      const gestures = mapper.detectGestures(
        null,
        rightHand,
        screenWidth,
        screenHeight,
      );

      const rockGesture = gestures.find(
        (g) => g.gestureType === GestureType.ROCK_SIGN,
      );
      expect(rockGesture).toBeDefined();
      expect(rockGesture!.confidence).toBeGreaterThan(0.6);
    });

    it("should detect OK sign gesture", () => {
      const leftHand = createOKSignHand("Left");
      const gestures = mapper.detectGestures(
        leftHand,
        null,
        screenWidth,
        screenHeight,
      );

      const okGesture = gestures.find(
        (g) => g.gestureType === GestureType.OK_SIGN,
      );
      expect(okGesture).toBeDefined();
      expect(okGesture!.confidence).toBeGreaterThan(0.5);
    });

    it("should detect call sign gesture", () => {
      const rightHand = createCallSignHand("Right");
      const gestures = mapper.detectGestures(
        null,
        rightHand,
        screenWidth,
        screenHeight,
      );

      const callGesture = gestures.find(
        (g) => g.gestureType === GestureType.CALL_SIGN,
      );
      expect(callGesture).toBeDefined();
      expect(callGesture!.confidence).toBeGreaterThan(0.5);
      expect(callGesture!.value).toBeGreaterThan(0);
    });

    it("should detect fist gesture", () => {
      const leftHand = createFistHand("Left");
      const gestures = mapper.detectGestures(
        leftHand,
        null,
        screenWidth,
        screenHeight,
      );

      const fistGesture = gestures.find(
        (g) => g.gestureType === GestureType.FIST,
      );
      expect(fistGesture).toBeDefined();
      expect(fistGesture!.confidence).toBeGreaterThan(0.7);
      expect(fistGesture!.value).toBe(1.0);
    });

    it("should detect open palm gesture", () => {
      const rightHand = createOpenPalmHand("Right");
      const gestures = mapper.detectGestures(
        null,
        rightHand,
        screenWidth,
        screenHeight,
      );

      const palmGesture = gestures.find(
        (g) => g.gestureType === GestureType.OPEN_PALM,
      );
      expect(palmGesture).toBeDefined();
      expect(palmGesture!.confidence).toBeGreaterThan(0.5);
    });

    it("should detect pinch gesture", () => {
      const pinchHand = createMockHand("Left", 0.9, {
        [HandLandmark.THUMB_TIP]: { x: 0.49, y: 0.5 }, // Very close to index
        [HandLandmark.INDEX_FINGER_TIP]: { x: 0.51, y: 0.5 }, // Very close to thumb
        [HandLandmark.WRIST]: { x: 0.5, y: 0.6 },
      });

      const gestures = mapper.detectGestures(
        pinchHand,
        null,
        screenWidth,
        screenHeight,
      );
      const pinchGesture = gestures.find(
        (g) => g.gestureType === GestureType.PINCH,
      );

      expect(pinchGesture).toBeDefined();
      expect(pinchGesture!.confidence).toBeGreaterThan(0.5);
      expect(pinchGesture!.value).toBeGreaterThan(0.5);
    });
  });

  describe("Two Hand Gesture Detection", () => {
    const screenWidth = 1920;
    const screenHeight = 1080;

    it("should detect crossfader gesture", () => {
      const leftHand = createMockHand("Left", 0.9, {
        [HandLandmark.WRIST]: { x: 0.3, y: 0.5 },
      });
      const rightHand = createMockHand("Right", 0.9, {
        [HandLandmark.WRIST]: { x: 0.7, y: 0.5 },
      });

      const gestures = mapper.detectGestures(
        leftHand,
        rightHand,
        screenWidth,
        screenHeight,
      );
      const crossfaderGesture = gestures.find(
        (g) => g.gestureType === GestureType.CROSSFADER_HANDS,
      );

      expect(crossfaderGesture).toBeDefined();
      expect(crossfaderGesture!.confidence).toBeGreaterThan(0.5);
      expect(crossfaderGesture!.value).toBeCloseTo(0.5, 1); // Center position
    });

    it("should detect spread hands gesture", () => {
      const leftHand = createMockHand("Left", 0.9, {
        [HandLandmark.WRIST]: { x: 0.1, y: 0.5 },
      });
      const rightHand = createMockHand("Right", 0.9, {
        [HandLandmark.WRIST]: { x: 0.9, y: 0.5 },
      });

      const gestures = mapper.detectGestures(
        leftHand,
        rightHand,
        screenWidth,
        screenHeight,
      );
      const spreadGesture = gestures.find(
        (g) => g.gestureType === GestureType.SPREAD_HANDS,
      );

      expect(spreadGesture).toBeDefined();
      expect(spreadGesture!.confidence).toBeGreaterThan(0.5);
      expect(spreadGesture!.value).toBeGreaterThan(0.5);
    });

    it("should detect clap gesture", () => {
      const leftHand = createMockHand("Left", 0.9, {
        [HandLandmark.MIDDLE_FINGER_MCP]: { x: 0.49, y: 0.5 },
      });
      const rightHand = createMockHand("Right", 0.9, {
        [HandLandmark.MIDDLE_FINGER_MCP]: { x: 0.51, y: 0.5 },
      });

      const gestures = mapper.detectGestures(
        leftHand,
        rightHand,
        screenWidth,
        screenHeight,
      );
      const clapGesture = gestures.find(
        (g) => g.gestureType === GestureType.CLAP,
      );

      expect(clapGesture).toBeDefined();
      expect(clapGesture!.confidence).toBeGreaterThan(0.7);
      expect(clapGesture!.value).toBe(1.0);
    });

    it("should detect dual control gesture", () => {
      const leftHand = createOpenPalmHand("Left");
      const rightHand = createOpenPalmHand("Right");

      const gestures = mapper.detectGestures(
        leftHand,
        rightHand,
        screenWidth,
        screenHeight,
      );
      const dualGesture = gestures.find(
        (g) => g.gestureType === GestureType.DUAL_CONTROL,
      );

      expect(dualGesture).toBeDefined();
      expect(dualGesture!.confidence).toBeGreaterThan(0.5);
    });
  });

  describe("Gesture Processing and Mapping", () => {
    it("should process peace sign to drums volume control", () => {
      const peaceGesture: GestureDetectionResult = {
        gestureType: GestureType.PEACE_SIGN,
        confidence: 0.9,
        value: 0.8,
        position: { x: 0.5, y: 0.5 },
        timestamp: Date.now(),
      };

      const results = mapper.processGestures([peaceGesture], 0);

      expect(results.length).toBeGreaterThan(0);
      const drumMapping = results.find((r) => r.mapping.targetStem === "drums");
      expect(drumMapping).toBeDefined();
      expect(drumMapping!.controlType).toBe("volume");
      expect(drumMapping!.value).toBeCloseTo(0.8, 1);
    });

    it("should process rock sign to bass volume control", () => {
      const rockGesture: GestureDetectionResult = {
        gestureType: GestureType.ROCK_SIGN,
        confidence: 0.85,
        value: 0.6,
        position: { x: 0.5, y: 0.5 },
        timestamp: Date.now(),
      };

      const results = mapper.processGestures([rockGesture], 0);

      const bassMapping = results.find((r) => r.mapping.targetStem === "bass");
      expect(bassMapping).toBeDefined();
      expect(bassMapping!.controlType).toBe("volume");
      expect(bassMapping!.value).toBeCloseTo(0.6, 1);
    });

    it("should process fist to mute control", () => {
      const fistGesture: GestureDetectionResult = {
        gestureType: GestureType.FIST,
        confidence: 0.9,
        value: 1.0,
        position: { x: 0.5, y: 0.5 },
        timestamp: Date.now(),
      };

      const results = mapper.processGestures([fistGesture], 0);

      const muteMapping = results.find((r) => r.mapping.controlType === "mute");
      expect(muteMapping).toBeDefined();
      expect(muteMapping!.value).toBe(1.0);
    });

    it("should process multiple gestures simultaneously", () => {
      const gestures: GestureDetectionResult[] = [
        {
          gestureType: GestureType.PEACE_SIGN,
          confidence: 0.9,
          value: 0.8,
          position: { x: 0.3, y: 0.5 },
          timestamp: Date.now(),
        },
        {
          gestureType: GestureType.ROCK_SIGN,
          confidence: 0.8,
          value: 0.6,
          position: { x: 0.7, y: 0.5 },
          timestamp: Date.now(),
        },
      ];

      const results = mapper.processGestures(gestures, 0);

      expect(results.length).toBeGreaterThanOrEqual(2);

      const drumMapping = results.find((r) => r.mapping.targetStem === "drums");
      const bassMapping = results.find((r) => r.mapping.targetStem === "bass");

      expect(drumMapping).toBeDefined();
      expect(bassMapping).toBeDefined();
    });
  });

  describe("Control Modes", () => {
    it("should support absolute control mode", () => {
      const mappingId = DEFAULT_GESTURE_MAPPINGS.PEACE_TO_DRUMS;
      mapper.setControlMode(mappingId, ControlMode.ABSOLUTE);

      const gesture: GestureDetectionResult = {
        gestureType: GestureType.PEACE_SIGN,
        confidence: 0.9,
        value: 0.7,
        position: { x: 0.5, y: 0.5 },
        timestamp: Date.now(),
      };

      const results = mapper.processGestures([gesture], 0);
      const drumMapping = results.find((r) => r.mapping.targetStem === "drums");

      expect(drumMapping).toBeDefined();
      expect(drumMapping!.value).toBeCloseTo(0.7, 1);
    });

    it("should support relative control mode", () => {
      const mappingId = DEFAULT_GESTURE_MAPPINGS.PEACE_TO_DRUMS;
      mapper.setControlMode(mappingId, ControlMode.RELATIVE);

      // First gesture to establish baseline
      const gesture1: GestureDetectionResult = {
        gestureType: GestureType.PEACE_SIGN,
        confidence: 0.9,
        value: 0.5,
        position: { x: 0.5, y: 0.5 },
        timestamp: Date.now(),
      };

      mapper.processGestures([gesture1], 0);

      // Second gesture should show relative change
      const gesture2: GestureDetectionResult = {
        gestureType: GestureType.PEACE_SIGN,
        confidence: 0.9,
        value: 0.7, // +0.2 increase
        position: { x: 0.5, y: 0.5 },
        timestamp: Date.now() + 100,
      };

      const results = mapper.processGestures([gesture2], 0);
      const drumMapping = results.find((r) => r.mapping.targetStem === "drums");

      expect(drumMapping).toBeDefined();
      // Should be different from absolute value due to relative processing
      expect(drumMapping!.value).not.toBeCloseTo(0.7, 1);
    });
  });

  describe("Mapping Profiles", () => {
    it("should create and switch between profiles", () => {
      const customProfile: MappingProfile = {
        id: "custom",
        name: "Custom Profile",
        description: "Test custom mappings",
        mappings: [
          {
            id: "custom-mapping",
            name: "Custom Peace → Bass",
            description: "Peace sign controls bass instead of drums",
            targetStem: "bass",
            controlType: "volume",
            handRequirement: "any",
            gestureType: GestureType.PEACE_SIGN,
          },
        ],
        isActive: false,
      };

      mapper.addProfile(customProfile);
      const success = mapper.setActiveProfile("custom");

      expect(success).toBe(true);

      const activeProfile = mapper.getActiveProfile();
      expect(activeProfile).toBeDefined();
      expect(activeProfile!.id).toBe("custom");
      expect(activeProfile!.mappings.length).toBe(1);
    });

    it("should process gestures with custom profile mappings", () => {
      const customProfile: MappingProfile = {
        id: "custom",
        name: "Custom Profile",
        description: "Test custom mappings",
        mappings: [
          {
            id: "custom-peace-bass",
            name: "Peace → Bass",
            description: "Peace sign controls bass volume",
            targetStem: "bass",
            controlType: "volume",
            handRequirement: "any",
            gestureType: GestureType.PEACE_SIGN,
          },
        ],
        isActive: false,
      };

      mapper.addProfile(customProfile);
      mapper.setActiveProfile("custom");

      const peaceGesture: GestureDetectionResult = {
        gestureType: GestureType.PEACE_SIGN,
        confidence: 0.9,
        value: 0.8,
        position: { x: 0.5, y: 0.5 },
        timestamp: Date.now(),
      };

      const results = mapper.processGestures([peaceGesture], 0);

      expect(results.length).toBe(1);
      expect(results[0].mapping.targetStem).toBe("bass");
      expect(results[0].controlType).toBe("volume");
    });
  });

  describe("Performance and Latency", () => {
    it("should process gestures within latency target", async () => {
      const leftHand = createPeaceSignHand("Left");
      const rightHand = createRockSignHand("Right");

      const startTime = performance.now();
      const gestures = mapper.detectGestures(leftHand, rightHand, 1920, 1080);
      mapper.processGestures(gestures, 0);
      const endTime = performance.now();

      const processingTime = endTime - startTime;
      expect(processingTime).toBeLessThan(50); // 50ms target
    });

    it("should handle high-frequency gesture updates", () => {
      const gestureUpdates = Array.from({ length: 100 }, (_, i) => ({
        gestureType: GestureType.PEACE_SIGN,
        confidence: 0.9,
        value: i / 100,
        position: { x: 0.5, y: 0.5 },
        timestamp: Date.now() + i,
      }));

      const startTime = performance.now();

      gestureUpdates.forEach((gesture) => {
        mapper.processGestures([gesture], 0);
      });

      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const averageTime = totalTime / gestureUpdates.length;

      expect(averageTime).toBeLessThan(1); // < 1ms per gesture on average
    });

    it("should track latency metrics", () => {
      const leftHand = createPeaceSignHand("Left");
      mapper.detectGestures(leftHand, null, 1920, 1080);

      const latency = mapper.getLatency();
      expect(latency).toBeGreaterThanOrEqual(0);
      expect(latency).toBeLessThan(100); // Reasonable upper bound
    });
  });

  describe("Feedback System", () => {
    it("should provide feedback state", () => {
      const leftHand = createPeaceSignHand("Left");
      const rightHand = createRockSignHand("Right");

      mapper.detectGestures(leftHand, rightHand, 1920, 1080);

      const feedback = mapper.getFeedbackState();
      expect(feedback).toBeDefined();
      expect(feedback.activeGestures.length).toBeGreaterThan(0);
      expect(feedback.confidence).toBeGreaterThan(0);
      expect(feedback.latency).toBeGreaterThanOrEqual(0);
    });

    it("should update stem indicators based on active gestures", () => {
      const peaceGesture: GestureDetectionResult = {
        gestureType: GestureType.PEACE_SIGN,
        confidence: 0.9,
        value: 0.8,
        position: { x: 0.5, y: 0.5 },
        timestamp: Date.now(),
      };

      mapper.processGestures([peaceGesture], 0);

      const feedback = mapper.getFeedbackState();
      expect(feedback.stemIndicators.drums).toBe(true);
      expect(feedback.activeMappings.length).toBeGreaterThan(0);
    });
  });

  describe("Error Handling and Edge Cases", () => {
    it("should handle invalid hand data gracefully", () => {
      const invalidHand = {
        landmarks: [], // Empty landmarks
        handedness: "Left" as const,
        confidence: 0.9,
      };

      expect(() => {
        mapper.detectGestures(invalidHand, null, 1920, 1080);
      }).not.toThrow();
    });

    it("should handle low confidence gestures", () => {
      const lowConfidenceHand = createPeaceSignHand("Left");
      lowConfidenceHand.confidence = 0.3; // Below threshold

      const gestures = mapper.detectGestures(
        lowConfidenceHand,
        null,
        1920,
        1080,
      );

      // Should either filter out low confidence or process with lower confidence
      gestures.forEach((gesture) => {
        expect(gesture.confidence).toBeGreaterThan(0);
      });
    });

    it("should handle screen dimension edge cases", () => {
      const leftHand = createPeaceSignHand("Left");

      // Test with very small dimensions
      expect(() => {
        mapper.detectGestures(leftHand, null, 1, 1);
      }).not.toThrow();

      // Test with very large dimensions
      expect(() => {
        mapper.detectGestures(leftHand, null, 10000, 10000);
      }).not.toThrow();
    });

    it("should clean up resources on dispose", () => {
      const eventCallback = jest.fn();
      mapper.on("gestureControl", eventCallback);

      mapper.dispose();

      // After disposal, feedback should be empty/reset
      const feedback = mapper.getFeedbackState();
      expect(feedback.activeGestures.length).toBe(0);
      expect(feedback.activeMappings.length).toBe(0);
    });
  });

  describe("Configuration and Customization", () => {
    it("should allow sensitivity adjustment", () => {
      const mappingId = DEFAULT_GESTURE_MAPPINGS.PEACE_TO_DRUMS;

      mapper.setSensitivity(mappingId, 2.0); // High sensitivity

      // Sensitivity changes should affect relative mode processing
      mapper.setControlMode(mappingId, ControlMode.RELATIVE);

      const gesture: GestureDetectionResult = {
        gestureType: GestureType.PEACE_SIGN,
        confidence: 0.9,
        value: 0.1, // Small change
        position: { x: 0.5, y: 0.5 },
        timestamp: Date.now(),
      };

      // This should work without throwing
      expect(() => {
        mapper.processGestures([gesture], 0);
      }).not.toThrow();
    });

    it("should allow deadzone adjustment", () => {
      const mappingId = DEFAULT_GESTURE_MAPPINGS.PEACE_TO_DRUMS;

      mapper.setDeadzone(mappingId, 0.1); // 10% deadzone

      const smallChangeGesture: GestureDetectionResult = {
        gestureType: GestureType.PEACE_SIGN,
        confidence: 0.9,
        value: 0.05, // Within deadzone
        position: { x: 0.5, y: 0.5 },
        timestamp: Date.now(),
      };

      const results = mapper.processGestures([smallChangeGesture], 0);

      // Small changes within deadzone should be filtered out
      expect(results.length).toBe(0);
    });
  });
});
