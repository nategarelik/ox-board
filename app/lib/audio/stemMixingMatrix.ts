/**
 * Stem Mixing Matrix - 4x4 mixing matrix for advanced stem routing
 * Provides gesture-controlled mixing curves, AI recommendations, and recording capabilities
 */

import * as Tone from "tone";
import { StemId } from "../../types/stem-player";
import { getAudioService } from "../../services/AudioService";
import { performanceMonitor } from "../optimization/performanceMonitor";

export interface MixingMatrixCell {
  sourceStem: StemId;
  targetStem: StemId;
  gain: number; // 0-1
  enabled: boolean;
  automation: MixingAutomation;
}

export interface MixingAutomation {
  enabled: boolean;
  curve: "linear" | "exponential" | "logarithmic" | "sine" | "custom";
  duration: number; // seconds
  keyframes: MixingKeyframe[];
}

export interface MixingKeyframe {
  time: number; // 0-1 normalized time
  value: number; // 0-1 gain value
  curve: "linear" | "ease" | "ease-in" | "ease-out";
}

export interface MixingPreset {
  id: string;
  name: string;
  description: string;
  matrix: MixingMatrixCell[][];
  automation: MixingAutomation[][];
}

export interface GestureMixingMapping {
  gesture: "pinch" | "rotation" | "spread" | "tap" | "swipe";
  parameter: "gain" | "automation" | "preset" | "routing";
  sourceStem: StemId;
  targetStem: StemId;
  sensitivity: number;
  threshold: number;
  range: [number, number];
}

export interface AIMixingRecommendation {
  id: string;
  confidence: number;
  description: string;
  adjustments: MixingMatrixAdjustment[];
  reasoning: string;
  createdAt: string;
}

export interface MixingMatrixAdjustment {
  sourceStem: StemId;
  targetStem: StemId;
  gain: number;
  automation?: MixingAutomation;
}

export interface MixingMatrixConfig {
  size: number; // 4x4 matrix
  enableAutomation: boolean;
  enableRecording: boolean;
  enableAI: boolean;
  bufferSize: number;
  automationResolution: number; // Hz
  maxRecordDuration: number; // seconds
}

/**
 * Advanced 4x4 stem mixing matrix with gesture control and AI integration
 */
export class StemMixingMatrix {
  private audioContext: AudioContext | null = null;
  private matrixNodes: Map<string, Tone.Gain> = new Map(); // "source->target" -> Gain
  private matrixInputs: Map<StemId, Tone.Gain> = new Map();
  private matrixOutputs: Map<StemId, Tone.Gain> = new Map();
  private mixingMatrix: MixingMatrixCell[][] = [];
  private isInitialized: boolean = false;

  // Configuration
  private config: MixingMatrixConfig = {
    size: 4,
    enableAutomation: true,
    enableRecording: true,
    enableAI: true,
    bufferSize: 128,
    automationResolution: 60, // 60 Hz updates
    maxRecordDuration: 300, // 5 minutes
  };

  // Automation state
  private automationEngines: Map<string, MixingAutomationEngine> = new Map();
  private automationBuffer: Map<string, Float32Array> = new Map();
  private automationPlayback: Map<string, boolean> = new Map();

  // Recording state
  private recordingBuffer: Map<string, Float32Array> = new Map();
  private isRecording: boolean = false;
  private recordStartTime: number = 0;
  private recordedDuration: number = 0;

  // AI integration
  private mixingRecommendations: AIMixingRecommendation[] = [];
  private currentRecommendation: AIMixingRecommendation | null = null;

  // Gesture mappings
  private gestureMappings: GestureMixingMapping[] = [];

  // Performance monitoring
  private performanceMetrics = {
    matrixLatency: 0,
    automationCpu: 0,
    memoryUsage: 0,
    activeConnections: 0,
  };

  constructor(config?: Partial<MixingMatrixConfig>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.initializeGestureMappings();
  }

  /**
   * Initialize the mixing matrix
   */
  async initialize(): Promise<boolean> {
    try {
      // Get audio context from AudioService
      const audioService = getAudioService();
      if (!audioService.isReady()) {
        await audioService.initialize();
      }

      this.audioContext = audioService.getContext().rawContext as AudioContext;

      // Initialize 4x4 mixing matrix
      this.initializeMixingMatrix();

      // Create audio nodes
      this.createMatrixNodes();

      // Initialize automation engines
      this.initializeAutomationEngines();

      // Load default presets
      this.loadDefaultPresets();

      this.isInitialized = true;
      console.log("✅ StemMixingMatrix initialized with 4x4 matrix");

      return true;
    } catch (error) {
      console.error("Failed to initialize StemMixingMatrix:", error);
      throw new Error(`MixingMatrix initialization failed: ${error}`);
    }
  }

  /**
   * Initialize the 4x4 mixing matrix structure
   */
  private initializeMixingMatrix(): void {
    const stemIds: StemId[] = ["vocals", "drums", "bass", "other"];

    this.mixingMatrix = [];

    for (let sourceIndex = 0; sourceIndex < this.config.size; sourceIndex++) {
      const sourceRow: MixingMatrixCell[] = [];
      const sourceStem = stemIds[sourceIndex] || `stem${sourceIndex}`;

      for (let targetIndex = 0; targetIndex < this.config.size; targetIndex++) {
        const targetStem = stemIds[targetIndex] || `stem${targetIndex}`;

        const cell: MixingMatrixCell = {
          sourceStem,
          targetStem,
          gain: sourceIndex === targetIndex ? 1.0 : 0.0, // Identity matrix by default
          enabled: true,
          automation: {
            enabled: false,
            curve: "linear",
            duration: 1.0,
            keyframes: [],
          },
        };

        sourceRow.push(cell);
      }

      this.mixingMatrix.push(sourceRow);
    }
  }

  /**
   * Create audio nodes for the mixing matrix
   */
  private createMatrixNodes(): void {
    const stemIds: StemId[] = ["vocals", "drums", "bass", "other"];

    // Create input/output nodes for each stem
    for (let i = 0; i < this.config.size; i++) {
      const stemId = stemIds[i] || `stem${i}`;

      const input = new Tone.Gain(1.0);
      const output = new Tone.Gain(1.0);

      this.matrixInputs.set(stemId, input);
      this.matrixOutputs.set(stemId, output);

      // Create cross-connection nodes
      for (let j = 0; j < this.config.size; j++) {
        const targetStem = stemIds[j] || `stem${j}`;
        const nodeKey = `${stemId}->${targetStem}`;

        const gainNode = new Tone.Gain(this.mixingMatrix[i][j].gain);
        this.matrixNodes.set(nodeKey, gainNode);

        // Connect: input -> gain -> target output
        input.connect(gainNode);
        gainNode.connect(output);
      }
    }
  }

  /**
   * Initialize automation engines for each matrix cell
   */
  private initializeAutomationEngines(): void {
    for (let sourceIndex = 0; sourceIndex < this.config.size; sourceIndex++) {
      for (let targetIndex = 0; targetIndex < this.config.size; targetIndex++) {
        const nodeKey = this.getNodeKey(sourceIndex, targetIndex);
        const automationEngine = new MixingAutomationEngine(
          nodeKey,
          this.config.automationResolution,
        );
        this.automationEngines.set(nodeKey, automationEngine);
      }
    }
  }

  /**
   * Set gain for a specific matrix cell
   */
  setMatrixGain(sourceStem: StemId, targetStem: StemId, gain: number): void {
    const cell = this.getMatrixCell(sourceStem, targetStem);
    if (!cell) return;

    const clampedGain = Math.max(0, Math.min(2, gain)); // Allow gain up to 2x for boosting
    cell.gain = clampedGain;

    const nodeKey = `${sourceStem}->${targetStem}`;
    const gainNode = this.matrixNodes.get(nodeKey);
    if (gainNode) {
      gainNode.gain.rampTo(clampedGain, 0.01);
    }

    this.updatePerformanceMetrics();
  }

  /**
   * Enable/disable a matrix cell
   */
  setMatrixEnabled(
    sourceStem: StemId,
    targetStem: StemId,
    enabled: boolean,
  ): void {
    const cell = this.getMatrixCell(sourceStem, targetStem);
    if (!cell) return;

    cell.enabled = enabled;
    this.updatePerformanceMetrics();
  }

  /**
   * Set automation for a matrix cell
   */
  setMatrixAutomation(
    sourceStem: StemId,
    targetStem: StemId,
    automation: MixingAutomation,
  ): void {
    const cell = this.getMatrixCell(sourceStem, targetStem);
    if (!cell) return;

    cell.automation = { ...automation };

    const nodeKey = `${sourceStem}->${targetStem}`;
    const engine = this.automationEngines.get(nodeKey);
    if (engine) {
      engine.setAutomation(automation);
    }
  }

  /**
   * Get matrix cell for stems
   */
  private getMatrixCell(
    sourceStem: StemId,
    targetStem: StemId,
  ): MixingMatrixCell | null {
    for (let i = 0; i < this.mixingMatrix.length; i++) {
      const row = this.mixingMatrix[i];
      const cell = row.find(
        (c) => c.sourceStem === sourceStem && c.targetStem === targetStem,
      );
      if (cell) return cell;
    }
    return null;
  }

  /**
   * Get node key for automation engine
   */
  private getNodeKey(sourceIndex: number, targetIndex: number): string {
    const stemIds: StemId[] = ["vocals", "drums", "bass", "other"];
    const sourceStem = stemIds[sourceIndex] || `stem${sourceIndex}`;
    const targetStem = stemIds[targetIndex] || `stem${targetIndex}`;
    return `${sourceStem}->${targetStem}`;
  }

  /**
   * Process gesture input for matrix control
   */
  processGesture(
    gesture: string,
    value: number,
    sourceStem?: StemId,
    targetStem?: StemId,
  ): void {
    const mapping = this.gestureMappings.find(
      (m) =>
        m.gesture === gesture &&
        (!sourceStem || m.sourceStem === sourceStem) &&
        (!targetStem || m.targetStem === targetStem),
    );

    if (!mapping) return;

    const adjustedValue =
      value * (mapping.range[1] - mapping.range[0]) + mapping.range[0];
    const clampedValue = Math.max(
      mapping.range[0],
      Math.min(mapping.range[1], adjustedValue),
    );

    switch (mapping.parameter) {
      case "gain":
        if (sourceStem && targetStem) {
          this.setMatrixGain(sourceStem, targetStem, clampedValue);
        }
        break;

      case "automation":
        if (sourceStem && targetStem) {
          this.toggleAutomation(sourceStem, targetStem);
        }
        break;

      case "preset":
        this.applyRandomPreset();
        break;

      case "routing":
        this.cycleRouting(sourceStem!, clampedValue > 0.5 ? 1 : -1);
        break;
    }
  }

  /**
   * Toggle automation for a matrix cell
   */
  private toggleAutomation(sourceStem: StemId, targetStem: StemId): void {
    const cell = this.getMatrixCell(sourceStem, targetStem);
    if (!cell) return;

    cell.automation.enabled = !cell.automation.enabled;

    const nodeKey = `${sourceStem}->${targetStem}`;
    const engine = this.automationEngines.get(nodeKey);
    if (engine) {
      engine.setEnabled(cell.automation.enabled);
    }
  }

  /**
   * Apply a mixing preset
   */
  applyPreset(preset: MixingPreset): void {
    // Apply matrix configuration
    for (let sourceIndex = 0; sourceIndex < this.config.size; sourceIndex++) {
      for (let targetIndex = 0; targetIndex < this.config.size; targetIndex++) {
        const cell = this.mixingMatrix[sourceIndex][targetIndex];
        const presetCell = preset.matrix[sourceIndex]?.[targetIndex];

        if (presetCell) {
          this.setMatrixGain(cell.sourceStem, cell.targetStem, presetCell.gain);
          this.setMatrixEnabled(
            cell.sourceStem,
            cell.targetStem,
            presetCell.enabled,
          );
          if (presetCell.automation) {
            this.setMatrixAutomation(
              cell.sourceStem,
              cell.targetStem,
              presetCell.automation,
            );
          }
        }
      }
    }

    console.log(`🎛️ Applied mixing preset: ${preset.name}`);
  }

  /**
   * Apply a random preset
   */
  private applyRandomPreset(): void {
    const presets = this.getAvailablePresets();
    if (presets.length === 0) return;

    const randomPreset = presets[Math.floor(Math.random() * presets.length)];
    this.applyPreset(randomPreset);
  }

  /**
   * Cycle through routing configurations
   */
  private cycleRouting(sourceStem: StemId, direction: number): void {
    // Get current routing for this source stem
    const sourceIndex = this.getStemIndex(sourceStem);
    if (sourceIndex < 0) return;

    const currentRow = this.mixingMatrix[sourceIndex];
    const enabledTargets = currentRow.filter((cell) => cell.enabled);

    if (enabledTargets.length === 0) return;

    // Find current primary target
    const primaryTarget = enabledTargets.reduce((prev, current) =>
      prev.gain > current.gain ? prev : current,
    );

    const primaryIndex = currentRow.findIndex((cell) => cell === primaryTarget);

    // Cycle to next target
    const nextIndex =
      (primaryIndex + direction + this.config.size) % this.config.size;

    // Disable all targets
    currentRow.forEach((cell) => {
      this.setMatrixEnabled(cell.sourceStem, cell.targetStem, false);
    });

    // Enable new primary target
    this.setMatrixEnabled(sourceStem, currentRow[nextIndex].targetStem, true);
    this.setMatrixGain(sourceStem, currentRow[nextIndex].targetStem, 1.0);
  }

  /**
   * Start recording matrix automation
   */
  startRecording(): void {
    if (!this.config.enableRecording) return;

    this.isRecording = true;
    this.recordStartTime = this.audioContext?.currentTime || 0;
    this.recordingBuffer.clear();

    console.log("🎬 Started recording mixing matrix automation");
  }

  /**
   * Stop recording and save automation
   */
  stopRecording(): void {
    if (!this.isRecording) return;

    this.isRecording = false;
    this.recordedDuration =
      (this.audioContext?.currentTime || 0) - this.recordStartTime;

    // Process recorded data into automation curves
    this.processRecording();

    console.log(`⏹️ Stopped recording (${this.recordedDuration.toFixed(2)}s)`);
  }

  /**
   * Process recorded data into automation curves
   */
  private processRecording(): void {
    this.recordingBuffer.forEach((buffer, nodeKey) => {
      const engine = this.automationEngines.get(nodeKey);
      if (engine) {
        const automation = this.generateAutomationFromRecording(buffer);
        engine.setAutomation(automation);
      }
    });

    this.recordingBuffer.clear();
  }

  /**
   * Generate automation curve from recorded data
   */
  private generateAutomationFromRecording(
    buffer: Float32Array,
  ): MixingAutomation {
    // Analyze buffer to create keyframes
    const keyframes: MixingKeyframe[] = [];
    const duration = buffer.length / this.config.automationResolution;

    // Create keyframes at significant changes
    for (
      let i = 0;
      i < buffer.length;
      i += Math.floor(this.config.automationResolution / 4)
    ) {
      const slice = buffer.slice(i, Math.min(i + 10, buffer.length));
      const avgValue = slice.reduce((sum, val) => sum + val, 0) / slice.length;

      if (
        keyframes.length === 0 ||
        Math.abs(avgValue - keyframes[keyframes.length - 1].value) > 0.1
      ) {
        keyframes.push({
          time: i / buffer.length,
          value: avgValue,
          curve: "linear",
        });
      }
    }

    return {
      enabled: true,
      curve: "custom",
      duration,
      keyframes,
    };
  }

  /**
   * Apply AI mixing recommendation
   */
  applyAIRecommendation(recommendation: AIMixingRecommendation): void {
    if (!this.config.enableAI) return;

    this.currentRecommendation = recommendation;

    // Apply recommended adjustments
    recommendation.adjustments.forEach((adjustment) => {
      this.setMatrixGain(
        adjustment.sourceStem,
        adjustment.targetStem,
        adjustment.gain,
      );
      if (adjustment.automation) {
        this.setMatrixAutomation(
          adjustment.sourceStem,
          adjustment.targetStem,
          adjustment.automation,
        );
      }
    });

    console.log(
      `🤖 Applied AI mixing recommendation: ${recommendation.description}`,
    );
  }

  /**
   * Generate AI mixing recommendation based on current mix
   */
  generateAIRecommendation(): AIMixingRecommendation {
    // Analyze current mixing matrix
    const analysis = this.analyzeCurrentMix();

    // Generate recommendations based on analysis
    const recommendations = this.generateRecommendations(analysis);

    const recommendation: AIMixingRecommendation = {
      id: `rec_${Date.now()}`,
      confidence: 0.8,
      description:
        recommendations[Math.floor(Math.random() * recommendations.length)],
      adjustments: this.generateMixingAdjustments(analysis),
      reasoning: "Based on spectral analysis and mixing best practices",
      createdAt: new Date().toISOString(),
    };

    this.mixingRecommendations.push(recommendation);
    return recommendation;
  }

  /**
   * Analyze current mixing configuration
   */
  private analyzeCurrentMix(): any {
    const totalGain = this.mixingMatrix
      .flat()
      .reduce((sum, cell) => sum + cell.gain, 0);
    const enabledConnections = this.mixingMatrix
      .flat()
      .filter((cell) => cell.enabled).length;

    return {
      totalGain,
      enabledConnections,
      averageGain: totalGain / (this.config.size * this.config.size),
      balanceScore: this.calculateBalanceScore(),
    };
  }

  /**
   * Calculate mixing balance score
   */
  private calculateBalanceScore(): number {
    const gains = this.mixingMatrix.flat().map((cell) => cell.gain);
    const avgGain = gains.reduce((sum, gain) => sum + gain, 0) / gains.length;
    const variance =
      gains.reduce((sum, gain) => sum + Math.pow(gain - avgGain, 2), 0) /
      gains.length;

    // Lower variance = better balance
    return Math.max(0, 1 - variance);
  }

  /**
   * Generate mixing recommendations
   */
  private generateRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    if (analysis.averageGain > 1.5) {
      recommendations.push(
        "Consider reducing overall gain to prevent clipping",
      );
    }

    if (analysis.balanceScore < 0.5) {
      recommendations.push("Balance the mix by adjusting stem levels");
    }

    if (analysis.enabledConnections < 4) {
      recommendations.push("Add more routing connections for creative mixing");
    }

    if (recommendations.length === 0) {
      recommendations.push(
        "Current mix looks good! Try adding automation for movement",
      );
    }

    return recommendations;
  }

  /**
   * Generate specific mixing adjustments
   */
  private generateMixingAdjustments(analysis: any): MixingMatrixAdjustment[] {
    const adjustments: MixingMatrixAdjustment[] = [];

    // Balance vocals if they're too quiet
    const vocalsCell = this.getMatrixCell("vocals", "vocals");
    if (vocalsCell && vocalsCell.gain < 0.7) {
      adjustments.push({
        sourceStem: "vocals",
        targetStem: "vocals",
        gain: 0.8,
      });
    }

    // Add some creative routing if mix is too plain
    if (analysis.enabledConnections < 6) {
      adjustments.push({
        sourceStem: "drums",
        targetStem: "vocals",
        gain: 0.2,
      });
    }

    return adjustments;
  }

  /**
   * Get stem input node
   */
  getStemInput(stemId: StemId): Tone.InputNode {
    const input = this.matrixInputs.get(stemId);
    if (!input) {
      throw new Error(`Stem input not found: ${stemId}`);
    }
    return input;
  }

  /**
   * Get stem output node
   */
  getStemOutput(stemId: StemId): Tone.OutputNode {
    const output = this.matrixOutputs.get(stemId);
    if (!output) {
      throw new Error(`Stem output not found: ${stemId}`);
    }
    return output;
  }

  /**
   * Get current mixing matrix state
   */
  getMixingMatrix(): MixingMatrixCell[][] {
    return this.mixingMatrix.map((row) => row.map((cell) => ({ ...cell })));
  }

  /**
   * Get available presets
   */
  getAvailablePresets(): MixingPreset[] {
    return [
      this.createVocalFocusPreset(),
      this.createDrumFocusPreset(),
      this.createInstrumentalPreset(),
      this.createCreativeRoutingPreset(),
    ];
  }

  /**
   * Initialize default gesture mappings
   */
  private initializeGestureMappings(): void {
    this.gestureMappings = [
      {
        gesture: "pinch",
        parameter: "gain",
        sourceStem: "vocals",
        targetStem: "vocals",
        sensitivity: 1.0,
        threshold: 0.1,
        range: [0, 2],
      },
      {
        gesture: "rotation",
        parameter: "automation",
        sourceStem: "drums",
        targetStem: "drums",
        sensitivity: 1.0,
        threshold: 0.05,
        range: [0, 1],
      },
      {
        gesture: "spread",
        parameter: "preset",
        sourceStem: "bass",
        targetStem: "bass",
        sensitivity: 1.0,
        threshold: 0.1,
        range: [0, 1],
      },
      {
        gesture: "tap",
        parameter: "routing",
        sourceStem: "other",
        targetStem: "other",
        sensitivity: 1.0,
        threshold: 0.8,
        range: [0, 1],
      },
    ];
  }

  /**
   * Create vocal focus preset
   */
  private createVocalFocusPreset(): MixingPreset {
    const matrix: MixingMatrixCell[][] = this.mixingMatrix.map((row) =>
      row.map((cell) => ({
        ...cell,
        gain: cell.sourceStem === "vocals" ? 1.2 : 0.6,
        enabled:
          cell.sourceStem === cell.targetStem || cell.sourceStem === "vocals",
      })),
    );

    return {
      id: "vocal_focus",
      name: "Vocal Focus",
      description: "Emphasize vocals with balanced backing",
      matrix,
      automation: [],
    };
  }

  /**
   * Create drum focus preset
   */
  private createDrumFocusPreset(): MixingPreset {
    const matrix: MixingMatrixCell[][] = this.mixingMatrix.map((row) =>
      row.map((cell) => ({
        ...cell,
        gain: cell.sourceStem === "drums" ? 1.3 : 0.7,
        enabled:
          cell.sourceStem === cell.targetStem || cell.sourceStem === "drums",
      })),
    );

    return {
      id: "drum_focus",
      name: "Drum Focus",
      description: "Heavy drums with supporting elements",
      matrix,
      automation: [],
    };
  }

  /**
   * Create instrumental preset
   */
  private createInstrumentalPreset(): MixingPreset {
    const matrix: MixingMatrixCell[][] = this.mixingMatrix.map((row) =>
      row.map((cell) => ({
        ...cell,
        gain: cell.sourceStem === "vocals" ? 0.0 : 0.9,
        enabled: cell.sourceStem !== "vocals",
      })),
    );

    return {
      id: "instrumental",
      name: "Instrumental",
      description: "Vocal-free mix for instrumental versions",
      matrix,
      automation: [],
    };
  }

  /**
   * Create creative routing preset
   */
  private createCreativeRoutingPreset(): MixingPreset {
    const matrix: MixingMatrixCell[][] = this.mixingMatrix.map(
      (row, sourceIndex) =>
        row.map((cell, targetIndex) => ({
          ...cell,
          gain: sourceIndex === targetIndex ? 0.5 : 0.3,
          enabled: Math.random() > 0.3, // Random creative routing
        })),
    );

    return {
      id: "creative",
      name: "Creative Routing",
      description: "Experimental cross-stem routing",
      matrix,
      automation: [],
    };
  }

  /**
   * Load default presets
   */
  private loadDefaultPresets(): void {
    const presets = this.getAvailablePresets();

    // Apply first preset by default
    if (presets.length > 0) {
      this.applyPreset(presets[0]);
    }
  }

  /**
   * Get stem index
   */
  private getStemIndex(stemId: StemId): number {
    const stemIds: StemId[] = ["vocals", "drums", "bass", "other"];
    return stemIds.indexOf(stemId);
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(): void {
    const activeConnections = this.mixingMatrix
      .flat()
      .filter((cell) => cell.enabled).length;
    this.performanceMetrics.activeConnections = activeConnections;

    // Estimate memory usage
    let memoryUsage = 0;
    this.automationBuffer.forEach((buffer) => {
      memoryUsage += buffer.length * 4; // 4 bytes per float
    });
    this.performanceMetrics.memoryUsage = memoryUsage;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Get recording state
   */
  getRecordingState() {
    return {
      isRecording: this.isRecording,
      duration: this.recordedDuration,
      bufferSize: this.recordingBuffer.size,
    };
  }

  /**
   * Get AI recommendations
   */
  getAIRecommendations(): AIMixingRecommendation[] {
    return [...this.mixingRecommendations];
  }

  /**
   * Clear all automation
   */
  clearAutomation(): void {
    this.automationEngines.forEach((engine) => {
      engine.clearAutomation();
    });

    this.mixingMatrix.forEach((row) => {
      row.forEach((cell) => {
        cell.automation.enabled = false;
        cell.automation.keyframes = [];
      });
    });

    console.log("🗑️ Cleared all mixing automation");
  }

  /**
   * Reset matrix to identity
   */
  resetMatrix(): void {
    this.mixingMatrix.forEach((row, sourceIndex) => {
      row.forEach((cell, targetIndex) => {
        const isIdentity = sourceIndex === targetIndex;
        this.setMatrixGain(
          cell.sourceStem,
          cell.targetStem,
          isIdentity ? 1.0 : 0.0,
        );
        this.setMatrixEnabled(cell.sourceStem, cell.targetStem, isIdentity);
      });
    });

    this.clearAutomation();
    console.log("🔄 Reset mixing matrix to identity");
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    // Dispose all matrix nodes
    this.matrixNodes.forEach((node) => node.dispose());
    this.matrixInputs.forEach((node) => node.dispose());
    this.matrixOutputs.forEach((node) => node.dispose());

    // Clear automation engines
    this.automationEngines.forEach((engine) => engine.dispose());
    this.automationBuffer.clear();
    this.recordingBuffer.clear();

    this.matrixNodes.clear();
    this.matrixInputs.clear();
    this.matrixOutputs.clear();
    this.automationEngines.clear();

    this.isInitialized = false;
    console.log("🗑️ StemMixingMatrix disposed");
  }
}

/**
 * Automation engine for smooth parameter transitions
 */
class MixingAutomationEngine {
  private nodeKey: string;
  private resolution: number;
  private automation: MixingAutomation | null = null;
  private isEnabled: boolean = false;
  private currentValue: number = 1.0;
  private automationInterval: NodeJS.Timeout | null = null;

  constructor(nodeKey: string, resolution: number) {
    this.nodeKey = nodeKey;
    this.resolution = resolution;
  }

  setAutomation(automation: MixingAutomation): void {
    this.automation = { ...automation };
    if (automation.enabled) {
      this.startAutomation();
    }
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (enabled && this.automation) {
      this.startAutomation();
    } else {
      this.stopAutomation();
    }
  }

  private startAutomation(): void {
    if (this.automationInterval || !this.automation) return;

    const intervalMs = 1000 / this.resolution;

    this.automationInterval = setInterval(() => {
      if (this.automation && this.isEnabled) {
        this.currentValue = this.calculateAutomationValue();
        // Emit value change for matrix update
        this.emitAutomationValue(this.currentValue);
      }
    }, intervalMs);
  }

  private stopAutomation(): void {
    if (this.automationInterval) {
      clearInterval(this.automationInterval);
      this.automationInterval = null;
    }
  }

  private calculateAutomationValue(): number {
    if (!this.automation || this.automation.keyframes.length === 0) {
      return 1.0;
    }

    const normalizedTime =
      (Date.now() % (this.automation.duration * 1000)) /
      (this.automation.duration * 1000);

    // Simple linear interpolation between keyframes
    for (let i = 0; i < this.automation.keyframes.length - 1; i++) {
      const currentKeyframe = this.automation.keyframes[i];
      const nextKeyframe = this.automation.keyframes[i + 1];

      if (
        normalizedTime >= currentKeyframe.time &&
        normalizedTime <= nextKeyframe.time
      ) {
        const t =
          (normalizedTime - currentKeyframe.time) /
          (nextKeyframe.time - currentKeyframe.time);
        return (
          currentKeyframe.value +
          t * (nextKeyframe.value - currentKeyframe.value)
        );
      }
    }

    return this.automation.keyframes[this.automation.keyframes.length - 1]
      .value;
  }

  private emitAutomationValue(value: number): void {
    // In a real implementation, this would emit events or call callbacks
    console.log(`Automation ${this.nodeKey}: ${value.toFixed(3)}`);
  }

  clearAutomation(): void {
    this.automation = null;
    this.stopAutomation();
  }

  dispose(): void {
    this.clearAutomation();
  }
}
