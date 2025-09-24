import * as Tone from "tone";
import {
  DemucsOutput,
  StemType,
  StemLoadResult,
  StemData,
} from "./demucsProcessor";

export interface StemPlayerConfig {
  /** Enable time stretching without pitch change */
  timeStretchEnabled: boolean;
  /** Crossfade curve type */
  crossfadeCurve: "linear" | "exponential" | "logarithmic";
  /** Buffer size for low latency */
  bufferSize: number;
  /** Maximum control latency in milliseconds */
  maxLatency: number;
}

export interface StemControls {
  /** Volume level (0-1) */
  volume: number;
  /** Mute state */
  muted: boolean;
  /** Solo state */
  soloed: boolean;
  /** Pan position (-1 to 1) */
  pan: number;
  /** EQ settings */
  eq: {
    low: number;
    mid: number;
    high: number;
  };
  /** Playback rate for time stretching */
  playbackRate: number;
}

export interface StemPlayerState {
  /** Current playback position in seconds */
  currentTime: number;
  /** Total duration in seconds */
  duration: number;
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Whether stems are loaded */
  stemsLoaded: boolean;
  /** Individual stem controls */
  stems: {
    drums: StemControls;
    bass: StemControls;
    melody: StemControls;
    vocals: StemControls;
  };
  /** Original track controls */
  original: StemControls;
  /** Crossfade between original and stems (0 = original, 1 = stems) */
  stemMix: number;
  /** Sync status between stems */
  syncStatus: "synced" | "drifting" | "error";
}

const defaultStemControls: StemControls = {
  volume: 0.75,
  muted: false,
  soloed: false,
  pan: 0,
  eq: { low: 0, mid: 0, high: 0 },
  playbackRate: 1.0,
};

export class StemPlayer {
  private config!: StemPlayerConfig;
  private state!: StemPlayerState;
  private isInitialized: boolean = false;

  // Tone.js audio nodes
  private players!: {
    drums: Tone.Player | null;
    bass: Tone.Player | null;
    melody: Tone.Player | null;
    vocals: Tone.Player | null;
    original: Tone.Player | null;
  };

  private gains!: {
    drums: Tone.Gain;
    bass: Tone.Gain;
    melody: Tone.Gain;
    vocals: Tone.Gain;
    original: Tone.Gain;
  };

  private panners!: {
    drums: Tone.Panner;
    bass: Tone.Panner;
    melody: Tone.Panner;
    vocals: Tone.Panner;
    original: Tone.Panner;
  };

  private eqs!: {
    drums: Tone.EQ3;
    bass: Tone.EQ3;
    melody: Tone.EQ3;
    vocals: Tone.EQ3;
    original: Tone.EQ3;
  };

  private stemMixer!: Tone.Gain;
  private originalMixer!: Tone.Gain;
  private crossfader!: Tone.CrossFade;
  private masterOut!: Tone.Gain;

  // Sync management
  private syncTimer: number | null = null;
  private lastSyncCheck: number = 0;
  private syncTolerance: number = 0.005; // 5ms tolerance

  // Event listeners
  private eventListeners: Map<string, Function[]> = new Map();

  constructor(config: Partial<StemPlayerConfig> = {}) {
    this.config = {
      timeStretchEnabled: true,
      crossfadeCurve: "logarithmic",
      bufferSize: 512,
      maxLatency: 20,
      ...config,
    };

    this.state = {
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      stemsLoaded: false,
      stems: {
        drums: { ...defaultStemControls },
        bass: { ...defaultStemControls },
        melody: { ...defaultStemControls },
        vocals: { ...defaultStemControls },
      },
      original: { ...defaultStemControls },
      stemMix: 0.5,
      syncStatus: "synced",
    };

    this.players = {
      drums: null,
      bass: null,
      melody: null,
      vocals: null,
      original: null,
    };

    this.initializeAudioNodes();
  }

  private initializeAudioNodes(): void {
    // Create gain nodes for each stem
    this.gains = {
      drums: new Tone.Gain(defaultStemControls.volume),
      bass: new Tone.Gain(defaultStemControls.volume),
      melody: new Tone.Gain(defaultStemControls.volume),
      vocals: new Tone.Gain(defaultStemControls.volume),
      original: new Tone.Gain(defaultStemControls.volume),
    };

    // Create panner nodes
    this.panners = {
      drums: new Tone.Panner(0),
      bass: new Tone.Panner(0),
      melody: new Tone.Panner(0),
      vocals: new Tone.Panner(0),
      original: new Tone.Panner(0),
    };

    // Create EQ nodes
    this.eqs = {
      drums: new Tone.EQ3({ low: 0, mid: 0, high: 0 }),
      bass: new Tone.EQ3({ low: 0, mid: 0, high: 0 }),
      melody: new Tone.EQ3({ low: 0, mid: 0, high: 0 }),
      vocals: new Tone.EQ3({ low: 0, mid: 0, high: 0 }),
      original: new Tone.EQ3({ low: 0, mid: 0, high: 0 }),
    };

    // Create mixers and crossfader
    this.stemMixer = new Tone.Gain(1);
    this.originalMixer = new Tone.Gain(1);
    this.crossfader = new Tone.CrossFade(this.state.stemMix);
    this.masterOut = new Tone.Gain(1);

    this.connectAudioGraph();
  }

  private connectAudioGraph(): void {
    // Connect each stem: Player -> Gain -> Panner -> EQ -> Stem Mixer
    const stemTypes: StemType[] = ["drums", "bass", "melody", "vocals"];

    stemTypes.forEach((stemType) => {
      this.gains[stemType].connect(this.panners[stemType]);
      this.panners[stemType].connect(this.eqs[stemType]);
      this.eqs[stemType].connect(this.stemMixer);
    });

    // Connect original: Player -> Gain -> Panner -> EQ -> Original Mixer
    this.gains.original.connect(this.panners.original);
    this.panners.original.connect(this.eqs.original);
    this.eqs.original.connect(this.originalMixer);

    // Connect crossfader: Original Mixer -> A, Stem Mixer -> B -> Master Out
    this.originalMixer.connect(this.crossfader.a);
    this.stemMixer.connect(this.crossfader.b);
    this.crossfader.connect(this.masterOut);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Check if Tone context is already running (initialized by parent)
    const context = Tone.getContext();
    if (context.rawContext.state === "suspended") {
      await context.resume();
    }

    // Only start Tone if context is not already running
    if (context.rawContext.state !== "running") {
      await Tone.start();
    }

    this.isInitialized = true;
    this.startSyncMonitoring();
  }

  async loadStems(demucsOutput: DemucsOutput): Promise<StemLoadResult[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const results: StemLoadResult[] = [];
    const stemTypes: (StemType | "original")[] = [
      "drums",
      "bass",
      "melody",
      "vocals",
      "original",
    ];

    try {
      // Dispose existing players
      this.disposePlayers();

      // Load each stem
      for (const stemType of stemTypes) {
        try {
          const stemData = demucsOutput[stemType as keyof DemucsOutput];
          if (
            !stemData ||
            typeof stemData !== "object" ||
            !("audioBuffer" in stemData) ||
            !stemData.hasAudio
          ) {
            results.push({
              success: false,
              error: `No audio data for ${stemType}`,
              stemType: stemType as StemType,
            });
            continue;
          }

          // Create player from AudioBuffer
          const player = new Tone.Player({
            url: (stemData as StemData).audioBuffer,
            loop: false,
            autostart: false,
            volume: 0, // Will be controlled by gain nodes
          });

          // Wait for player to load
          player.onstop = () => this.handlePlayerStop();

          if (!player.loaded) {
            await Tone.ToneAudioBuffer.loaded();
          }

          // Connect to audio graph
          player.connect(this.gains[stemType]);
          this.players[stemType] = player;

          // Update duration from first loaded stem
          if (this.state.duration === 0) {
            this.state.duration = stemData.duration;
          }

          results.push({
            success: true,
            stemType: stemType as StemType,
            duration: stemData.duration,
          });
        } catch (error) {
          results.push({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
            stemType: stemType as StemType,
          });
        }
      }

      // Check if at least some stems loaded successfully
      const successfulLoads = results.filter((r) => r.success);
      this.state.stemsLoaded = successfulLoads.length > 0;

      if (this.state.stemsLoaded) {
        this.emit("stemsLoaded", { results });
      }

      return results;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error loading stems";
      this.emit("error", { error: errorMessage, context: "loadStems" });

      return stemTypes.map((stemType) => ({
        success: false,
        error: errorMessage,
        stemType: stemType as StemType,
      }));
    }
  }

  private disposePlayers(): void {
    Object.values(this.players).forEach((player) => {
      if (player) {
        player.dispose();
      }
    });

    this.players = {
      drums: null,
      bass: null,
      melody: null,
      vocals: null,
      original: null,
    };
  }

  async play(): Promise<void> {
    if (!this.state.stemsLoaded) {
      const error = new Error("No stems loaded");
      this.emit("error", {
        error: error.message,
        context: "play",
      });
      throw error;
    }

    try {
      const now = Tone.now();
      const players = Object.values(this.players).filter((p) => p !== null);

      // Start all players simultaneously
      players.forEach((player) => {
        if (player && player.state !== "started") {
          player.start(now, this.state.currentTime);
        }
      });

      this.state.isPlaying = true;
      this.emit("playStateChanged", { isPlaying: true });
    } catch (error) {
      this.emit("error", {
        error:
          error instanceof Error ? error.message : "Unknown playback error",
        context: "play",
      });
      throw error;
    }
  }

  pause(): void {
    try {
      const players = Object.values(this.players).filter((p) => p !== null);

      players.forEach((player) => {
        if (player && player.state === "started") {
          player.stop();
        }
      });

      this.state.isPlaying = false;
      this.emit("playStateChanged", { isPlaying: false });
    } catch (error) {
      this.emit("error", {
        error: error instanceof Error ? error.message : "Unknown pause error",
        context: "pause",
      });
    }
  }

  stop(): void {
    try {
      this.pause();
      this.seek(0);
      this.emit("stopped");
    } catch (error) {
      this.emit("error", {
        error: error instanceof Error ? error.message : "Unknown stop error",
        context: "stop",
      });
    }
  }

  seek(time: number): void {
    try {
      const clampedTime = Math.max(0, Math.min(time, this.state.duration));
      this.state.currentTime = clampedTime;

      if (this.state.isPlaying) {
        // Restart players at new position
        this.pause();
        setTimeout(() => this.play(), 10);
      }

      this.emit("timeUpdate", { currentTime: clampedTime });
    } catch (error) {
      this.emit("error", {
        error: error instanceof Error ? error.message : "Unknown seek error",
        context: "seek",
      });
    }
  }

  // Individual stem controls
  setStemVolume(stemType: StemType | "original", volume: number): void {
    try {
      const clampedVolume = Math.max(0, Math.min(1, volume));

      if (stemType === "original") {
        this.state.original.volume = clampedVolume;
      } else {
        this.state.stems[stemType].volume = clampedVolume;
      }

      // Apply with anti-click ramping
      this.gains[stemType].gain.rampTo(clampedVolume, 0.01);

      this.emit("stemControlChanged", {
        stemType,
        control: "volume",
        value: clampedVolume,
      });
    } catch (error) {
      this.emit("error", {
        error: error instanceof Error ? error.message : "Unknown volume error",
        context: "setStemVolume",
      });
    }
  }

  setStemMute(stemType: StemType | "original", muted: boolean): void {
    try {
      if (stemType === "original") {
        this.state.original.muted = muted;
      } else {
        this.state.stems[stemType].muted = muted;
      }

      const targetVolume = muted
        ? 0
        : stemType === "original"
          ? this.state.original.volume
          : this.state.stems[stemType].volume;
      this.gains[stemType].gain.rampTo(targetVolume, 0.01);

      this.emit("stemControlChanged", {
        stemType,
        control: "mute",
        value: muted,
      });
    } catch (error) {
      this.emit("error", {
        error: error instanceof Error ? error.message : "Unknown mute error",
        context: "setStemMute",
      });
    }
  }

  setStemSolo(stemType: StemType | "original", soloed: boolean): void {
    try {
      if (stemType === "original") {
        this.state.original.soloed = soloed;
      } else {
        this.state.stems[stemType].soloed = soloed;
      }

      // Handle solo logic - mute all others if any stem is soloed
      const allStems: (StemType | "original")[] = [
        "drums",
        "bass",
        "melody",
        "vocals",
        "original",
      ];
      const soloedStems = allStems.filter((stem) =>
        stem === "original"
          ? this.state.original.soloed
          : this.state.stems[stem as StemType].soloed,
      );

      allStems.forEach((stem) => {
        const isSoloed = soloedStems.length === 0 || soloedStems.includes(stem);
        const controls =
          stem === "original"
            ? this.state.original
            : this.state.stems[stem as StemType];
        const targetVolume = isSoloed && !controls.muted ? controls.volume : 0;

        this.gains[stem].gain.rampTo(targetVolume, 0.01);
      });

      this.emit("stemControlChanged", {
        stemType,
        control: "solo",
        value: soloed,
      });
    } catch (error) {
      this.emit("error", {
        error: error instanceof Error ? error.message : "Unknown solo error",
        context: "setStemSolo",
      });
    }
  }

  setStemPan(stemType: StemType | "original", pan: number): void {
    try {
      const clampedPan = Math.max(-1, Math.min(1, pan));

      if (stemType === "original") {
        this.state.original.pan = clampedPan;
      } else {
        this.state.stems[stemType].pan = clampedPan;
      }

      this.panners[stemType].pan.rampTo(clampedPan, 0.01);

      this.emit("stemControlChanged", {
        stemType,
        control: "pan",
        value: clampedPan,
      });
    } catch (error) {
      this.emit("error", {
        error: error instanceof Error ? error.message : "Unknown pan error",
        context: "setStemPan",
      });
    }
  }

  setStemEQ(
    stemType: StemType | "original",
    band: "low" | "mid" | "high",
    value: number,
  ): void {
    try {
      const clampedValue = Math.max(-20, Math.min(20, value));

      if (stemType === "original") {
        this.state.original.eq[band] = clampedValue;
      } else {
        this.state.stems[stemType].eq[band] = clampedValue;
      }

      this.eqs[stemType][band].value = clampedValue;

      this.emit("stemControlChanged", {
        stemType,
        control: "eq",
        band,
        value: clampedValue,
      });
    } catch (error) {
      this.emit("error", {
        error: error instanceof Error ? error.message : "Unknown EQ error",
        context: "setStemEQ",
      });
    }
  }

  setStemPlaybackRate(stemType: StemType | "original", rate: number): void {
    try {
      if (!this.config.timeStretchEnabled) {
        throw new Error("Time stretching is disabled");
      }

      const clampedRate = Math.max(0.25, Math.min(4, rate));

      if (stemType === "original") {
        this.state.original.playbackRate = clampedRate;
      } else {
        this.state.stems[stemType].playbackRate = clampedRate;
      }

      const player = this.players[stemType];
      if (player) {
        player.playbackRate = clampedRate;
      }

      this.emit("stemControlChanged", {
        stemType,
        control: "playbackRate",
        value: clampedRate,
      });
    } catch (error) {
      this.emit("error", {
        error:
          error instanceof Error
            ? error.message
            : "Unknown playback rate error",
        context: "setStemPlaybackRate",
      });
    }
  }

  // Crossfading between original and stems
  setStemMix(mix: number): void {
    try {
      const clampedMix = Math.max(0, Math.min(1, mix));
      this.state.stemMix = clampedMix;

      // Apply crossfade curve
      let fadeValue = clampedMix;

      switch (this.config.crossfadeCurve) {
        case "exponential":
          fadeValue = Math.pow(clampedMix, 2);
          break;
        case "logarithmic":
          fadeValue = Math.sqrt(clampedMix);
          break;
        // linear is default
      }

      this.crossfader.fade.rampTo(fadeValue, 0.01);

      this.emit("stemMixChanged", { stemMix: clampedMix });
    } catch (error) {
      this.emit("error", {
        error:
          error instanceof Error ? error.message : "Unknown stem mix error",
        context: "setStemMix",
      });
    }
  }

  // Sync monitoring
  private startSyncMonitoring(): void {
    if (this.syncTimer) return;

    this.syncTimer = window.setInterval(() => {
      this.checkSync();
    }, 100); // Check every 100ms
  }

  private stopSyncMonitoring(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  private checkSync(): void {
    if (!this.state.isPlaying || !this.state.stemsLoaded) return;

    try {
      const players = Object.values(this.players).filter((p) => p !== null);
      const times = players.map((p) => p?.immediate() || 0);

      if (times.length < 2) return;

      const maxDiff = Math.max(...times) - Math.min(...times);

      if (maxDiff > this.syncTolerance) {
        this.state.syncStatus = "drifting";

        // Auto-correct if drift is significant
        if (maxDiff > 0.1) {
          this.resync();
        }
      } else {
        this.state.syncStatus = "synced";
      }

      // Update current time
      this.state.currentTime = Math.max(...times);
      this.emit("timeUpdate", { currentTime: this.state.currentTime });
    } catch (error) {
      this.state.syncStatus = "error";
      this.emit("error", {
        error: error instanceof Error ? error.message : "Sync check error",
        context: "checkSync",
      });
    }
  }

  private resync(): void {
    if (!this.state.isPlaying) return;

    try {
      const now = Tone.now();
      const players = Object.values(this.players).filter((p) => p !== null);

      // Stop all players
      players.forEach((player) => {
        if (player) {
          player.stop();
        }
      });

      // Restart at current time
      setTimeout(() => {
        players.forEach((player) => {
          if (player) {
            player.start(now, this.state.currentTime);
          }
        });
      }, 10);

      this.emit("resynced");
    } catch (error) {
      this.emit("error", {
        error: error instanceof Error ? error.message : "Resync error",
        context: "resync",
      });
    }
  }

  private handlePlayerStop(): void {
    // Check if all players have stopped
    const activePlayers = Object.values(this.players).filter(
      (p) => p && p.state === "started",
    );

    if (activePlayers.length === 0 && this.state.isPlaying) {
      this.state.isPlaying = false;
      this.emit("playStateChanged", { isPlaying: false });
      this.emit("ended");
    }
  }

  // Output connection
  connect(destination: Tone.ToneAudioNode): void {
    this.masterOut.connect(destination);
  }

  disconnect(destination?: Tone.ToneAudioNode): void {
    if (destination) {
      this.masterOut.disconnect(destination);
    } else {
      this.masterOut.disconnect();
    }
  }

  // State getters
  getState(): StemPlayerState {
    return { ...this.state };
  }

  getStemControls(stemType: StemType | "original"): StemControls {
    return stemType === "original"
      ? { ...this.state.original }
      : { ...this.state.stems[stemType] };
  }

  getCurrentTime(): number {
    return this.state.currentTime;
  }

  getDuration(): number {
    return this.state.duration;
  }

  isPlaying(): boolean {
    return this.state.isPlaying;
  }

  areStemsLoaded(): boolean {
    return this.state.stemsLoaded;
  }

  getSyncStatus(): "synced" | "drifting" | "error" {
    return this.state.syncStatus;
  }

  // Event handling
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Cleanup
  dispose(): void {
    this.stopSyncMonitoring();
    this.disposePlayers();

    // Dispose audio nodes
    Object.values(this.gains).forEach((node) => node.dispose());
    Object.values(this.panners).forEach((node) => node.dispose());
    Object.values(this.eqs).forEach((node) => node.dispose());

    this.stemMixer.dispose();
    this.originalMixer.dispose();
    this.crossfader.dispose();
    this.masterOut.dispose();

    // Clear event listeners
    this.eventListeners.clear();

    this.isInitialized = false;
  }
}
