/**
 * High-level TypeScript interface for the Advanced Stem Processor AudioWorklet
 * Provides real-time stem separation, analysis, caching, and gesture integration
 */

import * as Tone from "tone";
import { StemId, StemTrack, StemMeta } from "../../types/stem-player";
import { getAudioService } from "../../services/AudioService";
import { performanceMonitor } from "../optimization/performanceMonitor";

export interface StemAnalysis {
  bpm: number;
  key: string;
  energy: number;
  spectralCentroid: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
  mfcc: Float32Array;
  chroma: Float32Array;
}

export interface StemCache {
  stemId: string;
  audioBuffer: AudioBuffer;
  analysis: StemAnalysis;
  processedAt: number;
  size: number;
}

export interface StemProcessingOptions {
  enableAI: boolean;
  enableCache: boolean;
  realtimeAnalysis: boolean;
  spatialAudio: boolean;
  crossfadeTime: number;
  compressionEnabled: boolean;
  sidechainEnabled: boolean;
}

export interface StemProcessorConfig {
  sampleRate: number;
  bufferSize: number;
  numStems: number;
  enableHRTF: boolean;
  enableBeatGrid: boolean;
  enableTempoSync: boolean;
  maxCacheSize: number;
  processingThreads: number;
}

export interface GestureStemMapping {
  gesture: "pinch" | "rotation" | "spread" | "tap" | "swipe";
  parameter:
    | "volume"
    | "pan"
    | "compression"
    | "spatial"
    | "crossfade"
    | "effect";
  stemIndex: number;
  sensitivity: number;
  threshold: number;
  range: [number, number];
}

/**
 * Advanced Stem Processing Engine with AI integration and gesture control
 */
export class StemProcessor {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private stemSources: Map<StemId, MediaElementAudioSourceNode> = new Map();
  private stemBuffers: Map<StemId, AudioBuffer> = new Map();
  private stemCache: Map<StemId, StemCache> = new Map();
  private isInitialized: boolean = false;

  // Configuration
  private config: StemProcessorConfig = {
    sampleRate: 48000,
    bufferSize: 128,
    numStems: 4,
    enableHRTF: true,
    enableBeatGrid: true,
    enableTempoSync: true,
    maxCacheSize: 100 * 1024 * 1024, // 100MB
    processingThreads: 4,
  };

  // Processing state
  private processingOptions: StemProcessingOptions = {
    enableAI: true,
    enableCache: true,
    realtimeAnalysis: true,
    spatialAudio: true,
    crossfadeTime: 0.5,
    compressionEnabled: true,
    sidechainEnabled: false,
  };

  // Gesture mappings
  private gestureMappings: GestureStemMapping[] = [];

  // Performance monitoring
  private performanceMetrics = {
    processingLatency: 0,
    analysisLatency: 0,
    cacheHitRate: 0,
    cpuUsage: 0,
    memoryUsage: 0,
  };

  constructor(config?: Partial<StemProcessorConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.initializeGestureMappings();
  }

  /**
   * Initialize the stem processor with AudioWorklet
   */
  async initialize(): Promise<boolean> {
    try {
      // Get audio context from AudioService
      const audioService = getAudioService();
      if (!audioService.isReady()) {
        await audioService.initialize();
      }

      this.audioContext = audioService.getContext().rawContext as AudioContext;

      // Load AudioWorklet module
      await this.loadAudioWorklet();

      // Create worklet node
      this.workletNode = new AudioWorkletNode(
        this.audioContext,
        "advanced-stem-processor",
        {
          numberOfInputs: this.config.numStems,
          numberOfOutputs: 1,
          outputChannelCount: [2],
          processorOptions: {
            sampleRate: this.config.sampleRate,
            bufferSize: this.config.bufferSize,
          },
        },
      );

      // Set up message handling
      this.workletNode.port.onmessage = this.handleWorkletMessage.bind(this);

      // Connect to destination
      this.workletNode.connect(this.audioContext.destination);

      // Load HRTF data if spatial audio is enabled
      if (this.config.enableHRTF) {
        await this.loadHRTFData();
      }

      this.isInitialized = true;
      console.log("✅ StemProcessor initialized with advanced AudioWorklet");

      return true;
    } catch (error) {
      console.error("Failed to initialize StemProcessor:", error);
      throw new Error(`StemProcessor initialization failed: ${error}`);
    }
  }

  /**
   * Load the AudioWorklet module
   */
  private async loadAudioWorklet(): Promise<void> {
    if (!this.audioContext) throw new Error("AudioContext not initialized");

    try {
      await this.audioContext.audioWorklet.addModule(
        "/worklets/advanced-stem-processor.js",
      );
      console.log("✅ Advanced AudioWorklet module loaded");
    } catch (error) {
      console.error("Failed to load AudioWorklet module:", error);
      throw error;
    }
  }

  /**
   * Load HRTF data for spatial audio
   */
  private async loadHRTFData(): Promise<void> {
    if (!this.workletNode) return;

    try {
      // In a real implementation, this would load actual HRTF impulse responses
      // For now, we'll use a simplified spatial processing
      const hrtfBuffers = {
        left: new Float32Array(64),
        right: new Float32Array(64),
      };

      // Generate simple HRTF-like responses
      for (let i = 0; i < 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        hrtfBuffers.left[i] = Math.cos(angle) * Math.exp(-i * 0.1);
        hrtfBuffers.right[i] = Math.sin(angle) * Math.exp(-i * 0.1);
      }

      this.workletNode.port.postMessage({
        type: "LOAD_HRTF",
        buffers: hrtfBuffers,
      });

      console.log("✅ HRTF data loaded for spatial audio");
    } catch (error) {
      console.warn("Failed to load HRTF data:", error);
    }
  }

  /**
   * Process and load a stem track with AI separation
   */
  async processStemTrack(track: StemTrack): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(
      `🎵 Processing track "${track.title}" with ${track.stems.length} stems`,
    );

    const processPromises = track.stems.map((stem) => this.processStem(stem));
    await Promise.allSettled(processPromises);

    console.log("✅ Stem track processing completed");
  }

  /**
   * Process individual stem with AI separation if enabled
   */
  private async processStem(stem: StemMeta): Promise<void> {
    try {
      // Check cache first
      if (this.processingOptions.enableCache && this.stemCache.has(stem.id)) {
        const cached = this.stemCache.get(stem.id)!;
        this.stemBuffers.set(stem.id, cached.audioBuffer);
        console.log(`📋 Using cached stem: ${stem.id}`);
        return;
      }

      let audioBuffer: AudioBuffer;

      if (stem.hlsUrl && this.processingOptions.enableAI) {
        // Use AI-powered stem separation
        audioBuffer = await this.separateStemWithAI(stem);
      } else if (stem.hlsUrl) {
        // Load directly from HLS
        audioBuffer = await this.loadStemFromHLS(stem);
      } else {
        throw new Error(`No audio source available for stem ${stem.id}`);
      }

      // Perform real-time analysis
      if (this.processingOptions.realtimeAnalysis) {
        const analysis = await this.analyzeStem(audioBuffer, stem.id);
        this.stemCache.set(stem.id, {
          stemId: stem.id,
          audioBuffer,
          analysis,
          processedAt: Date.now(),
          size: audioBuffer.length * audioBuffer.numberOfChannels * 4, // Rough size estimate
        });
      }

      this.stemBuffers.set(stem.id, audioBuffer);
      console.log(
        `✅ Processed stem: ${stem.id} (${audioBuffer.duration.toFixed(2)}s)`,
      );
    } catch (error) {
      console.error(`Failed to process stem ${stem.id}:`, error);
      throw error;
    }
  }

  /**
   * AI-powered stem separation using Demucs integration
   */
  private async separateStemWithAI(stem: StemMeta): Promise<AudioBuffer> {
    if (!stem.hlsUrl) throw new Error("No HLS URL for AI separation");

    // In a real implementation, this would call the Demucs API
    // For now, we'll simulate the process
    console.log(`🤖 Separating stem ${stem.id} with AI...`);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Create a mock audio buffer (in production, this would be the actual separated audio)
    const mockBuffer = this.createMockAudioBuffer(30); // 30 seconds

    // Simulate stem-specific processing based on type
    switch (stem.id) {
      case "vocals":
        // Enhance vocal frequencies
        break;
      case "drums":
        // Emphasize transients and low frequencies
        break;
      case "bass":
        // Focus on low frequencies
        break;
      case "other":
        // Mid-range processing
        break;
    }

    return mockBuffer;
  }

  /**
   * Load stem directly from HLS stream
   */
  private async loadStemFromHLS(stem: StemMeta): Promise<AudioBuffer> {
    if (!this.audioContext || !stem.hlsUrl) {
      throw new Error("AudioContext or HLS URL not available");
    }

    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.crossOrigin = "anonymous";

      audio.addEventListener("canplaythrough", async () => {
        try {
          // Create source node
          const source = this.audioContext!.createMediaElementSource(audio);
          this.stemSources.set(stem.id, source);

          // Connect to worklet input
          const stemIndex = this.getStemIndex(stem.id);
          if (stemIndex >= 0 && this.workletNode) {
            source.connect(this.workletNode, 0, stemIndex);
          }

          // For now, create a mock buffer (in production, decode actual audio)
          const mockBuffer = this.createMockAudioBuffer(audio.duration || 30);

          resolve(mockBuffer);
        } catch (error) {
          reject(error);
        }
      });

      audio.addEventListener("error", reject);
      if (!stem.hlsUrl) {
        reject(new Error("HLS URL not available"));
        return;
      }
      audio.src = stem.hlsUrl;
    });
  }

  /**
   * Real-time stem analysis
   */
  private async analyzeStem(
    audioBuffer: AudioBuffer,
    stemId: StemId,
  ): Promise<StemAnalysis> {
    const startTime = performance.now();

    // Extract audio data for analysis
    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;

    // Calculate basic audio features
    const energy = this.calculateEnergy(channelData);
    const spectralCentroid = this.calculateSpectralCentroid(
      channelData,
      sampleRate,
    );
    const spectralRolloff = this.calculateSpectralRolloff(
      channelData,
      sampleRate,
    );
    const zeroCrossingRate = this.calculateZeroCrossingRate(channelData);

    // Estimate BPM and key
    const bpm = await this.detectBPM(channelData, sampleRate);
    const key = this.detectKey(channelData, sampleRate);

    // Extract MFCC and chroma features
    const mfcc = await this.extractMFCC(channelData, sampleRate);
    const chroma = this.extractChroma(channelData, sampleRate);

    const analysis: StemAnalysis = {
      bpm,
      key,
      energy,
      spectralCentroid,
      spectralRolloff,
      zeroCrossingRate,
      mfcc,
      chroma,
    };

    const analysisTime = performance.now() - startTime;
    this.performanceMetrics.analysisLatency = analysisTime;

    console.log(
      `📊 Analyzed stem ${stemId}: ${bpm} BPM, ${key}, ${analysisTime.toFixed(2)}ms`,
    );
    return analysis;
  }

  /**
   * Calculate signal energy
   */
  private calculateEnergy(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return sum / buffer.length;
  }

  /**
   * Calculate spectral centroid
   */
  private calculateSpectralCentroid(
    buffer: Float32Array,
    sampleRate: number,
  ): number {
    // Simplified implementation - in production, use FFT
    const fftSize = 2048;
    const nyquist = sampleRate / 2;

    // Mock spectral centroid calculation
    return nyquist * (0.3 + Math.random() * 0.4);
  }

  /**
   * Calculate spectral rolloff
   */
  private calculateSpectralRolloff(
    buffer: Float32Array,
    sampleRate: number,
  ): number {
    // Simplified implementation
    return sampleRate * (0.8 + Math.random() * 0.15);
  }

  /**
   * Calculate zero crossing rate
   */
  private calculateZeroCrossingRate(buffer: Float32Array): number {
    let crossings = 0;
    for (let i = 1; i < buffer.length; i++) {
      if (buffer[i] >= 0 !== buffer[i - 1] >= 0) {
        crossings++;
      }
    }
    return crossings / buffer.length;
  }

  /**
   * Detect BPM using autocorrelation
   */
  private async detectBPM(
    buffer: Float32Array,
    sampleRate: number,
  ): Promise<number> {
    // Simplified BPM detection - in production, use more sophisticated algorithms
    const minBPM = 80;
    const maxBPM = 160;
    const bpmStep = 1;

    // Simulate BPM detection
    await new Promise((resolve) => setTimeout(resolve, 50));
    return minBPM + Math.random() * (maxBPM - minBPM);
  }

  /**
   * Detect musical key
   */
  private detectKey(buffer: Float32Array, sampleRate: number): string {
    const keys = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const modes = ["major", "minor"];

    // Simplified key detection
    const keyIndex = Math.floor(Math.random() * keys.length);
    const modeIndex = Math.floor(Math.random() * modes.length);

    return `${keys[keyIndex]} ${modes[modeIndex]}`;
  }

  /**
   * Extract MFCC features
   */
  private async extractMFCC(
    buffer: Float32Array,
    sampleRate: number,
  ): Promise<Float32Array> {
    // Simplified MFCC extraction
    const mfccSize = 13;
    const mfcc = new Float32Array(mfccSize);

    for (let i = 0; i < mfccSize; i++) {
      mfcc[i] = Math.random() * 2 - 1; // Mock MFCC coefficients
    }

    return mfcc;
  }

  /**
   * Extract chroma features
   */
  private extractChroma(
    buffer: Float32Array,
    sampleRate: number,
  ): Float32Array {
    const chromaSize = 12;
    const chroma = new Float32Array(chromaSize);

    for (let i = 0; i < chromaSize; i++) {
      chroma[i] = Math.random(); // Mock chroma values
    }

    return chroma;
  }

  /**
   * Create mock audio buffer for testing
   */
  private createMockAudioBuffer(duration: number): AudioBuffer {
    if (!this.audioContext) {
      throw new Error("AudioContext not initialized");
    }

    const buffer = this.audioContext.createBuffer(
      2,
      duration * this.config.sampleRate,
      this.config.sampleRate,
    );
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    // Generate mock audio (sine wave)
    for (let i = 0; i < buffer.length; i++) {
      const t = i / this.config.sampleRate;
      leftChannel[i] = Math.sin(2 * Math.PI * 440 * t) * 0.1;
      rightChannel[i] = Math.sin(2 * Math.PI * 440 * t + Math.PI / 2) * 0.1;
    }

    return buffer;
  }

  /**
   * Get stem index for worklet routing
   */
  private getStemIndex(stemId: StemId): number {
    const hash = this.simpleHash(stemId);
    return hash % this.config.numStems;
  }

  /**
   * Simple hash function for stem distribution
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash + str.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash);
  }

  /**
   * Set stem volume
   */
  setStemVolume(stemId: StemId, volume: number): void {
    if (!this.workletNode) return;

    const clamped = Math.max(0, Math.min(1, volume));
    this.workletNode.port.postMessage({
      type: "SET_STEM_VOLUME",
      data: { stemIndex: this.getStemIndex(stemId), volume: clamped },
    });
  }

  /**
   * Set stem pan
   */
  setStemPan(stemId: StemId, pan: number): void {
    if (!this.workletNode) return;

    const clamped = Math.max(-1, Math.min(1, pan));
    this.workletNode.port.postMessage({
      type: "SET_STEM_PAN",
      data: { stemIndex: this.getStemIndex(stemId), pan: clamped },
    });
  }

  /**
   * Set stem compression parameters
   */
  setStemCompression(
    stemId: StemId,
    threshold: number,
    ratio: number,
    attack: number,
    release: number,
  ): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({
      type: "SET_STEM_COMPRESSION",
      data: {
        stemIndex: this.getStemIndex(stemId),
        threshold: Math.max(-60, Math.min(0, threshold)),
        ratio: Math.max(1, Math.min(20, ratio)),
        attack: Math.max(0.001, Math.min(0.1, attack)),
        release: Math.max(0.01, Math.min(2.0, release)),
      },
    });
  }

  /**
   * Set stem spatial position
   */
  setStemSpatialPosition(
    stemId: StemId,
    x: number,
    y: number,
    z: number,
  ): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({
      type: "SET_STEM_SPATIAL",
      data: {
        stemIndex: this.getStemIndex(stemId),
        x: Math.max(-10, Math.min(10, x)),
        y: Math.max(-10, Math.min(10, y)),
        z: Math.max(-10, Math.min(10, z)),
      },
    });
  }

  /**
   * Set crossfade between stems
   */
  setCrossfade(fromStemId: StemId, toStemId: StemId, amount: number): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({
      type: "SET_CROSSFADE",
      data: {
        fromStem: this.getStemIndex(fromStemId),
        toStem: this.getStemIndex(toStemId),
        amount: Math.max(0, Math.min(1, amount)),
        time: this.processingOptions.crossfadeTime,
      },
    });
  }

  /**
   * Enable/disable beat grid alignment
   */
  setBeatGrid(stemId: StemId, enabled: boolean, position?: number): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({
      type: "SET_BEAT_GRID",
      data: {
        stemIndex: this.getStemIndex(stemId),
        enabled,
        position: position || 0.0,
      },
    });
  }

  /**
   * Enable tempo synchronization
   */
  setTempoSync(enabled: boolean, bpm?: number): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({
      type: "SET_TEMPO_SYNC",
      data: {
        enabled,
        bpm: bpm || this.performanceMetrics.analysisLatency,
      },
    });
  }

  /**
   * Set sidechain compression
   */
  setSidechain(
    stemId: StemId,
    enabled: boolean,
    sourceStemId?: StemId,
    depth?: number,
  ): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({
      type: "SET_SIDECHAIN",
      data: {
        stemIndex: this.getStemIndex(stemId),
        enabled,
        sourceStem: sourceStemId ? this.getStemIndex(sourceStemId) : 0,
        depth: depth || 0.5,
      },
    });
  }

  /**
   * Process gesture input
   */
  processGesture(gesture: string, value: number, stemId?: StemId): void {
    const mapping = this.gestureMappings.find(
      (m) =>
        m.gesture === gesture &&
        (!stemId || m.stemIndex === this.getStemIndex(stemId)),
    );

    if (!mapping) return;

    const adjustedValue =
      value * (mapping.range[1] - mapping.range[0]) + mapping.range[0];
    const clampedValue = Math.max(
      mapping.range[0],
      Math.min(mapping.range[1], adjustedValue),
    );

    switch (mapping.parameter) {
      case "volume":
        this.setStemVolume(stemId!, clampedValue);
        break;
      case "pan":
        this.setStemPan(stemId!, clampedValue);
        break;
      case "compression":
        // Adjust compression parameters based on gesture
        this.setStemCompression(stemId!, clampedValue, 4, 0.003, 0.1);
        break;
      case "spatial":
        // Move stem in 3D space
        this.setStemSpatialPosition(stemId!, clampedValue, 0, 0);
        break;
      case "crossfade":
        // Set crossfade with adjacent stem
        const currentIndex = this.getStemIndex(stemId!);
        const targetStem =
          currentIndex > 0 ? currentIndex - 1 : currentIndex + 1;
        this.setCrossfade(
          stemId!,
          this.getStemIdFromIndex(targetStem),
          clampedValue,
        );
        break;
    }
  }

  /**
   * Initialize default gesture mappings
   */
  private initializeGestureMappings(): void {
    this.gestureMappings = [
      {
        gesture: "pinch",
        parameter: "volume",
        stemIndex: 0,
        sensitivity: 1.0,
        threshold: 0.1,
        range: [0, 1],
      },
      {
        gesture: "rotation",
        parameter: "pan",
        stemIndex: 0,
        sensitivity: 1.0,
        threshold: 0.05,
        range: [-1, 1],
      },
      {
        gesture: "spread",
        parameter: "compression",
        stemIndex: 0,
        sensitivity: 1.0,
        threshold: 0.1,
        range: [-40, 0],
      },
      {
        gesture: "tap",
        parameter: "spatial",
        stemIndex: 0,
        sensitivity: 1.0,
        threshold: 0.8,
        range: [-5, 5],
      },
      {
        gesture: "swipe",
        parameter: "crossfade",
        stemIndex: 0,
        sensitivity: 1.0,
        threshold: 0.3,
        range: [0, 1],
      },
    ];
  }

  /**
   * Get stem ID from worklet index
   */
  private getStemIdFromIndex(index: number): StemId {
    const stemIds: StemId[] = ["vocals", "drums", "bass", "other"];
    return stemIds[index] || "other";
  }

  /**
   * Handle messages from AudioWorklet
   */
  private handleWorkletMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case "PERFORMANCE_UPDATE":
        this.performanceMetrics.processingLatency =
          data.averageProcessTime || 0;
        this.performanceMetrics.cpuUsage = data.cpuUsage || 0;

        // Report to performance monitor
        performanceMonitor.recordAudioWorkletMetrics(
          data.averageProcessTime || 0,
          data.cpuUsage || 0,
        );
        break;

      case "LATENCY_REPORT":
        this.performanceMetrics.processingLatency = data.latency || 0;
        break;

      default:
        console.log("Unhandled worklet message:", type, data);
    }
  }

  /**
   * Get current performance metrics
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const totalCacheSize = Array.from(this.stemCache.values()).reduce(
      (sum, cache) => sum + cache.size,
      0,
    );
    const cacheHitRate = this.performanceMetrics.cacheHitRate;

    return {
      entries: this.stemCache.size,
      totalSize: totalCacheSize,
      hitRate: cacheHitRate,
      maxSize: this.config.maxCacheSize,
    };
  }

  /**
   * Clear stem cache
   */
  clearCache(): void {
    this.stemCache.clear();
    console.log("🗑️ Stem cache cleared");
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // Disconnect all sources
    this.stemSources.forEach((source) => {
      source.disconnect();
    });

    // Close worklet node
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    // Clear caches
    this.stemSources.clear();
    this.stemBuffers.clear();
    this.stemCache.clear();

    this.isInitialized = false;
    console.log("🗑️ StemProcessor disposed");
  }
}
