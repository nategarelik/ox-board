# OX-Board AI Technical Architecture

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Interface                        │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Camera    │  │ Stem Visuals │  │  Mix Assistant   │   │
│  │   (70%)     │  │  (4 lanes)   │  │   (Suggestions)  │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                     Gesture Control Layer                    │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  MediaPipe  │→ │   Gesture    │→ │  Stem Control    │   │
│  │    Hands    │  │  Classifier  │  │    Mapping       │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                    Audio Processing Core                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  4-Stem     │  │  Effects     │  │     Audio        │   │
│  │  Players    │→ │  Processing  │→ │    Output        │   │
│  │  (Tone.js)  │  │  (Per Stem)  │  │   (Master)       │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                      AI Processing Layer                     │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │   Demucs    │  │ Essentia.js  │  │  Mix Assistant   │   │
│  │    WASM     │  │  (BPM/Key)   │  │   (TF.js)        │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                       Storage Layer                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  IndexedDB  │  │   Memory     │  │    Cloud         │   │
│  │   (Stems)   │  │   Cache      │  │   (Backup)       │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Audio Input & Processing Pipeline

```javascript
class AudioPipeline {
  constructor() {
    this.inputBuffer = new AudioBuffer();
    this.analyzer = new Essentia();
    this.separator = new DemucsProcessor();
    this.cache = new StemCache();
  }

  async processTrack(audioFile) {
    // 1. Load and decode audio
    const audioBuffer = await this.decodeAudio(audioFile);

    // 2. Analyze in parallel
    const [bpm, key, structure] = await Promise.all([
      this.analyzer.detectBPM(audioBuffer),
      this.analyzer.detectKey(audioBuffer),
      this.analyzer.analyzeStructure(audioBuffer)
    ]);

    // 3. Check cache for stems
    const trackId = await this.generateTrackId(audioBuffer);
    let stems = await this.cache.get(trackId);

    // 4. Process if not cached
    if (!stems) {
      stems = await this.separator.separate(audioBuffer);
      await this.cache.store(trackId, stems);
    }

    return { stems, bpm, key, structure };
  }
}
```

### 2. Stem Separation Architecture

```javascript
class DemucsProcessor {
  constructor() {
    this.workers = this.initializeWorkers(8); // 8 parallel workers
    this.model = null;
  }

  async initialize() {
    // Load WASM module and model weights
    this.model = await loadDemucsWASM({
      modelPath: '/models/htdemucs.bin',
      weightsPath: '/models/htdemucs_weights.bin',
      simd: true // Enable SIMD if available
    });
  }

  async separate(audioBuffer) {
    // Segment audio into 10-second chunks
    const segments = this.segmentAudio(audioBuffer, 10);

    // Process segments in parallel
    const processedSegments = await Promise.all(
      segments.map((segment, i) =>
        this.workers[i % 8].process(segment)
      )
    );

    // Merge segments with overlap-add
    return this.mergeSegments(processedSegments);
  }

  segmentAudio(buffer, segmentLength) {
    const sampleRate = buffer.sampleRate;
    const segmentSamples = segmentLength * sampleRate;
    const overlap = 0.75 * sampleRate; // 0.75s overlap

    const segments = [];
    for (let i = 0; i < buffer.length; i += segmentSamples - overlap) {
      segments.push(buffer.slice(i, i + segmentSamples));
    }
    return segments;
  }
}
```

### 3. Stem Player Architecture

```javascript
class StemPlayer {
  constructor(deckId) {
    this.deckId = deckId;
    this.stems = {
      drums: new Tone.Player().toDestination(),
      bass: new Tone.Player().toDestination(),
      melody: new Tone.Player().toDestination(),
      vocals: new Tone.Player().toDestination()
    };
    this.effects = this.initializeEffects();
    this.sync = new Tone.Transport();
  }

  async loadStems(stemBuffers) {
    await Promise.all([
      this.stems.drums.load(stemBuffers.drums),
      this.stems.bass.load(stemBuffers.bass),
      this.stems.melody.load(stemBuffers.melody),
      this.stems.vocals.load(stemBuffers.vocals)
    ]);

    // Sync all stems to same transport
    Object.values(this.stems).forEach(stem => {
      stem.sync().start(0);
    });
  }

  toggleStem(stemName, enabled) {
    if (this.stems[stemName]) {
      this.stems[stemName].mute = !enabled;
    }
  }

  adjustStemVolume(stemName, volume) {
    if (this.stems[stemName]) {
      this.stems[stemName].volume.value = volume;
    }
  }

  applyEffect(stemName, effectType, params) {
    const stem = this.stems[stemName];
    const effect = this.effects[effectType];

    if (stem && effect) {
      stem.disconnect();
      stem.chain(effect, Tone.Destination);
      Object.assign(effect, params);
    }
  }
}
```

### 4. Gesture Control System

```javascript
class GestureController {
  constructor() {
    this.mediaPipe = new MediaPipeHands();
    this.classifier = new GestureClassifier();
    this.stemController = null;
    this.gestureHistory = [];
  }

  async processFrame(videoFrame) {
    // 1. Detect hand landmarks
    const hands = await this.mediaPipe.detectHands(videoFrame);

    if (hands.length === 0) return;

    // 2. Classify gesture
    const gesture = this.classifier.classify(hands[0].landmarks);

    // 3. Add to history for smoothing
    this.gestureHistory.push(gesture);
    if (this.gestureHistory.length > 5) {
      this.gestureHistory.shift();
    }

    // 4. Get stable gesture (majority vote)
    const stableGesture = this.getStableGesture();

    // 5. Map to stem control
    if (stableGesture && this.stemController) {
      this.handleGesture(stableGesture, hands[0]);
    }
  }

  handleGesture(gesture, hand) {
    switch(gesture.type) {
      case 'PEACE_SIGN':
        this.stemController.toggleDrums();
        break;
      case 'ROCK_HORNS':
        this.stemController.toggleBass();
        break;
      case 'OK_SIGN':
        this.stemController.toggleMelody();
        break;
      case 'SHAKA':
        this.stemController.toggleVocals();
        break;
      case 'PINCH':
        const distance = this.calculatePinchDistance(hand);
        this.stemController.adjustVolume(distance);
        break;
      case 'MIDDLE_FINGER':
        this.stemController.startLoop(hand.position);
        break;
    }
  }
}
```

### 5. Mix Assistant Architecture

```javascript
class MixAssistant {
  constructor() {
    this.analyzer = new AudioAnalyzer();
    this.harmonicWheel = new HarmonicWheel();
    this.trackLibrary = new TrackLibrary();
  }

  async suggestNextTrack(currentTrack) {
    const { key, bpm, energy } = currentTrack.metadata;

    // Find harmonically compatible tracks
    const compatibleKeys = this.harmonicWheel.getCompatible(key);

    // Filter library by compatible keys and similar BPM
    const candidates = await this.trackLibrary.filter({
      keys: compatibleKeys,
      bpmRange: [bpm - 5, bpm + 5],
      energyRange: [energy - 0.2, energy + 0.2]
    });

    // Score and rank candidates
    const scored = candidates.map(track => ({
      track,
      score: this.scoreCompatibility(currentTrack, track)
    }));

    return scored.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  async autoSync(deckA, deckB) {
    const phaseA = await this.analyzer.getPhase(deckA);
    const phaseB = await this.analyzer.getPhase(deckB);

    // Calculate phase offset
    const offset = phaseA - phaseB;

    // Adjust deck B tempo and phase
    deckB.adjustTempo(deckA.bpm / deckB.bpm);
    deckB.adjustPhase(offset);

    return { locked: true, offset };
  }

  detectOptimalMixPoint(trackA, trackB) {
    // Analyze structure of both tracks
    const structureA = trackA.metadata.structure;
    const structureB = trackB.metadata.structure;

    // Find phrase boundaries
    const exitPoint = this.findExitPoint(structureA);
    const entryPoint = this.findEntryPoint(structureB);

    return { exitPoint, entryPoint, duration: 32 }; // 32 beats
  }
}
```

### 6. Storage & Caching Strategy

```javascript
class StemCache {
  constructor() {
    this.db = null;
    this.memoryCache = new Map();
    this.maxMemorySize = 500 * 1024 * 1024; // 500MB
  }

  async initialize() {
    this.db = await openDB('OxBoardStems', 1, {
      upgrade(db) {
        db.createObjectStore('stems', { keyPath: 'trackId' });
        db.createObjectStore('metadata', { keyPath: 'trackId' });
      }
    });
  }

  async store(trackId, stems) {
    // Store in memory if space available
    if (this.getMemoryUsage() + stems.size < this.maxMemorySize) {
      this.memoryCache.set(trackId, stems);
    }

    // Always store in IndexedDB
    await this.db.put('stems', {
      trackId,
      drums: await this.encodeBuffer(stems.drums),
      bass: await this.encodeBuffer(stems.bass),
      melody: await this.encodeBuffer(stems.melody),
      vocals: await this.encodeBuffer(stems.vocals),
      timestamp: Date.now()
    });
  }

  async get(trackId) {
    // Check memory cache first
    if (this.memoryCache.has(trackId)) {
      return this.memoryCache.get(trackId);
    }

    // Check IndexedDB
    const stored = await this.db.get('stems', trackId);
    if (stored) {
      const stems = {
        drums: await this.decodeBuffer(stored.drums),
        bass: await this.decodeBuffer(stored.bass),
        melody: await this.decodeBuffer(stored.melody),
        vocals: await this.decodeBuffer(stored.vocals)
      };

      // Add to memory cache
      this.memoryCache.set(trackId, stems);
      return stems;
    }

    return null;
  }
}
```

## Performance Optimizations

### 1. WebAssembly Optimizations
```javascript
// Enable SIMD for 2-4x speedup
const simdSupported = WebAssembly.validate(new Uint8Array([
  0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
  0x01, 0x05, 0x01, 0x60, 0x00, 0x00, 0x03, 0x02,
  0x01, 0x00, 0x0a, 0x0a, 0x01, 0x08, 0x00, 0xfd,
  0x0c, 0x00, 0x00, 0x00, 0x00, 0x0b
]));

// Use SharedArrayBuffer for zero-copy between workers
const sharedBuffer = new SharedArrayBuffer(1024 * 1024 * 100); // 100MB

// Compile with optimization flags
const module = await WebAssembly.instantiateStreaming(
  fetch('/wasm/demucs.wasm'),
  {
    env: {
      memory: new WebAssembly.Memory({
        initial: 256,
        maximum: 4096,
        shared: true
      })
    }
  }
);
```

### 2. Progressive Loading Strategy
```javascript
class ProgressiveLoader {
  async loadTrack(file) {
    // 1. Load first 30 seconds for preview
    const preview = await this.loadPartial(file, 0, 30);

    // 2. Start 2-stem separation immediately
    const quickStems = await this.quickSeparate(preview);

    // 3. Load full track in background
    const fullTrack = this.loadFull(file);

    // 4. Process full 4-stem in background
    const fullStems = this.fullSeparate(fullTrack);

    return {
      preview: quickStems,
      full: fullStems // Promise
    };
  }
}
```

### 3. Memory Management
```javascript
class MemoryManager {
  constructor() {
    this.buffers = [];
    this.maxBuffers = 10;
  }

  allocate(size) {
    // Reuse existing buffer if available
    const existing = this.buffers.find(b => b.size >= size && !b.inUse);
    if (existing) {
      existing.inUse = true;
      return existing.buffer;
    }

    // Create new buffer
    const buffer = new ArrayBuffer(size);
    this.buffers.push({ buffer, size, inUse: true });

    // Clean up old buffers
    if (this.buffers.length > this.maxBuffers) {
      this.cleanup();
    }

    return buffer;
  }

  release(buffer) {
    const entry = this.buffers.find(b => b.buffer === buffer);
    if (entry) {
      entry.inUse = false;
    }
  }

  cleanup() {
    // Remove unused buffers
    this.buffers = this.buffers.filter(b => b.inUse);
  }
}
```

## Deployment Architecture

### Browser Requirements
- Chrome 90+ (WebAssembly SIMD)
- Firefox 89+ (SharedArrayBuffer)
- Safari 15+ (WebAssembly)
- Edge 90+ (Chromium based)

### Performance Targets
- Initial load: < 3 seconds
- 2-stem preview: < 5 seconds
- Full 4-stem: < 5 minutes (background)
- Gesture latency: < 10ms
- Audio latency: < 20ms

### Scaling Strategy
1. **Client-side first**: Process on device when possible
2. **Cloud fallback**: Use cloud API for unsupported devices
3. **CDN distribution**: Models and WASM from edge locations
4. **Progressive enhancement**: Basic features work everywhere

---

*Architecture designed for real-time performance and professional-grade audio quality*