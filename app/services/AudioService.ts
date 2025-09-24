import * as Tone from "tone";
import safeAudioContext from "../lib/audio/safeAudioContext";
import type {
  AudioServiceConfig,
  AudioServiceStats,
  AudioServiceInterface,
} from "./types/audio";

/**
 * @class AudioService
 * @implements {AudioServiceInterface}
 * @description Core audio context management service for the OX Board DJ application.
 * Manages Web Audio API context lifecycle, provides factory methods for audio nodes,
 * monitors performance metrics, and handles the master audio routing graph.
 *
 * @singleton
 * @since 0.1.0
 *
 * @example
 * ```typescript
 * // Get singleton instance
 * const audioService = getAudioService();
 *
 * // Initialize audio context
 * await audioService.initialize();
 *
 * // Create audio nodes
 * const gain = audioService.createGain(0.5);
 * const eq = audioService.createEQ3();
 * ```
 */
export class AudioService implements AudioServiceInterface {
  private static instance: AudioService | null = null;
  private context: Tone.Context | null = null;
  private initialized: boolean = false;
  private stats: AudioServiceStats = {
    latency: 0,
    cpuUsage: 0,
    isRunning: false,
    sampleRate: 44100,
    bufferSize: 256,
  };
  private config: AudioServiceConfig = {
    latencyHint: "interactive",
    lookAhead: 0.1,
    updateInterval: 0.05,
    sampleRate: 44100,
    channels: 2,
  };
  private performanceMonitor: NodeJS.Timeout | null = null;
  private masterGain: Tone.Gain | null = null;
  private cueGain: Tone.Gain | null = null;
  private masterOutput: Tone.Gain | null = null;
  private crossfader: Tone.CrossFade | null = null;
  private masterVolume: number = 1;
  private crossfaderValue: number = 0.5;

  private constructor(config?: Partial<AudioServiceConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
  }

  public static getInstance(
    config?: Partial<AudioServiceConfig>,
  ): AudioService {
    if (!AudioService.instance) {
      AudioService.instance = new AudioService(config);
    }
    return AudioService.instance;
  }

  public async initialize(): Promise<boolean> {
    if (this.initialized) {
      console.warn("AudioService already initialized");
      return true;
    }

    try {
      // First ensure safe audio context is initialized
      const audioContextReady = await safeAudioContext.initialize();
      if (!audioContextReady) {
        const state = safeAudioContext.getState();
        if (state.isUserGestureRequired) {
          throw new Error(
            "User gesture required to initialize audio. Please click to start.",
          );
        }
        throw new Error("Failed to initialize audio context");
      }

      // Create context with configuration
      this.context = new Tone.Context({
        latencyHint: this.config.latencyHint,
        lookAhead: this.config.lookAhead,
        updateInterval: this.config.updateInterval,
      });

      // Set as default context
      Tone.setContext(this.context);

      // Verify context is running
      if (this.context.rawContext.state !== "running") {
        await this.context.resume();
      }

      // Create master routing graph
      this.masterGain = new Tone.Gain(this.masterVolume);
      this.cueGain = new Tone.Gain(0);
      this.masterOutput = new Tone.Gain(1);
      this.crossfader = new Tone.CrossFade(this.crossfaderValue);

      this.crossfader.a.connect(this.masterGain);
      this.crossfader.b.connect(this.masterGain);
      this.masterGain.connect(this.masterOutput);
      this.masterOutput.connect(Tone.getDestination());
      this.cueGain.connect(Tone.getDestination());

      // Update stats
      this.stats.sampleRate = this.context.sampleRate;
      this.stats.isRunning = true;
      this.stats.latency =
        ((this.context.rawContext as any)?.baseLatency || 0) +
        this.context.lookAhead;

      // Start performance monitoring
      this.startPerformanceMonitoring();

      this.initialized = true;
      console.log("AudioService initialized successfully", this.stats);
      return true;
    } catch (error) {
      console.error("Failed to initialize AudioService:", error);
      throw new Error(`AudioService initialization failed: ${error}`);
    }
  }

  public getContext(): Tone.Context {
    if (!this.context) {
      throw new Error("AudioService not initialized. Call initialize() first.");
    }
    return this.context;
  }

  public isReady(): boolean {
    return (
      this.initialized &&
      this.context !== null &&
      this.context.state === "running"
    );
  }

  public dispose(): void {
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor);
      this.performanceMonitor = null;
    }

    if (this.crossfader) {
      this.crossfader.dispose();
      this.crossfader = null;
    }

    if (this.masterGain) {
      this.masterGain.dispose();
      this.masterGain = null;
    }

    if (this.masterOutput) {
      this.masterOutput.dispose();
      this.masterOutput = null;
    }

    if (this.cueGain) {
      this.cueGain.dispose();
      this.cueGain = null;
    }

    if (this.context) {
      // Stop all sounds
      Tone.Transport.stop();
      Tone.Transport.cancel();

      // Dispose of context
      this.context.dispose();
      this.context = null;
    }

    this.initialized = false;
    this.stats.isRunning = false;
    AudioService.instance = null;

    console.log("AudioService disposed");
  }

  public getStats(): AudioServiceStats {
    if (this.context) {
      this.stats.latency =
        ((this.context.rawContext as any)?.baseLatency || 0) +
        this.context.lookAhead;
      // CPU usage would need Web Audio API performance metrics
      // This is a placeholder - actual implementation would use performance.measureUserAgentSpecificMemory()
      this.stats.cpuUsage = this.estimateCPUUsage();
    }
    return { ...this.stats };
  }

  public async suspend(): Promise<void> {
    if (
      this.context &&
      this.context.state === "running" &&
      this.context.rawContext
    ) {
      await (this.context.rawContext as any).suspend();
      this.stats.isRunning = false;
      console.log("AudioService suspended");
    }
  }

  public async resume(): Promise<void> {
    if (
      this.context &&
      this.context.state === "suspended" &&
      this.context.rawContext
    ) {
      await (this.context.rawContext as any).resume();
      this.stats.isRunning = true;
      console.log("AudioService resumed");
    }
  }

  public setLatencyHint(hint: "interactive" | "playback" | "balanced"): void {
    // Note: latencyHint is read-only once context is created
    // We can only update our config for next initialization
    this.config.latencyHint = hint;
    if (this.context) {
      this.stats.latency =
        ((this.context.rawContext as any)?.baseLatency || 0) +
        this.context.lookAhead;
    }
  }

  public getTransport(): typeof Tone.Transport {
    if (!this.isReady()) {
      throw new Error("AudioService not ready");
    }
    return Tone.Transport;
  }

  public getMaster(): ReturnType<typeof Tone.getDestination> {
    if (!this.isReady()) {
      throw new Error("AudioService not ready");
    }
    return Tone.getDestination();
  }

  public setMasterVolume(volume: number): void {
    const clamped = Math.max(0, Math.min(1, volume));
    this.masterVolume = clamped;
    if (this.masterGain) {
      this.masterGain.gain.rampTo(clamped, 0.01);
    }
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public setCrossfaderValue(value: number): void {
    const clamped = Math.max(0, Math.min(1, value));
    this.crossfaderValue = clamped;
    if (this.crossfader) {
      this.crossfader.fade.rampTo(clamped, 0.01);
    }
  }

  public getCrossfaderValue(): number {
    return this.crossfaderValue;
  }

  public cleanup(): void {
    this.dispose();
  }

  // Performance monitoring
  private startPerformanceMonitoring(): void {
    if (this.performanceMonitor) {
      clearInterval(this.performanceMonitor);
    }

    this.performanceMonitor = setInterval(() => {
      if (this.context && this.context.state === "running") {
        this.updatePerformanceStats();
      }
    }, 1000); // Update every second
  }

  private updatePerformanceStats(): void {
    if (!this.context) return;

    // Update latency
    this.stats.latency =
      ((this.context.rawContext as any)?.baseLatency || 0) +
      this.context.lookAhead;

    // Update buffer size if available
    if (this.context.rawContext) {
      const audioContext = this.context.rawContext as AudioContext;
      if ((audioContext as any).baseLatency) {
        this.stats.bufferSize = Math.round(
          (audioContext as any).baseLatency * audioContext.sampleRate,
        );
      }
    }

    // Estimate CPU usage
    this.stats.cpuUsage = this.estimateCPUUsage();
  }

  private estimateCPUUsage(): number {
    // This is a simplified estimation
    // Real implementation would use Web Audio API analytics
    if (!this.context) return 0;

    // activeVoices doesn't exist on Context, return placeholder value
    // A real implementation would track active audio nodes
    return 0;
  }

  // Utility methods
  public createGain(gain: number = 1): Tone.Gain {
    if (!this.isReady()) {
      throw new Error("AudioService not ready");
    }
    return new Tone.Gain(gain);
  }

  public createEQ3(): Tone.EQ3 {
    if (!this.isReady()) {
      throw new Error("AudioService not ready");
    }
    return new Tone.EQ3();
  }

  public createFilter(frequency: number = 1000): Tone.Filter {
    if (!this.isReady()) {
      throw new Error("AudioService not ready");
    }
    return new Tone.Filter(frequency, "lowpass");
  }

  public createCompressor(): Tone.Compressor {
    if (!this.isReady()) {
      throw new Error("AudioService not ready");
    }
    return new Tone.Compressor();
  }

  public createLimiter(): Tone.Limiter {
    if (!this.isReady()) {
      throw new Error("AudioService not ready");
    }
    return new Tone.Limiter(-3);
  }

  // Debug utilities
  public debugInfo(): void {
    console.group("AudioService Debug Info");
    console.log("Initialized:", this.initialized);
    console.log("Context State:", this.context?.state);
    console.log("Stats:", this.stats);
    console.log("Config:", this.config);
    console.log("Transport State:", Tone.Transport.state);
    console.log("Transport BPM:", Tone.Transport.bpm.value);
    console.groupEnd();
  }
}

// Export singleton getter
export const getAudioService = (
  config?: Partial<AudioServiceConfig>,
): AudioService => {
  return AudioService.getInstance(config);
};
