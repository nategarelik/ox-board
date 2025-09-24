import "@testing-library/jest-dom";

// Import Worker mock
require("../__mocks__/workerMock");

// Mock WebAudio API
global.AudioContext = jest.fn(() => ({
  destination: {},
  sampleRate: 44100,
  currentTime: 0,
  createBuffer: jest.fn(),
  createBufferSource: jest.fn(),
  createGain: jest.fn(),
  createPanner: jest.fn(),
  createAnalyser: jest.fn(),
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
}));

global.webkitAudioContext = global.AudioContext;

// Mock File API
global.File = class {
  constructor(chunks, filename, options = {}) {
    this.name = filename;
    this.size = chunks.reduce((acc, chunk) => acc + chunk.byteLength, 0);
    this.type = options.type || "";
    this.lastModified = Date.now();
    this.chunks = chunks;
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size));
  }

  text() {
    return Promise.resolve("");
  }

  stream() {
    return new ReadableStream();
  }

  slice() {
    return new File([], this.name);
  }
};

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn();

// Mock performance with monotonic time
let performanceNowStart = Date.now();
let lastPerformanceNow = 0;

global.performance = {
  now: jest.fn(() => {
    const currentTime = Date.now() - performanceNowStart;
    // Ensure monotonic time
    if (currentTime > lastPerformanceNow) {
      lastPerformanceNow = currentTime;
    }
    return lastPerformanceNow;
  }),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
  getEntriesByName: jest.fn(() => []),
};

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock console methods for cleaner test output
const originalError = console.error;
console.error = (...args) => {
  if (
    typeof args[0] === "string" &&
    args[0].includes("Warning: ReactDOM.render is deprecated")
  ) {
    return;
  }
  originalError.call(console, ...args);
};

// Suppress specific warnings during tests
const originalWarn = console.warn;
console.warn = (...args) => {
  if (
    typeof args[0] === "string" &&
    (args[0].includes("componentWillReceiveProps") ||
      args[0].includes("componentWillUpdate") ||
      args[0].includes("componentWillMount"))
  ) {
    return;
  }
  originalWarn.call(console, ...args);
};
