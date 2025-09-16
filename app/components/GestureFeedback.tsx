/**
 * Visual feedback system for gesture-to-stem mappings
 * Real-time display of active gestures, stem controls, and mapping status
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GestureStemMapper, FeedbackState, GestureDetectionResult, GestureMapping, GestureType } from '../lib/gestures/gestureStemMapper';
import { StemType } from '../lib/audio/demucsProcessor';

interface GestureFeedbackProps {
  mapper: GestureStemMapper;
  isActive: boolean;
  channel?: number;
  showConfidence?: boolean;
  showLatency?: boolean;
  compactMode?: boolean;
}

interface AnimatedValue {
  current: number;
  target: number;
  velocity: number;
}

export function GestureFeedback({
  mapper,
  isActive,
  channel = 0,
  showConfidence = true,
  showLatency = true,
  compactMode = false
}: GestureFeedbackProps) {
  const [feedbackState, setFeedbackState] = useState<FeedbackState | null>(null);
  const [animatedValues, setAnimatedValues] = useState<Map<string, AnimatedValue>>(new Map());
  const animationFrameRef = useRef<number>();

  // Animation system for smooth value transitions
  useEffect(() => {
    if (!isActive) return;

    const animate = () => {
      setAnimatedValues(prev => {
        const next = new Map(prev);
        let hasChanges = false;

        next.forEach((value, key) => {
          const diff = value.target - value.current;
          if (Math.abs(diff) > 0.001) {
            value.velocity += diff * 0.15;
            value.velocity *= 0.85;
            value.current += value.velocity;
            hasChanges = true;
          }
        });

        if (hasChanges) {
          animationFrameRef.current = requestAnimationFrame(animate);
        }

        return next;
      });
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive]);

  // Subscribe to mapper feedback updates
  useEffect(() => {
    if (!mapper) return;

    const handleFeedbackUpdate = (feedback: FeedbackState) => {
      setFeedbackState(feedback);

      // Update animated values for control visualization
      feedback.activeMappings.forEach(mapping => {
        const activeGesture = feedback.activeGestures.find(g => g.gestureType === mapping.gestureType);
        if (activeGesture && activeGesture.value !== undefined) {
          setAnimatedValues(prev => {
            const next = new Map(prev);
            const key = `${mapping.id}-value`;
            const existing = next.get(key) || { current: 0, target: 0, velocity: 0 };
            existing.target = activeGesture.value;
            next.set(key, existing);
            return next;
          });
        }
      });
    };

    mapper.on('feedbackUpdate', handleFeedbackUpdate);

    return () => {
      mapper.off('feedbackUpdate', handleFeedbackUpdate);
    };
  }, [mapper]);

  if (!isActive || !feedbackState) {
    return null;
  }

  const getGestureIcon = (gestureType: GestureType): string => {
    switch (gestureType) {
      case GestureType.PEACE_SIGN: return '✌️';
      case GestureType.ROCK_SIGN: return '🤘';
      case GestureType.OK_SIGN: return '👌';
      case GestureType.CALL_SIGN: return '🤙';
      case GestureType.THUMBS_UP: return '👍';
      case GestureType.THUMBS_DOWN: return '👎';
      case GestureType.FIST: return '✊';
      case GestureType.OPEN_PALM: return '🖐️';
      case GestureType.PINCH: return '🤏';
      case GestureType.CLAP: return '👏';
      case GestureType.POINTING: return '👉';
      default: return '✋';
    }
  };

  const getStemIcon = (stemType: StemType | 'original' | 'crossfader' | 'master'): string => {
    switch (stemType) {
      case 'drums': return '🥁';
      case 'bass': return '🎸';
      case 'melody': return '🎹';
      case 'vocals': return '🎤';
      case 'original': return '🎵';
      case 'crossfader': return '🎛️';
      case 'master': return '🔊';
      default: return '🎶';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-400';
    if (confidence >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getLatencyColor = (latency: number): string => {
    if (latency <= 20) return 'text-green-400';
    if (latency <= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const renderGestureIndicator = (gesture: GestureDetectionResult, index: number) => {
    const mapping = feedbackState.activeMappings.find(m => m.gestureType === gesture.gestureType);
    const valueKey = mapping ? `${mapping.id}-value` : '';
    const animatedValue = valueKey ? animatedValues.get(valueKey) : null;

    return (
      <div
        key={`${gesture.gestureType}-${index}`}
        className="flex items-center space-x-2 bg-gray-800 rounded-lg p-3 border-l-4 border-blue-500"
      >
        <div className="text-2xl">
          {getGestureIcon(gesture.gestureType)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white truncate">
              {gesture.gestureType.replace(/_/g, ' ').toUpperCase()}
            </span>
            <span className={`text-xs ${getConfidenceColor(gesture.confidence)}`}>
              {Math.round(gesture.confidence * 100)}%
            </span>
          </div>

          {mapping && (
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-lg">
                {getStemIcon(mapping.targetStem)}
              </span>
              <span className="text-xs text-gray-400">
                {mapping.targetStem} → {mapping.controlType}
              </span>
            </div>
          )}

          {animatedValue && (
            <div className="mt-2">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-75"
                  style={{ width: `${(animatedValue.current || 0) * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Value: {Math.round((animatedValue.current || 0) * 100)}%
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStemIndicators = () => {
    const stems: Array<StemType | 'original'> = ['drums', 'bass', 'melody', 'vocals', 'original'];

    return (
      <div className="grid grid-cols-5 gap-2">
        {stems.map(stem => {
          const isActive = feedbackState.stemIndicators[stem];
          const activeMappings = feedbackState.activeMappings.filter(m => m.targetStem === stem);

          return (
            <div
              key={stem}
              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 ${
                isActive
                  ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                  : 'border-gray-600 bg-gray-800 text-gray-400'
              }`}
            >
              <div className="text-2xl mb-1">
                {getStemIcon(stem)}
              </div>
              <div className="text-xs font-medium text-center">
                {stem.toUpperCase()}
              </div>
              {activeMappings.length > 0 && (
                <div className="text-xs text-blue-400 mt-1">
                  {activeMappings.length} active
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderStatusBar = () => {
    return (
      <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              feedbackState.activeGestures.length > 0 ? 'bg-green-400' : 'bg-gray-600'
            }`} />
            <span className="text-sm text-gray-300">
              {feedbackState.activeGestures.length} gestures
            </span>
          </div>

          {showConfidence && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Confidence:</span>
              <span className={`text-sm font-medium ${getConfidenceColor(feedbackState.confidence)}`}>
                {Math.round(feedbackState.confidence * 100)}%
              </span>
            </div>
          )}

          {showLatency && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Latency:</span>
              <span className={`text-sm font-medium ${getLatencyColor(feedbackState.latency)}`}>
                {Math.round(feedbackState.latency)}ms
              </span>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-400">
          Channel {channel + 1}
        </div>
      </div>
    );
  };

  if (compactMode) {
    return (
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {feedbackState.activeGestures.slice(0, 3).map((gesture, index) => (
              <div key={index} className="flex items-center space-x-1">
                <span className="text-xl">{getGestureIcon(gesture.gestureType)}</span>
                <span className="text-xs text-gray-400">
                  {Math.round(gesture.confidence * 100)}%
                </span>
              </div>
            ))}
            {feedbackState.activeGestures.length > 3 && (
              <span className="text-xs text-gray-500">
                +{feedbackState.activeGestures.length - 3} more
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs text-gray-400">
            {showLatency && (
              <span className={getLatencyColor(feedbackState.latency)}>
                {Math.round(feedbackState.latency)}ms
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white">Gesture Control</h3>
        <p className="text-sm text-gray-400">Real-time gesture to stem mapping</p>
      </div>

      {/* Status Bar */}
      <div className="p-4 border-b border-gray-700">
        {renderStatusBar()}
      </div>

      {/* Stem Indicators */}
      <div className="p-4 border-b border-gray-700">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Active Stems</h4>
        {renderStemIndicators()}
      </div>

      {/* Active Gestures */}
      <div className="p-4">
        <h4 className="text-sm font-medium text-gray-300 mb-3">Active Gestures</h4>
        <div className="space-y-3">
          {feedbackState.activeGestures.length > 0 ? (
            feedbackState.activeGestures.map((gesture, index) =>
              renderGestureIndicator(gesture, index)
            )
          ) : (
            <div className="text-center text-gray-500 py-8">
              <div className="text-4xl mb-2">👋</div>
              <p>Start making gestures to see them here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GestureFeedback;