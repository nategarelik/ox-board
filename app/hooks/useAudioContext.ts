import { useEffect, useCallback, useRef, useState } from 'react';
import { AudioEngine, getAudioEngine, AudioSource } from '@/lib/audio/engine';

/**
 * Audio engine state interface
 */
interface AudioEngineState {
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;
  performanceMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    latency: number;
    dropouts: number;
  };
}

/**
 * Audio context hook return type
 */
interface UseAudioContextReturn extends AudioEngineState {
  engine: AudioEngine | null;
  initialize: () => Promise<void>;
  createDeckSource: (deckId: string) => AudioSource | null;
  loadAudioFile: (url: string) => Promise<any>;
  reset: () => void;
}

/**
 * Custom hook for managing audio engine and context
 *
 * Provides React integration for the AudioEngine singleton with proper
 * lifecycle management, error handling, and performance monitoring.
 */
export function useAudioContext(): UseAudioContextReturn {
  const engineRef = useRef<AudioEngine | null>(null);
  const [state, setState] = useState<AudioEngineState>({
    isInitialized: false,
    isLoading: false,
    error: null,
    performanceMetrics: {
      cpuUsage: 0,
      memoryUsage: 0,
      latency: 0,
      dropouts: 0,
    },
  });

  // Performance monitoring interval
  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Initialize audio engine
   */
  const initialize = useCallback(async () => {
    if (state.isInitialized || state.isLoading) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Get audio engine instance
      engineRef.current = getAudioEngine();

      // Initialize with user gesture (required for Web Audio API)
      await engineRef.current.initialize();

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        error: null,
      }));

      // Start performance monitoring
      startPerformanceMonitoring();

      console.log('Audio context initialized successfully');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown audio initialization error';

      setState(prev => ({
        ...prev,
        isInitialized: false,
        isLoading: false,
        error: errorMessage,
      }));

      console.error('Failed to initialize audio context:', error);
    }
  }, [state.isInitialized, state.isLoading]);

  /**
   * Create audio source for deck
   */
  const createDeckSource = useCallback((deckId: string): AudioSource | null => {
    if (!engineRef.current || !state.isInitialized) {
      console.warn('Audio engine not initialized, cannot create deck source');
      return null;
    }

    try {
      return engineRef.current.createDeckSource(deckId);
    } catch (error) {
      console.error(`Failed to create deck source for ${deckId}:`, error);
      return null;
    }
  }, [state.isInitialized]);

  /**
   * Load audio file
   */
  const loadAudioFile = useCallback(async (url: string) => {
    if (!engineRef.current || !state.isInitialized) {
      throw new Error('Audio engine not initialized');
    }

    try {
      return await engineRef.current.loadAudioFile(url);
    } catch (error) {
      console.error('Failed to load audio file:', error);
      throw error;
    }
  }, [state.isInitialized]);

  /**
   * Reset audio context and engine
   */
  const reset = useCallback(() => {
    // Stop performance monitoring
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }

    // Dispose audio engine
    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }

    // Reset state
    setState({
      isInitialized: false,
      isLoading: false,
      error: null,
      performanceMetrics: {
        cpuUsage: 0,
        memoryUsage: 0,
        latency: 0,
        dropouts: 0,
      },
    });
  }, []);

  /**
   * Start performance monitoring
   */
  const startPerformanceMonitoring = useCallback(() => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
    }

    metricsIntervalRef.current = setInterval(() => {
      if (engineRef.current) {
        const metrics = engineRef.current.getPerformanceMetrics();
        setState(prev => ({
          ...prev,
          performanceMetrics: metrics,
        }));
      }
    }, 1000); // Update every second
  }, []);

  /**
   * Initialize on mount (requires user interaction)
   */
  useEffect(() => {
    // Note: Audio context initialization must be triggered by user gesture
    // This will be called from a user interaction event
    return () => {
      // Cleanup on unmount
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, []);

  /**
   * Handle visibility change to manage audio context
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (engineRef.current) {
        if (document.hidden) {
          // Suspend audio context when tab is hidden to save resources
          if (engineRef.current.context.state === 'running') {
            engineRef.current.context.suspend();
          }
        } else {
          // Resume audio context when tab becomes visible
          if (engineRef.current.context.state === 'suspended') {
            engineRef.current.context.resume();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  /**
   * Handle audio context state changes
   */
  useEffect(() => {
    if (!engineRef.current) return;

    const handleStateChange = () => {
      if (engineRef.current?.context.state === 'interrupted') {
        setState(prev => ({
          ...prev,
          error: 'Audio context was interrupted'
        }));
      }
    };

    // Listen for audio context state changes
    engineRef.current.context.addEventListener('statechange', handleStateChange);

    return () => {
      engineRef.current?.context.removeEventListener('statechange', handleStateChange);
    };
  }, [state.isInitialized]);

  return {
    ...state,
    engine: engineRef.current,
    initialize,
    createDeckSource,
    loadAudioFile,
    reset,
  };
}

/**
 * Hook for managing individual deck audio sources
 */
export function useDeckAudio(deckId: string) {
  const { engine, isInitialized } = useAudioContext();
  const sourceRef = useRef<AudioSource | null>(null);

  const [deckState, setDeckState] = useState({
    isLoaded: false,
    isPlaying: false,
    position: 0,
    duration: 0,
    playbackRate: 1,
    volume: 1,
  });

  // Create deck source when engine is ready
  useEffect(() => {
    if (isInitialized && engine && !sourceRef.current) {
      sourceRef.current = engine.createDeckSource(deckId);
    }

    return () => {
      if (sourceRef.current) {
        sourceRef.current.dispose();
        sourceRef.current = null;
      }
    };
  }, [deckId, engine, isInitialized]);

  // Load audio file
  const loadFile = useCallback(async (url: string) => {
    if (!sourceRef.current) {
      throw new Error('Deck source not initialized');
    }

    try {
      await sourceRef.current.loadFile(url);
      setDeckState(prev => ({
        ...prev,
        isLoaded: true,
        duration: sourceRef.current!.duration,
      }));
    } catch (error) {
      console.error(`Failed to load file for deck ${deckId}:`, error);
      throw error;
    }
  }, [deckId]);

  // Playback controls
  const play = useCallback(() => {
    if (sourceRef.current && deckState.isLoaded) {
      sourceRef.current.start();
      setDeckState(prev => ({ ...prev, isPlaying: true }));
    }
  }, [deckState.isLoaded]);

  const pause = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.pause();
      setDeckState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const stop = useCallback(() => {
    if (sourceRef.current) {
      sourceRef.current.stop();
      setDeckState(prev => ({ ...prev, isPlaying: false, position: 0 }));
    }
  }, []);

  const seek = useCallback((position: number) => {
    if (sourceRef.current) {
      sourceRef.current.seek(position);
      setDeckState(prev => ({ ...prev, position }));
    }
  }, []);

  const setPlaybackRate = useCallback((rate: number) => {
    if (sourceRef.current) {
      sourceRef.current.setPlaybackRate(rate);
      setDeckState(prev => ({ ...prev, playbackRate: rate }));
    }
  }, []);

  const setVolume = useCallback((volume: number) => {
    if (sourceRef.current) {
      sourceRef.current.setVolume(volume);
      setDeckState(prev => ({ ...prev, volume }));
    }
  }, []);

  // Update position periodically when playing
  useEffect(() => {
    if (!deckState.isPlaying || !sourceRef.current) return;

    const interval = setInterval(() => {
      if (sourceRef.current) {
        const position = sourceRef.current.getPosition();
        setDeckState(prev => ({ ...prev, position }));
      }
    }, 100); // Update every 100ms for smooth progress

    return () => clearInterval(interval);
  }, [deckState.isPlaying]);

  return {
    ...deckState,
    source: sourceRef.current,
    loadFile,
    play,
    pause,
    stop,
    seek,
    setPlaybackRate,
    setVolume,
  };
}