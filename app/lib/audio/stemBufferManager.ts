/**
 * Advanced Stem Buffer Manager with Ring Buffer Implementation
 * Provides efficient buffer allocation, recycling, and WebAssembly integration for high-performance audio processing
 */

import { StemId, StemTrack } from "../../types/stem-player";
import { performanceMonitor } from "../optimization/performanceMonitor";
import { bufferPoolManager } from "../optimization/bufferPool";

export interface BufferPoolConfig {
  initialSize: number;
  maxSize: number;
  growthFactor: number;
  minBufferSize: number;
  maxBufferSize: number;
  enableWebAssembly: boolean;
  enableMemoryMapping: boolean;
  gcThreshold: number;
}

export interface StemBuffer {
  id: string;
  stemId: StemId;
  audioBuffer: AudioBuffer;
  ringBuffer: RingBuffer;
  metadata: BufferMetadata;
  isActive: boolean;
  lastAccess: number;
  accessCount: number;
}

export interface BufferMetadata {
  sampleRate: number;
  channels: number;
  duration: number;
  byteLength: number;
  format: "float32" | "int16" | "int32";
  compressed: boolean;
  quality: number; // 0-1
}

export interface RingBuffer {
  buffer: Float32Array;
  readIndex: number;
  writeIndex: number;
  size: number;
  available: number;
  isFull: boolean;
}

export interface BufferPoolStats {
  totalBuffers: number;
  activeBuffers: number;
  pooledBuffers: number;
  totalMemory: number;
  peakMemory: number;
  allocationCount: number;
  deallocationCount: number;
  hitRate: number;
  fragmentationRatio: number;
}

export interface MemoryMap {
  buffer: SharedArrayBuffer | ArrayBuffer;
  view: Float32Array;
  offset: number;
  length: number;
  isShared: boolean;
}

/**
 * High-performance buffer management system with ring buffers and memory mapping
 */
export class StemBufferManager {
  private bufferPool: Map<string, StemBuffer> = new Map();
  private freeBuffers: Set<string> = new Set();
  private memoryMaps: Map<string, MemoryMap> = new Map();
  private isInitialized: boolean = false;

  // Configuration
  private config: BufferPoolConfig = {
    initialSize: 50 * 1024 * 1024, // 50MB
    maxSize: 500 * 1024 * 1024, // 500MB
    growthFactor: 1.5,
    minBufferSize: 1024,
    maxBufferSize: 10 * 1024 * 1024, // 10MB per buffer
    enableWebAssembly: true,
    enableMemoryMapping: true,
    gcThreshold: 0.8,
  };

  // WebAssembly integration
  private wasmModule: WebAssembly.Module | null = null;
  private wasmInstance: WebAssembly.Instance | null = null;
  private wasmExports: any = null;

  // Performance monitoring
  private stats: BufferPoolStats = {
    totalBuffers: 0,
    activeBuffers: 0,
    pooledBuffers: 0,
    totalMemory: 0,
    peakMemory: 0,
    allocationCount: 0,
    deallocationCount: 0,
    hitRate: 0,
    fragmentationRatio: 0,
  };

  // Ring buffer configurations
  private ringBufferConfigs: Map<StemId, RingBufferConfig> = new Map();

  constructor(config?: Partial<BufferPoolConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.initializeRingBufferConfigs();
  }

  /**
   * Initialize the buffer manager
   */
  async initialize(): Promise<boolean> {
    try {
      // Initialize WebAssembly module if enabled
      if (this.config.enableWebAssembly) {
        await this.initializeWebAssembly();
      }

      // Initialize memory mapping if enabled
      if (this.config.enableMemoryMapping) {
        this.initializeMemoryMapping();
      }

      // Pre-allocate initial buffer pool
      await this.preAllocateBuffers();

      this.isInitialized = true;
      console.log("✅ StemBufferManager initialized");

      // Start garbage collection monitoring
      this.startGarbageCollection();

      return true;
    } catch (error) {
      console.error("Failed to initialize StemBufferManager:", error);
      throw new Error(`BufferManager initialization failed: ${error}`);
    }
  }

  /**
   * Initialize WebAssembly module for high-performance buffer operations
   */
  private async initializeWebAssembly(): Promise<void> {
    try {
      // In a real implementation, this would load a WASM module
      // For now, we'll simulate WASM functionality
      const wasmCode = this.generateWasmCode();

      this.wasmModule = await WebAssembly.compile(wasmCode);
      this.wasmInstance = await WebAssembly.instantiate(this.wasmModule);
      this.wasmExports = this.wasmInstance.exports;

      console.log("✅ WebAssembly module initialized for buffer operations");
    } catch (error) {
      console.warn(
        "WebAssembly initialization failed, falling back to JavaScript:",
        error,
      );
      this.config.enableWebAssembly = false;
    }
  }

  /**
   * Generate WebAssembly code for buffer operations
   */
  private generateWasmCode(): ArrayBuffer {
    // This would be a real WASM binary in production
    // For now, return a mock ArrayBuffer
    return new ArrayBuffer(1024);
  }

  /**
   * Initialize memory mapping for large files
   */
  private initializeMemoryMapping(): void {
    if (typeof SharedArrayBuffer === "undefined") {
      console.warn("SharedArrayBuffer not available, disabling memory mapping");
      this.config.enableMemoryMapping = false;
      return;
    }

    console.log("✅ Memory mapping initialized");
  }

  /**
   * Pre-allocate initial buffer pool
   */
  private async preAllocateBuffers(): Promise<void> {
    const numBuffers = Math.floor(
      this.config.initialSize / this.config.minBufferSize,
    );

    for (let i = 0; i < numBuffers; i++) {
      const bufferId = `prealloc_${i}`;
      const buffer = this.createBuffer(bufferId, this.config.minBufferSize);
      this.freeBuffers.add(bufferId);
      this.stats.totalMemory += this.config.minBufferSize;
    }

    console.log(
      `📦 Pre-allocated ${numBuffers} buffers (${this.formatBytes(this.config.initialSize)})`,
    );
  }

  /**
   * Create a new buffer with metadata
   */
  private createBuffer(bufferId: string, size: number): StemBuffer {
    const audioContext = this.getAudioContext();
    const audioBuffer = audioContext.createBuffer(
      2,
      size,
      audioContext.sampleRate,
    );

    // Initialize with silence
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      channelData.fill(0);
    }

    const ringBuffer = this.createRingBuffer(size);
    const metadata: BufferMetadata = {
      sampleRate: audioContext.sampleRate,
      channels: 2,
      duration: size / audioContext.sampleRate,
      byteLength: size * 4 * 2, // 2 channels * 4 bytes per sample
      format: "float32",
      compressed: false,
      quality: 1.0,
    };

    return {
      id: bufferId,
      stemId: "other", // Will be set when allocated
      audioBuffer,
      ringBuffer,
      metadata,
      isActive: false,
      lastAccess: Date.now(),
      accessCount: 0,
    };
  }

  /**
   * Create a ring buffer for smooth playback
   */
  private createRingBuffer(size: number): RingBuffer {
    const buffer = new Float32Array(size * 2); // Stereo

    return {
      buffer,
      readIndex: 0,
      writeIndex: 0,
      size,
      available: 0,
      isFull: false,
    };
  }

  /**
   * Allocate buffer for a stem
   */
  async allocateBuffer(
    stemId: StemId,
    requiredSize?: number,
  ): Promise<StemBuffer | null> {
    const size = requiredSize || this.calculateOptimalSize(stemId);

    // Try to find suitable buffer in pool
    const bufferId = this.findSuitableBuffer(size);
    if (bufferId) {
      const buffer = this.bufferPool.get(bufferId)!;
      buffer.stemId = stemId;
      buffer.isActive = true;
      buffer.lastAccess = Date.now();
      buffer.accessCount++;

      this.freeBuffers.delete(bufferId);
      this.stats.activeBuffers++;
      this.stats.hitRate = this.calculateHitRate();

      console.log(`♻️ Reused buffer ${bufferId} for stem ${stemId}`);
      return buffer;
    }

    // Allocate new buffer if pool is empty or no suitable buffer found
    if (this.canAllocateNewBuffer(size)) {
      const newBufferId = `buffer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newBuffer = this.createBuffer(newBufferId, size);
      newBuffer.stemId = stemId;
      newBuffer.isActive = true;
      newBuffer.lastAccess = Date.now();
      newBuffer.accessCount = 1;

      this.bufferPool.set(newBufferId, newBuffer);
      this.stats.totalBuffers++;
      this.stats.activeBuffers++;
      this.stats.allocationCount++;
      this.stats.totalMemory += size * 4 * 2;

      console.log(
        `🆕 Allocated new buffer ${newBufferId} for stem ${stemId} (${this.formatBytes(size * 4 * 2)})`,
      );
      return newBuffer;
    }

    console.warn(
      `❌ Failed to allocate buffer for stem ${stemId} - insufficient memory`,
    );
    return null;
  }

  /**
   * Find suitable buffer in pool
   */
  private findSuitableBuffer(requiredSize: number): string | null {
    for (const bufferId of this.freeBuffers) {
      const buffer = this.bufferPool.get(bufferId);
      if (buffer && buffer.metadata.byteLength >= requiredSize) {
        return bufferId;
      }
    }
    return null;
  }

  /**
   * Check if new buffer can be allocated
   */
  private canAllocateNewBuffer(size: number): boolean {
    const newTotalMemory = this.stats.totalMemory + size * 4 * 2;
    return newTotalMemory <= this.config.maxSize;
  }

  /**
   * Calculate optimal buffer size for a stem
   */
  private calculateOptimalSize(stemId: StemId): number {
    // Base size on stem type and typical usage
    const baseSizes: Record<StemId, number> = {
      vocals: 2 * 1024 * 1024, // 2MB - higher quality for vocals
      drums: 3 * 1024 * 1024, // 3MB - transient heavy
      bass: 1.5 * 1024 * 1024, // 1.5MB - low frequency focus
      other: 1 * 1024 * 1024, // 1MB - default
    };

    const baseSize = baseSizes[stemId] || baseSizes.other;

    // Adjust based on available memory
    const memoryPressure = this.stats.totalMemory / this.config.maxSize;
    const adjustedSize =
      memoryPressure > 0.7 ? Math.floor(baseSize * 0.7) : baseSize;

    return Math.max(
      this.config.minBufferSize,
      Math.min(this.config.maxBufferSize, adjustedSize),
    );
  }

  /**
   * Deallocate buffer and return to pool
   */
  deallocateBuffer(bufferId: string): void {
    const buffer = this.bufferPool.get(bufferId);
    if (!buffer) return;

    buffer.isActive = false;
    buffer.lastAccess = Date.now();
    this.freeBuffers.add(bufferId);
    this.stats.activeBuffers--;
    this.stats.deallocationCount++;

    // Clear buffer data for security
    buffer.audioBuffer.getChannelData(0).fill(0);
    buffer.audioBuffer.getChannelData(1).fill(0);

    console.log(`♻️ Deallocated buffer ${bufferId}`);
  }

  /**
   * Load stem audio data into buffer with lookahead
   */
  async loadStemData(
    stemId: StemId,
    audioData: ArrayBuffer,
    lookaheadSeconds: number = 2,
  ): Promise<StemBuffer | null> {
    const buffer = await this.allocateBuffer(stemId);
    if (!buffer) return null;

    try {
      const audioContext = this.getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(audioData.slice());

      // Copy audio data to our buffer
      const targetLength = Math.min(
        buffer.audioBuffer.length,
        audioBuffer.length,
      );
      for (
        let channel = 0;
        channel <
        Math.min(
          audioBuffer.numberOfChannels,
          buffer.audioBuffer.numberOfChannels,
        );
        channel++
      ) {
        const sourceData = audioBuffer.getChannelData(channel);
        const targetData = buffer.audioBuffer.getChannelData(channel);
        sourceData.slice(0, targetLength).forEach((sample, index) => {
          targetData[index] = sample;
        });
      }

      // Setup ring buffer for smooth playback
      await this.setupRingBuffer(buffer, lookaheadSeconds);

      // Update metadata
      buffer.metadata = {
        sampleRate: audioBuffer.sampleRate,
        channels: audioBuffer.numberOfChannels,
        duration: audioBuffer.duration,
        byteLength: audioData.byteLength,
        format: "float32",
        compressed: false,
        quality: 1.0,
      };

      console.log(
        `✅ Loaded stem data for ${stemId} (${audioBuffer.duration.toFixed(2)}s)`,
      );
      return buffer;
    } catch (error) {
      console.error(`Failed to load stem data for ${stemId}:`, error);
      this.deallocateBuffer(buffer.id);
      return null;
    }
  }

  /**
   * Setup ring buffer with lookahead for smooth playback
   */
  private async setupRingBuffer(
    buffer: StemBuffer,
    lookaheadSeconds: number,
  ): Promise<void> {
    const lookaheadSamples = Math.floor(
      lookaheadSeconds * buffer.metadata.sampleRate,
    );
    const ringSize = Math.min(buffer.ringBuffer.size, lookaheadSamples * 2);

    // Fill ring buffer with initial data
    for (let i = 0; i < ringSize && i < buffer.audioBuffer.length; i++) {
      const channel1 = buffer.audioBuffer.getChannelData(0)[i] || 0;
      const channel2 = buffer.audioBuffer.getChannelData(1)[i] || 0;

      buffer.ringBuffer.buffer[i * 2] = channel1;
      buffer.ringBuffer.buffer[i * 2 + 1] = channel2;
    }

    buffer.ringBuffer.writeIndex = Math.min(
      ringSize,
      buffer.audioBuffer.length,
    );
    buffer.ringBuffer.available = buffer.ringBuffer.writeIndex;
  }

  /**
   * Read from ring buffer with seamless wrapping
   */
  readFromRingBuffer(bufferId: string, frames: number): Float32Array | null {
    const buffer = this.bufferPool.get(bufferId);
    if (!buffer || !buffer.isActive) return null;

    const ringBuffer = buffer.ringBuffer;
    if (ringBuffer.available < frames) return null;

    const output = new Float32Array(frames * 2); // Stereo

    for (let i = 0; i < frames; i++) {
      if (ringBuffer.readIndex >= ringBuffer.size) {
        ringBuffer.readIndex = 0;
      }

      output[i * 2] = ringBuffer.buffer[ringBuffer.readIndex * 2] || 0;
      output[i * 2 + 1] = ringBuffer.buffer[ringBuffer.readIndex * 2 + 1] || 0;

      ringBuffer.readIndex++;
      ringBuffer.available--;
    }

    // Update access statistics
    buffer.lastAccess = Date.now();
    buffer.accessCount++;

    return output;
  }

  /**
   * Write to ring buffer with automatic wrapping
   */
  writeToRingBuffer(bufferId: string, audioData: Float32Array): boolean {
    const buffer = this.bufferPool.get(bufferId);
    if (!buffer || !buffer.isActive) return false;

    const ringBuffer = buffer.ringBuffer;
    const neededSpace = Math.floor(audioData.length / 2); // Stereo frames

    if (ringBuffer.size - ringBuffer.available < neededSpace) {
      // Not enough space, overwrite oldest data
      ringBuffer.readIndex =
        (ringBuffer.readIndex + neededSpace) % ringBuffer.size;
      ringBuffer.available = Math.min(
        ringBuffer.available,
        ringBuffer.size - neededSpace,
      );
    }

    for (let i = 0; i < audioData.length; i += 2) {
      if (ringBuffer.writeIndex >= ringBuffer.size) {
        ringBuffer.writeIndex = 0;
      }

      ringBuffer.buffer[ringBuffer.writeIndex * 2] = audioData[i] || 0;
      ringBuffer.buffer[ringBuffer.writeIndex * 2 + 1] = audioData[i + 1] || 0;

      ringBuffer.writeIndex++;
      ringBuffer.available++;
    }

    return true;
  }

  /**
   * Optimize buffer allocation using WebAssembly if available
   */
  optimizeBuffer(bufferId: string): boolean {
    if (!this.config.enableWebAssembly || !this.wasmExports) return false;

    const buffer = this.bufferPool.get(bufferId);
    if (!buffer) return false;

    try {
      // Use WebAssembly for memory optimization
      const optimized = this.wasmExports.optimizeBuffer(
        buffer.audioBuffer.getChannelData(0),
        buffer.audioBuffer.getChannelData(1),
      );

      console.log(`⚡ Optimized buffer ${bufferId} using WebAssembly`);
      return true;
    } catch (error) {
      console.warn(
        `WebAssembly optimization failed for buffer ${bufferId}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Create memory map for large files
   */
  createMemoryMap(bufferId: string, fileSize: number): MemoryMap | null {
    if (!this.config.enableMemoryMapping) return null;

    try {
      const sharedBuffer = new SharedArrayBuffer(fileSize);
      const view = new Float32Array(sharedBuffer);

      const memoryMap: MemoryMap = {
        buffer: sharedBuffer,
        view,
        offset: 0,
        length: fileSize,
        isShared: true,
      };

      this.memoryMaps.set(bufferId, memoryMap);
      console.log(
        `🗺️ Created memory map for ${bufferId} (${this.formatBytes(fileSize)})`,
      );

      return memoryMap;
    } catch (error) {
      console.warn(`Memory mapping failed for ${bufferId}:`, error);
      return null;
    }
  }

  /**
   * Get or create memory map for a buffer
   */
  getMemoryMap(bufferId: string): MemoryMap | null {
    return this.memoryMaps.get(bufferId) || null;
  }

  /**
   * Defragment buffer pool to optimize memory usage
   */
  defragment(): void {
    const fragmentedBuffers = this.identifyFragmentedBuffers();
    let defragmentedBytes = 0;

    for (const bufferId of fragmentedBuffers) {
      const buffer = this.bufferPool.get(bufferId);
      if (buffer && !buffer.isActive) {
        const optimizedSize = this.calculateOptimalSize(buffer.stemId);
        if (buffer.metadata.byteLength > optimizedSize * 1.5) {
          // Buffer is significantly larger than needed
          this.resizeBuffer(bufferId, optimizedSize);
          defragmentedBytes += buffer.metadata.byteLength - optimizedSize;
        }
      }
    }

    if (defragmentedBytes > 0) {
      console.log(
        `🔧 Defragmented ${this.formatBytes(defragmentedBytes)} of memory`,
      );
    }
  }

  /**
   * Identify fragmented buffers
   */
  private identifyFragmentedBuffers(): string[] {
    const fragmented: string[] = [];
    const memoryUsage = this.stats.totalMemory / this.config.maxSize;

    if (memoryUsage > this.config.gcThreshold) {
      // High memory usage - find inefficient buffers
      for (const [bufferId, buffer] of this.bufferPool) {
        if (!buffer.isActive) {
          const utilization =
            buffer.accessCount / (Date.now() - buffer.lastAccess);
          if (utilization < 0.1) {
            // Low utilization
            fragmented.push(bufferId);
          }
        }
      }
    }

    return fragmented;
  }

  /**
   * Resize buffer to optimal size
   */
  private resizeBuffer(bufferId: string, newSize: number): void {
    const buffer = this.bufferPool.get(bufferId);
    if (!buffer) return;

    const audioContext = this.getAudioContext();
    const newAudioBuffer = audioContext.createBuffer(
      2,
      newSize,
      audioContext.sampleRate,
    );

    // Copy existing data
    const copyLength = Math.min(buffer.audioBuffer.length, newSize);
    for (let channel = 0; channel < 2; channel++) {
      const oldData = buffer.audioBuffer.getChannelData(channel);
      const newData = newAudioBuffer.getChannelData(channel);
      for (let i = 0; i < copyLength; i++) {
        newData[i] = oldData[i] || 0;
      }
    }

    buffer.audioBuffer = newAudioBuffer;
    buffer.metadata.byteLength = newSize * 4 * 2;
    buffer.metadata.duration = newSize / audioContext.sampleRate;

    console.log(
      `🔧 Resized buffer ${bufferId} to ${this.formatBytes(newSize * 4 * 2)}`,
    );
  }

  /**
   * Initialize ring buffer configurations for different stem types
   */
  private initializeRingBufferConfigs(): void {
    const configs: Record<StemId, RingBufferConfig> = {
      vocals: { size: 8192, lookahead: 2.0, enableSmoothing: true },
      drums: { size: 16384, lookahead: 1.0, enableSmoothing: false },
      bass: { size: 4096, lookahead: 3.0, enableSmoothing: true },
      other: { size: 8192, lookahead: 2.0, enableSmoothing: true },
    };

    Object.entries(configs).forEach(([stemId, config]) => {
      this.ringBufferConfigs.set(stemId as StemId, config);
    });
  }

  /**
   * Get ring buffer configuration for a stem
   */
  getRingBufferConfig(stemId: StemId): RingBufferConfig | null {
    return this.ringBufferConfigs.get(stemId) || null;
  }

  /**
   * Get audio context (create if needed)
   */
  private getAudioContext(): AudioContext {
    if (typeof window !== "undefined") {
      return new AudioContext();
    }
    throw new Error("AudioContext not available");
  }

  /**
   * Calculate hit rate for buffer pool
   */
  private calculateHitRate(): number {
    if (this.stats.allocationCount === 0) return 0;
    return (
      (this.stats.allocationCount - this.stats.activeBuffers) /
      this.stats.allocationCount
    );
  }

  /**
   * Start garbage collection monitoring
   */
  private startGarbageCollection(): void {
    setInterval(() => {
      this.performGarbageCollection();
    }, 30000); // Run GC every 30 seconds
  }

  /**
   * Perform garbage collection on unused buffers
   */
  private performGarbageCollection(): void {
    const now = Date.now();
    const maxAge = 300000; // 5 minutes
    const minAccessCount = 5;

    for (const [bufferId, buffer] of this.bufferPool) {
      if (
        !buffer.isActive &&
        (now - buffer.lastAccess > maxAge ||
          buffer.accessCount < minAccessCount)
      ) {
        this.destroyBuffer(bufferId);
      }
    }

    // Defragment if memory usage is high
    const memoryUsage = this.stats.totalMemory / this.config.maxSize;
    if (memoryUsage > this.config.gcThreshold) {
      this.defragment();
    }
  }

  /**
   * Destroy buffer and free memory
   */
  private destroyBuffer(bufferId: string): void {
    const buffer = this.bufferPool.get(bufferId);
    if (!buffer) return;

    this.stats.totalMemory -= buffer.metadata.byteLength;
    this.bufferPool.delete(bufferId);
    this.freeBuffers.delete(bufferId);
    this.stats.totalBuffers--;

    console.log(`🗑️ Destroyed buffer ${bufferId}`);
  }

  /**
   * Format bytes for display
   */
  private formatBytes(bytes: number): string {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }

  /**
   * Get buffer pool statistics
   */
  getStats(): BufferPoolStats {
    return { ...this.stats };
  }

  /**
   * Get active buffers for a stem
   */
  getActiveBuffers(stemId?: StemId): StemBuffer[] {
    const activeBuffers: StemBuffer[] = [];

    for (const buffer of this.bufferPool.values()) {
      if (buffer.isActive && (!stemId || buffer.stemId === stemId)) {
        activeBuffers.push({ ...buffer });
      }
    }

    return activeBuffers;
  }

  /**
   * Get memory usage for a specific stem
   */
  getStemMemoryUsage(stemId: StemId): number {
    let totalMemory = 0;

    for (const buffer of this.bufferPool.values()) {
      if (buffer.stemId === stemId) {
        totalMemory += buffer.metadata.byteLength;
      }
    }

    return totalMemory;
  }

  /**
   * Preload stem buffers for instant switching
   */
  async preloadStemBuffers(track: StemTrack): Promise<void> {
    console.log(`🚀 Preloading ${track.stems.length} stem buffers...`);

    const preloadPromises = track.stems.map(async (stem) => {
      if (stem.hlsUrl) {
        try {
          // Fetch audio data
          const response = await fetch(stem.hlsUrl);
          const arrayBuffer = await response.arrayBuffer();

          // Load into buffer manager
          await this.loadStemData(stem.id, arrayBuffer);
        } catch (error) {
          console.warn(`Failed to preload stem ${stem.id}:`, error);
        }
      }
    });

    await Promise.allSettled(preloadPromises);
    console.log("✅ Stem buffer preloading completed");
  }

  /**
   * Clear all buffers for a stem
   */
  clearStemBuffers(stemId: StemId): void {
    for (const [bufferId, buffer] of this.bufferPool) {
      if (buffer.stemId === stemId) {
        this.deallocateBuffer(bufferId);
      }
    }

    console.log(`🗑️ Cleared all buffers for stem ${stemId}`);
  }

  /**
   * Clear entire buffer pool
   */
  clearAll(): void {
    for (const bufferId of this.bufferPool.keys()) {
      this.deallocateBuffer(bufferId);
    }

    // Force garbage collection of unused buffers
    this.performGarbageCollection();

    console.log("🗑️ Cleared entire buffer pool");
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return {
      memoryUsage: this.stats.totalMemory / this.config.maxSize,
      fragmentation: this.calculateFragmentationRatio(),
      hitRate: this.stats.hitRate,
      activeBuffers: this.stats.activeBuffers,
      totalBuffers: this.stats.totalBuffers,
    };
  }

  /**
   * Calculate fragmentation ratio
   */
  private calculateFragmentationRatio(): number {
    const totalMemory = this.stats.totalMemory;
    const usedMemory = this.getActiveBuffers().reduce(
      (sum, buffer) => sum + buffer.metadata.byteLength,
      0,
    );
    return totalMemory > 0 ? 1 - usedMemory / totalMemory : 0;
  }

  /**
   * Integrate with global buffer pool manager
   */
  integrateBufferPool(): void {
    // Use global buffer pool manager for enhanced performance
    const globalStats = bufferPoolManager.getStats();

    // Update local stats with global pool information
    this.stats.totalMemory = globalStats.float32Pool.totalAllocated * 4096 * 4;
    this.stats.hitRate = globalStats.float32Pool.hitRate;

    console.log("🔗 Integrated with global buffer pool manager");
  }

  /**
   * Get enhanced statistics including global pool info
   */
  getEnhancedStats(): BufferPoolStats & {
    globalPoolStats: ReturnType<typeof bufferPoolManager.getStats>;
  } {
    return {
      ...this.stats,
      globalPoolStats: bufferPoolManager.getStats(),
    };
  }

  /**
   * Dispose of buffer manager
   */
  dispose(): void {
    // Clear all buffers
    this.clearAll();

    // Clear memory maps
    this.memoryMaps.clear();

    // Reset statistics
    this.stats = {
      totalBuffers: 0,
      activeBuffers: 0,
      pooledBuffers: 0,
      totalMemory: 0,
      peakMemory: 0,
      allocationCount: 0,
      deallocationCount: 0,
      hitRate: 0,
      fragmentationRatio: 0,
    };

    this.isInitialized = false;
    console.log("🗑️ StemBufferManager disposed");
  }
}

/**
 * Ring buffer configuration for different stem types
 */
interface RingBufferConfig {
  size: number;
  lookahead: number; // seconds
  enableSmoothing: boolean;
}
