"use client";

import { StemMeta, StemTrack } from "../../types/stem-player";
import { performanceMonitor } from "../optimization/performanceMonitor";

/**
 * Low-latency stem playback engine using AudioWorklet for sub-10ms latency
 * @class StemPlaybackEngine
 */
export class StemPlaybackEngine {
  private context: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private stemSources: Map<string, MediaElementAudioSourceNode> = new Map();
  private stemBuffers: Map<string, AudioBuffer> = new Map();
  private isInitialized: boolean = false;
  private masterVolume: number = 0.8;
  private performanceStats = {
    latency: 0,
    cpuUsage: 0,
    bufferSize: 128,
    processCount: 0,
  };

  /**
   * Initialize the AudioWorklet-based playback engine
   */
  async initialize(): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      // Create AudioContext with optimized settings
      this.context = new AudioContext({
        latencyHint: "interactive",
        sampleRate: 48000,
      });

      // Resume context if needed
      if (this.context.state === "suspended") {
        await this.context.resume();
      }

      // Load and create AudioWorklet
      await this.loadAudioWorklet();

      // Create worklet node with 4 inputs (one per stem) and 1 output
      this.workletNode = new AudioWorkletNode(this.context, "stem-processor", {
        numberOfInputs: 4,
        numberOfOutputs: 1,
        outputChannelCount: [2], // Stereo output
        processorOptions: {
          sampleRate: this.context.sampleRate,
          bufferSize: 128,
        },
      });

      // Connect worklet to destination
      this.workletNode.connect(this.context.destination);

      // Set up message handling
      this.workletNode.port.onmessage = this.handleWorkletMessage.bind(this);

      // Set initial master volume
      this.workletNode.port.postMessage({
        type: "SET_MASTER_VOLUME",
        volume: this.masterVolume,
      });

      this.isInitialized = true;
      console.log(
        `🎵 StemPlaybackEngine initialized with AudioWorklet (${this.context.sampleRate}Hz, 128 samples buffer)`,
      );

      // Start performance monitoring
      this.startLatencyMonitoring();
    } catch (error) {
      console.error("Failed to initialize StemPlaybackEngine:", error);
      throw new Error(`AudioWorklet initialization failed: ${error}`);
    }
  }

  /**
   * Load the AudioWorklet module
   */
  private async loadAudioWorklet(): Promise<void> {
    if (!this.context) throw new Error("AudioContext not initialized");

    try {
      await this.context.audioWorklet.addModule("/worklets/stem-processor.js");
      console.log("✅ AudioWorklet module loaded successfully");
    } catch (error) {
      console.error("Failed to load AudioWorklet module:", error);
      throw error;
    }
  }

  /**
   * Check if engine is ready
   */
  isReady(): boolean {
    return this.isInitialized && this.context?.state === "running";
  }

  /**
   * Get current state
   */
  getState(): AudioContextState | "uninitialized" {
    if (!this.context) return "uninitialized";
    return this.context.state;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    return { ...this.performanceStats };
  }

  /**
   * Load audio track with stems
   */
  async loadTrack(track: StemTrack): Promise<void> {
    if (!this.isReady()) {
      await this.initialize();
    }

    console.log(
      `Loading track "${track.title}" with ${track.stems.length} stems`,
    );

    // Decode and load stem audio buffers
    const loadPromises = track.stems.map(async (stem) => {
      try {
        if (stem.hlsUrl) {
          // For HLS streams, create MediaElement sources
          return await this.loadStemFromHLS(stem);
        } else {
          // For direct audio URLs, fetch and decode
          return await this.loadStemFromURL(stem);
        }
      } catch (error) {
        console.error(`Failed to load stem ${stem.id}:`, error);
        return null;
      }
    });

    const results = await Promise.allSettled(loadPromises);
    const successful = results.filter((r) => r.status === "fulfilled").length;

    console.log(
      `✅ Loaded ${successful}/${track.stems.length} stems successfully`,
    );
  }

  /**
   * Load stem from HLS URL
   */
  private async loadStemFromHLS(
    stem: StemMeta,
  ): Promise<MediaElementAudioSourceNode | null> {
    if (!this.context || !stem.hlsUrl) return null;

    try {
      // Create HTML audio element for HLS
      const audio = document.createElement("audio");
      audio.crossOrigin = "anonymous";
      audio.preload = "none";

      // Set up audio element for streaming
      audio.src = stem.hlsUrl;

      // Create source node
      const source = this.context.createMediaElementSource(audio);

      // Connect to appropriate worklet input based on stem index
      const stemIndex = this.getStemIndex(stem.id);
      if (stemIndex >= 0) {
        source.connect(this.workletNode!, stemIndex, 0);
      }

      // Store reference
      this.stemSources.set(stem.id, source);

      // Set initial volume
      this.setStemVolume(stem.id, stem.volume);
      this.setStemMute(stem.id, stem.muted);

      console.log(`✅ Loaded HLS stem ${stem.id} to input ${stemIndex}`);
      return source;
    } catch (error) {
      console.error(`Failed to load HLS stem ${stem.id}:`, error);
      return null;
    }
  }

  /**
   * Load stem from direct URL (fallback for stems without HLS)
   */
  private async loadStemFromURL(
    stem: StemMeta,
  ): Promise<AudioBufferSourceNode | null> {
    // For now, return null since we primarily use HLS
    // In a full implementation, this would fetch from a direct URL
    console.warn(
      `Stem ${stem.id} has no HLS URL - direct URL loading not implemented yet`,
    );
    return null;
  }

  /**
   * Update stem volume
   */
  setStemVolume(stemId: string, volume: number): void {
    if (!this.workletNode) return;

    const clamped = Math.max(0, Math.min(1, volume));
    this.workletNode.port.postMessage({
      type: "SET_STEM_VOLUME",
      data: { stemIndex: this.getStemIndex(stemId), volume: clamped },
    });
  }

  /**
   * Update stem mute state
   */
  setStemMute(stemId: string, muted: boolean): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({
      type: "SET_STEM_MUTE",
      data: { stemIndex: this.getStemIndex(stemId), muted },
    });
  }

  /**
   * Update stem EQ
   */
  setStemEQ(stemId: string, band: "low" | "mid" | "high", value: number): void {
    if (!this.workletNode) return;

    this.workletNode.port.postMessage({
      type: "SET_STEM_EQ",
      data: {
        stemIndex: this.getStemIndex(stemId),
        band,
        value: Math.max(-20, Math.min(20, value)),
      },
    });
  }

  /**
   * Start playback
   */
  async play(): Promise<void> {
    if (!this.context) return;

    try {
      if (this.context.state === "suspended") {
        await this.context.resume();
      }

      // Start all buffer sources
      this.stemSources.forEach((source, stemId) => {
        const audio = (source as any).mediaElement;
        if (audio && audio.play) {
          audio.play().catch(console.error);
        }
      });

      console.log(`▶️ Started playback of ${this.stemSources.size} stems`);
    } catch (error) {
      console.error("Failed to start playback:", error);
    }
  }

  /**
   * Pause playback
   */
  async pause(): Promise<void> {
    if (!this.context) return;

    try {
      await this.context.suspend();

      // Pause all media elements
      this.stemSources.forEach((source) => {
        const audio = (source as any).mediaElement;
        if (audio && audio.pause) {
          audio.pause();
        }
      });

      console.log("⏸️ Paused playback");
    } catch (error) {
      console.error("Failed to pause:", error);
    }
  }

  /**
   * Stop playback
   */
  async stop(): Promise<void> {
    await this.pause();
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // Stop all sources
    this.stemSources.forEach((source) => {
      try {
        const audio = (source as any).mediaElement;
        if (audio && audio.pause) {
          audio.pause();
        }
        source.disconnect();
      } catch (error) {
        console.warn("Error disconnecting stem source:", error);
      }
    });

    // Close context
    if (this.context && this.context.state !== "closed") {
      this.context.close();
    }

    this.stemSources.clear();
    this.stemBuffers.clear();
    this.workletNode = null;
    this.context = null;
    this.isInitialized = false;

    console.log("🗑️ StemPlaybackEngine disposed");
  }

  /**
   * Get stem index from ID
   */
  private getStemIndex(stemId: string): number {
    // Simple hash function to distribute stems across 4 inputs
    let hash = 0;
    for (let i = 0; i < stemId.length; i++) {
      hash = ((hash << 5) - hash + stemId.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash) % 4;
  }

  /**
   * Handle messages from AudioWorklet
   */
  private handleWorkletMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case "PERFORMANCE_UPDATE":
        this.performanceStats = { ...this.performanceStats, ...data.stats };

        // Report to performance monitor
        performanceMonitor.recordAudioWorkletMetrics(
          data.stats.averageProcessTime || 0,
          data.stats.cpuUsage || 0,
        );
        break;

      case "LATENCY_REPORT":
        this.performanceStats.latency = data.latency;

        // Report latency to performance monitor
        if (data.latency > 0) {
          performanceMonitor.endAudioLatencyMeasurement();
        }
        break;

      default:
        console.log("Unknown worklet message:", type, data);
    }
  }

  /**
   * Start latency monitoring
   */
  private startLatencyMonitoring(): void {
    if (!this.workletNode) return;

    // Request latency updates every 5 seconds
    setInterval(() => {
      this.workletNode!.port.postMessage({ type: "GET_LATENCY" });
    }, 5000);
  }
}
