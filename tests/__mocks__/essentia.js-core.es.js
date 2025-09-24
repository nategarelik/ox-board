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
      BeatTrackerDegara: jest.fn().mockReturnValue({
        compute: jest.fn().mockReturnValue({
          ticks: new Float32Array([0, 0.5, 1, 1.5]),
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
