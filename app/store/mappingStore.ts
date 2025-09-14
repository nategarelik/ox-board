/**
 * Mapping store using Zustand
 * Manages gesture mapping configuration, presets, and runtime state
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { subscribeWithSelector } from 'zustand/middleware';

import {
  GestureMapping,
  MappingPreset,
  ActiveGesture,
  GestureConflict,
  CalibrationData,
  MappingPerformance,
  MappingValidationResult,
  MappingExport,
  MappingImportOptions,
  GestureType,
  AudioControlType,
  DeckTarget,
  ChannelTarget,
} from '../types/mapping';
import { GestureMappingRegistry, createBasicMapping, createDefaultZone } from '../lib/gesture/mapping';

// =============================================================================
// STORE INTERFACES
// =============================================================================

export interface MappingStoreState {
  // Core registry
  registry: GestureMappingRegistry;
  initialized: boolean;

  // Mappings and presets
  mappings: Map<string, GestureMapping>;
  presets: Map<string, MappingPreset>;
  currentPresetId: string | null;

  // Runtime state
  activeGestures: ActiveGesture[];
  conflicts: GestureConflict[];
  calibration: CalibrationData | null;
  performance: MappingPerformance | null;

  // UI state
  selectedMappingId: string | null;
  selectedPresetId: string | null;
  isCalibrating: boolean;
  showConflicts: boolean;
  showZones: boolean;

  // Settings
  settings: {
    globalSensitivity: number;
    globalSmoothing: number;
    globalConfidenceBoost: number;
    allowConflicts: boolean;
    enablePerformanceMonitoring: boolean;
    autoResolveConflicts: boolean;
    maxActiveGestures: number;
  };

  // Import/export state
  lastExport: MappingExport | null;
  importHistory: Array<{
    timestamp: Date;
    presetsImported: number;
    mappingsImported: number;
    source: string;
  }>;
}

export interface MappingStoreActions {
  // Initialization
  initialize: () => Promise<void>;
  cleanup: () => void;

  // Mapping management
  createMapping: (
    name: string,
    gestureType: GestureType,
    controlType: AudioControlType,
    options?: Partial<GestureMapping>
  ) => Promise<string>;
  updateMapping: (mappingId: string, updates: Partial<GestureMapping>) => Promise<void>;
  deleteMapping: (mappingId: string) => Promise<void>;
  toggleMapping: (mappingId: string) => Promise<void>;
  duplicateMapping: (mappingId: string, newName?: string) => Promise<string>;

  // Preset management
  createPreset: (name: string, description: string) => Promise<string>;
  updatePreset: (presetId: string, updates: Partial<MappingPreset>) => Promise<void>;
  deletePreset: (presetId: string) => Promise<void>;
  setCurrentPreset: (presetId: string | null) => Promise<void>;
  addMappingToPreset: (presetId: string, mappingId: string) => Promise<void>;
  removeMappingFromPreset: (presetId: string, mappingId: string) => Promise<void>;

  // Runtime processing
  processGestures: (gestureResults: any[], handResults: any[], timestamp?: number) => ActiveGesture[];
  clearActiveGestures: () => void;
  resolveConflict: (conflictId: string, winnerMappingId: string) => void;

  // Calibration
  startCalibration: () => Promise<void>;
  updateCalibrationPoint: (pointId: string, screenPos: any, handPos: any, confidence: number) => void;
  completeCalibration: () => Promise<CalibrationData>;
  clearCalibration: () => void;

  // Validation
  validateMapping: (mapping: GestureMapping) => MappingValidationResult;
  validatePreset: (preset: MappingPreset) => MappingValidationResult;

  // Import/export
  exportMappings: (mappingIds?: string[], includePresets?: boolean) => MappingExport;
  exportPreset: (presetId: string) => MappingExport;
  importMappings: (exportData: MappingExport, options?: MappingImportOptions) => Promise<void>;

  // Built-in presets
  loadBuiltInPresets: () => Promise<void>;
  resetToDefaults: () => Promise<void>;

  // Settings
  updateSettings: (updates: Partial<MappingStoreState['settings']>) => void;

  // UI actions
  setSelectedMapping: (mappingId: string | null) => void;
  setSelectedPreset: (presetId: string | null) => void;
  toggleShowConflicts: () => void;
  toggleShowZones: () => void;

  // Performance monitoring
  updatePerformanceMetrics: (metrics: MappingPerformance) => void;
  clearPerformanceHistory: () => void;
}

export type MappingStore = MappingStoreState & MappingStoreActions;

// =============================================================================
// DEFAULT STATES
// =============================================================================

const createDefaultSettings = (): MappingStoreState['settings'] => ({
  globalSensitivity: 1.0,
  globalSmoothing: 0.7,
  globalConfidenceBoost: 0.0,
  allowConflicts: false,
  enablePerformanceMonitoring: true,
  autoResolveConflicts: true,
  maxActiveGestures: 10,
});

const createDefaultPerformance = (): MappingPerformance => ({
  detectionLatency: 0,
  processingLatency: 0,
  totalLatency: 0,
  recognitionAccuracy: 0,
  falsePositiveRate: 0,
  falseNegativeRate: 0,
  activationFrequency: 0,
  measuredAt: new Date(),
});

// =============================================================================
// BUILT-IN PRESETS
// =============================================================================

const BUILT_IN_PRESETS: MappingPreset[] = [
  {
    id: 'preset-basic-dj',
    name: 'Basic DJ Controls',
    description: 'Essential DJ gestures for beginners',
    version: '1.0.0',
    author: 'OX-Board Team',
    mappings: [
      createBasicMapping('Crossfader Control', 'crossfader', 'crossfader', {
        description: 'Control crossfader with two-hand gesture',
        handRequirement: 'both',
        priority: 3,
        smoothing: 0.8,
      }),
      createBasicMapping('Deck A Volume', 'fist', 'deck_volume', {
        description: 'Control deck A volume with closed fist height',
        handRequirement: 'left',
        deckTarget: 'A',
        priority: 2,
        zones: [createDefaultZone('Left Deck Zone', '#ff4444')],
      }),
      createBasicMapping('Deck B Volume', 'fist', 'deck_volume', {
        description: 'Control deck B volume with closed fist height',
        handRequirement: 'right',
        deckTarget: 'B',
        priority: 2,
        zones: [createDefaultZone('Right Deck Zone', '#4444ff')],
      }),
      createBasicMapping('Master Volume', 'open_hand', 'master_volume', {
        description: 'Control master volume with open hand height',
        handRequirement: 'either',
        priority: 1,
        zones: [createDefaultZone('Master Zone', '#44ff44')],
      }),
    ],
    settings: {
      globalSensitivity: 1.0,
      globalSmoothing: 0.7,
      globalConfidenceBoost: 0.1,
      allowConflicts: false,
    },
    metadata: {
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      isBuiltIn: true,
      isReadOnly: true,
      compatibleVersion: '1.0.0',
      tags: ['basic', 'beginner', 'dj'],
    },
  },
  {
    id: 'preset-advanced-dj',
    name: 'Advanced DJ Controls',
    description: 'Comprehensive gesture set for experienced DJs',
    version: '1.0.0',
    author: 'OX-Board Team',
    mappings: [
      createBasicMapping('Crossfader Control', 'crossfader', 'crossfader', {
        handRequirement: 'both',
        priority: 5,
        smoothing: 0.9,
      }),
      createBasicMapping('Deck A EQ Low', 'point', 'deck_eq_low', {
        handRequirement: 'left',
        deckTarget: 'A',
        priority: 3,
        inputRange: { min: 0.2, max: 0.8 },
        outputRange: { min: -26, max: 26 },
      }),
      createBasicMapping('Deck B EQ High', 'point', 'deck_eq_high', {
        handRequirement: 'right',
        deckTarget: 'B',
        priority: 3,
        inputRange: { min: 0.2, max: 0.8 },
        outputRange: { min: -26, max: 26 },
      }),
      createBasicMapping('Effect Toggle', 'peace', 'effect_reverb_toggle', {
        handRequirement: 'either',
        priority: 2,
        holdTime: 500,
      }),
    ],
    settings: {
      globalSensitivity: 1.2,
      globalSmoothing: 0.8,
      globalConfidenceBoost: 0.2,
      allowConflicts: true,
    },
    metadata: {
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      isBuiltIn: true,
      isReadOnly: true,
      compatibleVersion: '1.0.0',
      tags: ['advanced', 'professional', 'dj'],
    },
  },
];

// =============================================================================
// ZUSTAND STORE
// =============================================================================

export const useMappingStore = create<MappingStore>()(
  subscribeWithSelector(
    persist(
      (set, get) => ({
        // Initial state
        registry: new GestureMappingRegistry(),
        initialized: false,
        mappings: new Map(),
        presets: new Map(),
        currentPresetId: null,
        activeGestures: [],
        conflicts: [],
        calibration: null,
        performance: null,
        selectedMappingId: null,
        selectedPresetId: null,
        isCalibrating: false,
        showConflicts: false,
        showZones: true,
        settings: createDefaultSettings(),
        lastExport: null,
        importHistory: [],

        // =============================================================================
        // INITIALIZATION
        // =============================================================================

        initialize: async () => {
          const state = get();
          if (state.initialized) return;

          try {
            // Load built-in presets
            await get().loadBuiltInPresets();

            // Set default preset if none selected
            if (!state.currentPresetId && state.presets.size > 0) {
              const firstPreset = Array.from(state.presets.keys())[0];
              await get().setCurrentPreset(firstPreset);
            }

            set({ initialized: true });
            console.log('Mapping store initialized successfully');
          } catch (error) {
            console.error('Failed to initialize mapping store:', error);
            throw error;
          }
        },

        cleanup: () => {
          const state = get();
          state.registry.clear();

          set({
            initialized: false,
            mappings: new Map(),
            activeGestures: [],
            conflicts: [],
            selectedMappingId: null,
            performance: null,
          });
        },

        // =============================================================================
        // MAPPING MANAGEMENT
        // =============================================================================

        createMapping: async (name, gestureType, controlType, options = {}) => {
          const mapping = createBasicMapping(name, gestureType, controlType, options);
          const state = get();

          // Register with registry
          state.registry.registerMapping(mapping);

          // Add to store
          const newMappings = new Map(state.mappings);
          newMappings.set(mapping.id, mapping);

          set({
            mappings: newMappings,
            selectedMappingId: mapping.id,
          });

          console.log(`Created mapping: ${name} (${mapping.id})`);
          return mapping.id;
        },

        updateMapping: async (mappingId, updates) => {
          const state = get();
          const existing = state.mappings.get(mappingId);

          if (!existing) {
            throw new Error(`Mapping not found: ${mappingId}`);
          }

          const updated = {
            ...existing,
            ...updates,
            updatedAt: new Date(),
          };

          // Validate updated mapping
          const validation = get().validateMapping(updated);
          if (!validation.isValid) {
            throw new Error(`Invalid mapping updates: ${validation.errors.map(e => e.message).join(', ')}`);
          }

          // Update registry
          state.registry.unregisterMapping(mappingId);
          state.registry.registerMapping(updated);

          // Update store
          const newMappings = new Map(state.mappings);
          newMappings.set(mappingId, updated);

          set({ mappings: newMappings });
          console.log(`Updated mapping: ${mappingId}`);
        },

        deleteMapping: async (mappingId) => {
          const state = get();

          // Remove from registry
          state.registry.unregisterMapping(mappingId);

          // Remove from store
          const newMappings = new Map(state.mappings);
          newMappings.delete(mappingId);

          // Remove from all presets
          const newPresets = new Map(state.presets);
          for (const [presetId, preset] of newPresets.entries()) {
            const updatedMappings = preset.mappings.filter(m => m.id !== mappingId);
            if (updatedMappings.length !== preset.mappings.length) {
              newPresets.set(presetId, {
                ...preset,
                mappings: updatedMappings,
                metadata: {
                  ...preset.metadata,
                  updatedAt: new Date(),
                }
              });
            }
          }

          set({
            mappings: newMappings,
            presets: newPresets,
            selectedMappingId: state.selectedMappingId === mappingId ? null : state.selectedMappingId,
          });

          console.log(`Deleted mapping: ${mappingId}`);
        },

        toggleMapping: async (mappingId) => {
          const state = get();
          const mapping = state.mappings.get(mappingId);

          if (!mapping) {
            throw new Error(`Mapping not found: ${mappingId}`);
          }

          await get().updateMapping(mappingId, { enabled: !mapping.enabled });
        },

        duplicateMapping: async (mappingId, newName) => {
          const state = get();
          const original = state.mappings.get(mappingId);

          if (!original) {
            throw new Error(`Mapping not found: ${mappingId}`);
          }

          const duplicate = {
            ...original,
            id: `mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: newName || `${original.name} (Copy)`,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          // Register duplicate
          state.registry.registerMapping(duplicate);

          // Add to store
          const newMappings = new Map(state.mappings);
          newMappings.set(duplicate.id, duplicate);

          set({
            mappings: newMappings,
            selectedMappingId: duplicate.id,
          });

          console.log(`Duplicated mapping: ${duplicate.name} (${duplicate.id})`);
          return duplicate.id;
        },

        // =============================================================================
        // PRESET MANAGEMENT
        // =============================================================================

        createPreset: async (name, description) => {
          const preset: MappingPreset = {
            id: `preset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            description,
            version: '1.0.0',
            author: 'User',
            mappings: [],
            settings: createDefaultSettings(),
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date(),
              isBuiltIn: false,
              isReadOnly: false,
              compatibleVersion: '1.0.0',
              tags: [],
            },
          };

          const state = get();
          const newPresets = new Map(state.presets);
          newPresets.set(preset.id, preset);

          set({
            presets: newPresets,
            selectedPresetId: preset.id,
          });

          console.log(`Created preset: ${name} (${preset.id})`);
          return preset.id;
        },

        updatePreset: async (presetId, updates) => {
          const state = get();
          const existing = state.presets.get(presetId);

          if (!existing) {
            throw new Error(`Preset not found: ${presetId}`);
          }

          if (existing.metadata.isReadOnly) {
            throw new Error(`Cannot modify read-only preset: ${presetId}`);
          }

          const updated = {
            ...existing,
            ...updates,
            metadata: {
              ...existing.metadata,
              ...updates.metadata,
              updatedAt: new Date(),
            },
          };

          const newPresets = new Map(state.presets);
          newPresets.set(presetId, updated);

          set({ presets: newPresets });
          console.log(`Updated preset: ${presetId}`);
        },

        deletePreset: async (presetId) => {
          const state = get();
          const preset = state.presets.get(presetId);

          if (!preset) {
            throw new Error(`Preset not found: ${presetId}`);
          }

          if (preset.metadata.isReadOnly) {
            throw new Error(`Cannot delete read-only preset: ${presetId}`);
          }

          const newPresets = new Map(state.presets);
          newPresets.delete(presetId);

          set({
            presets: newPresets,
            currentPresetId: state.currentPresetId === presetId ? null : state.currentPresetId,
            selectedPresetId: state.selectedPresetId === presetId ? null : state.selectedPresetId,
          });

          console.log(`Deleted preset: ${presetId}`);
        },

        setCurrentPreset: async (presetId) => {
          const state = get();

          if (presetId && !state.presets.has(presetId)) {
            throw new Error(`Preset not found: ${presetId}`);
          }

          // Clear current mappings from registry
          state.registry.clear();

          // Load new preset mappings
          if (presetId) {
            const preset = state.presets.get(presetId)!;

            // Register all mappings from preset
            for (const mapping of preset.mappings) {
              state.registry.registerMapping(mapping);
            }

            // Update global settings
            set({
              currentPresetId: presetId,
              settings: { ...state.settings, ...preset.settings },
            });
          } else {
            set({ currentPresetId: null });
          }

          console.log(`Set current preset: ${presetId || 'none'}`);
        },

        addMappingToPreset: async (presetId, mappingId) => {
          const state = get();
          const preset = state.presets.get(presetId);
          const mapping = state.mappings.get(mappingId);

          if (!preset) {
            throw new Error(`Preset not found: ${presetId}`);
          }

          if (!mapping) {
            throw new Error(`Mapping not found: ${mappingId}`);
          }

          if (preset.metadata.isReadOnly) {
            throw new Error(`Cannot modify read-only preset: ${presetId}`);
          }

          // Check if mapping already in preset
          if (preset.mappings.some(m => m.id === mappingId)) {
            return; // Already added
          }

          const updatedPreset = {
            ...preset,
            mappings: [...preset.mappings, mapping],
            metadata: {
              ...preset.metadata,
              updatedAt: new Date(),
            },
          };

          const newPresets = new Map(state.presets);
          newPresets.set(presetId, updatedPreset);

          set({ presets: newPresets });
          console.log(`Added mapping ${mappingId} to preset ${presetId}`);
        },

        removeMappingFromPreset: async (presetId, mappingId) => {
          const state = get();
          const preset = state.presets.get(presetId);

          if (!preset) {
            throw new Error(`Preset not found: ${presetId}`);
          }

          if (preset.metadata.isReadOnly) {
            throw new Error(`Cannot modify read-only preset: ${presetId}`);
          }

          const updatedPreset = {
            ...preset,
            mappings: preset.mappings.filter(m => m.id !== mappingId),
            metadata: {
              ...preset.metadata,
              updatedAt: new Date(),
            },
          };

          const newPresets = new Map(state.presets);
          newPresets.set(presetId, updatedPreset);

          set({ presets: newPresets });
          console.log(`Removed mapping ${mappingId} from preset ${presetId}`);
        },

        // =============================================================================
        // RUNTIME PROCESSING
        // =============================================================================

        processGestures: (gestureResults, handResults, timestamp) => {
          const state = get();
          const activeGestures = state.registry.processGestures(gestureResults, handResults, timestamp);

          set({
            activeGestures,
            conflicts: state.registry.getCurrentConflicts(),
          });

          return activeGestures;
        },

        clearActiveGestures: () => {
          const state = get();
          // This would clear active gestures from the registry
          set({ activeGestures: [] });
        },

        resolveConflict: (conflictId, winnerMappingId) => {
          // Implementation would resolve specific conflicts
          console.log(`Resolved conflict ${conflictId} with winner ${winnerMappingId}`);
        },

        // =============================================================================
        // CALIBRATION
        // =============================================================================

        startCalibration: async () => {
          set({ isCalibrating: true });
          console.log('Started calibration');
        },

        updateCalibrationPoint: (pointId, screenPos, handPos, confidence) => {
          // Implementation would update calibration data
          console.log(`Updated calibration point ${pointId}`);
        },

        completeCalibration: async () => {
          const calibration: CalibrationData = {
            userId: 'user-' + Date.now(),
            screenDimensions: { width: 1920, height: 1080 },
            cameraResolution: { width: 640, height: 480 },
            handMetrics: {
              palmWidth: 80,
              palmHeight: 100,
              fingerLength: 70,
              handSpan: 180,
            },
            calibrationPoints: [],
            accuracyScore: 0.95,
            calibratedAt: new Date(),
            isValid: true,
          };

          const state = get();
          state.registry.setCalibration(calibration);

          set({
            calibration,
            isCalibrating: false,
          });

          console.log('Completed calibration');
          return calibration;
        },

        clearCalibration: () => {
          const state = get();
          state.registry.setCalibration(null as any);

          set({ calibration: null });
          console.log('Cleared calibration');
        },

        // =============================================================================
        // VALIDATION
        // =============================================================================

        validateMapping: (mapping) => {
          // Basic validation - in real implementation would be more comprehensive
          const errors: Array<{code: string; message: string; field?: string; severity: 'error' | 'warning' | 'info'}> = [];

          if (!mapping.name?.trim()) {
            errors.push({
              code: 'MISSING_NAME',
              message: 'Mapping name is required',
              field: 'name',
              severity: 'error'
            });
          }

          if (mapping.minConfidence < 0 || mapping.minConfidence > 1) {
            errors.push({
              code: 'INVALID_CONFIDENCE',
              message: 'Confidence must be between 0 and 1',
              field: 'minConfidence',
              severity: 'error'
            });
          }

          return {
            isValid: errors.length === 0,
            errors,
            warnings: [],
            validatedAt: new Date(),
          };
        },

        validatePreset: (preset) => {
          const errors: Array<{code: string; message: string; field?: string; severity: 'error' | 'warning' | 'info'}> = [];

          if (!preset.name?.trim()) {
            errors.push({
              code: 'MISSING_NAME',
              message: 'Preset name is required',
              field: 'name',
              severity: 'error'
            });
          }

          return {
            isValid: errors.length === 0,
            errors,
            warnings: [],
            validatedAt: new Date(),
          };
        },

        // =============================================================================
        // IMPORT/EXPORT
        // =============================================================================

        exportMappings: (mappingIds, includePresets = false) => {
          const state = get();
          const mappingsToExport = mappingIds
            ? Array.from(state.mappings.values()).filter(m => mappingIds.includes(m.id))
            : Array.from(state.mappings.values());

          const presetsToExport = includePresets
            ? Array.from(state.presets.values()).filter(p => !p.metadata.isBuiltIn)
            : [];

          const exportData: MappingExport = {
            version: '1.0.0',
            exportedAt: new Date(),
            appVersion: '1.0.0',
            presets: presetsToExport,
            mappings: mappingsToExport,
            metadata: {
              author: 'User',
              description: `Export of ${mappingsToExport.length} mappings and ${presetsToExport.length} presets`,
              tags: ['export'],
            },
          };

          set({ lastExport: exportData });
          console.log(`Exported ${mappingsToExport.length} mappings and ${presetsToExport.length} presets`);
          return exportData;
        },

        exportPreset: (presetId) => {
          const state = get();
          const preset = state.presets.get(presetId);

          if (!preset) {
            throw new Error(`Preset not found: ${presetId}`);
          }

          return get().exportMappings(preset.mappings.map(m => m.id), false);
        },

        importMappings: async (exportData, options = {}) => {
          const defaultOptions: MappingImportOptions = {
            overwriteExisting: false,
            mergePresets: true,
            validateBeforeImport: true,
            createBackup: true,
            importedAt: new Date(),
          };

          const importOptions = { ...defaultOptions, ...options };
          const state = get();

          let importedMappings = 0;
          let importedPresets = 0;

          try {
            // Import mappings
            for (const mapping of exportData.mappings) {
              if (importOptions.validateBeforeImport) {
                const validation = get().validateMapping(mapping);
                if (!validation.isValid) {
                  console.warn(`Skipping invalid mapping ${mapping.name}:`, validation.errors);
                  continue;
                }
              }

              const exists = state.mappings.has(mapping.id);
              if (exists && !importOptions.overwriteExisting) {
                console.warn(`Skipping existing mapping: ${mapping.name}`);
                continue;
              }

              // Register and store mapping
              state.registry.registerMapping(mapping);
              const newMappings = new Map(state.mappings);
              newMappings.set(mapping.id, mapping);
              set({ mappings: newMappings });

              importedMappings++;
            }

            // Import presets
            for (const preset of exportData.presets) {
              const exists = state.presets.has(preset.id);
              if (exists && !importOptions.overwriteExisting) {
                console.warn(`Skipping existing preset: ${preset.name}`);
                continue;
              }

              const newPresets = new Map(state.presets);
              newPresets.set(preset.id, {
                ...preset,
                metadata: {
                  ...preset.metadata,
                  isBuiltIn: false,
                  isReadOnly: false,
                }
              });
              set({ presets: newPresets });

              importedPresets++;
            }

            // Record import in history
            const newImportHistory = [
              ...state.importHistory,
              {
                timestamp: importOptions.importedAt,
                presetsImported: importedPresets,
                mappingsImported: importedMappings,
                source: exportData.metadata.author || 'Unknown',
              }
            ];

            set({ importHistory: newImportHistory });

            console.log(`Imported ${importedMappings} mappings and ${importedPresets} presets`);
          } catch (error) {
            console.error('Import failed:', error);
            throw error;
          }
        },

        // =============================================================================
        // BUILT-IN PRESETS
        // =============================================================================

        loadBuiltInPresets: async () => {
          const state = get();
          const newPresets = new Map(state.presets);

          for (const preset of BUILT_IN_PRESETS) {
            if (!newPresets.has(preset.id)) {
              newPresets.set(preset.id, preset);

              // Register all mappings from built-in presets
              for (const mapping of preset.mappings) {
                state.registry.registerMapping(mapping);
                const newMappings = new Map(state.mappings);
                newMappings.set(mapping.id, mapping);
                set({ mappings: newMappings });
              }
            }
          }

          set({ presets: newPresets });
          console.log(`Loaded ${BUILT_IN_PRESETS.length} built-in presets`);
        },

        resetToDefaults: async () => {
          const state = get();

          // Clear everything
          state.registry.clear();

          // Reset to default state with built-in presets
          set({
            mappings: new Map(),
            presets: new Map(),
            currentPresetId: null,
            activeGestures: [],
            conflicts: [],
            calibration: null,
            selectedMappingId: null,
            selectedPresetId: null,
            settings: createDefaultSettings(),
          });

          // Reload built-in presets
          await get().loadBuiltInPresets();

          console.log('Reset to default settings');
        },

        // =============================================================================
        // SETTINGS
        // =============================================================================

        updateSettings: (updates) => {
          const state = get();
          const newSettings = { ...state.settings, ...updates };

          set({ settings: newSettings });
          console.log('Updated mapping settings');
        },

        // =============================================================================
        // UI ACTIONS
        // =============================================================================

        setSelectedMapping: (mappingId) => {
          set({ selectedMappingId: mappingId });
        },

        setSelectedPreset: (presetId) => {
          set({ selectedPresetId: presetId });
        },

        toggleShowConflicts: () => {
          const state = get();
          set({ showConflicts: !state.showConflicts });
        },

        toggleShowZones: () => {
          const state = get();
          set({ showZones: !state.showZones });
        },

        // =============================================================================
        // PERFORMANCE MONITORING
        // =============================================================================

        updatePerformanceMetrics: (metrics) => {
          set({ performance: metrics });
        },

        clearPerformanceHistory: () => {
          set({ performance: null });
        },
      }),
      {
        name: 'ox-board-mapping-store',
        // Only persist configuration, not runtime state
        partialize: (state) => ({
          mappings: Array.from(state.mappings.entries()),
          presets: Array.from(state.presets.entries()).filter(([_, preset]) => !preset.metadata.isBuiltIn),
          currentPresetId: state.currentPresetId,
          calibration: state.calibration,
          settings: state.settings,
          showConflicts: state.showConflicts,
          showZones: state.showZones,
        }),
        // Custom serialization for Map objects
        serialize: (state) => {
          const serializable = state.partialize ? state.partialize(state.state) : state.state;
          return JSON.stringify({
            ...serializable,
            mappings: serializable.mappings ? Object.fromEntries(serializable.mappings) : {},
            presets: serializable.presets ? Object.fromEntries(serializable.presets) : {},
          });
        },
        deserialize: (str) => {
          const parsed = JSON.parse(str);
          return {
            ...parsed,
            mappings: parsed.mappings ? new Map(Object.entries(parsed.mappings)) : new Map(),
            presets: parsed.presets ? new Map(Object.entries(parsed.presets)) : new Map(),
          };
        },
      }
    )
  )
);

// =============================================================================
// STORE SELECTORS (for performance optimization)
// =============================================================================

// Mapping selectors
export const selectMapping = (mappingId: string) => (state: MappingStore) =>
  state.mappings.get(mappingId);

export const selectEnabledMappings = (state: MappingStore) =>
  Array.from(state.mappings.values()).filter(m => m.enabled);

export const selectMappingsByGesture = (gestureType: GestureType) => (state: MappingStore) =>
  Array.from(state.mappings.values()).filter(m => m.gestureType === gestureType && m.enabled);

// Preset selectors
export const selectPreset = (presetId: string) => (state: MappingStore) =>
  state.presets.get(presetId);

export const selectCurrentPreset = (state: MappingStore) =>
  state.currentPresetId ? state.presets.get(state.currentPresetId) : null;

export const selectUserPresets = (state: MappingStore) =>
  Array.from(state.presets.values()).filter(p => !p.metadata.isBuiltIn);

export const selectBuiltInPresets = (state: MappingStore) =>
  Array.from(state.presets.values()).filter(p => p.metadata.isBuiltIn);

// Runtime selectors
export const selectActiveGestures = (state: MappingStore) => state.activeGestures;
export const selectConflicts = (state: MappingStore) => state.conflicts;
export const selectCalibration = (state: MappingStore) => state.calibration;
export const selectPerformance = (state: MappingStore) => state.performance;

// UI selectors
export const selectSelectedMapping = (state: MappingStore) =>
  state.selectedMappingId ? state.mappings.get(state.selectedMappingId) : null;

export const selectSelectedPreset = (state: MappingStore) =>
  state.selectedPresetId ? state.presets.get(state.selectedPresetId) : null;

export const selectUIState = (state: MappingStore) => ({
  selectedMappingId: state.selectedMappingId,
  selectedPresetId: state.selectedPresetId,
  isCalibrating: state.isCalibrating,
  showConflicts: state.showConflicts,
  showZones: state.showZones,
});

// Settings selectors
export const selectSettings = (state: MappingStore) => state.settings;