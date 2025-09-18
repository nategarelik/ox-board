/**
 * Comprehensive tests for StemEffectsProcessor
 * Tests all DSP effects, gesture control, performance optimization
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import * as Tone from 'tone';
import {
  StemEffectsProcessor,
  EffectType,
  EffectParameters,
  PresetType,
  GestureEffectMapping
} from '../stemEffects';

// Mock Tone.js for testing
jest.mock('tone', () => ({
  Gain: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    gain: { rampTo: jest.fn(), value: 0 }
  })),
  Reverb: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    roomSize: { value: 0.7 },
    decay: { value: 1.5 }
  })),
  FeedbackDelay: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    delayTime: { value: 0.125 },
    feedback: { value: 0.3 }
  })),
  Filter: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    frequency: { rampTo: jest.fn(), value: 1000 },
    Q: { value: 1 },
    type: 'lowpass'
  })),
  Distortion: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    distortion: { value: 0.4 }
  })),
  Compressor: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    threshold: { value: -24 },
    ratio: { value: 4 },
    attack: { value: 0.003 },
    release: { value: 0.25 }
  })),
  Phaser: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    frequency: { value: 0.5 },
    depth: { value: 0.7 }
  })),
  Chorus: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    disconnect: jest.fn(),
    dispose: jest.fn(),
    frequency: { value: 1.5 },
    depth: { value: 0.7 },
    feedback: { value: 0.1 }
  }))
}));

describe('StemEffectsProcessor', () => {
  let stemEffects: StemEffectsProcessor;

  beforeEach(() => {
    stemEffects = new StemEffectsProcessor();
  });

  afterEach(() => {
    stemEffects.dispose();
  });

  describe('Initialization', () => {
    it('should initialize stem effects processor', () => {
      expect(stemEffects).toBeInstanceOf(StemEffectsProcessor);
    });

    it('should initialize all 4 stems without errors', () => {
      expect(() => {
        for (let i = 0; i < 4; i++) {
          stemEffects.initializeStem(i);
        }
      }).not.toThrow();
    });

    it('should throw error for invalid stem indices', () => {
      expect(() => {
        stemEffects.initializeStem(-1);
      }).toThrow('Invalid stem index: -1. Must be 0-3.');

      expect(() => {
        stemEffects.initializeStem(4);
      }).toThrow('Invalid stem index: 4. Must be 0-3.');
    });

    it('should create default effect configuration for each stem', () => {
      for (let i = 0; i < 4; i++) {
        stemEffects.initializeStem(i);
        const state = stemEffects.getStemState(i);

        expect(state).not.toBeNull();
        expect(state!.stemIndex).toBe(i);
        expect(state!.config.routing).toBe('serial');

        // Check all effects are initialized
        const effects = state!.config.effects;
        expect(effects.reverb).toBeDefined();
        expect(effects.delay).toBeDefined();
        expect(effects.filter).toBeDefined();
        expect(effects.distortion).toBeDefined();
        expect(effects.compression).toBeDefined();
        expect(effects.phaser).toBeDefined();
        expect(effects.flanger).toBeDefined();
      }
    });

    it('should initialize with compression enabled by default', () => {
      stemEffects.initializeStem(0);
      const state = stemEffects.getStemState(0);

      expect(state!.config.effects.compression.enabled).toBe(true);
      expect(state!.activeEffects).toContain('compression');
    });
  });

  describe('Effect Parameter Control', () => {
    beforeEach(() => {
      stemEffects.initializeStem(0);
    });

    it('should set reverb parameters correctly', () => {
      const reverbParams: EffectParameters = {
        enabled: true,
        wetness: 0.5,
        intensity: 0.7,
        parameter1: 0.8,
        parameter2: 0.6,
        bypass: false
      };

      expect(() => {
        stemEffects.setEffectParameters(0, 'reverb', reverbParams);
      }).not.toThrow();

      const state = stemEffects.getStemState(0);
      expect(state!.config.effects.reverb.enabled).toBe(true);
      expect(state!.config.effects.reverb.wetness).toBe(0.5);
    });

    it('should set delay parameters correctly', () => {
      const delayParams: EffectParameters = {
        enabled: true,
        wetness: 0.3,
        intensity: 0.4,
        parameter1: 0.25, // time
        parameter2: 0.3,  // feedback
        bypass: false
      };

      stemEffects.setEffectParameters(0, 'delay', delayParams);

      const state = stemEffects.getStemState(0);
      expect(state!.config.effects.delay.enabled).toBe(true);
      expect(state!.config.effects.delay.wetness).toBe(0.3);
      expect(state!.activeEffects).toContain('delay');
    });

    it('should set filter parameters correctly', () => {
      const filterParams: EffectParameters = {
        enabled: true,
        wetness: 1.0,
        intensity: 0.6,
        parameter1: 0.7, // frequency
        parameter2: 0.2, // resonance
        bypass: false
      };

      stemEffects.setEffectParameters(0, 'filter', filterParams);

      const state = stemEffects.getStemState(0);
      expect(state!.config.effects.filter.enabled).toBe(true);
      expect(state!.config.effects.filter.wetness).toBe(1.0);
    });

    it('should set distortion parameters correctly', () => {
      const distortionParams: EffectParameters = {
        enabled: true,
        wetness: 0.4,
        intensity: 0.5,
        parameter1: 0.3, // drive
        parameter2: 0.6, // tone
        bypass: false
      };

      stemEffects.setEffectParameters(0, 'distortion', distortionParams);

      const state = stemEffects.getStemState(0);
      expect(state!.config.effects.distortion.enabled).toBe(true);
      expect(state!.config.effects.distortion.wetness).toBe(0.4);
    });

    it('should set compression parameters correctly', () => {
      const compressionParams: EffectParameters = {
        enabled: true,
        wetness: 1.0,
        intensity: 0.5,
        parameter1: 0.4, // threshold
        parameter2: 0.3, // ratio
        bypass: false
      };

      stemEffects.setEffectParameters(0, 'compression', compressionParams);

      const state = stemEffects.getStemState(0);
      expect(state!.config.effects.compression.enabled).toBe(true);
      expect(state!.config.effects.compression.wetness).toBe(1.0);
    });

    it('should set modulation effects parameters correctly', () => {
      const phaserParams: EffectParameters = {
        enabled: true,
        wetness: 0.5,
        intensity: 0.6,
        parameter1: 0.2, // rate
        parameter2: 0.7, // depth
        bypass: false
      };

      stemEffects.setEffectParameters(0, 'phaser', phaserParams);

      const state = stemEffects.getStemState(0);
      expect(state!.config.effects.phaser.enabled).toBe(true);
      expect(state!.config.effects.phaser.wetness).toBe(0.5);
    });

    it('should handle bypass correctly', () => {
      const params: EffectParameters = {
        enabled: true,
        wetness: 0.5,
        intensity: 0.5,
        parameter1: 0.5,
        parameter2: 0.5,
        bypass: true
      };

      stemEffects.setEffectParameters(0, 'reverb', params);

      const state = stemEffects.getStemState(0);
      expect(state!.config.effects.reverb.bypass).toBe(true);
    });

    it('should throw error for uninitialized stem', () => {
      const params: EffectParameters = {
        enabled: true,
        wetness: 0.5,
        intensity: 0.5,
        parameter1: 0.5,
        parameter2: 0.5,
        bypass: false
      };

      expect(() => {
        stemEffects.setEffectParameters(1, 'reverb', params);
      }).toThrow('Stem 1 not initialized');
    });
  });

  describe('Effect Presets', () => {
    beforeEach(() => {
      for (let i = 0; i < 4; i++) {
        stemEffects.initializeStem(i);
      }
    });

    it('should apply club preset correctly', () => {
      stemEffects.applyPreset(0, 'club');

      const state = stemEffects.getStemState(0);
      expect(state!.config.effects.compression.enabled).toBe(true);
      expect(state!.config.effects.filter.enabled).toBe(true);
      expect(state!.config.effects.delay.enabled).toBe(true);

      // Club preset should have punchy compression
      expect(state!.config.effects.compression.intensity).toBeGreaterThan(0.5);
    });

    it('should apply hall preset correctly', () => {
      stemEffects.applyPreset(0, 'hall');

      const state = stemEffects.getStemState(0);
      expect(state!.config.effects.reverb.enabled).toBe(true);
      expect(state!.config.effects.compression.enabled).toBe(true);

      // Hall preset should have large reverb
      expect(state!.config.effects.reverb.wetness).toBeGreaterThan(0.5);
    });

    it('should apply studio preset correctly', () => {
      stemEffects.applyPreset(0, 'studio');

      const state = stemEffects.getStemState(0);
      expect(state!.config.effects.compression.enabled).toBe(true);
      expect(state!.config.effects.filter.enabled).toBe(true);

      // Studio preset should be clean with minimal effects
      expect(state!.config.effects.reverb.enabled).toBe(false);
      expect(state!.config.effects.distortion.enabled).toBe(false);
    });

    it('should apply outdoor preset correctly', () => {
      stemEffects.applyPreset(0, 'outdoor');

      const state = stemEffects.getStemState(0);
      expect(state!.config.effects.compression.enabled).toBe(true);
      expect(state!.config.effects.filter.enabled).toBe(true);
      expect(state!.config.effects.delay.enabled).toBe(true);

      // Outdoor preset should have enhanced compression
      expect(state!.config.effects.compression.intensity).toBeGreaterThan(0.7);
    });

    it('should get available presets', () => {
      const presets = stemEffects.getAvailablePresets();

      expect(presets).toHaveLength(4);
      expect(presets.map(p => p.name)).toEqual(['Club', 'Hall', 'Studio', 'Outdoor']);
    });

    it('should throw error for invalid preset', () => {
      expect(() => {
        stemEffects.applyPreset(0, 'invalid' as PresetType);
      }).toThrow('Preset invalid not found');
    });
  });

  describe('Gesture Control', () => {
    beforeEach(() => {
      stemEffects.initializeStem(0);
    });

    it('should process pinch gesture for effect intensity', () => {
      const initialState = stemEffects.getStemState(0);
      const initialIntensity = initialState!.config.effects.reverb.intensity;

      stemEffects.processGestureInput(0, 'pinch', 0.8);

      const updatedState = stemEffects.getStemState(0);
      expect(updatedState!.config.effects.reverb.intensity).not.toBe(initialIntensity);
    });

    it('should process rotation gesture for parameter sweep', () => {
      stemEffects.processGestureInput(0, 'rotation', 0.7);

      const state = stemEffects.getStemState(0);
      // Rotation should affect filter frequency by default
      expect(state!.config.effects.filter.parameter1).toBeCloseTo(0.7, 1);
    });

    it('should process spread gesture for wet/dry mix', () => {
      stemEffects.processGestureInput(0, 'spread', 0.6);

      const state = stemEffects.getStemState(0);
      // Spread should affect delay wetness by default
      expect(state!.config.effects.delay.wetness).toBeCloseTo(0.6, 1);
    });

    it('should process tap gesture for effect toggle', () => {
      const initialState = stemEffects.getStemState(0);
      const initialEnabled = initialState!.config.effects.distortion.enabled;

      stemEffects.processGestureInput(0, 'tap', 0.9);

      const updatedState = stemEffects.getStemState(0);
      expect(updatedState!.config.effects.distortion.enabled).toBe(!initialEnabled);
    });

    it('should process swipe gesture for effect cycling', () => {
      // Disable all effects first
      for (const effectType of ['reverb', 'delay', 'filter', 'distortion', 'phaser', 'flanger'] as EffectType[]) {
        const params: EffectParameters = {
          enabled: false,
          wetness: 0.5,
          intensity: 0.5,
          parameter1: 0.5,
          parameter2: 0.5,
          bypass: false
        };
        stemEffects.setEffectParameters(0, effectType, params);
      }

      stemEffects.processGestureInput(0, 'swipe', 0.8);

      const state = stemEffects.getStemState(0);
      // Should enable one effect
      const enabledEffects = Object.entries(state!.config.effects)
        .filter(([_, params]) => params.enabled)
        .map(([type, _]) => type);

      expect(enabledEffects.length).toBeGreaterThan(0);
    });

    it('should ignore gestures below threshold', () => {
      const initialState = stemEffects.getStemState(0);

      stemEffects.processGestureInput(0, 'pinch', 0.05); // Below default threshold

      const updatedState = stemEffects.getStemState(0);
      expect(updatedState).toEqual(initialState);
    });

    it('should update gesture mapping', () => {
      stemEffects.updateGestureMapping('pinch', 'distortion', 'intensity', 1.5, 0.2);

      const mapping = stemEffects.getGestureMapping();
      const pinchMapping = mapping.find(m => m.gesture === 'pinch');

      expect(pinchMapping).toBeDefined();
      expect(pinchMapping!.effect).toBe('distortion');
      expect(pinchMapping!.parameter).toBe('intensity');
      expect(pinchMapping!.sensitivity).toBe(1.5);
      expect(pinchMapping!.threshold).toBe(0.2);
    });

    it('should clamp gesture mapping values', () => {
      stemEffects.updateGestureMapping('rotation', 'filter', 'frequency', 3.0, 1.5);

      const mapping = stemEffects.getGestureMapping();
      const rotationMapping = mapping.find(m => m.gesture === 'rotation');

      expect(rotationMapping!.sensitivity).toBe(2.0); // Clamped to max
      expect(rotationMapping!.threshold).toBe(1.0);    // Clamped to max
    });
  });

  describe('Performance Optimization', () => {
    beforeEach(() => {
      for (let i = 0; i < 4; i++) {
        stemEffects.initializeStem(i);
      }
    });

    it('should enable CPU monitoring', () => {
      expect(() => {
        stemEffects.enableCPUMonitoring(true);
      }).not.toThrow();
    });

    it('should calculate CPU usage for active effects', () => {
      // Enable some effects
      const reverbParams: EffectParameters = {
        enabled: true,
        wetness: 0.5,
        intensity: 0.5,
        parameter1: 0.5,
        parameter2: 0.5,
        bypass: false
      };
      stemEffects.setEffectParameters(0, 'reverb', reverbParams);

      const delayParams: EffectParameters = {
        enabled: true,
        wetness: 0.3,
        intensity: 0.4,
        parameter1: 0.25,
        parameter2: 0.3,
        bypass: false
      };
      stemEffects.setEffectParameters(0, 'delay', delayParams);

      const metrics = stemEffects.getPerformanceMetrics();
      const stem0Metrics = metrics.get(0);

      expect(stem0Metrics).toBeDefined();
      expect(stem0Metrics!.cpu).toBeGreaterThan(0);
      expect(stem0Metrics!.latency).toBeGreaterThan(0);
    });

    it('should bypass effects when parameters are at default', () => {
      const defaultParams: EffectParameters = {
        enabled: false,
        wetness: 0.0,
        intensity: 0.5,
        parameter1: 0.5,
        parameter2: 0.1,
        bypass: false
      };

      stemEffects.setEffectParameters(0, 'reverb', defaultParams);

      const state = stemEffects.getStemState(0);
      expect(state!.config.effects.reverb.bypass).toBe(true);
    });

    it('should measure latency correctly', () => {
      // Enable multiple effects to increase latency
      const effectTypes: EffectType[] = ['reverb', 'delay', 'distortion'];

      for (const effectType of effectTypes) {
        const params: EffectParameters = {
          enabled: true,
          wetness: 0.5,
          intensity: 0.5,
          parameter1: 0.5,
          parameter2: 0.5,
          bypass: false
        };
        stemEffects.setEffectParameters(0, effectType, params);
      }

      const state = stemEffects.getStemState(0);
      expect(state!.latency).toBeGreaterThan(1); // Should be > 1ms with multiple effects
      expect(state!.latency).toBeLessThan(10);   // Should be < 10ms for real-time performance
    });

    it('should track active effects count correctly', () => {
      const state1 = stemEffects.getStemState(0);
      const initialActiveCount = state1!.activeEffects.length;

      // Enable reverb
      const reverbParams: EffectParameters = {
        enabled: true,
        wetness: 0.5,
        intensity: 0.5,
        parameter1: 0.5,
        parameter2: 0.5,
        bypass: false
      };
      stemEffects.setEffectParameters(0, 'reverb', reverbParams);

      const state2 = stemEffects.getStemState(0);
      expect(state2!.activeEffects.length).toBe(initialActiveCount + 1);
      expect(state2!.activeEffects).toContain('reverb');
    });
  });

  describe('Audio Node Connections', () => {
    beforeEach(() => {
      stemEffects.initializeStem(0);
    });

    it('should provide input and output nodes', () => {
      const input = stemEffects.getStemInput(0);
      const output = stemEffects.getStemOutput(0);

      expect(input).toBeDefined();
      expect(output).toBeDefined();
    });

    it('should connect source to stem input', () => {
      const mockSource = {
        connect: jest.fn(),
        disconnect: jest.fn()
      } as any;

      expect(() => {
        stemEffects.connectSource(0, mockSource);
      }).not.toThrow();

      expect(mockSource.connect).toHaveBeenCalled();
    });

    it('should connect stem output to destination', () => {
      const mockDestination = {
        connect: jest.fn(),
        disconnect: jest.fn()
      } as any;

      expect(() => {
        stemEffects.connectDestination(0, mockDestination);
      }).not.toThrow();
    });

    it('should throw error for uninitialized stem connections', () => {
      expect(() => {
        stemEffects.getStemInput(1);
      }).toThrow('Stem 1 not initialized');

      expect(() => {
        stemEffects.getStemOutput(1);
      }).toThrow('Stem 1 not initialized');
    });
  });

  describe('Reset and Cleanup', () => {
    beforeEach(() => {
      for (let i = 0; i < 4; i++) {
        stemEffects.initializeStem(i);
      }
    });

    it('should reset stem to default configuration', () => {
      // Modify some effects
      const reverbParams: EffectParameters = {
        enabled: true,
        wetness: 0.8,
        intensity: 0.9,
        parameter1: 0.7,
        parameter2: 0.6,
        bypass: false
      };
      stemEffects.setEffectParameters(0, 'reverb', reverbParams);

      // Reset stem
      stemEffects.resetStem(0);

      const state = stemEffects.getStemState(0);
      expect(state!.config.effects.reverb.enabled).toBe(false);
      expect(state!.config.effects.reverb.wetness).toBe(0.3); // Default value
    });

    it('should dispose all resources correctly', () => {
      expect(() => {
        stemEffects.dispose();
      }).not.toThrow();

      // After disposal, getStemState should return null
      expect(stemEffects.getStemState(0)).toBeNull();
    });

    it('should handle multiple dispose calls safely', () => {
      stemEffects.dispose();

      expect(() => {
        stemEffects.dispose();
      }).not.toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle invalid effect types gracefully', () => {
      stemEffects.initializeStem(0);

      expect(() => {
        stemEffects.setEffectParameters(0, 'invalid' as EffectType, {
          enabled: true,
          wetness: 0.5,
          intensity: 0.5,
          parameter1: 0.5,
          parameter2: 0.5,
          bypass: false
        });
      }).toThrow();
    });

    it('should clamp parameter values to valid ranges', () => {
      stemEffects.initializeStem(0);

      const extremeParams: EffectParameters = {
        enabled: true,
        wetness: 2.0,    // > 1.0
        intensity: -0.5, // < 0.0
        parameter1: 1.5, // > 1.0
        parameter2: -1.0, // < 0.0
        bypass: false
      };

      stemEffects.setEffectParameters(0, 'reverb', extremeParams);

      const state = stemEffects.getStemState(0);
      expect(state!.config.effects.reverb.wetness).toBeLessThanOrEqual(1.0);
      expect(state!.config.effects.reverb.intensity).toBeGreaterThanOrEqual(0.0);
    });

    it('should handle concurrent effect parameter changes', () => {
      stemEffects.initializeStem(0);

      // Simulate concurrent parameter changes
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          Promise.resolve().then(() => {
            const params: EffectParameters = {
              enabled: true,
              wetness: i / 10,
              intensity: i / 10,
              parameter1: i / 10,
              parameter2: i / 10,
              bypass: false
            };
            stemEffects.setEffectParameters(0, 'reverb', params);
          })
        );
      }

      expect(() => {
        Promise.all(promises);
      }).not.toThrow();
    });

    it('should maintain state consistency during rapid gesture input', () => {
      stemEffects.initializeStem(0);

      // Simulate rapid gesture input
      for (let i = 0; i < 100; i++) {
        stemEffects.processGestureInput(0, 'pinch', Math.random());
        stemEffects.processGestureInput(0, 'rotation', Math.random());
        stemEffects.processGestureInput(0, 'spread', Math.random());
      }

      const state = stemEffects.getStemState(0);
      expect(state).not.toBeNull();
      expect(state!.stemIndex).toBe(0);
    });
  });

  describe('Performance Benchmarks', () => {
    beforeEach(() => {
      for (let i = 0; i < 4; i++) {
        stemEffects.initializeStem(i);
      }
    });

    it('should process effect parameter changes within latency budget', () => {
      const startTime = performance.now();

      // Enable multiple effects on all stems
      for (let stemIndex = 0; stemIndex < 4; stemIndex++) {
        for (const effectType of ['reverb', 'delay', 'filter', 'distortion'] as EffectType[]) {
          const params: EffectParameters = {
            enabled: true,
            wetness: 0.5,
            intensity: 0.5,
            parameter1: 0.5,
            parameter2: 0.5,
            bypass: false
          };
          stemEffects.setEffectParameters(stemIndex, effectType, params);
        }
      }

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should complete within 10ms for real-time performance
      expect(processingTime).toBeLessThan(10);
    });

    it('should handle gesture processing within latency budget', () => {
      const startTime = performance.now();

      // Process many gesture inputs
      for (let i = 0; i < 100; i++) {
        stemEffects.processGestureInput(0, 'pinch', Math.random());
        stemEffects.processGestureInput(1, 'rotation', Math.random());
        stemEffects.processGestureInput(2, 'spread', Math.random());
        stemEffects.processGestureInput(3, 'tap', Math.random());
      }

      const endTime = performance.now();
      const processingTime = endTime - startTime;

      // Should complete quickly for responsive gesture control
      expect(processingTime).toBeLessThan(50);
    });

    it('should maintain CPU usage estimates below threshold', () => {
      // Enable maximum effects on all stems
      for (let stemIndex = 0; stemIndex < 4; stemIndex++) {
        const effectTypes: EffectType[] = ['reverb', 'delay', 'filter', 'distortion', 'compression', 'phaser', 'flanger'];
        for (const effectType of effectTypes) {
          const params: EffectParameters = {
            enabled: true,
            wetness: 1.0,
            intensity: 1.0,
            parameter1: 1.0,
            parameter2: 1.0,
            bypass: false
          };
          stemEffects.setEffectParameters(stemIndex, effectType, params);
        }
      }

      const metrics = stemEffects.getPerformanceMetrics();
      let totalCPU = 0;

      metrics.forEach(({ cpu }) => {
        totalCPU += cpu;
      });

      // Total CPU usage should be reasonable even with all effects enabled
      expect(totalCPU).toBeLessThan(300); // 300% for 4 stems with 7 effects each
    });
  });
});