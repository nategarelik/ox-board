/**
 * Web Worker for Music Analysis with Essentia.js
 *
 * Performs heavy music analysis computations off the main thread:
 * - BPM detection and beat tracking
 * - Musical key detection
 * - Real-time spectral analysis
 * - Onset detection
 * - Harmonic analysis
 */

import { MusicAnalyzer, type MusicAnalysisResult, type AnalysisOptions } from '../audio/musicAnalyzer';

export interface MusicAnalysisRequest {
  id: string;
  type: 'analyze' | 'realtime' | 'bpm' | 'key' | 'spectral' | 'onsets' | 'beatphase';
  audioData: Float32Array;
  sampleRate: number;
  currentTime?: number;
  options?: AnalysisOptions;
}

export interface MusicAnalysisResponse {
  id: string;
  type: string;
  success: boolean;
  result?: any;
  error?: string;
  processingTime?: number;
  timestamp: number;
}

export interface BeatPhaseRequest extends MusicAnalysisRequest {
  type: 'beatphase';
  currentTime: number;
}

export interface BeatPhaseResponse {
  phase: number;
  nextBeatTime: number;
  beatInterval: number;
  confidence: number;
}

// Worker instance
let analyzer: MusicAnalyzer | null = null;
let isInitializing = false;

// Initialize analyzer
async function initializeAnalyzer(): Promise<void> {
  if (analyzer || isInitializing) return;

  isInitializing = true;
  try {
    analyzer = new MusicAnalyzer();
    await analyzer.waitForInitialization();
    console.log('Music analyzer initialized in worker');
  } catch (error) {
    console.error('Failed to initialize music analyzer:', error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

// Process analysis requests
async function processRequest(request: MusicAnalysisRequest): Promise<any> {
  if (!analyzer) {
    await initializeAnalyzer();
  }

  if (!analyzer) {
    throw new Error('Music analyzer not available');
  }

  const startTime = performance.now();

  switch (request.type) {
    case 'analyze':
      return await analyzer.analyzeTrack(request.audioData, request.options);

    case 'realtime':
      return await analyzer.analyzeRealTime(request.audioData, request.options);

    case 'bpm':
      return await analyzer.extractBPM(request.audioData);

    case 'key':
      return await analyzer.detectKey(request.audioData);

    case 'spectral':
      return await analyzer.getSpectralFeatures(request.audioData);

    case 'onsets':
      return await analyzer.detectOnsets(request.audioData);

    case 'beatphase':
      if (request.currentTime === undefined) {
        throw new Error('currentTime required for beatphase analysis');
      }
      const phase = analyzer.getBeatPhase(request.currentTime);
      const nextBeatTime = analyzer.getNextBeatTime(request.currentTime);
      return {
        phase,
        nextBeatTime,
        beatInterval: (analyzer as any).beatTracker?.beatInterval || 0,
        confidence: (analyzer as any).beatTracker?.confidence || 0
      } as BeatPhaseResponse;

    default:
      throw new Error(`Unknown request type: ${request.type}`);
  }
}

// Message handler
self.onmessage = async (event) => {
  const request = event.data as MusicAnalysisRequest;
  const startTime = performance.now();

  try {
    const result = await processRequest(request);
    const processingTime = performance.now() - startTime;

    const response: MusicAnalysisResponse = {
      id: request.id,
      type: request.type,
      success: true,
      result,
      processingTime,
      timestamp: Date.now()
    };

    self.postMessage(response);
  } catch (error) {
    const processingTime = performance.now() - startTime;

    const response: MusicAnalysisResponse = {
      id: request.id,
      type: request.type,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processingTime,
      timestamp: Date.now()
    };

    self.postMessage(response);
  }
};

// Handle worker termination
self.onclose = () => {
  if (analyzer) {
    analyzer.destroy();
    analyzer = null;
  }
};

// Types are already defined above, no need to re-export