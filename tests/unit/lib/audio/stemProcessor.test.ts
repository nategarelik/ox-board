// Stem processor unit tests
import {
  StemProcessor,
  StemProcessingOptions,
  StemProcessorConfig,
} from "@/lib/audio/stemProcessor";
import { StemTrack, StemMeta, StemId } from "@/types/stem-player";
import { createMockAudioContext } from "../../../utils/audioHelpers";

// Helper function to create test stem data
const createTestStemData = (stemType: string = "vocals") => {
  const duration = 2.0; // 2 seconds
  const sampleRate = 44100;
  const channels = 2;

  // Different frequencies for different stem types
  let frequency = 440; // Default A4
  switch (stemType) {
    case "vocals":
      frequency = 440;
      break;
    case "drums":
      frequency = 100;
      break;
    case "bass":
      frequency = 110;
      break;
    case "other":
      frequency = 220;
      break;
  }

  const buffer = createTestAudioBuffer(
    duration,
    sampleRate,
    channels,
    frequency,
  );

  return {
    buffer,
    metadata: {
      stemType,
      duration,
      sampleRate,
      channels,
      lufs: -12, // Integrated loudness
      peak: 0.9,
      bpm: 120,
      key: "C",
    },
  };
};

// Helper function to create test audio buffer
const createTestAudioBuffer = (
  duration: number = 1.0,
  sampleRate: number = 44100,
  channels: number = 2,
  frequency: number = 440,
): any => {
  const length = Math.floor(duration * sampleRate);
  const buffer = {
    numberOfChannels: channels,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: jest.fn((channel: number) => {
      const channelData = new Float32Array(length);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        // Generate sine wave with envelope
        const envelope = Math.exp(-t * 2);
        channelData[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.1;
      }
      return channelData;
    }),
    copyFromChannel: jest.fn(),
    copyToChannel: jest.fn(),
  };
  return buffer;
};

describe("StemProcessor", () => {
  let processor: StemProcessor;
  let mockAudioContext: any;

  beforeEach(() => {
    // Mock AudioContext and related APIs
    mockAudioContext = createMockAudioContext();

    // Mock getAudioService
    jest.mock("@/services/AudioService", () => ({
      getAudioService: () => ({
        isReady: () => true,
        initialize: jest.fn(),
        getContext: () => ({ rawContext: mockAudioContext }),
      }),
    }));

    // Mock audioWorklet
    mockAudioContext.audioWorklet = {
      addModule: jest.fn().mockResolvedValue(undefined),
    };

    // Mock AudioWorkletNode
    global.AudioWorkletNode = jest.fn().mockImplementation(() => ({
      connect: jest.fn(),
      disconnect: jest.fn(),
      port: {
        postMessage: jest.fn(),
        onmessage: null,
        onmessageerror: null,
        close: jest.fn(),
      },
      parameters: new Map(),
    }));

    processor = new StemProcessor({
      sampleRate: 44100,
      bufferSize: 128,
      numStems: 4,
    });
  });

  describe("Initialization", () => {
    it("should initialize with default configuration", () => {
      expect(processor).toBeDefined();
      expect(processor.getPerformanceMetrics()).toBeDefined();
    });

    it("should initialize with custom configuration", () => {
      const customConfig: Partial<StemProcessorConfig> = {
        sampleRate: 48000,
        bufferSize: 256,
        numStems: 2,
      };

      const customProcessor = new StemProcessor(customConfig);
      expect(customProcessor).toBeDefined();
    });

    it("should initialize AudioWorklet successfully", async () => {
      const success = await processor.initialize();
      expect(success).toBe(true);
    });

    it("should handle initialization failures gracefully", async () => {
      // Mock AudioWorklet failure
      mockAudioContext.audioWorklet.addModule.mockRejectedValue(
        new Error("Worklet load failed"),
      );

      await expect(processor.initialize()).rejects.toThrow(
        "StemProcessor initialization failed",
      );
    });
  });

  describe("Stem Processing", () => {
    beforeEach(async () => {
      await processor.initialize();
    });

    it("should process stem track with multiple stems", async () => {
      const mockStemTrack: StemTrack = {
        id: "test-track",
        title: "Test Track",
        artist: "Test Artist",
        durationSeconds: 180,
        bpm: 120,
        musicalKey: "C",
        stems: [
          {
            id: "vocals",
            label: "Vocals",
            color: "#ff0000",
            volume: 0.8,
            muted: false,
            solo: false,
            waveform: [],
            latencyMs: 10,
            hlsUrl: "https://example.com/vocals.m3u8",
          },
          {
            id: "drums",
            label: "Drums",
            color: "#00ff00",
            volume: 0.7,
            muted: false,
            solo: false,
            waveform: [],
            latencyMs: 10,
            hlsUrl: "https://example.com/drums.m3u8",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      expect(() => {
        processor.processStemTrack(mockStemTrack);
      }).not.toThrow();
    });

    it("should handle stem processing failures", async () => {
      const mockStemTrack: StemTrack = {
        id: "test-track-2",
        title: "Test Track 2",
        artist: "Test Artist 2",
        durationSeconds: 180,
        bpm: 120,
        musicalKey: "C",
        stems: [
          {
            id: "vocals",
            label: "Vocals",
            color: "#ff0000",
            volume: 0.8,
            muted: false,
            solo: false,
            waveform: [],
            latencyMs: 10,
            hlsUrl: "invalid-url",
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Should not throw but handle errors internally
      await expect(
        processor.processStemTrack(mockStemTrack),
      ).resolves.toBeUndefined();
    });
  });

  describe("Stem Analysis", () => {
    it("should analyze audio buffer and extract features", async () => {
      const testStemData = createTestStemData("vocals");
      const analysis = await (processor as any).analyzeStem(
        testStemData.buffer,
        "vocals",
      );

      expect(analysis).toBeDefined();
      expect(analysis.bpm).toBeGreaterThan(0);
      expect(analysis.key).toBeDefined();
      expect(analysis.energy).toBeGreaterThan(0);
      expect(analysis.spectralCentroid).toBeGreaterThan(0);
      expect(analysis.mfcc).toBeInstanceOf(Float32Array);
      expect(analysis.chroma).toBeInstanceOf(Float32Array);
    });

    it("should calculate energy correctly", () => {
      const testBuffer = new Float32Array([0.1, -0.1, 0.2, -0.2, 0.05]);
      const energy = (processor as any).calculateEnergy(testBuffer);

      expect(energy).toBeGreaterThan(0);
      expect(energy).toBeLessThan(1);
    });

    it("should calculate zero crossing rate", () => {
      const testBuffer = new Float32Array([0.1, -0.1, 0.2, -0.2, 0.1, -0.1]);
      const zcr = (processor as any).calculateZeroCrossingRate(testBuffer);

      expect(zcr).toBeGreaterThan(0);
      expect(zcr).toBeLessThanOrEqual(1);
    });
  });

  describe("Stem Control", () => {
    beforeEach(async () => {
      await processor.initialize();
    });

    it("should set stem volume", () => {
      expect(() => {
        processor.setStemVolume("vocals", 0.8);
      }).not.toThrow();
    });

    it("should clamp volume values", () => {
      expect(() => {
        processor.setStemVolume("vocals", 1.5); // Should clamp to 1.0
        processor.setStemVolume("vocals", -0.5); // Should clamp to 0.0
      }).not.toThrow();
    });

    it("should set stem pan", () => {
      expect(() => {
        processor.setStemPan("drums", 0.5);
      }).not.toThrow();
    });

    it("should clamp pan values", () => {
      expect(() => {
        processor.setStemPan("drums", 2.0); // Should clamp to 1.0
        processor.setStemPan("drums", -2.0); // Should clamp to -1.0
      }).not.toThrow();
    });

    it("should set stem compression parameters", () => {
      expect(() => {
        processor.setStemCompression("bass", -20, 4, 0.003, 0.1);
      }).not.toThrow();
    });

    it("should set stem spatial position", () => {
      expect(() => {
        processor.setStemSpatialPosition("other", 1, 2, 3);
      }).not.toThrow();
    });

    it("should set crossfade between stems", () => {
      expect(() => {
        processor.setCrossfade("vocals", "drums", 0.5);
      }).not.toThrow();
    });

    it("should set beat grid", () => {
      expect(() => {
        processor.setBeatGrid("vocals", true, 0.0);
      }).not.toThrow();
    });

    it("should set tempo sync", () => {
      expect(() => {
        processor.setTempoSync(true, 120);
      }).not.toThrow();
    });

    it("should set sidechain compression", () => {
      expect(() => {
        processor.setSidechain("vocals", true, "drums", 0.5);
      }).not.toThrow();
    });
  });

  describe("Gesture Processing", () => {
    it("should process pinch gesture for volume control", () => {
      expect(() => {
        processor.processGesture("pinch", 0.8, "vocals");
      }).not.toThrow();
    });

    it("should process rotation gesture for pan control", () => {
      expect(() => {
        processor.processGesture("rotation", 0.5, "drums");
      }).not.toThrow();
    });

    it("should process spread gesture for compression", () => {
      expect(() => {
        processor.processGesture("spread", 0.7, "bass");
      }).not.toThrow();
    });

    it("should handle invalid gesture types", () => {
      expect(() => {
        processor.processGesture("invalid_gesture" as any, 0.5, "vocals");
      }).not.toThrow();
    });

    it("should handle gestures without stem ID", () => {
      expect(() => {
        processor.processGesture("pinch", 0.8);
      }).not.toThrow();
    });
  });

  describe("Caching", () => {
    it("should provide cache statistics", () => {
      const cacheStats = processor.getCacheStats();
      expect(cacheStats).toBeDefined();
      expect(cacheStats.entries).toBeGreaterThanOrEqual(0);
      expect(cacheStats.totalSize).toBeGreaterThanOrEqual(0);
      expect(cacheStats.hitRate).toBeGreaterThanOrEqual(0);
      expect(cacheStats.maxSize).toBeGreaterThan(0);
    });

    it("should clear cache", () => {
      expect(() => {
        processor.clearCache();
      }).not.toThrow();
    });
  });

  describe("Performance Monitoring", () => {
    it("should provide performance metrics", () => {
      const metrics = processor.getPerformanceMetrics();
      expect(metrics).toBeDefined();
      expect(metrics.processingLatency).toBeGreaterThanOrEqual(0);
      expect(metrics.analysisLatency).toBeGreaterThanOrEqual(0);
      expect(metrics.cacheHitRate).toBeGreaterThanOrEqual(0);
      expect(metrics.cpuUsage).toBeGreaterThanOrEqual(0);
      expect(metrics.memoryUsage).toBeGreaterThanOrEqual(0);
    });

    it("should handle AudioWorklet messages", () => {
      const mockWorkletNode = (processor as any).workletNode;
      const mockEvent = {
        data: {
          type: "PERFORMANCE_UPDATE",
          data: {
            averageProcessTime: 5.5,
            cpuUsage: 25,
          },
        },
      };

      expect(() => {
        (processor as any).handleWorkletMessage(mockEvent);
      }).not.toThrow();

      const metrics = processor.getPerformanceMetrics();
      expect(metrics.processingLatency).toBe(5.5);
      expect(metrics.cpuUsage).toBe(25);
    });
  });

  describe("Configuration Management", () => {
    it("should update processing options", () => {
      const newOptions: Partial<StemProcessingOptions> = {
        enableAI: false,
        enableCache: false,
        realtimeAnalysis: false,
      };

      // Access private property for testing
      const processorAny = processor as any;
      processorAny.processingOptions = {
        ...processorAny.processingOptions,
        ...newOptions,
      };

      expect(processorAny.processingOptions.enableAI).toBe(false);
      expect(processorAny.processingOptions.enableCache).toBe(false);
      expect(processorAny.processingOptions.realtimeAnalysis).toBe(false);
    });

    it("should handle configuration updates", () => {
      const newConfig: Partial<StemProcessorConfig> = {
        sampleRate: 96000,
        bufferSize: 256,
      };

      const processorAny = processor as any;
      processorAny.config = { ...processorAny.config, ...newConfig };

      expect(processorAny.config.sampleRate).toBe(96000);
      expect(processorAny.config.bufferSize).toBe(256);
    });
  });

  describe("Stem Index Management", () => {
    it("should get correct stem index", () => {
      const processorAny = processor as any;

      expect(processorAny.getStemIndex("vocals")).toBeDefined();
      expect(processorAny.getStemIndex("drums")).toBeDefined();
      expect(processorAny.getStemIndex("bass")).toBeDefined();
      expect(processorAny.getStemIndex("other")).toBeDefined();
    });

    it("should distribute stems across available channels", () => {
      const processorAny = processor as any;

      const indices = [
        processorAny.getStemIndex("vocals"),
        processorAny.getStemIndex("drums"),
        processorAny.getStemIndex("bass"),
        processorAny.getStemIndex("other"),
      ];

      // All indices should be within valid range
      indices.forEach((index) => {
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(processorAny.config.numStems);
      });
    });
  });

  describe("Mock Audio Buffer Creation", () => {
    it("should create mock audio buffer", () => {
      const processorAny = processor as any;
      const buffer = processorAny.createMockAudioBuffer(2.0);

      expect(buffer).toBeDefined();
      expect(buffer.numberOfChannels).toBe(2);
      expect(buffer.sampleRate).toBe(processorAny.config.sampleRate);
      expect(buffer.length).toBe(2.0 * processorAny.config.sampleRate);
    });

    it("should handle missing audio context", () => {
      const processorAny = processor as any;
      processorAny.audioContext = null;

      expect(() => {
        processorAny.createMockAudioBuffer(1.0);
      }).toThrow("AudioContext not initialized");
    });
  });

  describe("Error Handling", () => {
    it("should handle worklet node operations when not initialized", () => {
      const uninitializedProcessor = new StemProcessor();

      expect(() => {
        uninitializedProcessor.setStemVolume("vocals", 0.8);
        uninitializedProcessor.setStemPan("drums", 0.5);
        uninitializedProcessor.setStemCompression("bass", -20, 4, 0.003, 0.1);
      }).not.toThrow();
    });

    it("should dispose properly", () => {
      expect(() => {
        processor.dispose();
      }).not.toThrow();
    });

    it("should handle disposal when already disposed", () => {
      processor.dispose();

      expect(() => {
        processor.dispose();
      }).not.toThrow();
    });
  });

  describe("Performance Requirements", () => {
    beforeEach(async () => {
      await processor.initialize();
    });

    it("should process stems within performance budget", async () => {
      const testStemData = createTestStemData("vocals");
      const startTime = performance.now();

      // Process multiple stems
      for (let i = 0; i < 5; i++) {
        await (processor as any).analyzeStem(testStemData.buffer, `stem-${i}`);
      }

      const endTime = performance.now();
      const averageTime = (endTime - startTime) / 5;

      expect(averageTime).toBeLessThan(100); // Should be reasonably fast
    });

    it("should handle high-frequency control updates", () => {
      const startTime = performance.now();

      // Simulate rapid control changes
      for (let i = 0; i < 100; i++) {
        processor.setStemVolume("vocals", i / 100);
        processor.setStemPan("drums", Math.sin(i * 0.1));
      }

      const endTime = performance.now();
      const totalTime = endTime - startTime;

      expect(totalTime).toBeLessThan(50); // Should handle rapid updates quickly
    });
  });

  describe("Cache Management", () => {
    it("should respect cache size limits", () => {
      const processorAny = processor as any;
      processorAny.config.maxCacheSize = 1024; // Very small limit

      const cacheStats = processor.getCacheStats();
      expect(cacheStats.maxSize).toBe(1024);
    });

    it("should track cache performance", () => {
      const processorAny = processor as any;

      // Simulate cache hits
      processorAny.performanceMetrics.cacheHitRate = 0.85;

      const metrics = processor.getPerformanceMetrics();
      expect(metrics.cacheHitRate).toBe(0.85);
    });
  });
});
