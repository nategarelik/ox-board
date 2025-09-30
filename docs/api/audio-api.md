# Audio Processing API

## Overview

The OX Board Audio Processing API provides comprehensive multi-stem audio processing capabilities with ultra-low latency Web Audio integration. The system supports real-time stem separation, advanced effects processing, audio analysis, and professional mixing features.

## Core Components

### AudioService

Singleton service managing the entire Web Audio context and audio processing pipeline.

```typescript
class AudioService {
  static getInstance(): AudioService;
  initializeOnUserGesture(): Promise<void>;

  // Stem management
  loadStems(stems: StemBuffers): Promise<void>;
  setStemVolume(stemId: StemId, volume: number): void;
  setStemMute(stemId: StemId, muted: boolean): void;
  setStemSolo(stemId: StemId, solo: boolean): void;

  // Effects processing
  setEffectParam(effect: EffectType, param: string, value: number): void;
  enableEffect(effect: EffectType): void;
  disableEffect(effect: EffectType): void;

  // Playback control
  play(): void;
  pause(): void;
  setPosition(time: number): void;
  setPlaybackRate(rate: number): void;

  // Analysis
  getAudioAnalysis(): Promise<AudioAnalysisResults>;
  getRealtimeAnalysis(): RealtimeAnalysisData;
}
```

### EnhancedStemProcessor

High-performance stem processing with Web Audio optimization.

```typescript
class EnhancedStemProcessor {
  constructor(audioContext: AudioContext);

  processAudioFile(file: File): Promise<StemBuffers>;
  createStemNodes(stems: StemBuffers): StemNodes;
  applyStemEffects(stemId: StemId, effects: EffectChain): void;
  optimizeForLatency(targetLatency: number): void;
}
```

## Stem Management

### Stem Types

```typescript
type StemId = "drums" | "bass" | "melody" | "vocals" | "original";

interface StemBuffers {
  drums?: AudioBuffer;
  bass?: AudioBuffer;
  melody?: AudioBuffer;
  vocals?: AudioBuffer;
  original?: AudioBuffer;
}

interface StemNodes {
  drums: AudioProcessingNode;
  bass: AudioProcessingNode;
  melody: AudioProcessingNode;
  vocals: AudioProcessingNode;
  original: AudioProcessingNode;
  master: GainNode;
}
```

### Volume Control

```typescript
interface StemVolumeState {
  drums: number; // 0-1
  bass: number; // 0-1
  melody: number; // 0-1
  vocals: number; // 0-1
  original: number; // 0-1
}

// Set individual stem volume
AudioService.getInstance().setStemVolume("vocals", 0.8);

// Set multiple volumes
const volumes: Partial<StemVolumeState> = {
  drums: 0.9,
  bass: 0.7,
  vocals: 0.6,
};
Object.entries(volumes).forEach(([stem, volume]) => {
  AudioService.getInstance().setStemVolume(stem as StemId, volume);
});
```

### Mute/Solo System

```typescript
interface StemMuteState {
  drums: boolean;
  bass: boolean;
  melody: boolean;
  vocals: boolean;
  original: boolean;
}

interface StemSoloState {
  drums: boolean;
  bass: boolean;
  melody: boolean;
  vocals: boolean;
  original: boolean;
}

// Mute stems
AudioService.getInstance().setStemMute("drums", true);
AudioService.getInstance().setStemMute("bass", true);

// Solo stems (mutes all others)
AudioService.getInstance().setStemSolo("vocals", true);
```

## Effects Processing

### Available Effects

#### Reverb

Spatial reverb effect with room simulation.

```typescript
interface ReverbEffect {
  enabled: boolean;
  roomSize: number; // 0-1 (small to large room)
  dampening: number; // 0-1 (low to high frequency dampening)
  wet: number; // 0-1 (dry to wet signal ratio)
}

// Apply reverb to specific stem
AudioService.getInstance().setEffectParam("reverb", "roomSize", 0.8);
AudioService.getInstance().setEffectParam("reverb", "wet", 0.3);
AudioService.getInstance().enableEffect("reverb");
```

#### Delay

Tempo-synced delay effect.

```typescript
interface DelayEffect {
  enabled: boolean;
  delayTime: number; // Delay time in seconds (0.1-2.0)
  feedback: number; // 0-0.9 (feedback amount)
  wet: number; // 0-1 (dry to wet ratio)
}

// Sync delay to BPM
const bpm = 120;
const delayTime = 60 / bpm; // 1/8 note delay
AudioService.getInstance().setEffectParam("delay", "delayTime", delayTime);
AudioService.getInstance().setEffectParam("delay", "feedback", 0.4);
AudioService.getInstance().enableEffect("delay");
```

#### Filter

Multi-mode filter with frequency and resonance control.

```typescript
interface FilterEffect {
  enabled: boolean;
  frequency: number; // 20-20000 Hz
  resonance: number; // 0-20 dB
  type: "lowpass" | "highpass" | "bandpass" | "notch";
}

// Low-pass filter sweep
AudioService.getInstance().setEffectParam("filter", "type", "lowpass");
AudioService.getInstance().setEffectParam("filter", "frequency", 1000);
AudioService.getInstance().setEffectParam("filter", "resonance", 5);
AudioService.getInstance().enableEffect("filter");
```

#### Distortion

Overdrive and distortion effects.

```typescript
interface DistortionEffect {
  enabled: boolean;
  amount: number; // 0-1 (clean to heavily distorted)
  tone: number; // 0-1 (low to high frequency emphasis)
}

// Add distortion to drums
AudioService.getInstance().setEffectParam("distortion", "amount", 0.3);
AudioService.getInstance().setEffectParam("distortion", "tone", 0.7);
AudioService.getInstance().enableEffect("distortion");
```

#### Compressor

Dynamic range compression.

```typescript
interface CompressorEffect {
  enabled: boolean;
  threshold: number; // -60 to 0 dB
  ratio: number; // 1:1 to 20:1
  attack: number; // 0-1000 ms
  release: number; // 0-1000 ms
}

// Compress vocals
AudioService.getInstance().setEffectParam("compressor", "threshold", -20);
AudioService.getInstance().setEffectParam("compressor", "ratio", 4);
AudioService.getInstance().setEffectParam("compressor", "attack", 5);
AudioService.getInstance().setEffectParam("compressor", "release", 50);
AudioService.getInstance().enableEffect("compressor");
```

### Effect Chains

Apply multiple effects to a single stem:

```typescript
// Create effect chain for vocals
const vocalEffects = [
  { type: "compressor", params: { threshold: -20, ratio: 4 } },
  { type: "reverb", params: { roomSize: 0.6, wet: 0.2 } },
  { type: "eq", params: { high: 2, highFreq: 8000 } },
];

vocalEffects.forEach((effect) => {
  Object.entries(effect.params).forEach(([param, value]) => {
    AudioService.getInstance().setEffectParam(effect.type, param, value);
  });
  AudioService.getInstance().enableEffect(effect.type);
});
```

## Audio Analysis

### Real-time Analysis

```typescript
interface AudioAnalysisResults {
  bpm: number; // Beats per minute
  key: string; // Musical key (e.g., 'C major')
  energy: number; // 0-1 energy level
  danceability: number; // 0-1 danceability score
  loudness: number; // -60 to 0 dB
  spectralCentroid: number; // Spectral centroid (Hz)
  spectralRolloff: number; // Spectral rolloff (Hz)
  zeroCrossingRate: number; // Zero crossing rate
  mfcc: number[]; // Mel-frequency cepstral coefficients
  chroma: number[]; // Chroma features
  beats: number[]; // Beat timestamps
  segments: Array<{
    start: number; // Segment start time
    duration: number; // Segment duration
    confidence: number; // Confidence score
  }>;
}

// Get current analysis
const analysis = await AudioService.getInstance().getAudioAnalysis();
console.log(`BPM: ${analysis.bpm}, Key: ${analysis.key}`);
```

### Realtime Analysis Data

```typescript
interface RealtimeAnalysisData {
  rms: number; // Root mean square energy
  spectralCentroid: number;
  spectralRolloff: number;
  zeroCrossingRate: number;
  timeDomainData: Float32Array;
  frequencyDomainData: Float32Array;
}

// Monitor real-time audio features
function monitorAudio() {
  const analysis = AudioService.getInstance().getRealtimeAnalysis();

  // Visualize RMS energy
  const energyBar = document.getElementById("energy");
  energyBar.style.width = `${analysis.rms * 100}%`;

  // Update spectral display
  updateSpectralDisplay(analysis.frequencyDomainData);

  requestAnimationFrame(monitorAudio);
}
```

## Playback Control

### Basic Playback

```typescript
const audioService = AudioService.getInstance();

// Initialize Web Audio context (requires user gesture)
await audioService.initializeOnUserGesture();

// Load audio stems
const stems = await loadStemFiles();
await audioService.loadStems(stems);

// Playback control
audioService.play();
audioService.pause();

// Set playback position
audioService.setPosition(30.5); // Jump to 30.5 seconds

// Change playback rate
audioService.setPlaybackRate(1.1); // 10% faster
```

### Advanced Playback

```typescript
interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  position: number; // 0-1 (normalized)
  playbackRate: number; // 0.5-2.0
  loop: boolean;
  loopStart?: number; // Loop start time (seconds)
  loopEnd?: number; // Loop end time (seconds)
}

// Loop section
audioService.setLoop(true);
audioService.setLoopStart(60); // Loop from 60 seconds
audioService.setLoopEnd(120); // Loop to 120 seconds

// Variable playback rate
let playbackRate = 1.0;
function adjustTempo(factor: number) {
  playbackRate *= factor;
  playbackRate = Math.max(0.5, Math.min(2.0, playbackRate));
  audioService.setPlaybackRate(playbackRate);
}
```

## Stem Processing Pipeline

### 1. File Loading and Decoding

```typescript
async function loadStemFiles(): Promise<StemBuffers> {
  const stems: StemBuffers = {};

  // Load original audio file
  const originalResponse = await fetch("/audio/track.mp3");
  const originalBuffer = await originalResponse.arrayBuffer();
  stems.original = await audioContext.decodeAudioData(originalBuffer);

  // Process stems (using Demucs or similar)
  const processor = new EnhancedStemProcessor(audioContext);
  const separatedStems = await processor.processAudioFile(originalBuffer);

  return { ...stems, ...separatedStems };
}
```

### 2. Audio Node Creation

```typescript
function createStemNodes(stems: StemBuffers): StemNodes {
  const audioContext = AudioService.getAudioContext();

  const createStemNode = (buffer: AudioBuffer) => {
    const source = audioContext.createBufferSource();
    const gainNode = audioContext.createGain();
    const eqNode = audioContext.createBiquadFilter();
    const panNode = audioContext.createStereoPanner();

    source.buffer = buffer;
    source.connect(eqNode);
    eqNode.connect(panNode);
    panNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    return { source, gainNode, eqNode, panNode };
  };

  return {
    drums: createStemNode(stems.drums),
    bass: createStemNode(stems.bass),
    melody: createStemNode(stems.melody),
    vocals: createStemNode(stems.vocals),
    original: createStemNode(stems.original),
    master: audioContext.createGain(),
  };
}
```

### 3. Real-time Processing

```typescript
function setupRealTimeProcessing(stemNodes: StemNodes) {
  const audioContext = AudioService.getAudioContext();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 2048;

  // Connect master bus to analyser
  stemNodes.master.connect(analyser);
  analyser.connect(audioContext.destination);

  // Monitor audio in real-time
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Float32Array(bufferLength);

  function processAudio() {
    analyser.getFloatFrequencyData(dataArray);

    // Process frequency data
    const rms = calculateRMS(dataArray);
    const spectralCentroid = calculateSpectralCentroid(dataArray);

    // Update UI or trigger effects
    updateVisualization(rms, spectralCentroid);

    requestAnimationFrame(processAudio);
  }

  processAudio();
}
```

## Performance Optimization

### Buffer Management

```typescript
// Use optimized buffer handling
class OptimizedStemProcessor {
  private bufferPool = new BufferPoolManager();

  async processStems(audioBuffer: AudioBuffer): Promise<StemBuffers> {
    // Acquire buffers from pool
    const processingBuffer = this.bufferPool.acquireFloat32Array(
      audioBuffer.length * audioBuffer.numberOfChannels,
    );

    try {
      // Process audio data
      const stems = await this.separateStems(audioBuffer, processingBuffer);

      // Return buffer to pool
      this.bufferPool.releaseFloat32Array(processingBuffer);

      return stems;
    } catch (error) {
      // Ensure buffer is returned even on error
      this.bufferPool.releaseFloat32Array(processingBuffer);
      throw error;
    }
  }
}
```

### Latency Optimization

```typescript
// Optimize for ultra-low latency
function optimizeForLatency(targetLatency: number = 10) {
  const audioContext = AudioService.getAudioContext();

  // Use optimal buffer sizes
  const bufferSize = Math.min(512, Math.max(128, targetLatency * 48)); // 48kHz sample rate
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = bufferSize;

  // Disable unnecessary processing
  analyser.smoothingTimeConstant = 0;

  // Use high-priority audio thread
  if ("audioWorklet" in audioContext) {
    // Use AudioWorklet for better performance
    await audioContext.audioWorklet.addModule("/worklets/stem-processor.js");
  }
}
```

## Usage Examples

### Complete Stem Player Setup

```typescript
class StemPlayer {
  private audioService = AudioService.getInstance();
  private stemNodes: StemNodes;
  private isInitialized = false;

  async initialize() {
    // Initialize Web Audio context
    await this.audioService.initializeOnUserGesture();

    // Load and process stems
    const stems = await this.loadStems();
    await this.audioService.loadStems(stems);

    // Create audio processing graph
    this.stemNodes = this.createStemNodes(stems);

    // Setup effects and mixing
    this.setupEffects();
    this.setupMixing();

    this.isInitialized = true;
  }

  async loadStems(): Promise<StemBuffers> {
    const processor = new EnhancedStemProcessor(
      this.audioService.getAudioContext(),
    );

    // Load original audio
    const response = await fetch("/audio/track.mp3");
    const arrayBuffer = await response.arrayBuffer();

    // Separate into stems
    return await processor.processAudioFile(arrayBuffer);
  }

  private setupEffects() {
    // Setup master effects chain
    this.setupMasterEffects();

    // Setup per-stem effects
    this.setupStemEffects();
  }

  private setupMasterEffects() {
    // Add master compressor
    const compressor = this.audioService
      .getAudioContext()
      .createDynamicsCompressor();
    this.stemNodes.master.connect(compressor);
    compressor.connect(this.audioService.getAudioContext().destination);

    // Add master EQ
    const masterEQ = this.audioService.getAudioContext().createBiquadFilter();
    masterEQ.type = "highshelf";
    masterEQ.frequency.value = 8000;
    masterEQ.gain.value = 2;

    compressor.connect(masterEQ);
    masterEQ.connect(this.audioService.getAudioContext().destination);
  }
}
```

### Real-time Effects Control

```typescript
class EffectsController {
  private audioService = AudioService.getInstance();

  // Gesture-controlled filter sweep
  controlFilterWithGesture(gestureData: SpreadGesture) {
    const frequency = 100 + gestureData.data.spreadRatio * 19000; // 100Hz - 20kHz
    const resonance = gestureData.data.spreadRatio * 15; // 0-15 dB

    this.audioService.setEffectParam("filter", "frequency", frequency);
    this.audioService.setEffectParam("filter", "resonance", resonance);
  }

  // BPM-synced delay
  syncDelayToBPM(bpm: number, noteDivision: number = 4) {
    const delayTime = 60 / bpm / noteDivision; // Convert to seconds
    this.audioService.setEffectParam("delay", "delayTime", delayTime);
  }

  // Dynamic compression based on audio analysis
  adaptCompression(analysis: AudioAnalysisResults) {
    const dynamicRange = analysis.loudness;
    const threshold = Math.max(-40, dynamicRange - 10);

    this.audioService.setEffectParam("compressor", "threshold", threshold);
  }
}
```

## Browser Compatibility

| Feature           | Chrome 88+ | Firefox 85+ | Safari 14+ | Edge 88+ |
| ----------------- | ---------- | ----------- | ---------- | -------- |
| Web Audio API     | ✅ Full    | ✅ Full     | ✅ Full    | ✅ Full  |
| AudioWorklet      | ✅ Full    | ✅ Full     | ✅ Full    | ✅ Full  |
| MediaStream Audio | ✅ Full    | ✅ Full     | ✅ Full    | ✅ Full  |
| Audio Effects     | ✅ Full    | ✅ Full     | ✅ Full    | ✅ Full  |

## Performance Targets

- **Latency**: <10ms total round-trip latency
- **CPU Usage**: <15% for audio processing
- **Memory**: <50MB for typical stem processing
- **Buffer Underruns**: <0.1% underrun rate
- **Frequency Response**: 20Hz - 20kHz ±0.5dB

## Best Practices

### Performance

1. **Buffer Pooling**: Always use buffer pooling for large audio operations
2. **Web Workers**: Process heavy audio analysis in Web Workers
3. **AudioWorklet**: Use AudioWorklet for custom audio processing
4. **Memory Management**: Dispose of unused audio buffers and nodes

### Quality

1. **Sample Rate**: Use 48kHz for professional quality
2. **Bit Depth**: Process in 32-bit float for headroom
3. **Dithering**: Apply dithering when reducing bit depth
4. **Oversampling**: Use oversampling for high-quality effects

### User Experience

1. **Gesture Unlock**: Always initialize Web Audio on user gesture
2. **Visual Feedback**: Provide clear feedback for audio changes
3. **Graceful Degradation**: Handle cases where Web Audio isn't available
4. **Error Recovery**: Implement robust error handling for audio failures
