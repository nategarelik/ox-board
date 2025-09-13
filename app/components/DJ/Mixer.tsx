'use client';

import React, { useEffect, useRef, useState } from 'react';
import { AudioMixer, type ChannelConfig, type CrossfaderConfig, type MasterConfig } from '@/app/lib/audio/mixer';

interface ChannelStripProps {
  channelIndex: number;
  config: ChannelConfig;
  onGainChange: (value: number) => void;
  onEQChange: (band: 'low' | 'mid' | 'high', value: number) => void;
  onFilterChange: (type: 'off' | 'lpf' | 'hpf', freq: number, resonance: number) => void;
  onCueChange: (enabled: boolean) => void;
}

const ChannelStrip: React.FC<ChannelStripProps> = ({
  channelIndex,
  config,
  onGainChange,
  onEQChange,
  onFilterChange,
  onCueChange,
}) => {
  return (
    <div className="flex flex-col bg-gray-800 p-4 rounded-lg space-y-4 w-48">
      {/* Channel Header */}
      <div className="text-center text-white font-bold">
        CH {channelIndex + 1}
      </div>

      {/* Cue Button */}
      <button
        onClick={() => onCueChange(!config.cueEnable)}
        className={`px-3 py-1 rounded font-semibold transition-colors ${
          config.cueEnable
            ? 'bg-yellow-500 text-black hover:bg-yellow-400'
            : 'bg-gray-600 text-white hover:bg-gray-500'
        }`}
      >
        CUE
      </button>

      {/* High EQ */}
      <div className="flex flex-col items-center space-y-2">
        <label className="text-white text-sm font-medium">HIGH</label>
        <input
          type="range"
          min="-26"
          max="26"
          step="0.5"
          value={config.eq.high}
          onChange={(e) => onEQChange('high', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        <span className="text-white text-xs">{config.eq.high > 0 ? '+' : ''}{config.eq.high.toFixed(1)}dB</span>
      </div>

      {/* Mid EQ */}
      <div className="flex flex-col items-center space-y-2">
        <label className="text-white text-sm font-medium">MID</label>
        <input
          type="range"
          min="-26"
          max="26"
          step="0.5"
          value={config.eq.mid}
          onChange={(e) => onEQChange('mid', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        <span className="text-white text-xs">{config.eq.mid > 0 ? '+' : ''}{config.eq.mid.toFixed(1)}dB</span>
      </div>

      {/* Low EQ */}
      <div className="flex flex-col items-center space-y-2">
        <label className="text-white text-sm font-medium">LOW</label>
        <input
          type="range"
          min="-26"
          max="26"
          step="0.5"
          value={config.eq.low}
          onChange={(e) => onEQChange('low', parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        <span className="text-white text-xs">{config.eq.low > 0 ? '+' : ''}{config.eq.low.toFixed(1)}dB</span>
      </div>

      {/* Filter Section */}
      <div className="flex flex-col space-y-2">
        <label className="text-white text-sm font-medium text-center">FILTER</label>

        {/* Filter Type */}
        <select
          value={config.filterType}
          onChange={(e) => onFilterChange(
            e.target.value as 'off' | 'lpf' | 'hpf',
            config.filterFreq,
            config.filterResonance
          )}
          className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
        >
          <option value="off">OFF</option>
          <option value="lpf">LPF</option>
          <option value="hpf">HPF</option>
        </select>

        {/* Filter Frequency */}
        <div className="flex flex-col items-center space-y-1">
          <input
            type="range"
            min="20"
            max="20000"
            step="10"
            value={config.filterFreq}
            onChange={(e) => onFilterChange(
              config.filterType,
              parseFloat(e.target.value),
              config.filterResonance
            )}
            disabled={config.filterType === 'off'}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb disabled:opacity-50"
          />
          <span className="text-white text-xs">
            {config.filterFreq < 1000
              ? `${config.filterFreq}Hz`
              : `${(config.filterFreq / 1000).toFixed(1)}kHz`}
          </span>
        </div>

        {/* Filter Resonance */}
        <div className="flex flex-col items-center space-y-1">
          <input
            type="range"
            min="0.1"
            max="30"
            step="0.1"
            value={config.filterResonance}
            onChange={(e) => onFilterChange(
              config.filterType,
              config.filterFreq,
              parseFloat(e.target.value)
            )}
            disabled={config.filterType === 'off'}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb disabled:opacity-50"
          />
          <span className="text-white text-xs">Q: {config.filterResonance.toFixed(1)}</span>
        </div>
      </div>

      {/* Channel Gain (Volume Fader) */}
      <div className="flex flex-col items-center space-y-2 mt-4">
        <label className="text-white text-sm font-medium">GAIN</label>
        <div className="relative h-32 w-8 bg-gray-700 rounded-full">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={config.gain}
            onChange={(e) => onGainChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ writingMode: 'bt-lr', appearance: 'slider-vertical' }}
          />
          <div
            className="absolute bottom-0 bg-green-500 rounded-full w-full transition-all duration-100"
            style={{ height: `${config.gain * 100}%` }}
          />
          <div
            className="absolute w-6 h-3 bg-white rounded-sm left-1 transition-all duration-100"
            style={{ bottom: `${config.gain * 100 - 6}%` }}
          />
        </div>
        <span className="text-white text-xs">{Math.round(config.gain * 100)}%</span>
      </div>
    </div>
  );
};

interface CrossfaderProps {
  config: CrossfaderConfig;
  onPositionChange: (position: number) => void;
  onCurveChange: (curve: 'linear' | 'smooth' | 'sharp') => void;
}

const Crossfader: React.FC<CrossfaderProps> = ({
  config,
  onPositionChange,
  onCurveChange,
}) => {
  return (
    <div className="flex flex-col items-center bg-gray-800 p-4 rounded-lg space-y-4">
      <label className="text-white text-lg font-bold">CROSSFADER</label>

      {/* Curve Selection */}
      <div className="flex space-x-2">
        {(['linear', 'smooth', 'sharp'] as const).map((curve) => (
          <button
            key={curve}
            onClick={() => onCurveChange(curve)}
            className={`px-3 py-1 rounded text-sm font-semibold transition-colors ${
              config.curve === curve
                ? 'bg-blue-500 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {curve.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Crossfader Slider */}
      <div className="relative w-64 h-12 bg-gray-700 rounded-full">
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={config.position}
          onChange={(e) => onPositionChange(parseFloat(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <div className="absolute inset-2 bg-gray-600 rounded-full" />
        <div
          className="absolute top-2 w-8 h-8 bg-white rounded-full shadow-lg transition-all duration-100 cursor-pointer"
          style={{ left: `${((config.position + 1) / 2) * (256 - 32) + 8}px` }}
        />
        <div className="absolute inset-0 flex justify-between items-center px-4">
          <span className="text-white font-bold">A</span>
          <span className="text-white font-bold">B</span>
        </div>
      </div>

      <div className="text-white text-sm">
        Position: {config.position.toFixed(2)}
      </div>
    </div>
  );
};

interface MasterSectionProps {
  config: MasterConfig;
  onGainChange: (gain: number) => void;
  onLimiterChange: (enabled: boolean, threshold: number) => void;
  onCompressorChange: (enabled: boolean, ratio: number, threshold: number, attack: number, release: number) => void;
}

const MasterSection: React.FC<MasterSectionProps> = ({
  config,
  onGainChange,
  onLimiterChange,
  onCompressorChange,
}) => {
  return (
    <div className="flex flex-col bg-gray-800 p-4 rounded-lg space-y-4 w-64">
      <label className="text-white text-lg font-bold text-center">MASTER</label>

      {/* Limiter Section */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-medium">LIMITER</span>
          <button
            onClick={() => onLimiterChange(!config.limiterEnabled, config.limiterThreshold)}
            className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
              config.limiterEnabled
                ? 'bg-red-500 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {config.limiterEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="flex flex-col space-y-1">
          <input
            type="range"
            min="-20"
            max="0"
            step="0.5"
            value={config.limiterThreshold}
            onChange={(e) => onLimiterChange(config.limiterEnabled, parseFloat(e.target.value))}
            disabled={!config.limiterEnabled}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb disabled:opacity-50"
          />
          <span className="text-white text-xs text-center">
            Threshold: {config.limiterThreshold.toFixed(1)}dB
          </span>
        </div>
      </div>

      {/* Compressor Section */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-white text-sm font-medium">COMPRESSOR</span>
          <button
            onClick={() => onCompressorChange(
              !config.compressorEnabled,
              config.compressorRatio,
              config.compressorThreshold,
              config.compressorAttack,
              config.compressorRelease
            )}
            className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
              config.compressorEnabled
                ? 'bg-orange-500 text-white'
                : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
            }`}
          >
            {config.compressorEnabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {config.compressorEnabled && (
          <div className="grid grid-cols-2 gap-2">
            {/* Ratio */}
            <div className="flex flex-col space-y-1">
              <label className="text-white text-xs">Ratio</label>
              <input
                type="range"
                min="1"
                max="20"
                step="0.5"
                value={config.compressorRatio}
                onChange={(e) => onCompressorChange(
                  config.compressorEnabled,
                  parseFloat(e.target.value),
                  config.compressorThreshold,
                  config.compressorAttack,
                  config.compressorRelease
                )}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <span className="text-white text-xs text-center">
                {config.compressorRatio.toFixed(1)}:1
              </span>
            </div>

            {/* Threshold */}
            <div className="flex flex-col space-y-1">
              <label className="text-white text-xs">Threshold</label>
              <input
                type="range"
                min="-40"
                max="0"
                step="1"
                value={config.compressorThreshold}
                onChange={(e) => onCompressorChange(
                  config.compressorEnabled,
                  config.compressorRatio,
                  parseFloat(e.target.value),
                  config.compressorAttack,
                  config.compressorRelease
                )}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <span className="text-white text-xs text-center">
                {config.compressorThreshold.toFixed(0)}dB
              </span>
            </div>

            {/* Attack */}
            <div className="flex flex-col space-y-1">
              <label className="text-white text-xs">Attack</label>
              <input
                type="range"
                min="0.003"
                max="1"
                step="0.001"
                value={config.compressorAttack}
                onChange={(e) => onCompressorChange(
                  config.compressorEnabled,
                  config.compressorRatio,
                  config.compressorThreshold,
                  parseFloat(e.target.value),
                  config.compressorRelease
                )}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <span className="text-white text-xs text-center">
                {config.compressorAttack.toFixed(3)}s
              </span>
            </div>

            {/* Release */}
            <div className="flex flex-col space-y-1">
              <label className="text-white text-xs">Release</label>
              <input
                type="range"
                min="0.01"
                max="3"
                step="0.01"
                value={config.compressorRelease}
                onChange={(e) => onCompressorChange(
                  config.compressorEnabled,
                  config.compressorRatio,
                  config.compressorThreshold,
                  config.compressorAttack,
                  parseFloat(e.target.value)
                )}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-thumb"
              />
              <span className="text-white text-xs text-center">
                {config.compressorRelease.toFixed(2)}s
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Master Gain */}
      <div className="flex flex-col items-center space-y-2 mt-4">
        <label className="text-white text-sm font-medium">MASTER GAIN</label>
        <div className="relative h-32 w-8 bg-gray-700 rounded-full">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={config.gain}
            onChange={(e) => onGainChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ writingMode: 'bt-lr', appearance: 'slider-vertical' }}
          />
          <div
            className="absolute bottom-0 bg-red-500 rounded-full w-full transition-all duration-100"
            style={{ height: `${config.gain * 100}%` }}
          />
          <div
            className="absolute w-6 h-3 bg-white rounded-sm left-1 transition-all duration-100"
            style={{ bottom: `${config.gain * 100 - 6}%` }}
          />
        </div>
        <span className="text-white text-xs">{Math.round(config.gain * 100)}%</span>
      </div>
    </div>
  );
};

export interface MixerProps {
  className?: string;
}

export const Mixer: React.FC<MixerProps> = ({ className = '' }) => {
  const mixerRef = useRef<AudioMixer | null>(null);

  // State for all mixer controls
  const [channelConfigs, setChannelConfigs] = useState<ChannelConfig[]>([]);
  const [crossfaderConfig, setCrossfaderConfig] = useState<CrossfaderConfig>({ position: 0, curve: 'smooth' });
  const [masterConfig, setMasterConfig] = useState<MasterConfig>({
    gain: 0.8,
    limiterEnabled: true,
    limiterThreshold: -3,
    compressorEnabled: true,
    compressorRatio: 4,
    compressorThreshold: -12,
    compressorAttack: 0.003,
    compressorRelease: 0.1,
  });

  // Initialize mixer
  useEffect(() => {
    mixerRef.current = new AudioMixer();

    // Initialize state from mixer
    const configs = Array.from({ length: 4 }, (_, i) =>
      mixerRef.current!.getChannelConfig(i)!
    );
    setChannelConfigs(configs);
    setCrossfaderConfig(mixerRef.current.getCrossfaderConfig());
    setMasterConfig(mixerRef.current.getMasterConfig());

    // Clean up on unmount
    return () => {
      if (mixerRef.current) {
        mixerRef.current.dispose();
      }
    };
  }, []);

  // Channel control handlers
  const handleChannelGain = (channelIndex: number, gain: number) => {
    if (mixerRef.current) {
      mixerRef.current.setChannelGain(channelIndex, gain);
      const newConfigs = [...channelConfigs];
      newConfigs[channelIndex] = { ...newConfigs[channelIndex], gain };
      setChannelConfigs(newConfigs);
    }
  };

  const handleChannelEQ = (channelIndex: number, band: 'low' | 'mid' | 'high', value: number) => {
    if (mixerRef.current) {
      mixerRef.current.setChannelEQ(channelIndex, band, value);
      const newConfigs = [...channelConfigs];
      newConfigs[channelIndex] = {
        ...newConfigs[channelIndex],
        eq: { ...newConfigs[channelIndex].eq, [band]: value },
      };
      setChannelConfigs(newConfigs);
    }
  };

  const handleChannelFilter = (
    channelIndex: number,
    type: 'off' | 'lpf' | 'hpf',
    freq: number,
    resonance: number
  ) => {
    if (mixerRef.current) {
      mixerRef.current.setChannelFilter(channelIndex, type, freq, resonance);
      const newConfigs = [...channelConfigs];
      newConfigs[channelIndex] = {
        ...newConfigs[channelIndex],
        filterType: type,
        filterFreq: freq,
        filterResonance: resonance,
      };
      setChannelConfigs(newConfigs);
    }
  };

  const handleChannelCue = (channelIndex: number, enabled: boolean) => {
    if (mixerRef.current) {
      mixerRef.current.setChannelCue(channelIndex, enabled);
      const newConfigs = [...channelConfigs];
      newConfigs[channelIndex] = { ...newConfigs[channelIndex], cueEnable: enabled };
      setChannelConfigs(newConfigs);
    }
  };

  // Crossfader handlers
  const handleCrossfaderPosition = (position: number) => {
    if (mixerRef.current) {
      mixerRef.current.setCrossfaderPosition(position);
      setCrossfaderConfig({ ...crossfaderConfig, position });
    }
  };

  const handleCrossfaderCurve = (curve: 'linear' | 'smooth' | 'sharp') => {
    if (mixerRef.current) {
      mixerRef.current.setCrossfaderCurve(curve);
      setCrossfaderConfig({ ...crossfaderConfig, curve });
    }
  };

  // Master section handlers
  const handleMasterGain = (gain: number) => {
    if (mixerRef.current) {
      mixerRef.current.setMasterGain(gain);
      setMasterConfig({ ...masterConfig, gain });
    }
  };

  const handleLimiter = (enabled: boolean, threshold: number) => {
    if (mixerRef.current) {
      mixerRef.current.setLimiter(enabled, threshold);
      setMasterConfig({ ...masterConfig, limiterEnabled: enabled, limiterThreshold: threshold });
    }
  };

  const handleCompressor = (
    enabled: boolean,
    ratio: number,
    threshold: number,
    attack: number,
    release: number
  ) => {
    if (mixerRef.current) {
      mixerRef.current.setCompressor(enabled, ratio, threshold, attack, release);
      setMasterConfig({
        ...masterConfig,
        compressorEnabled: enabled,
        compressorRatio: ratio,
        compressorThreshold: threshold,
        compressorAttack: attack,
        compressorRelease: release,
      });
    }
  };

  // Expose mixer instance for external connections
  const getMixer = () => mixerRef.current;

  return (
    <div className={`bg-gray-900 p-6 rounded-xl ${className}`}>
      <div className="flex flex-wrap gap-6 justify-center">
        {/* Channel Strips */}
        {channelConfigs.map((config, index) => (
          <ChannelStrip
            key={index}
            channelIndex={index}
            config={config}
            onGainChange={(gain) => handleChannelGain(index, gain)}
            onEQChange={(band, value) => handleChannelEQ(index, band, value)}
            onFilterChange={(type, freq, resonance) => handleChannelFilter(index, type, freq, resonance)}
            onCueChange={(enabled) => handleChannelCue(index, enabled)}
          />
        ))}

        {/* Crossfader */}
        <div className="flex flex-col justify-center">
          <Crossfader
            config={crossfaderConfig}
            onPositionChange={handleCrossfaderPosition}
            onCurveChange={handleCrossfaderCurve}
          />
        </div>

        {/* Master Section */}
        <MasterSection
          config={masterConfig}
          onGainChange={handleMasterGain}
          onLimiterChange={handleLimiter}
          onCompressorChange={handleCompressor}
        />
      </div>
    </div>
  );
};

export default Mixer;