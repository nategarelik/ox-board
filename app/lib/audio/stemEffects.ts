/**
 * StemEffectsProcessor - Independent effects chains per stem
 * Provides gesture-controlled real-time audio effects with <10ms latency
 */

import {
  Reverb,
  Filter,
  Distortion,
  Compressor,
  Phaser,
  Chorus,
  FeedbackDelay,
  Gain,
  ToneAudioNode,
  InputNode,
  OutputNode,
} from "tone";

export type EffectType =
  | "reverb"
  | "delay"
  | "filter"
  | "distortion"
  | "compression"
  | "phaser"
  | "flanger"
  | "gate"
  | "stutter"
  | "convolution"
  | "freeze"
  | "loop";
export type FilterType = "lowpass" | "highpass" | "bandpass" | "notch";
export type RoutingType = "serial" | "parallel";
export type PresetType = "club" | "hall" | "studio" | "outdoor";

export interface EffectParameters {
  enabled: boolean;
  wetness: number; // 0-1 (dry-wet mix)
  intensity: number; // 0-1 (effect-specific intensity)
  parameter1: number; // 0-1 (effect-specific parameter)
  parameter2: number; // 0-1 (effect-specific parameter)
  bypass: boolean;
}

export interface ReverbParams extends EffectParameters {
  roomSize: number; // 0-1
  decay: number; // 0-1
  preDelay: number; // 0-1
}

export interface DelayParams extends EffectParameters {
  time: number; // 0-1 (mapped to 0-1000ms)
  feedback: number; // 0-1
  filter: number; // 0-1 (highpass filter on feedback)
}

export interface FilterParams extends EffectParameters {
  frequency: number; // 0-1 (mapped to 20Hz-20kHz)
  resonance: number; // 0-1
  type: FilterType;
}

export interface DistortionParams extends EffectParameters {
  drive: number; // 0-1
  oversample: number; // 0-1 (0=none, 1=4x)
  tone: number; // 0-1 (post-distortion filter)
}

export interface CompressionParams extends EffectParameters {
  threshold: number; // 0-1 (mapped to -60dB to 0dB)
  ratio: number; // 0-1 (mapped to 1:1 to 20:1)
  attack: number; // 0-1 (mapped to 0-100ms)
  release: number; // 0-1 (mapped to 10ms-2s)
}

export interface ModulationParams extends EffectParameters {
  rate: number; // 0-1 (LFO rate)
  depth: number; // 0-1 (modulation depth)
  feedback: number; // 0-1 (for flanger)
}

export interface GateParams extends EffectParameters {
  threshold: number; // 0-1 (gate threshold)
  ratio: number; // 0-1 (gate ratio)
  attack: number; // 0-1 (attack time)
  release: number; // 0-1 (release time)
  hold: number; // 0-1 (hold time)
}

export interface StutterParams extends EffectParameters {
  rate: number; // 0-1 (stutter rate, synced to beat)
  depth: number; // 0-1 (stutter intensity)
  length: number; // 0-1 (stutter length in beats)
  mix: number; // 0-1 (dry/wet mix)
}

export interface ConvolutionParams extends EffectParameters {
  impulseResponse: string; // 'hall' | 'room' | 'chamber' | 'plate' | 'spring'
  wet: number; // 0-1 (wet signal amount)
  dry: number; // 0-1 (dry signal amount)
  preDelay: number; // 0-1 (pre-delay time)
}

export interface FreezeParams extends EffectParameters {
  freezeLength: number; // 0-1 (length of freeze in seconds)
  crossfadeTime: number; // 0-1 (crossfade time for freeze)
  pitchShift: number; // 0-1 (pitch shift amount)
}

export interface LoopParams extends EffectParameters {
  loopLength: number; // 0-1 (loop length in beats)
  crossfadeTime: number; // 0-1 (crossfade time)
  reverse: boolean; // reverse loop direction
}

export interface EffectChainConfig {
  routing: RoutingType;
  effects: {
    reverb: ReverbParams;
    delay: DelayParams;
    filter: FilterParams;
    distortion: DistortionParams;
    compression: CompressionParams;
    phaser: ModulationParams;
    flanger: ModulationParams;
    gate: GateParams;
    stutter: StutterParams;
    convolution: ConvolutionParams;
    freeze: FreezeParams;
    loop: LoopParams;
  };
}

export interface StemEffectState {
  stemIndex: number;
  config: EffectChainConfig;
  cpuUsage: number;
  latency: number;
  activeEffects: EffectType[];
}

export interface GestureEffectMapping {
  gesture: "pinch" | "rotation" | "spread" | "tap" | "swipe";
  effect: EffectType;
  parameter: string;
  sensitivity: number;
  threshold: number;
}

export interface EffectPreset {
  name: string;
  description: string;
  config: EffectChainConfig;
}

/**
 * Individual effect processor with Tone.js integration
 */
class EffectProcessor {
  private effect: ToneAudioNode;
  private input: Gain;
  private output: Gain;
  private wetGain: Gain;
  private dryGain: Gain;
  private bypass: boolean = false;
  private type: EffectType;

  constructor(type: EffectType) {
    this.type = type;
    this.input = new Gain(1);
    this.output = new Gain(1);
    this.wetGain = new Gain(0.5);
    this.dryGain = new Gain(0.5);

    this.effect = this.createEffect(type);
    this.connectNodes();
  }

  private createEffect(type: EffectType): ToneAudioNode {
    switch (type) {
      case "reverb":
        return new Reverb(1.5); // decay time in seconds

      case "delay":
        return new FeedbackDelay({
          delayTime: "8n",
          feedback: 0.3,
          wet: 0.3,
        });

      case "filter":
        return new Filter({
          frequency: 1000,
          type: "lowpass",
          Q: 1,
        });

      case "distortion":
        return new Distortion({
          distortion: 0.4,
          oversample: "2x",
        });

      case "compression":
        return new Compressor({
          threshold: -24,
          ratio: 4,
          attack: 0.003,
          release: 0.25,
        });

      case "phaser":
        return new Phaser({
          frequency: 0.5,
          octaves: 3,
          baseFrequency: 350,
        });

      case "flanger":
        return new Chorus({
          frequency: 1.5,
          delayTime: 3.5,
          depth: 0.7,
          feedback: 0.1,
          spread: 180,
        });

      default:
        return new Gain(1);
    }
  }

  private connectNodes(): void {
    // Parallel wet/dry mixing
    this.input.connect(this.dryGain);
    this.input.connect(this.effect);
    this.effect.connect(this.wetGain);

    this.dryGain.connect(this.output);
    this.wetGain.connect(this.output);
  }

  updateParameters(params: EffectParameters): void {
    if (this.bypass !== params.bypass) {
      this.setBypass(params.bypass);
    }

    this.setWetness(params.wetness);
    this.updateEffectSpecificParams(params);
  }

  private updateEffectSpecificParams(params: EffectParameters): void {
    const effect = this.effect as any;

    switch (this.type) {
      case "reverb":
        const reverbParams = params as ReverbParams;
        if (effect.roomSize !== undefined) {
          effect.roomSize.value = reverbParams.roomSize;
        }
        if (effect.decay !== undefined) {
          effect.decay.value = reverbParams.decay * 10; // 0-10 seconds
        }
        break;

      case "delay":
        const delayParams = params as DelayParams;
        if (effect.delayTime !== undefined) {
          effect.delayTime.value = delayParams.time; // 0-1 seconds
        }
        if (effect.feedback !== undefined) {
          effect.feedback.value = delayParams.feedback;
        }
        break;

      case "filter":
        const filterParams = params as FilterParams;
        if (effect.frequency !== undefined) {
          // Map 0-1 to 20Hz-20kHz logarithmically
          const freq = 20 * Math.pow(1000, filterParams.frequency);
          effect.frequency.rampTo(freq, 0.01);
        }
        if (effect.Q !== undefined) {
          effect.Q.value = filterParams.resonance * 30; // 0-30 Q
        }
        if (effect.type !== undefined) {
          effect.type = filterParams.type;
        }
        break;

      case "distortion":
        const distortionParams = params as DistortionParams;
        if (effect.distortion !== undefined) {
          effect.distortion.value = distortionParams.drive;
        }
        break;

      case "compression":
        const compressionParams = params as CompressionParams;
        if (effect.threshold !== undefined) {
          effect.threshold.value = -60 + compressionParams.threshold * 60; // -60dB to 0dB
        }
        if (effect.ratio !== undefined) {
          effect.ratio.value = 1 + compressionParams.ratio * 19; // 1:1 to 20:1
        }
        if (effect.attack !== undefined) {
          effect.attack.value = compressionParams.attack * 0.1; // 0-100ms
        }
        if (effect.release !== undefined) {
          effect.release.value = 0.01 + compressionParams.release * 1.99; // 10ms-2s
        }
        break;

      case "phaser":
        const phaserParams = params as ModulationParams;
        if (effect.frequency !== undefined) {
          effect.frequency.value = phaserParams.rate * 10; // 0-10 Hz
        }
        if (effect.depth !== undefined) {
          effect.depth.value = phaserParams.depth;
        }
        break;

      case "flanger":
        const flangerParams = params as ModulationParams;
        if (effect.frequency !== undefined) {
          effect.frequency.value = flangerParams.rate * 20; // 0-20 Hz
        }
        if (effect.depth !== undefined) {
          effect.depth.value = flangerParams.depth;
        }
        if (effect.feedback !== undefined) {
          effect.feedback.value = flangerParams.feedback;
        }
        break;
    }
  }

  setWetness(wetness: number): void {
    const clampedWetness = Math.max(0, Math.min(1, wetness));
    this.wetGain.gain.rampTo(clampedWetness, 0.01);
    this.dryGain.gain.rampTo(1 - clampedWetness, 0.01);
  }

  setBypass(bypass: boolean): void {
    this.bypass = bypass;
    if (bypass) {
      this.wetGain.gain.rampTo(0, 0.01);
      this.dryGain.gain.rampTo(1, 0.01);
    }
  }

  connect(destination: InputNode): void {
    this.output.connect(destination);
  }

  disconnect(destination?: InputNode): void {
    this.output.disconnect(destination);
  }

  getInput(): InputNode {
    return this.input;
  }

  getOutput(): OutputNode {
    return this.output;
  }

  dispose(): void {
    this.effect.dispose();
    this.input.dispose();
    this.output.dispose();
    this.wetGain.dispose();
    this.dryGain.dispose();
  }
}

/**
 * Main stem effects processor
 */
export class StemEffectsProcessor {
  private stemChains: Map<number, Map<EffectType, EffectProcessor>> = new Map();
  private stemInputs: Map<number, Gain> = new Map();
  private stemOutputs: Map<number, Gain> = new Map();
  private stemConfigs: Map<number, EffectChainConfig> = new Map();
  private gestureMapping: GestureEffectMapping[] = [];
  private presets: Map<PresetType, EffectPreset> = new Map();
  private cpuMonitoring: boolean = false;
  private latencyMeasurement: boolean = false;
  private performanceMetrics: Map<number, { cpu: number; latency: number }> =
    new Map();

  constructor() {
    this.initializePresets();
    this.initializeGestureMapping();
  }

  /**
   * Initialize a stem's effect chain
   */
  initializeStem(stemIndex: number): void {
    if (stemIndex < 0 || stemIndex > 3) {
      throw new Error(`Invalid stem index: ${stemIndex}. Must be 0-3.`);
    }

    // Create input/output nodes
    const input = new Gain(1);
    const output = new Gain(1);

    this.stemInputs.set(stemIndex, input);
    this.stemOutputs.set(stemIndex, output);

    // Create effect processors
    const effectChain = new Map<EffectType, EffectProcessor>();
    const effectTypes: EffectType[] = [
      "compression",
      "filter",
      "distortion",
      "delay",
      "reverb",
      "phaser",
      "flanger",
    ];

    for (const effectType of effectTypes) {
      effectChain.set(effectType, new EffectProcessor(effectType));
    }

    this.stemChains.set(stemIndex, effectChain);

    // Initialize default configuration
    const defaultConfig: EffectChainConfig = this.createDefaultConfig();
    this.stemConfigs.set(stemIndex, defaultConfig);

    // Connect the effects chain
    this.connectEffectChain(stemIndex, defaultConfig.routing);

    // Initialize performance metrics
    this.performanceMetrics.set(stemIndex, { cpu: 0, latency: 0 });
  }

  private createDefaultConfig(): EffectChainConfig {
    return {
      routing: "serial",
      effects: {
        reverb: {
          enabled: false,
          wetness: 0.3,
          intensity: 0.5,
          parameter1: 0.7, // roomSize
          parameter2: 0.5, // decay
          bypass: false,
          roomSize: 0.7,
          decay: 1.5,
          preDelay: 0.01,
        },
        delay: {
          enabled: false,
          wetness: 0.25,
          intensity: 0.4,
          parameter1: 0.5, // time
          parameter2: 0.3, // feedback
          bypass: false,
          time: 0.125, // 1/8 note
          feedback: 0.3,
          filter: 0.5,
        },
        filter: {
          enabled: false,
          wetness: 1.0,
          intensity: 0.5,
          parameter1: 0.5, // frequency
          parameter2: 0.1, // resonance
          bypass: false,
          frequency: 0.5, // 1kHz
          resonance: 0.1,
          type: "lowpass",
        },
        distortion: {
          enabled: false,
          wetness: 0.5,
          intensity: 0.4,
          parameter1: 0.4, // drive
          parameter2: 0.5, // tone
          bypass: false,
          drive: 0.4,
          oversample: 0.5,
          tone: 0.5,
        },
        compression: {
          enabled: true, // Default compression for clean signal
          wetness: 1.0,
          intensity: 0.3,
          parameter1: 0.4, // threshold
          parameter2: 0.2, // ratio
          bypass: false,
          threshold: 0.4, // -24dB
          ratio: 0.2, // 4:1
          attack: 0.03, // 3ms
          release: 0.25, // 250ms
        },
        phaser: {
          enabled: false,
          wetness: 0.5,
          intensity: 0.5,
          parameter1: 0.1, // rate
          parameter2: 0.7, // depth
          bypass: false,
          rate: 0.5, // 0.5 Hz
          depth: 0.7,
          feedback: 0.1,
        },
        flanger: {
          enabled: false,
          wetness: 0.4,
          intensity: 0.6,
          parameter1: 0.15, // rate
          parameter2: 0.7, // depth
          bypass: false,
          rate: 1.5, // 1.5 Hz
          depth: 0.7,
          feedback: 0.1,
        },
        gate: {
          enabled: false,
          wetness: 1.0,
          intensity: 0.5,
          parameter1: 0.3, // threshold
          parameter2: 0.2, // ratio
          bypass: false,
          threshold: 0.3,
          ratio: 0.2,
          attack: 0.001,
          release: 0.1,
          hold: 0.01,
        },
        stutter: {
          enabled: false,
          wetness: 0.7,
          intensity: 0.6,
          parameter1: 0.25, // rate
          parameter2: 0.5, // depth
          bypass: false,
          rate: 0.5, // 1/2 beat
          depth: 0.5,
          length: 0.125, // 1/8 beat
          mix: 0.7,
        },
        convolution: {
          enabled: false,
          wetness: 0.4,
          intensity: 0.6,
          parameter1: 0.5, // wet
          parameter2: 0.3, // preDelay
          bypass: false,
          impulseResponse: "hall",
          wet: 0.5,
          dry: 0.5,
          preDelay: 0.02,
        },
        freeze: {
          enabled: false,
          wetness: 1.0,
          intensity: 0.5,
          parameter1: 0.5, // freezeLength
          parameter2: 0.2, // crossfadeTime
          bypass: false,
          freezeLength: 1.0,
          crossfadeTime: 0.1,
          pitchShift: 0.0,
        },
        loop: {
          enabled: false,
          wetness: 1.0,
          intensity: 0.5,
          parameter1: 0.5, // loopLength
          parameter2: 0.1, // crossfadeTime
          bypass: false,
          loopLength: 2.0, // 2 beats
          crossfadeTime: 0.05,
          reverse: false,
        },
      },
    };
  }

  private connectEffectChain(stemIndex: number, routing: RoutingType): void {
    const input = this.stemInputs.get(stemIndex)!;
    const output = this.stemOutputs.get(stemIndex)!;
    const effectChain = this.stemChains.get(stemIndex)!;

    // Disconnect all existing connections
    input.disconnect();
    effectChain.forEach((effect) => {
      effect.disconnect();
    });

    if (routing === "serial") {
      // Serial connection: compression -> filter -> distortion -> delay -> reverb -> phaser -> flanger
      const effectOrder: EffectType[] = [
        "compression",
        "filter",
        "distortion",
        "delay",
        "reverb",
        "phaser",
        "flanger",
      ];

      let previousNode: ToneAudioNode = input;

      for (const effectType of effectOrder) {
        const effect = effectChain.get(effectType)!;
        previousNode.connect(effect.getInput());
        previousNode = effect.getOutput() as ToneAudioNode;
      }

      previousNode.connect(output);
    } else {
      // Parallel connection: mix all effects with dry signal
      const parallelMix = new Gain(1);
      const dryGain = new Gain(0.7); // Reduce dry signal in parallel mode

      input.connect(dryGain);
      dryGain.connect(output);

      effectChain.forEach((effect) => {
        input.connect(effect.getInput());
        effect.connect(parallelMix);
      });

      parallelMix.connect(output);
    }
  }

  /**
   * Set effect parameters for a specific stem and effect
   */
  setEffectParameters(
    stemIndex: number,
    effectType: EffectType,
    params: EffectParameters,
  ): void {
    const effectChain = this.stemChains.get(stemIndex);
    if (!effectChain) {
      throw new Error(`Stem ${stemIndex} not initialized`);
    }

    const effect = effectChain.get(effectType);
    if (!effect) {
      throw new Error(`Effect ${effectType} not found for stem ${stemIndex}`);
    }

    // Performance optimization: bypass when parameters are at default
    const isDefault = this.areParametersDefault(effectType, params);
    if (isDefault && !params.enabled) {
      params.bypass = true;
    }

    effect.updateParameters(params);

    // Update configuration
    const config = this.stemConfigs.get(stemIndex)!;
    config.effects[effectType] = { ...params } as any;
    this.stemConfigs.set(stemIndex, config);

    // Measure latency if enabled
    if (this.latencyMeasurement) {
      this.measureLatency(stemIndex);
    }
  }

  private areParametersDefault(
    effectType: EffectType,
    params: EffectParameters,
  ): boolean {
    const defaultThreshold = 0.01;

    switch (effectType) {
      case "reverb":
        return Math.abs(params.wetness - 0) < defaultThreshold;
      case "delay":
        return Math.abs(params.wetness - 0) < defaultThreshold;
      case "filter":
        return (
          Math.abs(params.parameter1 - 0.5) < defaultThreshold &&
          Math.abs(params.parameter2 - 0.1) < defaultThreshold
        );
      case "distortion":
        return Math.abs(params.wetness - 0) < defaultThreshold;
      case "compression":
        return (
          Math.abs(params.parameter1 - 0.4) < defaultThreshold &&
          Math.abs(params.parameter2 - 0.2) < defaultThreshold
        );
      case "phaser":
      case "flanger":
        return Math.abs(params.wetness - 0) < defaultThreshold;
      default:
        return false;
    }
  }

  /**
   * Process gesture input to control effects
   */
  processGestureInput(
    stemIndex: number,
    gesture: string,
    value: number,
    secondary?: number,
  ): void {
    const mapping = this.gestureMapping.find((m) => m.gesture === gesture);
    if (!mapping || value < mapping.threshold) return;

    const adjustedValue = value * mapping.sensitivity;
    const config = this.stemConfigs.get(stemIndex);
    if (!config) return;

    switch (gesture) {
      case "pinch":
        // Effect intensity control
        if (mapping.effect && config.effects[mapping.effect]) {
          const params = config.effects[mapping.effect];
          params.intensity = adjustedValue;
          this.setEffectParameters(
            stemIndex,
            mapping.effect,
            params as EffectParameters,
          );
        }
        break;

      case "rotation":
        // Parameter sweep control
        if (mapping.effect && config.effects[mapping.effect]) {
          const params = config.effects[mapping.effect];
          if (mapping.parameter === "parameter1") {
            params.parameter1 = adjustedValue;
          } else if (mapping.parameter === "parameter2") {
            params.parameter2 = adjustedValue;
          }
          this.setEffectParameters(
            stemIndex,
            mapping.effect,
            params as EffectParameters,
          );
        }
        break;

      case "spread":
        // Wet/dry mix control
        if (mapping.effect && config.effects[mapping.effect]) {
          const params = config.effects[mapping.effect];
          params.wetness = adjustedValue;
          this.setEffectParameters(
            stemIndex,
            mapping.effect,
            params as EffectParameters,
          );
        }
        break;

      case "tap":
        // Effect toggle
        if (mapping.effect && config.effects[mapping.effect]) {
          const params = config.effects[mapping.effect];
          params.enabled = !params.enabled;
          this.setEffectParameters(
            stemIndex,
            mapping.effect,
            params as EffectParameters,
          );
        }
        break;

      case "swipe":
        // Effect selection (cycle through effects)
        this.cycleEffect(stemIndex, adjustedValue > 0.5 ? 1 : -1);
        break;
    }
  }

  private cycleEffect(stemIndex: number, direction: number): void {
    const effectTypes: EffectType[] = [
      "reverb",
      "delay",
      "filter",
      "distortion",
      "compression",
      "phaser",
      "flanger",
    ];
    const config = this.stemConfigs.get(stemIndex);
    if (!config) return;

    // Find currently enabled effect
    let currentIndex = -1;
    for (let i = 0; i < effectTypes.length; i++) {
      if (config.effects[effectTypes[i]].enabled) {
        currentIndex = i;
        break;
      }
    }

    // Disable current effect
    if (currentIndex >= 0) {
      const currentEffect = effectTypes[currentIndex];
      config.effects[currentEffect].enabled = false;
      this.setEffectParameters(
        stemIndex,
        currentEffect,
        config.effects[currentEffect] as EffectParameters,
      );
    }

    // Enable next effect
    const nextIndex =
      (currentIndex + direction + effectTypes.length) % effectTypes.length;
    const nextEffect = effectTypes[nextIndex];
    config.effects[nextEffect].enabled = true;
    this.setEffectParameters(
      stemIndex,
      nextEffect,
      config.effects[nextEffect] as EffectParameters,
    );
  }

  /**
   * Apply preset configuration to a stem
   */
  applyPreset(stemIndex: number, presetType: PresetType): void {
    const preset = this.presets.get(presetType);
    if (!preset) {
      throw new Error(`Preset ${presetType} not found`);
    }

    this.stemConfigs.set(stemIndex, JSON.parse(JSON.stringify(preset.config)));

    // Apply all effect parameters
    Object.entries(preset.config.effects).forEach(([effectType, params]) => {
      this.setEffectParameters(
        stemIndex,
        effectType as EffectType,
        params as EffectParameters,
      );
    });

    // Update routing if needed
    if (preset.config.routing !== this.stemConfigs.get(stemIndex)?.routing) {
      this.connectEffectChain(stemIndex, preset.config.routing);
    }
  }

  private initializePresets(): void {
    // Club preset - punchy and energetic
    this.presets.set("club", {
      name: "Club",
      description: "Punchy compression and subtle delay for club environment",
      config: {
        routing: "serial",
        effects: {
          compression: {
            enabled: true,
            wetness: 1.0,
            intensity: 0.7,
            parameter1: 0.3,
            parameter2: 0.4,
            bypass: false,
            threshold: 0.3,
            ratio: 0.4,
            attack: 0.01,
            release: 0.1,
          },
          filter: {
            enabled: true,
            wetness: 1.0,
            intensity: 0.3,
            parameter1: 0.6,
            parameter2: 0.2,
            bypass: false,
            frequency: 0.6,
            resonance: 0.2,
            type: "highpass" as FilterType,
          },
          delay: {
            enabled: true,
            wetness: 0.2,
            intensity: 0.4,
            parameter1: 0.25,
            parameter2: 0.2,
            bypass: false,
            time: 0.125,
            feedback: 0.2,
            filter: 0.7,
          },
          reverb: {
            enabled: false,
            wetness: 0.1,
            intensity: 0.3,
            parameter1: 0.3,
            parameter2: 0.4,
            bypass: false,
            roomSize: 0.3,
            decay: 0.8,
            preDelay: 0.005,
          },
          distortion: {
            enabled: false,
            wetness: 0.3,
            intensity: 0.2,
            parameter1: 0.2,
            parameter2: 0.6,
            bypass: false,
            drive: 0.2,
            oversample: 0.5,
            tone: 0.6,
          },
          phaser: {
            enabled: false,
            wetness: 0.3,
            intensity: 0.4,
            parameter1: 0.2,
            parameter2: 0.5,
            bypass: false,
            rate: 2.0,
            depth: 0.5,
            feedback: 0.1,
          },
          flanger: {
            enabled: false,
            wetness: 0.25,
            intensity: 0.3,
            parameter1: 0.15,
            parameter2: 0.4,
            bypass: false,
            rate: 1.5,
            depth: 0.4,
            feedback: 0.05,
          },
          gate: {
            enabled: true,
            wetness: 1.0,
            intensity: 0.6,
            parameter1: 0.4,
            parameter2: 0.3,
            bypass: false,
            threshold: 0.4,
            ratio: 0.3,
            attack: 0.002,
            release: 0.05,
            hold: 0.02,
          },
          stutter: {
            enabled: false,
            wetness: 0.5,
            intensity: 0.4,
            parameter1: 0.25,
            parameter2: 0.3,
            bypass: false,
            rate: 0.5,
            depth: 0.4,
            length: 0.125,
            mix: 0.5,
          },
          convolution: {
            enabled: false,
            wetness: 0.3,
            intensity: 0.4,
            parameter1: 0.4,
            parameter2: 0.2,
            bypass: false,
            impulseResponse: "club",
            wet: 0.4,
            dry: 0.6,
            preDelay: 0.01,
          },
          freeze: {
            enabled: false,
            wetness: 1.0,
            intensity: 0.3,
            parameter1: 0.3,
            parameter2: 0.1,
            bypass: false,
            freezeLength: 0.8,
            crossfadeTime: 0.05,
            pitchShift: 0.0,
          },
          loop: {
            enabled: false,
            wetness: 1.0,
            intensity: 0.4,
            parameter1: 0.4,
            parameter2: 0.1,
            bypass: false,
            loopLength: 1.0,
            crossfadeTime: 0.05,
            reverse: false,
          },
        },
      },
    });

    // Hall preset - spacious and ambient
    this.presets.set("hall", {
      name: "Hall",
      description: "Large reverb and gentle compression for concert hall sound",
      config: {
        routing: "serial",
        effects: {
          compression: {
            enabled: true,
            wetness: 1.0,
            intensity: 0.4,
            parameter1: 0.5,
            parameter2: 0.15,
            bypass: false,
            threshold: 0.5,
            ratio: 0.15,
            attack: 0.005,
            release: 0.3,
          },
          reverb: {
            enabled: true,
            wetness: 0.6,
            intensity: 0.8,
            parameter1: 0.9,
            parameter2: 0.8,
            bypass: false,
            roomSize: 0.9,
            decay: 4.0,
            preDelay: 0.03,
          },
          delay: {
            enabled: true,
            wetness: 0.15,
            intensity: 0.3,
            parameter1: 0.375,
            parameter2: 0.15,
            bypass: false,
            time: 0.375,
            feedback: 0.15,
            filter: 0.4,
          },
          filter: {
            enabled: false,
            wetness: 1.0,
            intensity: 0.2,
            parameter1: 0.8,
            parameter2: 0.1,
            bypass: false,
            frequency: 0.8,
            resonance: 0.1,
            type: "lowpass" as FilterType,
          },
          distortion: {
            enabled: false,
            wetness: 0.1,
            intensity: 0.1,
            parameter1: 0.1,
            parameter2: 0.7,
            bypass: false,
            drive: 0.1,
            oversample: 0.25,
            tone: 0.7,
          },
          phaser: {
            enabled: false,
            wetness: 0.2,
            intensity: 0.2,
            parameter1: 0.05,
            parameter2: 0.3,
            bypass: false,
            rate: 0.5,
            depth: 0.3,
            feedback: 0.05,
          },
          flanger: {
            enabled: false,
            wetness: 0.15,
            intensity: 0.2,
            parameter1: 0.08,
            parameter2: 0.25,
            bypass: false,
            rate: 0.8,
            depth: 0.25,
            feedback: 0.03,
          },
          gate: {
            enabled: false,
            wetness: 1.0,
            intensity: 0.5,
            parameter1: 0.1,
            parameter2: 0.3,
            bypass: false,
            threshold: -20,
            ratio: 10,
            attack: 0.001,
            release: 0.1,
            hold: 0.01,
          },
          loop: {
            enabled: false,
            wetness: 1.0,
            intensity: 0.5,
            parameter1: 1.0,
            parameter2: 0.5,
            bypass: false,
            loopLength: 1.0,
            crossfadeTime: 0.5,
            reverse: false,
          },
          stutter: {
            enabled: false,
            wetness: 1.0,
            intensity: 0.3,
            parameter1: 0.25,
            parameter2: 0.5,
            bypass: false,
            rate: 4,
            depth: 0.5,
            length: 0.25,
            mix: 0.5,
          },
          convolution: {
            enabled: false,
            wetness: 0.3,
            intensity: 0.5,
            parameter1: 0.5,
            parameter2: 0.2,
            bypass: false,
            impulseResponse: "hall",
            wet: 0.5,
            dry: 0.5,
            preDelay: 0.02,
          },
          freeze: {
            enabled: false,
            wetness: 1.0,
            intensity: 1.0,
            parameter1: 0.5,
            parameter2: 1.0,
            bypass: false,
            freezeLength: 0.5,
            crossfadeTime: 0.1,
            pitchShift: 0.0,
          },
        },
      },
    });

    // Studio preset - clean and professional
    this.presets.set("studio", {
      name: "Studio",
      description: "Clean compression and subtle EQ for studio monitoring",
      config: {
        routing: "serial",
        effects: {
          compression: {
            enabled: true,
            wetness: 1.0,
            intensity: 0.5,
            parameter1: 0.4,
            parameter2: 0.2,
            bypass: false,
            threshold: 0.4,
            ratio: 0.2,
            attack: 0.003,
            release: 0.25,
          },
          filter: {
            enabled: true,
            wetness: 1.0,
            intensity: 0.2,
            parameter1: 0.45,
            parameter2: 0.05,
            bypass: false,
            frequency: 0.45,
            resonance: 0.05,
            type: "highpass" as FilterType,
          },
          reverb: {
            enabled: false,
            wetness: 0.05,
            intensity: 0.2,
            parameter1: 0.4,
            parameter2: 0.3,
            bypass: false,
            roomSize: 0.4,
            decay: 0.8,
            preDelay: 0.01,
          },
          delay: {
            enabled: false,
            wetness: 0.08,
            intensity: 0.2,
            parameter1: 0.125,
            parameter2: 0.1,
            bypass: false,
            time: 0.125,
            feedback: 0.1,
            filter: 0.6,
          },
          distortion: {
            enabled: false,
            wetness: 0.05,
            intensity: 0.1,
            parameter1: 0.05,
            parameter2: 0.8,
            bypass: false,
            drive: 0.05,
            oversample: 0.75,
            tone: 0.8,
          },
          phaser: {
            enabled: false,
            wetness: 0.1,
            intensity: 0.15,
            parameter1: 0.1,
            parameter2: 0.2,
            bypass: false,
            rate: 1.0,
            depth: 0.2,
            feedback: 0.02,
          },
          flanger: {
            enabled: false,
            wetness: 0.08,
            intensity: 0.12,
            parameter1: 0.12,
            parameter2: 0.18,
            bypass: false,
            rate: 1.2,
            depth: 0.18,
            feedback: 0.02,
          },
          gate: {
            enabled: false,
            wetness: 1.0,
            intensity: 0.5,
            parameter1: 0.1,
            parameter2: 0.3,
            bypass: false,
            threshold: -20,
            ratio: 10,
            attack: 0.001,
            release: 0.1,
            hold: 0.01,
          },
          stutter: {
            enabled: false,
            wetness: 1.0,
            intensity: 0.3,
            parameter1: 0.25,
            parameter2: 0.5,
            bypass: false,
            rate: 4,
            depth: 0.5,
            length: 0.25,
            mix: 0.5,
          },
          convolution: {
            enabled: false,
            wetness: 0.3,
            intensity: 0.5,
            parameter1: 0.5,
            parameter2: 0.2,
            bypass: false,
            impulseResponse: "hall",
            wet: 0.5,
            dry: 0.5,
            preDelay: 0.02,
          },
          freeze: {
            enabled: false,
            wetness: 1.0,
            intensity: 1.0,
            parameter1: 0.5,
            parameter2: 1.0,
            bypass: false,
            freezeLength: 0.5,
            crossfadeTime: 0.1,
            pitchShift: 0.0,
          },
          loop: {
            enabled: false,
            wetness: 1.0,
            intensity: 0.5,
            parameter1: 1.0,
            parameter2: 0.5,
            bypass: false,
            loopLength: 1.0,
            crossfadeTime: 0.5,
            reverse: false,
          },
        },
      },
    });

    // Outdoor preset - compensated for open-air acoustics
    this.presets.set("outdoor", {
      name: "Outdoor",
      description: "Enhanced mids and compression for outdoor events",
      config: {
        routing: "serial",
        effects: {
          compression: {
            enabled: true,
            wetness: 1.0,
            intensity: 0.8,
            parameter1: 0.25,
            parameter2: 0.5,
            bypass: false,
            threshold: 0.25,
            ratio: 0.5,
            attack: 0.002,
            release: 0.15,
          },
          filter: {
            enabled: true,
            wetness: 1.0,
            intensity: 0.6,
            parameter1: 0.55,
            parameter2: 0.3,
            bypass: false,
            frequency: 0.55,
            resonance: 0.3,
            type: "bandpass" as FilterType,
          },
          delay: {
            enabled: true,
            wetness: 0.3,
            intensity: 0.5,
            parameter1: 0.25,
            parameter2: 0.25,
            bypass: false,
            time: 0.25,
            feedback: 0.25,
            filter: 0.5,
          },
          reverb: {
            enabled: false,
            wetness: 0.1,
            intensity: 0.2,
            parameter1: 0.5,
            parameter2: 0.4,
            bypass: false,
            roomSize: 0.5,
            decay: 1.2,
            preDelay: 0.02,
          },
          distortion: {
            enabled: false,
            wetness: 0.2,
            intensity: 0.3,
            parameter1: 0.15,
            parameter2: 0.5,
            bypass: false,
            drive: 0.15,
            oversample: 0.5,
            tone: 0.5,
          },
          phaser: {
            enabled: false,
            wetness: 0.25,
            intensity: 0.3,
            parameter1: 0.3,
            parameter2: 0.4,
            bypass: false,
            rate: 3.0,
            depth: 0.4,
            feedback: 0.08,
          },
          flanger: {
            enabled: false,
            wetness: 0.2,
            intensity: 0.25,
            parameter1: 0.25,
            parameter2: 0.35,
            bypass: false,
            rate: 2.5,
            depth: 0.35,
            feedback: 0.06,
          },
          gate: {
            enabled: false,
            wetness: 1.0,
            intensity: 0.5,
            parameter1: 0.1,
            parameter2: 0.3,
            bypass: false,
            threshold: -20,
            ratio: 10,
            attack: 0.001,
            release: 0.1,
            hold: 0.01,
          },
          stutter: {
            enabled: false,
            wetness: 1.0,
            intensity: 0.3,
            parameter1: 0.25,
            parameter2: 0.5,
            bypass: false,
            rate: 4,
            depth: 0.5,
            length: 0.25,
            mix: 0.5,
          },
          convolution: {
            enabled: false,
            wetness: 0.3,
            intensity: 0.5,
            parameter1: 0.5,
            parameter2: 0.2,
            bypass: false,
            impulseResponse: "hall",
            wet: 0.5,
            dry: 0.5,
            preDelay: 0.02,
          },
          freeze: {
            enabled: false,
            wetness: 1.0,
            intensity: 1.0,
            parameter1: 0.5,
            parameter2: 1.0,
            bypass: false,
            freezeLength: 0.5,
            crossfadeTime: 0.1,
            pitchShift: 0.0,
          },
          loop: {
            enabled: false,
            wetness: 1.0,
            intensity: 0.5,
            parameter1: 1.0,
            parameter2: 0.5,
            bypass: false,
            loopLength: 1.0,
            crossfadeTime: 0.5,
            reverse: false,
          },
        },
      },
    });
  }

  private initializeGestureMapping(): void {
    this.gestureMapping = [
      {
        gesture: "pinch",
        effect: "reverb",
        parameter: "intensity",
        sensitivity: 1.0,
        threshold: 0.1,
      },
      {
        gesture: "rotation",
        effect: "filter",
        parameter: "parameter1",
        sensitivity: 1.0,
        threshold: 0.05,
      },
      {
        gesture: "spread",
        effect: "delay",
        parameter: "wetness",
        sensitivity: 1.0,
        threshold: 0.1,
      },
      {
        gesture: "tap",
        effect: "distortion",
        parameter: "enabled",
        sensitivity: 1.0,
        threshold: 0.8,
      },
      {
        gesture: "swipe",
        effect: "compression",
        parameter: "cycle",
        sensitivity: 1.0,
        threshold: 0.3,
      },
    ];
  }

  /**
   * Update gesture mapping configuration
   */
  updateGestureMapping(
    gesture: string,
    effect: EffectType,
    parameter: string,
    sensitivity: number = 1.0,
    threshold: number = 0.1,
  ): void {
    const existingIndex = this.gestureMapping.findIndex(
      (m) => m.gesture === gesture,
    );
    const newMapping: GestureEffectMapping = {
      gesture: gesture as any,
      effect,
      parameter,
      sensitivity: Math.max(0.1, Math.min(2.0, sensitivity)),
      threshold: Math.max(0.01, Math.min(1.0, threshold)),
    };

    if (existingIndex >= 0) {
      this.gestureMapping[existingIndex] = newMapping;
    } else {
      this.gestureMapping.push(newMapping);
    }
  }

  /**
   * Get current stem state
   */
  getStemState(stemIndex: number): StemEffectState | null {
    const config = this.stemConfigs.get(stemIndex);
    const metrics = this.performanceMetrics.get(stemIndex);

    if (!config || !metrics) return null;

    const activeEffects: EffectType[] = [];
    Object.entries(config.effects).forEach(([type, params]) => {
      if (params.enabled && !params.bypass) {
        activeEffects.push(type as EffectType);
      }
    });

    return {
      stemIndex,
      config,
      cpuUsage: metrics.cpu,
      latency: metrics.latency,
      activeEffects,
    };
  }

  /**
   * Enable CPU monitoring
   */
  enableCPUMonitoring(enabled: boolean): void {
    this.cpuMonitoring = enabled;
    if (enabled) {
      this.startCPUMonitoring();
    }
  }

  private startCPUMonitoring(): void {
    if (!this.cpuMonitoring) return;

    // Simplified CPU monitoring - in a real implementation, this would use more sophisticated metrics
    const checkCPU = () => {
      this.performanceMetrics.forEach((metrics, stemIndex) => {
        const config = this.stemConfigs.get(stemIndex);
        if (config) {
          // Estimate CPU usage based on active effects
          let cpuUsage = 0;
          Object.entries(config.effects).forEach(([type, params]) => {
            if (params.enabled && !params.bypass) {
              cpuUsage += this.getEffectCPUCost(type as EffectType);
            }
          });
          metrics.cpu = Math.min(100, cpuUsage);
        }
      });

      if (this.cpuMonitoring) {
        setTimeout(checkCPU, 100); // Check every 100ms
      }
    };

    checkCPU();
  }

  private getEffectCPUCost(effectType: EffectType): number {
    // Estimated CPU cost per effect (percentage)
    const costs: Record<EffectType, number> = {
      compression: 5,
      filter: 3,
      distortion: 8,
      delay: 12,
      reverb: 20,
      phaser: 10,
      flanger: 15,
      gate: 6,
      stutter: 14,
      convolution: 25,
      freeze: 8,
      loop: 12,
    };
    return costs[effectType] || 5;
  }

  private measureLatency(stemIndex: number): void {
    // Simplified latency measurement
    // In a real implementation, this would use audio analysis
    const metrics = this.performanceMetrics.get(stemIndex);
    if (metrics) {
      const config = this.stemConfigs.get(stemIndex);
      if (config) {
        let latency = 1; // Base latency 1ms
        Object.entries(config.effects).forEach(([type, params]) => {
          if (params.enabled && !params.bypass) {
            latency += this.getEffectLatency(type as EffectType);
          }
        });
        metrics.latency = latency;
      }
    }
  }

  private getEffectLatency(effectType: EffectType): number {
    // Estimated latency per effect (milliseconds)
    const latencies: Record<EffectType, number> = {
      compression: 0.5,
      filter: 0.1,
      distortion: 0.2,
      delay: 1.0,
      reverb: 2.0,
      phaser: 0.8,
      flanger: 1.2,
      gate: 0.3,
      stutter: 0.7,
      convolution: 3.0,
      freeze: 1.5,
      loop: 0.8,
    };
    return latencies[effectType] || 0.5;
  }

  /**
   * Get stem input node for connection
   */
  getStemInput(stemIndex: number): InputNode {
    const input = this.stemInputs.get(stemIndex);
    if (!input) {
      throw new Error(`Stem ${stemIndex} not initialized`);
    }
    return input;
  }

  /**
   * Get stem output node for connection
   */
  getStemOutput(stemIndex: number): OutputNode {
    const output = this.stemOutputs.get(stemIndex);
    if (!output) {
      throw new Error(`Stem ${stemIndex} not initialized`);
    }
    return output;
  }

  /**
   * Connect a source to a stem's effect chain
   */
  connectSource(stemIndex: number, source: ToneAudioNode): void {
    const input = this.getStemInput(stemIndex);
    source.connect(input);
  }

  /**
   * Connect a stem's output to a destination
   */
  connectDestination(stemIndex: number, destination: InputNode): void {
    const output = this.getStemOutput(stemIndex);
    output.connect(destination as any);
  }

  /**
   * Get all available presets
   */
  getAvailablePresets(): EffectPreset[] {
    return Array.from(this.presets.values());
  }

  /**
   * Get current gesture mapping
   */
  getGestureMapping(): GestureEffectMapping[] {
    return [...this.gestureMapping];
  }

  /**
   * Get performance metrics for all stems
   */
  getPerformanceMetrics(): Map<number, { cpu: number; latency: number }> {
    return new Map(this.performanceMetrics);
  }

  /**
   * Reset all effects on a stem
   */
  resetStem(stemIndex: number): void {
    const defaultConfig = this.createDefaultConfig();
    this.stemConfigs.set(stemIndex, defaultConfig);

    Object.entries(defaultConfig.effects).forEach(([effectType, params]) => {
      this.setEffectParameters(
        stemIndex,
        effectType as EffectType,
        params as EffectParameters,
      );
    });
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    this.stemChains.forEach((chain) => {
      chain.forEach((effect) => effect.dispose());
    });

    this.stemInputs.forEach((input) => input.dispose());
    this.stemOutputs.forEach((output) => output.dispose());

    this.stemChains.clear();
    this.stemInputs.clear();
    this.stemOutputs.clear();
    this.stemConfigs.clear();
    this.performanceMetrics.clear();

    this.cpuMonitoring = false;
  }
}
