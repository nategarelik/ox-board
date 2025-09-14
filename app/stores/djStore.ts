import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { AudioMixer, ChannelConfig, CrossfaderConfig, MasterConfig } from '../lib/audio/mixer';
import { GestureControl } from '../hooks/useGestures';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: number;
  bpm: number;
  key: string;
  url?: string;
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
}

interface DJState {
  // Audio Mixer
  mixer: AudioMixer | null;
  channelConfigs: ChannelConfig[];
  crossfaderConfig: CrossfaderConfig;
  masterConfig: MasterConfig;

  // Decks
  decks: Deck[];

  // Gesture Control
  gestureControls: GestureControl[];
  gestureEnabled: boolean;
  cameraActive: boolean;

  // UI State
  isDJModeActive: boolean;
  selectedDeck: number;
  viewMode: 'mixer' | 'decks' | 'effects' | 'library';

  // Actions
  initializeMixer: () => Promise<void>;
  setChannelGain: (channel: number, gain: number) => void;
  setChannelEQ: (channel: number, band: 'low' | 'mid' | 'high', value: number) => void;
  setCrossfaderPosition: (position: number) => void;
  setMasterGain: (gain: number) => void;

  loadTrack: (deckId: number, track: Track) => void;
  playDeck: (deckId: number) => void;
  pauseDeck: (deckId: number) => void;
  setDeckVolume: (deckId: number, volume: number) => void;
  setDeckPlaybackRate: (deckId: number, rate: number) => void;

  updateGestureControls: (controls: GestureControl[]) => void;
  setGestureEnabled: (enabled: boolean) => void;
  setCameraActive: (active: boolean) => void;

  setDJModeActive: (active: boolean) => void;
  setSelectedDeck: (deckId: number) => void;
  setViewMode: (mode: DJState['viewMode']) => void;

  reset: () => void;
}

const initialDeck: Deck = {
  id: 0,
  track: null,
  isPlaying: false,
  currentTime: 0,
  playbackRate: 1.0,
  volume: 0.75,
  cuePoints: [],
  loopStart: null,
  loopEnd: null
};

const useDJStore = create<DJState>()(
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

      // Actions
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
          masterConfig: mixer.getMasterConfig()
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

      loadTrack: (deckId, track) => {
        const decks = [...get().decks];
        decks[deckId] = { ...decks[deckId], track };
        set({ decks });
      },

      playDeck: (deckId) => {
        const decks = [...get().decks];
        decks[deckId] = { ...decks[deckId], isPlaying: true };
        set({ decks });
      },

      pauseDeck: (deckId) => {
        const decks = [...get().decks];
        decks[deckId] = { ...decks[deckId], isPlaying: false };
        set({ decks });
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
      },

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
          viewMode: 'mixer'
        });
      }
    }),
    {
      name: 'dj-store'
    }
  )
);

export default useDJStore;