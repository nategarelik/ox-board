// Mock Web Worker for testing
class WorkerMock {
  constructor(stringUrl) {
    this.url = stringUrl;
    this.onmessage = null;
    this.onerror = null;

    // Simulate worker being ready
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: { type: "ready" } });
      }
    }, 0);
  }

  postMessage(data) {
    // Simulate async response
    setTimeout(() => {
      if (!this.onmessage) return;

      // Handle different message types
      if (data.type === "analyze") {
        this.onmessage({
          data: {
            id: data.id,
            type: "result",
            result: {
              bpm: 120,
              key: "C",
              scale: "major",
              energy: 0.7,
              spectralCentroid: 2000,
              camelotKey: "8B",
              danceability: 0.8,
              valence: 0.7,
              beats: [0, 0.5, 1, 1.5],
              segments: [],
            },
          },
        });
      } else if (data.type === "init") {
        this.onmessage({ data: { type: "initialized" } });
      }
    }, 10);
  }

  terminate() {
    this.onmessage = null;
    this.onerror = null;
  }

  addEventListener(event, handler) {
    if (event === "message") {
      this.onmessage = handler;
    } else if (event === "error") {
      this.onerror = handler;
    }
  }

  removeEventListener(event, handler) {
    if (event === "message" && this.onmessage === handler) {
      this.onmessage = null;
    } else if (event === "error" && this.onerror === handler) {
      this.onerror = null;
    }
  }
}

// Mock URL.createObjectURL
if (typeof URL === "undefined") {
  global.URL = {
    createObjectURL: jest.fn(() => "blob:mock-url"),
    revokeObjectURL: jest.fn(),
  };
} else {
  URL.createObjectURL = jest.fn(() => "blob:mock-url");
  URL.revokeObjectURL = jest.fn();
}

// Mock Blob
if (typeof Blob === "undefined") {
  global.Blob = jest.fn((content, options) => ({
    size: content[0].length,
    type: options?.type || "",
  }));
}

// Only set global Worker if it doesn't already exist
if (typeof global.Worker === "undefined") {
  global.Worker = WorkerMock;
}

module.exports = WorkerMock;
