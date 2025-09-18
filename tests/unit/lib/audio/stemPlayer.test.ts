import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import * as Tone from 'tone';
import { StemPlayer, StemPlayerConfig } from '../stemPlayer';
import { DemucsOutput, StemType } from '../demucsProcessor';

// Mock Tone.js
jest.mock('tone', () => {
  const mockPlayer = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    dispose: jest.fn(),
    loaded: true,
    state: 'stopped',
    immediate: jest.fn(() => 0),
    playbackRate: 1,
    onload: null,
    onstop: null,
    onerror: null
  };

  const mockGain = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    gain: {
      value: 1,
      rampTo: jest.fn()
    }
  };

  const mockPanner = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    pan: {
      value: 0,
      rampTo: jest.fn()
    }
  };

  const mockEQ3 = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    low: { value: 0 },
    mid: { value: 0 },
    high: { value: 0 }
  };

  const mockCrossFade = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    fade: {
      value: 0.5,
      rampTo: jest.fn()
    },
    a: mockGain,
    b: mockGain
  };

  return {
    Player: jest.fn(() => mockPlayer),
    Gain: jest.fn(() => mockGain),
    Panner: jest.fn(() => mockPanner),
    EQ3: jest.fn(() => mockEQ3),
    CrossFade: jest.fn(() => mockCrossFade),
    start: jest.fn().mockResolvedValue(undefined),
    now: jest.fn(() => 0)
  };
});

// Mock AudioContext
const mockAudioContext = {
  decodeAudioData: jest.fn(),
  createBuffer: jest.fn(),
  createBufferSource: jest.fn(),
  createGain: jest.fn(),
  createPanner: jest.fn(),
  destination: {},
  sampleRate: 44100,
  currentTime: 0
};

// Mock AudioBuffer
const createMockAudioBuffer = (duration: number = 10, channels: number = 2): AudioBuffer => {
  const buffer = {
    length: Math.floor(duration * 44100),
    duration,
    sampleRate: 44100,
    numberOfChannels: channels,
    getChannelData: jest.fn(() => new Float32Array(Math.floor(duration * 44100))),
    copyFromChannel: jest.fn(),
    copyToChannel: jest.fn(),
    clone: jest.fn()
  } as unknown as AudioBuffer;

  // Make clone return the same buffer for testing
  (buffer.clone as jest.Mock).mockReturnValue(buffer);

  return buffer;
};

const createMockDemucsOutput = (duration: number = 10): DemucsOutput => {
  const audioBuffer = createMockAudioBuffer(duration);

  return {
    drums: {
      audioBuffer,
      duration,
      sampleRate: 44100,
      hasAudio: true
    },
    bass: {
      audioBuffer,
      duration,
      sampleRate: 44100,
      hasAudio: true
    },
    melody: {
      audioBuffer,
      duration,
      sampleRate: 44100,
      hasAudio: true
    },
    vocals: {
      audioBuffer,
      duration,
      sampleRate: 44100,
      hasAudio: true
    },
    original: {
      audioBuffer,
      duration,
      sampleRate: 44100,
      hasAudio: true
    },
    metadata: {
      processingTime: 1000,
      model: 'htdemucs',
      inputFile: {
        name: 'test.mp3',
        size: 1024000,
        duration
      },
      status: 'completed'
    }
  };
};

describe('StemPlayer', () => {
  let stemPlayer: StemPlayer;
  let mockDemucsOutput: DemucsOutput;

  beforeEach(async () => {
    // Reset all mocks
    jest.clearAllMocks();

    // Mock global AudioContext
    global.AudioContext = jest.fn(() => mockAudioContext) as any;
    global.webkitAudioContext = jest.fn(() => mockAudioContext) as any;

    const config: Partial<StemPlayerConfig> = {
      timeStretchEnabled: true,
      crossfadeCurve: 'logarithmic',
      bufferSize: 512,
      maxLatency: 20
    };

    stemPlayer = new StemPlayer(config);
    mockDemucsOutput = createMockDemucsOutput(10);
  });

  afterEach(() => {
    if (stemPlayer) {
      stemPlayer.dispose();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const defaultPlayer = new StemPlayer();
      expect(defaultPlayer).toBeInstanceOf(StemPlayer);
      expect(defaultPlayer.getCurrentTime()).toBe(0);
      expect(defaultPlayer.isPlaying()).toBe(false);
      expect(defaultPlayer.areStemsLoaded()).toBe(false);
    });

    it('should initialize with custom config', () => {
      const config: StemPlayerConfig = {
        timeStretchEnabled: false,
        crossfadeCurve: 'linear',
        bufferSize: 1024,
        maxLatency: 50
      };

      const player = new StemPlayer(config);
      expect(player).toBeInstanceOf(StemPlayer);
      player.dispose();
    });

    it('should initialize Tone.js when initialize() is called', async () => {
      await stemPlayer.initialize();
      expect(Tone.start).toHaveBeenCalled();
    });
  });

  describe('Stem Loading', () => {
    beforeEach(async () => {
      await stemPlayer.initialize();
    });

    it('should load stems successfully', async () => {
      const results = await stemPlayer.loadStems(mockDemucsOutput);

      expect(results).toHaveLength(5); // 4 stems + original
      expect(results.every(r => r.success)).toBe(true);
      expect(stemPlayer.areStemsLoaded()).toBe(true);
      expect(stemPlayer.getDuration()).toBe(10);
    });

    it('should handle failed stem loads gracefully', async () => {
      const invalidOutput = {
        ...mockDemucsOutput,
        drums: {
          ...mockDemucsOutput.drums,
          hasAudio: false
        }
      };

      const results = await stemPlayer.loadStems(invalidOutput);

      expect(results.find(r => r.stemType === 'drums')?.success).toBe(false);
      expect(results.filter(r => r.success).length).toBeGreaterThan(0);
    });

    it('should emit stemsLoaded event when stems are loaded', async () => {
      const mockCallback = jest.fn();
      stemPlayer.on('stemsLoaded', mockCallback);

      await stemPlayer.loadStems(mockDemucsOutput);

      expect(mockCallback).toHaveBeenCalledWith(
        expect.objectContaining({ results: expect.any(Array) })
      );
    });

    it('should dispose old players when loading new stems', async () => {
      await stemPlayer.loadStems(mockDemucsOutput);
      const firstLoadResults = await stemPlayer.loadStems(createMockDemucsOutput(15));

      expect(firstLoadResults).toHaveLength(5);
      expect(stemPlayer.getDuration()).toBe(15);
    });
  });

  describe('Playback Control', () => {
    beforeEach(async () => {
      await stemPlayer.initialize();
      await stemPlayer.loadStems(mockDemucsOutput);
    });

    it('should start playback successfully', async () => {
      await stemPlayer.play();

      expect(stemPlayer.isPlaying()).toBe(true);
      expect(Tone.Player).toHaveBeenCalled();
    });

    it('should throw error when playing without loaded stems', async () => {
      const emptyPlayer = new StemPlayer();
      await emptyPlayer.initialize();

      await expect(emptyPlayer.play()).rejects.toThrow('No stems loaded');
      emptyPlayer.dispose();
    });

    it('should pause playback', async () => {
      await stemPlayer.play();
      stemPlayer.pause();

      expect(stemPlayer.isPlaying()).toBe(false);
    });

    it('should stop playback and reset position', () => {
      stemPlayer.stop();

      expect(stemPlayer.isPlaying()).toBe(false);
      expect(stemPlayer.getCurrentTime()).toBe(0);
    });

    it('should seek to specific time', () => {
      stemPlayer.seek(5);
      expect(stemPlayer.getCurrentTime()).toBe(5);
    });

    it('should clamp seek time to valid range', () => {
      stemPlayer.seek(-5);
      expect(stemPlayer.getCurrentTime()).toBe(0);

      stemPlayer.seek(15);
      expect(stemPlayer.getCurrentTime()).toBe(10);
    });

    it('should emit playStateChanged events', async () => {
      const mockCallback = jest.fn();
      stemPlayer.on('playStateChanged', mockCallback);

      await stemPlayer.play();
      expect(mockCallback).toHaveBeenCalledWith({ isPlaying: true });

      stemPlayer.pause();
      expect(mockCallback).toHaveBeenCalledWith({ isPlaying: false });
    });
  });

  describe('Stem Controls', () => {
    beforeEach(async () => {
      await stemPlayer.initialize();
      await stemPlayer.loadStems(mockDemucsOutput);
    });

    describe('Volume Control', () => {
      it('should set stem volume', () => {
        stemPlayer.setStemVolume('drums', 0.5);

        const controls = stemPlayer.getStemControls('drums');
        expect(controls.volume).toBe(0.5);
      });

      it('should clamp volume to valid range', () => {
        stemPlayer.setStemVolume('bass', -0.5);
        expect(stemPlayer.getStemControls('bass').volume).toBe(0);

        stemPlayer.setStemVolume('bass', 1.5);
        expect(stemPlayer.getStemControls('bass').volume).toBe(1);
      });

      it('should emit stemControlChanged event', () => {
        const mockCallback = jest.fn();
        stemPlayer.on('stemControlChanged', mockCallback);

        stemPlayer.setStemVolume('melody', 0.8);

        expect(mockCallback).toHaveBeenCalledWith({
          stemType: 'melody',
          control: 'volume',
          value: 0.8
        });
      });
    });

    describe('Mute Control', () => {
      it('should mute and unmute stems', () => {
        stemPlayer.setStemMute('vocals', true);
        expect(stemPlayer.getStemControls('vocals').muted).toBe(true);

        stemPlayer.setStemMute('vocals', false);
        expect(stemPlayer.getStemControls('vocals').muted).toBe(false);
      });

      it('should affect audio gain when muting', () => {
        const mockGain = (Tone.Gain as jest.Mock).mock.results[0].value;

        stemPlayer.setStemMute('drums', true);
        expect(mockGain.gain.rampTo).toHaveBeenCalledWith(0, 0.01);
      });
    });

    describe('Solo Control', () => {
      it('should solo stems correctly', () => {
        stemPlayer.setStemSolo('bass', true);
        expect(stemPlayer.getStemControls('bass').soloed).toBe(true);
      });

      it('should handle multiple solo states', () => {
        stemPlayer.setStemSolo('drums', true);
        stemPlayer.setStemSolo('bass', true);

        expect(stemPlayer.getStemControls('drums').soloed).toBe(true);
        expect(stemPlayer.getStemControls('bass').soloed).toBe(true);
      });
    });

    describe('Pan Control', () => {
      it('should set pan position', () => {
        stemPlayer.setStemPan('melody', 0.5);
        expect(stemPlayer.getStemControls('melody').pan).toBe(0.5);
      });

      it('should clamp pan to valid range', () => {
        stemPlayer.setStemPan('vocals', -2);
        expect(stemPlayer.getStemControls('vocals').pan).toBe(-1);

        stemPlayer.setStemPan('vocals', 2);
        expect(stemPlayer.getStemControls('vocals').pan).toBe(1);
      });
    });

    describe('EQ Control', () => {
      it('should set EQ values', () => {
        stemPlayer.setStemEQ('drums', 'low', 5);
        expect(stemPlayer.getStemControls('drums').eq.low).toBe(5);

        stemPlayer.setStemEQ('drums', 'mid', -3);
        expect(stemPlayer.getStemControls('drums').eq.mid).toBe(-3);

        stemPlayer.setStemEQ('drums', 'high', 10);
        expect(stemPlayer.getStemControls('drums').eq.high).toBe(10);
      });

      it('should clamp EQ values to valid range', () => {
        stemPlayer.setStemEQ('bass', 'low', -30);
        expect(stemPlayer.getStemControls('bass').eq.low).toBe(-20);

        stemPlayer.setStemEQ('bass', 'high', 30);
        expect(stemPlayer.getStemControls('bass').eq.high).toBe(20);
      });
    });

    describe('Playback Rate Control', () => {
      it('should set playback rate when time stretching is enabled', () => {
        stemPlayer.setStemPlaybackRate('melody', 1.5);
        expect(stemPlayer.getStemControls('melody').playbackRate).toBe(1.5);
      });

      it('should clamp playback rate to valid range', () => {
        stemPlayer.setStemPlaybackRate('vocals', 0.1);
        expect(stemPlayer.getStemControls('vocals').playbackRate).toBe(0.25);

        stemPlayer.setStemPlaybackRate('vocals', 5);
        expect(stemPlayer.getStemControls('vocals').playbackRate).toBe(4);
      });

      it('should throw error when time stretching is disabled', () => {
        const configWithoutTimeStretch: StemPlayerConfig = {
          timeStretchEnabled: false,
          crossfadeCurve: 'linear',
          bufferSize: 512,
          maxLatency: 20
        };

        const player = new StemPlayer(configWithoutTimeStretch);
        expect(() => player.setStemPlaybackRate('drums', 1.5)).toThrow('Time stretching is disabled');
        player.dispose();
      });
    });
  });

  describe('Crossfading', () => {
    beforeEach(async () => {
      await stemPlayer.initialize();
      await stemPlayer.loadStems(mockDemucsOutput);
    });

    it('should set stem mix value', () => {
      stemPlayer.setStemMix(0.8);
      expect(stemPlayer.getState().stemMix).toBe(0.8);
    });

    it('should clamp stem mix to valid range', () => {
      stemPlayer.setStemMix(-0.5);
      expect(stemPlayer.getState().stemMix).toBe(0);

      stemPlayer.setStemMix(1.5);
      expect(stemPlayer.getState().stemMix).toBe(1);
    });

    it('should apply crossfade curves correctly', () => {
      const mockCrossFade = (Tone.CrossFade as jest.Mock).mock.results[0].value;

      // Test linear curve (default behavior)
      stemPlayer.setStemMix(0.5);
      expect(mockCrossFade.fade.rampTo).toHaveBeenCalledWith(expect.any(Number), 0.01);
    });

    it('should emit stemMixChanged event', () => {
      const mockCallback = jest.fn();
      stemPlayer.on('stemMixChanged', mockCallback);

      stemPlayer.setStemMix(0.7);

      expect(mockCallback).toHaveBeenCalledWith({ stemMix: 0.7 });
    });
  });

  describe('Sync Management', () => {
    beforeEach(async () => {
      await stemPlayer.initialize();
      await stemPlayer.loadStems(mockDemucsOutput);
    });

    it('should start with synced status', () => {
      expect(stemPlayer.getSyncStatus()).toBe('synced');
    });

    it('should monitor sync when playing', async () => {
      await stemPlayer.play();

      // Sync monitoring should be active
      expect(stemPlayer.getSyncStatus()).toBe('synced');
    });

    it('should detect drift and attempt resync', (done) => {
      // Mock players with different times to simulate drift
      const players = (Tone.Player as jest.Mock).mock.results;
      players.forEach((result, index) => {
        result.value.immediate = jest.fn(() => index * 0.2); // Simulate drift
      });

      stemPlayer.on('resynced', () => {
        done();
      });

      // Trigger sync check manually by playing
      stemPlayer.play();
    });
  });

  describe('State Management', () => {
    beforeEach(async () => {
      await stemPlayer.initialize();
      await stemPlayer.loadStems(mockDemucsOutput);
    });

    it('should return complete state', () => {
      const state = stemPlayer.getState();

      expect(state).toHaveProperty('currentTime');
      expect(state).toHaveProperty('duration');
      expect(state).toHaveProperty('isPlaying');
      expect(state).toHaveProperty('stemsLoaded');
      expect(state).toHaveProperty('stems');
      expect(state).toHaveProperty('original');
      expect(state).toHaveProperty('stemMix');
      expect(state).toHaveProperty('syncStatus');
    });

    it('should return individual stem controls', () => {
      const drumsControls = stemPlayer.getStemControls('drums');

      expect(drumsControls).toHaveProperty('volume');
      expect(drumsControls).toHaveProperty('muted');
      expect(drumsControls).toHaveProperty('soloed');
      expect(drumsControls).toHaveProperty('pan');
      expect(drumsControls).toHaveProperty('eq');
      expect(drumsControls).toHaveProperty('playbackRate');
    });

    it('should track current time and duration', () => {
      expect(stemPlayer.getCurrentTime()).toBe(0);
      expect(stemPlayer.getDuration()).toBe(10);

      stemPlayer.seek(5);
      expect(stemPlayer.getCurrentTime()).toBe(5);
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      await stemPlayer.initialize();
    });

    it('should register and trigger event listeners', () => {
      const mockCallback = jest.fn();
      stemPlayer.on('testEvent', mockCallback);

      // Trigger event manually through private method
      (stemPlayer as any).emit('testEvent', { data: 'test' });

      expect(mockCallback).toHaveBeenCalledWith({ data: 'test' });
    });

    it('should remove event listeners', () => {
      const mockCallback = jest.fn();
      stemPlayer.on('testEvent', mockCallback);
      stemPlayer.off('testEvent', mockCallback);

      (stemPlayer as any).emit('testEvent', { data: 'test' });

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should handle errors in event listeners gracefully', () => {
      const mockCallback = jest.fn(() => {
        throw new Error('Test error');
      });

      stemPlayer.on('testEvent', mockCallback);

      // Should not throw
      expect(() => {
        (stemPlayer as any).emit('testEvent');
      }).not.toThrow();
    });
  });

  describe('Audio Connection', () => {
    beforeEach(async () => {
      await stemPlayer.initialize();
    });

    it('should connect to destination', () => {
      const mockDestination = { connect: jest.fn(), disconnect: jest.fn() };
      const mockMasterOut = (Tone.Gain as jest.Mock).mock.results[0].value;

      stemPlayer.connect(mockDestination as any);
      expect(mockMasterOut.connect).toHaveBeenCalledWith(mockDestination);
    });

    it('should disconnect from destination', () => {
      const mockDestination = { connect: jest.fn(), disconnect: jest.fn() };
      const mockMasterOut = (Tone.Gain as jest.Mock).mock.results[0].value;

      stemPlayer.disconnect(mockDestination as any);
      expect(mockMasterOut.disconnect).toHaveBeenCalledWith(mockDestination);
    });

    it('should disconnect all when no destination specified', () => {
      const mockMasterOut = (Tone.Gain as jest.Mock).mock.results[0].value;

      stemPlayer.disconnect();
      expect(mockMasterOut.disconnect).toHaveBeenCalledWith();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await stemPlayer.initialize();
    });

    it('should emit error events when operations fail', () => {
      const mockCallback = jest.fn();
      stemPlayer.on('error', mockCallback);

      // Force an error by trying to play without stems
      stemPlayer.play().catch(() => {
        expect(mockCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.stringContaining('No stems loaded'),
            context: 'play'
          })
        );
      });
    });

    it('should handle malformed DemucsOutput gracefully', async () => {
      const malformedOutput = {
        drums: null,
        bass: null,
        melody: null,
        vocals: null,
        original: null,
        metadata: null
      } as any;

      const results = await stemPlayer.loadStems(malformedOutput);
      expect(results.every(r => !r.success)).toBe(true);
    });
  });

  describe('Resource Management', () => {
    it('should dispose all resources properly', async () => {
      await stemPlayer.initialize();
      await stemPlayer.loadStems(mockDemucsOutput);

      // Mock all disposal methods
      const mockPlayers = (Tone.Player as jest.Mock).mock.results;
      const mockGains = (Tone.Gain as jest.Mock).mock.results;

      stemPlayer.dispose();

      // Verify players are disposed
      mockPlayers.forEach(result => {
        expect(result.value.dispose).toHaveBeenCalled();
      });

      // Verify gains are disposed
      mockGains.forEach(result => {
        expect(result.value.dispose).toHaveBeenCalled();
      });

      expect(stemPlayer.areStemsLoaded()).toBe(false);
    });

    it('should clear event listeners on disposal', () => {
      const mockCallback = jest.fn();
      stemPlayer.on('testEvent', mockCallback);

      stemPlayer.dispose();
      (stemPlayer as any).emit('testEvent');

      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should stop sync monitoring on disposal', () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      stemPlayer.dispose();

      expect(clearIntervalSpy).toHaveBeenCalled();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('Integration Tests', () => {
    beforeEach(async () => {
      await stemPlayer.initialize();
      await stemPlayer.loadStems(mockDemucsOutput);
    });

    it('should handle complete workflow: load, play, control, stop', async () => {
      // Play
      await stemPlayer.play();
      expect(stemPlayer.isPlaying()).toBe(true);

      // Control stems
      stemPlayer.setStemVolume('drums', 0.5);
      stemPlayer.setStemMute('bass', true);
      stemPlayer.setStemSolo('vocals', true);
      stemPlayer.setStemMix(0.8);

      // Verify controls applied
      expect(stemPlayer.getStemControls('drums').volume).toBe(0.5);
      expect(stemPlayer.getStemControls('bass').muted).toBe(true);
      expect(stemPlayer.getStemControls('vocals').soloed).toBe(true);
      expect(stemPlayer.getState().stemMix).toBe(0.8);

      // Stop
      stemPlayer.stop();
      expect(stemPlayer.isPlaying()).toBe(false);
      expect(stemPlayer.getCurrentTime()).toBe(0);
    });

    it('should maintain state consistency across operations', async () => {
      const initialState = stemPlayer.getState();

      // Perform multiple operations
      await stemPlayer.play();
      stemPlayer.seek(5);
      stemPlayer.setStemVolume('drums', 0.3);
      stemPlayer.pause();

      const finalState = stemPlayer.getState();

      // Verify state changes are consistent
      expect(finalState.isPlaying).toBe(false);
      expect(finalState.currentTime).toBe(5);
      expect(finalState.stems.drums.volume).toBe(0.3);
      expect(finalState.stemsLoaded).toBe(true);
      expect(finalState.duration).toBe(initialState.duration);
    });
  });
});