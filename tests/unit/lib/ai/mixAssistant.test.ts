/**
 * Comprehensive tests for IntelligentMixAssistant
 * Tests algorithmic mixing intelligence, harmonic analysis, and beat matching
 */

import {
  IntelligentMixAssistant,
  TrackAnalysis,
  CompatibilityScore,
  TransitionRecommendation,
} from "@/lib/ai/mixAssistant";

// Mock the MusicAnalyzer dependency
jest.mock("@/lib/audio/musicAnalyzer", () => ({
  MusicAnalyzer: jest.fn().mockImplementation(() => ({
    waitForInitialization: jest.fn().mockResolvedValue(undefined),
    extractBPM: jest.fn().mockResolvedValue({
      bpm: 128,
      confidence: 0.9,
      beatGrid: [0, 0.46875, 0.9375, 1.40625, 1.875, 2.34375, 2.8125, 3.28125],
      downbeats: [0, 1.875, 3.75, 5.625],
      phase: 0,
      timeSignature: [4, 4] as [number, number],
    }),
    detectKey: jest.fn().mockResolvedValue({
      key: "C",
      scale: "major" as const,
      confidence: 0.85,
      chroma: new Float32Array([1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1]),
      keyStrength: 0.75,
    }),
    getSpectralFeatures: jest.fn().mockResolvedValue({
      energy: 0.5,
      centroid: 2000,
      rolloff: 5000,
      bandwidth: 1500,
      flatness: 0.3,
      flux: 0.2,
      rms: 0.4,
      zcr: 0.1,
    }),
    detectOnsets: jest.fn().mockResolvedValue({
      onsets: [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5],
      strength: [0.8, 0.6, 0.9, 0.7, 0.8, 0.5, 0.7, 0.6],
      novelty: new Float32Array([0.1, 0.3, 0.8, 0.2, 0.9, 0.1, 0.7, 0.3]),
      peaks: [2, 4, 6],
    }),
    isCompatibleKey: jest.fn(),
    destroy: jest.fn(),
  })),
}));

describe("IntelligentMixAssistant", () => {
  let mixAssistant: IntelligentMixAssistant;
  let mockAudioBuffer: Float32Array;

  beforeEach(async () => {
    mixAssistant = new IntelligentMixAssistant();
    await mixAssistant.initialize();

    // Create mock audio buffer (30 seconds at 44.1kHz)
    mockAudioBuffer = new Float32Array(44100 * 30);
    for (let i = 0; i < mockAudioBuffer.length; i++) {
      // Create a simple sine wave with some variation
      mockAudioBuffer[i] =
        Math.sin((2 * Math.PI * 440 * i) / 44100) *
        (0.5 + 0.3 * Math.sin((2 * Math.PI * i) / 22050));
    }
  });

  afterEach(() => {
    mixAssistant.destroy();
  });

  describe("Initialization", () => {
    it("should initialize successfully", async () => {
      const newAssistant = new IntelligentMixAssistant();
      await expect(newAssistant.initialize()).resolves.not.toThrow();
      newAssistant.destroy();
    });
  });

  describe("Track Analysis", () => {
    it("should analyze a track and return complete analysis", async () => {
      const analysis = await mixAssistant.analyzeTrack(
        "test-track-1",
        mockAudioBuffer,
      );

      expect(analysis).toMatchObject({
        id: "test-track-1",
        bpm: expect.objectContaining({
          bpm: expect.any(Number),
          confidence: expect.any(Number),
          beatGrid: expect.any(Array),
          downbeats: expect.any(Array),
        }),
        key: expect.objectContaining({
          key: expect.any(String),
          scale: expect.stringMatching(/^(major|minor)$/),
          confidence: expect.any(Number),
        }),
        spectral: expect.objectContaining({
          energy: expect.any(Number),
          centroid: expect.any(Number),
          rolloff: expect.any(Number),
        }),
        energyProfile: expect.objectContaining({
          overall: expect.any(Number),
          intro: expect.any(Number),
          verse: expect.any(Number),
          chorus: expect.any(Number),
          breakdown: expect.any(Number),
          outro: expect.any(Number),
          curve: expect.any(Array),
          peakEnergy: expect.any(Number),
          energyVariance: expect.any(Number),
        }),
        phrases: expect.objectContaining({
          phrases: expect.any(Array),
          barLength: expect.any(Number),
          measureLength: expect.any(Number),
          sections: expect.any(Array),
        }),
        mixPoints: expect.any(Array),
      });

      // Verify energy profile is normalized (0-1 range)
      expect(analysis.energyProfile.overall).toBeGreaterThanOrEqual(0);
      expect(analysis.energyProfile.overall).toBeLessThanOrEqual(1);

      // Verify mix points have required properties
      analysis.mixPoints.forEach((point) => {
        expect(point).toMatchObject({
          time: expect.any(Number),
          score: expect.any(Number),
          type: expect.stringMatching(
            /^(intro|outro|breakdown|drop|phrase_start|phrase_end)$/,
          ),
          phraseAlignment: expect.any(Number),
          energy: expect.any(Number),
          confidence: expect.any(Number),
        });
        expect(point.score).toBeGreaterThanOrEqual(0);
        expect(point.score).toBeLessThanOrEqual(1);
      });
    });

    it("should detect phrase structure correctly", async () => {
      const analysis = await mixAssistant.analyzeTrack(
        "test-track-phrase",
        mockAudioBuffer,
      );

      expect(analysis.phrases.phrases.length).toBeGreaterThan(0);
      expect(analysis.phrases.barLength).toBeGreaterThan(0);
      expect(analysis.phrases.measureLength).toBeGreaterThan(0);

      // Verify phrase properties
      analysis.phrases.phrases.forEach((phrase) => {
        expect(phrase.startTime).toBeGreaterThanOrEqual(0);
        expect(phrase.endTime).toBeGreaterThan(phrase.startTime);
        expect(phrase.length).toBeGreaterThan(0);
        expect(phrase.energy).toBeGreaterThanOrEqual(0);
        expect([
          "intro",
          "verse",
          "chorus",
          "bridge",
          "breakdown",
          "outro",
        ]).toContain(phrase.type);
      });
    });
  });

  describe("Camelot Wheel Harmonic Compatibility", () => {
    beforeEach(() => {
      // Mock the isCompatibleKey method for specific test cases
      const mockIsCompatibleKey = (key1: string, key2: string): boolean => {
        // Implement basic Camelot wheel logic for testing
        const camelotMap: Record<
          string,
          { position: number; type: "A" | "B" }
        > = {
          "C major": { position: 8, type: "B" },
          "A minor": { position: 8, type: "A" },
          "G major": { position: 9, type: "B" },
          "E minor": { position: 9, type: "A" },
          "D major": { position: 10, type: "B" },
          "B minor": { position: 10, type: "A" },
          "F major": { position: 7, type: "B" },
          "D minor": { position: 7, type: "A" },
        };

        const c1 = camelotMap[key1];
        const c2 = camelotMap[key2];
        if (!c1 || !c2) return false;

        // Same position (relative major/minor)
        if (c1.position === c2.position) return true;

        // Adjacent positions
        const posDiff = Math.min(
          Math.abs(c1.position - c2.position),
          12 - Math.abs(c1.position - c2.position),
        );
        return posDiff === 1;
      };

      (mixAssistant as any).musicAnalyzer.isCompatibleKey.mockImplementation(
        mockIsCompatibleKey,
      );
    });

    it("should calculate perfect harmonic compatibility for same key", () => {
      const track1: Partial<TrackAnalysis> = {
        key: {
          key: "C",
          scale: "major",
          confidence: 0.9,
          chroma: new Float32Array(),
          keyStrength: 0.8,
        },
      };
      const track2: Partial<TrackAnalysis> = {
        key: {
          key: "C",
          scale: "major",
          confidence: 0.9,
          chroma: new Float32Array(),
          keyStrength: 0.8,
        },
      };

      const harmonic = (mixAssistant as any).calculateHarmonicCompatibility(
        track1.key,
        track2.key,
      );
      expect(harmonic).toBe(1.0);
    });

    it("should calculate high compatibility for relative major/minor", () => {
      const track1: Partial<TrackAnalysis> = {
        key: {
          key: "C",
          scale: "major",
          confidence: 0.9,
          chroma: new Float32Array(),
          keyStrength: 0.8,
        },
      };
      const track2: Partial<TrackAnalysis> = {
        key: {
          key: "A",
          scale: "minor",
          confidence: 0.9,
          chroma: new Float32Array(),
          keyStrength: 0.8,
        },
      };

      const harmonic = (mixAssistant as any).calculateHarmonicCompatibility(
        track1.key,
        track2.key,
      );
      expect(harmonic).toBe(0.9);
    });

    it("should calculate good compatibility for adjacent Camelot positions", () => {
      const track1: Partial<TrackAnalysis> = {
        key: {
          key: "C",
          scale: "major",
          confidence: 0.9,
          chroma: new Float32Array(),
          keyStrength: 0.8,
        },
      };
      const track2: Partial<TrackAnalysis> = {
        key: {
          key: "G",
          scale: "major",
          confidence: 0.9,
          chroma: new Float32Array(),
          keyStrength: 0.8,
        },
      };

      const harmonic = (mixAssistant as any).calculateHarmonicCompatibility(
        track1.key,
        track2.key,
      );
      expect(harmonic).toBeGreaterThanOrEqual(0.7);
    });

    it("should calculate lower compatibility for distant keys", () => {
      const track1: Partial<TrackAnalysis> = {
        key: {
          key: "C",
          scale: "major",
          confidence: 0.9,
          chroma: new Float32Array(),
          keyStrength: 0.8,
        },
      };
      const track2: Partial<TrackAnalysis> = {
        key: {
          key: "F#",
          scale: "major",
          confidence: 0.9,
          chroma: new Float32Array(),
          keyStrength: 0.8,
        },
      };

      const harmonic = (mixAssistant as any).calculateHarmonicCompatibility(
        track1.key,
        track2.key,
      );
      expect(harmonic).toBeLessThan(0.5);
    });
  });

  describe("BPM Matching and Tempo Adjustment", () => {
    it("should calculate perfect rhythmic compatibility for same BPM", () => {
      const bpm1 = {
        bpm: 128,
        confidence: 0.9,
        beatGrid: [],
        downbeats: [],
        phase: 0,
        timeSignature: [4, 4] as [number, number],
      };
      const bpm2 = {
        bpm: 128,
        confidence: 0.9,
        beatGrid: [],
        downbeats: [],
        phase: 0,
        timeSignature: [4, 4] as [number, number],
      };

      const rhythmic = (mixAssistant as any).calculateRhythmicCompatibility(
        bpm1,
        bpm2,
      );
      expect(rhythmic).toBe(1.0);
    });

    it("should calculate high compatibility within natural mixing range (±8%)", () => {
      const bpm1 = {
        bpm: 128,
        confidence: 0.9,
        beatGrid: [],
        downbeats: [],
        phase: 0,
        timeSignature: [4, 4] as [number, number],
      };
      const bpm2 = {
        bpm: 135,
        confidence: 0.9,
        beatGrid: [],
        downbeats: [],
        phase: 0,
        timeSignature: [4, 4] as [number, number],
      }; // +5.5%

      const rhythmic = (mixAssistant as any).calculateRhythmicCompatibility(
        bpm1,
        bpm2,
      );
      expect(rhythmic).toBeGreaterThanOrEqual(0.8);
    });

    it("should calculate tempo adjustment correctly", () => {
      const bpm1 = {
        bpm: 128,
        confidence: 0.9,
        beatGrid: [],
        downbeats: [],
        phase: 0,
        timeSignature: [4, 4] as [number, number],
      };
      const bpm2 = {
        bpm: 140,
        confidence: 0.9,
        beatGrid: [],
        downbeats: [],
        phase: 0,
        timeSignature: [4, 4] as [number, number],
      };

      const adjustment = (mixAssistant as any).calculateTempoAdjustment(
        bpm1,
        bpm2,
      );

      expect(adjustment).toMatchObject({
        originalBPM: 128,
        targetBPM: 140,
        adjustmentPercent: expect.any(Number),
        method: expect.stringMatching(/^(pitch_shift|time_stretch|sync_lock)$/),
        naturalRange: expect.any(Boolean),
      });

      expect(Math.abs(adjustment.adjustmentPercent - 12 / 128)).toBeLessThan(
        0.001,
      ); // 12 BPM difference
    });

    it("should recommend pitch_shift for natural range adjustments", () => {
      const bpm1 = {
        bpm: 128,
        confidence: 0.9,
        beatGrid: [],
        downbeats: [],
        phase: 0,
        timeSignature: [4, 4] as [number, number],
      };
      const bpm2 = {
        bpm: 132,
        confidence: 0.9,
        beatGrid: [],
        downbeats: [],
        phase: 0,
        timeSignature: [4, 4] as [number, number],
      }; // +3.1%

      const adjustment = (mixAssistant as any).calculateTempoAdjustment(
        bpm1,
        bpm2,
      );
      expect(adjustment.method).toBe("pitch_shift");
      expect(adjustment.naturalRange).toBe(true);
    });

    it("should recommend sync_lock for large tempo differences", () => {
      const bpm1 = {
        bpm: 128,
        confidence: 0.9,
        beatGrid: [],
        downbeats: [],
        phase: 0,
        timeSignature: [4, 4] as [number, number],
      };
      const bpm2 = {
        bpm: 170,
        confidence: 0.9,
        beatGrid: [],
        downbeats: [],
        phase: 0,
        timeSignature: [4, 4] as [number, number],
      }; // +32.8%

      const adjustment = (mixAssistant as any).calculateTempoAdjustment(
        bpm1,
        bpm2,
      );
      expect(adjustment.method).toBe("sync_lock");
      expect(adjustment.naturalRange).toBe(false);
    });
  });

  describe("Energy Level Analysis", () => {
    it("should analyze energy profile correctly", async () => {
      const analysis = await mixAssistant.analyzeTrack(
        "test-energy",
        mockAudioBuffer,
      );

      expect(analysis.energyProfile.overall).toBeGreaterThanOrEqual(0);
      expect(analysis.energyProfile.overall).toBeLessThanOrEqual(1);
      expect(analysis.energyProfile.curve.length).toBeGreaterThan(0);
      expect(analysis.energyProfile.peakEnergy).toBeGreaterThanOrEqual(
        analysis.energyProfile.overall,
      );
      expect(analysis.energyProfile.energyVariance).toBeGreaterThanOrEqual(0);

      // All energy values should be normalized 0-1
      ["intro", "verse", "chorus", "breakdown", "outro"].forEach((section) => {
        const value =
          analysis.energyProfile[
            section as keyof typeof analysis.energyProfile
          ];
        if (typeof value === "number") {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
      });
    });

    it("should calculate energetic compatibility correctly", () => {
      const energy1 = {
        overall: 0.7,
        intro: 0.3,
        verse: 0.6,
        chorus: 0.9,
        breakdown: 0.2,
        outro: 0.4,
        curve: [0.3, 0.5, 0.7, 0.9, 0.8, 0.4],
        peakEnergy: 0.9,
        energyVariance: 0.1,
      };

      const energy2 = {
        overall: 0.75,
        intro: 0.35,
        verse: 0.65,
        chorus: 0.85,
        breakdown: 0.25,
        outro: 0.45,
        curve: [0.35, 0.55, 0.75, 0.85, 0.75, 0.45],
        peakEnergy: 0.85,
        energyVariance: 0.08,
      };

      const compatibility = (
        mixAssistant as any
      ).calculateEnergeticCompatibility(energy1, energy2);
      expect(compatibility).toBeGreaterThan(0.8); // Very similar energy profiles
    });
  });

  describe("Mix Point Detection", () => {
    it("should identify appropriate mix points", async () => {
      const analysis = await mixAssistant.analyzeTrack(
        "test-mixpoints",
        mockAudioBuffer,
      );

      expect(analysis.mixPoints.length).toBeGreaterThan(0);

      analysis.mixPoints.forEach((point) => {
        expect(point.time).toBeGreaterThanOrEqual(0);
        expect(point.score).toBeGreaterThanOrEqual(0);
        expect(point.score).toBeLessThanOrEqual(1);
        expect(point.confidence).toBeGreaterThanOrEqual(0);
        expect(point.confidence).toBeLessThanOrEqual(1);
        expect([8, 16, 32]).toContain(point.phraseAlignment);
      });

      // Mix points should be sorted by score (highest first)
      for (let i = 1; i < analysis.mixPoints.length; i++) {
        expect(analysis.mixPoints[i].score).toBeLessThanOrEqual(
          analysis.mixPoints[i - 1].score,
        );
      }
    });

    it("should find compatible mix points between tracks", async () => {
      const track1 = await mixAssistant.analyzeTrack("track1", mockAudioBuffer);
      const track2 = await mixAssistant.analyzeTrack("track2", mockAudioBuffer);

      const compatible = (mixAssistant as any).findCompatibleMixPoints(
        track1,
        track2,
      );

      compatible.forEach((point: any) => {
        expect(track1.mixPoints).toContain(point);
      });
    });
  });

  describe("Track Compatibility Scoring", () => {
    it("should calculate overall compatibility score", async () => {
      // Analyze two tracks
      await mixAssistant.analyzeTrack("track1", mockAudioBuffer);
      await mixAssistant.analyzeTrack("track2", mockAudioBuffer);

      const compatibility = mixAssistant.calculateCompatibility(
        "track1",
        "track2",
      );

      expect(compatibility).toMatchObject({
        overall: expect.any(Number),
        harmonic: expect.any(Number),
        rhythmic: expect.any(Number),
        energetic: expect.any(Number),
        spectral: expect.any(Number),
        details: expect.objectContaining({
          keyCompatibility: expect.any(Boolean),
          bpmDifference: expect.any(Number),
          energyMatch: expect.any(Number),
          frequencyClash: expect.any(Number),
          compatibleMixPoints: expect.any(Array),
        }),
      });

      // All scores should be 0-1
      expect(compatibility.overall).toBeGreaterThanOrEqual(0);
      expect(compatibility.overall).toBeLessThanOrEqual(1);
      expect(compatibility.harmonic).toBeGreaterThanOrEqual(0);
      expect(compatibility.harmonic).toBeLessThanOrEqual(1);
      expect(compatibility.rhythmic).toBeGreaterThanOrEqual(0);
      expect(compatibility.rhythmic).toBeLessThanOrEqual(1);
      expect(compatibility.energetic).toBeGreaterThanOrEqual(0);
      expect(compatibility.energetic).toBeLessThanOrEqual(1);
      expect(compatibility.spectral).toBeGreaterThanOrEqual(0);
      expect(compatibility.spectral).toBeLessThanOrEqual(1);
    });

    it("should throw error for non-existent tracks", () => {
      expect(() => {
        mixAssistant.calculateCompatibility("non-existent-1", "non-existent-2");
      }).toThrow();
    });
  });

  describe("Transition Recommendations", () => {
    beforeEach(async () => {
      // Analyze multiple tracks for transition testing
      await mixAssistant.analyzeTrack("track1", mockAudioBuffer);
      await mixAssistant.analyzeTrack("track2", mockAudioBuffer);
      await mixAssistant.analyzeTrack("track3", mockAudioBuffer);
    });

    it("should generate intelligent transition recommendation", () => {
      const recommendation = mixAssistant.generateTransition(
        "track1",
        "track2",
      );

      expect(recommendation).toMatchObject({
        fromTrack: "track1",
        toTrack: "track2",
        fromMixPoint: expect.objectContaining({
          time: expect.any(Number),
          type: expect.any(String),
        }),
        toMixPoint: expect.objectContaining({
          time: expect.any(Number),
          type: expect.any(String),
        }),
        tempoAdjustment: expect.objectContaining({
          originalBPM: expect.any(Number),
          targetBPM: expect.any(Number),
          method: expect.stringMatching(
            /^(pitch_shift|time_stretch|sync_lock)$/,
          ),
        }),
        effects: expect.any(Array),
        crossfadeTime: expect.any(Number),
        compatibility: expect.any(Object),
        confidence: expect.any(Number),
      });

      expect(recommendation.confidence).toBeGreaterThanOrEqual(0);
      expect(recommendation.confidence).toBeLessThanOrEqual(1);
      expect(recommendation.crossfadeTime).toBeGreaterThan(0);
    });

    it("should generate effect recommendations based on track characteristics", () => {
      const recommendation = mixAssistant.generateTransition(
        "track1",
        "track2",
      );

      recommendation.effects.forEach((effect) => {
        expect(effect).toMatchObject({
          type: expect.stringMatching(
            /^(highpass|lowpass|reverb|delay|filter_sweep|echo|gate)$/,
          ),
          intensity: expect.any(Number),
          timing: expect.stringMatching(/^(intro|transition|outro)$/),
          duration: expect.any(Number),
          automation: expect.any(Array),
        });

        expect(effect.intensity).toBeGreaterThanOrEqual(0);
        expect(effect.intensity).toBeLessThanOrEqual(1);
        expect(effect.duration).toBeGreaterThan(0);

        effect.automation.forEach((auto) => {
          expect(auto).toMatchObject({
            parameter: expect.any(String),
            startValue: expect.any(Number),
            endValue: expect.any(Number),
            curve: expect.stringMatching(/^(linear|exponential|logarithmic)$/),
            startTime: expect.any(Number),
            endTime: expect.any(Number),
          });
        });
      });
    });

    it("should provide real-time mix suggestions", () => {
      const suggestions = mixAssistant.getRealTimeMixSuggestions(
        "track1",
        10, // current time: 10 seconds
        ["track2", "track3"],
      );

      expect(Array.isArray(suggestions)).toBe(true);

      suggestions.forEach((suggestion) => {
        expect(suggestion.fromTrack).toBe("track1");
        expect(["track2", "track3"]).toContain(suggestion.toTrack);
        expect(suggestion.confidence).toBeGreaterThan(0.6); // Should be high-confidence only
      });

      // Should be sorted by quality (confidence + compatibility)
      for (let i = 1; i < suggestions.length; i++) {
        const prev = suggestions[i - 1];
        const curr = suggestions[i];
        expect(
          prev.confidence + prev.compatibility.overall,
        ).toBeGreaterThanOrEqual(curr.confidence + curr.compatibility.overall);
      }
    });
  });

  describe("Beat Matching", () => {
    it("should calculate optimal beat sync points", async () => {
      const track1 = await mixAssistant.analyzeTrack(
        "sync-track-1",
        mockAudioBuffer,
      );
      const track2 = await mixAssistant.analyzeTrack(
        "sync-track-2",
        mockAudioBuffer,
      );

      const beatmatch = mixAssistant.calculateBeatmatch(track1, track2);

      expect(beatmatch).toMatchObject({
        syncPoint: expect.any(Number),
        tempoAdjustment: expect.objectContaining({
          method: expect.stringMatching(
            /^(pitch_shift|time_stretch|sync_lock)$/,
          ),
        }),
        phaseAlignment: expect.any(Number),
      });

      expect(beatmatch.syncPoint).toBeGreaterThanOrEqual(0);
      expect(beatmatch.phaseAlignment).toBeGreaterThanOrEqual(-1);
      expect(beatmatch.phaseAlignment).toBeLessThanOrEqual(1);
    });
  });

  describe("Performance and Edge Cases", () => {
    it("should handle empty audio buffers gracefully", async () => {
      const emptyBuffer = new Float32Array(0);

      await expect(
        mixAssistant.analyzeTrack("empty-track", emptyBuffer),
      ).resolves.not.toThrow();
    });

    it("should handle very short audio buffers", async () => {
      const shortBuffer = new Float32Array(1024); // Very short buffer

      const analysis = await mixAssistant.analyzeTrack(
        "short-track",
        shortBuffer,
      );
      expect(analysis.id).toBe("short-track");
      expect(analysis.mixPoints).toBeDefined();
    });

    it("should clean up resources properly", () => {
      const testAssistant = new IntelligentMixAssistant();
      expect(() => testAssistant.destroy()).not.toThrow();
    });

    it("should handle concurrent track analyses", async () => {
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          mixAssistant.analyzeTrack(`concurrent-${i}`, mockAudioBuffer),
        );
      }

      const results = await Promise.all(promises);
      expect(results).toHaveLength(5);

      results.forEach((result, index) => {
        expect(result.id).toBe(`concurrent-${index}`);
      });
    });
  });

  describe("Algorithm Accuracy", () => {
    it("should maintain consistent analysis results for same input", async () => {
      const analysis1 = await mixAssistant.analyzeTrack(
        "consistency-test-1",
        mockAudioBuffer,
      );
      const analysis2 = await mixAssistant.analyzeTrack(
        "consistency-test-2",
        mockAudioBuffer,
      );

      // Same input should produce same analysis (excluding track ID)
      expect(analysis1.bpm.bpm).toBeCloseTo(analysis2.bpm.bpm, 1);
      expect(analysis1.key.key).toBe(analysis2.key.key);
      expect(analysis1.key.scale).toBe(analysis2.key.scale);
      expect(analysis1.energyProfile.overall).toBeCloseTo(
        analysis2.energyProfile.overall,
        2,
      );
    });

    it("should calculate crossfade times based on phrase structure", () => {
      const fromMixPoint = {
        time: 32,
        score: 0.9,
        type: "outro" as const,
        phraseAlignment: 16,
        energy: 0.5,
        confidence: 0.8,
      };

      const toMixPoint = {
        time: 0,
        score: 0.8,
        type: "intro" as const,
        phraseAlignment: 16,
        energy: 0.6,
        confidence: 0.7,
      };

      const bpm = {
        bpm: 128,
        confidence: 0.9,
        beatGrid: [],
        downbeats: [],
        phase: 0,
        timeSignature: [4, 4] as [number, number],
      };

      const crossfadeTime = (mixAssistant as any).calculateCrossfadeTime(
        fromMixPoint,
        toMixPoint,
        bpm,
      );

      expect(crossfadeTime).toBeGreaterThan(0);
      expect(crossfadeTime).toBeLessThan(60); // Should be reasonable duration

      // Should be musically aligned (multiple of bar duration)
      const barDuration = (60 / bpm.bpm) * 4;
      const bars = crossfadeTime / barDuration;
      expect(bars % 1).toBeCloseTo(0, 1); // Should be close to whole number of bars
    });
  });
});
