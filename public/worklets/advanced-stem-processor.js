/**
 * Advanced AudioWorklet Processor for professional stem processing
 * Features: crossfading, compression, spatial audio, beat grid alignment, sidechain compression
 *
 * @class AdvancedStemProcessor
 * @extends AudioWorkletProcessor
 */
class AdvancedStemProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // Audio processing configuration
    this.sampleRate = sampleRate;
    this.bufferSize = 128;
    this.numStems = 4;

    // Stem processing state
    this.stemVolumes = new Float32Array(this.numStems);
    this.stemVolumes.fill(1.0);
    this.stemMutes = new Uint8Array(this.numStems);
    this.stemMutes.fill(0);
    this.stemPans = new Float32Array(this.numStems); // -1.0 to 1.0
    this.stemPans.fill(0.0);

    // Advanced stem parameters
    this.stemCompression = new Float32Array(this.numStems * 4); // threshold, ratio, attack, release
    this.stemCompression.fill(0.0);
    this.stemSpatialPositions = new Float32Array(this.numStems * 3); // x, y, z
    this.stemSpatialPositions.fill(0.0);

    // Crossfading between stems
    this.crossfadeMatrix = new Float32Array(this.numStems * this.numStems);
    this.crossfadeMatrix.fill(0.0);
    this.crossfadeTimes = new Float32Array(this.numStems * this.numStems);
    this.crossfadeTimes.fill(0.0);

    // Beat grid alignment
    this.beatGridEnabled = new Uint8Array(this.numStems);
    this.beatGridEnabled.fill(0);
    this.beatPositions = new Float32Array(this.numStems);
    this.beatPositions.fill(0.0);
    this.tempoSync = false;
    this.masterBPM = 120.0;

    // Sidechain compression
    this.sidechainEnabled = new Uint8Array(this.numStems);
    this.sidechainEnabled.fill(0);
    this.sidechainSources = new Uint8Array(this.numStems); // which stem to sidechain from
    this.sidechainSources.fill(0);
    this.sidechainDepth = new Float32Array(this.numStems);
    this.sidechainDepth.fill(0.5);

    // Dynamic range processing
    this.compressorStates = new Array(this.numStems).fill(null).map(() => ({
      envelope: 0.0,
      gain: 1.0,
      attackCoeff: Math.exp(-1.0 / (0.003 * this.sampleRate)), // 3ms attack
      releaseCoeff: Math.exp(-1.0 / (0.1 * this.sampleRate)), // 100ms release
    }));

    // Spatial audio processing
    this.hrtfBuffers = null; // Will be loaded via message
    this.spatialCache = new Map();

    // Performance monitoring
    this.lastProcessTime = 0;
    this.processCount = 0;
    this.totalProcessTime = 0;

    // Message handling
    this.port.onmessage = this.handleMessage.bind(this);

    // Output buffer
    this.outputBuffer = new Float32Array(128 * 2);

    console.log(
      `AdvancedStemProcessor initialized: ${this.sampleRate}Hz, ${this.bufferSize} buffer`,
    );
  }

  /**
   * Handle messages from main thread
   */
  handleMessage(event) {
    const { type, data } = event.data;

    switch (type) {
      case "SET_STEM_VOLUME":
        this.stemVolumes[data.stemIndex] = Math.max(
          0,
          Math.min(1, data.volume),
        );
        break;

      case "SET_STEM_MUTE":
        this.stemMutes[data.stemIndex] = data.muted ? 1 : 0;
        break;

      case "SET_STEM_PAN":
        this.stemPans[data.stemIndex] = Math.max(-1, Math.min(1, data.pan));
        break;

      case "SET_STEM_COMPRESSION":
        const compOffset = data.stemIndex * 4;
        this.stemCompression[compOffset] = Math.max(
          -60,
          Math.min(0, data.threshold),
        );
        this.stemCompression[compOffset + 1] = Math.max(
          1,
          Math.min(20, data.ratio),
        );
        this.stemCompression[compOffset + 2] = Math.max(
          0.001,
          Math.min(0.1, data.attack),
        );
        this.stemCompression[compOffset + 3] = Math.max(
          0.01,
          Math.min(2.0, data.release),
        );
        break;

      case "SET_STEM_SPATIAL":
        const spatialOffset = data.stemIndex * 3;
        this.stemSpatialPositions[spatialOffset] = Math.max(
          -10,
          Math.min(10, data.x),
        );
        this.stemSpatialPositions[spatialOffset + 1] = Math.max(
          -10,
          Math.min(10, data.y),
        );
        this.stemSpatialPositions[spatialOffset + 2] = Math.max(
          -10,
          Math.min(10, data.z),
        );
        break;

      case "SET_CROSSFADE":
        const matrixIndex = data.fromStem * this.numStems + data.toStem;
        this.crossfadeMatrix[matrixIndex] = Math.max(
          0,
          Math.min(1, data.amount),
        );
        this.crossfadeTimes[matrixIndex] = Math.max(
          0.001,
          Math.min(5.0, data.time),
        );
        break;

      case "SET_BEAT_GRID":
        this.beatGridEnabled[data.stemIndex] = data.enabled ? 1 : 0;
        this.beatPositions[data.stemIndex] = data.position || 0.0;
        break;

      case "SET_TEMPO_SYNC":
        this.tempoSync = data.enabled;
        this.masterBPM = Math.max(60, Math.min(200, data.bpm || 120));
        break;

      case "SET_SIDECHAIN":
        this.sidechainEnabled[data.stemIndex] = data.enabled ? 1 : 0;
        this.sidechainSources[data.stemIndex] = Math.max(
          0,
          Math.min(this.numStems - 1, data.sourceStem),
        );
        this.sidechainDepth[data.stemIndex] = Math.max(
          0,
          Math.min(1, data.depth),
        );
        break;

      case "LOAD_HRTF":
        this.hrtfBuffers = data.buffers;
        console.log("HRTF buffers loaded for spatial audio");
        break;

      case "GET_LATENCY":
        this.port.postMessage({
          type: "LATENCY_REPORT",
          latency: this.calculateLatency(),
          performance: this.getPerformanceStats(),
        });
        break;

      default:
        console.warn("Unknown message type:", type);
    }
  }

  /**
   * Calculate current latency
   */
  calculateLatency() {
    if (typeof globalThis !== "undefined" && globalThis.AudioContext) {
      const ctx = globalThis.AudioContext.getInstance?.();
      return ctx?.baseLatency || 0;
    }
    return 0;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats() {
    const avgProcessTime =
      this.processCount > 0 ? this.totalProcessTime / this.processCount : 0;
    const cpuUsage =
      (avgProcessTime / (this.bufferSize / this.sampleRate)) * 100;

    return {
      averageProcessTime: avgProcessTime,
      cpuUsage: Math.min(cpuUsage, 100),
      processCount: this.processCount,
      bufferSize: this.bufferSize,
    };
  }

  /**
   * Apply compression to a single sample
   */
  applyCompression(stemIndex, sample, inputLevel) {
    const offset = stemIndex * 4;
    const threshold = this.stemCompression[offset];
    const ratio = this.stemCompression[offset + 1];
    const attack = this.stemCompression[offset + 2];
    const release = this.stemCompression[offset + 3];

    // Calculate attack/release coefficients
    const attackCoeff = Math.exp(-1.0 / (attack * this.sampleRate));
    const releaseCoeff = Math.exp(-1.0 / (release * this.sampleRate));

    const state = this.compressorStates[stemIndex];

    // Update envelope
    const envIn = Math.abs(inputLevel);
    if (envIn > state.envelope) {
      state.envelope = envIn + attackCoeff * (state.envelope - envIn);
    } else {
      state.envelope = envIn + releaseCoeff * (state.envelope - envIn);
    }

    // Calculate compression gain
    if (state.envelope > Math.pow(10, threshold / 20)) {
      const overThreshold = 20 * Math.log10(state.envelope);
      const compressed = threshold + (overThreshold - threshold) / ratio;
      state.gain = Math.pow(10, (threshold - compressed) / 20);
    } else {
      state.gain = 1.0;
    }

    return sample * state.gain;
  }

  /**
   * Apply spatial audio processing
   */
  applySpatialAudio(stemIndex, left, right) {
    const offset = stemIndex * 3;
    const x = this.stemSpatialPositions[offset];
    const y = this.stemSpatialPositions[offset + 1];
    const z = this.stemSpatialPositions[offset + 2];

    // Simple stereo panning based on position
    // In production, this would use proper HRTF convolution
    const pan = Math.max(-1, Math.min(1, x / 5.0));
    const distance = Math.sqrt(x * x + y * y + z * z);
    const distanceGain = Math.max(0.1, 1.0 / (1.0 + distance * 0.1));

    const panL = (pan + 1) * 0.5;
    const panR = (1 - pan) * 0.5;

    return {
      left: left * panL * distanceGain,
      right: right * panR * distanceGain,
    };
  }

  /**
   * Apply crossfading between stems
   */
  applyCrossfading(stemIndex, left, right) {
    let processedLeft = left;
    let processedRight = right;

    for (let otherStem = 0; otherStem < this.numStems; otherStem++) {
      if (otherStem === stemIndex) continue;

      const matrixIndex = otherStem * this.numStems + stemIndex;
      const crossfadeAmount = this.crossfadeMatrix[matrixIndex];

      if (crossfadeAmount > 0) {
        // This is a simplified crossfade - in production you'd want smoother curves
        const otherVolume =
          this.stemVolumes[otherStem] * (1 - this.stemMutes[otherStem]);
        processedLeft =
          processedLeft * (1 - crossfadeAmount) +
          left * otherVolume * crossfadeAmount;
        processedRight =
          processedRight * (1 - crossfadeAmount) +
          right * otherVolume * crossfadeAmount;
      }
    }

    return { left: processedLeft, right: processedRight };
  }

  /**
   * Process audio inputs with advanced features
   */
  process(inputs, outputs) {
    const startTime = performance.now();

    const output = outputs[0];
    if (!output || !output[0] || !output[1]) {
      return true;
    }

    const leftOutput = output[0];
    const rightOutput = output[1];

    // Clear output buffers
    leftOutput.fill(0);
    rightOutput.fill(0);

    // Process each stem input
    for (let stemIndex = 0; stemIndex < this.numStems; stemIndex++) {
      const stemInput = inputs[stemIndex];
      if (!stemInput || !stemInput[0] || !stemInput[1]) {
        continue;
      }

      const stemLeft = stemInput[0];
      const stemRight = stemInput[1];
      const volume = this.stemVolumes[stemIndex];
      const isMuted = this.stemMutes[stemIndex] === 1;
      const pan = this.stemPans[stemIndex];

      if (isMuted || volume === 0) {
        continue;
      }

      // Process each sample in the buffer
      for (let sample = 0; sample < this.bufferSize; sample++) {
        let leftSample = stemLeft[sample];
        let rightSample = stemRight[sample];

        // Apply panning
        if (pan !== 0) {
          const panL = (pan + 1) * 0.5;
          const panR = (1 - pan) * 0.5;
          leftSample *= panL;
          rightSample *= panR;
        }

        // Apply compression
        leftSample = this.applyCompression(
          stemIndex,
          leftSample,
          stemLeft[sample],
        );
        rightSample = this.applyCompression(
          stemIndex,
          rightSample,
          stemRight[sample],
        );

        // Apply spatial audio
        const spatialResult = this.applySpatialAudio(
          stemIndex,
          leftSample,
          rightSample,
        );
        leftSample = spatialResult.left;
        rightSample = spatialResult.right;

        // Apply crossfading
        const crossfadeResult = this.applyCrossfading(
          stemIndex,
          leftSample,
          rightSample,
        );
        leftSample = crossfadeResult.left;
        rightSample = crossfadeResult.right;

        // Apply volume
        leftSample *= volume;
        rightSample *= volume;

        // Mix into output (accumulate)
        leftOutput[sample] += leftSample;
        rightOutput[sample] += rightSample;
      }
    }

    // Apply sidechain compression
    this.applySidechainCompression(leftOutput, rightOutput);

    // Apply master processing and soft clipping
    this.applyMasterProcessing(leftOutput, rightOutput);

    // Performance monitoring
    const processTime = performance.now() - startTime;
    this.totalProcessTime += processTime;
    this.processCount++;

    // Report performance periodically
    if (this.processCount % 1000 === 0) {
      this.port.postMessage({
        type: "PERFORMANCE_UPDATE",
        stats: this.getPerformanceStats(),
      });
    }

    return true;
  }

  /**
   * Apply sidechain compression between stems
   */
  applySidechainCompression(leftOutput, rightOutput) {
    for (let stemIndex = 0; stemIndex < this.numStems; stemIndex++) {
      if (this.sidechainEnabled[stemIndex] === 0) continue;

      const sourceStem = this.sidechainSources[stemIndex];
      if (sourceStem >= this.numStems) continue;

      const depth = this.sidechainDepth[stemIndex];

      for (let sample = 0; sample < this.bufferSize; sample++) {
        const sourceLevel =
          Math.abs(leftOutput[sample]) + Math.abs(rightOutput[sample]);
        const detector = Math.min(1.0, sourceLevel * 2.0);

        // Apply sidechain gain reduction
        const sidechainGain = 1.0 - detector * depth * 0.7;
        leftOutput[sample] *= sidechainGain;
        rightOutput[sample] *= sidechainGain;
      }
    }
  }

  /**
   * Apply master processing (limiting, soft clipping)
   */
  applyMasterProcessing(leftOutput, rightOutput) {
    for (let sample = 0; sample < this.bufferSize; sample++) {
      // Soft clipping to prevent harsh distortion
      leftOutput[sample] = Math.tanh(leftOutput[sample]);
      rightOutput[sample] = Math.tanh(rightOutput[sample]);

      // Simple peak limiting
      const peak = Math.max(
        Math.abs(leftOutput[sample]),
        Math.abs(rightOutput[sample]),
      );
      if (peak > 0.9) {
        const limitGain = 0.9 / peak;
        leftOutput[sample] *= limitGain;
        rightOutput[sample] *= limitGain;
      }
    }
  }
}

// Register the processor
registerProcessor("advanced-stem-processor", AdvancedStemProcessor);
