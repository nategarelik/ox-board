'use client';

import React, { memo, useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { StemType } from '../lib/audio/demucsProcessor';
import useEnhancedDJStore from '../stores/enhancedDjStoreWithGestures';

interface StemWaveformProps {
  channel: number;
  stemType: StemType | 'original';
  width?: number;
  height?: number;
  className?: string;
  showZoomControls?: boolean;
  showScrollbar?: boolean;
  onTimeSeek?: (time: number) => void;
}

interface WaveformData {
  peaks: Float32Array;
  duration: number;
  sampleRate: number;
}

interface ViewportState {
  startTime: number;
  endTime: number;
  zoom: number; // 1 = full view, >1 = zoomed in
  pixelsPerSecond: number;
}

const stemColors = {
  drums: '#ef4444', // red-500
  bass: '#3b82f6', // blue-500
  melody: '#10b981', // emerald-500
  vocals: '#eab308', // yellow-500
  original: '#6b7280' // gray-500
};

// High-performance waveform rendering with Canvas
const useWaveformRenderer = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  waveformData: WaveformData | null,
  viewport: ViewportState,
  currentTime: number,
  color: string,
  isPlaying: boolean
) => {
  const animationRef = useRef<number>();
  const lastRenderTime = useRef<number>(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const { peaks, duration } = waveformData;
    const { startTime, endTime, pixelsPerSecond } = viewport;

    // Clear canvas
    ctx.fillStyle = '#1f2937'; // gray-800
    ctx.fillRect(0, 0, width, height);

    // Calculate visible range
    const visibleDuration = endTime - startTime;
    const samplesPerPixel = peaks.length / (duration * pixelsPerSecond);
    const startSample = Math.floor(startTime * peaks.length / duration);
    const endSample = Math.floor(endTime * peaks.length / duration);

    // Draw waveform
    ctx.fillStyle = color + '80'; // 50% opacity
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    const centerY = height / 2;
    const maxAmplitude = height * 0.4; // 80% of half height

    // Optimized rendering - skip pixels for performance
    const step = Math.max(1, Math.floor(samplesPerPixel));

    ctx.beginPath();
    let firstPoint = true;

    for (let x = 0; x < width; x += 2) { // Skip every other pixel for performance
      const timePosition = startTime + (x / width) * visibleDuration;
      const sampleIndex = Math.floor(timePosition * peaks.length / duration);

      if (sampleIndex >= 0 && sampleIndex < peaks.length) {
        // Get average of nearby samples for smoother rendering
        let sum = 0;
        let count = 0;
        const radius = Math.ceil(step / 2);

        for (let i = -radius; i <= radius; i++) {
          const idx = sampleIndex + i;
          if (idx >= 0 && idx < peaks.length) {
            sum += Math.abs(peaks[idx]);
            count++;
          }
        }

        const amplitude = count > 0 ? sum / count : 0;
        const y = centerY - (amplitude * maxAmplitude);
        const yBottom = centerY + (amplitude * maxAmplitude);

        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }

        // Draw filled waveform
        ctx.fillRect(x, y, 2, yBottom - y);
      }
    }

    ctx.stroke();

    // Draw playhead
    if (currentTime >= startTime && currentTime <= endTime) {
      const playheadX = ((currentTime - startTime) / visibleDuration) * width;

      // Playhead line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      // Playhead indicator
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(playheadX, 10, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw time markers
    drawTimeMarkers(ctx, width, height, startTime, endTime);

    // Draw grid if zoomed in
    if (viewport.zoom > 4) {
      drawGrid(ctx, width, height, startTime, endTime);
    }

  }, [canvasRef, waveformData, viewport, currentTime, color]);

  const drawTimeMarkers = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    startTime: number,
    endTime: number
  ) => {
    const duration = endTime - startTime;
    const markerInterval = getOptimalMarkerInterval(duration);

    ctx.strokeStyle = '#374151'; // gray-700
    ctx.lineWidth = 1;
    ctx.fillStyle = '#9ca3af'; // gray-400
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';

    const firstMarker = Math.ceil(startTime / markerInterval) * markerInterval;

    for (let time = firstMarker; time <= endTime; time += markerInterval) {
      const x = ((time - startTime) / duration) * width;

      // Marker line
      ctx.beginPath();
      ctx.moveTo(x, height - 20);
      ctx.lineTo(x, height);
      ctx.stroke();

      // Time label
      const minutes = Math.floor(time / 60);
      const seconds = Math.floor(time % 60);
      const timeLabel = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      ctx.fillText(timeLabel, x, height - 5);
    }
  }, []);

  const drawGrid = useCallback((
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    startTime: number,
    endTime: number
  ) => {
    const duration = endTime - startTime;
    const gridInterval = duration / 20; // 20 grid lines

    ctx.strokeStyle = '#374151'; // gray-700
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);

    for (let i = 1; i < 20; i++) {
      const x = (i / 20) * width;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }, []);

  const getOptimalMarkerInterval = useCallback((duration: number): number => {
    if (duration <= 10) return 1;
    if (duration <= 30) return 5;
    if (duration <= 60) return 10;
    if (duration <= 300) return 30;
    return 60;
  }, []);

  useEffect(() => {
    const animate = (time: number) => {
      // Limit to 60fps
      if (time - lastRenderTime.current >= 16.67) {
        render();
        lastRenderTime.current = time;
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    // Render immediately for static updates
    render();

    // Start animation loop if playing
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [render, isPlaying]);

  return render;
};

// Generate mock waveform data for demonstration
const generateMockWaveformData = (duration: number, stemType: StemType | 'original'): WaveformData => {
  const sampleRate = 44100;
  const samples = Math.floor(duration * 100); // 100 samples per second for visualization
  const peaks = new Float32Array(samples);

  // Generate characteristic waveforms for each stem type
  for (let i = 0; i < samples; i++) {
    const time = (i / samples) * duration;
    let amplitude = 0;

    switch (stemType) {
      case 'drums':
        // Drum pattern: sharp transients with decay
        amplitude = Math.random() * 0.8;
        if (Math.floor(time * 2) % 2 === 0) { // Kick pattern
          amplitude *= 1.5;
        }
        amplitude *= Math.exp(-(time % 1) * 3); // Decay
        break;

      case 'bass':
        // Bass: lower frequency, smoother
        amplitude = (Math.sin(time * Math.PI * 0.5) + 1) * 0.4;
        amplitude += Math.sin(time * Math.PI * 4) * 0.2;
        break;

      case 'melody':
        // Melody: varied frequency content
        amplitude = Math.sin(time * Math.PI * 2) * 0.6;
        amplitude += Math.sin(time * Math.PI * 6) * 0.3;
        amplitude *= (Math.sin(time * Math.PI * 0.25) + 1) * 0.5;
        break;

      case 'vocals':
        // Vocals: formant-like patterns
        amplitude = Math.sin(time * Math.PI * 3) * 0.7;
        amplitude += Math.sin(time * Math.PI * 12) * 0.2;
        amplitude *= Math.abs(Math.sin(time * Math.PI * 0.5));
        break;

      case 'original':
        // Original: combination of all
        amplitude = Math.sin(time * Math.PI * 2) * 0.5;
        amplitude += Math.random() * 0.3;
        break;
    }

    peaks[i] = Math.max(-1, Math.min(1, amplitude + (Math.random() - 0.5) * 0.1));
  }

  return { peaks, duration, sampleRate };
};

// Zoom controls component
const ZoomControls = memo<{
  zoom: number;
  onZoomChange: (zoom: number) => void;
  onZoomToFit: () => void;
  onZoomToSelection: () => void;
}>(({ zoom, onZoomChange, onZoomToFit, onZoomToSelection }) => {
  const handleZoomIn = useCallback(() => {
    onZoomChange(Math.min(zoom * 1.5, 100));
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    onZoomChange(Math.max(zoom / 1.5, 1));
  }, [zoom, onZoomChange]);

  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
      <button
        onClick={handleZoomOut}
        disabled={zoom <= 1}
        className="px-2 py-1 text-xs bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-600"
      >
        −
      </button>

      <span className="text-xs text-gray-300 font-mono min-w-12 text-center">
        {zoom.toFixed(1)}x
      </span>

      <button
        onClick={handleZoomIn}
        disabled={zoom >= 100}
        className="px-2 py-1 text-xs bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-600"
      >
        +
      </button>

      <div className="w-px h-4 bg-gray-600 mx-1" />

      <button
        onClick={onZoomToFit}
        className="px-2 py-1 text-xs bg-gray-700 text-white rounded hover:bg-gray-600"
      >
        Fit
      </button>
    </div>
  );
});

ZoomControls.displayName = 'ZoomControls';

// Main StemWaveform component
const StemWaveformComponent: React.FC<StemWaveformProps> = ({
  channel,
  stemType,
  width = 800,
  height = 120,
  className = '',
  showZoomControls = true,
  showScrollbar = true,
  onTimeSeek
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { decks, seekStemPlayer } = useEnhancedDJStore();
  const deck = decks[channel];

  // Generate mock waveform data
  const waveformData = useMemo(() => {
    if (!deck.track) return null;
    return generateMockWaveformData(deck.track.duration, stemType);
  }, [deck.track, stemType]);

  const [viewport, setViewport] = useState<ViewportState>({
    startTime: 0,
    endTime: deck.track?.duration || 180,
    zoom: 1,
    pixelsPerSecond: width / (deck.track?.duration || 180)
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, time: 0 });

  const color = stemColors[stemType];
  const currentTime = deck.currentTime;
  const isPlaying = deck.isPlaying;

  // Update viewport when track changes
  useEffect(() => {
    if (deck.track) {
      setViewport(prev => ({
        ...prev,
        endTime: deck.track!.duration,
        pixelsPerSecond: width / deck.track!.duration
      }));
    }
  }, [deck.track, width]);

  // Handle canvas mouse interactions
  const handleMouseDown = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const clickTime = viewport.startTime + (x / width) * (viewport.endTime - viewport.startTime);

    if (event.shiftKey) {
      // Start drag selection
      setIsDragging(true);
      setDragStart({ x, time: clickTime });
    } else {
      // Seek to time
      seekStemPlayer(channel, clickTime);
      onTimeSeek?.(clickTime);
    }
  }, [viewport, width, waveformData, channel, seekStemPlayer, onTimeSeek]);

  const handleMouseMove = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;

    // Update drag selection (visual feedback would go here)
    // This is a placeholder for selection visualization
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Zoom controls handlers
  const handleZoomChange = useCallback((newZoom: number) => {
    if (!waveformData) return;

    const duration = waveformData.duration;
    const visibleDuration = duration / newZoom;
    const centerTime = (viewport.startTime + viewport.endTime) / 2;

    const newStartTime = Math.max(0, centerTime - visibleDuration / 2);
    const newEndTime = Math.min(duration, newStartTime + visibleDuration);

    setViewport({
      startTime: newStartTime,
      endTime: newEndTime,
      zoom: newZoom,
      pixelsPerSecond: width / visibleDuration
    });
  }, [viewport, width, waveformData]);

  const handleZoomToFit = useCallback(() => {
    if (!waveformData) return;

    setViewport({
      startTime: 0,
      endTime: waveformData.duration,
      zoom: 1,
      pixelsPerSecond: width / waveformData.duration
    });
  }, [width, waveformData]);

  const handleZoomToSelection = useCallback(() => {
    // Placeholder for zoom to selection functionality
    console.log('Zoom to selection');
  }, []);

  // Scroll handling
  const handleWheel = useCallback((event: React.WheelEvent<HTMLCanvasElement>) => {
    event.preventDefault();

    if (event.ctrlKey || event.metaKey) {
      // Zoom
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      handleZoomChange(viewport.zoom * zoomFactor);
    } else {
      // Scroll
      if (!waveformData) return;

      const scrollSensitivity = 0.1;
      const deltaTime = event.deltaX * scrollSensitivity;
      const duration = viewport.endTime - viewport.startTime;

      const newStartTime = Math.max(0, viewport.startTime + deltaTime);
      const newEndTime = Math.min(waveformData.duration, newStartTime + duration);

      if (newEndTime - newStartTime === duration) {
        setViewport(prev => ({
          ...prev,
          startTime: newStartTime,
          endTime: newEndTime
        }));
      }
    }
  }, [viewport, handleZoomChange, waveformData]);

  // High-performance rendering hook
  useWaveformRenderer(canvasRef, waveformData, viewport, currentTime, color, isPlaying);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (event.key) {
        case '=':
        case '+':
          event.preventDefault();
          handleZoomChange(viewport.zoom * 1.5);
          break;
        case '-':
          event.preventDefault();
          handleZoomChange(viewport.zoom / 1.5);
          break;
        case '0':
          event.preventDefault();
          handleZoomToFit();
          break;
        case 'Home':
          event.preventDefault();
          seekStemPlayer(channel, 0);
          break;
        case 'End':
          event.preventDefault();
          if (deck.track) {
            seekStemPlayer(channel, deck.track.duration);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [viewport, handleZoomChange, handleZoomToFit, channel, seekStemPlayer, deck.track]);

  if (!deck.track || !waveformData) {
    return (
      <div
        className={`bg-gray-800 rounded-lg flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-gray-500 text-sm">
          No track loaded for {stemType}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`bg-gray-900 rounded-lg border border-gray-700 overflow-hidden ${className}`}
      tabIndex={0}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium text-gray-300 capitalize">
            {stemType}
          </span>
        </div>

        {showZoomControls && (
          <ZoomControls
            zoom={viewport.zoom}
            onZoomChange={handleZoomChange}
            onZoomToFit={handleZoomToFit}
            onZoomToSelection={handleZoomToSelection}
          />
        )}
      </div>

      {/* Waveform Canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="block cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Scrollbar */}
      {showScrollbar && viewport.zoom > 1 && (
        <div className="h-2 bg-gray-800 border-t border-gray-700">
          <div
            className="h-full bg-gray-600 rounded cursor-pointer"
            style={{
              width: `${(1 / viewport.zoom) * 100}%`,
              marginLeft: `${(viewport.startTime / waveformData.duration) * 100}%`
            }}
          />
        </div>
      )}
    </div>
  );
};

export default memo(StemWaveformComponent);
export { StemWaveformComponent as StemWaveform };