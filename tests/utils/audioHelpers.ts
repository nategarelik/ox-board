// Audio test helpers and utilities
import { jest } from "@jest/globals";

// Mock audio context and buffer creation
export const createMockAudioContext = () => {
  return {
    destination: {},
    sampleRate: 44100,
    currentTime: 0,
    state: "running",
    createBuffer: jest.fn(),
    createBufferSource: jest.fn(() => createMockBufferSource()),
    createGain: jest.fn(() => createMockGain()),
    createAnalyser: jest.fn(() => createMockAnalyser()),
    createBiquadFilter: jest.fn(),
    createChannelMerger: jest.fn(),
    createChannelSplitter: jest.fn(),
    createConvolver: jest.fn(),
    createDelay: jest.fn(),
    createDynamicsCompressor: jest.fn(),
    createOscillator: jest.fn(),
    createWaveShaper: jest.fn(),
    decodeAudioData: jest.fn(),
    close: jest.fn(),
    suspend: jest.fn(),
    resume: jest.fn(),
    audioWorklet: {
      addModule: jest.fn(),
    },
  };
};

// Mock audio nodes
export const createMockBufferSource = () => ({
  buffer: null,
  playbackRate: {
    value: 1.0,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  },
  loop: false,
  loopStart: 0,
  loopEnd: 0,
  start: jest.fn(),
  stop: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  onended: null,
});

export const createMockGain = () => ({
  gain: {
    value: 1.0,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
  connect: jest.fn(),
  disconnect: jest.fn(),
});

export const createMockAnalyser = () => ({
  fftSize: 2048,
  frequencyBinCount: 1024,
  minDecibels: -90,
  maxDecibels: -10,
  smoothingTimeConstant: 0.8,
  getFloatFrequencyData: jest.fn(),
  getByteFrequencyData: jest.fn(),
  getFloatTimeDomainData: jest.fn(),
  getByteTimeDomainData: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
});

// Test audio buffer generation
export const createTestAudioBuffer = (
  duration: number = 1.0,
  sampleRate: number = 44100,
  channels: number = 2,
  frequency: number = 440,
): any => {
  const length = Math.floor(duration * sampleRate);
  const buffer = {
    numberOfChannels: channels,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: jest.fn((channel: number) => {
      const channelData = new Float32Array(length);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        // Generate sine wave with envelope
        const envelope = Math.exp(-t * 2);
        channelData[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.1;
      }
      return channelData;
    }),
    copyFromChannel: jest.fn(),
    copyToChannel: jest.fn(),
  };
  return buffer;
};

// Stem data generation utilities
export const createTestStemData = (stemType: string = "vocals") => {
  const duration = 2.0; // 2 seconds
  const sampleRate = 44100;
  const channels = 2;

  // Different frequencies for different stem types
  let frequency = 440; // Default A4
  switch (stemType) {
    case "vocals":
      frequency = 440;
      break;
    case "drums":
      frequency = 100;
      break;
    case "bass":
      frequency = 110;
      break;
    case "other":
      frequency = 220;
      break;
  }

  const buffer = createTestAudioBuffer(
    duration,
    sampleRate,
    channels,
    frequency,
  );

  return {
    buffer,
    metadata: {
      stemType,
      duration,
      sampleRate,
      channels,
      lufs: -12, // Integrated loudness
      peak: 0.9,
      bpm: 120,
      key: "C",
    },
  };
};

// Mock stem processor
export const createMockStemProcessor = () => ({
  loadAudioFile: jest.fn(),
  processAudio: jest.fn(),
  getStemBuffer: jest.fn(),
  getStemMetadata: jest.fn(),
  dispose: jest.fn(),
});

// Mock audio worklet node
export const createMockAudioWorkletNode = () => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  port: {
    postMessage: jest.fn(),
    onmessage: null,
    onmessageerror: null,
    close: jest.fn(),
  },
  parameters: new Map(),
});

// Audio performance measurement utilities
export const measureAudioLatency = async (operation: () => Promise<void>) => {
  const startTime = performance.now();
  await operation();
  return performance.now() - startTime;
};

// Mock audio service
export const createMockAudioService = () => ({
  getInstance: jest.fn(),
  initializeOnUserGesture: jest.fn(),
  createAudioContext: jest.fn(),
  loadStem: jest.fn(),
  playStem: jest.fn(),
  pauseStem: jest.fn(),
  setStemVolume: jest.fn(),
  getStemVolume: jest.fn(),
  applyStemEffect: jest.fn(),
  getAudioMetrics: jest.fn(),
  dispose: jest.fn(),
});

// Test audio scenarios
export const createAudioScenarios = () => {
  return {
    // Basic playback scenario
    basicPlayback: {
      stems: ["vocals", "drums", "bass", "other"],
      duration: 30000, // 30 seconds
      volumes: { vocals: 0.8, drums: 0.7, bass: 0.6, other: 0.5 },
      effects: {
        vocals: { reverb: 0.3, eq: { high: 0.2 } },
        drums: { compression: 0.6 },
      },
    },

    // DJ mixing scenario
    djMixing: {
      crossfade: true,
      bpmSync: true,
      keyMatching: true,
      transitionDuration: 2000,
      stems: ["vocals", "drums", "bass", "other"],
    },

    // Live performance scenario
    livePerformance: {
      realTimeEffects: true,
      gestureControl: true,
      audienceInteraction: false,
      recording: true,
      streams: ["main", "monitor"],
    },
  };
};

// Audio buffer utilities
export const createSilenceBuffer = (
  duration: number = 1.0,
  sampleRate: number = 44100,
): any => {
  const length = Math.floor(duration * sampleRate);
  return {
    numberOfChannels: 1,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: jest.fn(() => new Float32Array(length)),
    copyFromChannel: jest.fn(),
    copyToChannel: jest.fn(),
  };
};

export const createNoiseBuffer = (
  duration: number = 1.0,
  sampleRate: number = 44100,
): any => {
  const length = Math.floor(duration * sampleRate);
  const buffer = {
    numberOfChannels: 1,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: jest.fn(() => {
      const channelData = new Float32Array(length);
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() - 0.5) * 0.1;
      }
      return channelData;
    }),
    copyFromChannel: jest.fn(),
    copyToChannel: jest.fn(),
  };
  return buffer;
};

// Mock file for audio upload testing
export const createMockAudioFile = (
  name: string = "test-audio.wav",
  duration: number = 30,
) => {
  const size = duration * 44100 * 2 * 2; // 2 channels, 2 bytes per sample
  return {
    name,
    size,
    type: "audio/wav",
    lastModified: Date.now(),
    arrayBuffer: jest.fn(),
    text: jest.fn(),
    stream: jest.fn(() => new ReadableStream()),
    slice: jest.fn(),
  };
};

// Performance benchmarking utilities
export const benchmarkAudioOperation = async (
  operation: () => Promise<void>,
  iterations: number = 100,
): Promise<{ averageTime: number; minTime: number; maxTime: number }> => {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    await operation();
    const endTime = performance.now();
    times.push(endTime - startTime);
  }

  return {
    averageTime: times.reduce((a, b) => a + b, 0) / times.length,
    minTime: Math.min(...times),
    maxTime: Math.max(...times),
  };
};

// Mock Web Audio API globals
export const setupAudioMocks = () => {
  (global as any).AudioContext = createMockAudioContext;
  (global as any).AudioBuffer = jest.fn().mockImplementation((options: any) => {
    const { numberOfChannels = 2, length, sampleRate = 44100 } = options;
    return {
      numberOfChannels,
      length,
      sampleRate,
      duration: length / sampleRate,
      getChannelData: jest.fn((channel: number) => new Float32Array(length)),
      copyFromChannel: jest.fn(),
      copyToChannel: jest.fn(),
    };
  });

  (global as any).AudioWorkletNode = jest
    .fn()
    .mockImplementation(() => createMockAudioWorkletNode());
};
