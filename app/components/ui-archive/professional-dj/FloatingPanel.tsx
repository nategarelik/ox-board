"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { X, Minus, Maximize2, Move } from "lucide-react";

interface FloatingPanelProps {
  title: string;
  children: ReactNode;
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
  onClose: () => void;
  width?: number;
  height?: number;
  resizable?: boolean;
  minimizable?: boolean;
}

export default function FloatingPanel({
  title,
  children,
  position,
  onPositionChange,
  onClose,
  width = 320,
  height = 400,
  resizable = false,
  minimizable = true,
}: FloatingPanelProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Keep panel within viewport
      const maxX = window.innerWidth - (width || 320);
      const maxY = window.innerHeight - (isMinimized ? 40 : height || 400);

      onPositionChange({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY)),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart, onPositionChange, width, height, isMinimized]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const rect = panelRef.current?.getBoundingClientRect();
    if (rect) {
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  return (
    <div
      ref={panelRef}
      className="fixed glass-dark rounded-lg shadow-2xl border border-purple-500/20 overflow-hidden transition-all"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${width}px`,
        height: isMinimized ? "40px" : `${height}px`,
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 py-2 bg-black/50 border-b border-purple-500/20 cursor-move select-none"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Move className="w-3 h-3 text-gray-500" />
          <span className="text-sm font-medium text-gray-300">{title}</span>
        </div>
        <div className="flex items-center gap-1">
          {minimizable && (
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 rounded hover:bg-white/10 transition-colors"
            >
              {isMinimized ? (
                <Maximize2 className="w-3 h-3 text-gray-400" />
              ) : (
                <Minus className="w-3 h-3 text-gray-400" />
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 transition-colors"
          >
            <X className="w-3 h-3 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div
          className="p-3 overflow-auto"
          style={{ height: `calc(100% - 40px)` }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
