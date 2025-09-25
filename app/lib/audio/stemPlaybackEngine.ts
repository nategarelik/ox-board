"use client";

import { StemMeta, StemTrack } from "../../types/stem-player";

const BASE_FREQUENCY = 180;
const STEM_INTERVAL = 65;

interface StemNode {
  oscillator: OscillatorNode;
  gain: GainNode;
  started: boolean;
}

export class StemPlaybackEngine {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private stemNodes: Map<string, StemNode> = new Map();

  async initialize() {
    if (typeof window === "undefined") return;
    if (!this.context) {
      this.context = new AudioContext({ latencyHint: "interactive" });
      this.masterGain = this.context.createGain();
      this.masterGain.gain.value = 0.8;
      this.masterGain.connect(this.context.destination);
    }
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  isReady(): boolean {
    return Boolean(this.context);
  }

  getState(): AudioContextState | "uninitialized" {
    if (!this.context) return "uninitialized";
    return this.context.state;
  }

  loadTrack(track: StemTrack) {
    if (!this.context || !this.masterGain) return;
    this.disposeStems();
    track.stems.forEach((stem, index) => {
      this.createStemNode(stem, index);
    });
  }

  syncTrack(track: StemTrack) {
    if (!this.context || !this.masterGain) return;
    const seen = new Set<string>();
    track.stems.forEach((stem, index) => {
      const node = this.stemNodes.get(stem.id);
      if (!node) {
        this.createStemNode(stem, index);
      } else {
        this.updateStemNode(node, stem);
      }
      seen.add(stem.id);
    });

    [...this.stemNodes.keys()].forEach((id) => {
      if (!seen.has(id)) {
        const node = this.stemNodes.get(id);
        if (node) {
          this.stopNode(node);
          this.stemNodes.delete(id);
        }
      }
    });
  }

  updateStem(stemId: string, volume: number, muted: boolean) {
    const node = this.stemNodes.get(stemId);
    if (!node || !this.context) return;
    const target = muted ? 0 : Math.min(1, Math.max(0, volume));
    node.gain.gain.setTargetAtTime(target, this.context.currentTime, 0.05);
  }

  async play() {
    if (!this.context) return;
    if (this.context.state === "suspended") {
      await this.context.resume();
    }
  }

  async pause() {
    if (!this.context) return;
    if (this.context.state === "running") {
      await this.context.suspend();
    }
  }

  async stop() {
    await this.pause();
  }

  dispose() {
    this.disposeStems();
    if (this.masterGain) {
      this.masterGain.disconnect();
      this.masterGain = null;
    }
    if (this.context) {
      this.context.close();
      this.context = null;
    }
  }

  private createStemNode(stem: StemMeta, index: number) {
    if (!this.context || !this.masterGain) return;
    const oscillator = this.context.createOscillator();
    oscillator.type = "triangle";
    oscillator.frequency.value = BASE_FREQUENCY + index * STEM_INTERVAL;

    const gain = this.context.createGain();
    gain.gain.value = stem.muted ? 0 : stem.volume;

    oscillator.connect(gain).connect(this.masterGain);

    const node: StemNode = { oscillator, gain, started: false };
    oscillator.start();
    node.started = true;
    this.stemNodes.set(stem.id, node);
  }

  private updateStemNode(node: StemNode, stem: StemMeta) {
    if (!this.context) return;
    const target = stem.muted ? 0 : stem.volume;
    node.gain.gain.setTargetAtTime(target, this.context.currentTime, 0.05);
  }

  private stopNode(node: StemNode) {
    try {
      if (node.started) {
        node.oscillator.stop();
      }
    } catch (error) {
      console.warn("Failed to stop oscillator", error);
    }
    node.oscillator.disconnect();
    node.gain.disconnect();
  }

  private disposeStems() {
    this.stemNodes.forEach((node) => {
      this.stopNode(node);
    });
    this.stemNodes.clear();
  }
}
