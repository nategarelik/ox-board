'use client';

import React, { useEffect, useRef, useState } from 'react';
import { StemEffectState, EffectType, PresetType } from '../../lib/audio/stemEffects';

interface EffectVisualizerProps {
  stemIndex: number;
  stemState: StemEffectState | null;
  onEffectToggle: (effect: EffectType, enabled: boolean) => void;
  onParameterChange: (effect: EffectType, parameter: string, value: number) => void;
  onPresetApply: (preset: PresetType) => void;
  className?: string;
}

interface EffectMeterProps {
  label: string;
  value: number;
  max?: number;
  unit?: string;
  color?: string;
  animated?: boolean;
}

const EffectMeter: React.FC<EffectMeterProps> = ({
  label,
  value,
  max = 1,
  unit = '',
  color = '#00ff88',
  animated = false
}) => {
  const percentage = Math.min(100, (value / max) * 100);

  return (
    <div className="flex flex-col space-y-1">
      <div className="flex justify-between text-xs text-gray-300">
        <span>{label}</span>
        <span>{value.toFixed(2)}{unit}</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-${animated ? '300' : '100'} ease-out`}
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
            boxShadow: animated ? `0 0 10px ${color}` : 'none'
          }}
        />
      </div>
    </div>
  );
};

interface EffectControlProps {
  effect: EffectType;
  enabled: boolean;
  parameters: any;
  onToggle: (enabled: boolean) => void;
  onParameterChange: (parameter: string, value: number) => void;
}

const EffectControl: React.FC<EffectControlProps> = ({
  effect,
  enabled,
  parameters,
  onToggle,
  onParameterChange
}) => {
  const getEffectIcon = (effect: EffectType): string => {
    const icons: Record<EffectType, string> = {
      reverb: '🌊',
      delay: '⏰',
      filter: '📶',
      distortion: '⚡',
      compression: '📊',
      phaser: '🌀',
      flanger: '🎵'
    };
    return icons[effect] || '🎛️';
  };

  const getEffectColor = (effect: EffectType): string => {
    const colors: Record<EffectType, string> = {
      reverb: '#4f46e5',
      delay: '#059669',
      filter: '#dc2626',
      distortion: '#ea580c',
      compression: '#7c3aed',
      phaser: '#0891b2',
      flanger: '#be185d'
    };
    return colors[effect] || '#6b7280';
  };

  const renderParameterControls = () => {
    const commonControls = (
      <>
        <div className="space-y-2">
          <EffectMeter
            label="Wet/Dry"
            value={parameters.wetness || 0}
            color={enabled ? '#00ff88' : '#666'}
            animated={enabled}
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={parameters.wetness || 0}
            onChange={(e) => onParameterChange('wetness', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            disabled={!enabled}
          />
        </div>
        <div className="space-y-2">
          <EffectMeter
            label="Intensity"
            value={parameters.intensity || 0}
            color={enabled ? getEffectColor(effect) : '#666'}
            animated={enabled}
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={parameters.intensity || 0}
            onChange={(e) => onParameterChange('intensity', parseFloat(e.target.value))}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            disabled={!enabled}
          />
        </div>
      </>
    );

    switch (effect) {
      case 'reverb':
        return (
          <>
            {commonControls}
            <div className="space-y-2">
              <EffectMeter
                label="Room Size"
                value={parameters.roomSize || 0}
                color={enabled ? '#4f46e5' : '#666'}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={parameters.roomSize || 0}
                onChange={(e) => onParameterChange('roomSize', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={!enabled}
              />
            </div>
            <div className="space-y-2">
              <EffectMeter
                label="Decay"
                value={(parameters.decay || 0) / 10}
                max={1}
                color={enabled ? '#4f46e5' : '#666'}
              />
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={parameters.decay || 0}
                onChange={(e) => onParameterChange('decay', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={!enabled}
              />
            </div>
          </>
        );

      case 'delay':
        return (
          <>
            {commonControls}
            <div className="space-y-2">
              <EffectMeter
                label="Time"
                value={parameters.time || 0}
                unit="s"
                color={enabled ? '#059669' : '#666'}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={parameters.time || 0}
                onChange={(e) => onParameterChange('time', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={!enabled}
              />
            </div>
            <div className="space-y-2">
              <EffectMeter
                label="Feedback"
                value={parameters.feedback || 0}
                color={enabled ? '#059669' : '#666'}
              />
              <input
                type="range"
                min="0"
                max="0.95"
                step="0.01"
                value={parameters.feedback || 0}
                onChange={(e) => onParameterChange('feedback', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={!enabled}
              />
            </div>
          </>
        );

      case 'filter':
        return (
          <>
            {commonControls}
            <div className="space-y-2">
              <EffectMeter
                label="Frequency"
                value={parameters.frequency || 0}
                color={enabled ? '#dc2626' : '#666'}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={parameters.frequency || 0}
                onChange={(e) => onParameterChange('frequency', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={!enabled}
              />
            </div>
            <div className="space-y-2">
              <EffectMeter
                label="Resonance"
                value={parameters.resonance || 0}
                color={enabled ? '#dc2626' : '#666'}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={parameters.resonance || 0}
                onChange={(e) => onParameterChange('resonance', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={!enabled}
              />
            </div>
          </>
        );

      case 'distortion':
        return (
          <>
            {commonControls}
            <div className="space-y-2">
              <EffectMeter
                label="Drive"
                value={parameters.drive || 0}
                color={enabled ? '#ea580c' : '#666'}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={parameters.drive || 0}
                onChange={(e) => onParameterChange('drive', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={!enabled}
              />
            </div>
            <div className="space-y-2">
              <EffectMeter
                label="Tone"
                value={parameters.tone || 0}
                color={enabled ? '#ea580c' : '#666'}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={parameters.tone || 0}
                onChange={(e) => onParameterChange('tone', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={!enabled}
              />
            </div>
          </>
        );

      case 'compression':
        return (
          <>
            {commonControls}
            <div className="space-y-2">
              <EffectMeter
                label="Threshold"
                value={parameters.threshold || 0}
                color={enabled ? '#7c3aed' : '#666'}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={parameters.threshold || 0}
                onChange={(e) => onParameterChange('threshold', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={!enabled}
              />
            </div>
            <div className="space-y-2">
              <EffectMeter
                label="Ratio"
                value={parameters.ratio || 0}
                color={enabled ? '#7c3aed' : '#666'}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={parameters.ratio || 0}
                onChange={(e) => onParameterChange('ratio', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={!enabled}
              />
            </div>
          </>
        );

      case 'phaser':
      case 'flanger':
        return (
          <>
            {commonControls}
            <div className="space-y-2">
              <EffectMeter
                label="Rate"
                value={(parameters.rate || 0) / 20}
                unit="Hz"
                color={enabled ? (effect === 'phaser' ? '#0891b2' : '#be185d') : '#666'}
              />
              <input
                type="range"
                min="0"
                max="20"
                step="0.1"
                value={parameters.rate || 0}
                onChange={(e) => onParameterChange('rate', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={!enabled}
              />
            </div>
            <div className="space-y-2">
              <EffectMeter
                label="Depth"
                value={parameters.depth || 0}
                color={enabled ? (effect === 'phaser' ? '#0891b2' : '#be185d') : '#666'}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={parameters.depth || 0}
                onChange={(e) => onParameterChange('depth', parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                disabled={!enabled}
              />
            </div>
          </>
        );

      default:
        return commonControls;
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border-2 transition-all duration-200 ${
      enabled ? `border-${getEffectColor(effect).replace('#', '')} shadow-lg` : 'border-gray-600'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{getEffectIcon(effect)}</span>
          <h3 className="text-sm font-medium text-white capitalize">{effect}</h3>
        </div>
        <button
          onClick={() => onToggle(!enabled)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 ${
            enabled
              ? `bg-${getEffectColor(effect).replace('#', '')} text-white shadow-lg`
              : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
          }`}
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="space-y-3">
        {renderParameterControls()}
      </div>
    </div>
  );
};

const SignalFlowVisualization: React.FC<{
  activeEffects: EffectType[];
  routing: 'serial' | 'parallel';
}> = ({ activeEffects, routing }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const centerY = canvas.height / 2;
    const nodeRadius = 20;
    const nodeSpacing = 60;

    // Draw input
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(nodeRadius, centerY, nodeRadius, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('IN', nodeRadius, centerY + 3);

    if (routing === 'serial') {
      // Serial routing
      let x = nodeRadius + nodeSpacing;

      activeEffects.forEach((effect, index) => {
        // Draw connection line
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - nodeSpacing + nodeRadius, centerY);
        ctx.lineTo(x - nodeRadius, centerY);
        ctx.stroke();

        // Draw effect node
        ctx.fillStyle = '#4f46e5';
        ctx.beginPath();
        ctx.arc(x, centerY, nodeRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Draw effect label
        ctx.fillStyle = '#fff';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(effect.substring(0, 3).toUpperCase(), x, centerY + 2);

        x += nodeSpacing;
      });

      // Draw output
      ctx.strokeStyle = '#00ff88';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - nodeSpacing + nodeRadius, centerY);
      ctx.lineTo(x - nodeRadius, centerY);
      ctx.stroke();

      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(x, centerY, nodeRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('OUT', x, centerY + 3);
    } else {
      // Parallel routing
      const outputX = canvas.width - nodeRadius - 20;

      activeEffects.forEach((effect, index) => {
        const y = centerY + (index - activeEffects.length / 2 + 0.5) * 40;
        const x = canvas.width / 2;

        // Draw input connection
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(nodeRadius + nodeRadius, centerY);
        ctx.lineTo(x - nodeRadius, y);
        ctx.stroke();

        // Draw effect node
        ctx.fillStyle = '#4f46e5';
        ctx.beginPath();
        ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
        ctx.fill();

        // Draw effect label
        ctx.fillStyle = '#fff';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(effect.substring(0, 3).toUpperCase(), x, y + 2);

        // Draw output connection
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + nodeRadius, y);
        ctx.lineTo(outputX - nodeRadius, centerY);
        ctx.stroke();
      });

      // Draw output
      ctx.fillStyle = '#ff4444';
      ctx.beginPath();
      ctx.arc(outputX, centerY, nodeRadius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('OUT', outputX, centerY + 3);
    }
  }, [activeEffects, routing]);

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <h4 className="text-sm font-medium text-white mb-2">Signal Flow</h4>
      <canvas
        ref={canvasRef}
        width={400}
        height={150}
        className="w-full max-w-md bg-gray-800 rounded border"
      />
    </div>
  );
};

export const EffectVisualizer: React.FC<EffectVisualizerProps> = ({
  stemIndex,
  stemState,
  onEffectToggle,
  onParameterChange,
  onPresetApply,
  className = ''
}) => {
  const [selectedEffect, setSelectedEffect] = useState<EffectType>('reverb');
  const [showPresets, setShowPresets] = useState(false);

  if (!stemState) {
    return (
      <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
        <div className="text-center text-gray-400">
          <p>No effect data available for stem {stemIndex}</p>
        </div>
      </div>
    );
  }

  const presets: { type: PresetType; name: string; description: string }[] = [
    { type: 'club', name: 'Club', description: 'Punchy compression and subtle delay' },
    { type: 'hall', name: 'Hall', description: 'Large reverb for spacious sound' },
    { type: 'studio', name: 'Studio', description: 'Clean compression and subtle EQ' },
    { type: 'outdoor', name: 'Outdoor', description: 'Enhanced mids for outdoor events' }
  ];

  return (
    <div className={`bg-gray-900 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">
          Stem {stemIndex} Effects
        </h2>
        <div className="flex space-x-2">
          {/* Performance metrics */}
          <div className="bg-gray-800 rounded-lg px-3 py-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">CPU:</span>
              <span className={`font-mono ${stemState.cpuUsage > 80 ? 'text-red-400' : 'text-green-400'}`}>
                {stemState.cpuUsage.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg px-3 py-2 text-xs">
            <div className="flex items-center space-x-2">
              <span className="text-gray-400">Latency:</span>
              <span className={`font-mono ${stemState.latency > 10 ? 'text-red-400' : 'text-green-400'}`}>
                {stemState.latency.toFixed(1)}ms
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset controls */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-white">Presets</h3>
          <button
            onClick={() => setShowPresets(!showPresets)}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            {showPresets ? 'Hide' : 'Show'} Presets
          </button>
        </div>

        {showPresets && (
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => (
              <button
                key={preset.type}
                onClick={() => onPresetApply(preset.type)}
                className="bg-gray-800 hover:bg-gray-700 rounded-lg p-3 text-left transition-colors"
              >
                <div className="text-white font-medium">{preset.name}</div>
                <div className="text-xs text-gray-400">{preset.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Effect tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-1 mb-4">
          {Object.keys(stemState.config.effects).map((effect) => (
            <button
              key={effect}
              onClick={() => setSelectedEffect(effect as EffectType)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedEffect === effect
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {effect}
            </button>
          ))}
        </div>
      </div>

      {/* Selected effect control */}
      <div className="mb-6">
        <EffectControl
          effect={selectedEffect}
          enabled={stemState.config.effects[selectedEffect].enabled}
          parameters={stemState.config.effects[selectedEffect]}
          onToggle={(enabled) => onEffectToggle(selectedEffect, enabled)}
          onParameterChange={(parameter, value) => onParameterChange(selectedEffect, parameter, value)}
        />
      </div>

      {/* Signal flow visualization */}
      <SignalFlowVisualization
        activeEffects={stemState.activeEffects}
        routing={stemState.config.routing}
      />

      {/* Active effects summary */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-white mb-2">Active Effects</h4>
        <div className="flex flex-wrap gap-2">
          {stemState.activeEffects.length > 0 ? (
            stemState.activeEffects.map((effect) => (
              <span
                key={effect}
                className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium"
              >
                {effect}
              </span>
            ))
          ) : (
            <span className="text-gray-400 text-sm">No active effects</span>
          )}
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #00ff88;
          cursor: pointer;
          box-shadow: 0 0 5px rgba(0, 255, 136, 0.5);
        }

        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #00ff88;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 5px rgba(0, 255, 136, 0.5);
        }

        .slider:disabled::-webkit-slider-thumb {
          background: #666;
          box-shadow: none;
        }

        .slider:disabled::-moz-range-thumb {
          background: #666;
          box-shadow: none;
        }
      `}</style>
    </div>
  );
};

export default EffectVisualizer;