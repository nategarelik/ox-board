import * as Tone from "tone";
import type { CrossfaderConfig } from "@/services/types/audio";
import { AUDIO_CONSTANTS } from "@/services/types/audio";

export class Crossfader {
  private config: CrossfaderConfig;
  private gainA: Tone.Gain;
  private gainB: Tone.Gain;
  private output: Tone.Gain;
  private lagTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CrossfaderConfig>) {
    this.config = {
      position: AUDIO_CONSTANTS.CROSSFADER_CENTER,
      curve: "linear",
      cutLag: 0,
      hamsterMode: false,
      ...config,
    };

    // Create gain nodes
    this.gainA = new Tone.Gain(0.5);
    this.gainB = new Tone.Gain(0.5);
    this.output = new Tone.Gain(1);

    // Connect to output
    this.gainA.connect(this.output);
    this.gainB.connect(this.output);

    // Apply initial position
    this.updateGains();
  }

  public setPosition(position: number): void {
    // Clamp position to valid range
    position = Math.max(
      AUDIO_CONSTANTS.CROSSFADER_A,
      Math.min(AUDIO_CONSTANTS.CROSSFADER_B, position),
    );

    // Apply hamster mode (reverse crossfader)
    if (this.config.hamsterMode) {
      position = -position;
    }

    // Apply cut lag
    if (this.config.cutLag > 0) {
      if (this.lagTimer) {
        clearTimeout(this.lagTimer);
      }

      this.lagTimer = setTimeout(() => {
        this.config.position = position;
        this.updateGains();
      }, this.config.cutLag);
    } else {
      this.config.position = position;
      this.updateGains();
    }
  }

  public setCurve(curve: CrossfaderConfig["curve"]): void {
    this.config.curve = curve;
    this.updateGains();
  }

  public setCutLag(lag: number): void {
    this.config.cutLag = Math.max(0, Math.min(50, lag));
  }

  public setHamsterMode(enabled: boolean): void {
    this.config.hamsterMode = enabled;
    this.updateGains();
  }

  public connectDeckA(source: Tone.ToneAudioNode): void {
    source.connect(this.gainA);
  }

  public connectDeckB(source: Tone.ToneAudioNode): void {
    source.connect(this.gainB);
  }

  public getOutput(): Tone.Gain {
    return this.output;
  }

  public getPosition(): number {
    return this.config.position;
  }

  public getConfig(): CrossfaderConfig {
    return { ...this.config };
  }

  private updateGains(): void {
    const { gainA, gainB } = this.calculateGains(
      this.config.position,
      this.config.curve,
    );

    // Apply gains with smooth transition
    this.gainA.gain.rampTo(gainA, 0.01);
    this.gainB.gain.rampTo(gainB, 0.01);
  }

  private calculateGains(
    position: number,
    curve: CrossfaderConfig["curve"],
  ): { gainA: number; gainB: number } {
    // Normalize position to 0-1 range
    const normalized = (position + 1) / 2; // -1 to 1 => 0 to 1

    let gainA: number;
    let gainB: number;

    switch (curve) {
      case "linear":
        gainA = 1 - normalized;
        gainB = normalized;
        break;

      case "logarithmic":
        // Logarithmic curve (smooth fade)
        gainA = Math.cos((normalized * Math.PI) / 2);
        gainB = Math.sin((normalized * Math.PI) / 2);
        break;

      case "exponential":
        // Exponential curve (sharp cut)
        gainA = Math.pow(1 - normalized, 2);
        gainB = Math.pow(normalized, 2);
        break;

      case "scratch":
        // Scratch curve (very sharp cut for scratching)
        if (normalized < 0.1) {
          gainA = 1;
          gainB = 0;
        } else if (normalized > 0.9) {
          gainA = 0;
          gainB = 1;
        } else {
          gainA = 1 - normalized;
          gainB = normalized;
        }
        break;

      case "smooth":
        // Smooth S-curve
        const t = normalized;
        const smooth = t * t * (3 - 2 * t);
        gainA = 1 - smooth;
        gainB = smooth;
        break;

      default:
        gainA = 1 - normalized;
        gainB = normalized;
    }

    // Ensure gains are in valid range
    gainA = Math.max(0, Math.min(1, gainA));
    gainB = Math.max(0, Math.min(1, gainB));

    return { gainA, gainB };
  }

  public cut(deck: "A" | "B", duration: number = 0): void {
    const targetPosition =
      deck === "A"
        ? AUDIO_CONSTANTS.CROSSFADER_A
        : AUDIO_CONSTANTS.CROSSFADER_B;

    if (duration > 0) {
      // Smooth cut
      this.animatePosition(this.config.position, targetPosition, duration);
    } else {
      // Instant cut
      this.setPosition(targetPosition);
    }
  }

  private animatePosition(from: number, to: number, duration: number): void {
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-in-out)
      const eased =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const position = from + (to - from) * eased;
      this.setPosition(position);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    animate();
  }

  public center(duration: number = 0): void {
    if (duration > 0) {
      this.animatePosition(
        this.config.position,
        AUDIO_CONSTANTS.CROSSFADER_CENTER,
        duration,
      );
    } else {
      this.setPosition(AUDIO_CONSTANTS.CROSSFADER_CENTER);
    }
  }

  public dispose(): void {
    if (this.lagTimer) {
      clearTimeout(this.lagTimer);
    }
    this.gainA.dispose();
    this.gainB.dispose();
    this.output.dispose();
  }

  // Utility methods for common operations
  public fadeIn(deck: "A" | "B", duration: number = 1000): void {
    const currentPosition = this.config.position;
    const targetPosition = deck === "A" ? -0.5 : 0.5;
    this.animatePosition(currentPosition, targetPosition, duration);
  }

  public fadeOut(deck: "A" | "B", duration: number = 1000): void {
    const currentPosition = this.config.position;
    const targetPosition = deck === "A" ? 0.5 : -0.5;
    this.animatePosition(currentPosition, targetPosition, duration);
  }

  public swap(duration: number = 500): void {
    const targetPosition = -this.config.position;
    this.animatePosition(this.config.position, targetPosition, duration);
  }

  // Get individual channel gains
  public getGainA(): number {
    return this.gainA.gain.value;
  }

  public getGainB(): number {
    return this.gainB.gain.value;
  }

  // Transform control for effects
  public transform(amount: number): void {
    // Transform effect (commonly used with effects like filter sweep)
    // This would be connected to effect parameters
    const transformed = this.config.position * amount;
    // Implementation would route to effects based on crossfader position
  }
}
