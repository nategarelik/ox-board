/**
 * Enhanced DJ Store with Music Analysis Integration
 *
 * Extends the base DJ store with comprehensive music analysis features:
 * - Real-time BPM and key detection
 * - Beat synchronization and phase tracking
 * - Harmonic mixing suggestions
 * - Auto-sync capabilities
 * - Energy level matching
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AudioMixer, ChannelConfig, CrossfaderConfig, MasterConfig } from '../lib/audio/mixer';
import { GestureControl } from '../hooks/useGestures';
import { musicAnalyzer, MusicAnalyzerClient, type AnalysisStats, type WorkerStatus } from '../lib/audio/musicAnalyzerClient';
import type {
  MusicAnalysisResult,
  BPMAnalysis,
  KeyAnalysis,
  SpectralFeatures,
  MixingSuggestions
} from '../lib/audio/musicAnalyzer';

export interface AnalyzedTrack {
  id: string;
  title: string;
  artist: string;
  duration: number;
  url?: string;

  // Analysis results
  bpm: number;
  bpmConfidence: number;
  key: string;
  keyConfidence: number;
  scale: 'major' | 'minor';
  energy: number;

  // Advanced features
  beatGrid: number[];
  downbeats: number[];
  phrases: Array<{
    start: number;
    end: number;
    type: string;
  }>;

  // Mixing metadata
  camelotKey: string;
  compatibleKeys: string[];
  mixingBPMRange: [number, number];

  // Analysis timestamp
  analyzedAt: number;
  analysisVersion: string;
}

export interface EnhancedDeck {
  id: number;
  track: AnalyzedTrack | null;
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  volume: number;
  cuePoints: number[];
  loopStart: number | null;
  loopEnd: number | null;

  // Real-time analysis
  currentBeatPhase: number;
  nextBeatTime: number;
  isInSync: boolean;
  syncAccuracy: number;

  // Auto-sync settings
  autoSyncEnabled: boolean;
  syncTarget: number | null; // ID of deck to sync with
  syncMode: 'bpm' | 'beat' | 'phrase';
}

export interface SyncSuggestion {
  sourceDeck: number;
  targetDeck: number;
  type: 'bpm' | 'key' | 'energy' | 'phrase';
  compatibility: number;
  suggestion: string;
  autoSyncPossible: boolean;
}

export interface MixingAnalysis {
  isAnalyzing: boolean;
  currentDeck: number | null;
  progress: number;
  lastAnalysis: MusicAnalysisResult | null;

  // Real-time features
  realTimeEnabled: boolean;
  spectralFeatures: SpectralFeatures | null;
  beatSyncActive: boolean;

  // Suggestions
  suggestions: SyncSuggestion[];
  compatibilityMatrix: number[][]; // Deck compatibility scores
}

export interface EnhancedDJState {
  // Base DJ functionality
  mixer: AudioMixer | null;
  channelConfigs: ChannelConfig[];
  crossfaderConfig: CrossfaderConfig;
  masterConfig: MasterConfig;

  // Enhanced decks with analysis
  decks: EnhancedDeck[];

  // Gesture Control
  gestureControls: GestureControl[];
  gestureEnabled: boolean;
  cameraActive: boolean;

  // UI State
  isDJModeActive: boolean;
  selectedDeck: number;
  viewMode: 'mixer' | 'decks' | 'effects' | 'library' | 'analysis';

  // Music Analysis
  musicAnalysis: MixingAnalysis;
  analyzerStatus: WorkerStatus | null;

  // Base Actions
  initializeMixer: () => Promise<void>;
  setChannelGain: (channel: number, gain: number) => void;
  setChannelEQ: (channel: number, band: 'low' | 'mid' | 'high', value: number) => void;
  setCrossfaderPosition: (position: number) => void;
  setMasterGain: (gain: number) => void;

  // Enhanced Deck Actions
  loadTrack: (deckId: number, track: AnalyzedTrack) => void;
  playDeck: (deckId: number) => void;
  pauseDeck: (deckId: number) => void;
  setDeckVolume: (deckId: number, volume: number) => void;
  setDeckPlaybackRate: (deckId: number, rate: number) => void;

  // Analysis Actions
  analyzeTrack: (audioData: Float32Array, trackInfo: Partial<AnalyzedTrack>) => Promise<AnalyzedTrack>;
  startRealTimeAnalysis: (deckId: number) => void;
  stopRealTimeAnalysis: (deckId: number) => void;
  updateBeatPhase: (deckId: number, currentTime: number) => void;

  // Sync Actions
  enableAutoSync: (deckId: number, targetDeckId: number, mode: 'bpm' | 'beat' | 'phrase') => void;
  disableAutoSync: (deckId: number) => void;
  syncDecks: (sourceDeckId: number, targetDeckId: number) => void;
  snapToBeat: (deckId: number) => void;

  // Mixing Suggestions
  generateMixingSuggestions: () => void;
  getMixingCompatibility: (deck1: number, deck2: number) => number;

  // Gesture Control
  updateGestureControls: (controls: GestureControl[]) => void;
  setGestureEnabled: (enabled: boolean) => void;
  setCameraActive: (active: boolean) => void;

  // UI Actions
  setDJModeActive: (active: boolean) => void;
  setSelectedDeck: (deckId: number) => void;
  setViewMode: (mode: EnhancedDJState['viewMode']) => void;

  // Utility
  reset: () => void;
}

// Camelot wheel mapping
const CAMELOT_WHEEL: { [key: string]: string } = {
  'C major': '8B', 'G major': '9B', 'D major': '10B', 'A major': '11B',
  'E major': '12B', 'B major': '1B', 'F# major': '2B', 'C# major': '3B',
  'G# major': '4B', 'D# major': '5B', 'A# major': '6B', 'F major': '7B',
  'A minor': '8A', 'E minor': '9A', 'B minor': '10A', 'F# minor': '11A',
  'C# minor': '12A', 'G# minor': '1A', 'D# minor': '2A', 'A# minor': '3A',
  'F minor': '4A', 'C minor': '5A', 'G minor': '6A', 'D minor': '7A'
};

const initialDeck: EnhancedDeck = {
  id: 0,
  track: null,
  isPlaying: false,
  currentTime: 0,
  playbackRate: 1.0,
  volume: 0.75,
  cuePoints: [],
  loopStart: null,
  loopEnd: null,
  currentBeatPhase: 0,
  nextBeatTime: 0,
  isInSync: false,
  syncAccuracy: 0,
  autoSyncEnabled: false,
  syncTarget: null,
  syncMode: 'bpm'
};

const useEnhancedDJStore = create<EnhancedDJState>()(
  devtools(
    (set, get) => ({
      // Initial state
      mixer: null,
      channelConfigs: [],
      crossfaderConfig: { position: 0.5, curve: 'linear' },
      masterConfig: {
        gain: 0.8,
        limiterEnabled: true,
        limiterThreshold: -1,
        compressorEnabled: true,
        compressorRatio: 4,
        compressorThreshold: -24,
        compressorAttack: 0.003,
        compressorRelease: 0.25
      },
      decks: [
        { ...initialDeck, id: 0 },
        { ...initialDeck, id: 1 },
        { ...initialDeck, id: 2 },
        { ...initialDeck, id: 3 }
      ],
      gestureControls: [],
      gestureEnabled: false,
      cameraActive: false,
      isDJModeActive: false,
      selectedDeck: 0,
      viewMode: 'mixer',
      musicAnalysis: {
        isAnalyzing: false,
        currentDeck: null,
        progress: 0,
        lastAnalysis: null,
        realTimeEnabled: false,
        spectralFeatures: null,
        beatSyncActive: false,
        suggestions: [],
        compatibilityMatrix: []
      },
      analyzerStatus: null,

      // Base Actions
      initializeMixer: async () => {
        const mixer = new AudioMixer();
        await mixer.initialize();

        const channelConfigs = [0, 1, 2, 3].map(i =>
          mixer.getChannelConfig(i)!
        );

        set({
          mixer,
          channelConfigs,
          crossfaderConfig: mixer.getCrossfaderConfig(),
          masterConfig: mixer.getMasterConfig(),
          analyzerStatus: musicAnalyzer.getStatus()
        });
      },

      setChannelGain: (channel, gain) => {
        const { mixer } = get();
        if (!mixer) return;

        mixer.setChannelGain(channel, gain);
        const configs = [...get().channelConfigs];
        configs[channel] = { ...configs[channel], gain };
        set({ channelConfigs: configs });
      },

      setChannelEQ: (channel, band, value) => {
        const { mixer } = get();
        if (!mixer) return;

        mixer.setChannelEQ(channel, band, value);
        const configs = [...get().channelConfigs];
        configs[channel] = {
          ...configs[channel],
          eq: { ...configs[channel].eq, [band]: value }
        };
        set({ channelConfigs: configs });
      },

      setCrossfaderPosition: (position) => {
        const { mixer } = get();
        if (!mixer) return;

        mixer.setCrossfaderPosition(position);
        set({
          crossfaderConfig: { ...get().crossfaderConfig, position }
        });
      },

      setMasterGain: (gain) => {
        const { mixer } = get();
        if (!mixer) return;

        mixer.setMasterGain(gain);
        set({
          masterConfig: { ...get().masterConfig, gain }
        });
      },

      // Enhanced Deck Actions
      loadTrack: (deckId, track) => {
        const decks = [...get().decks];
        decks[deckId] = {
          ...decks[deckId],
          track,
          currentBeatPhase: 0,
          nextBeatTime: 0,
          isInSync: false,
          syncAccuracy: 0
        };
        set({ decks });

        // Generate new mixing suggestions
        get().generateMixingSuggestions();
      },

      playDeck: (deckId) => {
        const decks = [...get().decks];
        decks[deckId] = { ...decks[deckId], isPlaying: true };
        set({ decks });

        // Start real-time analysis if enabled
        if (get().musicAnalysis.realTimeEnabled) {
          get().startRealTimeAnalysis(deckId);
        }
      },

      pauseDeck: (deckId) => {
        const decks = [...get().decks];
        decks[deckId] = { ...decks[deckId], isPlaying: false };
        set({ decks });

        get().stopRealTimeAnalysis(deckId);
      },

      setDeckVolume: (deckId, volume) => {
        const decks = [...get().decks];
        decks[deckId] = { ...decks[deckId], volume };
        set({ decks });

        // Also update mixer channel
        get().setChannelGain(deckId, volume);
      },

      setDeckPlaybackRate: (deckId, rate) => {
        const decks = [...get().decks];
        decks[deckId] = { ...decks[deckId], playbackRate: rate };
        set({ decks });

        // Update sync status
        get().updateBeatPhase(deckId, decks[deckId].currentTime);
      },

      // Analysis Actions
      analyzeTrack: async (audioData, trackInfo) => {
        set({
          musicAnalysis: {
            ...get().musicAnalysis,
            isAnalyzing: true,
            progress: 0
          }
        });

        try {
          const analysis = await musicAnalyzer.analyzeTrack(audioData);

          const keyString = `${analysis.key.key} ${analysis.key.scale}`;
          const camelotKey = CAMELOT_WHEEL[keyString] || '1A';

          // Find compatible keys
          const compatibleKeys: string[] = [];
          Object.entries(CAMELOT_WHEEL).forEach(([key, camelot]) => {
            if (MusicAnalyzerClient.isCompatibleKey(keyString, key)) {
              compatibleKeys.push(key);
            }
          });

          const analyzedTrack: AnalyzedTrack = {
            id: trackInfo.id || `track_${Date.now()}`,
            title: trackInfo.title || 'Unknown Track',
            artist: trackInfo.artist || 'Unknown Artist',
            duration: trackInfo.duration || analysis.duration,
            url: trackInfo.url,

            bpm: analysis.bpm.bpm,
            bpmConfidence: analysis.bpm.confidence,
            key: analysis.key.key,
            keyConfidence: analysis.key.confidence,
            scale: analysis.key.scale,
            energy: analysis.spectral.energy,

            beatGrid: analysis.bpm.beatGrid,
            downbeats: analysis.bpm.downbeats,
            phrases: analysis.phrases.phrases.map(p => ({
              start: p.start,
              end: p.end,
              type: p.type
            })),

            camelotKey,
            compatibleKeys,
            mixingBPMRange: analysis.mixing.bpmRange,

            analyzedAt: Date.now(),
            analysisVersion: '1.0.0'
          };

          set({
            musicAnalysis: {
              ...get().musicAnalysis,
              isAnalyzing: false,
              progress: 100,
              lastAnalysis: analysis
            }
          });

          return analyzedTrack;
        } catch (error) {
          console.error('Track analysis failed:', error);
          set({
            musicAnalysis: {
              ...get().musicAnalysis,
              isAnalyzing: false,
              progress: 0
            }
          });
          throw error;
        }
      },

      startRealTimeAnalysis: (deckId) => {
        set({
          musicAnalysis: {
            ...get().musicAnalysis,
            realTimeEnabled: true,
            currentDeck: deckId
          }
        });
      },

      stopRealTimeAnalysis: (deckId) => {
        const { musicAnalysis } = get();
        if (musicAnalysis.currentDeck === deckId) {
          set({
            musicAnalysis: {
              ...musicAnalysis,
              realTimeEnabled: false,
              currentDeck: null,
              spectralFeatures: null
            }
          });
        }
      },

      updateBeatPhase: (deckId, currentTime) => {
        const deck = get().decks[deckId];
        if (!deck.track) return;

        // Calculate beat phase based on track's beat grid
        const { beatGrid, bpm } = deck.track;
        const beatInterval = 60 / bpm;

        let phase = 0;
        let nextBeatTime = currentTime;

        if (beatGrid.length > 0) {
          // Find closest beat
          const closestBeat = beatGrid.reduce((closest, beat) => {
            return Math.abs(beat - currentTime) < Math.abs(closest - currentTime) ? beat : closest;
          });

          const timeToBeat = closestBeat - currentTime;
          phase = (timeToBeat % beatInterval) / beatInterval;

          // Find next beat
          const nextBeat = beatGrid.find(beat => beat > currentTime);
          nextBeatTime = nextBeat || currentTime + beatInterval;
        }

        const decks = [...get().decks];
        decks[deckId] = {
          ...decks[deckId],
          currentBeatPhase: phase,
          nextBeatTime,
          currentTime
        };

        set({ decks });
      },

      // Sync Actions
      enableAutoSync: (deckId, targetDeckId, mode) => {
        const decks = [...get().decks];
        decks[deckId] = {
          ...decks[deckId],
          autoSyncEnabled: true,
          syncTarget: targetDeckId,
          syncMode: mode
        };
        set({ decks });
      },

      disableAutoSync: (deckId) => {
        const decks = [...get().decks];
        decks[deckId] = {
          ...decks[deckId],
          autoSyncEnabled: false,
          syncTarget: null
        };
        set({ decks });
      },

      syncDecks: (sourceDeckId, targetDeckId) => {
        const { decks } = get();
        const sourceTrack = decks[sourceDeckId].track;
        const targetTrack = decks[targetDeckId].track;

        if (!sourceTrack || !targetTrack) return;

        // Calculate sync ratio
        const bpmRatio = targetTrack.bpm / sourceTrack.bpm;

        const updatedDecks = [...decks];
        updatedDecks[sourceDeckId] = {
          ...updatedDecks[sourceDeckId],
          playbackRate: bpmRatio,
          isInSync: true,
          syncAccuracy: 1.0
        };

        set({ decks: updatedDecks });
      },

      snapToBeat: (deckId) => {
        const deck = get().decks[deckId];
        if (!deck.track) return;

        // Snap to nearest beat
        const { beatGrid } = deck.track;
        const currentTime = deck.currentTime;

        const closestBeat = beatGrid.reduce((closest, beat) => {
          return Math.abs(beat - currentTime) < Math.abs(closest - currentTime) ? beat : closest;
        });

        const decks = [...get().decks];
        decks[deckId] = { ...decks[deckId], currentTime: closestBeat };
        set({ decks });
      },

      // Mixing Suggestions
      generateMixingSuggestions: () => {
        const { decks } = get();
        const suggestions: SyncSuggestion[] = [];
        const compatibilityMatrix: number[][] = [];

        for (let i = 0; i < decks.length; i++) {
          compatibilityMatrix[i] = [];
          for (let j = 0; j < decks.length; j++) {
            const compatibility = get().getMixingCompatibility(i, j);
            compatibilityMatrix[i][j] = compatibility;

            if (i !== j && compatibility > 0.7) {
              const sourceTrack = decks[i].track;
              const targetTrack = decks[j].track;

              if (sourceTrack && targetTrack) {
                // Key compatibility
                if (MusicAnalyzerClient.isCompatibleKey(
                  `${sourceTrack.key} ${sourceTrack.scale}`,
                  `${targetTrack.key} ${targetTrack.scale}`
                )) {
                  suggestions.push({
                    sourceDeck: i,
                    targetDeck: j,
                    type: 'key',
                    compatibility,
                    suggestion: `${sourceTrack.key} ${sourceTrack.scale} is compatible with ${targetTrack.key} ${targetTrack.scale}`,
                    autoSyncPossible: true
                  });
                }

                // BPM compatibility
                const bpmMatch = MusicAnalyzerClient.getBPMMatchPercentage(sourceTrack.bpm, targetTrack.bpm);
                if (bpmMatch > 0.8) {
                  suggestions.push({
                    sourceDeck: i,
                    targetDeck: j,
                    type: 'bpm',
                    compatibility: bpmMatch,
                    suggestion: `BPM match: ${sourceTrack.bpm} → ${targetTrack.bpm}`,
                    autoSyncPossible: true
                  });
                }
              }
            }
          }
        }

        set({
          musicAnalysis: {
            ...get().musicAnalysis,
            suggestions,
            compatibilityMatrix
          }
        });
      },

      getMixingCompatibility: (deck1, deck2) => {
        const { decks } = get();
        const track1 = decks[deck1].track;
        const track2 = decks[deck2].track;

        if (!track1 || !track2) return 0;

        // Calculate compatibility based on multiple factors
        const keyCompatible = MusicAnalyzerClient.isCompatibleKey(
          `${track1.key} ${track1.scale}`,
          `${track2.key} ${track2.scale}`
        ) ? 1 : 0;

        const bpmMatch = MusicAnalyzerClient.getBPMMatchPercentage(track1.bpm, track2.bpm);
        const energyMatch = 1 - Math.abs(track1.energy - track2.energy) / Math.max(track1.energy, track2.energy);

        // Weighted average
        return (keyCompatible * 0.4 + bpmMatch * 0.4 + energyMatch * 0.2);
      },

      // Gesture Control
      updateGestureControls: (controls) => {
        set({ gestureControls: controls });

        // Apply gesture controls to mixer
        const { mixer } = get();
        if (!mixer) return;

        controls.forEach(control => {
          switch (control.type) {
            case 'volume':
              if (control.hand === 'left') {
                mixer.setChannelGain(0, control.value);
                mixer.setChannelGain(1, control.value);
              } else {
                mixer.setChannelGain(2, control.value);
                mixer.setChannelGain(3, control.value);
              }
              break;
            case 'crossfader':
              mixer.setCrossfaderPosition(control.value);
              break;
            case 'eq':
              const channel = control.hand === 'left' ? 0 : 2;
              mixer.setChannelEQ(channel, 'mid', (control.value - 0.5) * 40);
              break;
          }
        });
      },

      setGestureEnabled: (enabled) => {
        set({ gestureEnabled: enabled });
      },

      setCameraActive: (active) => {
        set({ cameraActive: active });
      },

      setDJModeActive: (active) => {
        set({ isDJModeActive: active });
        if (active && !get().mixer) {
          get().initializeMixer();
        }
      },

      setSelectedDeck: (deckId) => {
        set({ selectedDeck: deckId });
      },

      setViewMode: (mode) => {
        set({ viewMode: mode });
      },

      reset: () => {
        const { mixer } = get();
        if (mixer) {
          mixer.reset();
        }

        // Cancel all analysis
        musicAnalyzer.cancelAll();

        set({
          channelConfigs: [],
          crossfaderConfig: { position: 0.5, curve: 'linear' },
          decks: [
            { ...initialDeck, id: 0 },
            { ...initialDeck, id: 1 },
            { ...initialDeck, id: 2 },
            { ...initialDeck, id: 3 }
          ],
          gestureControls: [],
          gestureEnabled: false,
          cameraActive: false,
          isDJModeActive: false,
          selectedDeck: 0,
          viewMode: 'mixer',
          musicAnalysis: {
            isAnalyzing: false,
            currentDeck: null,
            progress: 0,
            lastAnalysis: null,
            realTimeEnabled: false,
            spectralFeatures: null,
            beatSyncActive: false,
            suggestions: [],
            compatibilityMatrix: []
          }
        });
      }
    }),
    {
      name: 'enhanced-dj-store'
    }
  )
);

export default useEnhancedDJStore;