'use client';

import React, { useState, useRef, useEffect } from 'react';

// Audio engine interface - will be implemented by Stream A
interface AudioEngine {
  load: (url: string) => Promise<void>;
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (position: number) => void;
  setRate: (rate: number) => void;
  setVolume: (volume: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
  setBPM: (bpm: number) => void;
  setLoop: (start: number, end: number) => void;
  clearLoop: () => void;
  setCue: (position: number) => void;
  jumpToCue: () => void;
}

// Mock audio engine for development
class MockAudioEngine implements AudioEngine {
  private isPlayingState = false;
  private currentTimeState = 0;
  private durationState = 120; // 2 minutes mock track
  private intervalId: NodeJS.Timeout | null = null;

  async load(url: string): Promise<void> {
    console.log('Loading track:', url);
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  play(): void {
    this.isPlayingState = true;
    this.intervalId = setInterval(() => {
      this.currentTimeState += 0.1;
      if (this.currentTimeState >= this.durationState) {
        this.currentTimeState = this.durationState;
        this.pause();
      }
    }, 100);
  }

  pause(): void {
    this.isPlayingState = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  stop(): void {
    this.pause();
    this.currentTimeState = 0;
  }

  seek(position: number): void {
    this.currentTimeState = Math.max(0, Math.min(position, this.durationState));
  }

  setRate(rate: number): void {
    console.log('Setting playback rate:', rate);
  }

  setVolume(volume: number): void {
    console.log('Setting volume:', volume);
  }

  getCurrentTime(): number {
    return this.currentTimeState;
  }

  getDuration(): number {
    return this.durationState;
  }

  isPlaying(): boolean {
    return this.isPlayingState;
  }

  setBPM(bpm: number): void {
    console.log('Setting BPM:', bpm);
  }

  setLoop(start: number, end: number): void {
    console.log('Setting loop:', start, 'to', end);
  }

  clearLoop(): void {
    console.log('Clearing loop');
  }

  setCue(position: number): void {
    console.log('Setting cue point:', position);
  }

  jumpToCue(): void {
    console.log('Jumping to cue point');
  }
}

interface DeckAProps {
  audioEngine?: AudioEngine;
  onPitchChange?: (pitch: number) => void;
  onVolumeChange?: (volume: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onCue?: () => void;
  onLoopToggle?: (enabled: boolean) => void;
}

const DeckA: React.FC<DeckAProps> = ({
  audioEngine,
  onPitchChange,
  onVolumeChange,
  onPlay,
  onPause,
  onCue,
  onLoopToggle
}) => {
  const [engine] = useState<AudioEngine>(() => audioEngine || new MockAudioEngine());
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(120);
  const [volume, setVolume] = useState(100);
  const [pitch, setPitch] = useState(0); // -8 to +8 percent
  const [bpm, setBPM] = useState(128);
  const [isLooping, setIsLooping] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [cuePoint, setCuePoint] = useState(0);
  const [trackTitle, setTrackTitle] = useState('No Track Loaded');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const waveformRef = useRef<HTMLCanvasElement>(null);

  // Update current time and playing state
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(engine.getCurrentTime());
      setDuration(engine.getDuration());
      setIsPlaying(engine.isPlaying());
    }, 100);

    return () => clearInterval(interval);
  }, [engine]);

  // Transport Controls
  const handlePlay = () => {
    if (isPlaying) {
      engine.pause();
      onPause?.();
    } else {
      engine.play();
      onPlay?.();
    }
  };

  const handleCue = () => {
    engine.jumpToCue();
    onCue?.();
  };

  const handleStop = () => {
    engine.stop();
  };

  // Pitch Control (-8% to +8%)
  const handlePitchChange = (value: number) => {
    const pitchValue = Math.max(-8, Math.min(8, value));
    setPitch(pitchValue);
    const rate = 1 + (pitchValue / 100);
    engine.setRate(rate);
    onPitchChange?.(pitchValue);
  };

  // Volume Control
  const handleVolumeChange = (value: number) => {
    const volumeValue = Math.max(0, Math.min(100, value));
    setVolume(volumeValue);
    engine.setVolume(volumeValue / 100);
    onVolumeChange?.(volumeValue);
  };

  // Loop Controls
  const handleSetLoopIn = () => {
    setLoopStart(currentTime);
    if (loopEnd > currentTime) {
      setIsLooping(true);
      engine.setLoop(currentTime, loopEnd);
    }
  };

  const handleSetLoopOut = () => {
    setLoopEnd(currentTime);
    if (loopStart < currentTime) {
      setIsLooping(true);
      engine.setLoop(loopStart, currentTime);
    }
  };

  const handleToggleLoop = () => {
    if (isLooping) {
      setIsLooping(false);
      engine.clearLoop();
      onLoopToggle?.(false);
    } else if (loopStart < loopEnd) {
      setIsLooping(true);
      engine.setLoop(loopStart, loopEnd);
      onLoopToggle?.(true);
    }
  };

  // Cue Point
  const handleSetCue = () => {
    setCuePoint(currentTime);
    engine.setCue(currentTime);
  };

  // File Loading
  const handleFileLoad = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTrackTitle(file.name.replace(/\.[^/.]+$/, ''));
      const url = URL.createObjectURL(file);
      await engine.load(url);
      // TODO: Analyze BPM and key
      setBPM(128); // Placeholder
    }
  };

  // Waveform visualization (placeholder)
  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw simple waveform placeholder
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x < canvas.width; x++) {
      const y = canvas.height / 2 + Math.sin(x * 0.02) * 20 * Math.random();
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw playhead
    const playheadX = (currentTime / duration) * canvas.width;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, canvas.height);
    ctx.stroke();

    // Draw loop points
    if (isLooping) {
      const loopStartX = (loopStart / duration) * canvas.width;
      const loopEndX = (loopEnd / duration) * canvas.width;

      ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
      ctx.fillRect(loopStartX, 0, loopEndX - loopStartX, canvas.height);
    }
  }, [currentTime, duration, isLooping, loopStart, loopEnd]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="deck-a bg-gray-900 border border-gray-700 rounded-lg p-4 w-96 h-auto">
      {/* Deck Header */}
      <div className="deck-header mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-white text-lg font-bold">DECK A</h2>
          <div className="text-green-400 text-sm font-mono">
            {bpm} BPM
          </div>
        </div>
        <div className="text-gray-400 text-sm truncate mt-1">
          {trackTitle}
        </div>
      </div>

      {/* File Load */}
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="audio/*"
          onChange={handleFileLoad}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
        >
          Load Track
        </button>
      </div>

      {/* Waveform Display */}
      <div className="mb-4">
        <canvas
          ref={waveformRef}
          width={352}
          height={80}
          className="w-full bg-black border border-gray-600 rounded"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Transport Controls */}
      <div className="transport-controls mb-4">
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleCue}
            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded font-bold"
          >
            CUE
          </button>
          <button
            onClick={handlePlay}
            className={`px-6 py-2 rounded font-bold text-white ${
              isPlaying
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isPlaying ? 'PAUSE' : 'PLAY'}
          </button>
          <button
            onClick={handleStop}
            className="bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded font-bold"
          >
            STOP
          </button>
        </div>
      </div>

      {/* Pitch Control */}
      <div className="pitch-control mb-4">
        <label className="block text-white text-sm font-semibold mb-2">
          PITCH: {pitch > 0 ? '+' : ''}{pitch.toFixed(1)}%
        </label>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400 text-xs">-8%</span>
          <input
            type="range"
            min="-8"
            max="8"
            step="0.1"
            value={pitch}
            onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none slider"
          />
          <span className="text-gray-400 text-xs">+8%</span>
        </div>
        <div className="flex justify-center mt-2">
          <button
            onClick={() => handlePitchChange(0)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs"
          >
            RESET
          </button>
        </div>
      </div>

      {/* Volume Control */}
      <div className="volume-control mb-4">
        <label className="block text-white text-sm font-semibold mb-2">
          VOLUME: {volume}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={volume}
          onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none slider"
        />
      </div>

      {/* Loop Controls */}
      <div className="loop-controls mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-white text-sm font-semibold">LOOP</label>
          <span className={`text-xs px-2 py-1 rounded ${
            isLooping ? 'bg-yellow-600 text-white' : 'bg-gray-600 text-gray-300'
          }`}>
            {isLooping ? 'ON' : 'OFF'}
          </span>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleSetLoopIn}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs flex-1"
          >
            IN
          </button>
          <button
            onClick={handleSetLoopOut}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs flex-1"
          >
            OUT
          </button>
          <button
            onClick={handleToggleLoop}
            className={`px-3 py-1 rounded text-xs flex-1 text-white ${
              isLooping
                ? 'bg-yellow-600 hover:bg-yellow-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            LOOP
          </button>
        </div>
        {loopStart < loopEnd && (
          <div className="text-xs text-gray-400 mt-1 text-center">
            {formatTime(loopStart)} - {formatTime(loopEnd)}
          </div>
        )}
      </div>

      {/* Cue Point Controls */}
      <div className="cue-controls">
        <div className="flex justify-between items-center mb-2">
          <label className="text-white text-sm font-semibold">CUE POINT</label>
          <span className="text-xs text-gray-400">
            {formatTime(cuePoint)}
          </span>
        </div>
        <button
          onClick={handleSetCue}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm"
        >
          SET CUE
        </button>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 2px solid #4a5568;
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          border: 2px solid #4a5568;
        }
      `}</style>
    </div>
  );
};

export default DeckA;