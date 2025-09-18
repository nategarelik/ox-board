import { describe, beforeEach, afterEach, it, expect, jest } from '@jest/globals';
import * as Tone from 'tone';
import { EnhancedAudioMixer, StemMixerConfig } from '../enhancedMixer';
import { DemucsOutput } from '../demucsProcessor';

// Mock Tone.js
jest.mock('tone', () => {
  const mockNode = {
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    toDestination: jest.fn()
  };

  const mockGain = {
    ...mockNode,
    gain: {
      value: 1,
      rampTo: jest.fn()
    }
  };

  const mockEQ3 = {
    ...mockNode,
    low: { value: 0 },
    mid: { value: 0 },
    high: { value: 0 }
  };

  const mockFilter = {
    ...mockNode,
    frequency: {
      value: 1000,
      rampTo: jest.fn()
    },
    Q: { value: 1 },
    type: 'lowpass'
  };

  const mockCrossFade = {
    ...mockNode,
    fade: {
      value: 0.5,
      rampTo: jest.fn()
    },
    a: mockGain,
    b: mockGain
  };

  const mockLimiter = {
    ...mockNode,
    threshold: { value: -1 }
  };

  const mockCompressor = {
    ...mockNode,
    ratio: { value: 4 },
    threshold: { value: -24 },
    attack: { value: 0.003 },
    release: { value: 0.25 }
  };

  const mockMeter = {
    ...mockNode,
    getLevel: jest.fn(() => -20)
  };

  return {
    Gain: jest.fn(() => mockGain),
    EQ3: jest.fn(() => mockEQ3),
    Filter: jest.fn(() => mockFilter),
    CrossFade: jest.fn(() => mockCrossFade),
    Limiter: jest.fn(() => mockLimiter),
    Compressor: jest.fn(() => mockCompressor),
    Meter: jest.fn(() => mockMeter),
    start: jest.fn().mockResolvedValue(undefined)
  };
});

// Mock StemPlayer
jest.mock('../stemPlayer', () => {
  return {
    StemPlayer: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      loadStems: jest.fn().mockResolvedValue([
        { success: true, stemType: 'drums', duration: 10 },
        { success: true, stemType: 'bass', duration: 10 },
        { success: true, stemType: 'melody', duration: 10 },
        { success: true, stemType: 'vocals', duration: 10 },
        { success: true, stemType: 'original', duration: 10 }
      ]),
      connect: jest.fn(),
      disconnect: jest.fn(),
      dispose: jest.fn(),
      play: jest.fn().mockResolvedValue(undefined),
      pause: jest.fn(),
      stop: jest.fn(),
      seek: jest.fn(),
      setStemVolume: jest.fn(),
      setStemMute: jest.fn(),
      setStemSolo: jest.fn(),
      setStemPan: jest.fn(),
      setStemEQ: jest.fn(),
      setStemPlaybackRate: jest.fn(),
      setStemMix: jest.fn(),
      getState: jest.fn(() => ({
        currentTime: 0,
        duration: 10,
        isPlaying: false,
        stemsLoaded: true,
        stems: {
          drums: { volume: 0.75, muted: false, soloed: false, pan: 0, eq: { low: 0, mid: 0, high: 0 }, playbackRate: 1.0 },
          bass: { volume: 0.75, muted: false, soloed: false, pan: 0, eq: { low: 0, mid: 0, high: 0 }, playbackRate: 1.0 },
          melody: { volume: 0.75, muted: false, soloed: false, pan: 0, eq: { low: 0, mid: 0, high: 0 }, playbackRate: 1.0 },
          vocals: { volume: 0.75, muted: false, soloed: false, pan: 0, eq: { low: 0, mid: 0, high: 0 }, playbackRate: 1.0 }
        },
        original: { volume: 0.75, muted: false, soloed: false, pan: 0, eq: { low: 0, mid: 0, high: 0 }, playbackRate: 1.0 },
        stemMix: 0.5,
        syncStatus: 'synced'
      })),
      getStemControls: jest.fn(() => ({
        volume: 0.75,
        muted: false,
        soloed: false,
        pan: 0,
        eq: { low: 0, mid: 0, high: 0 },
        playbackRate: 1.0
      })),
      areStemsLoaded: jest.fn(() => true),
      getSyncStatus: jest.fn(() => 'synced'),
      on: jest.fn(),
      off: jest.fn()
    }))
  };
});

const createMockDemucsOutput = (): DemucsOutput => {
  const audioBuffer = {
    length: 441000,
    duration: 10,
    sampleRate: 44100,
    numberOfChannels: 2,
    getChannelData: jest.fn(() => new Float32Array(441000)),
    copyFromChannel: jest.fn(),
    copyToChannel: jest.fn()
  } as unknown as AudioBuffer;

  return {
    drums: { audioBuffer, duration: 10, sampleRate: 44100, hasAudio: true },
    bass: { audioBuffer, duration: 10, sampleRate: 44100, hasAudio: true },
    melody: { audioBuffer, duration: 10, sampleRate: 44100, hasAudio: true },
    vocals: { audioBuffer, duration: 10, sampleRate: 44100, hasAudio: true },
    original: { audioBuffer, duration: 10, sampleRate: 44100, hasAudio: true },
    metadata: {
      processingTime: 1000,
      model: 'htdemucs',
      inputFile: { name: 'test.mp3', size: 1024000, duration: 10 },
      status: 'completed'
    }
  };
};

describe('EnhancedAudioMixer', () => {
  let mixer: EnhancedAudioMixer;
  let mockDemucsOutput: DemucsOutput;

  beforeEach(() => {
    jest.clearAllMocks();

    const config: StemMixerConfig = {
      stemPlayerConfig: {
        timeStretchEnabled: true,
        crossfadeCurve: 'logarithmic',
        bufferSize: 512,
        maxLatency: 20
      },
      autoStemDetection: true,
      stemMixMode: 'separate'
    };

    mixer = new EnhancedAudioMixer(config);
    mockDemucsOutput = createMockDemucsOutput();
  });

  afterEach(() => {
    if (mixer) {
      mixer.dispose();
    }
  });

  describe('Initialization', () => {
    it('should initialize with default config', () => {
      const defaultMixer = new EnhancedAudioMixer();
      expect(defaultMixer).toBeInstanceOf(EnhancedAudioMixer);
      defaultMixer.dispose();
    });

    it('should initialize with custom config', () => {
      const customConfig: StemMixerConfig = {
        autoStemDetection: false,
        stemMixMode: 'combined'
      };

      const customMixer = new EnhancedAudioMixer(customConfig);
      expect(customMixer).toBeInstanceOf(EnhancedAudioMixer);
      customMixer.dispose();
    });

    it('should initialize Tone.js when initialize() is called', async () => {
      await mixer.initialize();
      expect(Tone.start).toHaveBeenCalled();
    });

    it('should create 4 channels by default', () => {
      for (let i = 0; i < 4; i++) {
        const config = mixer.getChannelConfig(i);
        expect(config).toBeDefined();
        expect(config?.gain).toBe(0.75);
      }
    });
  });

  describe('Stem Player Integration', () => {
    beforeEach(async () => {
      await mixer.initialize();
    });

    it('should enable stem player for a channel', async () => {
      await mixer.enableStemPlayer(0);

      const config = mixer.getChannelConfig(0);
      expect(config?.stemPlayerEnabled).toBe(true);
      expect(mixer.isStemPlayerEnabled(0)).toBe(true);
    });

    it('should disable stem player for a channel', async () => {
      await mixer.enableStemPlayer(1);
      mixer.disableStemPlayer(1);

      const config = mixer.getChannelConfig(1);
      expect(config?.stemPlayerEnabled).toBe(false);
      expect(mixer.isStemPlayerEnabled(1)).toBe(false);
    });

    it('should handle enabling stem player on invalid channel', async () => {
      // Should not throw
      await mixer.enableStemPlayer(-1);
      await mixer.enableStemPlayer(5);
    });

    it('should handle disabling stem player on invalid channel', () => {
      // Should not throw
      mixer.disableStemPlayer(-1);
      mixer.disableStemPlayer(5);
    });

    it('should not enable stem player twice on same channel', async () => {
      await mixer.enableStemPlayer(2);
      await mixer.enableStemPlayer(2); // Second call should be safe

      expect(mixer.isStemPlayerEnabled(2)).toBe(true);
    });
  });

  describe('Stem Loading', () => {
    beforeEach(async () => {
      await mixer.initialize();
    });

    it('should load stems to channel successfully', async () => {
      const results = await mixer.loadStemsToChannel(0, mockDemucsOutput);

      expect(results).toBeDefined();
      expect(mixer.areStemsLoaded(0)).toBe(true);
    });

    it('should auto-enable stem player when loading stems', async () => {
      expect(mixer.isStemPlayerEnabled(1)).toBe(false);

      await mixer.loadStemsToChannel(1, mockDemucsOutput);

      expect(mixer.isStemPlayerEnabled(1)).toBe(true);
    });

    it('should handle loading stems to invalid channel', async () => {
      await expect(mixer.loadStemsToChannel(-1, mockDemucsOutput))
        .rejects.toThrow('Invalid channel: -1');

      await expect(mixer.loadStemsToChannel(5, mockDemucsOutput))
        .rejects.toThrow('Invalid channel: 5');
    });

    it('should handle stem loading failures gracefully', async () => {
      const { StemPlayer } = require('../stemPlayer');
      const mockStemPlayer = StemPlayer.mock.results[0].value;
      mockStemPlayer.loadStems.mockRejectedValue(new Error('Load failed'));

      await expect(mixer.loadStemsToChannel(2, mockDemucsOutput))
        .rejects.toThrow('Load failed');
    });
  });

  describe('Stem Controls', () => {
    beforeEach(async () => {
      await mixer.initialize();
      await mixer.loadStemsToChannel(0, mockDemucsOutput);
    });

    it('should set stem volume', () => {
      mixer.setStemVolume(0, 'drums', 0.5);

      const { StemPlayer } = require('../stemPlayer');
      const mockStemPlayer = StemPlayer.mock.results[0].value;
      expect(mockStemPlayer.setStemVolume).toHaveBeenCalledWith('drums', 0.5);
    });

    it('should set stem mute', () => {
      mixer.setStemMute(0, 'bass', true);

      const { StemPlayer } = require('../stemPlayer');
      const mockStemPlayer = StemPlayer.mock.results[0].value;
      expect(mockStemPlayer.setStemMute).toHaveBeenCalledWith('bass', true);
    });

    it('should set stem solo', () => {
      mixer.setStemSolo(0, 'vocals', true);

      const { StemPlayer } = require('../stemPlayer');
      const mockStemPlayer = StemPlayer.mock.results[0].value;
      expect(mockStemPlayer.setStemSolo).toHaveBeenCalledWith('vocals', true);
    });

    it('should set stem pan', () => {
      mixer.setStemPan(0, 'melody', 0.3);

      const { StemPlayer } = require('../stemPlayer');
      const mockStemPlayer = StemPlayer.mock.results[0].value;
      expect(mockStemPlayer.setStemPan).toHaveBeenCalledWith('melody', 0.3);
    });

    it('should set stem EQ', () => {
      mixer.setStemEQ(0, 'drums', 'low', 5);

      const { StemPlayer } = require('../stemPlayer');
      const mockStemPlayer = StemPlayer.mock.results[0].value;
      expect(mockStemPlayer.setStemEQ).toHaveBeenCalledWith('drums', 'low', 5);
    });

    it('should set stem playback rate', () => {
      mixer.setStemPlaybackRate(0, 'bass', 1.2);

      const { StemPlayer } = require('../stemPlayer');
      const mockStemPlayer = StemPlayer.mock.results[0].value;
      expect(mockStemPlayer.setStemPlaybackRate).toHaveBeenCalledWith('bass', 1.2);
    });

    it('should set stem mix', () => {
      mixer.setStemMix(0, 0.7);

      const { StemPlayer } = require('../stemPlayer');
      const mockStemPlayer = StemPlayer.mock.results[0].value;
      expect(mockStemPlayer.setStemMix).toHaveBeenCalledWith(0.7);
    });

    it('should handle stem controls on channels without stem player', () => {
      // Should not throw
      mixer.setStemVolume(1, 'drums', 0.5);
      mixer.setStemMute(1, 'bass', true);
      mixer.setStemSolo(1, 'vocals', true);
    });
  });

  describe('Stem Player Playback', () => {
    beforeEach(async () => {
      await mixer.initialize();
      await mixer.loadStemsToChannel(0, mockDemucsOutput);
    });

    it('should play stem player', async () => {
      await mixer.playStemPlayer(0);

      const { StemPlayer } = require('../stemPlayer');
      const mockStemPlayer = StemPlayer.mock.results[0].value;
      expect(mockStemPlayer.play).toHaveBeenCalled();
    });

    it('should pause stem player', () => {
      mixer.pauseStemPlayer(0);

      const { StemPlayer } = require('../stemPlayer');
      const mockStemPlayer = StemPlayer.mock.results[0].value;
      expect(mockStemPlayer.pause).toHaveBeenCalled();
    });

    it('should stop stem player', () => {
      mixer.stopStemPlayer(0);

      const { StemPlayer } = require('../stemPlayer');
      const mockStemPlayer = StemPlayer.mock.results[0].value;
      expect(mockStemPlayer.stop).toHaveBeenCalled();
    });

    it('should seek stem player', () => {
      mixer.seekStemPlayer(0, 5);

      const { StemPlayer } = require('../stemPlayer');
      const mockStemPlayer = StemPlayer.mock.results[0].value;
      expect(mockStemPlayer.seek).toHaveBeenCalledWith(5);
    });

    it('should handle playback on channel without stem player', async () => {
      await expect(mixer.playStemPlayer(1))
        .rejects.toThrow('No stem player on channel 1');
    });

    it('should handle pause/stop on channel without stem player', () => {
      // Should not throw
      mixer.pauseStemPlayer(1);
      mixer.stopStemPlayer(1);
      mixer.seekStemPlayer(1, 5);
    });
  });

  describe('Stem Player State', () => {
    beforeEach(async () => {
      await mixer.initialize();
      await mixer.loadStemsToChannel(0, mockDemucsOutput);
    });

    it('should get stem player state', () => {
      const state = mixer.getStemPlayerState(0);

      expect(state).toBeDefined();
      expect(state?.isPlaying).toBe(false);
      expect(state?.duration).toBe(10);
    });

    it('should get stem controls', () => {
      const controls = mixer.getStemControls(0, 'drums');

      expect(controls).toBeDefined();
      expect(controls?.volume).toBe(0.75);
    });

    it('should check if stems are loaded', () => {
      expect(mixer.areStemsLoaded(0)).toBe(true);
      expect(mixer.areStemsLoaded(1)).toBe(false);
    });

    it('should get sync status', () => {
      const syncStatus = mixer.getStemPlayerSyncStatus(0);
      expect(syncStatus).toBe('synced');

      const noStemStatus = mixer.getStemPlayerSyncStatus(1);
      expect(noStemStatus).toBeNull();
    });

    it('should return null for state on channel without stem player', () => {
      const state = mixer.getStemPlayerState(1);
      expect(state).toBeNull();

      const controls = mixer.getStemControls(1, 'drums');
      expect(controls).toBeNull();
    });
  });

  describe('Original Mixer Functionality', () => {
    beforeEach(async () => {
      await mixer.initialize();
    });

    it('should set channel gain', () => {
      mixer.setChannelGain(0, 0.8);

      const config = mixer.getChannelConfig(0);
      expect(config?.gain).toBe(0.8);
    });

    it('should set channel EQ', () => {
      mixer.setChannelEQ(0, 'low', 5);
      mixer.setChannelEQ(0, 'mid', -3);
      mixer.setChannelEQ(0, 'high', 2);

      const config = mixer.getChannelConfig(0);
      expect(config?.eq.low).toBe(5);
      expect(config?.eq.mid).toBe(-3);
      expect(config?.eq.high).toBe(2);
    });

    it('should set channel filter', () => {
      mixer.setChannelFilter(0, 'lpf', 5000, 2);

      const config = mixer.getChannelConfig(0);
      expect(config?.filterType).toBe('lpf');
      expect(config?.filterFreq).toBe(5000);
      expect(config?.filterResonance).toBe(2);
    });

    it('should set crossfader position', () => {
      mixer.setCrossfaderPosition(0.7);

      const config = mixer.getCrossfaderConfig();
      expect(config.position).toBe(0.7);
    });

    it('should set master gain', () => {
      mixer.setMasterGain(0.9);

      const config = mixer.getMasterConfig();
      expect(config.gain).toBe(0.9);
    });

    it('should handle invalid channel numbers', () => {
      // Should not throw
      mixer.setChannelGain(-1, 0.5);
      mixer.setChannelGain(5, 0.5);
      mixer.setChannelEQ(-1, 'low', 5);
      mixer.setChannelEQ(5, 'low', 5);
    });
  });

  describe('Audio Connections', () => {
    beforeEach(async () => {
      await mixer.initialize();
    });

    it('should connect sources to channels', () => {
      const mockSource = { connect: jest.fn(), disconnect: jest.fn() };

      mixer.connectSource(0, mockSource as any);
      expect(mockSource.connect).toHaveBeenCalled();
    });

    it('should disconnect sources from channels', () => {
      const mockSource = { connect: jest.fn(), disconnect: jest.fn() };

      mixer.disconnectSource(0, mockSource as any);
      expect(mockSource.disconnect).toHaveBeenCalled();
    });

    it('should get output nodes', () => {
      const masterOut = mixer.getMasterOutput();
      const cueOut = mixer.getCueOutput();

      expect(masterOut).toBeDefined();
      expect(cueOut).toBeDefined();
    });

    it('should create meters', () => {
      const channelMeter = mixer.getChannelMeter(0);
      const masterMeter = mixer.getMasterMeter();

      expect(channelMeter).toBeDefined();
      expect(masterMeter).toBeDefined();
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      await mixer.initialize();
    });

    it('should get channel configurations', () => {
      for (let i = 0; i < 4; i++) {
        const config = mixer.getChannelConfig(i);
        expect(config).toBeDefined();
        expect(config?.gain).toBeGreaterThanOrEqual(0);
        expect(config?.gain).toBeLessThanOrEqual(1);
      }
    });

    it('should return null for invalid channel config', () => {
      expect(mixer.getChannelConfig(-1)).toBeNull();
      expect(mixer.getChannelConfig(5)).toBeNull();
    });

    it('should get crossfader configuration', () => {
      const config = mixer.getCrossfaderConfig();
      expect(config.position).toBeGreaterThanOrEqual(0);
      expect(config.position).toBeLessThanOrEqual(1);
      expect(['linear', 'smooth', 'sharp']).toContain(config.curve);
    });

    it('should get master configuration', () => {
      const config = mixer.getMasterConfig();
      expect(config.gain).toBeGreaterThanOrEqual(0);
      expect(config.gain).toBeLessThanOrEqual(1);
      expect(typeof config.limiterEnabled).toBe('boolean');
      expect(typeof config.compressorEnabled).toBe('boolean');
    });
  });

  describe('Reset and Cleanup', () => {
    beforeEach(async () => {
      await mixer.initialize();
      await mixer.loadStemsToChannel(0, mockDemucsOutput);
    });

    it('should reset mixer state', () => {
      // Change some settings
      mixer.setChannelGain(0, 0.5);
      mixer.setCrossfaderPosition(0.8);
      mixer.setMasterGain(0.6);

      // Reset
      mixer.reset();

      // Check defaults are restored
      const channelConfig = mixer.getChannelConfig(0);
      const crossfaderConfig = mixer.getCrossfaderConfig();
      const masterConfig = mixer.getMasterConfig();

      expect(channelConfig?.gain).toBe(0.75);
      expect(crossfaderConfig.position).toBe(0.5);
      expect(masterConfig.gain).toBe(0.8);
    });

    it('should dispose all resources', () => {
      mixer.dispose();

      // Verify Tone.js dispose methods were called
      const mockNodes = [
        ...(Tone.Gain as jest.Mock).mock.results,
        ...(Tone.EQ3 as jest.Mock).mock.results,
        ...(Tone.Filter as jest.Mock).mock.results,
        ...(Tone.CrossFade as jest.Mock).mock.results,
        ...(Tone.Limiter as jest.Mock).mock.results,
        ...(Tone.Compressor as jest.Mock).mock.results
      ];

      mockNodes.forEach(result => {
        expect(result.value.dispose).toHaveBeenCalled();
      });
    });

    it('should dispose stem players on reset', () => {
      const { StemPlayer } = require('../stemPlayer');
      const mockStemPlayer = StemPlayer.mock.results[0].value;

      mixer.reset();

      expect(mockStemPlayer.stop).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await mixer.initialize();
    });

    it('should handle stem player initialization errors', async () => {
      const { StemPlayer } = require('../stemPlayer');
      StemPlayer.mockImplementationOnce(() => ({
        initialize: jest.fn().mockRejectedValue(new Error('Init failed'))
      }));

      await expect(mixer.enableStemPlayer(0))
        .rejects.toThrow('Init failed');
    });

    it('should handle stem loading errors', async () => {
      const { StemPlayer } = require('../stemPlayer');
      const mockStemPlayer = {
        initialize: jest.fn().mockResolvedValue(undefined),
        loadStems: jest.fn().mockRejectedValue(new Error('Load failed')),
        connect: jest.fn(),
        on: jest.fn()
      };
      StemPlayer.mockImplementationOnce(() => mockStemPlayer);

      await expect(mixer.loadStemsToChannel(0, mockDemucsOutput))
        .rejects.toThrow('Load failed');
    });

    it('should handle parameter validation', () => {
      // Test gain clamping
      mixer.setChannelGain(0, -0.5);
      expect(mixer.getChannelConfig(0)?.gain).toBe(0);

      mixer.setChannelGain(0, 1.5);
      expect(mixer.getChannelConfig(0)?.gain).toBe(1);

      // Test crossfader clamping
      mixer.setCrossfaderPosition(-0.5);
      expect(mixer.getCrossfaderConfig().position).toBe(0);

      mixer.setCrossfaderPosition(1.5);
      expect(mixer.getCrossfaderConfig().position).toBe(1);
    });
  });

  describe('Integration Tests', () => {
    beforeEach(async () => {
      await mixer.initialize();
    });

    it('should handle complete workflow with stem player', async () => {
      // Load stems
      await mixer.loadStemsToChannel(0, mockDemucsOutput);
      expect(mixer.areStemsLoaded(0)).toBe(true);

      // Play stems
      await mixer.playStemPlayer(0);

      // Control stems
      mixer.setStemVolume(0, 'drums', 0.5);
      mixer.setStemMute(0, 'bass', true);
      mixer.setStemSolo(0, 'vocals', true);
      mixer.setStemMix(0, 0.8);

      // Stop stems
      mixer.stopStemPlayer(0);

      // Verify all operations completed without error
      expect(mixer.getStemPlayerState(0)).toBeDefined();
    });

    it('should handle multiple channels with stems', async () => {
      const channels = [0, 1, 2, 3];

      // Load stems to all channels
      for (const channel of channels) {
        await mixer.loadStemsToChannel(channel, mockDemucsOutput);
        expect(mixer.areStemsLoaded(channel)).toBe(true);
      }

      // Control each channel independently
      channels.forEach(channel => {
        mixer.setStemVolume(channel, 'drums', 0.3 + channel * 0.1);
        mixer.setStemMix(channel, 0.2 + channel * 0.2);
      });

      // Verify independent control
      channels.forEach(channel => {
        const state = mixer.getStemPlayerState(channel);
        expect(state).toBeDefined();
      });
    });

    it('should maintain backward compatibility with original mixer', () => {
      // Original mixer methods should still work
      mixer.setChannelGain(0, 0.8);
      mixer.setChannelEQ(0, 'low', 5);
      mixer.setCrossfaderPosition(0.7);
      mixer.setMasterGain(0.9);

      // Verify state
      const channelConfig = mixer.getChannelConfig(0);
      const crossfaderConfig = mixer.getCrossfaderConfig();
      const masterConfig = mixer.getMasterConfig();

      expect(channelConfig?.gain).toBe(0.8);
      expect(channelConfig?.eq.low).toBe(5);
      expect(crossfaderConfig.position).toBe(0.7);
      expect(masterConfig.gain).toBe(0.9);
    });
  });
});