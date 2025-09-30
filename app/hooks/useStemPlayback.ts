"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as Tone from "tone";
import { StemTrack, StemMeta } from "../types/stem-player";

interface StemPlayerNode {
  player: Tone.Player | null;
  gain: Tone.Gain;
  panner: Tone.Panner;
  isLoaded: boolean;
  volume: number;
  muted: boolean;
}

export function useStemPlayback(track: StemTrack | null) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AudioContextState | "uninitialized">(
    "uninitialized",
  );
  const [isLoading, setIsLoading] = useState(false);
  const stemNodesRef = useRef<Map<string, StemPlayerNode>>(new Map());
  const masterGainRef = useRef<Tone.Gain | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize audio context and create master gain
  const initialize = useCallback(async () => {
    if (isInitializedRef.current) return true;

    try {
      console.log("🎵 Initializing proper audio playback system...");

      // Initialize Tone.js context
      if (Tone.getContext().state === "suspended") {
        await Tone.start();
      }

      // Create master gain node
      masterGainRef.current = new Tone.Gain(0.8).toDestination();
      isInitializedRef.current = true;
      setReady(true);
      setState(Tone.getContext().state as AudioContextState);

      console.log("✅ Audio system initialized successfully");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize audio system:", error);
      return false;
    }
  }, []);

  // Create a silent stem node as fallback when audio files are missing
  const createSilentStemNode = useCallback((stem: StemMeta): StemPlayerNode => {
    console.log(`🔇 Creating silent fallback for stem ${stem.id}`);

    // Create a silent player that produces no audio
    const player = new Tone.Player({
      url: new Tone.Buffer(), // Empty buffer produces no sound
      volume: stem.volume,
      mute: stem.muted,
    });

    // Create gain and panner nodes
    const gain = new Tone.Gain(stem.volume);
    const panner = new Tone.Panner(0);

    // Connect the audio graph
    player.connect(gain);
    gain.connect(panner);
    panner.toDestination();

    return {
      player,
      gain,
      panner,
      isLoaded: true,
      volume: stem.volume,
      muted: stem.muted,
    };
  }, []);

  // Load actual audio files instead of synthetic oscillators
  const loadAudioForStem = useCallback(
    async (stem: StemMeta): Promise<StemPlayerNode | null> => {
      // Use hlsUrl for audio playback
      const audioUrl = stem.hlsUrl;

      if (!audioUrl) {
        console.warn(`⚠️ No audio URL available for stem ${stem.id}`);
        return createSilentStemNode(stem);
      }

      try {
        console.log(`🎵 Loading audio for stem ${stem.id} from ${audioUrl}`);

        // Create Tone.js player for actual audio file
        const player = new Tone.Player({
          url: audioUrl,
          loop: false,
          autostart: false,
          volume: stem.muted ? -Infinity : Tone.gainToDb(stem.volume),
        });

        // Create audio processing chain
        const gain = new Tone.Gain(stem.muted ? 0 : stem.volume);
        const panner = new Tone.Panner(0);

        // Connect audio graph: Player -> Gain -> Panner -> Master
        player.connect(gain);
        gain.connect(panner);
        panner.connect(masterGainRef.current!);

        // Wait for player to load
        await new Promise<void>((resolve, reject) => {
          const timeout = setTimeout(() => {
            console.warn(
              `⚠️ Audio load timeout for stem ${stem.id}, using silent fallback`,
            );
            clearTimeout(timeout);
            clearInterval(interval);
            // Create silent fallback node instead of rejecting
            resolve();
          }, 5000); // Reduced timeout to 5 seconds

          let interval: NodeJS.Timeout;

          // Check if player is already loaded
          if (player.loaded) {
            clearTimeout(timeout);
            console.log(`✅ Successfully loaded audio for stem ${stem.id}`);
            resolve();
            return;
          }

          // Wait for load event using Tone.js event system
          const checkLoaded = () => {
            if (player.loaded) {
              clearTimeout(timeout);
              clearInterval(interval);
              console.log(`✅ Successfully loaded audio for stem ${stem.id}`);
              resolve();
            }
          };

          // Check periodically until loaded
          interval = setInterval(checkLoaded, 100);

          // Also listen for any errors (Tone.js will throw on error)
          const originalOnstop = player.onstop;
          player.onstop = (time) => {
            if (originalOnstop) originalOnstop(time);
            // If player stopped without being explicitly stopped, it might be an error
            if (!player.loaded) {
              clearTimeout(timeout);
              clearInterval(interval);
              console.warn(
                `⚠️ Player error for stem ${stem.id}, using silent fallback`,
              );
              resolve(); // Resolve instead of reject to prevent errors
            }
          };
        });

        return {
          player,
          gain,
          panner,
          isLoaded: player.loaded,
          volume: stem.volume,
          muted: stem.muted,
        };
      } catch (error) {
        console.warn(
          `⚠️ Error loading stem ${stem.id}, using silent fallback:`,
          error,
        );
        return createSilentStemNode(stem);
      }
    },
    [createSilentStemNode],
  );

  // Load track audio files
  const loadTrack = useCallback(
    async (trackToLoad: StemTrack) => {
      if (!isInitializedRef.current || !masterGainRef.current) {
        console.warn("⚠️ Audio system not initialized, cannot load track");
        return;
      }

      setIsLoading(true);
      console.log(
        `🎵 Loading track "${trackToLoad.title}" with ${trackToLoad.stems.length} stems`,
      );

      try {
        // Dispose existing stems
        stemNodesRef.current.forEach((node) => {
          if (node.player) {
            node.player.dispose();
          }
          node.gain.dispose();
          node.panner.dispose();
        });
        stemNodesRef.current.clear();

        // Load each stem's audio
        let loadedCount = 0;
        let silentFallbackCount = 0;

        for (const stem of trackToLoad.stems) {
          const node = await loadAudioForStem(stem);
          if (node) {
            stemNodesRef.current.set(stem.id, node);
            if (
              node.player &&
              node.player.buffer &&
              node.player.buffer.length > 0
            ) {
              loadedCount++;
            } else {
              silentFallbackCount++;
            }
          }
        }

        console.log(`✅ Loaded ${loadedCount} audio stems successfully`);
        if (silentFallbackCount > 0) {
          console.log(
            `🔇 Using ${silentFallbackCount} silent fallback(s) for missing audio files`,
          );
        }
      } catch (error) {
        console.error("❌ Error loading track:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [loadAudioForStem],
  );

  // Sync track state
  useEffect(() => {
    if (!ready || !track) return;
    loadTrack(track);
  }, [ready, track, loadTrack]);

  // Playback controls
  const play = useCallback(async () => {
    if (!isInitializedRef.current) {
      console.warn("⚠️ Audio system not initialized");
      return;
    }

    try {
      console.log("▶️ Starting audio playback");

      // Resume audio context if suspended
      if (Tone.getContext().state === "suspended") {
        await Tone.context.resume();
      }

      // Start all loaded players simultaneously
      const startTime = Tone.now();
      stemNodesRef.current.forEach((node) => {
        if (node.player && node.isLoaded && !node.muted) {
          node.player.start(startTime);
        }
      });

      setState(Tone.getContext().state as AudioContextState);
      console.log("✅ Audio playback started");
    } catch (error) {
      console.error("❌ Error starting playback:", error);
    }
  }, []);

  const pause = useCallback(async () => {
    try {
      console.log("⏸️ Pausing audio playback");

      // Stop all players
      stemNodesRef.current.forEach((node) => {
        if (node.player) {
          node.player.stop();
        }
      });

      setState(Tone.getContext().state as AudioContextState);
      console.log("✅ Audio playback paused");
    } catch (error) {
      console.error("❌ Error pausing playback:", error);
    }
  }, []);

  const stop = useCallback(async () => {
    try {
      console.log("⏹️ Stopping audio playback");

      // Stop all players
      stemNodesRef.current.forEach((node) => {
        if (node.player) {
          node.player.stop();
        }
      });

      setState(Tone.getContext().state as AudioContextState);
      console.log("✅ Audio playback stopped");
    } catch (error) {
      console.error("❌ Error stopping playback:", error);
    }
  }, []);

  // Update stem volume and mute state
  const updateStem = useCallback(
    (stemId: string, volume: number, muted: boolean) => {
      const node = stemNodesRef.current.get(stemId);
      if (!node) return;

      try {
        console.log(
          `🎛️ Updating stem ${stemId}: volume=${volume}, muted=${muted}`,
        );

        // Update gain (with anti-click ramping)
        const targetVolume = muted ? 0 : Math.max(0, Math.min(1, volume));
        node.gain.gain.rampTo(targetVolume, 0.05);

        // Update player volume if available
        if (node.player) {
          const playerVolume = muted ? -Infinity : Tone.gainToDb(volume);
          node.player.volume.rampTo(playerVolume, 0.05);
        }

        // Update stored state
        node.volume = volume;
        node.muted = muted;
      } catch (error) {
        console.error(`❌ Error updating stem ${stemId}:`, error);
      }
    },
    [],
  );

  // Cleanup
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up audio system");

      // Capture ref values at the start of cleanup
      const stemNodes = stemNodesRef.current;
      const masterGain = masterGainRef.current;

      // Dispose all stem nodes
      stemNodes.forEach((node) => {
        if (node.player) {
          node.player.dispose();
        }
        node.gain.dispose();
        node.panner.dispose();
      });

      // Dispose master gain
      if (masterGain) {
        masterGain.dispose();
      }

      stemNodes.clear();
      isInitializedRef.current = false;
      setReady(false);
      setState("uninitialized");
    };
  }, []);

  return {
    initialize,
    play,
    pause,
    stop,
    updateStem,
    ready,
    state,
    isLoading,
  };
}
