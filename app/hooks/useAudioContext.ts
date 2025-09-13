import { useEffect, useCallback, useRef, useState } from 'react';
import { AudioEngine, getAudioEngine, AudioSource } from '@/lib/audio/engine';

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

interface UseAudioContextReturn extends AudioEngineState {
  engine: AudioEngine | null;
  initialize: () => Promise<void>;
  createDeckSource: (deckId: string) => AudioSource | null;
  loadAudioFile: (url: string) => Promise<any>;
  reset: () => void;
}

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

  const metricsIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const initialize = useCallback(async () => {
    if (state.isInitialized || state.isLoading) {
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      engineRef.current = getAudioEngine();
      await engineRef.current.initialize();

      setState(prev => ({
        ...prev,
        isInitialized: true,
        isLoading: false,
        error: null,
      }));

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

  const reset = useCallback(() => {
    if (metricsIntervalRef.current) {
      clearInterval(metricsIntervalRef.current);
      metricsIntervalRef.current = null;
    }

    if (engineRef.current) {
      engineRef.current.dispose();
      engineRef.current = null;
    }

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
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (engineRef.current) {
        if (document.hidden) {
          if (engineRef.current.context.state === 'running') {
            engineRef.current.context.suspend();
          }
        } else {
          if (engineRef.current.context.state === 'suspended') {
            engineRef.current.context.resume();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  return {
    ...state,
    engine: engineRef.current,
    initialize,
    createDeckSource,
    loadAudioFile,
    reset,
  };
}

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

  useEffect(() => {
    if (!deckState.isPlaying || !sourceRef.current) return;

    const interval = setInterval(() => {
      if (sourceRef.current) {
        const position = sourceRef.current.getPosition();
        setDeckState(prev => ({ ...prev, position }));
      }
    }, 100);

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