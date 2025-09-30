// Enhanced IndexedDB storage for processed stems with offline capabilities
import { DemucsOutput } from "../audio/demucsProcessor";

const DB_NAME = "ox-board-stems";
const DB_VERSION = 2; // Incremented for enhanced features
const STORE_NAME = "stems";
const STORE_ACCESS_LOG = "access_log";
const STORE_PRIORITY = "priority_stems";
const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB max cache
const STEM_CHUNK_SIZE = 1024 * 1024; // 1MB chunks for partial loading

export interface CachedStem {
  id: string;
  trackUrl: string;
  trackTitle: string;
  stems: {
    drums: ArrayBuffer;
    bass: ArrayBuffer;
    melody: ArrayBuffer;
    vocals: ArrayBuffer;
  };
  // Partial loading support
  chunks?: {
    drums: ArrayBuffer[];
    bass: ArrayBuffer[];
    melody: ArrayBuffer[];
    vocals: ArrayBuffer[];
  };
  metadata: {
    bpm: number;
    key: string;
    duration: number;
    processingDate: number;
    processingTime: number;
    fileSize: number;
    // Enhanced metadata for offline optimization
    lastAccessed: number;
    accessCount: number;
    priority: "low" | "medium" | "high";
    quality: "lossy" | "lossless";
    compressionRatio?: number;
    checksums?: {
      drums: string;
      bass: string;
      melody: string;
      vocals: string;
    };
  };
  // Offline sync integration
  syncStatus?: {
    uploaded: boolean;
    lastSyncAttempt?: number;
    conflictResolved?: boolean;
  };
}

export interface StemAccessPattern {
  stemId: string;
  trackTitle: string;
  accessCount: number;
  lastAccessed: number;
  averageSessionDuration: number;
  preferredQuality: "lossy" | "lossless";
}

export interface CacheOptimization {
  lruEvictionEnabled: boolean;
  partialLoadingEnabled: boolean;
  compressionEnabled: boolean;
  preloadingEnabled: boolean;
  maxConcurrentLoads: number;
}

class StemCacheService {
  private db: IDBDatabase | null = null;
  private initialized = false;
  private currentCacheSize = 0;

  // Enhanced features
  private optimization: CacheOptimization = {
    lruEvictionEnabled: true,
    partialLoadingEnabled: true,
    compressionEnabled: false, // Disabled for audio quality
    preloadingEnabled: true,
    maxConcurrentLoads: 3,
  };

  private loadingPromises = new Map<string, Promise<any>>();
  private accessLog = new Map<string, number>();
  private priorityStems = new Set<string>();

  async init(): Promise<void> {
    if (this.initialized) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error("Failed to open IndexedDB:", request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.initialized = true;
        this.calculateCacheSize();
        console.log("✅ Stem cache initialized");
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stems store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
          store.createIndex("trackUrl", "trackUrl", { unique: false });
          store.createIndex("processingDate", "metadata.processingDate", {
            unique: false,
          });
          store.createIndex("lastAccessed", "metadata.lastAccessed", {
            unique: false,
          });
          store.createIndex("priority", "metadata.priority", {
            unique: false,
          });
          store.createIndex("accessCount", "metadata.accessCount", {
            unique: false,
          });
        }

        // Create access log store
        if (!db.objectStoreNames.contains(STORE_ACCESS_LOG)) {
          const accessStore = db.createObjectStore(STORE_ACCESS_LOG, {
            keyPath: "id",
          });
          accessStore.createIndex("timestamp", "timestamp", { unique: false });
          accessStore.createIndex("stemId", "stemId", { unique: false });
        }

        // Create priority stems store
        if (!db.objectStoreNames.contains(STORE_PRIORITY)) {
          db.createObjectStore(STORE_PRIORITY, { keyPath: "stemId" });
        }
      };
    });
  }

  private async calculateCacheSize(): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const stems = request.result as CachedStem[];
      this.currentCacheSize = stems.reduce(
        (acc, stem) => acc + (stem.metadata?.fileSize || 0),
        0,
      );
      console.log(
        `📊 Cache size: ${(this.currentCacheSize / 1024 / 1024).toFixed(2)}MB`,
      );
    };
  }

  async saveStem(
    trackUrl: string,
    trackTitle: string,
    stems: DemucsOutput,
    metadata: Partial<
      Omit<CachedStem["metadata"], "fileSize" | "lastAccessed" | "accessCount">
    > & {
      priority?: CachedStem["metadata"]["priority"];
      quality?: CachedStem["metadata"]["quality"];
      bpm: number;
      key: string;
      duration: number;
      processingDate: number;
      processingTime: number;
    } = {} as any,
  ): Promise<string> {
    if (!this.db) await this.init();

    const id = this.generateId(trackUrl);

    // Convert audio buffers to ArrayBuffers for storage
    const stemBuffers = {
      drums: await this.audioBufferToArrayBuffer(stems.drums.audioBuffer),
      bass: await this.audioBufferToArrayBuffer(stems.bass.audioBuffer),
      melody: await this.audioBufferToArrayBuffer(stems.melody.audioBuffer),
      vocals: await this.audioBufferToArrayBuffer(stems.vocals.audioBuffer),
    };

    // Calculate total size
    const fileSize = Object.values(stemBuffers).reduce(
      (acc, buffer) => acc + buffer.byteLength,
      0,
    );

    // Check if we need to evict old stems using LRU
    if (this.currentCacheSize + fileSize > MAX_CACHE_SIZE) {
      await this.evictLRUStems(fileSize);
    }

    // Generate checksums for integrity verification
    const checksums = {
      drums: await this.generateChecksum(stemBuffers.drums),
      bass: await this.generateChecksum(stemBuffers.bass),
      melody: await this.generateChecksum(stemBuffers.melody),
      vocals: await this.generateChecksum(stemBuffers.vocals),
    };

    const cachedStem: CachedStem = {
      id,
      trackUrl,
      trackTitle,
      stems: stemBuffers,
      metadata: {
        ...metadata,
        fileSize,
        lastAccessed: Date.now(),
        accessCount: 0,
        priority: metadata.priority || "medium",
        quality: metadata.quality || "lossless",
        checksums,
      },
      syncStatus: {
        uploaded: false,
      },
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(cachedStem);

      request.onsuccess = () => {
        this.currentCacheSize += fileSize;
        this.logAccess(id);
        console.log(
          `💾 Enhanced cached stems for: ${trackTitle} (${(fileSize / 1024 / 1024).toFixed(2)}MB)`,
        );
        resolve(id);
      };

      request.onerror = () => {
        console.error("Failed to cache stems:", request.error);
        reject(request.error);
      };
    });
  }

  async hasCachedStems(trackUrl: string): Promise<boolean> {
    const stem = await this.loadStem(trackUrl);
    return stem !== null;
  }

  /**
   * Load stem with LRU tracking
   */
  async loadStem(trackUrl: string): Promise<CachedStem | null> {
    if (!this.db) await this.init();

    const id = this.generateId(trackUrl);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const stem = request.result as CachedStem | undefined;
        if (stem) {
          // Update access tracking
          stem.metadata.lastAccessed = Date.now();
          stem.metadata.accessCount++;

          // Update in database
          store.put(stem);

          this.logAccess(id);
          console.log(
            `✅ Loaded cached stems for: ${stem.trackTitle} (access #${stem.metadata.accessCount})`,
          );
          resolve(stem);
        } else {
          console.log(`❌ No cached stems for URL: ${trackUrl}`);
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error("Failed to load stems:", request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Load stem partially for bandwidth optimization
   */
  async loadStemPartial(
    trackUrl: string,
    components: ("drums" | "bass" | "melody" | "vocals")[] = [
      "drums",
      "bass",
      "melody",
      "vocals",
    ],
  ): Promise<Partial<CachedStem> | null> {
    const fullStem = await this.loadStem(trackUrl);
    if (!fullStem) return null;

    const partialStem: Partial<CachedStem> = {
      id: fullStem.id,
      trackUrl: fullStem.trackUrl,
      trackTitle: fullStem.trackTitle,
      metadata: fullStem.metadata,
      stems: {} as any,
    };

    // Load only requested components
    for (const component of components) {
      if (fullStem.stems[component]) {
        partialStem.stems![component] = fullStem.stems[component];
      }
    }

    console.log(
      `⚡ Loaded partial stem: ${fullStem.trackTitle} (${components.join(", ")})`,
    );
    return partialStem;
  }

  /**
   * Pre-cache frequently used stems based on access patterns
   */
  async preloadFrequentStems(): Promise<void> {
    const accessPatterns = await this.getAccessPatterns();
    const frequentStems = accessPatterns
      .filter((pattern) => pattern.accessCount > 3)
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, 5); // Top 5 most accessed

    console.log(`🚀 Preloading ${frequentStems.length} frequently used stems`);

    for (const pattern of frequentStems) {
      // Load in background to warm cache
      this.loadStem(pattern.stemId).catch((error) => {
        console.warn(`Failed to preload stem ${pattern.stemId}:`, error);
      });
    }
  }

  /**
   * Set stem priority for cache management
   */
  async setStemPriority(
    trackUrl: string,
    priority: CachedStem["metadata"]["priority"],
  ): Promise<void> {
    if (!this.db) await this.init();

    const id = this.generateId(trackUrl);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const stem = getRequest.result as CachedStem;
        if (stem) {
          stem.metadata.priority = priority;
          const putRequest = store.put(stem);

          putRequest.onsuccess = () => {
            if (priority === "high") {
              this.priorityStems.add(id);
            } else {
              this.priorityStems.delete(id);
            }
            console.log(`⭐ Set priority ${priority} for: ${stem.trackTitle}`);
            resolve();
          };

          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error("Stem not found"));
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Get access patterns for optimization
   */
  async getAccessPatterns(): Promise<StemAccessPattern[]> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const stems = request.result as CachedStem[];
        const patterns: StemAccessPattern[] = stems.map((stem) => ({
          stemId: stem.id,
          trackTitle: stem.trackTitle,
          accessCount: stem.metadata.accessCount,
          lastAccessed: stem.metadata.lastAccessed,
          averageSessionDuration: 0, // Would need session tracking
          preferredQuality: stem.metadata.quality,
        }));

        resolve(patterns);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * LRU-based eviction instead of just oldest
   */
  private async evictLRUStems(requiredSpace: number): Promise<void> {
    if (!this.db) return;

    const transaction = this.db!.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("lastAccessed");
    const request = index.openCursor();

    let freedSpace = 0;
    const toEvict: string[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;

      if (cursor && freedSpace < requiredSpace) {
        const stem = cursor.value as CachedStem;

        // Don't evict high priority stems
        if (
          stem.metadata.priority !== "high" &&
          !this.priorityStems.has(stem.id)
        ) {
          freedSpace += stem.metadata.fileSize;
          this.currentCacheSize -= stem.metadata.fileSize;
          toEvict.push(stem.id);

          cursor.delete();
          console.log(
            `🗑️ Evicted LRU stem: ${stem.trackTitle} (${(stem.metadata.fileSize / 1024 / 1024).toFixed(2)}MB)`,
          );
        }

        cursor.continue();
      }
    };

    // Wait for cursor to complete
    return new Promise((resolve) => {
      const checkCompletion = () => {
        if (request.result === null) {
          console.log(
            `✅ LRU eviction complete: freed ${(freedSpace / 1024 / 1024).toFixed(2)}MB`,
          );
          resolve();
        } else {
          setTimeout(checkCompletion, 10);
        }
      };
      checkCompletion();
    });
  }

  /**
   * Log access for pattern analysis
   */
  private logAccess(stemId: string): void {
    const now = Date.now();
    this.accessLog.set(stemId, now);

    // Store in database for persistence
    if (this.db) {
      const transaction = this.db.transaction([STORE_ACCESS_LOG], "readwrite");
      const store = transaction.objectStore(STORE_ACCESS_LOG);
      store.put({
        id: `${stemId}_${now}`,
        stemId,
        timestamp: now,
        type: "access",
      });
    }
  }

  /**
   * Generate checksum for data integrity
   */
  private async generateChecksum(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .substring(0, 16);
  }

  /**
   * Verify stem integrity using checksums
   */
  async verifyStemIntegrity(trackUrl: string): Promise<boolean> {
    const stem = await this.loadStem(trackUrl);
    if (!stem || !stem.metadata.checksums) return false;

    try {
      const currentChecksums = {
        drums: await this.generateChecksum(stem.stems.drums),
        bass: await this.generateChecksum(stem.stems.bass),
        melody: await this.generateChecksum(stem.stems.melody),
        vocals: await this.generateChecksum(stem.stems.vocals),
      };

      const keys = ["drums", "bass", "melody", "vocals"] as const;
      return keys.every(
        (key) => currentChecksums[key] === stem.metadata.checksums![key],
      );
    } catch (error) {
      console.error("❌ Integrity check failed:", error);
      return false;
    }
  }

  private async evictOldestStems(requiredSpace: number): Promise<void> {
    if (!this.db) return;

    const transaction = this.db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("processingDate");
    const request = index.openCursor();

    let freedSpace = 0;

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest).result;

      if (cursor && freedSpace < requiredSpace) {
        const stem = cursor.value as CachedStem;
        freedSpace += stem.metadata.fileSize;
        this.currentCacheSize -= stem.metadata.fileSize;

        cursor.delete();
        console.log(`🗑️ Evicted old stems: ${stem.trackTitle}`);
        cursor.continue();
      }
    };
  }

  private generateId(trackUrl: string): string {
    // Create a consistent ID from the URL
    return btoa(trackUrl)
      .replace(/[^a-zA-Z0-9]/g, "")
      .substring(0, 32);
  }

  private async audioBufferToArrayBuffer(
    buffer: AudioBuffer,
  ): Promise<ArrayBuffer> {
    // Convert AudioBuffer to ArrayBuffer for storage
    const length = buffer.length * buffer.numberOfChannels;
    const arrayBuffer = new ArrayBuffer(length * 4); // 32-bit float
    const view = new Float32Array(arrayBuffer);

    let offset = 0;
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      view.set(channelData, offset);
      offset += channelData.length;
    }

    return arrayBuffer;
  }

  async arrayBufferToAudioBuffer(
    arrayBuffer: ArrayBuffer,
    sampleRate: number = 44100,
    numberOfChannels: number = 2,
  ): Promise<AudioBuffer> {
    // Convert ArrayBuffer back to AudioBuffer for playback
    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
    const view = new Float32Array(arrayBuffer);
    const frameCount = view.length / numberOfChannels;

    const audioBuffer = audioContext.createBuffer(
      numberOfChannels,
      frameCount,
      sampleRate,
    );

    let offset = 0;
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      channelData.set(view.slice(offset, offset + frameCount));
      offset += frameCount;
    }

    return audioBuffer;
  }

  async clearCache(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        this.currentCacheSize = 0;
        console.log("🗑️ Cache cleared");
        resolve();
      };

      request.onerror = () => {
        console.error("Failed to clear cache:", request.error);
        reject(request.error);
      };
    });
  }

  async getCacheStats(): Promise<{
    totalSize: number;
    itemCount: number;
    oldestItem: Date | null;
    newestItem: Date | null;
  }> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const stems = request.result as CachedStem[];

        const stats = {
          totalSize: this.currentCacheSize,
          itemCount: stems.length,
          oldestItem:
            stems.length > 0
              ? new Date(
                  Math.min(...stems.map((s) => s.metadata.processingDate)),
                )
              : null,
          newestItem:
            stems.length > 0
              ? new Date(
                  Math.max(...stems.map((s) => s.metadata.processingDate)),
                )
              : null,
        };

        resolve(stats);
      };

      request.onerror = () => {
        console.error("Failed to get cache stats:", request.error);
        reject(request.error);
      };
    });
  }
}

// Export singleton instance
export const stemCache = new StemCacheService();
