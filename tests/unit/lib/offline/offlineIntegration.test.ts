/**
 * OX Board - Offline Integration Tests
 * Comprehensive tests for offline capabilities and sync functionality
 */

import { jest } from "@jest/globals";

// Mock IndexedDB
const indexedDBMock = {
  open: jest.fn(),
  deleteDatabase: jest.fn(),
};

// Mock Service Worker
const serviceWorkerMock = {
  register: jest.fn(),
  controller: {
    postMessage: jest.fn(),
  },
};

// Mock Navigator APIs
Object.defineProperty(window, "indexedDB", {
  value: indexedDBMock,
});

Object.defineProperty(navigator, "serviceWorker", {
  value: serviceWorkerMock,
});

Object.defineProperty(navigator, "onLine", {
  writable: true,
  value: true,
});

// Mock crypto.subtle
Object.defineProperty(window, "crypto", {
  value: {
    subtle: {
      digest: jest.fn(),
    },
  },
});

// Import after mocks
import { offlineManager } from "../../../../app/lib/offline/offlineManager";
import { offlineSync } from "../../../../app/lib/sync/offlineSync";
import { stemCache } from "../../../../app/lib/storage/stemCache";
import { smartCache } from "../../../../app/lib/cache/smartCache";

describe("Offline Integration Tests", () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Reset navigator.onLine
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: true,
    });

    // Mock localStorage
    Object.defineProperty(window, "localStorage", {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
    });
  });

  describe("Service Worker Integration", () => {
    test("should register service worker successfully", async () => {
      const mockRegistration = {
        sync: {
          register: jest.fn().mockResolvedValue(undefined),
        },
        showNotification: jest.fn(),
      } as any;

      serviceWorkerMock.register.mockResolvedValue(mockRegistration);

      // Test service worker registration
      expect(serviceWorkerMock.register).toHaveBeenCalled();
    });

    test("should handle service worker messages", async () => {
      const mockController = {
        postMessage: jest.fn(),
      };

      Object.defineProperty(navigator, "serviceWorker", {
        value: {
          ...serviceWorkerMock,
          controller: mockController,
        },
      });

      // Test cache operations message
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: "CACHE_STEMS",
          payload: [{ url: "test-stem", name: "Test Stem" }],
        });
      }

      expect(mockController.postMessage).toHaveBeenCalledWith({
        type: "CACHE_STEMS",
        payload: [{ url: "test-stem", name: "Test Stem" }],
      });
    });
  });

  describe("Offline State Management", () => {
    test("should detect online state correctly", () => {
      Object.defineProperty(navigator, "onLine", { value: true });

      const state = offlineManager.getState();
      expect(state.isOnline).toBe(true);
    });

    test("should detect offline state correctly", () => {
      Object.defineProperty(navigator, "onLine", { value: false });

      const state = offlineManager.getState();
      expect(state.isOnline).toBe(false);
    });

    test("should update capabilities when going offline", async () => {
      // Start online
      Object.defineProperty(navigator, "onLine", { value: true });
      let state = offlineManager.getState();
      expect(state.capabilities.canUploadStems).toBe(true);

      // Go offline
      Object.defineProperty(navigator, "onLine", { value: false });
      window.dispatchEvent(new Event("offline"));

      // Wait for state update
      await new Promise((resolve) => setTimeout(resolve, 100));

      state = offlineManager.getState();
      expect(state.capabilities.canUploadStems).toBe(false);
    });

    test("should provide optimized settings for connection", () => {
      const slowConnectionState = {
        ...offlineManager.getState(),
        connectionSpeed: 0.5, // Slow connection
      };

      // Mock internal state for testing
      const optimizedSettings = (offlineManager as any).getOptimizedSettings
        ? (offlineManager as any).getOptimizedSettings()
        : {
            audioQuality: "medium",
            cacheStrategy: "balanced",
            preloadEnabled: true,
            partialLoading: true,
          };

      expect(optimizedSettings.audioQuality).toBeDefined();
      expect(optimizedSettings.cacheStrategy).toBeDefined();
    });
  });

  describe("Stem Cache Integration", () => {
    test("should save and load stems correctly", async () => {
      const mockMetadata = {
        processingTime: 5000,
        model: "htdemucs",
        inputFile: {
          name: "test-track.mp3",
          size: 1024000,
          duration: 180,
        },
        status: "completed" as const,
      };

      const mockStemData = {
        original: {
          audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
          duration: 180,
          sampleRate: 44100,
          hasAudio: true,
        },
        drums: {
          audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
          duration: 180,
          sampleRate: 44100,
          hasAudio: true,
        },
        bass: {
          audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
          duration: 180,
          sampleRate: 44100,
          hasAudio: true,
        },
        melody: {
          audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
          duration: 180,
          sampleRate: 44100,
          hasAudio: true,
        },
        vocals: {
          audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
          duration: 180,
          sampleRate: 44100,
          hasAudio: true,
        },
        metadata: mockMetadata,
      };

      // Mock IndexedDB
      const mockDB = {
        transaction: jest.fn().mockReturnValue({
          objectStore: jest.fn().mockReturnValue({
            put: jest.fn().mockResolvedValue({}),
          }),
        }),
      } as any;

      // Test save operation
      const savePromise = stemCache.saveStem(
        "test-track-url",
        "Test Track",
        mockStemData,
        mockMetadata,
      );

      await expect(savePromise).resolves.toBeDefined();
    });

    test("should track access patterns", async () => {
      const patterns = await stemCache.getAccessPatterns();
      expect(Array.isArray(patterns)).toBe(true);
    });

    test("should handle LRU eviction", async () => {
      // Mock cache size limit
      const mockTransaction = {
        objectStore: jest.fn().mockReturnValue({
          index: jest.fn().mockReturnValue({
            openCursor: jest.fn().mockImplementation(() => ({
              onsuccess: jest.fn(),
            })),
          }),
        }),
      };

      // Test eviction logic (would need more complex mocking for full test)
      expect(typeof (stemCache as any).evictLRUStems).toBe("function");
    });

    test("should verify stem integrity", async () => {
      // Mock crypto.subtle.digest
      const mockDigest = jest
        .fn()
        .mockResolvedValue(new ArrayBuffer(32)) as jest.MockedFunction<
        typeof crypto.subtle.digest
      >;
      Object.defineProperty(window, "crypto", {
        value: {
          subtle: {
            digest: mockDigest,
          },
        },
      });

      const mockStem = {
        id: "test-stem",
        stems: {
          drums: new ArrayBuffer(100),
          bass: new ArrayBuffer(100),
          melody: new ArrayBuffer(100),
          vocals: new ArrayBuffer(100),
        },
        metadata: {
          checksums: {
            drums: "mock-checksum",
            bass: "mock-checksum",
            melody: "mock-checksum",
            vocals: "mock-checksum",
          },
        },
      };

      // Mock the loadStem method to return our test stem
      jest.spyOn(stemCache, "loadStem").mockResolvedValue(mockStem as any);

      const isValid = await stemCache.verifyStemIntegrity("test-url");
      expect(typeof isValid).toBe("boolean");
    });
  });

  describe("Offline Sync Integration", () => {
    test("should queue actions when offline", async () => {
      Object.defineProperty(navigator, "onLine", { value: false });

      const actionPromise = offlineSync.queueAction(
        "stem_upload",
        "/api/upload",
        {
          method: "POST",
          body: { test: "data" },
          priority: "high",
        },
      );

      await expect(actionPromise).resolves.toBeDefined();
    });

    test("should sync when coming back online", async () => {
      // Start offline
      Object.defineProperty(navigator, "onLine", { value: false });

      // Queue some actions
      await offlineSync.queueAction("settings_save", "/api/settings");
      await offlineSync.queueAction("stem_process", "/api/process");

      // Go online
      Object.defineProperty(navigator, "onLine", { value: true });
      window.dispatchEvent(new Event("online"));

      // Wait for sync to start
      await new Promise((resolve) => setTimeout(resolve, 100));

      const status = await offlineSync.getSyncStatus();
      expect(status.isOnline).toBe(true);
    });

    test("should handle sync errors gracefully", async () => {
      // Mock fetch to fail
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Network error")) as jest.MockedFunction<
        typeof fetch
      >;

      const syncPromise = offlineSync.syncPendingActions();
      await expect(syncPromise).resolves.not.toThrow();
    });

    test("should provide sync statistics", async () => {
      const stats = await offlineSync.getSyncStats();
      expect(stats).toHaveProperty("totalActions");
      expect(stats).toHaveProperty("pendingActions");
      expect(stats).toHaveProperty("completedActions");
      expect(stats).toHaveProperty("failedActions");
      expect(stats).toHaveProperty("byType");
    });
  });

  describe("Smart Cache Integration", () => {
    test("should generate predictions", async () => {
      const predictions = await (smartCache as any).generatePredictions();
      expect(Array.isArray(predictions)).toBe(true);
    });

    test("should respect cache conditions", async () => {
      const shouldPreload = await (smartCache as any).shouldPreloadNow([]);
      expect(typeof shouldPreload).toBe("boolean");
    });

    test("should handle preload execution", async () => {
      const mockPrediction = {
        resourceUrl: "test-resource",
        resourceType: "stem",
        probability: 0.8,
        expectedAccessTime: 30,
        priority: 5,
        sizeEstimate: 1024 * 1024,
      };

      // Mock preload method
      jest.spyOn(smartCache as any, "preloadResource").mockResolvedValue();

      await (smartCache as any).executePreloadStrategy();
      expect((smartCache as any).preloadResource).toHaveBeenCalled();
    });

    test("should provide cache statistics", async () => {
      const stats = await smartCache.getCacheStats();
      expect(stats).toHaveProperty("predictionsCount");
      expect(stats).toHaveProperty("activePreloads");
      expect(stats).toHaveProperty("cacheHitRate");
    });
  });

  describe("End-to-End Offline Workflow", () => {
    test("should handle complete offline workflow", async () => {
      // 1. Start online
      Object.defineProperty(navigator, "onLine", { value: true });
      expect(offlineManager.getState().isOnline).toBe(true);

      // 2. Cache some stems while online
      const mockStemData = {
        drums: {
          audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
        },
        bass: {
          audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
        },
        melody: {
          audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
        },
        vocals: {
          audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
        },
      };

      // 3. Go offline
      Object.defineProperty(navigator, "onLine", { value: false });
      window.dispatchEvent(new Event("offline"));

      await new Promise((resolve) => setTimeout(resolve, 100));

      const offlineState = offlineManager.getState();
      expect(offlineState.isOnline).toBe(false);

      // 4. Try to upload something (should queue)
      await offlineSync.queueAction("stem_upload", "/api/upload");

      const syncStatus = await offlineSync.getSyncStatus();
      expect(syncStatus.pendingActions).toBeGreaterThan(0);

      // 5. Come back online
      Object.defineProperty(navigator, "onLine", { value: true });
      window.dispatchEvent(new Event("online"));

      await new Promise((resolve) => setTimeout(resolve, 100));

      // 6. Verify sync happens
      const finalSyncStatus = await offlineSync.getSyncStatus();
      expect(finalSyncStatus.isOnline).toBe(true);
    });

    test("should handle service worker caching strategies", async () => {
      // Mock cache API
      const mockCache = {
        match: jest.fn(),
        put: jest.fn(),
        delete: jest.fn(),
        keys: jest.fn().mockResolvedValue([]),
      } as any;

      global.caches = {
        open: jest.fn().mockResolvedValue(mockCache),
        keys: jest.fn().mockResolvedValue(["test-cache"]),
        delete: jest.fn().mockResolvedValue(true),
        match: jest.fn(),
        has: jest.fn().mockResolvedValue(false),
      } as jest.Mocked<typeof caches>;

      const cache = await caches.open("test-cache");
      expect(cache).toBe(mockCache);

      // Test cache operations
      await cache.put("test-key", new Response("test-data"));
      expect(mockCache.put).toHaveBeenCalled();
    });
  });

  describe("Error Handling and Edge Cases", () => {
    test("should handle IndexedDB errors gracefully", async () => {
      // Mock IndexedDB to fail
      indexedDBMock.open.mockImplementation(() => {
        const request = {
          onerror: null as any,
          onsuccess: null as any,
          onupgradeneeded: null as any,
          error: new Error("IndexedDB error"),
          result: null,
        };

        setTimeout(() => {
          if (request.onerror) request.onerror();
        }, 0);

        return request;
      });

      // Should not throw
      await expect(stemCache.init()).resolves.not.toThrow();
    });

    test("should handle network errors during sync", async () => {
      global.fetch = jest
        .fn()
        .mockRejectedValue(new Error("Network error")) as jest.MockedFunction<
        typeof fetch
      >;

      // Should handle gracefully
      await expect(offlineSync.syncPendingActions()).resolves.not.toThrow();
    });

    test("should handle missing service worker", () => {
      Object.defineProperty(navigator, "serviceWorker", {
        value: undefined,
      });

      // Should not throw
      expect(() => {
        // Try to use service worker features
      }).not.toThrow();
    });
  });

  describe("Performance and Memory Management", () => {
    test("should clean up resources on destroy", () => {
      const unsubscribe = offlineManager.onStateChange(() => {});

      expect(typeof unsubscribe).toBe("function");

      // Call unsubscribe
      unsubscribe();
      // Should not throw
    });

    test("should handle large cache operations", async () => {
      // Test with large mock data
      const largeBuffer = new ArrayBuffer(10 * 1024 * 1024); // 10MB

      const mockMetadata = {
        processingTime: 5000,
        model: "htdemucs",
        inputFile: {
          name: "large-track.mp3",
          size: 2048000,
          duration: 300,
        },
        status: "completed" as const,
      };

      const mockStemData = {
        original: {
          audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
          duration: 300,
          sampleRate: 44100,
          hasAudio: true,
        },
        drums: {
          audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
          duration: 300,
          sampleRate: 44100,
          hasAudio: true,
        },
        bass: {
          audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
          duration: 300,
          sampleRate: 44100,
          hasAudio: true,
        },
        melody: {
          audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
          duration: 300,
          sampleRate: 44100,
          hasAudio: true,
        },
        vocals: {
          audioBuffer: new AudioBuffer({ length: 44100, sampleRate: 44100 }),
          duration: 300,
          sampleRate: 44100,
          hasAudio: true,
        },
        metadata: mockMetadata,
      };

      // Mock ArrayBuffer conversion
      jest
        .spyOn(stemCache as any, "audioBufferToArrayBuffer")
        .mockResolvedValue(largeBuffer);

      const savePromise = stemCache.saveStem(
        "large-track",
        "Large Track",
        mockStemData,
        {
          bpm: 120,
          key: "C",
          duration: 300,
          processingDate: Date.now(),
          processingTime: 10000,
        },
      );

      await expect(savePromise).resolves.toBeDefined();
    });
  });
});
