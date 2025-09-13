import * as Tone from 'tone';

// Types for mixer configuration
export interface ChannelEQ {
  low: number;    // -26dB to +26dB
  mid: number;    // -26dB to +26dB
  high: number;   // -26dB to +26dB
}

export interface ChannelConfig {
  gain: number;       // 0 to 1
  eq: ChannelEQ;      // 3-band EQ settings
  filterType: 'off' | 'lpf' | 'hpf';
  filterFreq: number; // 20Hz to 20kHz
  filterResonance: number; // 0.1 to 30
  cueEnable: boolean; // PFL (Pre Fade Listen)
}

export interface CrossfaderConfig {
  position: number;   // -1 (A) to +1 (B)
  curve: 'linear' | 'smooth' | 'sharp';
}

export interface MasterConfig {
  gain: number;       // 0 to 1
  limiterEnabled: boolean;
  limiterThreshold: number;  // -20dB to 0dB
  compressorEnabled: boolean;
  compressorRatio: number;   // 1 to 20
  compressorThreshold: number; // -40dB to 0dB
  compressorAttack: number;    // 0.003 to 1 seconds
  compressorRelease: number;   // 0.01 to 3 seconds
}

// Main 4-channel mixer class
export class AudioMixer {
  private context: Tone.BaseAudioContext;

  // Input channels (4 channels total)
  private channels: Array<{
    input: Tone.Gain;
    eq: {
      low: Tone.Filter;
      mid: Tone.Filter;
      high: Tone.Filter;
    };
    filter: Tone.Filter;
    gain: Tone.Gain;
    cue: Tone.Gain;
  }> = [];

  // Crossfader routing
  private crossfaderA: Tone.Gain;
  private crossfaderB: Tone.Gain;

  // Master section
  private masterGain: Tone.Gain;
  private compressor: Tone.Compressor;
  private limiter: Tone.Limiter;

  // Cue/Monitor system
  private cueSum: Tone.Gain;
  private cueMaster: Tone.Gain;

  // Master output
  private masterOutput: Tone.Gain;

  // Current configuration
  private config: {
    channels: ChannelConfig[];
    crossfader: CrossfaderConfig;
    master: MasterConfig;
  };

  constructor() {
    this.context = Tone.getContext();

    // Initialize default configuration
    this.config = {
      channels: Array.from({ length: 4 }, () => ({
        gain: 0.8,
        eq: { low: 0, mid: 0, high: 0 },
        filterType: 'off',
        filterFreq: 1000,
        filterResonance: 1,
        cueEnable: false,
      })),
      crossfader: {
        position: 0,
        curve: 'smooth',
      },
      master: {
        gain: 0.8,
        limiterEnabled: true,
        limiterThreshold: -3,
        compressorEnabled: true,
        compressorRatio: 4,
        compressorThreshold: -12,
        compressorAttack: 0.003,
        compressorRelease: 0.1,
      },
    };

    this.initializeAudioGraph();
  }

  private initializeAudioGraph(): void {
    // Create crossfader buses
    this.crossfaderA = new Tone.Gain(0.5);
    this.crossfaderB = new Tone.Gain(0.5);

    // Create master processing chain
    this.compressor = new Tone.Compressor({
      threshold: this.config.master.compressorThreshold,
      ratio: this.config.master.compressorRatio,
      attack: this.config.master.compressorAttack,
      release: this.config.master.compressorRelease,
    });

    this.limiter = new Tone.Limiter(this.config.master.limiterThreshold);
    this.masterGain = new Tone.Gain(this.config.master.gain);

    // Create cue system
    this.cueSum = new Tone.Gain(0);
    this.cueMaster = new Tone.Gain(0.8);

    // Create master output
    this.masterOutput = new Tone.Gain(1);

    // Initialize 4 channels
    for (let i = 0; i < 4; i++) {
      this.initializeChannel(i);
    }

    // Connect master audio path
    this.crossfaderA.connect(this.compressor);
    this.crossfaderB.connect(this.compressor);

    if (this.config.master.compressorEnabled) {
      this.compressor.connect(this.limiter);
    } else {
      // Bypass compressor if disabled
      this.crossfaderA.connect(this.limiter);
      this.crossfaderB.connect(this.limiter);
    }

    if (this.config.master.limiterEnabled) {
      this.limiter.connect(this.masterGain);
    } else {
      // Direct connection if limiter disabled
      (this.config.master.compressorEnabled ? this.compressor : this.crossfaderA)
        .connect(this.masterGain);
    }

    this.masterGain.connect(this.masterOutput);

    // Connect cue system
    this.cueSum.connect(this.cueMaster);
    this.cueMaster.connect(this.masterOutput);
  }

  private initializeChannel(channelIndex: number): void {
    const channel = {
      input: new Tone.Gain(1),
      eq: {
        // Low: 20-250Hz, shelf filter
        low: new Tone.Filter({
          frequency: 250,
          type: 'lowshelf',
          gain: 0,
        }),
        // Mid: 250-4000Hz, peaking filter
        mid: new Tone.Filter({
          frequency: 1000,
          type: 'peaking',
          gain: 0,
          Q: 1,
        }),
        // High: 4k-20kHz, shelf filter
        high: new Tone.Filter({
          frequency: 4000,
          type: 'highshelf',
          gain: 0,
        }),
      },
      filter: new Tone.Filter({
        frequency: 1000,
        type: 'lowpass',
        Q: 1,
      }),
      gain: new Tone.Gain(this.config.channels[channelIndex].gain),
      cue: new Tone.Gain(0),
    };

    // Connect channel signal path: Input → EQ → Filter → Gain
    channel.input.connect(channel.eq.low);
    channel.eq.low.connect(channel.eq.mid);
    channel.eq.mid.connect(channel.eq.high);
    channel.eq.high.connect(channel.filter);
    channel.filter.connect(channel.gain);

    // Route to crossfader (channels 0,2 → A, channels 1,3 → B)
    if (channelIndex % 2 === 0) {
      channel.gain.connect(this.crossfaderA);
    } else {
      channel.gain.connect(this.crossfaderB);
    }

    // Connect cue tap (pre-fader from after EQ)
    channel.eq.high.connect(channel.cue);
    channel.cue.connect(this.cueSum);

    this.channels[channelIndex] = channel;
  }

  // Channel control methods
  public setChannelGain(channelIndex: number, gain: number): void {
    if (channelIndex < 0 || channelIndex >= 4) return;

    const clampedGain = Math.max(0, Math.min(1, gain));
    this.config.channels[channelIndex].gain = clampedGain;
    this.channels[channelIndex].gain.gain.rampTo(clampedGain, 0.01);
  }

  public setChannelEQ(channelIndex: number, band: keyof ChannelEQ, value: number): void {
    if (channelIndex < 0 || channelIndex >= 4) return;

    const clampedValue = Math.max(-26, Math.min(26, value));
    this.config.channels[channelIndex].eq[band] = clampedValue;

    const channel = this.channels[channelIndex];

    switch (band) {
      case 'low':
        (channel.eq.low as any).gain.rampTo(clampedValue, 0.01);
        break;
      case 'mid':
        (channel.eq.mid as any).gain.rampTo(clampedValue, 0.01);
        break;
      case 'high':
        (channel.eq.high as any).gain.rampTo(clampedValue, 0.01);
        break;
    }
  }

  public setChannelFilter(
    channelIndex: number,
    type: 'off' | 'lpf' | 'hpf',
    frequency: number,
    resonance: number
  ): void {
    if (channelIndex < 0 || channelIndex >= 4) return;

    const channel = this.channels[channelIndex];
    const config = this.config.channels[channelIndex];

    config.filterType = type;
    config.filterFreq = Math.max(20, Math.min(20000, frequency));
    config.filterResonance = Math.max(0.1, Math.min(30, resonance));

    if (type === 'off') {
      // Bypass filter by setting very wide frequency range
      channel.filter.type = 'allpass';
    } else {
      channel.filter.type = type === 'lpf' ? 'lowpass' : 'highpass';
      channel.filter.frequency.rampTo(config.filterFreq, 0.01);
      channel.filter.Q.rampTo(config.filterResonance, 0.01);
    }
  }

  public setChannelCue(channelIndex: number, enabled: boolean): void {
    if (channelIndex < 0 || channelIndex >= 4) return;

    this.config.channels[channelIndex].cueEnable = enabled;
    this.channels[channelIndex].cue.gain.rampTo(enabled ? 1 : 0, 0.01);
  }

  // Crossfader control methods
  public setCrossfaderPosition(position: number): void {
    const clampedPosition = Math.max(-1, Math.min(1, position));
    this.config.crossfader.position = clampedPosition;

    const { gainA, gainB } = this.calculateCrossfaderGains(clampedPosition);

    this.crossfaderA.gain.rampTo(gainA, 0.01);
    this.crossfaderB.gain.rampTo(gainB, 0.01);
  }

  public setCrossfaderCurve(curve: 'linear' | 'smooth' | 'sharp'): void {
    this.config.crossfader.curve = curve;
    // Re-apply current position with new curve
    this.setCrossfaderPosition(this.config.crossfader.position);
  }

  private calculateCrossfaderGains(position: number): { gainA: number; gainB: number } {
    const curve = this.config.crossfader.curve;

    // Normalize position to 0-1 range
    const normalizedPos = (position + 1) / 2;

    let gainA: number, gainB: number;

    switch (curve) {
      case 'linear':
        gainA = 1 - normalizedPos;
        gainB = normalizedPos;
        break;

      case 'smooth':
        // Smooth curve using sine/cosine
        gainA = Math.cos(normalizedPos * Math.PI / 2);
        gainB = Math.sin(normalizedPos * Math.PI / 2);
        break;

      case 'sharp':
        // Sharp curve with more aggressive transition
        gainA = Math.pow(1 - normalizedPos, 2);
        gainB = Math.pow(normalizedPos, 2);
        break;

      default:
        gainA = 1 - normalizedPos;
        gainB = normalizedPos;
    }

    return { gainA, gainB };
  }

  // Master section control methods
  public setMasterGain(gain: number): void {
    const clampedGain = Math.max(0, Math.min(1, gain));
    this.config.master.gain = clampedGain;
    this.masterGain.gain.rampTo(clampedGain, 0.01);
  }

  public setLimiter(enabled: boolean, threshold: number = -3): void {
    this.config.master.limiterEnabled = enabled;
    this.config.master.limiterThreshold = Math.max(-20, Math.min(0, threshold));

    // Limiter enable/disable requires reconnecting the audio graph
    this.reconnectMasterChain();
  }

  public setCompressor(
    enabled: boolean,
    ratio: number = 4,
    threshold: number = -12,
    attack: number = 0.003,
    release: number = 0.1
  ): void {
    const config = this.config.master;
    config.compressorEnabled = enabled;
    config.compressorRatio = Math.max(1, Math.min(20, ratio));
    config.compressorThreshold = Math.max(-40, Math.min(0, threshold));
    config.compressorAttack = Math.max(0.003, Math.min(1, attack));
    config.compressorRelease = Math.max(0.01, Math.min(3, release));

    // Update compressor parameters
    this.compressor.ratio.rampTo(config.compressorRatio, 0.01);
    this.compressor.threshold.rampTo(config.compressorThreshold, 0.01);
    this.compressor.attack.rampTo(config.compressorAttack, 0.01);
    this.compressor.release.rampTo(config.compressorRelease, 0.01);

    // Compressor enable/disable requires reconnecting the audio graph
    this.reconnectMasterChain();
  }

  private reconnectMasterChain(): void {
    // Disconnect existing connections
    this.crossfaderA.disconnect();
    this.crossfaderB.disconnect();
    this.compressor.disconnect();
    this.limiter.disconnect();

    // Reconnect based on current settings
    if (this.config.master.compressorEnabled) {
      this.crossfaderA.connect(this.compressor);
      this.crossfaderB.connect(this.compressor);

      if (this.config.master.limiterEnabled) {
        this.compressor.connect(this.limiter);
        this.limiter.connect(this.masterGain);
      } else {
        this.compressor.connect(this.masterGain);
      }
    } else {
      if (this.config.master.limiterEnabled) {
        this.crossfaderA.connect(this.limiter);
        this.crossfaderB.connect(this.limiter);
        this.limiter.connect(this.masterGain);
      } else {
        this.crossfaderA.connect(this.masterGain);
        this.crossfaderB.connect(this.masterGain);
      }
    }
  }

  // Connection methods for external audio sources
  public connectToChannel(source: Tone.ToneAudioNode, channelIndex: number): void {
    if (channelIndex < 0 || channelIndex >= 4) return;
    source.connect(this.channels[channelIndex].input);
  }

  public connectMasterOutput(destination: Tone.ToneAudioNode): void {
    this.masterOutput.connect(destination);
  }

  public connectCueOutput(destination: Tone.ToneAudioNode): void {
    this.cueMaster.connect(destination);
  }

  // Utility methods
  public getChannelConfig(channelIndex: number): ChannelConfig | null {
    if (channelIndex < 0 || channelIndex >= 4) return null;
    return { ...this.config.channels[channelIndex] };
  }

  public getCrossfaderConfig(): CrossfaderConfig {
    return { ...this.config.crossfader };
  }

  public getMasterConfig(): MasterConfig {
    return { ...this.config.master };
  }

  // Clean up resources
  public dispose(): void {
    // Dispose all Tone.js objects
    this.channels.forEach(channel => {
      channel.input.dispose();
      channel.eq.low.dispose();
      channel.eq.mid.dispose();
      channel.eq.high.dispose();
      channel.filter.dispose();
      channel.gain.dispose();
      channel.cue.dispose();
    });

    this.crossfaderA.dispose();
    this.crossfaderB.dispose();
    this.compressor.dispose();
    this.limiter.dispose();
    this.masterGain.dispose();
    this.cueSum.dispose();
    this.cueMaster.dispose();
    this.masterOutput.dispose();
  }
}