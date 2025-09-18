/**
 * Web Worker for high-performance audio analysis
 * Processes audio data off the main thread to maintain 60 FPS UI
 */

export interface AudioAnalysisRequest {
  id: string;
  type: 'analyze' | 'spectrum' | 'waveform' | 'levels' | 'config';
  audioData: Float32Array;
  sampleRate: number;
  channelIndex: number;
  stemType: 'drums' | 'bass' | 'melody' | 'vocals' | 'original';
  options?: {
    fftSize?: number;
    smoothingTimeConstant?: number;
    windowFunction?: 'hann' | 'hamming' | 'blackman';
    frequencyRange?: [number, number];
  };
}

export interface AudioAnalysisResult {
  id: string;
  channelIndex: number;
  stemType: string;
  timestamp: number;
  spectrum: Float32Array;
  waveform: Float32Array;
  levels: {
    rms: number;
    peak: number;
    lufs: number;
  };
  frequencies: {
    bass: number;
    mid: number;
    high: number;
  };
  features: {
    spectralCentroid: number;
    spectralRolloff: number;
    zeroCrossingRate: number;
    mfcc: Float32Array;
  };
}

export interface WorkerConfig {
  fftSize: number;
  hopSize: number;
  windowFunction: 'hann' | 'hamming' | 'blackman';
  smoothingTimeConstant: number;
  frequencyBands: number;
  enableMFCC: boolean;
  enableSpectralFeatures: boolean;
}

const defaultConfig: WorkerConfig = {
  fftSize: 2048,
  hopSize: 512,
  windowFunction: 'hann',
  smoothingTimeConstant: 0.8,
  frequencyBands: 128,
  enableMFCC: true,
  enableSpectralFeatures: true
};

class AudioAnalyzer {
  private config!: WorkerConfig;
  private windowFunction!: Float32Array;
  private fftBuffer!: Float32Array;
  private spectrumHistory!: Float32Array[];
  private rmsHistory!: number[];
  private peakHistory!: number[];

  // FFT implementation (simple DFT for Web Worker compatibility)
  private cosTable!: Float32Array;
  private sinTable!: Float32Array;

  // Mel filter bank for MFCC
  private melFilters!: Float32Array[];

  constructor(config: Partial<WorkerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
    this.spectrumHistory = [];
    this.rmsHistory = [];
    this.peakHistory = [];

    this.initializeFFT();
    this.initializeWindowFunction();
    this.initializeMelFilters();
  }

  private initializeFFT(): void {
    const size = this.config.fftSize;
    this.fftBuffer = new Float32Array(size * 2); // Complex numbers (real, imag)
    this.cosTable = new Float32Array(size);
    this.sinTable = new Float32Array(size);

    // Precompute twiddle factors
    for (let i = 0; i < size; i++) {
      const angle = -2 * Math.PI * i / size;
      this.cosTable[i] = Math.cos(angle);
      this.sinTable[i] = Math.sin(angle);
    }
  }

  private initializeWindowFunction(): void {
    const size = this.config.fftSize;
    this.windowFunction = new Float32Array(size);

    switch (this.config.windowFunction) {
      case 'hann':
        for (let i = 0; i < size; i++) {
          this.windowFunction[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
        }
        break;

      case 'hamming':
        for (let i = 0; i < size; i++) {
          this.windowFunction[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (size - 1));
        }
        break;

      case 'blackman':
        for (let i = 0; i < size; i++) {
          const ratio = i / (size - 1);
          this.windowFunction[i] = 0.42 - 0.5 * Math.cos(2 * Math.PI * ratio) + 0.08 * Math.cos(4 * Math.PI * ratio);
        }
        break;

      default:
        // Rectangular window (no windowing)
        this.windowFunction.fill(1);
    }
  }

  private initializeMelFilters(): void {
    if (!this.config.enableMFCC) return;

    const numFilters = 13; // Standard for MFCC
    const minFreq = 0;
    const maxFreq = 8000; // Nyquist for 16kHz sample rate
    const fftSize = this.config.fftSize;

    this.melFilters = [];

    // Convert Hz to Mel scale
    const melMin = this.hzToMel(minFreq);
    const melMax = this.hzToMel(maxFreq);

    // Create equally spaced points in mel scale
    const melPoints = [];
    for (let i = 0; i <= numFilters + 1; i++) {
      melPoints.push(melMin + (melMax - melMin) * i / (numFilters + 1));
    }

    // Convert back to Hz
    const hzPoints = melPoints.map(mel => this.melToHz(mel));

    // Convert Hz to FFT bin indices
    const binPoints = hzPoints.map(hz => Math.floor((fftSize + 1) * hz / (maxFreq * 2)));

    // Create triangular filters
    for (let i = 1; i <= numFilters; i++) {
      const filter = new Float32Array(fftSize / 2 + 1);
      const left = binPoints[i - 1];
      const center = binPoints[i];
      const right = binPoints[i + 1];

      // Rising slope
      for (let j = left; j < center; j++) {
        filter[j] = (j - left) / (center - left);
      }

      // Falling slope
      for (let j = center; j < right; j++) {
        filter[j] = (right - j) / (right - center);
      }

      this.melFilters.push(filter);
    }
  }

  private hzToMel(hz: number): number {
    return 2595 * Math.log10(1 + hz / 700);
  }

  private melToHz(mel: number): number {
    return 700 * (Math.pow(10, mel / 2595) - 1);
  }

  private applyWindow(input: Float32Array): Float32Array {
    const windowed = new Float32Array(input.length);
    for (let i = 0; i < input.length; i++) {
      windowed[i] = input[i] * this.windowFunction[i];
    }
    return windowed;
  }

  private computeFFT(input: Float32Array): Float32Array {
    const size = this.config.fftSize;
    const spectrum = new Float32Array(size / 2 + 1);

    // Apply window function
    const windowed = this.applyWindow(input);

    // Simple DFT implementation (can be optimized with FFT)
    for (let k = 0; k < size / 2 + 1; k++) {
      let real = 0;
      let imag = 0;

      for (let n = 0; n < size; n++) {
        const angle = -2 * Math.PI * k * n / size;
        real += windowed[n] * Math.cos(angle);
        imag += windowed[n] * Math.sin(angle);
      }

      // Magnitude
      spectrum[k] = Math.sqrt(real * real + imag * imag) / size;
    }

    return spectrum;
  }

  private computeLevels(input: Float32Array): { rms: number; peak: number; lufs: number } {
    let sum = 0;
    let peak = 0;

    for (let i = 0; i < input.length; i++) {
      const sample = Math.abs(input[i]);
      sum += sample * sample;
      peak = Math.max(peak, sample);
    }

    const rms = Math.sqrt(sum / input.length);

    // Simple LUFS approximation (K-weighting would be more accurate)
    const lufs = -23 + 10 * Math.log10(rms * rms);

    return { rms, peak, lufs };
  }

  private computeFrequencyBands(spectrum: Float32Array, sampleRate: number): { bass: number; mid: number; high: number } {
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / spectrum.length;

    // Define frequency ranges
    const bassRange = [20, 250];   // Hz
    const midRange = [250, 4000];  // Hz
    const highRange = [4000, nyquist]; // Hz

    const getBandEnergy = (range: number[]) => {
      const startBin = Math.floor(range[0] / binWidth);
      const endBin = Math.floor(range[1] / binWidth);
      let energy = 0;

      for (let i = startBin; i < Math.min(endBin, spectrum.length); i++) {
        energy += spectrum[i] * spectrum[i];
      }

      return Math.sqrt(energy / (endBin - startBin));
    };

    return {
      bass: getBandEnergy(bassRange),
      mid: getBandEnergy(midRange),
      high: getBandEnergy(highRange)
    };
  }

  private computeSpectralFeatures(spectrum: Float32Array, sampleRate: number): {
    spectralCentroid: number;
    spectralRolloff: number;
    zeroCrossingRate: number;
  } {
    const nyquist = sampleRate / 2;
    const binWidth = nyquist / spectrum.length;

    // Spectral Centroid
    let weightedSum = 0;
    let magnitudeSum = 0;

    for (let i = 0; i < spectrum.length; i++) {
      const frequency = i * binWidth;
      const magnitude = spectrum[i];
      weightedSum += frequency * magnitude;
      magnitudeSum += magnitude;
    }

    const spectralCentroid = magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;

    // Spectral Rolloff (85% of energy)
    let cumulativeEnergy = 0;
    const totalEnergy = magnitudeSum;
    const rolloffThreshold = totalEnergy * 0.85;

    let spectralRolloff = nyquist;
    for (let i = 0; i < spectrum.length; i++) {
      cumulativeEnergy += spectrum[i];
      if (cumulativeEnergy >= rolloffThreshold) {
        spectralRolloff = i * binWidth;
        break;
      }
    }

    // Zero Crossing Rate (approximation from spectrum)
    let zeroCrossingRate = 0;
    for (let i = 1; i < spectrum.length; i++) {
      if ((spectrum[i] > 0) !== (spectrum[i - 1] > 0)) {
        zeroCrossingRate++;
      }
    }
    zeroCrossingRate /= spectrum.length;

    return {
      spectralCentroid,
      spectralRolloff,
      zeroCrossingRate
    };
  }

  private computeMFCC(spectrum: Float32Array): Float32Array {
    if (!this.config.enableMFCC || !this.melFilters) {
      return new Float32Array(0);
    }

    const mfcc = new Float32Array(this.melFilters.length);

    // Apply mel filters
    for (let i = 0; i < this.melFilters.length; i++) {
      let energy = 0;
      for (let j = 0; j < Math.min(spectrum.length, this.melFilters[i].length); j++) {
        energy += spectrum[j] * this.melFilters[i][j];
      }
      mfcc[i] = Math.log(Math.max(energy, 1e-10)); // Avoid log(0)
    }

    // Apply DCT (simplified)
    const dct = new Float32Array(mfcc.length);
    for (let k = 0; k < dct.length; k++) {
      for (let n = 0; n < mfcc.length; n++) {
        dct[k] += mfcc[n] * Math.cos(Math.PI * k * (2 * n + 1) / (2 * mfcc.length));
      }
    }

    return dct;
  }

  private smoothSpectrum(spectrum: Float32Array): Float32Array {
    const smoothed = new Float32Array(spectrum.length);
    const alpha = 1 - this.config.smoothingTimeConstant;

    if (this.spectrumHistory.length === 0) {
      this.spectrumHistory.push(new Float32Array(spectrum));
      return spectrum;
    }

    const previous = this.spectrumHistory[this.spectrumHistory.length - 1];

    for (let i = 0; i < spectrum.length; i++) {
      smoothed[i] = alpha * spectrum[i] + (1 - alpha) * previous[i];
    }

    this.spectrumHistory.push(smoothed);

    // Keep history limited
    if (this.spectrumHistory.length > 10) {
      this.spectrumHistory.shift();
    }

    return smoothed;
  }

  public analyze(request: AudioAnalysisRequest): AudioAnalysisResult {
    const { audioData, sampleRate, channelIndex, stemType, options = {} } = request;

    // Update config with request options
    if (options.fftSize) this.config.fftSize = options.fftSize;
    if (options.smoothingTimeConstant) this.config.smoothingTimeConstant = options.smoothingTimeConstant;

    // Ensure audio data is the right size for FFT
    const fftSize = this.config.fftSize;
    const processData = audioData.length >= fftSize
      ? audioData.slice(0, fftSize)
      : new Float32Array(fftSize);

    if (audioData.length < fftSize) {
      processData.set(audioData);
    }

    // Compute spectrum
    const rawSpectrum = this.computeFFT(processData);
    const spectrum = this.smoothSpectrum(rawSpectrum);

    // Compute levels
    const levels = this.computeLevels(audioData);

    // Compute frequency bands
    const frequencies = this.computeFrequencyBands(spectrum, sampleRate);

    // Compute spectral features
    const spectralFeatures = this.config.enableSpectralFeatures
      ? this.computeSpectralFeatures(spectrum, sampleRate)
      : { spectralCentroid: 0, spectralRolloff: 0, zeroCrossingRate: 0 };

    // Compute MFCC
    const mfcc = this.computeMFCC(spectrum);

    // Generate waveform for visualization (downsampled)
    const waveformSize = 512;
    const waveform = new Float32Array(waveformSize);
    const step = Math.max(1, Math.floor(audioData.length / waveformSize));

    for (let i = 0; i < waveformSize; i++) {
      const sourceIndex = i * step;
      if (sourceIndex < audioData.length) {
        waveform[i] = audioData[sourceIndex];
      }
    }

    return {
      id: request.id,
      channelIndex,
      stemType,
      timestamp: Date.now(),
      spectrum: new Float32Array(spectrum.slice(0, this.config.frequencyBands)),
      waveform,
      levels,
      frequencies,
      features: {
        spectralCentroid: spectralFeatures.spectralCentroid,
        spectralRolloff: spectralFeatures.spectralRolloff,
        zeroCrossingRate: spectralFeatures.zeroCrossingRate,
        mfcc
      }
    };
  }

  public updateConfig(config: Partial<WorkerConfig>): void {
    this.config = { ...this.config, ...config };

    // Reinitialize if FFT size changed
    if (config.fftSize || config.windowFunction) {
      this.initializeFFT();
      this.initializeWindowFunction();
    }

    // Reinitialize MFCC if enabled/disabled
    if (config.enableMFCC !== undefined) {
      this.initializeMelFilters();
    }
  }
}

// Worker instance
const analyzer = new AudioAnalyzer();

// Message handler
self.onmessage = (event) => {
  const request = event.data as AudioAnalysisRequest;

  try {
    switch (request.type) {
      case 'analyze':
        const result = analyzer.analyze(request);
        self.postMessage(result);
        break;

      case 'config':
        analyzer.updateConfig(request.options as WorkerConfig);
        self.postMessage({ id: request.id, success: true });
        break;

      default:
        self.postMessage({
          id: request.id,
          error: `Unknown request type: ${request.type}`
        });
    }
  } catch (error) {
    self.postMessage({
      id: request.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// Types are already exported as interfaces above