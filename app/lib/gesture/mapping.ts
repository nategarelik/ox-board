/**
 * Gesture mapping system core implementation
 * Handles gesture-to-control registry and mapping processing
 */

import {
  GestureMapping,
  GestureType,
  AudioControlType,
  ActiveGesture,
  GestureConflict,
  InterpolationMode,
  CalibrationData,
  GestureZone,
  HandRequirement,
  DeckTarget,
  ChannelTarget
} from '../../types/mapping';
import { Point2D } from './smoothing';
import { GestureResult, HandResult } from './recognition';
import { CoordinateNormalizer } from './recognition';

// =============================================================================
// CORE MAPPING REGISTRY
// =============================================================================

/**
 * Gesture-to-control mapping registry and processor
 */
export class GestureMappingRegistry {
  private mappings: Map<string, GestureMapping> = new Map();
  private activeGestures: Map<string, ActiveGesture> = new Map();
  private conflicts: Map<string, GestureConflict> = new Map();
  private calibration: CalibrationData | null = null;
  private lastProcessTime: number = 0;

  // Performance tracking
  private readonly maxActiveGestures = 10;
  private readonly conflictResolutionTimeout = 100; // ms

  /**
   * Register a new gesture mapping
   */
  registerMapping(mapping: GestureMapping): void {
    // Validate mapping before registration
    const validation = this.validateMapping(mapping);
    if (!validation.isValid) {
      throw new Error(`Invalid mapping: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.mappings.set(mapping.id, { ...mapping });
    console.log(`Registered gesture mapping: ${mapping.name} (${mapping.id})`);
  }

  /**
   * Unregister a gesture mapping
   */
  unregisterMapping(mappingId: string): boolean {
    const removed = this.mappings.delete(mappingId);

    // Clean up any active gestures for this mapping
    this.activeGestures.delete(mappingId);

    // Clean up conflicts involving this mapping
    for (const [conflictId, conflict] of this.conflicts.entries()) {
      if (conflict.mappingIds.includes(mappingId)) {
        this.conflicts.delete(conflictId);
      }
    }

    if (removed) {
      console.log(`Unregistered gesture mapping: ${mappingId}`);
    }

    return removed;
  }

  /**
   * Get a registered mapping by ID
   */
  getMapping(mappingId: string): GestureMapping | null {
    return this.mappings.get(mappingId) || null;
  }

  /**
   * Get all registered mappings
   */
  getAllMappings(): GestureMapping[] {
    return Array.from(this.mappings.values());
  }

  /**
   * Get mappings by gesture type
   */
  getMappingsByGestureType(gestureType: GestureType): GestureMapping[] {
    return Array.from(this.mappings.values()).filter(
      mapping => mapping.gestureType === gestureType && mapping.enabled
    );
  }

  /**
   * Get mappings by control type
   */
  getMappingsByControlType(controlType: AudioControlType): GestureMapping[] {
    return Array.from(this.mappings.values()).filter(
      mapping => mapping.controlType === controlType && mapping.enabled
    );
  }

  /**
   * Process gesture detection results and trigger mappings
   */
  processGestures(
    gestureResults: GestureResult[],
    handResults: HandResult[],
    timestamp: number = Date.now()
  ): ActiveGesture[] {
    this.lastProcessTime = timestamp;
    const newActiveGestures: ActiveGesture[] = [];

    // Clear expired active gestures
    this.clearExpiredGestures(timestamp);

    // Process each detected gesture
    for (const gestureResult of gestureResults) {
      const matchingMappings = this.getMappingsByGestureType(gestureResult.type as GestureType);

      for (const mapping of matchingMappings) {
        if (!this.shouldProcessMapping(mapping, gestureResult, handResults, timestamp)) {
          continue;
        }

        const activeGesture = this.createActiveGesture(
          mapping,
          gestureResult,
          handResults,
          timestamp
        );

        if (activeGesture) {
          this.activeGestures.set(mapping.id, activeGesture);
          newActiveGestures.push(activeGesture);
        }
      }
    }

    // Resolve conflicts
    this.resolveConflicts(timestamp);

    return newActiveGestures;
  }

  /**
   * Get currently active gestures
   */
  getActiveGestures(): ActiveGesture[] {
    return Array.from(this.activeGestures.values());
  }

  /**
   * Get current conflicts
   */
  getCurrentConflicts(): GestureConflict[] {
    return Array.from(this.conflicts.values());
  }

  /**
   * Set calibration data
   */
  setCalibration(calibration: CalibrationData): void {
    this.calibration = calibration;
    console.log(`Set calibration data for user: ${calibration.userId}`);
  }

  /**
   * Get calibration data
   */
  getCalibration(): CalibrationData | null {
    return this.calibration;
  }

  /**
   * Clear all mappings and reset state
   */
  clear(): void {
    this.mappings.clear();
    this.activeGestures.clear();
    this.conflicts.clear();
    this.calibration = null;
    console.log('Cleared all gesture mappings and state');
  }

  // =============================================================================
  // PRIVATE IMPLEMENTATION METHODS
  // =============================================================================

  /**
   * Validate a gesture mapping configuration
   */
  private validateMapping(mapping: GestureMapping): { isValid: boolean; errors: Array<{message: string}> } {
    const errors: Array<{message: string}> = [];

    // Basic required fields
    if (!mapping.id?.trim()) {
      errors.push({ message: 'Mapping ID is required' });
    }
    if (!mapping.name?.trim()) {
      errors.push({ message: 'Mapping name is required' });
    }

    // Validate ranges
    if (mapping.minConfidence < 0 || mapping.minConfidence > 1) {
      errors.push({ message: 'Minimum confidence must be between 0 and 1' });
    }
    if (mapping.inputRange.min >= mapping.inputRange.max) {
      errors.push({ message: 'Input range min must be less than max' });
    }
    if (mapping.outputRange.min >= mapping.outputRange.max) {
      errors.push({ message: 'Output range min must be less than max' });
    }

    // Validate timing values
    if (mapping.holdTime < 0) {
      errors.push({ message: 'Hold time must be non-negative' });
    }
    if (mapping.cooldown < 0) {
      errors.push({ message: 'Cooldown must be non-negative' });
    }

    // Validate smoothing and dead zone
    if (mapping.smoothing < 0 || mapping.smoothing > 1) {
      errors.push({ message: 'Smoothing must be between 0 and 1' });
    }
    if (mapping.deadZone < 0 || mapping.deadZone > 1) {
      errors.push({ message: 'Dead zone must be between 0 and 1' });
    }

    // Validate zones
    for (const zone of mapping.zones) {
      if (zone.bounds.x < 0 || zone.bounds.x > 1 ||
          zone.bounds.y < 0 || zone.bounds.y > 1) {
        errors.push({ message: `Zone ${zone.name} has invalid bounds` });
      }
      if (zone.bounds.width <= 0 || zone.bounds.height <= 0) {
        errors.push({ message: `Zone ${zone.name} has invalid dimensions` });
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if a mapping should be processed for a gesture
   */
  private shouldProcessMapping(
    mapping: GestureMapping,
    gestureResult: GestureResult,
    handResults: HandResult[],
    timestamp: number
  ): boolean {
    // Check if mapping is enabled
    if (!mapping.enabled) return false;

    // Check confidence threshold
    if (gestureResult.confidence < mapping.minConfidence) return false;

    // Check hand requirements
    if (!this.checkHandRequirements(mapping.handRequirement, handResults)) return false;

    // Check cooldown
    const activeGesture = this.activeGestures.get(mapping.id);
    if (activeGesture && (timestamp - activeGesture.lastUpdate) < mapping.cooldown) {
      return false;
    }

    // Check zones (if any defined)
    if (mapping.zones.length > 0) {
      return this.checkZoneActivation(mapping.zones, gestureResult, handResults);
    }

    return true;
  }

  /**
   * Check if hand requirements are met
   */
  private checkHandRequirements(requirement: HandRequirement, handResults: HandResult[]): boolean {
    const leftHand = handResults.find(h => h.handedness === 'Left');
    const rightHand = handResults.find(h => h.handedness === 'Right');

    switch (requirement) {
      case 'left':
        return !!leftHand && leftHand.confidence > 0.5;
      case 'right':
        return !!rightHand && rightHand.confidence > 0.5;
      case 'either':
        return (leftHand && leftHand.confidence > 0.5) || (rightHand && rightHand.confidence > 0.5);
      case 'both':
        return (leftHand && leftHand.confidence > 0.5) && (rightHand && rightHand.confidence > 0.5);
      default:
        return false;
    }
  }

  /**
   * Check if gesture is within any defined zones
   */
  private checkZoneActivation(
    zones: GestureZone[],
    gestureResult: GestureResult,
    handResults: HandResult[]
  ): boolean {
    // For now, check if any hand is within any zone
    // In a real implementation, this would be more sophisticated
    for (const hand of handResults) {
      const handCenter = this.getHandCenter(hand);

      for (const zone of zones) {
        if (this.isPointInZone(handCenter, zone)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get the center point of a hand
   */
  private getHandCenter(hand: HandResult): Point2D {
    // Use wrist position as hand center
    return hand.landmarks[0] || { x: 0.5, y: 0.5 };
  }

  /**
   * Check if a point is within a zone
   */
  private isPointInZone(point: Point2D, zone: GestureZone): boolean {
    const { bounds } = zone;

    switch (zone.shape) {
      case 'rectangle':
        return point.x >= bounds.x &&
               point.x <= bounds.x + bounds.width &&
               point.y >= bounds.y &&
               point.y <= bounds.y + bounds.height;

      case 'circle':
        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;
        const radius = Math.min(bounds.width, bounds.height) / 2;
        const distance = CoordinateNormalizer.distance(point, { x: centerX, y: centerY });
        return distance <= radius;

      case 'polygon':
        return zone.polygon ? this.isPointInPolygon(point, zone.polygon) : false;

      default:
        return false;
    }
  }

  /**
   * Check if point is inside polygon using ray casting algorithm
   */
  private isPointInPolygon(point: Point2D, polygon: Point2D[]): boolean {
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (((polygon[i].y > point.y) !== (polygon[j].y > point.y)) &&
          (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) /
           (polygon[j].y - polygon[i].y) + polygon[i].x)) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Create an active gesture from mapping and detection results
   */
  private createActiveGesture(
    mapping: GestureMapping,
    gestureResult: GestureResult,
    handResults: HandResult[],
    timestamp: number
  ): ActiveGesture | null {
    // Extract raw value from gesture (this depends on gesture type)
    const rawValue = this.extractRawValue(mapping, gestureResult, handResults);
    if (rawValue === null) return null;

    // Apply calibration if available
    const calibratedValue = this.applyCalibration(rawValue, mapping);

    // Map value through interpolation
    const mappedValue = this.interpolateValue(
      calibratedValue,
      mapping.inputRange,
      mapping.outputRange,
      mapping.interpolationMode,
      mapping.inverted
    );

    // Apply dead zone
    const finalValue = this.applyDeadZone(mappedValue, mapping.deadZone);

    // Find active zone
    const activeZone = this.findActiveZone(mapping.zones, handResults);

    // Get hand positions
    const leftHand = handResults.find(h => h.handedness === 'Left');
    const rightHand = handResults.find(h => h.handedness === 'Right');

    const existingGesture = this.activeGestures.get(mapping.id);
    const isNewGesture = !existingGesture;

    return {
      mappingId: mapping.id,
      type: mapping.gestureType,
      confidence: gestureResult.confidence,
      rawValue: calibratedValue,
      mappedValue: finalValue,
      activeZone,
      startTime: isNewGesture ? timestamp : existingGesture.startTime,
      lastUpdate: timestamp,
      isHeld: existingGesture ?
        (timestamp - existingGesture.startTime >= mapping.holdTime) :
        false,
      handPositions: {
        left: leftHand ? this.getHandCenter(leftHand) : undefined,
        right: rightHand ? this.getHandCenter(rightHand) : undefined,
      }
    };
  }

  /**
   * Extract raw value from gesture based on type
   */
  private extractRawValue(
    mapping: GestureMapping,
    gestureResult: GestureResult,
    handResults: HandResult[]
  ): number | null {
    // This would be implemented based on specific gesture types
    // For now, return a basic implementation

    switch (mapping.gestureType) {
      case 'crossfader':
        if ('position' in gestureResult.data) {
          return gestureResult.data.position as number;
        }
        return null;

      case 'fist':
      case 'open_hand':
        // Return Y position of primary hand as value
        const primaryHand = handResults[0];
        if (primaryHand) {
          return this.getHandCenter(primaryHand).y;
        }
        return null;

      case 'point':
        // Return X position of pointing hand
        const pointingHand = handResults.find(h => h.handedness === 'Right') || handResults[0];
        if (pointingHand) {
          return this.getHandCenter(pointingHand).x;
        }
        return null;

      default:
        // Default to gesture confidence as value
        return gestureResult.confidence;
    }
  }

  /**
   * Apply calibration adjustments to raw value
   */
  private applyCalibration(rawValue: number, mapping: GestureMapping): number {
    if (!this.calibration) return rawValue;

    // Basic calibration adjustment based on user metrics
    // In a real implementation, this would be more sophisticated
    const adjustment = this.calibration.accuracyScore || 1.0;
    return rawValue * adjustment;
  }

  /**
   * Interpolate value through specified mode
   */
  private interpolateValue(
    value: number,
    inputRange: { min: number; max: number },
    outputRange: { min: number; max: number },
    mode: InterpolationMode,
    inverted: boolean
  ): number {
    // Normalize input value to 0-1 range
    const normalizedInput = (value - inputRange.min) / (inputRange.max - inputRange.min);
    const clampedInput = Math.max(0, Math.min(1, normalizedInput));

    // Apply inversion if requested
    const processedInput = inverted ? (1 - clampedInput) : clampedInput;

    // Apply interpolation mode
    let interpolated: number;
    switch (mode) {
      case 'linear':
        interpolated = processedInput;
        break;
      case 'logarithmic':
        interpolated = Math.log(processedInput * 9 + 1) / Math.log(10);
        break;
      case 'exponential':
        interpolated = (Math.exp(processedInput * Math.log(10)) - 1) / 9;
        break;
      case 'quadratic':
        interpolated = processedInput * processedInput;
        break;
      case 'cubic':
        interpolated = processedInput * processedInput * processedInput;
        break;
      case 'step':
        interpolated = processedInput >= 0.5 ? 1 : 0;
        break;
      default:
        interpolated = processedInput;
    }

    // Map to output range
    return outputRange.min + interpolated * (outputRange.max - outputRange.min);
  }

  /**
   * Apply dead zone to value
   */
  private applyDeadZone(value: number, deadZone: number): number {
    const absValue = Math.abs(value);
    if (absValue < deadZone) {
      return 0;
    }

    // Scale value to account for dead zone
    const sign = Math.sign(value);
    const scaledValue = (absValue - deadZone) / (1 - deadZone);
    return sign * scaledValue;
  }

  /**
   * Find which zone (if any) is currently active
   */
  private findActiveZone(zones: GestureZone[], handResults: HandResult[]): string | undefined {
    for (const hand of handResults) {
      const handCenter = this.getHandCenter(hand);

      for (const zone of zones) {
        if (this.isPointInZone(handCenter, zone)) {
          return zone.id;
        }
      }
    }

    return undefined;
  }

  /**
   * Clear expired active gestures
   */
  private clearExpiredGestures(timestamp: number): void {
    const maxAge = 500; // ms - maximum age for active gestures

    for (const [mappingId, gesture] of this.activeGestures.entries()) {
      if (timestamp - gesture.lastUpdate > maxAge) {
        this.activeGestures.delete(mappingId);
      }
    }
  }

  /**
   * Resolve conflicts between overlapping gestures
   */
  private resolveConflicts(timestamp: number): void {
    // Find potential conflicts by checking for overlapping control types
    const conflictGroups = new Map<AudioControlType, ActiveGesture[]>();

    for (const gesture of this.activeGestures.values()) {
      const mapping = this.mappings.get(gesture.mappingId);
      if (!mapping) continue;

      if (!conflictGroups.has(mapping.controlType)) {
        conflictGroups.set(mapping.controlType, []);
      }
      conflictGroups.get(mapping.controlType)!.push(gesture);
    }

    // Process conflicts
    for (const [controlType, gestures] of conflictGroups.entries()) {
      if (gestures.length > 1) {
        this.resolveControlTypeConflict(controlType, gestures, timestamp);
      }
    }

    // Clean up old conflicts
    for (const [conflictId, conflict] of this.conflicts.entries()) {
      if (timestamp - conflict.resolvedAt > this.conflictResolutionTimeout) {
        this.conflicts.delete(conflictId);
      }
    }
  }

  /**
   * Resolve conflict for a specific control type
   */
  private resolveControlTypeConflict(
    controlType: AudioControlType,
    gestures: ActiveGesture[],
    timestamp: number
  ): void {
    // Sort by priority, then confidence, then timing
    const sortedGestures = gestures.sort((a, b) => {
      const mappingA = this.mappings.get(a.mappingId)!;
      const mappingB = this.mappings.get(b.mappingId)!;

      // Higher priority wins
      if (mappingA.priority !== mappingB.priority) {
        return mappingB.priority - mappingA.priority;
      }

      // Higher confidence wins
      if (a.confidence !== b.confidence) {
        return b.confidence - a.confidence;
      }

      // Earlier start time wins
      return a.startTime - b.startTime;
    });

    const winner = sortedGestures[0];
    const mappingIds = gestures.map(g => g.mappingId);

    // Remove losing gestures
    for (let i = 1; i < sortedGestures.length; i++) {
      this.activeGestures.delete(sortedGestures[i].mappingId);
    }

    // Record the conflict resolution
    const conflictId = `${controlType}-${timestamp}`;
    this.conflicts.set(conflictId, {
      mappingIds,
      winner: winner.mappingId,
      resolvedAt: timestamp,
      reason: 'priority'
    });
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Create a default gesture zone
 */
export function createDefaultZone(name: string, color: string = '#00ff00'): GestureZone {
  return {
    id: `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    bounds: {
      x: 0.25,
      y: 0.25,
      width: 0.5,
      height: 0.5,
    },
    shape: 'rectangle',
    color,
    opacity: 0.3,
  };
}

/**
 * Create a basic gesture mapping
 */
export function createBasicMapping(
  name: string,
  gestureType: GestureType,
  controlType: AudioControlType,
  options: Partial<GestureMapping> = {}
): GestureMapping {
  const now = new Date();

  return {
    id: `mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    name,
    description: options.description || `Map ${gestureType} to ${controlType}`,
    enabled: true,
    gestureType,
    handRequirement: 'either',
    minConfidence: 0.6,
    zones: [],
    controlType,
    deckTarget: options.deckTarget,
    channelTarget: options.channelTarget,
    inputRange: { min: 0, max: 1 },
    outputRange: { min: 0, max: 1 },
    interpolationMode: 'linear',
    inverted: false,
    deadZone: 0.05,
    smoothing: 0.7,
    holdTime: 0,
    cooldown: 50,
    priority: 1,
    conflicts: [],
    createdAt: now,
    updatedAt: now,
    tags: [],
    ...options,
  };
}