import * as Tone from "tone";

export interface ChannelEQ {
  low: number;
  mid: number;
  high: number;
}

export interface ChannelConfig {
  gain: number;
  eq: ChannelEQ;
  filterType: "off" | "lpf" | "hpf";
  filterFreq: number;
  filterResonance: number;
  cueEnable: boolean;
}

export interface CrossfaderConfig {
  position: number;
  curve: "linear" | "smooth" | "sharp";
}

export interface MasterConfig {
  gain: number;
  limiterEnabled: boolean;
  limiterThreshold: number;
  compressorEnabled: boolean;
  compressorRatio: number;
  compressorThreshold: number;
  compressorAttack: number;
  compressorRelease: number;
}

interface Channel {
  input: Tone.Gain;
  gain: Tone.Gain;
  eq3: Tone.EQ3;
  filter: Tone.Filter;
  cueGain: Tone.Gain;
  channelOut: Tone.Gain;
  config: ChannelConfig;
}

export class AudioMixer {
  private channels: Channel[] = [];
  private crossfader!: Tone.CrossFade;
  private masterGain!: Tone.Gain;
  private masterLimiter!: Tone.Limiter;
  private masterCompressor!: Tone.Compressor;
  private masterOut!: Tone.Gain;
  private cueOut!: Tone.Gain;
  private crossfaderConfig!: CrossfaderConfig;
  private masterConfig!: MasterConfig;
  private isInitialized: boolean = false;

  constructor() {
    this.crossfaderConfig = {
      position: 0.5,
      curve: "linear",
    };

    this.masterConfig = {
      gain: 0.8,
      limiterEnabled: true,
      limiterThreshold: -1,
      compressorEnabled: true,
      compressorRatio: 4,
      compressorThreshold: -24,
      compressorAttack: 0.003,
      compressorRelease: 0.25,
    };

    // Defer node initialization until user interaction
    // Nodes will be created in initialize() method
  }

  private initializeChannels(): void {
    for (let i = 0; i < 4; i++) {
      const channel: Channel = {
        input: new Tone.Gain(1),
        gain: new Tone.Gain(0.75),
        eq3: new Tone.EQ3({
          low: 0,
          mid: 0,
          high: 0,
          lowFrequency: 320,
          highFrequency: 3200,
        }),
        filter: new Tone.Filter({
          frequency: 1000,
          type: "lowpass",
          Q: 1,
        }),
        cueGain: new Tone.Gain(0),
        channelOut: new Tone.Gain(1),
        config: {
          gain: 0.75,
          eq: { low: 0, mid: 0, high: 0 },
          filterType: "off",
          filterFreq: 1000,
          filterResonance: 1,
          cueEnable: false,
        },
      };

      // Connect channel signal chain
      channel.input.connect(channel.gain);
      channel.gain.connect(channel.eq3);
      channel.eq3.connect(channel.filter);
      channel.filter.connect(channel.channelOut);

      // Connect cue output
      channel.channelOut.connect(channel.cueGain);
      channel.cueGain.connect(this.cueOut);

      this.channels.push(channel);
    }
  }

  private connectNodes(): void {
    // Connect channels 0 & 1 to crossfader A
    const mixA = new Tone.Gain(1);
    this.channels[0].channelOut.connect(mixA);
    this.channels[1].channelOut.connect(mixA);
    mixA.connect(this.crossfader.a);

    // Connect channels 2 & 3 to crossfader B
    const mixB = new Tone.Gain(1);
    this.channels[2].channelOut.connect(mixB);
    this.channels[3].channelOut.connect(mixB);
    mixB.connect(this.crossfader.b);

    // Master signal chain
    this.crossfader.connect(this.masterGain);
    this.masterGain.connect(this.masterCompressor);
    this.masterCompressor.connect(this.masterLimiter);
    this.masterLimiter.connect(this.masterOut);
    this.masterOut.toDestination();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Ensure Tone.js starts with user gesture
      const context = Tone.getContext();
      if (context.rawContext.state !== "running") {
        console.log("Starting Tone.js audio context...");
        await Tone.start();
        console.log("Tone.js started successfully");
      }

      // Additional check for suspended context
      if (context.rawContext.state === "suspended") {
        await context.resume();
      }

      // Now create all audio nodes after AudioContext is ready
      this.createAudioNodes();
      this.initializeChannels();
      this.connectNodes();

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize audio:", error);
      throw new Error(
        'Audio initialization requires user interaction. Please click "Start DJ Session" to begin.',
      );
    }
  }

  private createAudioNodes(): void {
    this.crossfader = new Tone.CrossFade(0.5);
    this.masterGain = new Tone.Gain(this.masterConfig.gain);
    this.masterLimiter = new Tone.Limiter(this.masterConfig.limiterThreshold);
    this.masterCompressor = new Tone.Compressor({
      ratio: this.masterConfig.compressorRatio,
      threshold: this.masterConfig.compressorThreshold,
      attack: this.masterConfig.compressorAttack,
      release: this.masterConfig.compressorRelease,
    });
    this.masterOut = new Tone.Gain(1);
    this.cueOut = new Tone.Gain(1);
  }

  setChannelGain(channel: number, gain: number): void {
    if (channel < 0 || channel >= 4) return;

    const value = Math.max(0, Math.min(1, gain));
    this.channels[channel].gain.gain.rampTo(value, 0.05);
    this.channels[channel].config.gain = value;
  }

  setChannelEQ(channel: number, band: keyof ChannelEQ, value: number): void {
    if (channel < 0 || channel >= 4) return;

    const dbValue = Math.max(-20, Math.min(20, value));
    this.channels[channel].config.eq[band] = dbValue;

    switch (band) {
      case "low":
        this.channels[channel].eq3.low.value = dbValue;
        break;
      case "mid":
        this.channels[channel].eq3.mid.value = dbValue;
        break;
      case "high":
        this.channels[channel].eq3.high.value = dbValue;
        break;
    }
  }

  setChannelFilter(
    channel: number,
    type: ChannelConfig["filterType"],
    freq?: number,
    resonance?: number,
  ): void {
    if (channel < 0 || channel >= 4) return;

    const ch = this.channels[channel];
    ch.config.filterType = type;

    if (type === "off") {
      ch.filter.frequency.value = 20000;
      ch.filter.Q.value = 0.1;
      return;
    }

    ch.filter.type = type === "lpf" ? "lowpass" : "highpass";

    if (freq !== undefined) {
      ch.config.filterFreq = Math.max(20, Math.min(20000, freq));
      ch.filter.frequency.rampTo(ch.config.filterFreq, 0.05);
    }

    if (resonance !== undefined) {
      ch.config.filterResonance = Math.max(0.1, Math.min(30, resonance));
      ch.filter.Q.value = ch.config.filterResonance;
    }
  }

  setCrossfaderPosition(position: number): void {
    const value = Math.max(0, Math.min(1, position));
    this.crossfaderConfig.position = value;

    let fadeValue = value;

    switch (this.crossfaderConfig.curve) {
      case "smooth":
        fadeValue = this.smoothCurve(value);
        break;
      case "sharp":
        fadeValue = this.sharpCurve(value);
        break;
    }

    this.crossfader.fade.rampTo(fadeValue, 0.01);
  }

  private smoothCurve(x: number): number {
    return 0.5 * (1 + Math.sin(Math.PI * (x - 0.5)));
  }

  private sharpCurve(x: number): number {
    if (x < 0.1) return 0;
    if (x > 0.9) return 1;
    return (x - 0.1) / 0.8;
  }

  setCrossfaderCurve(curve: CrossfaderConfig["curve"]): void {
    this.crossfaderConfig.curve = curve;
    this.setCrossfaderPosition(this.crossfaderConfig.position);
  }

  setMasterGain(gain: number): void {
    const value = Math.max(0, Math.min(1, gain));
    this.masterConfig.gain = value;
    this.masterGain.gain.rampTo(value, 0.05);
  }

  setMasterLimiter(enabled: boolean, threshold?: number): void {
    this.masterConfig.limiterEnabled = enabled;

    if (threshold !== undefined) {
      this.masterConfig.limiterThreshold = Math.max(
        -30,
        Math.min(0, threshold),
      );
      this.masterLimiter.threshold.value = this.masterConfig.limiterThreshold;
    }
  }

  setMasterCompressor(
    enabled: boolean,
    ratio?: number,
    threshold?: number,
    attack?: number,
    release?: number,
  ): void {
    this.masterConfig.compressorEnabled = enabled;

    if (ratio !== undefined) {
      this.masterConfig.compressorRatio = Math.max(1, Math.min(20, ratio));
      this.masterCompressor.ratio.value = this.masterConfig.compressorRatio;
    }

    if (threshold !== undefined) {
      this.masterConfig.compressorThreshold = Math.max(
        -60,
        Math.min(0, threshold),
      );
      this.masterCompressor.threshold.value =
        this.masterConfig.compressorThreshold;
    }

    if (attack !== undefined) {
      this.masterConfig.compressorAttack = Math.max(0, Math.min(1, attack));
      this.masterCompressor.attack.value = this.masterConfig.compressorAttack;
    }

    if (release !== undefined) {
      this.masterConfig.compressorRelease = Math.max(0, Math.min(1, release));
      this.masterCompressor.release.value = this.masterConfig.compressorRelease;
    }
  }

  setCueChannel(channel: number, enabled: boolean): void {
    if (channel < 0 || channel >= 4) return;

    this.channels[channel].config.cueEnable = enabled;
    this.channels[channel].cueGain.gain.rampTo(enabled ? 1 : 0, 0.05);
  }

  connectSource(channel: number, source: Tone.ToneAudioNode): void {
    if (channel < 0 || channel >= 4) return;

    source.connect(this.channels[channel].input);
  }

  disconnectSource(channel: number, source: Tone.ToneAudioNode): void {
    if (channel < 0 || channel >= 4) return;

    source.disconnect(this.channels[channel].input);
  }

  getChannelConfig(channel: number): ChannelConfig | null {
    if (channel < 0 || channel >= 4) return null;
    return { ...this.channels[channel].config };
  }

  getCrossfaderConfig(): CrossfaderConfig {
    return { ...this.crossfaderConfig };
  }

  getMasterConfig(): MasterConfig {
    return { ...this.masterConfig };
  }

  getCueOutput(): Tone.Gain {
    return this.cueOut;
  }

  getMasterOutput(): Tone.Gain {
    return this.masterOut;
  }

  getChannelMeter(channel: number): Tone.Meter | null {
    if (channel < 0 || channel >= 4) return null;

    const meter = new Tone.Meter();
    this.channels[channel].channelOut.connect(meter);
    return meter;
  }

  getMasterMeter(): Tone.Meter {
    const meter = new Tone.Meter();
    this.masterOut.connect(meter);
    return meter;
  }

  reset(): void {
    // Reset all channels
    for (let i = 0; i < 4; i++) {
      this.setChannelGain(i, 0.75);
      this.setChannelEQ(i, "low", 0);
      this.setChannelEQ(i, "mid", 0);
      this.setChannelEQ(i, "high", 0);
      this.setChannelFilter(i, "off");
      this.setCueChannel(i, false);
    }

    // Reset crossfader
    this.setCrossfaderPosition(0.5);
    this.setCrossfaderCurve("linear");

    // Reset master
    this.setMasterGain(0.8);
    this.setMasterLimiter(true, -1);
    this.setMasterCompressor(true, 4, -24, 0.003, 0.25);
  }

  dispose(): void {
    // Disconnect and dispose all nodes
    this.channels.forEach((channel) => {
      channel.input.dispose();
      channel.gain.dispose();
      channel.eq3.dispose();
      channel.filter.dispose();
      channel.cueGain.dispose();
      channel.channelOut.dispose();
    });

    this.crossfader.dispose();
    this.masterGain.dispose();
    this.masterLimiter.dispose();
    this.masterCompressor.dispose();
    this.masterOut.dispose();
    this.cueOut.dispose();

    this.channels = [];
    this.isInitialized = false;
  }
}
