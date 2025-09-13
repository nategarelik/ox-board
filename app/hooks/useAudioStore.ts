import { useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import {
  useAudioStore,
  type DeckState,
  type MixerState,
  type PerformanceMetrics,
  selectDeck,
  selectDeckTrack,
  selectDeckPlayback,
  selectMixer,
  selectCrossfader,
  selectChannel,
  selectPerformance,
  selectSettings
} from '@/app/store/audioStore';

// =============================================================================
// GENERAL AUDIO STORE HOOKS
// =============================================================================

/**
 * Hook to get audio context initialization status
 */
export const useAudioInitialization = () => {
  return useAudioStore(
    useShallow((state) => ({
      initialized: state.initialized,
      audioContext: state.audioContext,
      initializeAudio: state.initializeAudio,
      cleanup: state.cleanup,
    }))
  );
};

/**
 * Hook to get and control audio settings
 */
export const useAudioSettings = () => {
  return useAudioStore(
    useShallow((state) => ({
      settings: state.settings,
      updateSettings: state.updateSettings,
    }))
  );
};

// =============================================================================
// DECK-SPECIFIC HOOKS
// =============================================================================

/**
 * Hook to get full deck state and actions for a specific deck
 */
export const useDeck = (deck: 'A' | 'B') => {
  const deckState = useAudioStore(selectDeck(deck));

  const actions = useAudioStore(
    useShallow((state) => ({
      // Track loading
      loadTrack: state.loadTrack,

      // Transport controls
      play: state.play,
      pause: state.pause,
      stop: state.stop,
      seek: state.seek,
      setCue: state.setCue,
      goToCue: state.goToCue,

      // Loop controls
      setLoop: state.setLoop,
      toggleLoop: state.toggleLoop,
      clearLoop: state.clearLoop,

      // Audio controls
      setVolume: state.setVolume,
      setGain: state.setGain,
      setPitch: state.setPitch,
      setTempo: state.setTempo,
      setKeyshift: state.setKeyshift,

      // EQ controls
      setEQ: state.setEQ,
      resetEQ: state.resetEQ,

      // Filter controls
      setFilter: state.setFilter,
      toggleFilter: state.toggleFilter,

      // Effect controls
      setEffect: state.setEffect,
      toggleEffect: state.toggleEffect,
    }))
  );

  // Wrap actions with deck parameter for convenience
  const deckActions = useCallback(() => ({
    // Track loading
    loadTrack: (url: string, name?: string) => actions.loadTrack(deck, url, name),

    // Transport controls
    play: () => actions.play(deck),
    pause: () => actions.pause(deck),
    stop: () => actions.stop(deck),
    seek: (position: number) => actions.seek(deck, position),
    setCue: (position?: number) => actions.setCue(deck, position),
    goToCue: () => actions.goToCue(deck),

    // Loop controls
    setLoop: (start: number, end: number) => actions.setLoop(deck, start, end),
    toggleLoop: () => actions.toggleLoop(deck),
    clearLoop: () => actions.clearLoop(deck),

    // Audio controls
    setVolume: (volume: number) => actions.setVolume(deck, volume),
    setGain: (gain: number) => actions.setGain(deck, gain),
    setPitch: (pitch: number) => actions.setPitch(deck, pitch),
    setTempo: (tempo: number) => actions.setTempo(deck, tempo),
    setKeyshift: (keyshift: number) => actions.setKeyshift(deck, keyshift),

    // EQ controls
    setEQ: (band: 'low' | 'mid' | 'high', value: number) => actions.setEQ(deck, band, value),
    resetEQ: () => actions.resetEQ(deck),

    // Filter controls
    setFilter: (filter: Parameters<typeof actions.setFilter>[1]) => actions.setFilter(deck, filter),
    toggleFilter: () => actions.toggleFilter(deck),

    // Effect controls
    setEffect: (effect: Parameters<typeof actions.setEffect>[1], settings: Parameters<typeof actions.setEffect>[2]) =>
      actions.setEffect(deck, effect, settings),
    toggleEffect: (effect: Parameters<typeof actions.toggleEffect>[1]) => actions.toggleEffect(deck, effect),
  }), [deck, actions]);

  return {
    deck: deckState,
    actions: deckActions(),
  };
};

/**
 * Hook to get only deck track information (optimized for track displays)
 */
export const useDeckTrack = (deck: 'A' | 'B') => {
  return useAudioStore(selectDeckTrack(deck));
};

/**
 * Hook to get only deck playback state (optimized for transport controls)
 */
export const useDeckPlayback = (deck: 'A' | 'B') => {
  const playbackState = useAudioStore(selectDeckPlayback(deck));

  const actions = useAudioStore(
    useShallow((state) => ({
      play: state.play,
      pause: state.pause,
      stop: state.stop,
      seek: state.seek,
    }))
  );

  const playbackActions = useCallback(() => ({
    play: () => actions.play(deck),
    pause: () => actions.pause(deck),
    stop: () => actions.stop(deck),
    seek: (position: number) => actions.seek(deck, position),
  }), [deck, actions]);

  return {
    ...playbackState,
    actions: playbackActions(),
  };
};

/**
 * Hook to get only deck EQ state and controls (optimized for EQ components)
 */
export const useDeckEQ = (deck: 'A' | 'B') => {
  const eq = useAudioStore((state) =>
    deck === 'A' ? state.deckA.eq : state.deckB.eq
  );

  const actions = useAudioStore(
    useShallow((state) => ({
      setEQ: state.setEQ,
      resetEQ: state.resetEQ,
    }))
  );

  const eqActions = useCallback(() => ({
    setLow: (value: number) => actions.setEQ(deck, 'low', value),
    setMid: (value: number) => actions.setEQ(deck, 'mid', value),
    setHigh: (value: number) => actions.setEQ(deck, 'high', value),
    setEQ: (band: 'low' | 'mid' | 'high', value: number) => actions.setEQ(deck, band, value),
    reset: () => actions.resetEQ(deck),
  }), [deck, actions]);

  return {
    eq,
    actions: eqActions(),
  };
};

/**
 * Hook to get only deck effects state and controls
 */
export const useDeckEffects = (deck: 'A' | 'B') => {
  const effects = useAudioStore((state) =>
    deck === 'A' ? state.deckA.effects : state.deckB.effects
  );

  const actions = useAudioStore(
    useShallow((state) => ({
      setEffect: state.setEffect,
      toggleEffect: state.toggleEffect,
    }))
  );

  const effectActions = useCallback(() => ({
    setReverb: (settings: Partial<typeof effects.reverb>) =>
      actions.setEffect(deck, 'reverb', settings),
    setDelay: (settings: Partial<typeof effects.delay>) =>
      actions.setEffect(deck, 'delay', settings),
    setChorus: (settings: Partial<typeof effects.chorus>) =>
      actions.setEffect(deck, 'chorus', settings),
    setDistortion: (settings: Partial<typeof effects.distortion>) =>
      actions.setEffect(deck, 'distortion', settings),

    toggleReverb: () => actions.toggleEffect(deck, 'reverb'),
    toggleDelay: () => actions.toggleEffect(deck, 'delay'),
    toggleChorus: () => actions.toggleEffect(deck, 'chorus'),
    toggleDistortion: () => actions.toggleEffect(deck, 'distortion'),
  }), [deck, actions, effects]);

  return {
    effects,
    actions: effectActions(),
  };
};

// =============================================================================
// MIXER HOOKS
// =============================================================================

/**
 * Hook to get full mixer state and actions
 */
export const useMixer = () => {
  const mixer = useAudioStore(selectMixer);

  const actions = useAudioStore(
    useShallow((state) => ({
      // Crossfader
      setCrossfader: state.setCrossfader,
      setCrossfaderCurve: state.setCrossfaderCurve,

      // Channel controls
      setChannelVolume: state.setChannelVolume,
      setChannelGain: state.setChannelGain,
      toggleChannelMute: state.toggleChannelMute,
      toggleChannelSolo: state.toggleChannelSolo,
      toggleChannelCue: state.toggleChannelCue,

      // Master controls
      setMasterVolume: state.setMasterVolume,
      setMasterGain: state.setMasterGain,
      setLimiter: state.setLimiter,

      // Cue controls
      setCueVolume: state.setCueVolume,
      setCueMix: state.setCueMix,
      toggleCueSplit: state.toggleCueSplit,
    }))
  );

  return {
    mixer,
    actions,
  };
};

/**
 * Hook to get only crossfader state and controls
 */
export const useCrossfader = () => {
  const crossfader = useAudioStore(selectCrossfader);

  const actions = useAudioStore(
    useShallow((state) => ({
      setCrossfader: state.setCrossfader,
      setCrossfaderCurve: state.setCrossfaderCurve,
    }))
  );

  return {
    ...crossfader,
    actions,
  };
};

/**
 * Hook to get specific mixer channel state and controls
 */
export const useMixerChannel = (channel: 'A' | 'B') => {
  const channelState = useAudioStore(selectChannel(channel));

  const actions = useAudioStore(
    useShallow((state) => ({
      setChannelVolume: state.setChannelVolume,
      setChannelGain: state.setChannelGain,
      toggleChannelMute: state.toggleChannelMute,
      toggleChannelSolo: state.toggleChannelSolo,
      toggleChannelCue: state.toggleChannelCue,
    }))
  );

  const channelActions = useCallback(() => ({
    setVolume: (volume: number) => actions.setChannelVolume(channel, volume),
    setGain: (gain: number) => actions.setChannelGain(channel, gain),
    toggleMute: () => actions.toggleChannelMute(channel),
    toggleSolo: () => actions.toggleChannelSolo(channel),
    toggleCue: () => actions.toggleChannelCue(channel),
  }), [channel, actions]);

  return {
    channel: channelState,
    actions: channelActions(),
  };
};

/**
 * Hook to get master output controls
 */
export const useMasterOutput = () => {
  const master = useAudioStore((state) => state.mixer.master);

  const actions = useAudioStore(
    useShallow((state) => ({
      setMasterVolume: state.setMasterVolume,
      setMasterGain: state.setMasterGain,
      setLimiter: state.setLimiter,
    }))
  );

  return {
    master,
    actions,
  };
};

/**
 * Hook to get headphone/cue controls
 */
export const useCueControls = () => {
  const cue = useAudioStore((state) => state.mixer.cue);

  const actions = useAudioStore(
    useShallow((state) => ({
      setCueVolume: state.setCueVolume,
      setCueMix: state.setCueMix,
      toggleCueSplit: state.toggleCueSplit,
    }))
  );

  return {
    cue,
    actions,
  };
};

// =============================================================================
// PERFORMANCE & MONITORING HOOKS
// =============================================================================

/**
 * Hook to get performance metrics and monitoring controls
 */
export const usePerformanceMetrics = () => {
  const performance = useAudioStore(selectPerformance);

  const actions = useAudioStore(
    useShallow((state) => ({
      updatePerformanceMetrics: state.updatePerformanceMetrics,
      resetPerformanceCounters: state.resetPerformanceCounters,
    }))
  );

  return {
    performance,
    actions,
  };
};

/**
 * Hook to monitor audio latency specifically
 */
export const useAudioLatency = () => {
  return useAudioStore((state) => state.performance.audioLatency);
};

/**
 * Hook to monitor memory usage
 */
export const useMemoryUsage = () => {
  return useAudioStore((state) => state.performance.memoryUsage);
};

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to get both decks for comparison/synchronization
 */
export const useBothDecks = () => {
  return useAudioStore(
    useShallow((state) => ({
      deckA: state.deckA,
      deckB: state.deckB,
    }))
  );
};

/**
 * Hook to check if any deck is currently playing
 */
export const useIsPlaying = () => {
  return useAudioStore((state) =>
    state.deckA.playing || state.deckB.playing
  );
};

/**
 * Hook to get synchronized BPM from both decks
 */
export const useSyncedBPM = () => {
  return useAudioStore(
    useShallow((state) => ({
      deckA_BPM: state.deckA.bpm,
      deckB_BPM: state.deckB.bpm,
      beatSync: state.settings.beatSync,
    }))
  );
};

/**
 * Hook to get real-time position updates for both decks
 */
export const usePlaybackPositions = () => {
  return useAudioStore(
    useShallow((state) => ({
      deckA: {
        position: state.deckA.position,
        duration: state.deckA.track.duration,
        playing: state.deckA.playing,
      },
      deckB: {
        position: state.deckB.position,
        duration: state.deckB.track.duration,
        playing: state.deckB.playing,
      },
    }))
  );
};

// =============================================================================
// COMPOSITE HOOKS FOR COMPLEX COMPONENTS
// =============================================================================

/**
 * Hook for DJ deck component that needs comprehensive deck control
 */
export const useDJDeck = (deck: 'A' | 'B') => {
  const deckData = useDeck(deck);
  const eqData = useDeckEQ(deck);
  const effectsData = useDeckEffects(deck);
  const channelData = useMixerChannel(deck);

  return {
    deck: deckData.deck,
    eq: eqData.eq,
    effects: effectsData.effects,
    channel: channelData.channel,
    actions: {
      ...deckData.actions,
      eq: eqData.actions,
      effects: effectsData.actions,
      channel: channelData.actions,
    },
  };
};

/**
 * Hook for mixer component that needs full mixer control
 */
export const useDJMixer = () => {
  const mixerData = useMixer();
  const masterData = useMasterOutput();
  const cueData = useCueControls();
  const performance = usePerformanceMetrics();

  return {
    mixer: mixerData.mixer,
    master: masterData.master,
    cue: cueData.cue,
    performance: performance.performance,
    actions: {
      ...mixerData.actions,
      master: masterData.actions,
      cue: cueData.actions,
      performance: performance.actions,
    },
  };
};