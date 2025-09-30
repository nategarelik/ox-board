// Audio-specific test setup
import { jest } from "@jest/globals";

// Mock AudioWorkletNode
(global as any).AudioWorkletNode = jest.fn().mockImplementation(() => ({
  connect: jest.fn(),
  disconnect: jest.fn(),
  port: {
    postMessage: jest.fn(),
    onmessage: null,
    onmessageerror: null,
    close: jest.fn(),
  },
  parameters: new Map(),
}));

// Mock AudioWorkletProcessor (for worklet tests)
(global as any).AudioWorkletProcessor = class {
  port: any;

  constructor() {
    this.port = {
      postMessage: jest.fn(),
      onmessage: null,
      onmessageerror: null,
      close: jest.fn(),
    };
  }

  process(inputs: Float32Array[][], outputs: Float32Array[][]) {
    // Default implementation - copy input to output
    for (let i = 0; i < inputs.length && i < outputs.length; i++) {
      for (
        let channel = 0;
        channel < inputs[i].length && channel < outputs[i].length;
        channel++
      ) {
        outputs[i][channel].set(inputs[i][channel]);
      }
    }
    return true;
  }
};

// Mock AudioBuffer
(global as any).AudioBuffer = jest.fn().mockImplementation((options: any) => {
  const { numberOfChannels = 2, length, sampleRate = 44100 } = options;
  const buffer = {
    numberOfChannels,
    length,
    sampleRate,
    duration: length / sampleRate,
    getChannelData: jest.fn((channel: number) => new Float32Array(length)),
    copyFromChannel: jest.fn(),
    copyToChannel: jest.fn(),
  };
  return buffer;
});

// Mock AudioBufferSourceNode
const createMockBufferSource = () => ({
  buffer: null,
  playbackRate: { value: 1.0 },
  loop: false,
  loopStart: 0,
  loopEnd: 0,
  start: jest.fn(),
  stop: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  onended: null,
});

// Mock GainNode
const createMockGain = () => ({
  gain: {
    value: 1.0,
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
  },
  connect: jest.fn(),
  disconnect: jest.fn(),
});

// Mock AnalyserNode
const createMockAnalyser = () => ({
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

// Update AudioContext mock to include new methods
(global as any).AudioContext = jest.fn().mockImplementation(() => ({
  destination: {},
  sampleRate: 44100,
  currentTime: 0,
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
}));

// Audio test utilities
(global as any).createTestAudioBuffer = (
  duration: number = 1.0,
  sampleRate: number = 44100,
  channels: number = 2,
) => {
  const length = Math.floor(duration * sampleRate);
  const buffer = new AudioBuffer({
    length,
    sampleRate,
    numberOfChannels: channels,
  });

  // Fill with test audio data (sine wave)
  for (let channel = 0; channel < channels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.1;
    }
  }

  return buffer;
};

// Stem data generation utilities
(global as any).createTestStemData = (stemType: string = "vocals") => {
  const duration = 2.0; // 2 seconds
  const sampleRate = 44100;
  const channels = 2;

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

  const buffer = (global as any).createTestAudioBuffer(
    duration,
    sampleRate,
    channels,
  );

  // Modify the buffer for different stem types
  for (let channel = 0; channel < channels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < channelData.length; i++) {
      const time = i / sampleRate;
      const envelope = Math.exp(-time * 0.5); // Simple decay envelope
      channelData[i] =
        Math.sin((2 * Math.PI * frequency * i) / sampleRate) * envelope * 0.1;
    }
  }

  return {
    buffer,
    metadata: {
      stemType,
      duration,
      sampleRate,
      channels,
      lufs: -12, // Integrated loudness
      peak: 0.9,
    },
  };
};

// Performance measurement utilities
(global as any).measureAudioLatency = async (
  operation: () => Promise<void>,
) => {
  const startTime = performance.now();
  await operation();
  return performance.now() - startTime;
};

(global as any).createAudioContextWithMocks = () => {
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
