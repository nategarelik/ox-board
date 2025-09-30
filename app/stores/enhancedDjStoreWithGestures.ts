import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  EnhancedAudioMixer,
  ChannelConfig,
  CrossfaderConfig,
  MasterConfig,
  StemMixerConfig,
} from "../lib/audio/enhancedMixer";
import {
  StemPlayer,
  StemPlayerState,
  StemControls,
} from "../lib/audio/stemPlayer";
import {
  DemucsOutput,
  StemType,
  StemLoadResult,
} from "../lib/audio/demucsProcessor";
import { GestureControl } from "../hooks/useGestures";
import {
  GestureStemMapper,
  GestureDetectionResult,
  MappingProfile,
  FeedbackState,
  ControlMode,
  GestureStemMapperConfig,
} from "../lib/gestures/gestureStemMapper";
import { HandResult } from "../lib/gesture/recognition";

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  key: string;
  energy?: number;
  url?: string;
  hasStems?: boolean;
  stemData?: DemucsOutput;
}

interface Deck {
  id: number;
  track: Track | null;
  isPlaying: boolean;
  currentTime: number;
  playbackRate: number;
  volume: number;
  cuePoints: number[];
  loopStart: number | null;
  loopEnd: number | null;
  // Stem player state
  stemPlayerEnabled: boolean;
  stemPlayerState?: StemPlayerState;
  // Effects state
  effects?: any;
}

interface StemControlState {
  drums: StemControls;
  bass: StemControls;
  melody: StemControls;
  vocals: StemControls;
  original: StemControls;
  stemMix: number;
}

interface EnhancedDJState {
  // Audio Mixer
  mixer: EnhancedAudioMixer | null;
  channelConfigs: ChannelConfig[];
  crossfaderConfig: CrossfaderConfig;
  masterConfig: MasterConfig;
  stemMixerConfig: StemMixerConfig;

  // Decks
  decks: Deck[];

  // Stem Controls per channel
  stemControls: Record<number, StemControlState>;

  // Gesture Control (Legacy)
  gestureControls: GestureControl[];
  gestureEnabled: boolean;
  cameraActive: boolean;

  // Advanced Gesture Control
  gestureStemMapper: GestureStemMapper | null;
  gestureMapperEnabled: boolean;
  activeMappingProfile: string | null;
  gestureLatency: number;
  gestureFeedback: FeedbackState | null;
  gestureScreenDimensions: { width: number; height: number };

  // UI State
  isDJModeActive: boolean;
  selectedDeck: number;
  viewMode: "mixer" | "decks" | "effects" | "library" | "stems";
  stemViewMode: "individual" | "combined";
  crossfaderPosition: number;
  masterBPM: number;
  isRecording: boolean;

  // Stem Processing State
  stemProcessing: Record<
    number,
    {
      isProcessing: boolean;
      progress: number;
      error?: string;
    }
  >;

  // Actions - Mixer
  initializeMixer: () => Promise<void>;
  initializeAudioOnUserGesture: () => Promise<void>;
  setChannelGain: (channel: number, gain: number) => void;
  setChannelEQ: (
    channel: number,
    band: "low" | "mid" | "high",
    value: number,
  ) => void;
  setCrossfaderPosition: (position: number) => void;
  setMasterGain: (gain: number) => void;

  // Actions - Stem Player
  enableStemPlayer: (channel: number) => Promise<void>;
  disableStemPlayer: (channel: number) => void;
  loadStemsToChannel: (
    channel: number,
    demucsOutput: DemucsOutput,
  ) => Promise<StemLoadResult[]>;

  // Actions - Stem Controls
  setStemVolume: (
    channel: number,
    stemType: StemType | "original",
    volume: number,
  ) => void;
  setStemMute: (
    channel: number,
    stemType: StemType | "original",
    muted: boolean,
  ) => void;
  setStemSolo: (
    channel: number,
    stemType: StemType | "original",
    soloed: boolean,
  ) => void;
  setStemPan: (
    channel: number,
    stemType: StemType | "original",
    pan: number,
  ) => void;
  setStemEQ: (
    channel: number,
    stemType: StemType | "original",
    band: "low" | "mid" | "high",
    value: number,
  ) => void;
  setStemPlaybackRate: (
    channel: number,
    stemType: StemType | "original",
    rate: number,
  ) => void;
  setStemMix: (channel: number, mix: number) => void;

  // Actions - Stem Player Playback
  playStemPlayer: (channel: number) => Promise<void>;
  pauseStemPlayer: (channel: number) => void;
  stopStemPlayer: (channel: number) => void;
  seekStemPlayer: (channel: number, time: number) => void;
  processStemSeparation: (deckId: number) => Promise<void>;

  // Actions - Track Management
  loadTrack: (deckId: number, track: Track) => void;
  playDeck: (deckId: number) => void;
  pauseDeck: (deckId: number) => void;
  setDeckVolume: (deckId: number, volume: number) => void;
  setDeckPlaybackRate: (deckId: number, rate: number) => void;
  setCuePoint: (deckId: number) => void;

  // Actions - Gesture Control (Legacy)
  updateGestureControls: (controls: GestureControl[]) => void;
  setGestureEnabled: (enabled: boolean) => void;
  setCameraActive: (active: boolean) => void;

  // Actions - Advanced Gesture Control
  initializeGestureMapper: (config?: Partial<GestureStemMapperConfig>) => void;
  processHandGestures: (
    leftHand: HandResult | null,
    rightHand: HandResult | null,
    channel?: number,
  ) => Promise<void>;
  setGestureMapperEnabled: (enabled: boolean) => void;
  setActiveMappingProfile: (profileId: string) => boolean;
  addMappingProfile: (profile: MappingProfile) => void;
  setGestureControlMode: (mappingId: string, mode: ControlMode) => void;
  setGestureScreenDimensions: (width: number, height: number) => void;
  getGestureFeedbackState: () => FeedbackState | null;

  // Actions - UI State
  setDJModeActive: (active: boolean) => void;
  setSelectedDeck: (deckId: number) => void;
  setViewMode: (mode: EnhancedDJState["viewMode"]) => void;
  setStemViewMode: (mode: "individual" | "combined") => void;

  // Actions - Utility
  reset: () => void;
  updateStemPlayerState: (channel: number) => void;
}

const defaultStemControls: StemControls = {
  volume: 0.75,
  muted: false,
  soloed: false,
  pan: 0,
  eq: { low: 0, mid: 0, high: 0 },
  playbackRate: 1.0,
};

const createDefaultStemControlState = (): StemControlState => ({
  drums: { ...defaultStemControls },
  bass: { ...defaultStemControls },
  melody: { ...defaultStemControls },
  vocals: { ...defaultStemControls },
  original: { ...defaultStemControls },
  stemMix: 0.5,
});

const initialDeck: Deck = {
  id: 0,
  track: null,
  isPlaying: false,
  currentTime: 0,
  playbackRate: 1.0,
  volume: 0.75,
  cuePoints: [],
  loopStart: null,
  loopEnd: null,
  stemPlayerEnabled: false,
};

const useEnhancedDJStore = create<EnhancedDJState>()(
  devtools(
    (set, get) => ({
      // Initial state
      mixer: null,
      channelConfigs: [],
      crossfaderConfig: { position: 0.5, curve: "linear" },
      masterConfig: {
        gain: 0.8,
        limiterEnabled: true,
        limiterThreshold: -1,
        compressorEnabled: true,
        compressorRatio: 4,
        compressorThreshold: -24,
        compressorAttack: 0.003,
        compressorRelease: 0.25,
      },
      stemMixerConfig: {
        autoStemDetection: true,
        stemMixMode: "separate",
      },
      decks: [
        { ...initialDeck, id: 0 },
        { ...initialDeck, id: 1 },
        { ...initialDeck, id: 2 },
        { ...initialDeck, id: 3 },
      ],
      stemControls: {
        0: createDefaultStemControlState(),
        1: createDefaultStemControlState(),
        2: createDefaultStemControlState(),
        3: createDefaultStemControlState(),
      },
      gestureControls: [],
      gestureEnabled: false,
      cameraActive: false,

      // Advanced Gesture Control
      gestureStemMapper: null,
      gestureMapperEnabled: false,
      activeMappingProfile: null,
      gestureLatency: 0,
      gestureFeedback: null,
      gestureScreenDimensions: { width: 1920, height: 1080 },

      isDJModeActive: false,
      selectedDeck: 0,
      viewMode: "mixer",
      stemViewMode: "individual",
      crossfaderPosition: 0,
      masterBPM: 128,
      isRecording: false,
      stemProcessing: {
        0: { isProcessing: false, progress: 0 },
        1: { isProcessing: false, progress: 0 },
        2: { isProcessing: false, progress: 0 },
        3: { isProcessing: false, progress: 0 },
      },

      // Mixer Actions
      initializeMixer: async () => {
        try {
          const { stemMixerConfig } = get();
          const mixer = new EnhancedAudioMixer(stemMixerConfig);

          // Don't initialize immediately - wait for user gesture
          // The mixer will be initialized when first audio operation is performed

          const channelConfigs = [0, 1, 2, 3].map(
            (i) => mixer.getChannelConfig(i)!,
          );

          set({
            mixer,
            channelConfigs,
            crossfaderConfig: mixer.getCrossfaderConfig(),
            masterConfig: mixer.getMasterConfig(),
          });
        } catch (error) {
          console.error("Failed to create mixer:", error);
          throw error;
        }
      },

      initializeAudioOnUserGesture: async () => {
        const { mixer } = get();
        if (!mixer) {
          // Initialize mixer first if not already done
          await get().initializeMixer();
          // Get the newly created mixer
          const newMixer = get().mixer;
          if (newMixer) {
            await newMixer.initializeOnUserGesture();
          }
        } else {
          await mixer.initializeOnUserGesture();
        }
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
          eq: { ...configs[channel].eq, [band]: value },
        };
        set({ channelConfigs: configs });
      },

      setCrossfaderPosition: (position) => {
        const { mixer } = get();
        if (!mixer) return;

        mixer.setCrossfaderPosition(position);
        set({
          crossfaderConfig: { ...get().crossfaderConfig, position },
          crossfaderPosition: position,
        });
      },

      setMasterGain: (gain) => {
        const { mixer } = get();
        if (!mixer) return;

        mixer.setMasterGain(gain);
        set({
          masterConfig: { ...get().masterConfig, gain },
        });
      },

      // Stem Player Actions
      enableStemPlayer: async (channel) => {
        const { mixer } = get();
        if (!mixer) return;

        try {
          await mixer.enableStemPlayer(channel);

          const decks = [...get().decks];
          decks[channel] = { ...decks[channel], stemPlayerEnabled: true };

          const configs = [...get().channelConfigs];
          configs[channel] = { ...configs[channel], stemPlayerEnabled: true };

          set({ decks, channelConfigs: configs });

          // Update stem player state
          get().updateStemPlayerState(channel);
        } catch (error) {
          console.error(
            `Failed to enable stem player for channel ${channel}:`,
            error,
          );
          throw error;
        }
      },

      disableStemPlayer: (channel) => {
        const { mixer } = get();
        if (!mixer) return;

        mixer.disableStemPlayer(channel);

        const decks = [...get().decks];
        decks[channel] = {
          ...decks[channel],
          stemPlayerEnabled: false,
          stemPlayerState: undefined,
        };

        const configs = [...get().channelConfigs];
        configs[channel] = { ...configs[channel], stemPlayerEnabled: false };

        set({ decks, channelConfigs: configs });
      },

      loadStemsToChannel: async (channel, demucsOutput) => {
        const { mixer } = get();
        if (!mixer) throw new Error("Mixer not initialized");

        try {
          // Set processing state
          const processing = { ...get().stemProcessing };
          processing[channel] = { isProcessing: true, progress: 0 };
          set({ stemProcessing: processing });

          const results = await mixer.loadStemsToChannel(channel, demucsOutput);

          // Update deck with stem data
          const decks = [...get().decks];
          if (decks[channel].track) {
            decks[channel].track = {
              ...decks[channel].track!,
              hasStems: true,
              stemData: demucsOutput,
            };
          }

          // Clear processing state
          processing[channel] = { isProcessing: false, progress: 100 };
          set({ decks, stemProcessing: processing });

          // Update stem player state
          get().updateStemPlayerState(channel);

          return results;
        } catch (error) {
          // Set error state
          const processing = { ...get().stemProcessing };
          processing[channel] = {
            isProcessing: false,
            progress: 0,
            error: error instanceof Error ? error.message : "Unknown error",
          };
          set({ stemProcessing: processing });
          throw error;
        }
      },

      // Stem Control Actions
      setStemVolume: (channel, stemType, volume) => {
        try {
          const { mixer } = get();
          if (!mixer) return;

          const clampedVolume = Math.max(0, Math.min(1, volume));

          // Check if volume actually changed to prevent unnecessary updates
          const stemControls = get().stemControls;
          const currentVolume =
            stemType === "original"
              ? stemControls[channel]?.original?.volume || 0.75
              : stemControls[channel]?.[stemType]?.volume || 0.75;

          if (Math.abs(currentVolume - clampedVolume) < 0.01) {
            return; // No significant change
          }

          mixer.setStemVolume(channel, stemType, clampedVolume);

          const updatedStemControls = { ...stemControls };
          if (stemType === "original") {
            updatedStemControls[channel] = {
              ...updatedStemControls[channel],
              original: {
                ...updatedStemControls[channel].original,
                volume: clampedVolume,
              },
            };
          } else {
            updatedStemControls[channel] = {
              ...updatedStemControls[channel],
              [stemType]: {
                ...updatedStemControls[channel][stemType],
                volume: clampedVolume,
              },
            };
          }
          set({ stemControls: updatedStemControls });
        } catch (error) {
          console.error("Error in setStemVolume:", error);
        }
      },

      setStemMute: (channel, stemType, muted) => {
        const { mixer } = get();
        if (!mixer) return;

        mixer.setStemMute(channel, stemType, muted);

        const stemControls = { ...get().stemControls };
        if (stemType === "original") {
          stemControls[channel].original.muted = muted;
        } else {
          stemControls[channel][stemType].muted = muted;
        }
        set({ stemControls });
      },

      setStemSolo: (channel, stemType, soloed) => {
        const { mixer } = get();
        if (!mixer) return;

        mixer.setStemSolo(channel, stemType, soloed);

        const stemControls = { ...get().stemControls };
        if (stemType === "original") {
          stemControls[channel].original.soloed = soloed;
        } else {
          stemControls[channel][stemType].soloed = soloed;
        }
        set({ stemControls });
      },

      setStemPan: (channel, stemType, pan) => {
        const { mixer } = get();
        if (!mixer) return;

        mixer.setStemPan(channel, stemType, pan);

        const stemControls = { ...get().stemControls };
        if (stemType === "original") {
          stemControls[channel].original.pan = pan;
        } else {
          stemControls[channel][stemType].pan = pan;
        }
        set({ stemControls });
      },

      setStemEQ: (channel, stemType, band, value) => {
        const { mixer } = get();
        if (!mixer) return;

        mixer.setStemEQ(channel, stemType, band, value);

        const stemControls = { ...get().stemControls };
        if (stemType === "original") {
          stemControls[channel].original.eq[band] = value;
        } else {
          stemControls[channel][stemType].eq[band] = value;
        }
        set({ stemControls });
      },

      setStemPlaybackRate: (channel, stemType, rate) => {
        const { mixer } = get();
        if (!mixer) return;

        mixer.setStemPlaybackRate(channel, stemType, rate);

        const stemControls = { ...get().stemControls };
        if (stemType === "original") {
          stemControls[channel].original.playbackRate = rate;
        } else {
          stemControls[channel][stemType].playbackRate = rate;
        }
        set({ stemControls });
      },

      setStemMix: (channel, mix) => {
        const { mixer } = get();
        if (!mixer) return;

        mixer.setStemMix(channel, mix);

        const stemControls = { ...get().stemControls };
        stemControls[channel].stemMix = mix;
        set({ stemControls });
      },

      // Stem Player Playback Actions
      playStemPlayer: async (channel) => {
        const { mixer } = get();
        if (!mixer) throw new Error("Mixer not initialized");

        await mixer.playStemPlayer(channel);

        const decks = [...get().decks];
        decks[channel] = { ...decks[channel], isPlaying: true };
        set({ decks });

        // Update stem player state
        get().updateStemPlayerState(channel);
      },

      pauseStemPlayer: (channel) => {
        const { mixer } = get();
        if (!mixer) return;

        mixer.pauseStemPlayer(channel);

        const decks = [...get().decks];
        decks[channel] = { ...decks[channel], isPlaying: false };
        set({ decks });

        // Update stem player state
        get().updateStemPlayerState(channel);
      },

      stopStemPlayer: (channel) => {
        const { mixer } = get();
        if (!mixer) return;

        mixer.stopStemPlayer(channel);

        const decks = [...get().decks];
        decks[channel] = {
          ...decks[channel],
          isPlaying: false,
          currentTime: 0,
        };
        set({ decks });

        // Update stem player state
        get().updateStemPlayerState(channel);
      },

      seekStemPlayer: (channel, time) => {
        const { mixer } = get();
        if (!mixer) return;

        mixer.seekStemPlayer(channel, time);

        const decks = [...get().decks];
        decks[channel] = { ...decks[channel], currentTime: time };
        set({ decks });
      },

      processStemSeparation: async (deckId) => {
        const deck = get().decks[deckId];
        if (!deck?.track) return;

        console.log(`Processing stems for deck ${deckId}...`);
        // In a real implementation, this would call Demucs
        // For now, we'll simulate processing
        const decks = [...get().decks];
        decks[deckId] = {
          ...decks[deckId],
          stemPlayerEnabled: true,
        };
        set({ decks });
      },

      // Original Track Actions (preserved for compatibility)
      loadTrack: async (deckId, track) => {
        const decks = [...get().decks];

        // If track has a URL, load it (simplified for now)
        if (track.url) {
          console.log(`Loading track ${track.title} into deck ${deckId}`);
        }

        decks[deckId] = {
          ...decks[deckId],
          track,
          stemPlayerEnabled: track.hasStems || false,
        };
        set({ decks });
      },

      playDeck: (deckId) => {
        const deck = get().decks[deckId];
        if (deck.stemPlayerEnabled) {
          get().playStemPlayer(deckId);
        } else {
          const decks = [...get().decks];
          decks[deckId] = { ...decks[deckId], isPlaying: true };
          set({ decks });
        }
      },

      pauseDeck: (deckId) => {
        const deck = get().decks[deckId];
        if (deck.stemPlayerEnabled) {
          get().pauseStemPlayer(deckId);
        } else {
          const decks = [...get().decks];
          decks[deckId] = { ...decks[deckId], isPlaying: false };
          set({ decks });
        }
      },

      setCuePoint: (deckId) => {
        const decks = [...get().decks];
        // Set the current position as cue point (simplified implementation)
        decks[deckId] = { ...decks[deckId], cuePoints: [0] };
        set({ decks });
        console.log(`Cue point set for deck ${deckId}`);
      },

      setDeckVolume: (deckId, volume) => {
        try {
          // Validate inputs
          if (deckId < 0 || deckId >= get().decks.length) {
            console.warn(`Invalid deck ID: ${deckId}`);
            return;
          }

          const clampedVolume = Math.max(0, Math.min(1, volume));

          // Check if volume actually changed to prevent unnecessary updates
          const currentDeck = get().decks[deckId];
          if (
            currentDeck &&
            Math.abs(currentDeck.volume - clampedVolume) < 0.01
          ) {
            return; // No significant change
          }

          const decks = [...get().decks];
          decks[deckId] = { ...decks[deckId], volume: clampedVolume };
          set({ decks });

          // Also update mixer channel if mixer is available
          const { mixer } = get();
          if (mixer) {
            try {
              mixer.setChannelGain(deckId, clampedVolume);
            } catch (error) {
              console.error("Error updating mixer channel gain:", error);
            }
          }
        } catch (error) {
          console.error("Error in setDeckVolume:", error);
        }
      },

      setDeckPlaybackRate: (deckId, rate) => {
        const decks = [...get().decks];
        decks[deckId] = { ...decks[deckId], playbackRate: rate };
        set({ decks });

        // If stem player is enabled, update all stems
        const deck = get().decks[deckId];
        if (deck.stemPlayerEnabled) {
          const stemTypes: (StemType | "original")[] = [
            "drums",
            "bass",
            "melody",
            "vocals",
            "original",
          ];
          stemTypes.forEach((stemType) => {
            get().setStemPlaybackRate(deckId, stemType, rate);
          });
        }
      },

      // Legacy Gesture Control Actions
      updateGestureControls: (controls) => {
        set({ gestureControls: controls });

        // Apply gesture controls to mixer
        const { mixer } = get();
        if (!mixer) return;

        controls.forEach((control) => {
          switch (control.type) {
            case "volume":
              if (control.hand === "left") {
                mixer.setChannelGain(0, control.value);
                mixer.setChannelGain(1, control.value);
              } else {
                mixer.setChannelGain(2, control.value);
                mixer.setChannelGain(3, control.value);
              }
              break;
            case "crossfader":
              mixer.setCrossfaderPosition(control.value);
              break;
            case "eq":
              const channel = control.hand === "left" ? 0 : 2;
              mixer.setChannelEQ(channel, "mid", (control.value - 0.5) * 40);
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

      // Advanced Gesture Control Actions
      initializeGestureMapper: (config = {}) => {
        const mapper = new GestureStemMapper({
          latencyTarget: 50,
          gestureConfidenceThreshold: 0.75,
          smoothingEnabled: true,
          feedbackEnabled: true,
          ...config,
        });

        // Set up event listeners
        mapper.on("gestureControl", (event: any) => {
          const { channel = 0, mapping, value, gesture } = event;

          // Apply the gesture control to the appropriate stem
          const {
            setStemVolume,
            setStemMute,
            setStemSolo,
            setStemPan,
            setStemEQ,
            setStemPlaybackRate,
            setStemMix,
            setCrossfaderPosition,
          } = get();

          try {
            switch (mapping.controlType) {
              case "volume":
                if (mapping.targetStem === "crossfader") {
                  // Handle master volume or special cases
                  get().setMasterGain(value);
                } else if (mapping.targetStem === "master") {
                  get().setMasterGain(value);
                } else {
                  setStemVolume(
                    channel,
                    mapping.targetStem as StemType | "original",
                    value,
                  );
                }
                break;

              case "mute":
                if (
                  mapping.targetStem !== "crossfader" &&
                  mapping.targetStem !== "master"
                ) {
                  setStemMute(
                    channel,
                    mapping.targetStem as StemType | "original",
                    value > 0.5,
                  );
                }
                break;

              case "solo":
                if (
                  mapping.targetStem !== "crossfader" &&
                  mapping.targetStem !== "master"
                ) {
                  setStemSolo(
                    channel,
                    mapping.targetStem as StemType | "original",
                    value > 0.5,
                  );
                }
                break;

              case "pan":
                if (
                  mapping.targetStem !== "crossfader" &&
                  mapping.targetStem !== "master"
                ) {
                  // Convert 0-1 to -1 to 1
                  const panValue = value * 2 - 1;
                  setStemPan(
                    channel,
                    mapping.targetStem as StemType | "original",
                    panValue,
                  );
                }
                break;

              case "eq":
                if (
                  mapping.targetStem !== "crossfader" &&
                  mapping.targetStem !== "master" &&
                  mapping.params?.eqBand
                ) {
                  // Convert 0-1 to -20 to 20 dB
                  const eqValue = value * 40 - 20;
                  setStemEQ(
                    channel,
                    mapping.targetStem as StemType | "original",
                    mapping.params.eqBand,
                    eqValue,
                  );
                }
                break;

              case "playback_rate":
                if (
                  mapping.targetStem !== "crossfader" &&
                  mapping.targetStem !== "master"
                ) {
                  // Convert 0-1 to 0.5-2.0 playback rate
                  const rateValue = 0.5 + value * 1.5;
                  setStemPlaybackRate(
                    channel,
                    mapping.targetStem as StemType | "original",
                    rateValue,
                  );
                }
                break;

              case "crossfade":
                setCrossfaderPosition(value);
                break;

              case "effect":
                if (mapping.params?.action === "reset") {
                  // Reset all stem controls to default
                  const stemTypes: (StemType | "original")[] = [
                    "drums",
                    "bass",
                    "melody",
                    "vocals",
                    "original",
                  ];
                  stemTypes.forEach((stemType) => {
                    setStemVolume(channel, stemType, 0.75);
                    setStemMute(channel, stemType, false);
                    setStemSolo(channel, stemType, false);
                    setStemPan(channel, stemType, 0);
                  });
                  setStemMix(channel, 0.5);
                }
                break;
            }
          } catch (error) {
            console.error("Error applying gesture control:", error);
          }
        });

        mapper.on("feedbackUpdate", (feedback: FeedbackState) => {
          set({
            gestureFeedback: feedback,
            gestureLatency: feedback.latency,
          });
        });

        set({
          gestureStemMapper: mapper,
          activeMappingProfile: "default",
          gestureMapperEnabled: true,
        });
      },

      processHandGestures: async (leftHand, rightHand, channel = 0) => {
        const {
          gestureStemMapper,
          gestureMapperEnabled,
          gestureScreenDimensions,
        } = get();

        if (!gestureStemMapper || !gestureMapperEnabled) {
          return;
        }

        try {
          const startTime = performance.now();

          // Detect gestures
          const gestures = gestureStemMapper.detectGestures(
            leftHand,
            rightHand,
            gestureScreenDimensions.width,
            gestureScreenDimensions.height,
          );

          // Process gestures and apply to stem controls
          if (gestures.length > 0) {
            gestureStemMapper.processGestures(gestures, channel);
          }

          // Update latency tracking
          const processingTime = performance.now() - startTime;
          set({ gestureLatency: processingTime });
        } catch (error) {
          console.error("Error processing hand gestures:", error);
        }
      },

      setGestureMapperEnabled: (enabled) => {
        set({ gestureMapperEnabled: enabled });

        if (!enabled) {
          // Clear any active gesture states
          set({ gestureFeedback: null, gestureLatency: 0 });
        }
      },

      setActiveMappingProfile: (profileId) => {
        const { gestureStemMapper } = get();
        if (!gestureStemMapper) return false;

        const success = gestureStemMapper.setActiveProfile(profileId);
        if (success) {
          set({ activeMappingProfile: profileId });
        }
        return success;
      },

      addMappingProfile: (profile) => {
        const { gestureStemMapper } = get();
        if (!gestureStemMapper) return;

        gestureStemMapper.addProfile(profile);
      },

      setGestureControlMode: (mappingId, mode) => {
        const { gestureStemMapper } = get();
        if (!gestureStemMapper) return;

        gestureStemMapper.setControlMode(mappingId, mode);
      },

      setGestureScreenDimensions: (width, height) => {
        set({ gestureScreenDimensions: { width, height } });
      },

      getGestureFeedbackState: () => {
        const { gestureStemMapper } = get();
        return gestureStemMapper ? gestureStemMapper.getFeedbackState() : null;
      },

      // UI State Actions
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

      setStemViewMode: (mode) => {
        set({ stemViewMode: mode });
      },

      // Utility Actions
      updateStemPlayerState: (channel) => {
        const { mixer } = get();
        if (!mixer) return;

        const stemPlayerState = mixer.getStemPlayerState(channel);
        if (stemPlayerState) {
          const decks = [...get().decks];
          decks[channel] = {
            ...decks[channel],
            stemPlayerState,
            currentTime: stemPlayerState.currentTime,
            isPlaying: stemPlayerState.isPlaying,
          };
          set({ decks });
        }
      },

      reset: () => {
        const { mixer, gestureStemMapper } = get();
        if (mixer) {
          mixer.reset();
        }
        if (gestureStemMapper) {
          gestureStemMapper.dispose();
        }

        set({
          channelConfigs: [],
          crossfaderConfig: { position: 0.5, curve: "linear" },
          decks: [
            { ...initialDeck, id: 0 },
            { ...initialDeck, id: 1 },
            { ...initialDeck, id: 2 },
            { ...initialDeck, id: 3 },
          ],
          stemControls: {
            0: createDefaultStemControlState(),
            1: createDefaultStemControlState(),
            2: createDefaultStemControlState(),
            3: createDefaultStemControlState(),
          },
          gestureControls: [],
          gestureEnabled: false,
          cameraActive: false,
          gestureStemMapper: null,
          gestureMapperEnabled: false,
          activeMappingProfile: null,
          gestureLatency: 0,
          gestureFeedback: null,
          gestureScreenDimensions: { width: 1920, height: 1080 },
          isDJModeActive: false,
          selectedDeck: 0,
          viewMode: "mixer",
          stemViewMode: "individual",
          crossfaderPosition: 0,
          masterBPM: 128,
          isRecording: false,
          stemProcessing: {
            0: { isProcessing: false, progress: 0 },
            1: { isProcessing: false, progress: 0 },
            2: { isProcessing: false, progress: 0 },
            3: { isProcessing: false, progress: 0 },
          },
        });
      },
    }),
    {
      name: "enhanced-dj-store",
    },
  ),
);

export default useEnhancedDJStore;
export type { EnhancedDJState, Track, Deck, StemControlState };

// Export alias for backward compatibility
export const useDJStore = useEnhancedDJStore;
