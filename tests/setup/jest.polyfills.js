// Polyfills for Jest environment

// Mock URL.createObjectURL and URL.revokeObjectURL
global.URL = global.URL || {}
global.URL.createObjectURL = global.URL.createObjectURL || jest.fn(() => 'mock-url')
global.URL.revokeObjectURL = global.URL.revokeObjectURL || jest.fn()

// Mock Blob
global.Blob = global.Blob || class {
  constructor(chunks = [], options = {}) {
    this.size = chunks.reduce((acc, chunk) => {
      if (typeof chunk === 'string') return acc + chunk.length
      if (chunk instanceof ArrayBuffer) return acc + chunk.byteLength
      return acc
    }, 0)
    this.type = options.type || ''
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size))
  }

  text() {
    return Promise.resolve('')
  }

  stream() {
    return new ReadableStream()
  }

  slice() {
    return new Blob()
  }
}

// Mock ReadableStream
global.ReadableStream = global.ReadableStream || class {
  constructor() {
    this.locked = false
  }

  getReader() {
    return {
      read: () => Promise.resolve({ done: true, value: undefined }),
      releaseLock: () => {},
      cancel: () => Promise.resolve()
    }
  }

  cancel() {
    return Promise.resolve()
  }
}

// Mock MediaDevices
global.navigator = global.navigator || {}
global.navigator.mediaDevices = global.navigator.mediaDevices || {
  getUserMedia: jest.fn(() => Promise.resolve({
    getTracks: () => [],
    getVideoTracks: () => [],
    getAudioTracks: () => [],
    addTrack: jest.fn(),
    removeTrack: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn()
  })),
  enumerateDevices: jest.fn(() => Promise.resolve([])),
  getDisplayMedia: jest.fn(() => Promise.resolve({
    getTracks: () => [],
    getVideoTracks: () => [],
    getAudioTracks: () => []
  }))
}

// Mock MediaRecorder
global.MediaRecorder = global.MediaRecorder || class {
  constructor() {
    this.state = 'inactive'
    this.ondataavailable = null
    this.onstop = null
    this.onerror = null
    this.onstart = null
  }

  start() {
    this.state = 'recording'
    if (this.onstart) this.onstart()
  }

  stop() {
    this.state = 'inactive'
    if (this.onstop) this.onstop()
  }

  pause() {
    this.state = 'paused'
  }

  resume() {
    this.state = 'recording'
  }

  requestData() {
    if (this.ondataavailable) {
      this.ondataavailable({ data: new Blob() })
    }
  }

  static isTypeSupported() {
    return true
  }
}

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0
}
global.sessionStorage = sessionStorageMock

// Mock Worker
global.Worker = class {
  constructor(url) {
    this.url = url
    this.onmessage = null
    this.onerror = null
  }

  postMessage(data) {
    // Simulate async response
    setTimeout(() => {
      if (this.onmessage) {
        this.onmessage({ data: { type: 'response', data } })
      }
    }, 0)
  }

  terminate() {
    // No-op for testing
  }
}

// Mock TextEncoder/TextDecoder
global.TextEncoder = global.TextEncoder || class {
  encode(string) {
    return new Uint8Array([...string].map(char => char.charCodeAt(0)))
  }
}

global.TextDecoder = global.TextDecoder || class {
  decode(bytes) {
    return String.fromCharCode(...bytes)
  }
}