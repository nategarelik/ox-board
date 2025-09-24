/**
 * Tests for MusicAnalyzerClient
 *
 * Tests the client interface to the music analyzer worker:
 * - Worker communication
 * - Promise-based API
 * - Request management
 * - Performance monitoring
 * - Error handling
 */

import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  jest,
} from "@jest/globals";
import { MusicAnalyzerClient } from "@/lib/audio/musicAnalyzerClient";

// Mock Worker
class MockWorker {
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;

  private messageHandlers: Array<(event: MessageEvent) => void> = [];

  constructor(url: string | URL, options?: WorkerOptions) {
    // Simulate worker initialization
    setTimeout(() => {
      this.simulateMessage({
        id: "init",
        type: "init",
        success: true,
        result: {},
        timestamp: Date.now(),
      });
    }, 10);
  }

  postMessage(data: any) {
    // Simulate worker processing
    setTimeout(() => {
      this.simulateAnalysisResponse(data);
    }, 50);
  }

  terminate() {
    this.onmessage = null;
    this.onerror = null;
    this.messageHandlers = [];
  }

  // Test utilities
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage({ data } as MessageEvent);
    }
  }

  simulateError(error: string) {
    if (this.onerror) {
      this.onerror({ message: error } as ErrorEvent);
    }
  }

  private simulateAnalysisResponse(request: any) {
    const response = {
      id: request.id,
      type: request.type,
      success: true,
      processingTime: 25,
      timestamp: Date.now(),
      result: this.generateMockResult(request.type),
    };

    this.simulateMessage(response);
  }

  private generateMockResult(type: string): any {
    switch (type) {
      case "bpm":
        return {
          bpm: 128,
          confidence: 0.85,
          beatGrid: [0.5, 1.0, 1.5, 2.0, 2.5],
          downbeats: [0.5, 2.5],
          phase: 0.25,
          timeSignature: [4, 4],
        };

      case "key":
        return {
          key: "C",
          scale: "major",
          confidence: 0.8,
          chroma: new Float32Array(12).fill(0.1),
          keyStrength: 0.8,
        };

      case "spectral":
        return {
          energy: 0.6,
          centroid: 2000,
          rolloff: 4000,
          bandwidth: 1500,
          flatness: 0.3,
          flux: 0.2,
          rms: 0.4,
          zcr: 0.1,
        };

      case "onsets":
        return {
          onsets: [0.1, 0.5, 1.0, 1.5],
          strength: [0.8, 0.9, 0.7, 0.8],
          novelty: new Float32Array(100).fill(0.3),
          peaks: [0.5, 1.0, 1.5],
        };

      case "beatphase":
        return {
          phase: 0.3,
          nextBeatTime: 1.2,
          beatInterval: 0.46875,
          confidence: 0.9,
        };

      case "analyze":
        return {
          bpm: this.generateMockResult("bpm"),
          key: this.generateMockResult("key"),
          spectral: this.generateMockResult("spectral"),
          onsets: this.generateMockResult("onsets"),
          harmonic: {
            harmonicChangeRate: 0.2,
            inharmonicity: 0.1,
            oddToEvenRatio: 1.2,
            tristimulus: [0.4, 0.3, 0.3],
          },
          phrases: {
            phrases: [
              { start: 0, end: 8, length: 8, type: "verse" },
              { start: 8, end: 16, length: 8, type: "chorus" },
            ],
            structure: ["verse", "chorus"],
          },
          mixing: {
            compatibleKeys: ["C major", "G major", "A minor"],
            bpmRange: [120, 136],
            energyMatch: 0.6,
            harmonyScore: 0.7,
            transitionPoints: [8, 16, 32],
          },
          duration: 30,
          timestamp: Date.now(),
        };

      case "realtime":
        return {
          bpm: this.generateMockResult("bpm"),
          spectral: this.generateMockResult("spectral"),
          timestamp: Date.now(),
        };

      default:
        return {};
    }
  }
}

// Mock Worker constructor
global.Worker = MockWorker as any;

// Mock URL constructor for worker
(global as any).URL = class MockURL {
  constructor(
    public href: string,
    public base?: string,
  ) {
    this.href = href;
  }

  static createObjectURL = jest.fn(() => "blob:mock-url");
  static revokeObjectURL = jest.fn();
};

// Mock import.meta for ES modules
Object.defineProperty(globalThis, "import", {
  value: {
    meta: {
      url: "file:///test",
    },
  },
  configurable: true,
});

describe("MusicAnalyzerClient", () => {
  let client: MusicAnalyzerClient;
  let testAudioBuffer: Float32Array;

  beforeEach(async () => {
    // Create test audio buffer
    testAudioBuffer = new Float32Array(44100); // 1 second
    for (let i = 0; i < testAudioBuffer.length; i++) {
      testAudioBuffer[i] = Math.sin((2 * Math.PI * 440 * i) / 44100) * 0.5;
    }

    client = new MusicAnalyzerClient();

    // Wait for worker initialization
    await new Promise((resolve) => setTimeout(resolve, 20));
  });

  afterEach(() => {
    if (client) {
      client.destroy();
    }
  });

  describe("Initialization", () => {
    it("should initialize worker successfully", () => {
      expect(client).toBeDefined();

      const status = client.getStatus();
      expect(status.isInitialized).toBe(true);
      expect(status.queueSize).toBe(0);
    });

    it("should handle worker initialization errors", () => {
      const errorClient = new MusicAnalyzerClient();

      // Simulate worker error during initialization
      setTimeout(() => {
        (errorClient as any).worker?.simulateError(
          "Worker initialization failed",
        );
      }, 5);

      // Should not throw, but worker should be marked as not initialized
      expect(() => errorClient.destroy()).not.toThrow();
    });
  });

  describe("BPM Analysis", () => {
    it("should extract BPM from audio", async () => {
      const result = await client.extractBPM(testAudioBuffer);

      expect(result).toBeDefined();
      expect(result.bpm).toBe(128);
      expect(result.confidence).toBe(0.85);
      expect(result.beatGrid).toBeInstanceOf(Array);
      expect(result.beatGrid.length).toBeGreaterThan(0);
      expect(result.downbeats).toBeInstanceOf(Array);
      expect(result.timeSignature).toEqual([4, 4]);
    });

    it("should handle different sample rates", async () => {
      const result = await client.extractBPM(testAudioBuffer, 48000);

      expect(result).toBeDefined();
      expect(result.bpm).toBeGreaterThan(0);
    });

    it("should track analysis statistics", async () => {
      const initialStats = client.getStatus().stats;

      await client.extractBPM(testAudioBuffer);

      const finalStats = client.getStatus().stats;
      expect(finalStats.totalRequests).toBe(initialStats.totalRequests + 1);
      expect(finalStats.successfulRequests).toBe(
        initialStats.successfulRequests + 1,
      );
      expect(finalStats.averageProcessingTime).toBeGreaterThan(0);
    });
  });

  describe("Key Detection", () => {
    it("should detect musical key", async () => {
      const result = await client.detectKey(testAudioBuffer);

      expect(result).toBeDefined();
      expect(result.key).toBe("C");
      expect(result.scale).toBe("major");
      expect(result.confidence).toBe(0.8);
      expect(result.chroma).toBeInstanceOf(Float32Array);
      expect(result.chroma.length).toBe(12);
    });

    it("should provide key strength", async () => {
      const result = await client.detectKey(testAudioBuffer);

      expect(result.keyStrength).toBeGreaterThanOrEqual(0);
      expect(result.keyStrength).toBeLessThanOrEqual(1);
    });
  });

  describe("Spectral Analysis", () => {
    it("should calculate spectral features", async () => {
      const result = await client.getSpectralFeatures(testAudioBuffer);

      expect(result).toBeDefined();
      expect(result.energy).toBe(0.6);
      expect(result.centroid).toBe(2000);
      expect(result.rolloff).toBe(4000);
      expect(result.bandwidth).toBe(1500);
      expect(result.flatness).toBe(0.3);
      expect(result.flux).toBe(0.2);
      expect(result.rms).toBe(0.4);
      expect(result.zcr).toBe(0.1);
    });

    it("should validate spectral feature ranges", async () => {
      const result = await client.getSpectralFeatures(testAudioBuffer);

      expect(result.energy).toBeGreaterThanOrEqual(0);
      expect(result.centroid).toBeGreaterThanOrEqual(0);
      expect(result.rms).toBeGreaterThanOrEqual(0);
      expect(result.rms).toBeLessThanOrEqual(1);
      expect(result.zcr).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Onset Detection", () => {
    it("should detect onsets", async () => {
      const result = await client.detectOnsets(testAudioBuffer);

      expect(result).toBeDefined();
      expect(result.onsets).toBeInstanceOf(Array);
      expect(result.onsets.length).toBeGreaterThan(0);
      expect(result.strength).toBeInstanceOf(Array);
      expect(result.strength.length).toBe(result.onsets.length);
      expect(result.novelty).toBeInstanceOf(Float32Array);
      expect(result.peaks).toBeInstanceOf(Array);
    });

    it("should provide onset strengths", async () => {
      const result = await client.detectOnsets(testAudioBuffer);

      result.strength.forEach((strength) => {
        expect(strength).toBeGreaterThanOrEqual(0);
        expect(strength).toBeLessThanOrEqual(1);
      });
    });
  });

  describe("Beat Phase Tracking", () => {
    it("should get beat phase", async () => {
      const currentTime = 1.5;
      const result = await client.getBeatPhase(testAudioBuffer, currentTime);

      expect(result).toBeDefined();
      expect(result.phase).toBe(0.3);
      expect(result.nextBeatTime).toBe(1.2);
      expect(result.beatInterval).toBe(0.46875);
      expect(result.confidence).toBe(0.9);
    });

    it("should validate beat phase values", async () => {
      const result = await client.getBeatPhase(testAudioBuffer, 1.0);

      expect(result.phase).toBeGreaterThanOrEqual(0);
      expect(result.phase).toBeLessThanOrEqual(1);
      expect(result.nextBeatTime).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe("Complete Track Analysis", () => {
    it("should analyze complete track", async () => {
      const result = await client.analyzeTrack(testAudioBuffer);

      expect(result).toBeDefined();
      expect(result.bpm).toBeDefined();
      expect(result.key).toBeDefined();
      expect(result.spectral).toBeDefined();
      expect(result.onsets).toBeDefined();
      expect(result.harmonic).toBeDefined();
      expect(result.phrases).toBeDefined();
      expect(result.mixing).toBeDefined();
      expect(result.duration).toBe(30);
      expect(result.timestamp).toBeGreaterThan(0);
    });

    it("should respect analysis options", async () => {
      const options = {
        minBPM: 100,
        maxBPM: 140,
        enablePhraseDetection: false,
      };

      const result = await client.analyzeTrack(testAudioBuffer, 44100, options);

      expect(result).toBeDefined();
      // Options are passed to worker, mock returns standard result
      expect(result.bpm).toBeDefined();
    });

    it("should provide mixing suggestions", async () => {
      const result = await client.analyzeTrack(testAudioBuffer);

      expect(result.mixing.compatibleKeys).toContain("C major");
      expect(result.mixing.bpmRange).toEqual([120, 136]);
      expect(result.mixing.energyMatch).toBe(0.6);
      expect(result.mixing.harmonyScore).toBe(0.7);
      expect(result.mixing.transitionPoints).toContain(8);
    });
  });

  describe("Real-time Analysis", () => {
    it("should perform real-time analysis", async () => {
      const result = await client.analyzeRealTime(testAudioBuffer);

      expect(result).toBeDefined();
      expect(result.bpm).toBeDefined();
      expect(result.spectral).toBeDefined();
      expect(result.timestamp).toBeGreaterThan(0);

      // Should not include heavy computations
      expect(result.key).toBeUndefined();
      expect(result.onsets).toBeUndefined();
      expect(result.harmonic).toBeUndefined();
      expect(result.phrases).toBeUndefined();
    });

    it("should be faster than full analysis", async () => {
      const startReal = performance.now();
      await client.analyzeRealTime(testAudioBuffer);
      const realTimeTime = performance.now() - startReal;

      const startFull = performance.now();
      await client.analyzeTrack(testAudioBuffer);
      const fullTime = performance.now() - startFull;

      // Both should complete quickly in mock, but real-time should still be faster
      expect(realTimeTime).toBeLessThanOrEqual(fullTime);
    });
  });

  describe("Static Utility Methods", () => {
    it("should check key compatibility", () => {
      expect(MusicAnalyzerClient.isCompatibleKey("C major", "G major")).toBe(
        true,
      );
      expect(MusicAnalyzerClient.isCompatibleKey("A minor", "C major")).toBe(
        true,
      );
      expect(MusicAnalyzerClient.isCompatibleKey("C major", "F# major")).toBe(
        false,
      );
    });

    it("should calculate BPM match percentage", () => {
      expect(MusicAnalyzerClient.getBPMMatchPercentage(120, 120)).toBe(1);
      expect(MusicAnalyzerClient.getBPMMatchPercentage(120, 126)).toBeCloseTo(
        0.95,
        2,
      );
      expect(MusicAnalyzerClient.getBPMMatchPercentage(120, 140)).toBeCloseTo(
        0.857,
        2,
      );
    });

    it("should get compatible BPM range", () => {
      const [min, max] = MusicAnalyzerClient.getCompatibleBPMRange(120);

      expect(min).toBeCloseTo(112.8, 1); // 120 - 6%
      expect(max).toBeCloseTo(127.2, 1); // 120 + 6%
    });

    it("should handle edge cases in BPM matching", () => {
      expect(MusicAnalyzerClient.getBPMMatchPercentage(0, 120)).toBe(0);
      expect(MusicAnalyzerClient.getBPMMatchPercentage(120, 0)).toBe(0);
    });
  });

  describe("Request Management", () => {
    it("should handle concurrent requests", async () => {
      const promises = [
        client.extractBPM(testAudioBuffer),
        client.detectKey(testAudioBuffer),
        client.getSpectralFeatures(testAudioBuffer),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results[0]).toBeDefined(); // BPM result
      expect(results[1]).toBeDefined(); // Key result
      expect(results[2]).toBeDefined(); // Spectral result
    });

    it("should track queue size", async () => {
      // Start multiple requests
      const promise1 = client.extractBPM(testAudioBuffer);
      const promise2 = client.detectKey(testAudioBuffer);

      // Check queue size during processing
      const status = client.getStatus();
      expect(status.queueSize).toBeGreaterThan(0);

      // Wait for completion
      await Promise.all([promise1, promise2]);

      // Queue should be empty
      const finalStatus = client.getStatus();
      expect(finalStatus.queueSize).toBe(0);
    });

    it("should handle request timeout", async () => {
      // Create client with mock that doesn't respond
      const timeoutClient = new MusicAnalyzerClient();

      // Mock worker that never responds
      (timeoutClient as any).worker.postMessage = jest.fn();

      await expect(timeoutClient.extractBPM(testAudioBuffer)).rejects.toThrow(
        "Request timeout",
      );

      timeoutClient.destroy();
    });

    it("should cancel pending requests", async () => {
      // Start requests
      const promise1 = client.extractBPM(testAudioBuffer);
      const promise2 = client.detectKey(testAudioBuffer);

      // Cancel all requests
      client.cancelAll();

      await expect(promise1).rejects.toThrow("Request cancelled");
      await expect(promise2).rejects.toThrow("Request cancelled");
    });
  });

  describe("Performance Monitoring", () => {
    it("should track processing times", async () => {
      await client.extractBPM(testAudioBuffer);
      await client.detectKey(testAudioBuffer);

      const stats = client.getStatus().stats;

      expect(stats.totalRequests).toBe(2);
      expect(stats.successfulRequests).toBe(2);
      expect(stats.failedRequests).toBe(0);
      expect(stats.averageProcessingTime).toBeGreaterThan(0);
      expect(stats.lastAnalysisTime).toBeGreaterThan(0);
    });

    it("should handle analysis failures", async () => {
      // Mock worker error
      const mockWorker = (client as any).worker;
      const originalPostMessage = mockWorker.postMessage.bind(mockWorker);

      mockWorker.postMessage = function (data: any) {
        setTimeout(() => {
          this.simulateMessage({
            id: data.id,
            type: data.type,
            success: false,
            error: "Analysis failed",
            timestamp: Date.now(),
          });
        }, 10);
      };

      await expect(client.extractBPM(testAudioBuffer)).rejects.toThrow(
        "Analysis failed",
      );

      const stats = client.getStatus().stats;
      expect(stats.failedRequests).toBe(1);

      // Restore original function
      mockWorker.postMessage = originalPostMessage;
    });

    it("should clear statistics", async () => {
      await client.extractBPM(testAudioBuffer);

      let stats = client.getStatus().stats;
      expect(stats.totalRequests).toBeGreaterThan(0);

      client.clearStats();

      stats = client.getStatus().stats;
      expect(stats.totalRequests).toBe(0);
      expect(stats.successfulRequests).toBe(0);
      expect(stats.failedRequests).toBe(0);
      expect(stats.averageProcessingTime).toBe(0);
    });
  });

  describe("Error Handling", () => {
    it("should handle worker errors", async () => {
      const mockWorker = (client as any).worker;

      // Simulate worker error
      setTimeout(() => {
        mockWorker.simulateError("Worker crashed");
      }, 10);

      // Subsequent requests should be handled gracefully
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Client should attempt to recover
      expect(() => client.getStatus()).not.toThrow();
    });

    it("should handle malformed worker responses", async () => {
      const mockWorker = (client as any).worker;

      // Mock malformed response
      const originalPostMessage = mockWorker.postMessage.bind(mockWorker);
      mockWorker.postMessage = function (data: any) {
        setTimeout(() => {
          this.simulateMessage({
            id: "wrong-id",
            invalid: "response",
          });
        }, 10);
      };

      // Should handle gracefully (request will timeout)
      await expect(client.extractBPM(testAudioBuffer)).rejects.toThrow();

      mockWorker.postMessage = originalPostMessage;
    });

    it("should validate input parameters", async () => {
      const emptyBuffer = new Float32Array(0);

      // Should not throw, but pass empty buffer to worker
      await expect(client.extractBPM(emptyBuffer)).resolves.toBeDefined();
    });
  });

  describe("Resource Management", () => {
    it("should destroy worker properly", () => {
      const mockWorker = (client as any).worker;
      const terminateSpy = jest.spyOn(mockWorker, "terminate");

      client.destroy();

      expect(terminateSpy).toHaveBeenCalled();
      expect((client as any).worker).toBeNull();
      expect((client as any).isInitialized).toBe(false);
    });

    it("should handle multiple destroy calls", () => {
      client.destroy();

      expect(() => client.destroy()).not.toThrow();
    });

    it("should prevent operations after destroy", async () => {
      client.destroy();

      // Should throw or handle gracefully after destroy
      await expect(client.extractBPM(testAudioBuffer)).rejects.toThrow();
    });
  });
});
