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

  if (!engineRef.current) {
    engineRef.current = new StemPlaybackEngine();
  }

  useEffect(() => {
    return () => {
      engineRef.current?.dispose();
      engineRef.current = null;
      setReady(false);
      setState("uninitialized");
    };
  }, []);

  const initialize = useCallback(async () => {
    if (!engineRef.current) return false;
    await engineRef.current.initialize();
    setReady(true);
    setState(engineRef.current.getState());
    if (track) {
      engineRef.current.loadTrack(track);
    }
    return true;
  }, [track]);

  useEffect(() => {
    if (!ready || !track) return;
    engineRef.current?.syncTrack(track);
    setState(engineRef.current?.getState() ?? "uninitialized");
  }, [ready, track]);

  const play = useCallback(async () => {
    if (!engineRef.current) return;
    await engineRef.current.play();
    setState(engineRef.current.getState());
  }, []);

  const pause = useCallback(async () => {
    if (!engineRef.current) return;
    await engineRef.current.pause();
    setState(engineRef.current.getState());
  }, []);

  const stop = useCallback(async () => {
    if (!engineRef.current) return;
    await engineRef.current.stop();
    setState(engineRef.current.getState());
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
