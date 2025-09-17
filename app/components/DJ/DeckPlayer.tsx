'use client';

import React, { useCallback, useRef, useState, useEffect } from 'react';
import * as Tone from 'tone';
import useEnhancedDJStore from '@/app/stores/enhancedDjStoreWithGestures';
import { Play, Pause, SkipBack, SkipForward, Loader, Upload, Link } from 'lucide-react';

interface DeckPlayerProps {
  deckId: number;
  className?: string;
}

export const DeckPlayer: React.FC<DeckPlayerProps> = ({ deckId, className = '' }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  const {
    decks,
    loadTrack,
    playDeck,
    pauseDeck,
    setDeckTime,
    setDeckVolume,
    setDeckPlaybackRate,
    setCuePoint,
    setLoop,
    analyzeMixingContext
  } = useEnhancedDJStore();

  const deck = decks[deckId];
  const player = useRef<Tone.Player | null>(null);

  // Initialize player when track loads
  useEffect(() => {
    if (deck?.track?.url && !player.current) {
      player.current = new Tone.Player({
        url: deck.track.url,
        onload: () => {
          console.log(`Track loaded for deck ${deckId}`);
          setIsLoading(false);
        }
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
  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const url = URL.createObjectURL(file);

      // Create track object
      const track = {
        id: `local-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        artist: 'Local File',
        duration: 0, // Will be updated when loaded
        url,
        bpm: 120, // Will be analyzed
        bpmConfidence: 0,
        key: 'C',
        keyConfidence: 0,
        scale: 'major' as const,
        energy: 0.5,
        beatGrid: [],
        downbeats: [],
        phrases: [],
        camelotKey: '8B',
        compatibleKeys: [],
        mixingBPMRange: [115, 125] as [number, number],
        analyzedAt: Date.now(),
        analysisVersion: '1.0'
      };

      await loadTrack(deckId, track);

      // Trigger analysis
      analyzeMixingContext();
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Failed to load audio file');
    } finally {
      setIsLoading(false);
    }
  }, [deckId, loadTrack, analyzeMixingContext]);

  // Handle URL input
  const handleUrlLoad = useCallback(async () => {
    if (!urlInput) return;

    setIsLoading(true);
    try {
      // For now, just load the URL directly
      // In production, this would go through a backend service
      const track = {
        id: `url-${Date.now()}`,
        title: urlInput.split('/').pop() || 'Stream',
        artist: 'Online Stream',
        duration: 0,
        url: urlInput,
        bpm: 120,
        bpmConfidence: 0,
        key: 'C',
        keyConfidence: 0,
        scale: 'major' as const,
        energy: 0.5,
        beatGrid: [],
        downbeats: [],
        phrases: [],
        camelotKey: '8B',
        compatibleKeys: [],
        mixingBPMRange: [115, 125] as [number, number],
        analyzedAt: Date.now(),
        analysisVersion: '1.0'
      };

      await loadTrack(deckId, track);
      setShowUrlInput(false);
      setUrlInput('');

      // Trigger analysis
      analyzeMixingContext();
    } catch (error) {
      console.error('Error loading URL:', error);
      alert('Failed to load from URL');
    } finally {
      setIsLoading(false);
    }
  }, [urlInput, deckId, loadTrack, analyzeMixingContext]);

  // Playback controls
  const handlePlayPause = useCallback(async () => {
    if (!deck?.track) return;

    try {
      if (deck.isPlaying) {
        pauseDeck(deckId);
        if (player.current) {
          player.current.stop();
        }
      } else {
        // Ensure audio context is started
        if (Tone.context.state !== 'running') {
          await Tone.start();
        }

        playDeck(deckId);
        if (player.current) {
          player.current.start();
        }
      }
    } catch (error) {
      console.error('Playback error:', error);
    }
  }, [deck, deckId, playDeck, pauseDeck]);

  const handleCue = useCallback(() => {
    if (!deck?.track || !player.current) return;

    // Set cue point at current position
    const currentTime = player.current.buffer.duration * (deck.currentTime / deck.track.duration);
    setCuePoint(deckId, currentTime);
  }, [deck, deckId, setCuePoint]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    setDeckVolume(deckId, volume);

    if (player.current) {
      player.current.volume.value = Tone.gainToDb(volume);
    }
  }, [deckId, setDeckVolume]);

  const handlePlaybackRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rate = parseFloat(e.target.value);
    setDeckPlaybackRate(deckId, rate);

    if (player.current) {
      player.current.playbackRate = rate;
    }
  }, [deckId, setDeckPlaybackRate]);

  return (
    <div className={`ox-surface p-4 ${className}`}>
      <h3 className="text-lg font-display mb-4 text-ox-accent">
        DECK {String.fromCharCode(65 + deckId)}
      </h3>

      {/* Track Display */}
      <div className="mb-4 p-3 bg-gray-900 rounded">
        {deck?.track ? (
          <div>
            <div className="font-bold text-white">{deck.track.title}</div>
            <div className="text-sm text-gray-400">{deck.track.artist}</div>
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              <span>BPM: {deck.track.bpm.toFixed(1)}</span>
              <span>KEY: {deck.track.camelotKey}</span>
              <span>ENERGY: {(deck.track.energy * 100).toFixed(0)}%</span>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-2">No track loaded</div>
        )}
      </div>

      {/* Waveform Visualization */}
      <div className="h-16 bg-gray-900 rounded mb-4 flex items-center justify-center overflow-hidden">
        {deck?.track ? (
          <div className="w-full h-full flex items-center px-1">
            {/* Simulated waveform bars */}
            {Array.from({ length: 50 }, (_, i) => (
              <div
                key={i}
                className="flex-1 mx-px"
                style={{
                  height: `${30 + Math.sin(i * 0.3) * 20 + Math.random() * 20}%`,
                  background: `linear-gradient(to top,
                    ${i < (deck.progress || 0) * 50 ? '#FF0000' : '#666'},
                    ${i < (deck.progress || 0) * 50 ? '#FF6B6B' : '#999'})`,
                  transition: 'background 0.2s'
                }}
              />
            ))}
          </div>
        ) : (
          <span className="text-gray-600 text-xs">WAVEFORM</span>
        )}
      </div>

      {/* Transport Controls */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          onClick={() => handleCue()}
          className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
          disabled={!deck?.track}
        >
          <SkipBack size={16} />
        </button>

        <button
          onClick={handlePlayPause}
          className="p-3 rounded-full bg-ox-primary hover:bg-ox-primary/80 transition-colors"
          disabled={!deck?.track || isLoading}
        >
          {isLoading ? (
            <Loader size={20} className="animate-spin" />
          ) : deck?.isPlaying ? (
            <Pause size={20} />
          ) : (
            <Play size={20} />
          )}
        </button>

        <button
          onClick={() => setLoop(deckId, deck?.currentTime || 0, (deck?.currentTime || 0) + 4)}
          className="p-2 rounded bg-gray-800 hover:bg-gray-700 transition-colors"
          disabled={!deck?.track}
        >
          <SkipForward size={16} />
        </button>
      </div>

      {/* Volume Control */}
      <div className="mb-3">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Volume</span>
          <span className="font-mono">{((deck?.volume || 0.75) * 100).toFixed(0)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={deck?.volume || 0.75}
          onChange={handleVolumeChange}
          className="w-full"
        />
      </div>

      {/* Pitch/Tempo Control */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-400">Pitch</span>
          <span className="font-mono">
            {((deck?.playbackRate || 1.0) > 1 ? '+' : '')}
            {(((deck?.playbackRate || 1.0) - 1) * 100).toFixed(1)}%
          </span>
        </div>
        <input
          type="range"
          min="0.9"
          max="1.1"
          step="0.001"
          value={deck?.playbackRate || 1.0}
          onChange={handlePlaybackRateChange}
          className="w-full"
        />
      </div>

      {/* Load Track Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 ox-button-secondary text-sm py-2 flex items-center justify-center gap-2"
        >
          <Upload size={14} />
          Load File
        </button>

        <button
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="flex-1 ox-button-secondary text-sm py-2 flex items-center justify-center gap-2"
        >
          <Link size={14} />
          Stream URL
        </button>
      </div>

      {/* URL Input */}
      {showUrlInput && (
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Enter audio URL..."
            className="flex-1 px-2 py-1 bg-gray-900 rounded text-sm"
            onKeyPress={(e) => e.key === 'Enter' && handleUrlLoad()}
          />
          <button
            onClick={handleUrlLoad}
            className="px-3 py-1 bg-ox-primary rounded text-sm"
            disabled={!urlInput || isLoading}
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
      />
    </div>
  );
};

export default DeckPlayer;