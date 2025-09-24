"use client";

import React, {
  memo,
  useRef,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { StemType } from "../lib/audio/demucsProcessor";
import useEnhancedDJStore from "../stores/enhancedDjStoreWithGestures";

interface StemWaveformProps {
  channel: number;
  stemType: StemType | "original";
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
  drums: "#ef4444", // red-500
  bass: "#3b82f6", // blue-500
  melody: "#10b981", // emerald-500
  vocals: "#eab308", // yellow-500
  original: "#6b7280", // gray-500
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 10;

const formatZoom = (value: number): string => {
  const floored = Math.floor(value * 10) / 10;
  return floored.toFixed(1);
};

// High-performance waveform rendering with Canvas
const useWaveformRenderer = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  waveformData: WaveformData | null,
  viewport: ViewportState,
  currentTime: number,
  color: string,
  isPlaying: boolean,
) => {
  const animationRef = useRef<number | null>(null);
  const lastRenderTime = useRef<number>(0);

  const getOptimalMarkerInterval = useCallback((duration: number): number => {
    if (duration <= 10) return 1;
    if (duration <= 30) return 5;
    if (duration <= 60) return 10;
    if (duration <= 300) return 30;
    return 60;
  }, []);

  const drawTimeMarkers = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      startTime: number,
      endTime: number,
    ) => {
      const duration = endTime - startTime;
      const markerInterval = getOptimalMarkerInterval(duration);

      ctx.strokeStyle = "#374151"; // gray-700
      ctx.lineWidth = 1;
      ctx.fillStyle = "#9ca3af"; // gray-400
      ctx.font = "10px monospace";
      ctx.textAlign = "center";

      const firstMarker =
        Math.ceil(startTime / markerInterval) * markerInterval;

      for (let time = firstMarker; time <= endTime; time += markerInterval) {
        const x = ((time - startTime) / duration) * width;

        ctx.beginPath();
        ctx.moveTo(x, height - 20);
        ctx.lineTo(x, height);
        ctx.stroke();

        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        const timeLabel = `${minutes}:${seconds.toString().padStart(2, "0")}`;
        ctx.fillText(timeLabel, x, height - 5);
      }
    },
    [getOptimalMarkerInterval],
  );

  const drawGrid = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      width: number,
      height: number,
      startTime: number,
      endTime: number,
    ) => {
      const duration = endTime - startTime;
      const gridInterval = duration / 20; // 20 grid lines

      ctx.strokeStyle = "#374151"; // gray-700
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
    },
    [],
  );

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !waveformData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;
    const { peaks, duration } = waveformData;
    const { startTime, endTime, pixelsPerSecond } = viewport;

    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, width, height);

    const visibleDuration = endTime - startTime;
    const samplesPerPixel = peaks.length / (duration * pixelsPerSecond || 1);

    ctx.fillStyle = color + "80";
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;

    const centerY = height / 2;
    const maxAmplitude = height * 0.4;
    const step = Math.max(1, Math.floor(samplesPerPixel));

    ctx.beginPath();
    let firstPoint = true;

    for (let x = 0; x < width; x += 2) {
      const timePosition = startTime + (x / width) * visibleDuration;
      const sampleIndex = Math.floor((timePosition * peaks.length) / duration);

      if (sampleIndex >= 0 && sampleIndex < peaks.length) {
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
        const y = centerY - amplitude * maxAmplitude;
        const yBottom = centerY + amplitude * maxAmplitude;

        if (firstPoint) {
          ctx.moveTo(x, y);
          firstPoint = false;
        } else {
          ctx.lineTo(x, y);
        }

        ctx.fillRect(x, y, 2, yBottom - y);
      }
    }

    ctx.stroke();

    if (currentTime >= startTime && currentTime <= endTime) {
      const playheadX = ((currentTime - startTime) / visibleDuration) * width;

      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(playheadX, 10, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    drawTimeMarkers(ctx, width, height, startTime, endTime);

    if (viewport.zoom > 4) {
      drawGrid(ctx, width, height, startTime, endTime);
    }
  }, [
    canvasRef,
    waveformData,
    viewport,
    currentTime,
    color,
    drawGrid,
    drawTimeMarkers,
  ]);

  useEffect(() => {
    const animate = (time: number) => {
      if (time - lastRenderTime.current >= 16.67) {
        render();
        lastRenderTime.current = time;
      }

      if (isPlaying) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    render();

    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      cancelAnimationFrame(animationRef.current ?? 0);
      animationRef.current = null;
    };
  }, [isPlaying, render]);
};

// Generate mock waveform data for demonstration
const generateMockWaveformData = (
  duration: number,
  stemType: StemType | "original",
): WaveformData => {
  const sampleRate = 44100;
  const samples = Math.floor(duration * 100); // 100 samples per second for visualization
  const peaks = new Float32Array(samples);

  // Generate characteristic waveforms for each stem type
  for (let i = 0; i < samples; i++) {
    const time = (i / samples) * duration;
    let amplitude = 0;

    switch (stemType) {
      case "drums":
        // Drum pattern: sharp transients with decay
        amplitude = Math.random() * 0.8;
        if (Math.floor(time * 2) % 2 === 0) {
          // Kick pattern
          amplitude *= 1.5;
        }
        amplitude *= Math.exp(-(time % 1) * 3); // Decay
        break;

      case "bass":
        // Bass: lower frequency, smoother
        amplitude = (Math.sin(time * Math.PI * 0.5) + 1) * 0.4;
        amplitude += Math.sin(time * Math.PI * 4) * 0.2;
        break;

      case "melody":
        // Melody: varied frequency content
        amplitude = Math.sin(time * Math.PI * 2) * 0.6;
        amplitude += Math.sin(time * Math.PI * 6) * 0.3;
        amplitude *= (Math.sin(time * Math.PI * 0.25) + 1) * 0.5;
        break;

      case "vocals":
        // Vocals: formant-like patterns
        amplitude = Math.sin(time * Math.PI * 3) * 0.7;
        amplitude += Math.sin(time * Math.PI * 12) * 0.2;
        amplitude *= Math.abs(Math.sin(time * Math.PI * 0.5));
        break;

      case "original":
        // Original: combination of all
        amplitude = Math.sin(time * Math.PI * 2) * 0.5;
        amplitude += Math.random() * 0.3;
        break;
    }

    peaks[i] = Math.max(
      -1,
      Math.min(1, amplitude + (Math.random() - 0.5) * 0.1),
    );
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
    onZoomChange(Math.min(zoom * 1.5, MAX_ZOOM));
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    onZoomChange(Math.max(zoom / 1.5, MIN_ZOOM));
  }, [zoom, onZoomChange]);

  return (
    <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-2">
      <button
        onClick={handleZoomOut}
        disabled={zoom <= MIN_ZOOM}
        className="px-2 py-1 text-xs bg-gray-700 text-white rounded disabled:opacity-50 hover:bg-gray-600"
      >
        −
      </button>

      <span className="text-xs text-gray-300 font-mono min-w-12 text-center">
        {formatZoom(zoom)}x
      </span>

      <button
        onClick={handleZoomIn}
        disabled={zoom >= MAX_ZOOM}
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

ZoomControls.displayName = "ZoomControls";

const StemWaveformComponent: React.FC<StemWaveformProps> = ({
  channel,
  stemType,
  width = 800,
  height = 120,
  className = "",
  showZoomControls = true,
  showScrollbar = true,
  onTimeSeek,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { decks, seekStemPlayer } = useEnhancedDJStore();
  const deck = decks[channel];

  const waveformData = useMemo(() => {
    if (!deck.track) return null;
    return generateMockWaveformData(deck.track.duration, stemType);
  }, [deck.track, stemType]);

  const [viewport, setViewport] = useState<ViewportState>({
    startTime: 0,
    endTime: deck.track?.duration || 180,
    zoom: 1,
    pixelsPerSecond: width / (deck.track?.duration || 180),
  });

  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, time: 0 });

  useEffect(() => {
    if (!containerRef.current || typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(() => {
      // Placeholder: viewport adjustments could go here when container resizes
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const color = stemColors[stemType];
  const currentTime = deck.currentTime;
  const isPlaying = deck.isPlaying;

  useEffect(() => {
    if (deck.track) {
      setViewport((prev) => ({
        ...prev,
        endTime: deck.track!.duration,
        pixelsPerSecond: width / deck.track!.duration,
      }));
    }
  }, [deck.track, width]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !waveformData) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const clickTime =
        viewport.startTime +
        (x / width) * (viewport.endTime - viewport.startTime);

      if (event.shiftKey) {
        setIsDragging(true);
        setDragStart({ x, time: clickTime });
      } else {
        seekStemPlayer(channel, clickTime);
        onTimeSeek?.(clickTime);
      }
    },
    [viewport, width, waveformData, channel, seekStemPlayer, onTimeSeek],
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const x = event.clientX - rect.left;

      // Placeholder: selection visualization would be implemented here
    },
    [isDragging],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleZoomChange = useCallback(
    (newZoom: number) => {
      if (!waveformData) return;

      const clampedZoom = Math.min(Math.max(newZoom, MIN_ZOOM), MAX_ZOOM);
      const duration = waveformData.duration;
      const visibleDuration = duration / clampedZoom;
      const centerTime = (viewport.startTime + viewport.endTime) / 2;

      const newStartTime = Math.max(0, centerTime - visibleDuration / 2);
      const newEndTime = Math.min(duration, newStartTime + visibleDuration);

      setViewport({
        startTime: newStartTime,
        endTime: newEndTime,
        zoom: clampedZoom,
        pixelsPerSecond: width / visibleDuration,
      });
    },
    [viewport, width, waveformData],
  );

  const handleZoomToFit = useCallback(() => {
    if (!waveformData) return;

    setViewport({
      startTime: 0,
      endTime: waveformData.duration,
      zoom: MIN_ZOOM,
      pixelsPerSecond: width / waveformData.duration,
    });
  }, [width, waveformData]);

  const handleZoomToSelection = useCallback(() => {
    // Placeholder for zoom-to-selection functionality
    console.log("Zoom to selection");
  }, []);

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLCanvasElement>) => {
      event.preventDefault();

      if (event.ctrlKey || event.metaKey) {
        const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
        handleZoomChange(viewport.zoom * zoomFactor);
      } else {
        if (!waveformData) return;

        const scrollSensitivity = 0.1;
        const deltaTime = event.deltaX * scrollSensitivity;
        const duration = viewport.endTime - viewport.startTime;

        const newStartTime = Math.max(0, viewport.startTime + deltaTime);
        const newEndTime = Math.min(
          waveformData.duration,
          newStartTime + duration,
        );

        if (newEndTime - newStartTime === duration) {
          setViewport((prev) => ({
            ...prev,
            startTime: newStartTime,
            endTime: newEndTime,
          }));
        }
      }
    },
    [viewport, handleZoomChange, waveformData],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (event.key) {
        case "=":
        case "+":
          event.preventDefault();
          handleZoomChange(viewport.zoom * 1.5);
          break;
        case "-":
          event.preventDefault();
          handleZoomChange(viewport.zoom / 1.5);
          break;
        case "0":
          event.preventDefault();
          handleZoomToFit();
          break;
        case "Home":
          event.preventDefault();
          seekStemPlayer(channel, 0);
          break;
        case "End":
          event.preventDefault();
          if (deck.track) {
            seekStemPlayer(channel, deck.track.duration);
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    viewport,
    handleZoomChange,
    handleZoomToFit,
    channel,
    seekStemPlayer,
    deck.track,
  ]);

  useWaveformRenderer(
    canvasRef,
    waveformData,
    viewport,
    currentTime,
    color,
    isPlaying,
  );

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
      role="region"
      aria-label={`${stemType} waveform container`}
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
        role="img"
        aria-label={`${stemType} waveform`}
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
              marginLeft: `${(viewport.startTime / waveformData.duration) * 100}%`,
            }}
          />
        </div>
      )}
    </div>
  );
};

const StemWaveform = memo(StemWaveformComponent);
StemWaveform.displayName = "StemWaveform";

export default StemWaveform;
export { StemWaveformComponent };
