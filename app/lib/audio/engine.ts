import * as Tone from 'tone';

/**
 * AudioEngine - Core audio processing engine for OX-Board DJ application
 */
export class AudioEngine {
  private static instance: AudioEngine | null = null;

  public readonly context: Tone.Context;
  public readonly masterGain: Tone.Gain;
  public readonly masterLimiter: Tone.Limiter;

  private readonly audioGraph: Map<string, Tone.ToneAudioNode> = new Map();
  private readonly config = {
    sampleRate: 48000,
    bufferSize: 128,
    maxLatency: 20,
    maxMemoryUsage: 500 * 1024 * 1024,
  };

  private performanceMetrics = {
    cpuUsage: 0,
    memoryUsage: 0,
    latency: 0,
    dropouts: 0,
  };

  private constructor() {
    this.context = new Tone.Context({
      sampleRate: this.config.sampleRate,
      latencyHint: 'interactive',
      lookAhead: 0.05,
    });

    this.masterGain = new Tone.Gain(1).toDestination();
    this.masterLimiter = new Tone.Limiter(-1);
    this.masterLimiter.connect(this.masterGain);

    this.audioGraph.set('masterGain', this.masterGain);
    this.audioGraph.set('masterLimiter', this.masterLimiter);

    this.initializePerformanceMonitoring();
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async initialize(): Promise<void> {
    try {
      if (this.context.state !== 'running') {
        await this.context.resume();
      }

      const latency = this.measureLatency();
      if (latency > this.config.maxLatency) {
        console.warn(`Audio latency ${latency}ms exceeds target ${this.config.maxLatency}ms`);
      }

      console.log('AudioEngine initialized successfully', {
        sampleRate: this.context.sampleRate,
        latency: `${latency}ms`,
        state: this.context.state
      });

    } catch (error) {
      console.error('Failed to initialize AudioEngine:', error);
      throw new Error(`AudioEngine initialization failed: ${error}`);
    }
  }

  public createDeckSource(deckId: string): AudioSource {
    const source = new AudioSource(deckId, this);
    this.audioGraph.set(`deck_${deckId}`, source.outputNode);
    return source;
  }

  public getNode(key: string): Tone.ToneAudioNode | undefined {
    return this.audioGraph.get(key);
  }

  public getMasterOutput(): Tone.Limiter {
    return this.masterLimiter;
  }

  public async loadAudioFile(url: string): Promise<Tone.ToneAudioBuffer> {
    try {
      const buffer = new Tone.ToneAudioBuffer();
      await buffer.load(url);
      this.updateMemoryUsage();
      return buffer;
    } catch (error) {
      console.error('Failed to load audio file:', error);
      throw new Error(`Audio file loading failed: ${error}`);
    }
  }

  private measureLatency(): number {
    const contextLatency = (this.context.baseLatency || 0) * 1000;
    const bufferLatency = (this.config.bufferSize / this.context.sampleRate) * 1000;
    return contextLatency + bufferLatency;
  }

  private initializePerformanceMonitoring(): void {
    setInterval(() => {
      this.performanceMetrics.latency = this.measureLatency();
      this.updateMemoryUsage();

      if (this.performanceMetrics.latency > this.config.maxLatency) {
        console.warn('Audio latency exceeded threshold:', this.performanceMetrics.latency);
      }

      if (this.performanceMetrics.memoryUsage > this.config.maxMemoryUsage) {
        console.warn('Memory usage exceeded threshold:', this.performanceMetrics.memoryUsage / (1024 * 1024), 'MB');
      }
    }, 1000);
  }

  private updateMemoryUsage(): void {
    if (performance.memory) {
      this.performanceMetrics.memoryUsage = performance.memory.usedJSHeapSize;
    }
  }

  public getPerformanceMetrics(): typeof this.performanceMetrics {
    return { ...this.performanceMetrics };
  }

  public dispose(): void {
    this.audioGraph.forEach((node) => {
      if (node.dispose) {
        node.dispose();
      }
    });

    this.audioGraph.clear();
    this.masterLimiter.dispose();
    this.masterGain.dispose();
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
    this.player = new Tone.Player();
    this.gainNode = new Tone.Gain(1);
    this.pitchShift = new Tone.PitchShift(0);
    this.outputNode = new Tone.Gain(1);

    this.player.connect(this.gainNode);
    this.gainNode.connect(this.pitchShift);
    this.pitchShift.connect(this.outputNode);

    this.player.autostart = false;
    this.player.loop = false;
  }

  public async loadFile(url: string): Promise<void> {
    try {
      this.currentBuffer = await this.engine.loadAudioFile(url);
      this.player.buffer = this.currentBuffer;
    } catch (error) {
      console.error(`Failed to load file for deck ${this.deckId}:`, error);
      throw error;
    }
  }

  public setPlaybackRate(rate: number): void {
    const clampedRate = Math.max(0.92, Math.min(1.08, rate));
    this.player.playbackRate = clampedRate;
  }

  public setVolume(volume: number): void {
    this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
  }

  public start(time?: number): void {
    if (this.player.loaded) {
      this.player.start(time);
    }
  }

  public stop(time?: number): void {
    this.player.stop(time);
  }

  public pause(): void {
    if (this.player.state === 'started') {
      this.player.stop();
    }
  }

  public seek(position: number): void {
    if (this.currentBuffer) {
      const duration = this.currentBuffer.duration;
      const time = position * duration;
      this.player.seek(time);
    }
  }

  public getPosition(): number {
    if (!this.currentBuffer || this.currentBuffer.duration === 0) {
      return 0;
    }

    const elapsed = this.engine.context.currentTime - (this.player as any)._startTime;
    const adjustedElapsed = elapsed * this.player.playbackRate;
    return Math.min(1, adjustedElapsed / this.currentBuffer.duration);
  }

  public get isPlaying(): boolean {
    return this.player.state === 'started';
  }

  public get duration(): number {
    return this.currentBuffer?.duration || 0;
  }

  public dispose(): void {
    this.player.dispose();
    this.gainNode.dispose();
    this.pitchShift.dispose();
    this.outputNode.dispose();
    this.currentBuffer = null;
  }
}

export const getAudioEngine = () => AudioEngine.getInstance();