// Mock for Essentia.js
const EssentiaMock = function () {
  const essentia = {
    version: "0.1.3",
    algorithms: {
      RhythmExtractor2013: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          bpm: 120,
          ticks: new Float32Array([0, 0.5, 1, 1.5]),
          confidence: 0.9,
          estimates: new Float32Array([119, 120, 121]),
          bpmIntervals: new Float32Array([0.5, 0.5, 0.5]),
        }),
      }),
      KeyExtractor: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          key: "C",
          scale: "major",
          strength: 0.8,
        }),
      }),
      PitchYinFFT: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          pitch: 440,
          pitchConfidence: 0.95,
        }),
      }),
      SpectralCentroid: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          spectralCentroid: 2000,
        }),
      }),
      Energy: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          energy: 0.7,
        }),
      }),
      Loudness: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          loudness: -10,
        }),
      }),
      BeatTrackerMultiFeature: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          ticks: new Float32Array([0, 0.5, 1, 1.5]),
        }),
      }),
      EqualLoudness: jest.fn().mockReturnValue({
        compute: jest.fn((signal) => ({
          signal: signal || new Float32Array(1024),
        })),
      }),
      ChromaExtractor: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          chroma: new Float32Array(12).fill(0.1),
        }),
      }),
      HPCP: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          hpcp: new Float32Array(36).fill(0.1),
        }),
      }),
      ChordsDetection: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          chords: ["C", "Am", "F", "G"],
          strength: 0.8,
        }),
      }),
      Key: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          key: "C",
          scale: "major",
          strength: 0.9,
        }),
      }),
      Spectrum: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          spectrum: new Float32Array(1024).fill(0.1),
        }),
      }),
      RollOff: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          rolloff: 0.85,
        }),
      }),
      BandWidth: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          bandwidth: 2000,
        }),
      }),
      Flatness: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          flatness: 0.3,
        }),
      }),
      Flux: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue((spectrum1, spectrum2) => ({
          flux: 0.2,
        })),
      }),
      BeatsLoudness: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          beats: new Float32Array([0, 0.5, 1, 1.5]),
          loudness: new Float32Array([0.7, 0.8, 0.9, 0.8]),
        }),
      }),
      BpmHistogram: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          bpmPeaks: new Float32Array([120, 60, 240]),
          bpmAmplitudes: new Float32Array([0.8, 0.2, 0.1]),
          histogram: new Float32Array(150).fill(0),
        }),
      }),
      BeatTrackerDegara: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          ticks: new Float32Array([0, 0.5, 1, 1.5]),
        }),
      }),
      BeatTrackerMultiFeature: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          ticks: new Float32Array([0, 0.5, 1, 1.5]),
        }),
      }),
      NoveltyCurve: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          novelty: new Float32Array(1000).fill(0.1),
        }),
      }),
      OnsetDetectionGlobal: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          onsets: new Float32Array([0.5, 1.0, 1.5, 2.0]),
          strengths: new Float32Array([0.8, 0.9, 0.7, 0.6]),
        }),
      }),
      HarmonicPeaks: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          frequencies: new Float32Array([440, 880, 1320]),
          magnitudes: new Float32Array([0.8, 0.6, 0.4]),
        }),
      }),
      Inharmonicity: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          inharmonicity: 0.1,
        }),
      }),
      OddToEvenHarmonicEnergyRatio: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          oddToEvenRatio: 0.7,
        }),
      }),
      Tristimulus: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          tristimulus: new Float32Array([0.3, 0.4, 0.3]),
        }),
      }),
      FrameCutter: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          frames: [new Float32Array(1024).fill(0.1)],
        }),
      }),
      BPMHistogramDescriptors: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          firstPeakBPM: 120,
          firstPeakWeight: 0.8,
          firstPeakSpread: 0.1,
          secondPeakBPM: 60,
          secondPeakWeight: 0.2,
          secondPeakSpread: 0.1,
          histogram: new Float32Array(150).fill(0),
        }),
      }),
      PercivalBpmEstimator: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          bpm: 120,
        }),
      }),
      MFCC: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          mfcc: new Float32Array(13).fill(0),
          bands: new Float32Array(40).fill(0),
        }),
      }),
      SuperFluxExtractor: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          onsets: new Float32Array([0, 0.5, 1, 1.5]),
        }),
      }),
      Windowing: jest.fn().mockReturnValue({
        compute: jest.fn((signal) => ({
          frame: signal || new Float32Array(1024),
        })),
      }),
      OnsetDetection: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          onsets: new Float32Array([0.5, 1.0, 1.5, 2.0]),
          onsetRate: 2.0,
        }),
      }),
      RMS: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          rms: 0.5,
        }),
      }),
      ZeroCrossingRate: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          zeroCrossingRate: 0.1,
        }),
      }),
      SpectralRolloff: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          spectralRolloff: 0.85,
        }),
      }),
      SpectralFlux: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          spectralFlux: 0.3,
        }),
      }),
      Danceability: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          danceability: 0.7,
        }),
      }),
      DynamicComplexity: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          dynamicComplexity: 0.5,
          loudness: -10,
        }),
      }),
      LogAttackTime: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          logAttackTime: -1.5,
        }),
      }),
      EffectiveDuration: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          effectiveDuration: 3.5,
        }),
      }),
      StartStopSilence: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          startTime: 0.1,
          stopTime: 3.9,
        }),
      }),
    },

    // Algorithms property for MusicAnalyzer to access
    algorithms: {
      equalLoudness: jest.fn((input) => input || new Float32Array(1024)),
      beatTracker: jest.fn(() => [0.5, 1.0, 1.5, 2.0, 2.5]),
      bpmHistogram: jest.fn(() => ({ bpmPeaks: [120], bpmAmplitudes: [0.9] })),
      keyExtractor: jest.fn(() => ({
        key: "C",
        scale: "major",
        strength: 0.9,
      })),
      spectrum: jest.fn(() => new Float32Array(512)),
      spectralCentroid: jest.fn(() => 2000),
      rollOff: jest.fn(() => 5000),
      bandwidth: jest.fn(() => 1500),
      flatness: jest.fn(() => 0.5),
      flux: jest.fn(() => 0.1),
      energy: jest.fn(() => 0.7),
      rms: jest.fn(() => 0.3),
      zcr: jest.fn(() => 0.05),
      harmonicPeaks: jest.fn(() => ({
        frequencies: [440, 880],
        magnitudes: [0.8, 0.4],
      })),
      inharmonicity: jest.fn(() => 0.05),
      oddToEvenHarmonicEnergyRatio: jest.fn(() => 0.6),
      tristimulus: jest.fn(() => [0.3, 0.4, 0.3]),
      windowing: jest.fn((input) => input || new Float32Array(1024)),
      onsetDetection: jest.fn(() => ({
        onsets: [0.5, 1.0, 1.5, 2.0],
        strengths: [0.8, 0.9, 0.7, 0.6],
      })),
      chromaExtractor: jest.fn(() => ({
        chroma: new Float32Array(12).fill(0.1),
      })),
      frameCutter: jest.fn(() => ({
        frames: [new Float32Array(1024).fill(0.1)],
      })),
    },

    // Helper methods
    arrayToVector: jest.fn((arr) => arr),
    vectorToArray: jest.fn((vec) => vec),

    // Module initialization
    initModule: jest.fn().mockResolvedValue(true),
    shutdown: jest.fn(),

    // Signal processing utilities
    FrameGenerator: jest
      .fn()
      .mockImplementation((signal, frameSize, hopSize) => {
        const frames = [];
        for (let i = 0; i <= signal.length - frameSize; i += hopSize) {
          frames.push(signal.slice(i, i + frameSize));
        }
        return {
          frames,
          frameSize,
          hopSize,
        };
      }),
  };

  return essentia;
};

// Export both default and named for different import styles
export default EssentiaMock;
export { EssentiaMock as Essentia };
