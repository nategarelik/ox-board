'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { IntelligentMixAssistant, TransitionRecommendation, TrackAnalysis, CompatibilityScore } from '../../lib/ai/mixAssistant';
import { CompatibilityVisualizer } from './CompatibilityVisualizer';
import { MixRecommendationsPanel } from './MixRecommendationsPanel';
import { CamelotWheelVisualizer } from './CamelotWheelVisualizer';

interface MixAssistantDashboardProps {
  currentTrackId?: string;
  currentTime?: number;
  availableTrackIds?: string[];
  onApplyMix?: (recommendation: TransitionRecommendation) => void;
  className?: string;
}

/**
 * Main dashboard for the Intelligent Mix Assistant
 * Provides real-time mixing suggestions, compatibility analysis, and harmonic guidance
 */
export const MixAssistantDashboard: React.FC<MixAssistantDashboardProps> = ({
  currentTrackId,
  currentTime = 0,
  availableTrackIds = [],
  onApplyMix,
  className = ''
}) => {
  const [mixAssistant] = useState(() => new IntelligentMixAssistant());
  const [isInitialized, setIsInitialized] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for analysis results
  const [currentTrackAnalysis, setCurrentTrackAnalysis] = useState<TrackAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<TransitionRecommendation[]>([]);
  const [selectedCompatibility, setSelectedCompatibility] = useState<CompatibilityScore | null>(null);
  const [compatibleKeys, setCompatibleKeys] = useState<string[]>([]);

  // Initialize mix assistant
  useEffect(() => {
    const initializeMixAssistant = async () => {
      try {
        setLoading(true);
        await mixAssistant.initialize();
        setIsInitialized(true);
      } catch (err) {
        setError('Failed to initialize mix assistant');
        console.error('Mix Assistant initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeMixAssistant();

    return () => {
      mixAssistant.destroy();
    };
  }, [mixAssistant]);

  // Analyze current track
  const analyzeCurrentTrack = useCallback(async (trackId: string, audioBuffer: Float32Array) => {
    if (!isInitialized) return;

    try {
      setLoading(true);
      const analysis = await mixAssistant.analyzeTrack(trackId, audioBuffer);
      setCurrentTrackAnalysis(analysis);

      // Find compatible keys for Camelot wheel visualization
      const currentKey = `${analysis.key.key} ${analysis.key.scale}`;
      const compatible: string[] = [];

      // Test all possible keys for compatibility
      const allKeys = [
        'C major', 'A minor', 'G major', 'E minor', 'D major', 'B minor',
        'A major', 'F# minor', 'E major', 'C# minor', 'B major', 'G# minor',
        'F# major', 'D# minor', 'C# major', 'A# minor', 'G# major', 'F minor',
        'D# major', 'C minor', 'A# major', 'G minor', 'F major', 'D minor'
      ];

      for (const key of allKeys) {
        if (key !== currentKey && mixAssistant.isCompatibleKey(currentKey, key)) {
          compatible.push(key.split(' ')[0] + (key.includes('minor') ? 'm' : ''));
        }
      }

      setCompatibleKeys(compatible);
    } catch (err) {
      setError('Failed to analyze track');
      console.error('Track analysis error:', err);
    } finally {
      setLoading(false);
    }
  }, [mixAssistant, isInitialized]);

  // Get real-time recommendations
  const updateRecommendations = useCallback(async () => {
    if (!isInitialized || !currentTrackId || availableTrackIds.length === 0) {
      setRecommendations([]);
      return;
    }

    try {
      const newRecommendations = mixAssistant.getRealTimeMixSuggestions(
        currentTrackId,
        currentTime,
        availableTrackIds
      );
      setRecommendations(newRecommendations);
    } catch (err) {
      console.error('Failed to get recommendations:', err);
    }
  }, [mixAssistant, isInitialized, currentTrackId, currentTime, availableTrackIds]);

  // Update recommendations when tracks or time changes
  useEffect(() => {
    updateRecommendations();
  }, [updateRecommendations]);

  // Handle recommendation selection
  const handleRecommendationSelect = useCallback((recommendation: TransitionRecommendation) => {
    setSelectedCompatibility(recommendation.compatibility);
    onApplyMix?.(recommendation);
  }, [onApplyMix]);

  // Mock function to simulate track loading (would be replaced with actual audio loading)
  const handleTrackLoad = useCallback(async (trackId: string) => {
    // In a real implementation, this would load the audio file and extract the audio buffer
    // For now, we'll create a mock audio buffer
    const mockAudioBuffer = new Float32Array(44100 * 30); // 30 seconds of silence

    // Fill with some mock audio data for demonstration
    for (let i = 0; i < mockAudioBuffer.length; i++) {
      mockAudioBuffer[i] = Math.sin(2 * Math.PI * 440 * i / 44100) * 0.1; // 440Hz sine wave
    }

    await analyzeCurrentTrack(trackId, mockAudioBuffer);
  }, [analyzeCurrentTrack]);

  if (loading && !isInitialized) {
    return (
      <div className={`bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700 p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Initializing Mix Assistant...</p>
        </div>
      </div>
    );
  }

  if (error && !isInitialized) {
    return (
      <div className={`bg-gray-900/50 backdrop-blur-sm rounded-lg border border-red-700 p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-400 text-4xl mb-4">⚠️</div>
          <p className="text-red-400 font-medium mb-2">Mix Assistant Error</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">🎧 Intelligent Mix Assistant</h2>
            <p className="text-sm text-gray-400 mt-1">
              Algorithmic mixing intelligence using harmonic analysis and beat matching
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {currentTrackId && (
              <button
                onClick={() => handleTrackLoad(currentTrackId)}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-sm font-medium rounded transition-colors"
              >
                {loading ? 'Analyzing...' : 'Analyze Track'}
              </button>
            )}
            <div className={`w-3 h-3 rounded-full ${isInitialized ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
        </div>

        {/* Current track info */}
        {currentTrackAnalysis && (
          <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Current Track Analysis</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-gray-400">BPM:</span>
                <div className="text-white font-medium">{currentTrackAnalysis.bpm.bpm.toFixed(1)}</div>
              </div>
              <div>
                <span className="text-gray-400">Key:</span>
                <div className="text-white font-medium">
                  {currentTrackAnalysis.key.key} {currentTrackAnalysis.key.scale}
                </div>
              </div>
              <div>
                <span className="text-gray-400">Energy:</span>
                <div className="text-white font-medium">
                  {Math.round(currentTrackAnalysis.energyProfile.overall * 100)}%
                </div>
              </div>
              <div>
                <span className="text-gray-400">Mix Points:</span>
                <div className="text-white font-medium">{currentTrackAnalysis.mixPoints.length}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left column - Recommendations */}
        <div className="xl:col-span-2">
          <MixRecommendationsPanel
            recommendations={recommendations}
            onSelectRecommendation={handleRecommendationSelect}
          />
        </div>

        {/* Right column - Camelot Wheel */}
        <div>
          <CamelotWheelVisualizer
            currentKey={currentTrackAnalysis ? {
              key: currentTrackAnalysis.key.key,
              scale: currentTrackAnalysis.key.scale
            } : undefined}
            compatibleKeys={compatibleKeys}
          />
        </div>
      </div>

      {/* Bottom section - Compatibility Analysis */}
      {selectedCompatibility && (
        <CompatibilityVisualizer compatibility={selectedCompatibility} />
      )}

      {/* Status indicators */}
      <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg border border-gray-700 p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">System Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isInitialized ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-gray-400">Mix Assistant</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${currentTrackAnalysis ? 'bg-green-400' : 'bg-gray-400'}`} />
            <span className="text-gray-400">Track Analysis</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${recommendations.length > 0 ? 'bg-green-400' : 'bg-gray-400'}`} />
            <span className="text-gray-400">Recommendations</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${compatibleKeys.length > 0 ? 'bg-green-400' : 'bg-gray-400'}`} />
            <span className="text-gray-400">Harmonic Analysis</span>
          </div>
        </div>
      </div>
    </div>
  );
};