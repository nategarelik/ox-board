"use client";

import { useRef, useEffect, useState } from "react";
import { ZoomIn, ZoomOut, Lock, Unlock } from "lucide-react";

interface WaveformDisplayProps {
  deck1: any;
  deck2: any;
  crossfaderPosition: number;
}

export default function WaveformDisplay({
  deck1,
  deck2,
  crossfaderPosition,
}: WaveformDisplayProps) {
  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const [zoom, setZoom] = useState(4); // 1 to 8 (1 = 1 bar, 8 = 64 bars)
  const [syncLock, setSyncLock] = useState(false);
  const animationRef = useRef<number>();

  // Generate fake waveform data for demonstration
  const generateWaveform = (length = 1000) => {
    return Array.from({ length }, () => ({
      low: Math.random() * 0.8 + 0.2,
      mid: Math.random() * 0.6 + 0.2,
      high: Math.random() * 0.4 + 0.1,
    }));
  };

  const [waveform1] = useState(generateWaveform());
  const [waveform2] = useState(generateWaveform());

  useEffect(() => {
    const drawWaveform = (
      canvas: HTMLCanvasElement,
      waveformData: any[],
      isPlaying: boolean,
      position: number,
      color: "cyan" | "magenta",
    ) => {
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, width, height);

      // Draw grid lines (beat markers)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = 1;
      const beatWidth = width / (zoom * 4); // 4 beats per bar
      for (let i = 0; i <= zoom * 4; i++) {
        const x = i * beatWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Draw waveform
      const samplesPerPixel = Math.floor(waveformData.length / width);
      const centerY = height / 2;

      for (let x = 0; x < width; x++) {
        const sampleIndex = Math.floor(x * samplesPerPixel);
        const sample = waveformData[sampleIndex];

        // Draw low frequencies (red)
        ctx.fillStyle = "rgba(255, 0, 0, 0.8)";
        const lowHeight = sample.low * height * 0.4;
        ctx.fillRect(x, centerY - lowHeight / 2, 1, lowHeight);

        // Draw mid frequencies (green)
        ctx.fillStyle = "rgba(0, 255, 0, 0.8)";
        const midHeight = sample.mid * height * 0.3;
        ctx.fillRect(x, centerY - midHeight / 2, 1, midHeight);

        // Draw high frequencies (blue)
        ctx.fillStyle = "rgba(0, 100, 255, 0.8)";
        const highHeight = sample.high * height * 0.2;
        ctx.fillRect(x, centerY - highHeight / 2, 1, highHeight);
      }

      // Draw playhead
      const playheadX = isPlaying ? position % width : width / 2;
      ctx.strokeStyle = color === "cyan" ? "#00ffff" : "#ff00ff";
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = color === "cyan" ? "#00ffff" : "#ff00ff";
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, height);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw center line
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 0);
      ctx.lineTo(width / 2, height);
      ctx.stroke();
      ctx.setLineDash([]);
    };

    const animate = (timestamp: number) => {
      if (canvas1Ref.current && canvas2Ref.current) {
        const position1 = deck1?.isPlaying
          ? (timestamp / 20) % canvas1Ref.current.width
          : 0;
        const position2 = deck2?.isPlaying
          ? (timestamp / 20) % canvas2Ref.current.width
          : 0;

        drawWaveform(
          canvas1Ref.current,
          waveform1,
          deck1?.isPlaying,
          position1,
          "cyan",
        );
        drawWaveform(
          canvas2Ref.current,
          waveform2,
          deck2?.isPlaying,
          position2,
          "magenta",
        );
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    // Set canvas dimensions
    const setupCanvas = () => {
      if (canvas1Ref.current && canvas2Ref.current) {
        const rect = canvas1Ref.current.parentElement?.getBoundingClientRect();
        if (rect) {
          canvas1Ref.current.width = rect.width;
          canvas1Ref.current.height = rect.height / 2 - 4;
          canvas2Ref.current.width = rect.width;
          canvas2Ref.current.height = rect.height / 2 - 4;
        }
      }
    };

    setupCanvas();
    window.addEventListener("resize", setupCanvas);
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", setupCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [deck1, deck2, waveform1, waveform2, zoom]);

  return (
    <div className="h-full flex flex-col p-2">
      {/* Controls */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(1, zoom - 1))}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            disabled={zoom <= 1}
          >
            <ZoomOut className="w-4 h-4 text-gray-400" />
          </button>
          <span className="text-xs text-gray-400 font-mono">
            {Math.pow(2, zoom - 1)} bars
          </span>
          <button
            onClick={() => setZoom(Math.min(8, zoom + 1))}
            className="p-1 rounded hover:bg-white/10 transition-colors"
            disabled={zoom >= 8}
          >
            <ZoomIn className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <button
          onClick={() => setSyncLock(!syncLock)}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            syncLock
              ? "bg-purple-600/30 text-purple-400"
              : "bg-gray-700/30 text-gray-400 hover:bg-gray-700/50"
          }`}
        >
          {syncLock ? (
            <Lock className="w-3 h-3" />
          ) : (
            <Unlock className="w-3 h-3" />
          )}
          <span className="text-xs">Sync</span>
        </button>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-cyan-400 rounded-full" />
            <span className="text-xs text-gray-400">Deck A</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-magenta-400 rounded-full" />
            <span className="text-xs text-gray-400">Deck B</span>
          </div>
        </div>
      </div>

      {/* Waveforms */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Deck 1 Waveform */}
        <div className="flex-1 relative bg-black/40 rounded border border-cyan-500/20">
          <canvas ref={canvas1Ref} className="w-full h-full" />
          {deck1?.track && (
            <div className="absolute top-1 left-2 text-xs text-cyan-400">
              {deck1.track.title || "Track A"}
            </div>
          )}
          <div className="absolute top-1 right-2 text-xs text-cyan-400 font-mono">
            {deck1?.bpm || "---"} BPM
          </div>
        </div>

        {/* Deck 2 Waveform */}
        <div className="flex-1 relative bg-black/40 rounded border border-magenta-500/20">
          <canvas ref={canvas2Ref} className="w-full h-full" />
          {deck2?.track && (
            <div className="absolute top-1 left-2 text-xs text-magenta-400">
              {deck2.track.title || "Track B"}
            </div>
          )}
          <div className="absolute top-1 right-2 text-xs text-magenta-400 font-mono">
            {deck2?.bpm || "---"} BPM
          </div>
        </div>
      </div>

      {/* Phase Meter */}
      <div className="mt-2 h-2 bg-gray-800 rounded-full relative">
        <div
          className="absolute top-0 h-full w-1 bg-white rounded-full transition-all"
          style={{ left: `${50 + (syncLock ? 0 : Math.random() * 10 - 5)}%` }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-purple-400" />
      </div>
    </div>
  );
}
