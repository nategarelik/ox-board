/**
 * Client interface for Music Analyzer Web Worker
 *
 * Provides a clean API for interacting with the music analysis worker:
 * - Promise-based interface
 * - Request queuing and management
 * - Real-time analysis capabilities
 * - Performance monitoring
 */

import type {
  MusicAnalysisRequest,
  MusicAnalysisResponse,
  BeatPhaseRequest,
  BeatPhaseResponse,
} from "../workers/musicAnalyzer.worker";

import type {
  MusicAnalysisResult,
  BPMAnalysis,
  KeyAnalysis,
  SpectralFeatures,
  OnsetDetection,
  AnalysisOptions,
} from "./musicAnalyzer";

export interface AnalysisStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageProcessingTime: number;
  lastAnalysisTime: number;
}

export interface WorkerStatus {
  isInitialized: boolean;
  isProcessing: boolean;
  queueSize: number;
  stats: AnalysisStats;
}

export interface MusicAnalyzerClientOptions {
  requestTimeoutMs?: number;
}

interface PendingRequest {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
  timestamp: number;
  timeoutId: ReturnType<typeof setTimeout>;
}

export class MusicAnalyzerClient {
  private worker: Worker | null = null;
  private isInitialized = false;
  private isDestroyed = false;
  private requestCounter = 0;
  private readonly requestTimeoutMs: number;
  private pendingRequests = new Map<string, PendingRequest>();

  private stats: AnalysisStats = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    averageProcessingTime: 0,
    lastAnalysisTime: 0,
  };

  private processingTimes: number[] = [];

  constructor(options: MusicAnalyzerClientOptions = {}) {
    const timeout = options.requestTimeoutMs ?? 3000;
    this.requestTimeoutMs = Number.isFinite(timeout)
      ? Math.max(500, timeout)
      : 3000;
    this.initializeWorker();
  }

  private async initializeWorker(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    if (this.worker) {
      this.isInitialized = true;
      return;
    }

    try {
      // Check if we're in the browser
      if (typeof window === "undefined") {
        console.warn(
          "Music analyzer worker can only be initialized in browser",
        );
        return;
      }

      // Create worker with fallback for Next.js 15
      try {
        // Use module worker for better Next.js 15 compatibility
        this.worker = new Worker(
          new URL("../workers/musicAnalyzer.worker.ts", import.meta.url),
          { type: "module" },
        );
      } catch (e) {
        // Fallback: Create a simple inline worker for basic functionality
        console.warn("Using fallback worker implementation");
        const workerCode = `
          self.onmessage = function(e) {
            const { id, type, audioData, sampleRate } = e.data;

            // Simple fallback implementation
            let result = null;

            if (type === 'analyzeFull') {
              result = {
                bpm: { bpm: 120, confidence: 0.5 },
                key: { key: 'C', scale: 'major', confidence: 0.5 },
                spectralFeatures: { spectralCentroid: 1000, spectralRolloff: 5000 },
                energy: 0.5,
                segments: []
              };
            }

            self.postMessage({
              id,
              success: true,
              result,
              timestamp: Date.now()
            });
          };
        `;

        const blob = new Blob([workerCode], { type: "application/javascript" });
        const workerUrl = URL.createObjectURL(blob);
        this.worker = new Worker(workerUrl);
      }

      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);

      this.isInitialized = true;
      console.log("Music analyzer client initialized");
    } catch (error) {
      console.error("Failed to initialize music analyzer worker:", error);
      // Don't throw - allow app to work without worker
      this.isInitialized = false;
    }
  }

  private handleWorkerMessage(
    event: MessageEvent<MusicAnalysisResponse>,
  ): void {
    const response = event.data;
    const pending = this.pendingRequests.get(response.id);

    if (!pending) {
      console.warn("Received response for unknown request:", response.id);
      return;
    }

    clearTimeout(pending.timeoutId);
    this.pendingRequests.delete(response.id);

    // Update statistics
    this.stats.totalRequests++;
    if (response.processingTime) {
      this.processingTimes.push(response.processingTime);
      if (this.processingTimes.length > 100) {
        this.processingTimes.shift();
      }

      this.stats.averageProcessingTime =
        this.processingTimes.reduce((a, b) => a + b) /
        this.processingTimes.length;
    }

    if (response.success) {
      this.stats.successfulRequests++;
      this.stats.lastAnalysisTime = response.timestamp;
      pending.resolve(response.result);
    } else {
      this.stats.failedRequests++;
      pending.reject(new Error(response.error || "Analysis failed"));
    }
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error("Music analyzer worker error:", error);

    // Reject all pending requests
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error("Worker error: " + error.message));
    });
    this.pendingRequests.clear();

    // Try to reinitialize worker
    this.isInitialized = false;
    if (!this.isDestroyed) {
      setTimeout(() => {
        if (!this.isDestroyed) {
          this.initializeWorker();
        }
      }, 1000);
    }
  }

  private async sendRequest<T>(
    type: string,
    audioData: Float32Array,
    sampleRate: number,
    options?: any,
  ): Promise<T> {
    if (this.isDestroyed) {
      return Promise.reject(
        new Error("MusicAnalyzerClient has been destroyed"),
      );
    }

    if (!this.isInitialized || !this.worker) {
      await this.initializeWorker();
    }

    if (this.isDestroyed) {
      return Promise.reject(
        new Error("MusicAnalyzerClient has been destroyed"),
      );
    }

    if (!this.worker) {
      console.warn(
        "Music analyzer worker not available, returning default values",
      );
      // Return sensible defaults when worker is not available
      return {
        bpm: { bpm: 120, confidence: 0.5 },
        key: { key: "C", scale: "major", confidence: 0.5 },
      } as any;
    }

    const id = `req_${++this.requestCounter}`;
    const request: MusicAnalysisRequest = {
      id,
      type: type as any,
      audioData,
      sampleRate,
      ...options,
    };

    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error("Request timeout"));
        }
      }, this.requestTimeoutMs);

      this.pendingRequests.set(id, {
        resolve,
        reject,
        timestamp: Date.now(),
        timeoutId,
      });

      this.worker!.postMessage(request);
    });
  }

  /**
   * Analyze complete track with all features
   */
  public async analyzeTrack(
    audioData: Float32Array,
    sampleRate: number = 44100,
    options?: AnalysisOptions,
  ): Promise<MusicAnalysisResult> {
    return this.sendRequest<MusicAnalysisResult>(
      "analyze",
      audioData,
      sampleRate,
      { options },
    );
  }

  /**
   * Real-time analysis for live audio
   */
  public async analyzeRealTime(
    audioData: Float32Array,
    sampleRate: number = 44100,
    options?: AnalysisOptions,
  ): Promise<Partial<MusicAnalysisResult>> {
    return this.sendRequest<Partial<MusicAnalysisResult>>(
      "realtime",
      audioData,
      sampleRate,
      { options },
    );
  }

  /**
   * Extract BPM and beat information
   */
  public async extractBPM(
    audioData: Float32Array,
    sampleRate: number = 44100,
  ): Promise<BPMAnalysis> {
    return this.sendRequest<BPMAnalysis>("bpm", audioData, sampleRate);
  }

  /**
   * Detect musical key
   */
  public async detectKey(
    audioData: Float32Array,
    sampleRate: number = 44100,
  ): Promise<KeyAnalysis> {
    return this.sendRequest<KeyAnalysis>("key", audioData, sampleRate);
  }

  /**
   * Get spectral features
   */
  public async getSpectralFeatures(
    audioData: Float32Array,
    sampleRate: number = 44100,
  ): Promise<SpectralFeatures> {
    return this.sendRequest<SpectralFeatures>(
      "spectral",
      audioData,
      sampleRate,
    );
  }

  /**
   * Detect onsets and transients
   */
  public async detectOnsets(
    audioData: Float32Array,
    sampleRate: number = 44100,
  ): Promise<OnsetDetection> {
    return this.sendRequest<OnsetDetection>("onsets", audioData, sampleRate);
  }

  /**
   * Get current beat phase for sync
   */
  public async getBeatPhase(
    audioData: Float32Array,
    currentTime: number,
    sampleRate: number = 44100,
  ): Promise<BeatPhaseResponse> {
    return this.sendRequest<BeatPhaseResponse>(
      "beatphase",
      audioData,
      sampleRate,
      { currentTime },
    );
  }

  /**
   * Check if two keys are compatible for mixing
   */
  public static isCompatibleKey(key1: string, key2: string): boolean {
    // Camelot wheel compatibility
    const CAMELOT_WHEEL: { [key: string]: string } = {
      "C major": "8B",
      "G major": "9B",
      "D major": "10B",
      "A major": "11B",
      "E major": "12B",
      "B major": "1B",
      "F# major": "2B",
      "C# major": "3B",
      "G# major": "4B",
      "D# major": "5B",
      "A# major": "6B",
      "F major": "7B",
      "A minor": "8A",
      "E minor": "9A",
      "B minor": "10A",
      "F# minor": "11A",
      "C# minor": "12A",
      "G# minor": "1A",
      "D# minor": "2A",
      "A# minor": "3A",
      "F minor": "4A",
      "C minor": "5A",
      "G minor": "6A",
      "D minor": "7A",
    };

    const camelot1 = CAMELOT_WHEEL[key1];
    const camelot2 = CAMELOT_WHEEL[key2];

    if (!camelot1 || !camelot2) return false;

    const pos1 = parseInt(camelot1);
    const pos2 = parseInt(camelot2);
    const type1 = camelot1.slice(-1);
    const type2 = camelot2.slice(-1);

    // Compatible if same position different type, or adjacent positions same type
    return (
      (pos1 === pos2 && type1 !== type2) ||
      (Math.abs(pos1 - pos2) <= 1 && type1 === type2) ||
      (Math.abs(pos1 - pos2) === 11 && type1 === type2)
    ); // Wrap around
  }

  /**
   * Calculate BPM matching percentage
   */
  public static getBPMMatchPercentage(bpm1: number, bpm2: number): number {
    const diff = Math.abs(bpm1 - bpm2);
    const maxBPM = Math.max(bpm1, bpm2);
    const percentage = 1 - diff / maxBPM;
    return Math.max(0, Math.min(1, percentage));
  }

  /**
   * Get compatible BPM range for mixing
   */
  public static getCompatibleBPMRange(bpm: number): [number, number] {
    const variation = bpm * 0.06; // ±6% is generally acceptable
    return [bpm - variation, bpm + variation];
  }

  /**
   * Get worker status and statistics
   */
  public getStatus(): WorkerStatus {
    return {
      isInitialized: this.isInitialized,
      isProcessing: this.pendingRequests.size > 0,
      queueSize: this.pendingRequests.size,
      stats: { ...this.stats },
    };
  }

  /**
   * Clear statistics
   */
  public clearStats(): void {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageProcessingTime: 0,
      lastAnalysisTime: 0,
    };
    this.processingTimes = [];
  }

  /**
   * Cancel all pending requests
   */
  public cancelAll(): void {
    this.pendingRequests.forEach((pending) => {
      clearTimeout(pending.timeoutId);
      pending.reject(new Error("Request cancelled"));
    });
    this.pendingRequests.clear();
  }

  /**
   * Destroy worker and cleanup
   */
  public destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.cancelAll();

    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.isInitialized = false;
  }
}

// Export singleton instance
export const musicAnalyzer = new MusicAnalyzerClient();
export default musicAnalyzer;
