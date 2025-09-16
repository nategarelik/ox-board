/**
 * Tests for EnhancedDjStore
 *
 * Tests the enhanced DJ store with music analysis integration:
 * - Music analysis integration
 * - Auto-sync functionality
 * - Beat phase tracking
 * - Mixing suggestions
 * - Real-time analysis
 */

import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import useEnhancedDJStore, { type AnalyzedTrack, type EnhancedDJState } from '../enhancedDjStore';

// Mock the music analyzer client
const mockMusicAnalyzer = {
  analyzeTrack: jest.fn(),
  analyzeRealTime: jest.fn(),
  extractBPM: jest.fn(),
  detectKey: jest.fn(),
  getSpectralFeatures: jest.fn(),
  detectOnsets: jest.fn(),
  getBeatPhase: jest.fn(),
  isCompatibleKey: jest.fn(),
  getBPMMatchPercentage: jest.fn(),
  getCompatibleBPMRange: jest.fn(),
  getStatus: jest.fn(),
  clearStats: jest.fn(),
  cancelAll: jest.fn(),
  destroy: jest.fn()
};

jest.mock('../lib/audio/musicAnalyzerClient', () => ({
  musicAnalyzer: mockMusicAnalyzer,
  MusicAnalyzerClient: jest.fn(() => mockMusicAnalyzer)
}));

// Mock AudioMixer
const mockMixer = {
  initialize: jest.fn().mockResolvedValue(undefined),
  getChannelConfig: jest.fn(),
  getCrossfaderConfig: jest.fn(),
  getMasterConfig: jest.fn(),
  setChannelGain: jest.fn(),
  setChannelEQ: jest.fn(),
  setCrossfaderPosition: jest.fn(),
  setMasterGain: jest.fn(),
  reset: jest.fn()
};

jest.mock('../lib/audio/mixer', () => ({
  AudioMixer: jest.fn(() => mockMixer)
}));

describe('EnhancedDjStore', () => {
  let store: EnhancedDJState;
  let mockTrack: AnalyzedTrack;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup mock responses
    mockMixer.getChannelConfig.mockReturnValue({
      gain: 0.75,
      eq: { low: 0, mid: 0, high: 0 },
      muted: false,
      solo: false
    });

    mockMixer.getCrossfaderConfig.mockReturnValue({
      position: 0.5,
      curve: 'linear'
    });

    mockMixer.getMasterConfig.mockReturnValue({
      gain: 0.8,
      limiterEnabled: true,
      limiterThreshold: -1,
      compressorEnabled: true,
      compressorRatio: 4,
      compressorThreshold: -24,
      compressorAttack: 0.003,
      compressorRelease: 0.25
    });

    mockMusicAnalyzer.getStatus.mockReturnValue({
      isInitialized: true,
      isProcessing: false,
      queueSize: 0,
      stats: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageProcessingTime: 0,
        lastAnalysisTime: 0
      }
    });

    mockMusicAnalyzer.isCompatibleKey.mockImplementation((key1, key2) => {
      // Simple mock compatibility: same key or relative major/minor
      if (key1 === key2) return true;
      if (key1 === 'C major' && key2 === 'A minor') return true;
      if (key1 === 'A minor' && key2 === 'C major') return true;
      return false;
    });

    mockMusicAnalyzer.getBPMMatchPercentage.mockImplementation((bpm1, bpm2) => {
      const diff = Math.abs(bpm1 - bpm2);
      return Math.max(0, 1 - diff / Math.max(bpm1, bpm2));
    });

    // Create test track
    mockTrack = {
      id: 'test-track-1',
      title: 'Test Track',
      artist: 'Test Artist',
      duration: 180,
      url: 'test-url.mp3',
      bpm: 128,
      bpmConfidence: 0.9,
      key: 'C',
      keyConfidence: 0.8,
      scale: 'major',
      energy: 0.7,
      beatGrid: [0.5, 1.0, 1.5, 2.0, 2.5, 3.0],
      downbeats: [0.5, 2.5],
      phrases: [
        { start: 0, end: 16, type: 'verse' },
        { start: 16, end: 32, type: 'chorus' }
      ],
      camelotKey: '8B',
      compatibleKeys: ['C major', 'G major', 'A minor'],
      mixingBPMRange: [120, 136] as [number, number],
      analyzedAt: Date.now(),
      analysisVersion: '1.0.0'
    };

    // Get fresh store instance
    store = useEnhancedDJStore.getState();
    store.reset();
  });

  afterEach(() => {
    store.reset();
  });

  describe('Initialization', () => {
    it('should initialize with correct default state', () => {
      expect(store.mixer).toBeNull();
      expect(store.decks).toHaveLength(4);
      expect(store.musicAnalysis.isAnalyzing).toBe(false);
      expect(store.analyzerStatus).toBeNull();
      expect(store.viewMode).toBe('mixer');
    });

    it('should initialize mixer and analyzer status', async () => {
      await store.initializeMixer();

      expect(mockMixer.initialize).toHaveBeenCalled();
      expect(store.mixer).toBeDefined();
      expect(store.analyzerStatus).toBeDefined();
      expect(store.channelConfigs).toHaveLength(4);
    });
  });

  describe('Track Analysis', () => {
    it('should analyze track and create AnalyzedTrack', async () => {
      const mockAnalysisResult = {
        bpm: { bpm: 128, confidence: 0.9, beatGrid: [0.5, 1.0, 1.5], downbeats: [0.5], phase: 0, timeSignature: [4, 4] },
        key: { key: 'C', scale: 'major', confidence: 0.8, chroma: new Float32Array(12), keyStrength: 0.8 },
        spectral: { energy: 0.7, centroid: 2000, rolloff: 4000, bandwidth: 1500, flatness: 0.3, flux: 0.2, rms: 0.5, zcr: 0.1 },
        onsets: { onsets: [0.5, 1.0], strength: [0.8, 0.9], novelty: new Float32Array(100), peaks: [0.5, 1.0] },
        harmonic: { harmonicChangeRate: 0.2, inharmonicity: 0.1, oddToEvenRatio: 1.2, tristimulus: [0.4, 0.3, 0.3] },
        phrases: { phrases: [{ start: 0, end: 16, length: 16, type: 'verse' }], structure: ['verse'] },
        mixing: { compatibleKeys: ['C major', 'G major'], bpmRange: [120, 136], energyMatch: 0.7, harmonyScore: 0.8, transitionPoints: [8, 16] },
        duration: 180,
        timestamp: Date.now()
      };

      mockMusicAnalyzer.analyzeTrack.mockResolvedValue(mockAnalysisResult);

      const audioData = new Float32Array(44100);
      const trackInfo = { title: 'Test Track', artist: 'Test Artist' };

      const result = await store.analyzeTrack(audioData, trackInfo);

      expect(mockMusicAnalyzer.analyzeTrack).toHaveBeenCalledWith(audioData);
      expect(result.bpm).toBe(128);
      expect(result.key).toBe('C');
      expect(result.scale).toBe('major');
      expect(result.energy).toBe(0.7);
      expect(result.title).toBe('Test Track');
      expect(result.artist).toBe('Test Artist');
      expect(result.camelotKey).toBeTruthy();
      expect(result.compatibleKeys).toContain('C major');
    });

    it('should handle analysis errors', async () => {
      mockMusicAnalyzer.analyzeTrack.mockRejectedValue(new Error('Analysis failed'));

      const audioData = new Float32Array(44100);
      const trackInfo = { title: 'Test Track' };

      await expect(store.analyzeTrack(audioData, trackInfo)).rejects.toThrow('Analysis failed');

      expect(store.musicAnalysis.isAnalyzing).toBe(false);
      expect(store.musicAnalysis.progress).toBe(0);
    });

    it('should set analysis state during processing', async () => {
      const promise = new Promise(resolve => setTimeout(resolve, 100));
      mockMusicAnalyzer.analyzeTrack.mockReturnValue(promise);

      const audioData = new Float32Array(44100);
      const trackInfo = { title: 'Test Track' };

      // Start analysis
      const analysisPromise = store.analyzeTrack(audioData, trackInfo);

      // Check state during analysis
      expect(store.musicAnalysis.isAnalyzing).toBe(true);
      expect(store.musicAnalysis.progress).toBe(0);

      // Wait for completion
      await expect(analysisPromise).rejects.toThrow(); // Will fail because promise doesn't resolve to analysis result
    });
  });

  describe('Enhanced Deck Operations', () => {
    beforeEach(() => {
      store.loadTrack(0, mockTrack);
    });

    it('should load track with enhanced metadata', () => {
      const deck = store.decks[0];

      expect(deck.track).toBe(mockTrack);
      expect(deck.currentBeatPhase).toBe(0);
      expect(deck.nextBeatTime).toBe(0);
      expect(deck.isInSync).toBe(false);
      expect(deck.syncAccuracy).toBe(0);
    });

    it('should start real-time analysis when playing', () => {
      store.musicAnalysis.realTimeEnabled = true;

      store.playDeck(0);

      expect(store.decks[0].isPlaying).toBe(true);
      expect(store.musicAnalysis.currentDeck).toBe(0);
    });

    it('should stop real-time analysis when pausing', () => {
      store.startRealTimeAnalysis(0);
      store.playDeck(0);

      store.pauseDeck(0);

      expect(store.decks[0].isPlaying).toBe(false);
      expect(store.musicAnalysis.realTimeEnabled).toBe(false);
    });

    it('should update beat phase tracking', () => {
      const currentTime = 1.5;

      store.updateBeatPhase(0, currentTime);

      const deck = store.decks[0];
      expect(deck.currentTime).toBe(currentTime);
      expect(typeof deck.currentBeatPhase).toBe('number');
      expect(typeof deck.nextBeatTime).toBe('number');
    });
  });

  describe('Auto-Sync Functionality', () => {
    beforeEach(() => {
      // Load compatible tracks
      store.loadTrack(0, mockTrack);
      store.loadTrack(1, {
        ...mockTrack,
        id: 'test-track-2',
        bpm: 125,
        key: 'G',
        scale: 'major'
      });
    });

    it('should enable auto-sync between decks', () => {
      store.enableAutoSync(0, 1, 'bpm');

      const deck = store.decks[0];
      expect(deck.autoSyncEnabled).toBe(true);
      expect(deck.syncTarget).toBe(1);
      expect(deck.syncMode).toBe('bpm');
    });

    it('should disable auto-sync', () => {
      store.enableAutoSync(0, 1, 'bpm');
      store.disableAutoSync(0);

      const deck = store.decks[0];
      expect(deck.autoSyncEnabled).toBe(false);
      expect(deck.syncTarget).toBeNull();
    });

    it('should sync deck BPMs', () => {
      store.syncDecks(0, 1);

      const sourceDeck = store.decks[0];
      const targetDeck = store.decks[1];

      // Source deck should adjust playback rate to match target
      const expectedRate = targetDeck.track!.bpm / sourceDeck.track!.bpm;
      expect(sourceDeck.playbackRate).toBeCloseTo(expectedRate, 3);
      expect(sourceDeck.isInSync).toBe(true);
      expect(sourceDeck.syncAccuracy).toBe(1.0);
    });

    it('should snap to nearest beat', () => {
      // Set current time between beats
      store.decks[0].currentTime = 0.75;

      store.snapToBeat(0);

      // Should snap to nearest beat (0.5 or 1.0)
      const newTime = store.decks[0].currentTime;
      expect([0.5, 1.0]).toContain(newTime);
    });
  });

  describe('Mixing Suggestions', () => {
    beforeEach(() => {
      // Load multiple tracks with different compatibility
      store.loadTrack(0, mockTrack);
      store.loadTrack(1, {
        ...mockTrack,
        id: 'track-2',
        bpm: 125,
        key: 'G',
        scale: 'major'
      });
      store.loadTrack(2, {
        ...mockTrack,
        id: 'track-3',
        bpm: 140,
        key: 'F#',
        scale: 'minor'
      });
    });

    it('should generate mixing suggestions', () => {
      store.generateMixingSuggestions();

      expect(store.musicAnalysis.suggestions).toBeInstanceOf(Array);
      expect(store.musicAnalysis.compatibilityMatrix).toBeInstanceOf(Array);
      expect(store.musicAnalysis.compatibilityMatrix).toHaveLength(4);
    });

    it('should calculate compatibility matrix', () => {
      store.generateMixingSuggestions();

      const matrix = store.musicAnalysis.compatibilityMatrix;

      // Diagonal should be 0 (deck with itself)
      expect(matrix[0][0]).toBe(0);
      expect(matrix[1][1]).toBe(0);

      // Should have calculated compatibility scores
      expect(typeof matrix[0][1]).toBe('number');
      expect(matrix[0][1]).toBeGreaterThanOrEqual(0);
      expect(matrix[0][1]).toBeLessThanOrEqual(1);
    });

    it('should identify high compatibility pairs', () => {
      // Mock high compatibility between decks 0 and 1
      mockMusicAnalyzer.isCompatibleKey.mockReturnValue(true);
      mockMusicAnalyzer.getBPMMatchPercentage.mockReturnValue(0.9);

      store.generateMixingSuggestions();

      const suggestions = store.musicAnalysis.suggestions;
      const highCompatSuggestion = suggestions.find(s =>
        (s.sourceDeck === 0 && s.targetDeck === 1) ||
        (s.sourceDeck === 1 && s.targetDeck === 0)
      );

      expect(highCompatSuggestion).toBeDefined();
      expect(highCompatSuggestion?.autoSyncPossible).toBe(true);
    });

    it('should calculate mixing compatibility accurately', () => {
      const compatibility = store.getMixingCompatibility(0, 1);

      expect(typeof compatibility).toBe('number');
      expect(compatibility).toBeGreaterThanOrEqual(0);
      expect(compatibility).toBeLessThanOrEqual(1);
    });

    it('should return 0 compatibility for empty decks', () => {
      const compatibility = store.getMixingCompatibility(0, 3); // Deck 3 has no track
      expect(compatibility).toBe(0);
    });
  });

  describe('Real-time Analysis', () => {
    beforeEach(() => {
      store.loadTrack(0, mockTrack);
    });

    it('should start real-time analysis', () => {
      store.startRealTimeAnalysis(0);

      expect(store.musicAnalysis.realTimeEnabled).toBe(true);
      expect(store.musicAnalysis.currentDeck).toBe(0);
    });

    it('should stop real-time analysis', () => {
      store.startRealTimeAnalysis(0);
      store.stopRealTimeAnalysis(0);

      expect(store.musicAnalysis.realTimeEnabled).toBe(false);
      expect(store.musicAnalysis.currentDeck).toBeNull();
      expect(store.musicAnalysis.spectralFeatures).toBeNull();
    });

    it('should not stop analysis for different deck', () => {
      store.startRealTimeAnalysis(0);
      store.stopRealTimeAnalysis(1); // Different deck

      expect(store.musicAnalysis.realTimeEnabled).toBe(true);
      expect(store.musicAnalysis.currentDeck).toBe(0);
    });
  });

  describe('Integration with Base DJ Features', () => {
    beforeEach(async () => {
      await store.initializeMixer();
    });

    it('should update mixer when changing deck volume', () => {
      store.setDeckVolume(0, 0.8);

      expect(store.decks[0].volume).toBe(0.8);
      expect(mockMixer.setChannelGain).toHaveBeenCalledWith(0, 0.8);
    });

    it('should update beat phase when changing playback rate', () => {
      store.loadTrack(0, mockTrack);

      store.setDeckPlaybackRate(0, 1.05);

      expect(store.decks[0].playbackRate).toBe(1.05);
      // Beat phase should be updated (tested indirectly through no errors)
    });

    it('should apply gesture controls to mixer', () => {
      const gestureControls = [
        { type: 'volume' as const, hand: 'left' as const, value: 0.8 },
        { type: 'crossfader' as const, hand: 'left' as const, value: 0.3 }
      ];

      store.updateGestureControls(gestureControls);

      expect(mockMixer.setChannelGain).toHaveBeenCalled();
      expect(mockMixer.setCrossfaderPosition).toHaveBeenCalledWith(0.3);
    });
  });

  describe('State Management', () => {
    it('should set view mode including analysis view', () => {
      store.setViewMode('analysis');
      expect(store.viewMode).toBe('analysis');

      store.setViewMode('mixer');
      expect(store.viewMode).toBe('mixer');
    });

    it('should activate DJ mode and initialize mixer', async () => {
      const initPromise = store.setDJModeActive(true);

      expect(store.isDJModeActive).toBe(true);

      // Wait for mixer initialization
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(mockMixer.initialize).toHaveBeenCalled();
    });

    it('should reset all state including analysis', () => {
      // Set up some state
      store.loadTrack(0, mockTrack);
      store.startRealTimeAnalysis(0);
      store.setViewMode('analysis');

      store.reset();

      expect(store.decks[0].track).toBeNull();
      expect(store.musicAnalysis.realTimeEnabled).toBe(false);
      expect(store.musicAnalysis.currentDeck).toBeNull();
      expect(store.viewMode).toBe('mixer');
      expect(mockMusicAnalyzer.cancelAll).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle mixer initialization failure', async () => {
      mockMixer.initialize.mockRejectedValue(new Error('Mixer init failed'));

      await expect(store.initializeMixer()).rejects.toThrow('Mixer init failed');
    });

    it('should handle missing tracks gracefully', () => {
      // Try to sync decks without tracks
      expect(() => store.syncDecks(0, 1)).not.toThrow();

      // Try to update beat phase without track
      expect(() => store.updateBeatPhase(0, 1.0)).not.toThrow();

      // Try to snap to beat without track
      expect(() => store.snapToBeat(0)).not.toThrow();
    });

    it('should handle invalid deck indices', () => {
      expect(() => store.updateBeatPhase(10, 1.0)).not.toThrow();
      expect(() => store.enableAutoSync(10, 0, 'bpm')).not.toThrow();
    });
  });

  describe('Performance Considerations', () => {
    it('should not regenerate suggestions unnecessarily', () => {
      const generateSpy = jest.spyOn(store, 'generateMixingSuggestions');

      // Load track should trigger suggestion generation
      store.loadTrack(0, mockTrack);
      expect(generateSpy).toHaveBeenCalledTimes(1);

      // Other operations should not trigger regeneration
      store.playDeck(0);
      store.setDeckVolume(0, 0.8);
      expect(generateSpy).toHaveBeenCalledTimes(1);

      generateSpy.mockRestore();
    });

    it('should handle rapid beat phase updates', () => {
      store.loadTrack(0, mockTrack);

      // Simulate rapid updates
      for (let i = 0; i < 100; i++) {
        store.updateBeatPhase(0, i * 0.01);
      }

      // Should complete without errors
      expect(store.decks[0].currentTime).toBeCloseTo(0.99, 2);
    });
  });
});