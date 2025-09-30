/**
 * Enhanced Browser Storage for OX Board AI Enhancement
 *
 * Comprehensive storage solution with IndexedDB for large files,
 * Storage Quota API integration, cache eviction strategies, and
 * persistence request for important data.
 */

export interface StorageConfig {
  dbName: string;
  dbVersion: number;
  stores: {
    [storeName: string]: {
      keyPath?: string;
      autoIncrement?: boolean;
      indices?: Array<{
        name: string;
        keyPath: string;
        unique?: boolean;
      }>;
    };
  };
  quota: {
    targetBytes: number;
    warningThreshold: number;
  };
}

export interface StorageMetrics {
  usedBytes: number;
  availableBytes: number;
  totalBytes: number;
  usagePercentage: number;
  storeSizes: Record<string, number>;
}

export interface CacheEntry<T = any> {
  cacheKey: string;
  data: T;
  timestamp: number;
  expiresAt?: number;
  priority: "low" | "medium" | "high";
  size: number; // Size in bytes
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private config: StorageConfig;
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async open(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.dbVersion);

      request.onerror = () => {
        reject(new Error(`IndexedDB error: ${request.error}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        for (const [storeName, storeConfig] of Object.entries(
          this.config.stores,
        )) {
          if (!db.objectStoreNames.contains(storeName)) {
            const objectStore = db.createObjectStore(storeName, {
              keyPath: storeConfig.keyPath || "id",
              autoIncrement: storeConfig.autoIncrement || false,
            });

            // Create indices
            storeConfig.indices?.forEach((index) => {
              objectStore.createIndex(index.name, index.keyPath, {
                unique: index.unique || false,
              });
            });
          }
        }
      };
    });

    this.db = await this.dbPromise;
    return this.db;
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.dbPromise = null;
    }
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    const db = await this.open();
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async set<T>(storeName: string, key: string, data: T): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put({ ...data, id: key, timestamp: Date.now() });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    const db = await this.open();
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async getAllKeys(storeName: string): Promise<string[]> {
    const db = await this.open();
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAllKeys();

      request.onerror = () => reject(request.error);
      request.onsuccess = () =>
        resolve((request.result || []).map((key) => String(key)));
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.open();
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async count(storeName: string): Promise<number> {
    const db = await this.open();
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.count();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}

class StorageQuotaManager {
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
  }

  async getStorageQuota(): Promise<{ usage: number; quota: number }> {
    if ("storage" in navigator && "estimate" in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        return {
          usage: estimate.usage || 0,
          quota: estimate.quota || 0,
        };
      } catch (error) {
        console.warn("Storage quota estimation not available:", error);
      }
    }

    // Fallback: estimate based on IndexedDB
    return { usage: 0, quota: this.config.quota.targetBytes };
  }

  async requestPersistence(): Promise<boolean> {
    if ("storage" in navigator && "persist" in navigator.storage) {
      try {
        return await navigator.storage.persist();
      } catch (error) {
        console.warn("Storage persistence not available:", error);
      }
    }

    return false;
  }

  async isPersistent(): Promise<boolean> {
    if ("storage" in navigator && "persisted" in navigator.storage) {
      try {
        return await navigator.storage.persisted();
      } catch (error) {
        console.warn("Storage persistence check not available:", error);
      }
    }

    return false;
  }

  async getStorageMetrics(): Promise<StorageMetrics> {
    const { usage, quota } = await this.getStorageQuota();
    const usagePercentage = quota > 0 ? (usage / quota) * 100 : 0;

    return {
      usedBytes: usage,
      availableBytes: Math.max(0, quota - usage),
      totalBytes: quota,
      usagePercentage,
      storeSizes: {}, // Would need to calculate actual store sizes
    };
  }
}

class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private quotaManager: StorageQuotaManager;

  constructor(maxSize: number, quotaManager: StorageQuotaManager) {
    this.maxSize = maxSize;
    this.quotaManager = quotaManager;
  }

  set<T>(
    key: string,
    data: T,
    options: {
      ttl?: number; // Time to live in milliseconds
      priority?: "low" | "medium" | "high";
      size?: number;
    } = {},
  ): void {
    const {
      ttl,
      priority = "medium",
      size = this.estimateSize(data),
    } = options;

    const entry: CacheEntry<T> = {
      cacheKey: key,
      data,
      timestamp: Date.now(),
      expiresAt: ttl ? Date.now() + ttl : undefined,
      priority,
      size,
    };

    // Check if we need to evict entries
    if (this.getTotalSize() + size > this.maxSize) {
      this.evict(size);
    }

    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) return null;

    // Check if expired
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private estimateSize(data: any): number {
    // Rough estimation of object size in bytes
    return new Blob([JSON.stringify(data)]).size;
  }

  private getTotalSize(): number {
    let total = 0;
    for (const entry of this.cache.values()) {
      total += entry.size;
    }
    return total;
  }

  private evict(neededSpace: number): void {
    // Sort by priority and timestamp for eviction
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      ...entry,
    }));

    // Sort: low priority first, then oldest
    entries.sort((a, b) => {
      const priorityOrder = { low: 0, medium: 1, high: 2 };
      const priorityDiff =
        priorityOrder[a.priority] - priorityOrder[b.priority];

      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;
    });

    let freedSpace = 0;
    for (const entry of entries) {
      this.cache.delete(entry.key);
      freedSpace += entry.size;

      if (freedSpace >= neededSpace) break;
    }
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  getStats(): {
    entryCount: number;
    totalSize: number;
    hitRate?: number;
  } {
    return {
      entryCount: this.cache.size,
      totalSize: this.getTotalSize(),
    };
  }
}

export class EnhancedStorage {
  private idbManager: IndexedDBManager;
  private quotaManager: StorageQuotaManager;
  private cacheManager: CacheManager;
  private config: StorageConfig;
  private isInitialized = false;

  constructor(config: StorageConfig) {
    this.config = config;
    this.idbManager = new IndexedDBManager(config);
    this.quotaManager = new StorageQuotaManager(config);
    this.cacheManager = new CacheManager(
      config.quota.targetBytes * 0.1,
      this.quotaManager,
    ); // 10% for cache
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await this.idbManager.open();

      // Request persistence for important data
      await this.quotaManager.requestPersistence();

      // Start cleanup interval
      setInterval(() => {
        this.cacheManager.cleanup();
      }, 60000); // Cleanup every minute

      this.isInitialized = true;
      console.log("Enhanced storage initialized");
    } catch (error) {
      console.error("Failed to initialize enhanced storage:", error);
      throw error;
    }
  }

  // IndexedDB operations
  async get<T>(storeName: string, key: string): Promise<T | null> {
    await this.initialize();

    // Try cache first
    const cached = this.cacheManager.get<T>(`${storeName}:${key}`);
    if (cached !== null) {
      return cached;
    }

    // Get from IndexedDB
    const data = await this.idbManager.get<T>(storeName, key);

    // Cache the result
    if (data !== null) {
      this.cacheManager.set(`${storeName}:${key}`, data, {
        priority: "medium",
        ttl: 300000, // 5 minutes
      });
    }

    return data;
  }

  async set<T>(storeName: string, key: string, data: T): Promise<void> {
    await this.initialize();

    // Store in IndexedDB
    await this.idbManager.set(storeName, key, data);

    // Update cache
    this.cacheManager.set(`${storeName}:${key}`, data, {
      priority: "medium",
      ttl: 300000, // 5 minutes
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    await this.initialize();

    await this.idbManager.delete(storeName, key);
    this.cacheManager.delete(`${storeName}:${key}`);
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    await this.initialize();
    return this.idbManager.getAll<T>(storeName);
  }

  async clear(storeName?: string): Promise<void> {
    await this.initialize();

    if (storeName) {
      await this.idbManager.clear(storeName);
      // Clear cache entries for this store
      const keysToDelete: string[] = [];
      for (const key of this.cacheManager["cache"].keys()) {
        if (key.startsWith(`${storeName}:`)) {
          keysToDelete.push(key);
        }
      }
      keysToDelete.forEach((key) => this.cacheManager.delete(key));
    } else {
      // Clear all stores
      for (const storeName of Object.keys(this.config.stores)) {
        await this.idbManager.clear(storeName);
      }
      this.cacheManager.clear();
    }
  }

  // Storage-specific operations for stems and projects
  async storeStem(
    stemId: string,
    stemData: ArrayBuffer,
    metadata: any,
  ): Promise<void> {
    await this.set("stems", stemId, {
      id: stemId,
      data: stemData,
      metadata,
      storedAt: Date.now(),
    });
  }

  async getStem(
    stemId: string,
  ): Promise<{ data: ArrayBuffer; metadata: any } | null> {
    const stem = await this.get<any>("stems", stemId);
    if (!stem) return null;

    return {
      data: stem.data,
      metadata: stem.metadata,
    };
  }

  async storeProject(projectId: string, projectData: any): Promise<void> {
    await this.set("projects", projectId, {
      id: projectId,
      ...projectData,
      storedAt: Date.now(),
    });
  }

  async getProject(projectId: string): Promise<any | null> {
    return this.get("projects", projectId);
  }

  async listProjects(): Promise<any[]> {
    return this.getAll("projects");
  }

  async listStems(): Promise<any[]> {
    return this.getAll("stems");
  }

  // Storage quota and metrics
  async getStorageMetrics(): Promise<StorageMetrics> {
    await this.initialize();
    return this.quotaManager.getStorageMetrics();
  }

  async getStorageQuota(): Promise<{ usage: number; quota: number }> {
    await this.initialize();
    return this.quotaManager.getStorageQuota();
  }

  async isStoragePersistent(): Promise<boolean> {
    await this.initialize();
    return this.quotaManager.isPersistent();
  }

  async requestStoragePersistence(): Promise<boolean> {
    await this.initialize();
    return this.quotaManager.requestPersistence();
  }

  // Cache management
  getCacheStats() {
    return this.cacheManager.getStats();
  }

  // Health check
  async healthCheck(): Promise<{
    healthy: boolean;
    issues: string[];
    metrics: StorageMetrics;
  }> {
    const issues: string[] = [];
    let healthy = true;

    try {
      const metrics = await this.getStorageMetrics();

      if (metrics.usagePercentage > this.config.quota.warningThreshold) {
        issues.push(`Storage usage is ${metrics.usagePercentage.toFixed(1)}%`);
        if (metrics.usagePercentage > 95) {
          healthy = false;
        }
      }

      // Test database operations
      try {
        await this.set("healthcheck", "test", { test: true });
        await this.get("healthcheck", "test");
        await this.delete("healthcheck", "test");
      } catch (error) {
        issues.push("Database operations failed");
        healthy = false;
      }
    } catch (error) {
      issues.push("Storage metrics unavailable");
      healthy = false;
    }

    return {
      healthy,
      issues,
      metrics: await this.getStorageMetrics(),
    };
  }

  // Cleanup and maintenance
  async optimize(): Promise<void> {
    await this.initialize();

    // Clean up expired cache entries
    this.cacheManager.cleanup();

    // Check storage quota and evict if necessary
    const metrics = await this.getStorageMetrics();
    if (metrics.usagePercentage > this.config.quota.warningThreshold) {
      await this.evictOldEntries();
    }
  }

  private async evictOldEntries(): Promise<void> {
    // Get all entries and sort by timestamp
    const stems = await this.getAll<any>("stems");
    const projects = await this.getAll<any>("projects");

    // Sort by timestamp (oldest first)
    stems.sort((a, b) => (a.storedAt || 0) - (b.storedAt || 0));
    projects.sort((a, b) => (a.storedAt || 0) - (b.storedAt || 0));

    // Remove oldest entries if over quota
    const metrics = await this.getStorageMetrics();
    const targetReduction = metrics.usedBytes * 0.2; // Remove 20% of used space

    let freedBytes = 0;
    const entriesToRemove: string[] = [];

    // Remove oldest stems first
    for (const stem of stems) {
      if (freedBytes >= targetReduction) break;

      entriesToRemove.push(stem.id);
      freedBytes += (stem.size as number) || 0;
    }

    // Remove oldest projects if still need more space
    for (const project of projects) {
      if (freedBytes >= targetReduction) break;

      entriesToRemove.push(project.id);
      freedBytes += JSON.stringify(project).length;
    }

    // Remove the entries
    for (const id of entriesToRemove) {
      if (stems.some((s) => s.id === id)) {
        await this.delete("stems", id);
      } else {
        await this.delete("projects", id);
      }
    }
  }

  // Cleanup
  async destroy(): Promise<void> {
    await this.idbManager.close();
    this.cacheManager.clear();
  }
}

// Default configuration for OX Board
export const defaultStorageConfig: StorageConfig = {
  dbName: "ox-board-storage",
  dbVersion: 1,
  stores: {
    stems: {
      keyPath: "id",
      indices: [
        { name: "timestamp", keyPath: "timestamp" },
        { name: "size", keyPath: "size" },
      ],
    },
    projects: {
      keyPath: "id",
      indices: [
        { name: "timestamp", keyPath: "timestamp" },
        { name: "name", keyPath: "name" },
      ],
    },
    settings: {
      keyPath: "key",
    },
    cache: {
      keyPath: "key",
      indices: [{ name: "expiresAt", keyPath: "expiresAt" }],
    },
  },
  quota: {
    targetBytes: 500 * 1024 * 1024, // 500MB
    warningThreshold: 80, // 80%
  },
};

// Singleton instance
export const enhancedStorage = new EnhancedStorage(defaultStorageConfig);
