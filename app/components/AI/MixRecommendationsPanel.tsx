'use client';

import React, { useState } from 'react';
import { TransitionRecommendation } from '../../lib/ai/mixAssistant';

interface MixRecommendationsPanelProps {
  recommendations: TransitionRecommendation[];
  onSelectRecommendation?: (recommendation: TransitionRecommendation) => void;
  className?: string;
}

/**
 * Panel displaying intelligent mix recommendations with detailed transition information
 */
export const MixRecommendationsPanel: React.FC<MixRecommendationsPanelProps> = ({
  recommendations,
  onSelectRecommendation,
  className = ''
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-400 border-green-400';
    if (confidence >= 0.6) return 'text-yellow-400 border-yellow-400';
    if (confidence >= 0.4) return 'text-orange-400 border-orange-400';
    return 'text-red-400 border-red-400';
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getMixPointIcon = (type: string): string => {
    switch (type) {
      case 'intro': return '🎬';
      case 'outro': return '🏁';
      case 'breakdown': return '🔻';
      case 'drop': return '💥';
      case 'phrase_start': return '▶️';
      case 'phrase_end': return '⏹️';
      default: return '🎵';
    }
  };

  const getTempoAdjustmentColor = (method: string): string => {
    switch (method) {
      case 'pitch_shift': return 'text-green-400';
      case 'time_stretch': return 'text-yellow-400';
      case 'sync_lock': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700 ${className}`}>
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Mix Recommendations</h3>
        <p className="text-sm text-gray-400 mt-1">
          {recommendations.length} intelligent suggestions based on harmonic and rhythmic analysis
        </p>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {recommendations.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-3">🎧</div>
            <p className="text-gray-400">No mix recommendations available</p>
            <p className="text-sm text-gray-500 mt-1">Analyze tracks to see intelligent mixing suggestions</p>
          </div>
        ) : (
          <div className="space-y-2 p-2">
            {recommendations.map((rec, index) => (
              <div
                key={`${rec.fromTrack}-${rec.toTrack}-${index}`}
                className={`border rounded-lg p-3 cursor-pointer transition-all duration-200 ${
                  selectedIndex === index
                    ? 'border-blue-400 bg-blue-400/10'
                    : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
                }`}
                onClick={() => {
                  setSelectedIndex(selectedIndex === index ? null : index);
                  onSelectRecommendation?.(rec);
                }}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg">🎛️</div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        Track {rec.fromTrack} → Track {rec.toTrack}
                      </div>
                      <div className="text-xs text-gray-400">
                        {Math.round(rec.compatibility.overall * 100)}% compatibility
                      </div>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded border text-xs font-medium ${getConfidenceColor(rec.confidence)}`}>
                    {Math.round(rec.confidence * 100)}%
                  </div>
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                  <div>
                    <span className="text-gray-400">Mix Point:</span>
                    <div className="text-white flex items-center space-x-1 mt-1">
                      <span>{getMixPointIcon(rec.fromMixPoint.type)}</span>
                      <span>{rec.fromMixPoint.type}</span>
                      <span className="text-gray-400">at {formatTime(rec.fromMixPoint.time)}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400">Crossfade:</span>
                    <div className="text-white mt-1">{formatTime(rec.crossfadeTime)}</div>
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedIndex === index && (
                  <div className="border-t border-gray-600 pt-3 mt-3 space-y-4">
                    {/* Tempo Adjustment */}
                    <div>
                      <h5 className="text-xs font-medium text-gray-300 mb-2">Tempo Adjustment</h5>
                      <div className="bg-gray-800/50 rounded p-2 text-xs">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Method:</span>
                          <span className={`font-medium ${getTempoAdjustmentColor(rec.tempoAdjustment.method)}`}>
                            {rec.tempoAdjustment.method.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-400">Adjustment:</span>
                          <span className="text-white">
                            {rec.tempoAdjustment.adjustmentPercent > 0 ? '+' : ''}
                            {(rec.tempoAdjustment.adjustmentPercent * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">BPM:</span>
                          <span className="text-white">
                            {rec.tempoAdjustment.originalBPM.toFixed(1)} → {rec.tempoAdjustment.targetBPM.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Effects */}
                    {rec.effects.length > 0 && (
                      <div>
                        <h5 className="text-xs font-medium text-gray-300 mb-2">Recommended Effects</h5>
                        <div className="space-y-2">
                          {rec.effects.map((effect, i) => (
                            <div key={i} className="bg-gray-800/50 rounded p-2 text-xs">
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-400">Type:</span>
                                <span className="text-white font-medium">{effect.type}</span>
                              </div>
                              <div className="flex justify-between mb-1">
                                <span className="text-gray-400">Intensity:</span>
                                <span className="text-white">{Math.round(effect.intensity * 100)}%</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Timing:</span>
                                <span className="text-white">{effect.timing}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Compatibility Breakdown */}
                    <div>
                      <h5 className="text-xs font-medium text-gray-300 mb-2">Compatibility Breakdown</h5>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          { label: 'Harmonic', value: rec.compatibility.harmonic },
                          { label: 'Rhythmic', value: rec.compatibility.rhythmic },
                          { label: 'Energetic', value: rec.compatibility.energetic },
                          { label: 'Spectral', value: rec.compatibility.spectral }
                        ].map((item) => (
                          <div key={item.label} className="bg-gray-800/50 rounded p-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-gray-400">{item.label}:</span>
                              <span className="text-white font-medium">{Math.round(item.value * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1">
                              <div
                                className={`h-1 rounded-full ${
                                  item.value >= 0.8 ? 'bg-green-400' :
                                  item.value >= 0.6 ? 'bg-yellow-400' :
                                  item.value >= 0.4 ? 'bg-orange-400' : 'bg-red-400'
                                }`}
                                style={{ width: `${item.value * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium text-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRecommendation?.(rec);
                      }}
                    >
                      Apply This Mix
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MixRecommendationsPanel;