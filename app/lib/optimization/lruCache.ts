/**
 * LRU Cache with Advanced Eviction Policies
 *
 * High-performance LRU cache implementation with priority-based eviction,
 * hit rate tracking, and adaptive sizing for memory optimization.
 */

export interface CacheEntry<T> {
  value: T;
  priority: number;
  accessCount: number;
  lastAccess: number;
  size: number; // Memory footprint in bytes
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  hitCount: number;
  missCount: number;
  evictions: number;
  totalMemory: number;
  maxMemory: number;
}

export class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = [];
  private maxSize: number;
  private maxMemory: number;
  private hitCount: number = 0;
  private missCount: number = 0;
  private evictionCount: number = 0;
  private totalMemory: number = 0;

  constructor(maxSize: number = 100, maxMemory: number = 50 * 1024 * 1024) {
    this.maxSize = maxSize;
    this.maxMemory = maxMemory;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (entry) {
      // Update access statistics
      entry.accessCount++;
      entry.lastAccess = Date.now();

      // Move to end of access order
      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);

      this.hitCount++;
      return entry.value;
    }
    this.missCount++;
    return null;
  }

  set(key: string, value: T, priority: number = 1, size?: number): void {
    const estimatedSize = size || this.estimateSize(value);

    if (this.cache.has(key)) {
      // Update existing entry
      const entry = this.cache.get(key)!;
      this.totalMemory -= entry.size;
      entry.value = value;
      entry.priority = priority;
      entry.size = estimatedSize;
      entry.accessCount++;
      entry.lastAccess = Date.now();
      this.totalMemory += estimatedSize;

      const index = this.accessOrder.indexOf(key);
      if (index > -1) {
        this.accessOrder.splice(index, 1);
      }
      this.accessOrder.push(key);
    } else {
      // Add new entry with LRU eviction
      this.evictIfNeeded(estimatedSize);

      const entry: CacheEntry<T> = {
        value,
        priority,
        accessCount: 1,
        lastAccess: Date.now(),
        size: estimatedSize,
      };

      this.cache.set(key, entry);
      this.accessOrder.push(key);
      this.totalMemory += estimatedSize;
    }
  }

  private evictIfNeeded(newEntrySize: number): void {
    // Check memory limit first
    if (this.totalMemory + newEntrySize > this.maxMemory) {
      this.evictByMemory(newEntrySize);
      return;
    }

    // Check size limit
    if (this.cache.size >= this.maxSize) {
      this.evictLeastValuable();
    }
  }

  private evictByMemory(requiredSpace: number): void {
    const now = Date.now();
    let freedMemory = 0;

    // Sort by eviction priority (lower priority + older access = higher eviction chance)
    const candidates = Array.from(this.cache.entries())
      .map(([key, entry]) => ({
        key,
        score:
          entry.priority /
          (entry.accessCount * Math.max(1, now - entry.lastAccess)),
      }))
      .sort((a, b) => a.score - b.score);

    for (const candidate of candidates) {
      const entry = this.cache.get(candidate.key);
      if (entry) {
        this.cache.delete(candidate.key);
        const orderIndex = this.accessOrder.indexOf(candidate.key);
        if (orderIndex > -1) {
          this.accessOrder.splice(orderIndex, 1);
        }
        freedMemory += entry.size;
        this.evictionCount++;
        this.totalMemory -= entry.size;

        if (freedMemory >= requiredSpace) {
          break;
        }
      }
    }
  }

  private evictLeastValuable(): void {
    const oldestKey = this.accessOrder.shift();
    if (oldestKey) {
      const entry = this.cache.get(oldestKey);
      if (entry) {
        this.cache.delete(oldestKey);
        this.totalMemory -= entry.size;
        this.evictionCount++;
      }
    }
  }

  private estimateSize(value: T): number {
    // Rough estimation of memory usage
    if (value === null || value === undefined) return 8;

    if (typeof value === "string") {
      return value.length * 2 + 50; // UTF-16 + object overhead
    }

    if (typeof value === "number") return 8;
    if (typeof value === "boolean") return 1;

    if (Array.isArray(value)) {
      return value.length * 8 + 50; // Array overhead
    }

    if (typeof value === "object") {
      // Rough estimation for objects
      return 100 + Object.keys(value as any).length * 20;
    }

    return 50; // Default estimation
  }

  evict(count?: number): number {
    const toEvict = count || Math.floor(this.cache.size * 0.1);
    let evicted = 0;

    for (let i = 0; i < toEvict && this.accessOrder.length > 0; i++) {
      this.evictLeastValuable();
      evicted++;
    }

    return evicted;
  }

  getStats(): CacheStats {
    const total = this.hitCount + this.missCount;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: total > 0 ? this.hitCount / total : 0,
      hitCount: this.hitCount,
      missCount: this.missCount,
      evictions: this.evictionCount,
      totalMemory: this.totalMemory,
      maxMemory: this.maxMemory,
    };
  }

  clear(): void {
    this.cache.clear();
    this.accessOrder.length = 0;
    this.hitCount = 0;
    this.missCount = 0;
    this.evictionCount = 0;
    this.totalMemory = 0;
  }

  resize(newSize: number, newMaxMemory?: number): void {
    this.maxSize = newSize;
    if (newMaxMemory) {
      this.maxMemory = newMaxMemory;
    }

    while (
      this.cache.size > this.maxSize ||
      this.totalMemory > this.maxMemory
    ) {
      this.evictLeastValuable();
    }
  }

  // Get most recently used entries
  getMostRecent(
    limit: number = 10,
  ): Array<{ key: string; entry: CacheEntry<T> }> {
    const recent = this.accessOrder.slice(-limit).reverse();
    return recent
      .map((key) => ({
        key,
        entry: this.cache.get(key)!,
      }))
      .filter((item) => item.entry !== undefined);
  }

  // Get least recently used entries
  getLeastRecent(
    limit: number = 10,
  ): Array<{ key: string; entry: CacheEntry<T> }> {
    const leastRecent = this.accessOrder.slice(0, limit);
    return leastRecent
      .map((key) => ({
        key,
        entry: this.cache.get(key)!,
      }))
      .filter((item) => item.entry !== undefined);
  }
}

/**
 * Memory-aware cache manager with adaptive sizing
 */
export class AdaptiveCacheManager {
  private caches: Map<string, LRUCache<any>> = new Map();
  private totalMemoryLimit: number;
  private memoryCheckInterval: NodeJS.Timeout | null = null;

  constructor(totalMemoryLimit: number = 100 * 1024 * 1024) {
    this.totalMemoryLimit = totalMemoryLimit;
    this.startMemoryMonitoring();
  }

  createCache<T>(
    name: string,
    maxSize: number,
    maxMemory: number,
  ): LRUCache<T> {
    const cache = new LRUCache<T>(maxSize, maxMemory);
    this.caches.set(name, cache);
    return cache;
  }

  getCache<T>(name: string): LRUCache<T> | undefined {
    return this.caches.get(name) as LRUCache<T>;
  }

  removeCache(name: string): boolean {
    return this.caches.delete(name);
  }

  getOverallStats(): {
    totalCaches: number;
    totalMemoryUsage: number;
    cacheStats: Record<string, CacheStats>;
  } {
    let totalMemoryUsage = 0;
    const cacheStats: Record<string, CacheStats> = {};

    for (const [name, cache] of this.caches) {
      const stats = cache.getStats();
      cacheStats[name] = stats;
      totalMemoryUsage += stats.totalMemory;
    }

    return {
      totalCaches: this.caches.size,
      totalMemoryUsage,
      cacheStats,
    };
  }

  private startMemoryMonitoring(): void {
    this.memoryCheckInterval = setInterval(() => {
      this.adaptToMemoryPressure();
    }, 5000); // Check every 5 seconds
  }

  private adaptToMemoryPressure(): void {
    const totalMemoryUsage = this.getOverallStats().totalMemoryUsage;
    const memoryPressure = totalMemoryUsage / this.totalMemoryLimit;

    if (memoryPressure > 0.8) {
      // High memory pressure - reduce cache sizes
      console.log("🔴 High memory pressure - reducing cache sizes");
      this.reduceAllCaches(0.2); // Reduce by 20%
    } else if (memoryPressure > 0.9) {
      // Critical memory pressure - aggressive reduction
      console.log("🔥 Critical memory pressure - aggressive cache reduction");
      this.reduceAllCaches(0.5); // Reduce by 50%
    } else if (memoryPressure < 0.3) {
      // Low memory pressure - can expand caches
      console.log("🟢 Low memory pressure - optimizing cache sizes");
      this.optimizeCacheSizes();
    }
  }

  private reduceAllCaches(factor: number): void {
    for (const cache of this.caches.values()) {
      const stats = cache.getStats();
      const newSize = Math.max(10, Math.floor(stats.maxSize * (1 - factor)));
      const newMemory = Math.max(
        1024 * 1024,
        Math.floor(stats.maxMemory * (1 - factor)),
      );
      cache.resize(newSize, newMemory);
    }
  }

  private optimizeCacheSizes(): void {
    // Rebalance cache sizes based on hit rates
    const cacheStats = this.getOverallStats().cacheStats;

    for (const [name, stats] of Object.entries(cacheStats)) {
      const cache = this.caches.get(name);
      if (cache && stats.hitRate > 0.7) {
        // High hit rate - can increase size
        const newSize = Math.min(stats.maxSize * 1.2, stats.maxSize + 20);
        const newMemory = Math.min(
          stats.maxMemory * 1.2,
          stats.maxMemory + 5 * 1024 * 1024,
        );
        cache.resize(newSize, newMemory);
      }
    }
  }

  destroy(): void {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
    this.caches.clear();
  }
}

// Singleton instances
export const globalLRUCache = new LRUCache<any>(200, 100 * 1024 * 1024);
export const adaptiveCacheManager = new AdaptiveCacheManager(200 * 1024 * 1024);
