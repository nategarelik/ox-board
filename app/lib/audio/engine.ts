import * as Tone from 'tone';

/**
 * AudioEngine - Core audio processing engine for OX-Board DJ application
 *
 * Manages Tone.js AudioContext, dual-deck architecture, and audio graph routing.
 * Optimized for professional DJ use with <20ms latency and high-quality audio processing.
 */
export class AudioEngine {
  private static instance: AudioEngine | null = null;

  // Core audio components
  public readonly context: Tone.Context;
  public readonly masterGain: Tone.Gain;
  public readonly masterLimiter: Tone.Limiter;

  // Audio graph nodes
  private readonly audioGraph: Map<string, Tone.ToneAudioNode> = new Map();

  // Configuration
  private readonly config = {
    sampleRate: 48000,
    bufferSize: 128,
    maxLatency: 20, // ms
    maxMemoryUsage: 500 * 1024 * 1024, // 500MB
  };

  // Performance monitoring
  private performanceMetrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    latency: 0,
    dropouts: 0,
  };

  private constructor() {
    // Initialize Tone.js context with optimal settings
    this.context = new Tone.Context({
      sampleRate: this.config.sampleRate,
      latencyHint: 'interactive', // Prioritize low latency
      lookAhead: 0.05, // 50ms lookahead for scheduling
    });

    // Set up master output chain
    this.masterGain = new Tone.Gain(1).toDestination();
    this.masterLimiter = new Tone.Limiter(-1); // -1dB threshold to prevent clipping

    // Connect master chain
    this.masterLimiter.connect(this.masterGain);

    // Register nodes in audio graph
    this.audioGraph.set('masterGain', this.masterGain);
    this.audioGraph.set('masterLimiter', this.masterLimiter);

    this.initializePerformanceMonitoring();
  }

  /**
   * Get singleton instance of AudioEngine
   */
  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initialize audio context and start monitoring
   */
  public async initialize(): Promise<void> {
    try {
      // Start audio context
      if (this.context.state !== 'running') {
        await this.context.resume();
      }

      // Verify optimal settings
      if (this.context.sampleRate !== this.config.sampleRate) {
        console.warn(`Audio context using ${this.context.sampleRate}Hz instead of optimal ${this.config.sampleRate}Hz`);
      }

      // Test latency
      const latency = this.measureLatency();
      if (latency > this.config.maxLatency) {
        console.warn(`Audio latency ${latency}ms exceeds target ${this.config.maxLatency}ms`);
      }

      console.log('AudioEngine initialized successfully', {
        sampleRate: this.context.sampleRate,
        bufferSize: this.config.bufferSize,
        latency: `${latency}ms`,
        state: this.context.state
      });

    } catch (error) {
      console.error('Failed to initialize AudioEngine:', error);
      throw new Error(`AudioEngine initialization failed: ${error}`);
    }
  }

  /**
   * Create and register an audio source for deck
   */
  public createDeckSource(deckId: string): AudioSource {
    const source = new AudioSource(deckId, this);
    this.audioGraph.set(`deck_${deckId}`, source.outputNode);
    return source;
  }

  /**
   * Get audio graph node by key
   */
  public getNode(key: string): Tone.ToneAudioNode | undefined {
    return this.audioGraph.get(key);
  }

  /**
   * Register audio graph node
   */
  public registerNode(key: string, node: Tone.ToneAudioNode): void {
    this.audioGraph.set(key, node);
  }

  /**
   * Get master output for connecting audio chains
   */
  public getMasterOutput(): Tone.Limiter {
    return this.masterLimiter;
  }

  /**
   * Load audio file and create buffer
   */
  public async loadAudioFile(url: string): Promise<Tone.ToneAudioBuffer> {
    try {
      const buffer = new Tone.ToneAudioBuffer();
      await buffer.load(url);

      // Monitor memory usage
      this.updateMemoryUsage();

      return buffer;
    } catch (error) {
      console.error('Failed to load audio file:', error);
      throw new Error(`Audio file loading failed: ${error}`);
    }
  }

  /**
   * Measure current audio latency
   */
  private measureLatency(): number {
    // Calculate total latency: context latency + buffer size latency
    const contextLatency = (this.context.baseLatency || 0) * 1000; // Convert to ms
    const bufferLatency = (this.config.bufferSize / this.context.sampleRate) * 1000;
    return contextLatency + bufferLatency;
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring(): void {
    // Monitor performance every 1 second
    setInterval(() => {
      this.performanceMetrics.latency = this.measureLatency();
      this.updateMemoryUsage();

      // Log performance warnings
      if (this.performanceMetrics.latency > this.config.maxLatency) {
        console.warn('Audio latency exceeded threshold:', this.performanceMetrics.latency);
      }

      if (this.performanceMetrics.memoryUsage > this.config.maxMemoryUsage) {
        console.warn('Memory usage exceeded threshold:', this.performanceMetrics.memoryUsage / (1024 * 1024), 'MB');
      }
    }, 1000);
  }

  /**
   * Update memory usage metrics
   */
  private updateMemoryUsage(): void {
    if (performance.memory) {
      this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
    }
  }

  /**
   * Get current performance metrics
   */
  public getPerformanceMetrics(): typeof this.performanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Dispose of audio engine and clean up resources
   */
  public dispose(): void {
    // Dispose all audio graph nodes
    this.audioGraph.forEach((node) => {
      if (node.dispose) {
        node.dispose();
      }
    });

    this.audioGraph.clear();

    // Dispose master nodes
    this.masterLimiter.dispose();
    this.masterGain.dispose();

    // Clear instance
    AudioEngine.instance = null;
  }
}

/**
 * AudioSource - Individual audio source for deck playback
 */
export class AudioSource {
  public readonly player: Tone.Player;
  public readonly gainNode: Tone.Gain;
  public readonly pitchShift: Tone.PitchShift;
  public readonly outputNode: Tone.Gain;

  private currentBuffer: Tone.ToneAudioBuffer | null = null;

  constructor(
    public readonly deckId: string,
    private readonly engine: AudioEngine
  ) {
    // Create audio chain: Player → Gain → PitchShift → Output
    this.player = new Tone.Player();
    this.gainNode = new Tone.Gain(1);
    this.pitchShift = new Tone.PitchShift(0); // ±8% range will be set via playback rate
    this.outputNode = new Tone.Gain(1);

    // Connect audio chain
    this.player.connect(this.gainNode);
    this.gainNode.connect(this.pitchShift);
    this.pitchShift.connect(this.outputNode);

    // Configure player for DJ use
    this.player.autostart = false;
    this.player.loop = false; // Will be controlled externally
  }

  /**
   * Load audio file into player
   */
  public async loadFile(url: string): Promise<void> {
    try {
      this.currentBuffer = await this.engine.loadAudioFile(url);
      this.player.buffer = this.currentBuffer;
    } catch (error) {
      console.error(`Failed to load file for deck ${this.deckId}:`, error);
      throw error;
    }
  }

  /**
   * Set playback rate for pitch control (0.92x - 1.08x for ±8%)
   */
  public setPlaybackRate(rate: number): void {
    // Clamp to ±8% range
    const clampedRate = Math.max(0.92, Math.min(1.08, rate));
    this.player.playbackRate = clampedRate;
  }

  /**
   * Set volume (0-1)
   */
  public setVolume(volume: number): void {
    this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Start playback
   */
  public start(time?: number): void {
    if (this.player.loaded) {
      this.player.start(time);
    }
  }

  /**
   * Stop playback
   */
  public stop(time?: number): void {
    this.player.stop(time);
  }

  /**
   * Pause playback (can be resumed)
   */
  public pause(): void {
    if (this.player.state === 'started') {
      this.player.stop();
    }
  }

  /**
   * Seek to position (0-1)
   */
  public seek(position: number): void {
    if (this.currentBuffer) {
      const duration = this.currentBuffer.duration;
      const time = position * duration;
      this.player.seek(time);
    }
  }

  /**
   * Get current playback position (0-1)
   */
  public getPosition(): number {
    if (!this.currentBuffer || this.currentBuffer.duration === 0) {
      return 0;
    }

    // Calculate position based on current time and playback rate
    const elapsed = this.engine.context.currentTime - (this.player as any)._startTime;
    const adjustedElapsed = elapsed * this.player.playbackRate;
    return Math.min(1, adjustedElapsed / this.currentBuffer.duration);
  }

  /**
   * Check if audio is currently playing
   */
  public get isPlaying(): boolean {
    return this.player.state === 'started';
  }

  /**
   * Get audio duration in seconds
   */
  public get duration(): number {
    return this.currentBuffer?.duration || 0;
  }

  /**
   * Dispose of audio source
   */
  public dispose(): void {
    this.player.dispose();
    this.gainNode.dispose();
    this.pitchShift.dispose();
    this.outputNode.dispose();
    this.currentBuffer = null;
  }
}

// Export singleton instance getter
export const getAudioEngine = () => AudioEngine.getInstance();