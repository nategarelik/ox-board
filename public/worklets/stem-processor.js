/**
 * AudioWorklet Processor for low-latency stem mixing
 * Optimized for sub-10ms latency with 128-sample buffer processing
 *
 * @class StemProcessor
 * @extends AudioWorkletProcessor
 */
class StemProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    // Audio processing configuration
    this.sampleRate = sampleRate;
    this.bufferSize = 128; // Optimal for latency/stability balance
    this.numStems = 4; // Support for 4 stems

    // Stem volume state (0.0 to 1.0)
    this.stemVolumes = new Float32Array(this.numStems);
    this.stemVolumes.fill(1.0);

    // Stem mute state
    this.stemMutes = new Uint8Array(this.numStems);
    this.stemMutes.fill(0);

    // Stem EQ state (low, mid, high for each stem)
    this.stemEQ = new Float32Array(this.numStems * 3); // 12 values total
    this.stemEQ.fill(0.0); // Neutral EQ (0dB)

    // Performance monitoring
    this.lastProcessTime = 0;
    this.processCount = 0;
    this.totalProcessTime = 0;

    // Message handling
    this.port.onmessage = this.handleMessage.bind(this);

    // Filter coefficients for EQ (simplified 3-band EQ)
    this.eqFilters = this.initializeEQFilters();

    // Output buffer for mixing
    this.outputBuffer = new Float32Array(128 * 2); // Stereo

    console.log(
      `StemProcessor initialized: ${this.sampleRate}Hz, ${this.bufferSize} buffer`,
    );
  }

  /**
   * Initialize EQ filter coefficients
   */
  initializeEQFilters() {
    const filters = [];

    // Low frequency filter (shelf filter approximation)
    filters.push({
      type: "low",
      frequency: 320,
      gain: 0.0,
      a: new Float32Array(3),
      b: new Float32Array(3),
    });

    // Mid frequency filter (peaking filter approximation)
    filters.push({
      type: "mid",
      frequency: 3200,
      gain: 0.0,
      a: new Float32Array(3),
      b: new Float32Array(3),
    });

    // High frequency filter (shelf filter approximation)
    filters.push({
      type: "high",
      frequency: 8000,
      gain: 0.0,
      a: new Float32Array(3),
      b: new Float32Array(3),
    });

    return filters;
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

      case "SET_STEM_EQ":
        const eqOffset = data.stemIndex * 3;
        this.stemEQ[eqOffset + this.getEQIndex(data.band)] = Math.max(
          -20,
          Math.min(20, data.value),
        );
        this.updateEQFilter(
          data.stemIndex,
          data.band,
          this.stemEQ[eqOffset + this.getEQIndex(data.band)],
        );
        break;

      case "SET_MASTER_VOLUME":
        this.masterVolume = Math.max(0, Math.min(1, data.volume));
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
   * Get EQ band index
   */
  getEQIndex(band) {
    switch (band) {
      case "low":
        return 0;
      case "mid":
        return 1;
      case "high":
        return 2;
      default:
        return 0;
    }
  }

  /**
   * Update EQ filter coefficients
   */
  updateEQFilter(stemIndex, band, gainDB) {
    const filterIndex = this.getEQIndex(band);
    const filter = this.eqFilters[filterIndex];

    // Convert dB to linear gain
    const gain = Math.pow(10, gainDB / 20);

    // Simplified coefficient update (in production, use proper biquad calculation)
    filter.gain = gainDB;
  }

  /**
   * Calculate current latency
   */
  calculateLatency() {
    if (typeof globalThis !== "undefined" && globalThis.AudioContext) {
      const ctx = globalThis.AudioContext.getInstance();
      return ctx.baseLatency || 0;
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
      (avgProcessTime / (this.bufferSize / this.sampleRate)) * 100; // Percentage of quantum time

    return {
      averageProcessTime: avgProcessTime,
      cpuUsage: Math.min(cpuUsage, 100),
      processCount: this.processCount,
      bufferSize: this.bufferSize,
    };
  }

  /**
   * Apply EQ to a single sample
   */
  processEQStereoSample(stemIndex, left, right) {
    let processedLeft = left;
    let processedRight = right;

    // Apply each EQ band
    for (let i = 0; i < 3; i++) {
      const gain = Math.pow(10, this.stemEQ[stemIndex * 3 + i] / 20);
      processedLeft *= gain;
      processedRight *= gain;
    }

    return { left: processedLeft, right: processedRight };
  }

  /**
   * Process audio inputs
   */
  process(inputs, outputs) {
    const startTime = performance.now();

    // Get output buffer
    const output = outputs[0];
    if (!output || !output[0] || !output[1]) {
      return true; // Continue processing
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
        continue; // No input for this stem
      }

      const stemLeft = stemInput[0];
      const stemRight = stemInput[1];
      const volume = this.stemVolumes[stemIndex];
      const isMuted = this.stemMutes[stemIndex] === 1;

      if (isMuted || volume === 0) {
        continue; // Skip muted or silent stems
      }

      // Process each sample in the buffer
      for (let sample = 0; sample < this.bufferSize; sample++) {
        let leftSample = stemLeft[sample] * volume;
        let rightSample = stemRight[sample] * volume;

        // Apply EQ processing
        const eqResult = this.processEQStereoSample(
          stemIndex,
          leftSample,
          rightSample,
        );
        leftSample = eqResult.left;
        rightSample = eqResult.right;

        // Mix into output (accumulate)
        leftOutput[sample] += leftSample;
        rightOutput[sample] += rightSample;
      }
    }

    // Apply master volume and soft clipping to prevent distortion
    const masterVolume = this.masterVolume || 1.0;
    for (let sample = 0; sample < this.bufferSize; sample++) {
      // Apply master volume
      leftOutput[sample] *= masterVolume;
      rightOutput[sample] *= masterVolume;

      // Soft clipping to prevent harsh distortion
      leftOutput[sample] = Math.tanh(leftOutput[sample]);
      rightOutput[sample] = Math.tanh(rightOutput[sample]);
    }

    // Performance monitoring
    const processTime = performance.now() - startTime;
    this.totalProcessTime += processTime;
    this.processCount++;

    // Report performance every 1000 processes
    if (this.processCount % 1000 === 0) {
      this.port.postMessage({
        type: "PERFORMANCE_UPDATE",
        stats: this.getPerformanceStats(),
      });
    }

    return true; // Continue processing
  }
}

// Register the processor
registerProcessor("stem-processor", StemProcessor);
