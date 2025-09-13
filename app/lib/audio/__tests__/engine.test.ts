/**
 * Audio Engine Tests
 *
 * Tests for core audio engine functionality including:
 * - AudioContext initialization
 * - Latency measurement
 * - Audio source creation
 * - Performance monitoring
 */

import { AudioEngine, AudioSource, getAudioEngine } from '../engine';

// Mock Tone.js for testing
jest.mock('tone', () => {
  const mockContext = {
    sampleRate: 48000,
    state: 'running',
    baseLatency: 0.005, // 5ms
    currentTime: 0,
    resume: jest.fn().mockResolvedValue(undefined),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  };

  const mockPlayer = {
    buffer: null,
    autostart: false,
    loop: false,
    playbackRate: 1,
    state: 'stopped',
    loaded: true,
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    seek: jest.fn(),
    dispose: jest.fn(),
  };

  const mockGain = {
    gain: { value: 1 },
    connect: jest.fn(),
    toDestination: jest.fn().mockReturnThis(),
    dispose: jest.fn(),
  };

  const mockLimiter = {
    connect: jest.fn(),
    dispose: jest.fn(),
  };

  const mockPitchShift = {
    connect: jest.fn(),
    dispose: jest.fn(),
  };

  const mockBuffer = {
    duration: 180, // 3 minutes
    load: jest.fn().mockResolvedValue(undefined),
  };

  return {
    Context: jest.fn().mockImplementation(() => mockContext),
    Player: jest.fn().mockImplementation(() => mockPlayer),
    Gain: jest.fn().mockImplementation(() => mockGain),
    Limiter: jest.fn().mockImplementation(() => mockLimiter),
    PitchShift: jest.fn().mockImplementation(() => mockPitchShift),
    ToneAudioBuffer: jest.fn().mockImplementation(() => mockBuffer),
  };
});

// Mock performance.memory for testing
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  },
  writable: true,
});

describe('AudioEngine', () => {
  let engine: AudioEngine;

  beforeEach(() => {
    // Clear singleton instance
    (AudioEngine as any).instance = null;
    engine = getAudioEngine();
  });

  afterEach(() => {
    engine.dispose();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create singleton instance', () => {
      const engine1 = getAudioEngine();
      const engine2 = getAudioEngine();
      expect(engine1).toBe(engine2);
    });

    it('should initialize with optimal settings', async () => {
      await engine.initialize();
      expect(engine.context.sampleRate).toBe(48000);
    });

    it('should measure latency under 20ms', async () => {
      await engine.initialize();
      const metrics = engine.getPerformanceMetrics();

      // With 48kHz sample rate and 128 buffer size:
      // Buffer latency = 128/48000 * 1000 = 2.67ms
      // Context latency = 5ms (mocked)
      // Total = ~7.67ms (well under 20ms)
      expect(metrics.latency).toBeLessThan(20);
    });

    it('should set up master output chain', async () => {
      await engine.initialize();
      expect(engine.getMasterOutput()).toBeDefined();
      expect(engine.masterGain).toBeDefined();
    });
  });

  describe('Audio Sources', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should create deck audio source', () => {
      const source = engine.createDeckSource('deckA');
      expect(source).toBeInstanceOf(AudioSource);
      expect(source.deckId).toBe('deckA');
    });

    it('should register audio graph nodes', () => {
      const source = engine.createDeckSource('deckA');
      const node = engine.getNode('deck_deckA');
      expect(node).toBe(source.outputNode);
    });

    it('should load audio files', async () => {
      const mockUrl = 'test-audio.mp3';
      const buffer = await engine.loadAudioFile(mockUrl);
      expect(buffer).toBeDefined();
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    it('should track performance metrics', () => {
      const metrics = engine.getPerformanceMetrics();
      expect(metrics).toHaveProperty('cpuUsage');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('latency');
      expect(metrics).toHaveProperty('dropouts');
    });

    it('should monitor memory usage', () => {
      const metrics = engine.getPerformanceMetrics();
      expect(metrics.memoryUsage).toBe(50 * 1024 * 1024); // 50MB from mock
    });
  });

  describe('Resource Management', () => {
    it('should dispose resources properly', () => {
      const source = engine.createDeckSource('test');
      engine.dispose();

      // Should clear audio graph
      expect(engine.getNode('deck_test')).toBeUndefined();
    });
  });
});

describe('AudioSource', () => {
  let engine: AudioEngine;
  let source: AudioSource;

  beforeEach(async () => {
    (AudioEngine as any).instance = null;
    engine = getAudioEngine();
    await engine.initialize();
    source = engine.createDeckSource('testDeck');
  });

  afterEach(() => {
    source.dispose();
    engine.dispose();
  });

  describe('Playback Control', () => {
    it('should control playback rate within ±8% range', () => {
      // Test minimum range (92%)
      source.setPlaybackRate(0.92);
      expect(source.player.playbackRate).toBe(0.92);

      // Test maximum range (108%)
      source.setPlaybackRate(1.08);
      expect(source.player.playbackRate).toBe(1.08);

      // Test clamping below minimum
      source.setPlaybackRate(0.8);
      expect(source.player.playbackRate).toBe(0.92);

      // Test clamping above maximum
      source.setPlaybackRate(1.2);
      expect(source.player.playbackRate).toBe(1.08);
    });

    it('should control volume within 0-1 range', () => {
      source.setVolume(0.5);
      expect(source.gainNode.gain.value).toBe(0.5);

      // Test clamping
      source.setVolume(-0.1);
      expect(source.gainNode.gain.value).toBe(0);

      source.setVolume(1.5);
      expect(source.gainNode.gain.value).toBe(1);
    });

    it('should start and stop playback', () => {
      source.start();
      expect(source.player.start).toHaveBeenCalled();

      source.stop();
      expect(source.player.stop).toHaveBeenCalled();
    });

    it('should seek to position', async () => {
      const mockUrl = 'test-audio.mp3';
      await source.loadFile(mockUrl);

      // Seek to 50% (90 seconds of 180 second track)
      source.seek(0.5);
      expect(source.player.seek).toHaveBeenCalledWith(90);
    });
  });

  describe('File Loading', () => {
    it('should load audio files', async () => {
      const mockUrl = 'test-audio.mp3';
      await source.loadFile(mockUrl);
      expect(source.duration).toBe(180); // 3 minutes from mock
    });

    it('should handle loading errors', async () => {
      // Mock a loading error
      const mockBuffer = source.player.buffer;
      if (mockBuffer && mockBuffer.load) {
        (mockBuffer.load as jest.Mock).mockRejectedValueOnce(new Error('Load failed'));
      }

      await expect(source.loadFile('invalid-url')).rejects.toThrow();
    });
  });

  describe('State Tracking', () => {
    it('should track playing state', () => {
      // Initially not playing
      expect(source.isPlaying).toBe(false);

      // Mock playing state
      (source.player as any).state = 'started';
      expect(source.isPlaying).toBe(true);
    });

    it('should calculate position correctly', async () => {
      await source.loadFile('test-audio.mp3');

      // Mock current time and start time
      (engine.context as any).currentTime = 10;
      (source.player as any)._startTime = 5;
      source.player.playbackRate = 1;

      const position = source.getPosition();
      // (10 - 5) * 1 / 180 = 5/180 ≈ 0.028
      expect(position).toBeCloseTo(0.028, 2);
    });
  });

  describe('Resource Cleanup', () => {
    it('should dispose all audio nodes', () => {
      source.dispose();
      expect(source.player.dispose).toHaveBeenCalled();
      expect(source.gainNode.dispose).toHaveBeenCalled();
      expect(source.pitchShift.dispose).toHaveBeenCalled();
      expect(source.outputNode.dispose).toHaveBeenCalled();
    });
  });
});

describe('Performance Requirements', () => {
  let engine: AudioEngine;

  beforeEach(() => {
    (AudioEngine as any).instance = null;
    engine = getAudioEngine();
  });

  afterEach(() => {
    engine.dispose();
  });

  it('should achieve target latency under 20ms', async () => {
    await engine.initialize();
    const metrics = engine.getPerformanceMetrics();

    expect(metrics.latency).toBeLessThan(20);
    console.log(`Audio latency: ${metrics.latency.toFixed(2)}ms (target: <20ms)`);
  });

  it('should stay within memory limits', async () => {
    await engine.initialize();

    // Load multiple files to test memory management
    const promises = Array.from({ length: 10 }, (_, i) =>
      engine.loadAudioFile(`test-audio-${i}.mp3`)
    );

    await Promise.all(promises);

    const metrics = engine.getPerformanceMetrics();
    const memoryMB = metrics.memoryUsage / (1024 * 1024);

    expect(memoryMB).toBeLessThan(500); // 500MB limit
    console.log(`Memory usage: ${memoryMB.toFixed(2)}MB (limit: 500MB)`);
  });

  it('should maintain performance with dual decks', async () => {
    await engine.initialize();

    const deckA = engine.createDeckSource('deckA');
    const deckB = engine.createDeckSource('deckB');

    await Promise.all([
      deckA.loadFile('test-audio-a.mp3'),
      deckB.loadFile('test-audio-b.mp3')
    ]);

    // Simulate simultaneous playback
    deckA.start();
    deckB.start();

    const metrics = engine.getPerformanceMetrics();
    expect(metrics.latency).toBeLessThan(20);

    console.log(`Dual deck latency: ${metrics.latency.toFixed(2)}ms`);
  });
});