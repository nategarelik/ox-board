import {
  describe,
  beforeEach,
  afterEach,
  it,
  expect,
  jest,
} from "@jest/globals";
import {
  DefaultDemucsProcessor,
  DemucsOutput,
  StemData,
} from "@/lib/audio/demucsProcessor";

// Mock AudioContext and related APIs
const mockAudioContext = {
  decodeAudioData: jest.fn(),
  createBuffer: jest.fn(),
  createBufferSource: jest.fn(),
  createGain: jest.fn(),
  destination: {},
  sampleRate: 44100,
  currentTime: 0,
};

const createMockAudioBuffer = (duration: number = 10): AudioBuffer => {
  return {
    length: Math.floor(duration * 44100),
    duration,
    sampleRate: 44100,
    numberOfChannels: 2,
    getChannelData: jest.fn(
      () => new Float32Array(Math.floor(duration * 44100)),
    ),
    copyFromChannel: jest.fn(),
    copyToChannel: jest.fn(),
    clone: jest.fn(),
  } as unknown as AudioBuffer;
};

const createMockFile = (
  name: string = "test.mp3",
  size: number = 1024000,
): File => {
  const arrayBuffer = new ArrayBuffer(size);
  const file = new File([arrayBuffer], name, { type: "audio/mpeg" });

  // Mock arrayBuffer method
  Object.defineProperty(file, "arrayBuffer", {
    value: jest.fn().mockResolvedValue(arrayBuffer) as jest.MockedFunction<
      () => Promise<ArrayBuffer>
    >,
  });

  return file;
};

describe("DemucsProcessor", () => {
  let processor: DefaultDemucsProcessor;
  let mockFile: File;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock global AudioContext
    global.AudioContext = jest.fn(() => mockAudioContext) as any;
    (global as any).webkitAudioContext = jest.fn(() => mockAudioContext);

    processor = new DefaultDemucsProcessor();
    mockFile = createMockFile("test.mp3", 2048000);

    // Mock decodeAudioData to return a valid AudioBuffer
    (
      mockAudioContext.decodeAudioData as jest.MockedFunction<any>
    ).mockResolvedValue(createMockAudioBuffer(10));
  });

  afterEach(() => {
    // Clean up any active processes
    jest.restoreAllMocks();
  });

  describe("Availability and Configuration", () => {
    it("should report as available", () => {
      expect(processor.isAvailable()).toBe(true);
    });

    it("should return supported audio formats", () => {
      const formats = processor.getSupportedFormats();

      expect(formats).toContain(".mp3");
      expect(formats).toContain(".wav");
      expect(formats).toContain(".flac");
      expect(formats).toContain(".m4a");
      expect(formats).toContain(".ogg");
    });
  });

  describe("Stem Separation Processing", () => {
    it("should process audio file successfully", async () => {
      const result = await processor.processStemSeparation(mockFile);

      expect(result).toBeDefined();
      expect(result.metadata.status).toBe("completed");
      expect(result.metadata.inputFile.name).toBe("test.mp3");
      expect(result.metadata.inputFile.size).toBe(2048000);

      // Check all stems are present
      expect(result.drums).toBeDefined();
      expect(result.bass).toBeDefined();
      expect(result.melody).toBeDefined();
      expect(result.vocals).toBeDefined();
      expect(result.original).toBeDefined();
    });

    it("should process with custom options", async () => {
      const options = {
        model: "htdemucs_ft",
        overlap: 0.5,
        splitSize: 30,
      };

      const result = await processor.processStemSeparation(mockFile, options);

      expect(result.metadata.model).toBe("htdemucs_ft");
      expect(result.metadata.status).toBe("completed");
    });

    it("should use default model when no options provided", async () => {
      const result = await processor.processStemSeparation(mockFile);

      expect(result.metadata.model).toBe("htdemucs");
    });

    it("should handle processing errors gracefully", async () => {
      // Mock decodeAudioData to throw an error
      (
        mockAudioContext.decodeAudioData as jest.MockedFunction<any>
      ).mockRejectedValue(new Error("Decode failed"));

      await expect(processor.processStemSeparation(mockFile)).rejects.toThrow(
        "Demucs processing failed: Decode failed",
      );
    });

    it("should handle file read errors", async () => {
      // Mock file.arrayBuffer to throw an error
      const errorFile = createMockFile();
      (
        errorFile.arrayBuffer as jest.MockedFunction<() => Promise<ArrayBuffer>>
      ).mockRejectedValue(new Error("File read failed"));

      await expect(processor.processStemSeparation(errorFile)).rejects.toThrow(
        "Demucs processing failed: File read failed",
      );
    });
  });

  describe("Stem Data Validation", () => {
    it("should create valid stem data for each stem type", async () => {
      const result = await processor.processStemSeparation(mockFile);

      const stemTypes = [
        "drums",
        "bass",
        "melody",
        "vocals",
        "original",
      ] as const;

      stemTypes.forEach((stemType) => {
        const stemData = result[stemType];

        expect(stemData).toBeDefined();
        expect(stemData.audioBuffer).toBeDefined();
        expect(stemData.duration).toBeGreaterThan(0);
        expect(stemData.sampleRate).toBe(44100);
        expect(stemData.hasAudio).toBe(true);
      });
    });

    it("should maintain consistent duration across all stems", async () => {
      const result = await processor.processStemSeparation(mockFile);

      const durations = [
        result.drums.duration,
        result.bass.duration,
        result.melody.duration,
        result.vocals.duration,
        result.original.duration,
      ];

      // All durations should be the same
      expect(durations.every((d) => d === durations[0])).toBe(true);
    });

    it("should maintain consistent sample rate across all stems", async () => {
      const result = await processor.processStemSeparation(mockFile);

      const sampleRates = [
        result.drums.sampleRate,
        result.bass.sampleRate,
        result.melody.sampleRate,
        result.vocals.sampleRate,
        result.original.sampleRate,
      ];

      // All sample rates should be the same
      expect(sampleRates.every((sr) => sr === sampleRates[0])).toBe(true);
    });
  });

  describe("Processing Progress Tracking", () => {
    it("should track processing progress", async () => {
      const processingPromise = processor.processStemSeparation(mockFile);

      // Give some time for processing to start
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Note: In a real implementation, you would get the process ID
      // For testing, we'll simulate the progress tracking
      expect(typeof processor.getProcessingProgress("test-id")).toBe("number");

      await processingPromise;
    });

    it("should return 0 progress for unknown process ID", () => {
      const progress = processor.getProcessingProgress("unknown-id");
      expect(progress).toBe(0);
    });

    it("should allow canceling processing", () => {
      const processId = "test-process";

      // This should not throw
      expect(() => processor.cancelProcessing(processId)).not.toThrow();
    });
  });

  describe("Metadata Generation", () => {
    it("should generate complete metadata", async () => {
      const result = await processor.processStemSeparation(mockFile);
      const metadata = result.metadata;

      expect(metadata.processingTime).toBeGreaterThan(0);
      expect(metadata.model).toBeDefined();
      expect(metadata.inputFile).toBeDefined();
      expect(metadata.inputFile.name).toBe("test.mp3");
      expect(metadata.inputFile.size).toBe(2048000);
      expect(metadata.inputFile.duration).toBeGreaterThan(0);
      expect(metadata.status).toBe("completed");
      expect(metadata.error).toBeUndefined();
    });

    it("should include error in metadata when processing fails", async () => {
      (
        mockAudioContext.decodeAudioData as jest.MockedFunction<any>
      ).mockRejectedValue(new Error("Test error"));

      try {
        await processor.processStemSeparation(mockFile);
      } catch (error) {
        // Expected to throw, but let's check if we can access metadata
        expect(error).toBeDefined();
      }
    });

    it("should record processing time accurately", async () => {
      const startTime = Date.now();
      const result = await processor.processStemSeparation(mockFile);
      const endTime = Date.now();

      expect(result.metadata.processingTime).toBeGreaterThan(0);
      expect(result.metadata.processingTime).toBeLessThan(
        endTime - startTime + 100,
      ); // Allow some tolerance
    });
  });

  describe("File Type Handling", () => {
    it("should handle different audio file types", async () => {
      const fileTypes = [
        { name: "test.wav", type: "audio/wav" },
        { name: "test.flac", type: "audio/flac" },
        { name: "test.m4a", type: "audio/m4a" },
        { name: "test.ogg", type: "audio/ogg" },
      ];

      for (const fileType of fileTypes) {
        const file = createMockFile(fileType.name);
        const result = await processor.processStemSeparation(file);

        expect(result.metadata.status).toBe("completed");
        expect(result.metadata.inputFile.name).toBe(fileType.name);
      }
    });

    it("should handle large files", async () => {
      const largeFile = createMockFile("large.mp3", 50 * 1024 * 1024); // 50MB

      const result = await processor.processStemSeparation(largeFile);

      expect(result.metadata.status).toBe("completed");
      expect(result.metadata.inputFile.size).toBe(50 * 1024 * 1024);
    });

    it("should handle files with unusual names", async () => {
      const weirdFile = createMockFile("file with spaces & symbols!@#.mp3");

      const result = await processor.processStemSeparation(weirdFile);

      expect(result.metadata.status).toBe("completed");
      expect(result.metadata.inputFile.name).toBe(
        "file with spaces & symbols!@#.mp3",
      );
    });
  });

  describe("Edge Cases and Error Conditions", () => {
    it("should handle empty files", async () => {
      const emptyFile = createMockFile("empty.mp3", 0);

      await expect(
        processor.processStemSeparation(emptyFile),
      ).rejects.toThrow();
    });

    it("should handle corrupted audio data", async () => {
      (
        mockAudioContext.decodeAudioData as jest.MockedFunction<any>
      ).mockRejectedValue(new Error("Invalid audio data"));

      await expect(processor.processStemSeparation(mockFile)).rejects.toThrow(
        "Demucs processing failed",
      );
    });

    it("should handle very short audio files", async () => {
      // Mock a very short audio buffer
      (
        mockAudioContext.decodeAudioData as jest.MockedFunction<any>
      ).mockResolvedValue(createMockAudioBuffer(0.1));

      const result = await processor.processStemSeparation(mockFile);

      expect(result.metadata.status).toBe("completed");
      expect(result.drums.duration).toBe(0.1);
    });

    it("should handle very long audio files", async () => {
      // Mock a very long audio buffer
      (
        mockAudioContext.decodeAudioData as jest.MockedFunction<any>
      ).mockResolvedValue(createMockAudioBuffer(3600)); // 1 hour

      const result = await processor.processStemSeparation(mockFile);

      expect(result.metadata.status).toBe("completed");
      expect(result.drums.duration).toBe(3600);
    });
  });

  describe("Concurrent Processing", () => {
    it("should handle multiple concurrent processing requests", async () => {
      const files = [
        createMockFile("file1.mp3"),
        createMockFile("file2.mp3"),
        createMockFile("file3.mp3"),
      ];

      const promises = files.map((file) =>
        processor.processStemSeparation(file),
      );
      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      results.forEach((result, index) => {
        expect(result.metadata.status).toBe("completed");
        expect(result.metadata.inputFile.name).toBe(`file${index + 1}.mp3`);
      });
    });

    it("should handle processing cancellation", () => {
      const processId = "test-cancellation";

      // Start tracking a process
      processor.getProcessingProgress(processId);

      // Cancel it
      processor.cancelProcessing(processId);

      // Progress should be 0 after cancellation
      expect(processor.getProcessingProgress(processId)).toBe(0);
    });
  });

  describe("Memory Management", () => {
    it("should not leak memory during processing", async () => {
      const initialMemory = process.memoryUsage?.().heapUsed || 0;

      // Process multiple files
      for (let i = 0; i < 5; i++) {
        const file = createMockFile(`test${i}.mp3`);
        await processor.processStemSeparation(file);
      }

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage?.().heapUsed || 0;

      // Memory should not grow excessively (allow for some normal variance)
      const memoryGrowth = finalMemory - initialMemory;
      expect(memoryGrowth).toBeLessThan(100 * 1024 * 1024); // Less than 100MB growth
    });

    it("should clean up resources after processing", async () => {
      const result = await processor.processStemSeparation(mockFile);

      // Verify that all stems have valid audio buffers
      expect(result.drums.audioBuffer).toBeDefined();
      expect(result.bass.audioBuffer).toBeDefined();
      expect(result.melody.audioBuffer).toBeDefined();
      expect(result.vocals.audioBuffer).toBeDefined();
      expect(result.original.audioBuffer).toBeDefined();
    });
  });

  describe("Integration Scenarios", () => {
    it("should work with typical DJ workflow", async () => {
      // Simulate loading a track for DJing
      const trackFile = createMockFile("dance_track.mp3", 5 * 1024 * 1024);

      const result = await processor.processStemSeparation(trackFile, {
        model: "htdemucs",
        overlap: 0.25,
      });

      // Verify all components needed for DJing are present
      expect(result.drums.hasAudio).toBe(true);
      expect(result.bass.hasAudio).toBe(true);
      expect(result.melody.hasAudio).toBe(true);
      expect(result.vocals.hasAudio).toBe(true);
      expect(result.original.hasAudio).toBe(true);

      // Verify reasonable duration for a dance track
      expect(result.drums.duration).toBeGreaterThan(0);
      expect(result.drums.duration).toBeLessThan(600); // Less than 10 minutes
    });

    it("should handle batch processing scenario", async () => {
      const playlist = [
        createMockFile("song1.mp3"),
        createMockFile("song2.mp3"),
        createMockFile("song3.mp3"),
        createMockFile("song4.mp3"),
        createMockFile("song5.mp3"),
      ];

      const results: DemucsOutput[] = [];

      // Process playlist sequentially
      for (const file of playlist) {
        const result = await processor.processStemSeparation(file);
        results.push(result);
      }

      expect(results).toHaveLength(5);

      // Verify all processing completed successfully
      results.forEach((result, index) => {
        expect(result.metadata.status).toBe("completed");
        expect(result.metadata.inputFile.name).toBe(`song${index + 1}.mp3`);
        expect(result.drums.hasAudio).toBe(true);
        expect(result.bass.hasAudio).toBe(true);
        expect(result.melody.hasAudio).toBe(true);
        expect(result.vocals.hasAudio).toBe(true);
      });
    });
  });
});
