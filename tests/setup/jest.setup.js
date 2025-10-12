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

// Mock IndexedDB
const createIndexedDBMock = () => {
  const stores = new Map();

  const createObjectStore = jest.fn((name, options = {}) => {
    const store = {
      name,
      data: new Map(),
      add: jest.fn((value, key) => {
        const actualKey = key || Date.now().toString();
        store.data.set(actualKey, value);
        return Promise.resolve(actualKey);
      }),
      get: jest.fn((key) => {
        return Promise.resolve(store.data.get(key));
      }),
      put: jest.fn((value, key) => {
        const actualKey = key || Date.now().toString();
        store.data.set(actualKey, value);
        return Promise.resolve(actualKey);
      }),
      delete: jest.fn((key) => {
        store.data.delete(key);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        store.data.clear();
        return Promise.resolve();
      }),
      getAll: jest.fn(() => {
        return Promise.resolve(Array.from(store.data.values()));
      }),
      openCursor: jest.fn(() => {
        return Promise.resolve({
          continue: jest.fn(),
          delete: jest.fn(),
          update: jest.fn(),
        });
      }),
      createIndex: jest.fn(),
      index: jest.fn(() => ({
        get: jest.fn(() => Promise.resolve()),
        getAll: jest.fn(() => Promise.resolve([])),
        openCursor: jest.fn(() => Promise.resolve()),
      })),
      transaction: jest.fn(() => ({
        objectStore: jest.fn(() => store),
        abort: jest.fn(),
        complete: Promise.resolve(),
      })),
    };
    stores.set(name, store);
    return store;
  });

  const db = {
    name: "testdb",
    version: 1,
    objectStoreNames: {
      contains: jest.fn((name) => stores.has(name)),
    },
    createObjectStore,
    transaction: jest.fn((storeNames, mode) => ({
      objectStore: jest.fn(
        (name) => stores.get(name) || createObjectStore(name),
      ),
      abort: jest.fn(),
      complete: Promise.resolve(),
    })),
    close: jest.fn(),
    deleteObjectStore: jest.fn((name) => {
      stores.delete(name);
    }),
  };

  const request = {
    result: db,
    error: null,
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
  };

  return {
    open: jest.fn((name, version) => {
      setTimeout(() => {
        if (request.onupgradeneeded) {
          request.onupgradeneeded({ target: request });
        }
        if (request.onsuccess) {
          request.onsuccess({ target: request });
        }
      }, 0);
      return request;
    }),
    deleteDatabase: jest.fn(() => {
      const deleteRequest = {
        onsuccess: null,
        onerror: null,
      };
      setTimeout(() => {
        if (deleteRequest.onsuccess) {
          deleteRequest.onsuccess({ target: deleteRequest });
        }
      }, 0);
      return deleteRequest;
    }),
  };
};

global.indexedDB = createIndexedDBMock();

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
