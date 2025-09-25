"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { StemPlaybackEngine } from "../lib/audio/stemPlaybackEngine";
import { StemTrack } from "../types/stem-player";

export function useStemPlayback(track: StemTrack | null) {
  const engineRef = useRef<StemPlaybackEngine | null>(null);
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AudioContextState | "uninitialized">(
    "uninitialized",
  );

  const ensureEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new StemPlaybackEngine();
    }

    return engineRef.current;
  }, []);

  useEffect(() => {
    ensureEngine();

    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, [ensureEngine]);

  const initialize = useCallback(async () => {
    const engine = ensureEngine();
    await engine.initialize();
    setReady(true);
    setState(engine.getState());
    if (track) {
      engine.loadTrack(track);
    }
    return true;
  }, [ensureEngine, track]);

  useEffect(() => {
    if (!ready || !track) return;
    engineRef.current?.syncTrack(track);
    setState(engineRef.current?.getState() ?? "uninitialized");
  }, [ready, track]);

  const play = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    await engine.play();
    setState(engine.getState());
  }, []);

  const pause = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    await engine.pause();
    setState(engine.getState());
  }, []);

  const stop = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    await engine.stop();
    setState(engine.getState());
  }, []);

  const updateStem = useCallback(
    (stemId: string, volume: number, muted: boolean) => {
      engineRef.current?.updateStem(stemId, volume, muted);
    },
    [],
  );

  return {
    initialize,
    play,
    pause,
    stop,
    updateStem,
    ready,
    state,
  };
}
