'use client';

import React, { memo, useCallback, useRef, useEffect, useState } from 'react';
import { StemControls as StemControlsType } from '../lib/audio/stemPlayer';
import { StemType } from '../lib/audio/demucsProcessor';
import useEnhancedDJStore from '../stores/enhancedDjStoreWithGestures';

interface StemControlsProps {
  channel: number;
  stemType: StemType | 'original';
  onVolumeChange?: (stemType: StemType | 'original', volume: number) => void;
  onMuteToggle?: (stemType: StemType | 'original', muted: boolean) => void;
  onSoloToggle?: (stemType: StemType | 'original', soloed: boolean) => void;
  onPanChange?: (stemType: StemType | 'original', pan: number) => void;
  onEQChange?: (stemType: StemType | 'original', band: 'low' | 'mid' | 'high', value: number) => void;
}

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  color: string;
}

interface EQKnobProps {
  band: 'low' | 'mid' | 'high';
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  color: string;
}

interface PanKnobProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  color: string;
}

interface LevelMeterProps {
  level: number;
  color: string;
}

const stemColors = {
  drums: '#ef4444', // red-500
  bass: '#3b82f6', // blue-500
  melody: '#10b981', // emerald-500
  vocals: '#eab308', // yellow-500
  original: '#6b7280' // gray-500
};

const stemLabels = {
  drums: 'DRM',
  bass: 'BSS',
  melody: 'MEL',
  vocals: 'VOC',
  original: 'ORG'
};

// Optimized Volume Slider with anti-click protection
const VolumeSlider = memo<VolumeSliderProps>(({ value, onChange, disabled = false, color }) => {
  const sliderRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastChangeRef = useRef<number>(0);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const now = performance.now();
    const newValue = parseFloat(event.target.value);

    // Throttle changes to 60fps max
    if (now - lastChangeRef.current >= 16.67) {
      onChange(newValue);
      lastChangeRef.current = now;
    }
  }, [onChange]);

  const handleMouseDown = useCallback(() => {
    setIsDragging(true);
  }, []);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mouseup', handleMouseUp);
      return () => document.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging, handleMouseUp]);

  return (
    <div className="flex flex-col items-center h-32 w-8">
      <div className="relative flex-1 w-full">
        <input
          ref={sliderRef}
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={value}
          onChange={handleChange}
          onMouseDown={handleMouseDown}
          disabled={disabled}
          className={`
            absolute top-0 left-1/2 transform -translate-x-1/2 rotate-90 origin-center
            w-24 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
            transition-opacity duration-150
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600'}
          `}
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${value * 100}%, #374151 ${value * 100}%, #374151 100%)`
          }}
        />

        {/* Volume level indicator */}
        <div
          className="absolute right-0 w-1 bg-gray-800 rounded"
          style={{
            height: '100%',
            background: `linear-gradient(to top, transparent 0%, transparent ${(1 - value) * 100}%, ${color} ${(1 - value) * 100}%, ${color} 100%)`
          }}
        />
      </div>

      {/* Volume value display */}
      <div className="text-xs text-gray-400 mt-1 font-mono">
        {Math.round(value * 100)}
      </div>
    </div>
  );
});

VolumeSlider.displayName = 'VolumeSlider';

// High-performance EQ Knob with smooth rotation
const EQKnob = memo<EQKnobProps>(({ band, value, onChange, disabled = false, color }) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);
  const lastChangeRef = useRef<number>(0);

  // Convert value (-20 to +20) to rotation (-135° to +135°)
  const rotation = (value / 20) * 135;

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled) return;

    event.preventDefault();
    setIsDragging(true);
    setStartY(event.clientY);
    setStartValue(value);
  }, [disabled, value]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging) return;

    const now = performance.now();
    if (now - lastChangeRef.current < 16.67) return; // 60fps throttle

    const deltaY = startY - event.clientY; // Inverted for natural feel
    const sensitivity = 0.2;
    const deltaValue = deltaY * sensitivity;
    const newValue = Math.max(-20, Math.min(20, startValue + deltaValue));

    onChange(newValue);
    lastChangeRef.current = now;
  }, [isDragging, startY, startValue, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleDoubleClick = useCallback(() => {
    if (!disabled) {
      onChange(0); // Reset to neutral
    }
  }, [disabled, onChange]);

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-gray-400 mb-1 uppercase font-semibold">
        {band}
      </div>

      <div
        ref={knobRef}
        className={`
          relative w-12 h-12 rounded-full border-2 border-gray-600 bg-gray-800
          cursor-pointer select-none transition-all duration-150
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500 active:scale-95'}
        `}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        style={{
          boxShadow: `inset 0 0 10px rgba(0,0,0,0.5), 0 0 5px ${isDragging ? color : 'transparent'}`
        }}
      >
        {/* Knob indicator */}
        <div
          className="absolute w-1 h-4 bg-gray-300 rounded-full"
          style={{
            top: '4px',
            left: '50%',
            transformOrigin: '50% 20px',
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            backgroundColor: Math.abs(value) > 1 ? color : '#d1d5db'
          }}
        />

        {/* Center dot */}
        <div
          className="absolute w-2 h-2 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            backgroundColor: Math.abs(value) > 1 ? color : '#6b7280'
          }}
        />
      </div>

      {/* Value display */}
      <div className="text-xs text-gray-400 mt-1 font-mono">
        {value > 0 ? '+' : ''}{value.toFixed(1)}
      </div>
    </div>
  );
});

EQKnob.displayName = 'EQKnob';

// Pan Knob with center detent
const PanKnob = memo<PanKnobProps>(({ value, onChange, disabled = false, color }) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startValue, setStartValue] = useState(0);
  const lastChangeRef = useRef<number>(0);

  // Convert value (-1 to +1) to rotation (-90° to +90°)
  const rotation = value * 90;

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (disabled) return;

    event.preventDefault();
    setIsDragging(true);
    setStartX(event.clientX);
    setStartValue(value);
  }, [disabled, value]);

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isDragging) return;

    const now = performance.now();
    if (now - lastChangeRef.current < 16.67) return; // 60fps throttle

    const deltaX = event.clientX - startX;
    const sensitivity = 0.005;
    const deltaValue = deltaX * sensitivity;
    let newValue = startValue + deltaValue;

    // Center detent
    if (Math.abs(newValue) < 0.05) {
      newValue = 0;
    }

    newValue = Math.max(-1, Math.min(1, newValue));
    onChange(newValue);
    lastChangeRef.current = now;
  }, [isDragging, startX, startValue, onChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleDoubleClick = useCallback(() => {
    if (!disabled) {
      onChange(0); // Reset to center
    }
  }, [disabled, onChange]);

  return (
    <div className="flex flex-col items-center">
      <div className="text-xs text-gray-400 mb-1 uppercase font-semibold">
        PAN
      </div>

      <div
        ref={knobRef}
        className={`
          relative w-12 h-12 rounded-full border-2 border-gray-600 bg-gray-800
          cursor-pointer select-none transition-all duration-150
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-500 active:scale-95'}
        `}
        onMouseDown={handleMouseDown}
        onDoubleClick={handleDoubleClick}
        style={{
          boxShadow: `inset 0 0 10px rgba(0,0,0,0.5), 0 0 5px ${isDragging ? color : 'transparent'}`
        }}
      >
        {/* Pan indicator */}
        <div
          className="absolute w-1 h-4 bg-gray-300 rounded-full"
          style={{
            top: '4px',
            left: '50%',
            transformOrigin: '50% 20px',
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            backgroundColor: Math.abs(value) > 0.05 ? color : '#d1d5db'
          }}
        />

        {/* Center notch */}
        <div className="absolute w-0.5 h-2 bg-gray-500 top-1 left-1/2 transform -translate-x-1/2" />

        {/* Center dot */}
        <div
          className="absolute w-2 h-2 rounded-full top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          style={{
            backgroundColor: Math.abs(value) > 0.05 ? color : '#6b7280'
          }}
        />
      </div>

      {/* Value display */}
      <div className="text-xs text-gray-400 mt-1 font-mono">
        {value === 0 ? 'C' : value > 0 ? `R${Math.round(value * 100)}` : `L${Math.round(Math.abs(value) * 100)}`}
      </div>
    </div>
  );
});

PanKnob.displayName = 'PanKnob';

// Real-time level meter with peak hold
const LevelMeter = memo<LevelMeterProps>(({ level, color }) => {
  const [peakLevel, setPeakLevel] = useState(0);
  const [peakHoldTime, setPeakHoldTime] = useState(0);
  const animationRef = useRef<number>();

  useEffect(() => {
    const updatePeak = () => {
      const now = performance.now();

      if (level > peakLevel) {
        setPeakLevel(level);
        setPeakHoldTime(now);
      } else if (now - peakHoldTime > 1000) { // 1 second peak hold
        setPeakLevel(Math.max(0, peakLevel - 0.02)); // Slow decay
      }

      animationRef.current = requestAnimationFrame(updatePeak);
    };

    animationRef.current = requestAnimationFrame(updatePeak);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [level, peakLevel, peakHoldTime]);

  const segments = 12;
  const segmentHeight = 100 / segments;

  return (
    <div className="w-3 h-24 bg-gray-800 rounded-sm border border-gray-700 overflow-hidden">
      {Array.from({ length: segments }, (_, i) => {
        const segmentLevel = (segments - i) / segments;
        const isActive = level >= segmentLevel;
        const isPeak = peakLevel >= segmentLevel && peakLevel < segmentLevel + 1 / segments;

        let segmentColor = color;

        // Color coding: green (low), yellow (mid), red (high)
        if (segmentLevel > 0.8) {
          segmentColor = '#ef4444'; // red
        } else if (segmentLevel > 0.6) {
          segmentColor = '#eab308'; // yellow
        } else {
          segmentColor = '#10b981'; // green
        }

        return (
          <div
            key={i}
            className={`
              w-full border-b border-gray-900 transition-all duration-75
              ${isActive || isPeak ? 'opacity-100' : 'opacity-20'}
            `}
            style={{
              height: `${segmentHeight}%`,
              backgroundColor: isActive || isPeak ? segmentColor : '#374151'
            }}
          />
        );
      })}
    </div>
  );
});

LevelMeter.displayName = 'LevelMeter';

// Main StemControls component
const StemControlsComponent: React.FC<StemControlsProps> = ({
  channel,
  stemType,
  onVolumeChange,
  onMuteToggle,
  onSoloToggle,
  onPanChange,
  onEQChange
}) => {
  const {
    stemControls,
    setStemVolume,
    setStemMute,
    setStemSolo,
    setStemPan,
    setStemEQ
  } = useEnhancedDJStore();

  const controls = stemControls[channel];
  const stemControl = stemType === 'original' ? controls.original : controls[stemType];
  const color = stemColors[stemType];
  const label = stemLabels[stemType];

  // Mock level for demo - in real implementation this would come from audio analysis
  const [mockLevel, setMockLevel] = useState(0);

  useEffect(() => {
    let animationId: number;

    const updateLevel = () => {
      // Simulate audio level based on volume and if playing
      const baseLevel = stemControl.muted ? 0 : stemControl.volume * 0.8;
      const variation = Math.random() * 0.2;
      setMockLevel(Math.min(1, baseLevel + variation));

      animationId = requestAnimationFrame(updateLevel);
    };

    updateLevel();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [stemControl.volume, stemControl.muted]);

  const handleVolumeChange = useCallback((volume: number) => {
    setStemVolume(channel, stemType, volume);
    onVolumeChange?.(stemType, volume);
  }, [channel, stemType, setStemVolume, onVolumeChange]);

  const handleMuteToggle = useCallback(() => {
    const newMuted = !stemControl.muted;
    setStemMute(channel, stemType, newMuted);
    onMuteToggle?.(stemType, newMuted);
  }, [channel, stemType, stemControl.muted, setStemMute, onMuteToggle]);

  const handleSoloToggle = useCallback(() => {
    const newSoloed = !stemControl.soloed;
    setStemSolo(channel, stemType, newSoloed);
    onSoloToggle?.(stemType, newSoloed);
  }, [channel, stemType, stemControl.soloed, setStemSolo, onSoloToggle]);

  const handlePanChange = useCallback((pan: number) => {
    setStemPan(channel, stemType, pan);
    onPanChange?.(stemType, pan);
  }, [channel, stemType, setStemPan, onPanChange]);

  const handleEQChange = useCallback((band: 'low' | 'mid' | 'high', value: number) => {
    setStemEQ(channel, stemType, band, value);
    onEQChange?.(stemType, band, value);
  }, [channel, stemType, setStemEQ, onEQChange]);

  return (
    <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 w-32">
      {/* Stem Label */}
      <div className="text-center mb-3">
        <div
          className="text-sm font-bold uppercase tracking-wider mb-1"
          style={{ color }}
        >
          {label}
        </div>
        <div className="text-xs text-gray-500 capitalize">
          {stemType}
        </div>
      </div>

      {/* Level Meter */}
      <div className="flex justify-center mb-4">
        <LevelMeter level={mockLevel} color={color} />
      </div>

      {/* EQ Controls */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <EQKnob
          band="high"
          value={stemControl.eq.high}
          onChange={(value) => handleEQChange('high', value)}
          color={color}
        />
        <EQKnob
          band="mid"
          value={stemControl.eq.mid}
          onChange={(value) => handleEQChange('mid', value)}
          color={color}
        />
        <EQKnob
          band="low"
          value={stemControl.eq.low}
          onChange={(value) => handleEQChange('low', value)}
          color={color}
        />
      </div>

      {/* Pan Control */}
      <div className="flex justify-center mb-4">
        <PanKnob
          value={stemControl.pan}
          onChange={handlePanChange}
          color={color}
        />
      </div>

      {/* Mute/Solo Buttons */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          onClick={handleMuteToggle}
          className={`
            px-3 py-2 text-xs font-bold uppercase rounded transition-all duration-150
            ${stemControl.muted
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/50'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
          `}
        >
          Mute
        </button>

        <button
          onClick={handleSoloToggle}
          className={`
            px-3 py-2 text-xs font-bold uppercase rounded transition-all duration-150
            ${stemControl.soloed
              ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/50'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }
          `}
        >
          Solo
        </button>
      </div>

      {/* Volume Slider */}
      <div className="flex justify-center">
        <VolumeSlider
          value={stemControl.volume}
          onChange={handleVolumeChange}
          color={color}
        />
      </div>
    </div>
  );
};

export default memo(StemControlsComponent);
export { StemControlsComponent as StemControls };