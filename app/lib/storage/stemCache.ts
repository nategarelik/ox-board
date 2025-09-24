// IndexedDB storage for processed stems
import { DemucsOutput } from "../audio/demucsProcessor";

const DB_NAME = "ox-board-stems";
const DB_VERSION = 1;
const STORE_NAME = "stems";
const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500MB max cache

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
  metadata: {
    bpm: number;
    key: string;
    duration: number;
    processingDate: number;
    processingTime: number;
    fileSize: number;
  };
}

class StemCacheService {
  private db: IDBDatabase | null = null;
  private initialized = false;
  private currentCacheSize = 0;

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
    metadata: Omit<CachedStem["metadata"], "fileSize">,
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

    // Check if we need to evict old stems
    if (this.currentCacheSize + fileSize > MAX_CACHE_SIZE) {
      await this.evictOldestStems(fileSize);
    }

    const cachedStem: CachedStem = {
      id,
      trackUrl,
      trackTitle,
      stems: stemBuffers,
      metadata: {
        ...metadata,
        fileSize,
      },
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(cachedStem);

      request.onsuccess = () => {
        this.currentCacheSize += fileSize;
        console.log(`💾 Cached stems for: ${trackTitle}`);
        resolve(id);
      };

      request.onerror = () => {
        console.error("Failed to cache stems:", request.error);
        reject(request.error);
      };
    });
  }

  async loadStem(trackUrl: string): Promise<CachedStem | null> {
    if (!this.db) await this.init();

    const id = this.generateId(trackUrl);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const stem = request.result as CachedStem | undefined;
        if (stem) {
          console.log(`✅ Loaded cached stems for: ${stem.trackTitle}`);
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

  async hasCachedStems(trackUrl: string): Promise<boolean> {
    const stem = await this.loadStem(trackUrl);
    return stem !== null;
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
