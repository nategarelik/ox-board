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
  private durationState = 180; // 3 minutes mock track
  private intervalId: NodeJS.Timeout | null = null;

  async load(url: string): Promise<void> {
    console.log('Loading track on Deck B:', url);
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
    console.log('Setting playback rate on Deck B:', rate);
  }

  setVolume(volume: number): void {
    console.log('Setting volume on Deck B:', volume);
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
    console.log('Setting BPM on Deck B:', bpm);
  }

  setLoop(start: number, end: number): void {
    console.log('Setting loop on Deck B:', start, 'to', end);
  }

  clearLoop(): void {
    console.log('Clearing loop on Deck B');
  }

  setCue(position: number): void {
    console.log('Setting cue point on Deck B:', position);
  }

  jumpToCue(): void {
    console.log('Jumping to cue point on Deck B');
  }
}

interface DeckBProps {
  audioEngine?: AudioEngine;
  onPitchChange?: (pitch: number) => void;
  onVolumeChange?: (volume: number) => void;
  onPlay?: () => void;
  onPause?: () => void;
  onCue?: () => void;
  onLoopToggle?: (enabled: boolean) => void;
}

const DeckB: React.FC<DeckBProps> = ({
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
  const [duration, setDuration] = useState(180);
  const [volume, setVolume] = useState(100);
  const [pitch, setPitch] = useState(0); // -8 to +8 percent
  const [bpm, setBPM] = useState(130);
  const [isLooping, setIsLooping] = useState(false);
  const [loopStart, setLoopStart] = useState(0);
  const [loopEnd, setLoopEnd] = useState(0);
  const [cuePoint, setCuePoint] = useState(0);
  const [trackTitle, setTrackTitle] = useState('No Track Loaded');
  const [hotCues, setHotCues] = useState<number[]>([0, 0, 0, 0]); // 4 hot cue points

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

  const handleSync = () => {
    // TODO: Implement BPM sync with other deck
    console.log('Sync requested for Deck B');
  };

  // Pitch Control (-8% to +8%)
  const handlePitchChange = (value: number) => {
    const pitchValue = Math.max(-8, Math.min(8, value));
    setPitch(pitchValue);
    const rate = 1 + (pitchValue / 100);
    engine.setRate(rate);

    // Update BPM display based on pitch
    const baseBPM = 130; // TODO: Get from track analysis
    const adjustedBPM = baseBPM * rate;
    setBPM(Math.round(adjustedBPM * 10) / 10);

    onPitchChange?.(pitchValue);
  };

  const handleFinePitch = (direction: 'up' | 'down') => {
    const adjustment = direction === 'up' ? 0.1 : -0.1;
    handlePitchChange(pitch + adjustment);
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

  const handleAutoLoop = (bars: number) => {
    const secondsPerBar = (60 / bpm) * 4; // Assuming 4/4 time
    const loopLength = bars * secondsPerBar;
    setLoopStart(currentTime);
    setLoopEnd(currentTime + loopLength);
    setIsLooping(true);
    engine.setLoop(currentTime, currentTime + loopLength);
    onLoopToggle?.(true);
  };

  // Hot Cue Controls
  const handleSetHotCue = (index: number) => {
    const newHotCues = [...hotCues];
    newHotCues[index] = currentTime;
    setHotCues(newHotCues);
  };

  const handleJumpToHotCue = (index: number) => {
    if (hotCues[index] > 0) {
      engine.seek(hotCues[index]);
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
      setBPM(130); // Placeholder
    }
  };

  // Waveform visualization (placeholder with different color scheme)
  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw simple waveform placeholder (different pattern for Deck B)
    ctx.strokeStyle = '#ff6b00'; // Orange for Deck B
    ctx.lineWidth = 1;
    ctx.beginPath();

    for (let x = 0; x < canvas.width; x++) {
      const y = canvas.height / 2 + Math.cos(x * 0.015) * 25 * Math.random();
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

      ctx.fillStyle = 'rgba(255, 107, 0, 0.3)';
      ctx.fillRect(loopStartX, 0, loopEndX - loopStartX, canvas.height);
    }

    // Draw hot cue markers
    hotCues.forEach((cueTime, index) => {
      if (cueTime > 0) {
        const cueX = (cueTime / duration) * canvas.width;
        ctx.fillStyle = `hsl(${index * 60}, 70%, 50%)`;
        ctx.fillRect(cueX - 1, 0, 2, canvas.height);
      }
    });
  }, [currentTime, duration, isLooping, loopStart, loopEnd, hotCues]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="deck-b bg-gray-900 border border-orange-600 rounded-lg p-4 w-96 h-auto">
      {/* Deck Header */}
      <div className="deck-header mb-4">
        <div className="flex justify-between items-center">
          <h2 className="text-orange-400 text-lg font-bold">DECK B</h2>
          <div className="text-orange-400 text-sm font-mono">
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
          className="w-full bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded text-sm"
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
          className="w-full bg-black border border-orange-600 rounded"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Transport Controls */}
      <div className="transport-controls mb-4">
        <div className="flex justify-center space-x-2">
          <button
            onClick={handleSync}
            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded font-bold text-xs"
          >
            SYNC
          </button>
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

      {/* Pitch Control with Fine Tuning */}
      <div className="pitch-control mb-4">
        <label className="block text-white text-sm font-semibold mb-2">
          PITCH: {pitch > 0 ? '+' : ''}{pitch.toFixed(1)}%
        </label>
        <div className="flex items-center space-x-2 mb-2">
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
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => handleFinePitch('down')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"
          >
            -
          </button>
          <button
            onClick={() => handlePitchChange(0)}
            className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-xs"
          >
            RESET
          </button>
          <button
            onClick={() => handleFinePitch('up')}
            className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs"
          >
            +
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

      {/* Enhanced Loop Controls */}
      <div className="loop-controls mb-4">
        <div className="flex justify-between items-center mb-2">
          <label className="text-white text-sm font-semibold">LOOP</label>
          <span className={`text-xs px-2 py-1 rounded ${
            isLooping ? 'bg-orange-600 text-white' : 'bg-gray-600 text-gray-300'
          }`}>
            {isLooping ? 'ON' : 'OFF'}
          </span>
        </div>
        <div className="flex space-x-1 mb-2">
          <button
            onClick={handleSetLoopIn}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs flex-1"
          >
            IN
          </button>
          <button
            onClick={handleSetLoopOut}
            className="bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs flex-1"
          >
            OUT
          </button>
          <button
            onClick={handleToggleLoop}
            className={`px-2 py-1 rounded text-xs flex-1 text-white ${
              isLooping
                ? 'bg-orange-600 hover:bg-orange-700'
                : 'bg-gray-600 hover:bg-gray-700'
            }`}
          >
            LOOP
          </button>
        </div>
        <div className="flex space-x-1">
          <button
            onClick={() => handleAutoLoop(1)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs flex-1"
          >
            1 BAR
          </button>
          <button
            onClick={() => handleAutoLoop(2)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs flex-1"
          >
            2 BAR
          </button>
          <button
            onClick={() => handleAutoLoop(4)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs flex-1"
          >
            4 BAR
          </button>
        </div>
        {loopStart < loopEnd && (
          <div className="text-xs text-gray-400 mt-1 text-center">
            {formatTime(loopStart)} - {formatTime(loopEnd)}
          </div>
        )}
      </div>

      {/* Hot Cue Pads */}
      <div className="hot-cues mb-4">
        <label className="block text-white text-sm font-semibold mb-2">HOT CUES</label>
        <div className="grid grid-cols-2 gap-2">
          {hotCues.map((cueTime, index) => (
            <div key={index} className="flex space-x-1">
              <button
                onClick={() => handleJumpToHotCue(index)}
                className={`flex-1 px-2 py-2 rounded text-xs font-bold ${
                  cueTime > 0
                    ? `bg-${['red', 'blue', 'green', 'yellow'][index]}-600 hover:bg-${['red', 'blue', 'green', 'yellow'][index]}-700 text-white`
                    : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                }`}
                style={{
                  backgroundColor: cueTime > 0 ? ['#dc2626', '#2563eb', '#16a34a', '#ca8a04'][index] : undefined
                }}
              >
                {index + 1}
              </button>
              <button
                onClick={() => handleSetHotCue(index)}
                className="bg-gray-700 hover:bg-gray-600 text-white px-2 py-2 rounded text-xs"
              >
                SET
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Cue Point Controls */}
      <div className="cue-controls">
        <div className="flex justify-between items-center mb-2">
          <label className="text-white text-sm font-semibold">MAIN CUE</label>
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
          background: #ff6b00;
          cursor: pointer;
          border: 2px solid #4a5568;
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ff6b00;
          cursor: pointer;
          border: 2px solid #4a5568;
        }
      `}</style>
    </div>
  );
};

export default DeckB;