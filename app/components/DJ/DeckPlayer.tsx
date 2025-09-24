"use client";

import React, { useCallback, useRef, useState, useEffect } from "react";
import * as Tone from "tone";
import useEnhancedDJStore from "@/stores/enhancedDjStoreWithGestures";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Loader,
  Upload,
  Link,
} from "lucide-react";

interface DeckPlayerProps {
  deckId: number;
  className?: string;
}

export const DeckPlayer: React.FC<DeckPlayerProps> = ({
  deckId,
  className = "",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);

  const {
    decks,
    loadTrack,
    playDeck,
    pauseDeck,
    setDeckVolume,
    setDeckPlaybackRate,
  } = useEnhancedDJStore();

  const deck = decks[deckId];
  const player = useRef<Tone.Player | null>(null);

  // Initialize player when track loads
  useEffect(() => {
    if (deck?.track?.url && !player.current) {
      setIsLoading(true);
      player.current = new Tone.Player({
        url: deck.track.url,
        onload: () => {
          console.log(`Track loaded for deck ${deckId}`);
          setIsLoading(false);
        },
        onerror: (error: Error) => {
          console.error(`Failed to load track for deck ${deckId}:`, error);
          setIsLoading(false);
          alert(`Failed to load track: ${error.message}`);
        },
      }).toDestination();
    }

    return () => {
      if (player.current) {
        player.current.dispose();
        player.current = null;
      }
    };
  }, [deck?.track?.url, deckId]);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      try {
        const url = URL.createObjectURL(file);

        // Create track object
        const track = {
          id: `local-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ""),
          artist: "Local File",
          duration: 0, // Will be updated when loaded
          url,
          bpm: 120, // Will be analyzed
          key: "C",
        };

        await loadTrack(deckId, track);
      } catch (error) {
        console.error("Error loading file:", error);
        alert("Failed to load audio file");
      } finally {
        setIsLoading(false);
      }
    },
    [deckId, loadTrack],
  );

  // Handle URL input
  const handleUrlLoad = useCallback(async () => {
    if (!urlInput) return;

    // Check for unsupported streaming services
    if (urlInput.includes("youtube.com") || urlInput.includes("youtu.be")) {
      alert(
        "⚠️ YouTube URLs cannot be played directly\n\n" +
          "Due to copyright protection and technical limitations, YouTube videos cannot be loaded as audio sources.\n\n" +
          "✅ Try these alternatives:\n" +
          "• Use the demo tracks provided\n" +
          "• Upload local MP3/WAV files\n" +
          "• Use direct audio file URLs",
      );
      return;
    }

    if (
      urlInput.includes("spotify.com") ||
      urlInput.includes("soundcloud.com") ||
      urlInput.includes("apple.com") ||
      urlInput.includes("tidal.com")
    ) {
      alert(
        "⚠️ Streaming service URLs are not supported\n\n" +
          "Protected content from streaming services cannot be accessed.\n\n" +
          "✅ Use direct audio file URLs or local files instead.",
      );
      return;
    }

    setIsLoading(true);
    try {
      // Check if URL ends with audio format
      const urlLower = urlInput.toLowerCase();
      const hasAudioExtension = [".mp3", ".wav", ".ogg", ".m4a", ".webm"].some(
        (ext) => urlLower.includes(ext),
      );

      if (!hasAudioExtension && !urlInput.includes("soundhelix.com")) {
        console.warn("URL may not be a direct audio file");
      }

      const track = {
        id: `url-${Date.now()}`,
        title:
          urlInput.split("/").pop()?.split("?")[0]?.split(".")[0] ||
          "External Track",
        artist: "URL Import",
        duration: 0,
        url: urlInput,
        bpm: 120,
        key: "C",
      };

      await loadTrack(deckId, track);
      setShowUrlInput(false);
      setUrlInput("");
    } catch (error) {
      console.error("Error loading URL:", error);
      alert(
        "❌ Failed to load audio from URL\n\n" +
          "Possible reasons:\n" +
          "• CORS policy blocking cross-origin requests\n" +
          "• Invalid or inaccessible URL\n" +
          "• Unsupported audio format\n\n" +
          "✅ Try using local files or the demo tracks",
      );
    } finally {
      setIsLoading(false);
    }
  }, [urlInput, deckId, loadTrack]);

  // Playback controls
  const handlePlayPause = useCallback(async () => {
    if (!deck?.track || isLoading) return;

    try {
      if (deck.isPlaying) {
        pauseDeck(deckId);
        if (player.current && player.current.state === "started") {
          player.current.stop();
        }
      } else {
        // Ensure audio context is started
        if (Tone.context.state !== "running") {
          await Tone.start();
        }

        // Check if buffer is loaded before playing
        if (player.current && player.current.loaded) {
          playDeck(deckId);
          player.current.start();
        } else {
          console.warn("Track not loaded yet, please wait...");
          alert("Track is still loading, please wait...");
        }
      }
    } catch (error) {
      console.error("Playback error:", error);
      alert(
        `Playback failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }, [deck, deckId, playDeck, pauseDeck, isLoading]);

  const handleCue = useCallback(() => {
    if (!deck?.track || !player.current) return;

    // Cue functionality would be implemented here
    console.log("Cue point would be set here");
  }, [deck]);

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const volume = parseFloat(e.target.value);
      setDeckVolume(deckId, volume);

      if (player.current) {
        player.current.volume.value = Tone.gainToDb(volume);
      }
    },
    [deckId, setDeckVolume],
  );

  const handlePlaybackRateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rate = parseFloat(e.target.value);
      setDeckPlaybackRate(deckId, rate);

      if (player.current) {
        player.current.playbackRate = rate;
      }
    },
    [deckId, setDeckPlaybackRate],
  );

  return (
    <div
      className={`ox-surface p-4 ${className}`}
      role="region"
      aria-label={`Deck ${String.fromCharCode(65 + deckId)} player controls`}
    >
      <h3 className="text-lg font-display mb-4 text-ox-accent">
        DECK {String.fromCharCode(65 + deckId)}
      </h3>

      {/* Track Display */}
      <div
        className="mb-4 p-3 bg-gray-900 rounded"
        role="status"
        aria-live="polite"
        aria-label="Currently loaded track"
      >
        {deck?.track ? (
          <div>
            <div className="font-bold text-white">{deck.track.title}</div>
            <div className="text-sm text-gray-400">{deck.track.artist}</div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span
                aria-label={`Beats per minute: ${deck.track.bpm.toFixed(1)}`}
              >
                BPM: {deck.track.bpm.toFixed(1)}
              </span>
              <span aria-label={`Musical key: ${deck.track.key}`}>
                KEY: {deck.track.key}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-2">No track loaded</div>
        )}
      </div>

      {/* Waveform Visualization */}
      <div
        className="h-16 bg-gray-900 rounded mb-4 flex items-center justify-center overflow-hidden"
        role="img"
        aria-label={`Waveform visualization showing ${deck?.track ? `playback progress at ${Math.round((deck.currentTime / (deck.track.duration || 1)) * 100)}%` : "no track loaded"}`}
      >
        {deck?.track ? (
          <div className="w-full h-full flex items-center px-1">
            {/* Simulated waveform bars */}
            {Array.from({ length: 50 }, (_, i) => (
              <div
                key={i}
                className="flex-1 mx-px"
                aria-hidden="true"
                style={{
                  height: `${30 + Math.sin(i * 0.3) * 20 + Math.random() * 20}%`,
                  background: `linear-gradient(to top,
                    ${i < (deck.currentTime / (deck.track?.duration || 1) || 0) * 50 ? "#FF0000" : "#666"},
                    ${i < (deck.currentTime / (deck.track?.duration || 1) || 0) * 50 ? "#FF6B6B" : "#999"})`,
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
        ) : (
          <span className="text-gray-600 text-xs">WAVEFORM</span>
        )}
      </div>

      {/* Transport Controls */}
      <div
        className="flex items-center justify-center gap-2 mb-4"
        role="group"
        aria-label="Playback controls"
      >
        <button
          onClick={() => handleCue()}
          className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-ox-primary"
          disabled={!deck?.track}
          aria-label="Set cue point"
          title="Set cue point (Q)"
        >
          <SkipBack size={16} />
        </button>

        <button
          onClick={handlePlayPause}
          className="p-3 rounded-full bg-ox-primary hover:bg-ox-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-ox-accent"
          disabled={!deck?.track || isLoading}
          aria-label={deck?.isPlaying ? "Pause" : "Play"}
          title={deck?.isPlaying ? "Pause (Space)" : "Play (Space)"}
        >
          {isLoading ? (
            <Loader size={20} className="animate-spin" aria-label="Loading" />
          ) : deck?.isPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} />
          )}
        </button>

        <button
          onClick={() =>
            console.log("Loop functionality would be implemented here")
          }
          className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-ox-primary"
          disabled={!deck?.track}
          aria-label="Set loop"
          title="Set 4-bar loop (L)"
        >
          <SkipForward size={16} />
        </button>
      </div>

      {/* Volume Control */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <label htmlFor={`volume-${deckId}`} className="text-gray-400">
            Volume
          </label>
          <span className="font-mono" aria-live="polite" aria-atomic="true">
            {((deck?.volume || 0.75) * 100).toFixed(0)}%
          </span>
        </div>
        <input
          id={`volume-${deckId}`}
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={deck?.volume || 0.75}
          onChange={handleVolumeChange}
          className="w-full focus:outline-none focus:ring-2 focus:ring-ox-primary"
          aria-label={`Volume control for Deck ${String.fromCharCode(65 + deckId)}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round((deck?.volume || 0.75) * 100)}
        />
      </div>

      {/* Pitch/Tempo Control */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <label htmlFor={`pitch-${deckId}`} className="text-gray-400">
            Pitch
          </label>
          <span className="font-mono" aria-live="polite" aria-atomic="true">
            {(deck?.playbackRate || 1.0) > 1 ? "+" : ""}
            {(((deck?.playbackRate || 1.0) - 1) * 100).toFixed(1)}%
          </span>
        </div>
        <input
          id={`pitch-${deckId}`}
          type="range"
          min="0.9"
          max="1.1"
          step="0.001"
          value={deck?.playbackRate || 1.0}
          onChange={handlePlaybackRateChange}
          className="w-full focus:outline-none focus:ring-2 focus:ring-ox-primary"
          aria-label={`Pitch control for Deck ${String.fromCharCode(65 + deckId)}`}
          aria-valuemin={-10}
          aria-valuemax={10}
          aria-valuenow={Math.round(((deck?.playbackRate || 1.0) - 1) * 100)}
        />
      </div>

      {/* Load Track Controls */}
      <div
        className="flex gap-2"
        role="group"
        aria-label="Track loading options"
      >
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 ox-button-secondary text-sm py-2 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-ox-primary"
          aria-label="Load audio file from device"
        >
          <Upload size={14} aria-hidden="true" />
          Load File
        </button>

        <button
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="flex-1 ox-button-secondary text-sm py-2 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-ox-primary"
          aria-label="Load audio from URL"
          aria-expanded={showUrlInput}
        >
          <Link size={14} aria-hidden="true" />
          Stream URL
        </button>
      </div>

      {/* URL Input */}
      {showUrlInput && (
        <div className="mt-2 flex gap-2" role="group" aria-label="URL input">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter audio URL..."
            className="flex-1 px-2 py-1 bg-gray-900 rounded text-sm focus:outline-none focus:ring-2 focus:ring-ox-primary"
            onKeyPress={(e) => e.key === "Enter" && handleUrlLoad()}
            aria-label="Audio stream URL"
          />
          <button
            onClick={handleUrlLoad}
            className="px-3 py-1 bg-ox-primary rounded text-sm focus:outline-none focus:ring-2 focus:ring-ox-accent"
            disabled={!urlInput || isLoading}
            aria-label="Load URL"
          >
            Load
          </button>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileUpload}
        className="hidden"
        aria-label="File input for audio tracks"
      />
    </div>
  );
};

export default DeckPlayer;
