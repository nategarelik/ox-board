/**
 * Visual feedback system for gesture-to-stem mappings
 * Real-time display of active gestures, stem controls, and mapping status
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  GestureStemMapper,
  FeedbackState,
  GestureDetectionResult,
  GestureMapping,
  GestureType,
} from "../lib/gestures/gestureStemMapper";
import { StemType } from "../lib/audio/demucsProcessor";

interface GestureFeedbackProps {
  mapper: GestureStemMapper;
  isActive: boolean;
  channel?: number;
  showConfidence?: boolean;
  showLatency?: boolean;
  compactMode?: boolean;
  tutorialMode?: boolean;
  showGestureTrails?: boolean;
  showPredictions?: boolean;
  enableHapticPreview?: boolean;
}

interface AnimatedValue {
  current: number;
  target: number;
  velocity: number;
}

interface GestureTrailPoint {
  x: number;
  y: number;
  timestamp: number;
  gestureType: string;
  confidence: number;
}

interface TutorialStep {
  id: string;
  gestureType: string;
  instruction: string;
  targetValue?: number;
  duration: number;
  hints: string[];
}

interface TutorialSequence {
  id: string;
  name: string;
  description: string;
  steps: TutorialStep[];
  currentStep: number;
  isActive: boolean;
}

export function GestureFeedback({
  mapper,
  isActive,
  channel = 0,
  showConfidence = true,
  showLatency = true,
  compactMode = false,
  tutorialMode = false,
  showGestureTrails = true,
  showPredictions = false,
  enableHapticPreview = false,
}: GestureFeedbackProps) {
  const [feedbackState, setFeedbackState] = useState<FeedbackState | null>(
    null,
  );
  const [animatedValues, setAnimatedValues] = useState<
    Map<string, AnimatedValue>
  >(new Map());
  const [gestureTrails, setGestureTrails] = useState<
    Map<string, GestureTrailPoint[]>
  >(new Map());
  const [tutorialSequence, setTutorialSequence] =
    useState<TutorialSequence | null>(null);
  const [predictions, setPredictions] = useState<
    Map<string, { x: number; y: number; confidence: number }>
  >(new Map());
  const animationFrameRef = useRef<number>();

  // Move all hooks to the top before any early returns

  // Tutorial mode functions - moved up
  const startTutorial = useCallback((sequenceId: string) => {
    const tutorialSteps: TutorialStep[] = [
      {
        id: "pinch-tutorial",
        gestureType: "pinch",
        instruction:
          "Make a pinch gesture with your thumb and index finger to control effects",
        targetValue: 0.7,
        duration: 3000,
        hints: [
          "Bring thumb and index finger close together",
          "Maintain the pinch for effect intensity control",
        ],
      },
      // Fist gesture tutorial step: guides user to mute the active stem by making a fist
      {
        id: "fist-tutorial",
        gestureType: "fist",
        instruction: "Make a fist to mute the active stem",
        targetValue: 1.0,
        duration: 2000,
        hints: ["Close all fingers tightly", "Hold for mute activation"],
      },
      {
        id: "peace-tutorial",
        gestureType: "peace_sign",
        instruction: "Show peace sign to control drums volume",
        targetValue: 0.8,
        duration: 4000,
        hints: [
          "Extend index and middle fingers",
          "Move hand up/down for volume control",
        ],
      },
    ];

    const sequence: TutorialSequence = {
      id: sequenceId,
      name: "Basic Gestures Tutorial",
      description: "Learn the fundamental gestures for stem control",
      steps: tutorialSteps,
      currentStep: 0,
      isActive: true,
    };

    setTutorialSequence(sequence);
  }, []);

  const nextTutorialStep = useCallback(() => {
    if (!tutorialSequence) return;

    if (tutorialSequence.currentStep < tutorialSequence.steps.length - 1) {
      setTutorialSequence((prev) =>
        prev
          ? {
              ...prev,
              currentStep: prev.currentStep + 1,
            }
          : null,
      );
    } else {
      // Tutorial completed
      setTutorialSequence((prev) =>
        prev ? { ...prev, isActive: false } : null,
      );
    }
  }, [tutorialSequence]);

  const skipTutorial = useCallback(() => {
    setTutorialSequence(null);
  }, []);

  // Gesture trail management - moved up
  const updateGestureTrails = useCallback(
    (gestures: GestureDetectionResult[]) => {
      if (!showGestureTrails) return;

      setGestureTrails((prev) => {
        const next = new Map(prev);

        gestures.forEach((gesture) => {
          if (gesture.position) {
            const trail = next.get(gesture.gestureType) || [];
            const trailPoint: GestureTrailPoint = {
              x: gesture.position!.x,
              y: gesture.position!.y,
              timestamp: Date.now(),
              gestureType: gesture.gestureType,
              confidence: gesture.confidence,
            };

            trail.push(trailPoint);

            // Keep only recent points (last 2 seconds)
            const cutoffTime = Date.now() - 2000;
            const filteredTrail = trail.filter(
              (point) => point.timestamp > cutoffTime,
            );

            next.set(gesture.gestureType, filteredTrail);
          }
        });

        return next;
      });
    },
    [showGestureTrails],
  );

  // Gesture prediction visualization - moved up
  const updatePredictions = useCallback(
    (
      newPredictions: Map<string, { x: number; y: number; confidence: number }>,
    ) => {
      if (!showPredictions) return;
      setPredictions(newPredictions);
    },
    [showPredictions],
  );

  // Animation system for smooth value transitions
  useEffect(() => {
    if (!isActive) return;

    const animate = () => {
      setAnimatedValues((prev) => {
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
      feedback.activeMappings.forEach((mapping) => {
        const activeGesture = feedback.activeGestures.find(
          (g) => g.gestureType === mapping.gestureType,
        );
        if (activeGesture && activeGesture.value !== undefined) {
          setAnimatedValues((prev) => {
            const next = new Map(prev);
            const key = `${mapping.id}-value`;
            const existing = next.get(key) || {
              current: 0,
              target: 0,
              velocity: 0,
            };
            existing.target = activeGesture.value!;
            next.set(key, existing);
            return next;
          });
        }
      });

      // Update gesture trails when feedback updates
      updateGestureTrails(feedback.activeGestures);
    };

    mapper.on("feedbackUpdate", handleFeedbackUpdate);

    return () => {
      mapper.off("feedbackUpdate", handleFeedbackUpdate);
    };
  }, [mapper, updateGestureTrails]);

  if (!isActive || !feedbackState) {
    return null;
  }

  const getGestureIcon = (gestureType: GestureType): string => {
    switch (gestureType) {
      case GestureType.PEACE_SIGN:
        return "✌️";
      case GestureType.ROCK_SIGN:
        return "🤘";
      case GestureType.OK_SIGN:
        return "👌";
      case GestureType.CALL_SIGN:
        return "🤙";
      case GestureType.THUMBS_UP:
        return "👍";
      case GestureType.THUMBS_DOWN:
        return "👎";
      case GestureType.FIST:
        return "✊";
      case GestureType.OPEN_PALM:
        return "🖐️";
      case GestureType.PINCH:
        return "🤏";
      case GestureType.CLAP:
        return "👏";
      case GestureType.POINTING:
        return "👉";
      default:
        return "✋";
    }
  };

  const getStemIcon = (
    stemType: StemType | "original" | "crossfader" | "master",
  ): string => {
    switch (stemType) {
      case "drums":
        return "🥁";
      case "bass":
        return "🎸";
      case "melody":
        return "🎹";
      case "vocals":
        return "🎤";
      case "original":
        return "🎵";
      case "crossfader":
        return "🎛️";
      case "master":
        return "🔊";
      default:
        return "🎶";
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return "text-green-400";
    if (confidence >= 0.6) return "text-yellow-400";
    return "text-red-400";
  };

  const getLatencyColor = (latency: number): string => {
    if (latency <= 20) return "text-green-400";
    if (latency <= 50) return "text-yellow-400";
    return "text-red-400";
  };

  // Gesture trail rendering
  const renderGestureTrails = () => {
    if (!showGestureTrails || gestureTrails.size === 0) return null;

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      >
        {Array.from(gestureTrails.entries()).map(([gestureType, trail]) => (
          <g key={gestureType}>
            {trail.map((point, index) => {
              const opacity = (point.timestamp - Date.now() + 2000) / 2000; // Fade over 2 seconds
              const radius = Math.max(2, point.confidence * 6);

              return (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                  fill={getGestureColor(gestureType)}
                  opacity={Math.max(0, opacity)}
                />
              );
            })}
          </g>
        ))}
      </svg>
    );
  };

  const getGestureColor = (gestureType: string): string => {
    const colors: Record<string, string> = {
      pinch: "#3b82f6",
      fist: "#ef4444",
      palm_open: "#10b981",
      peace_sign: "#f59e0b",
      rock_sign: "#8b5cf6",
      swipe_horizontal: "#06b6d4",
      swipe_vertical: "#84cc16",
      spread: "#f97316",
      two_hand_pinch: "#ec4899",
    };
    return colors[gestureType] || "#6b7280";
  };

  // Tutorial mode rendering
  const renderTutorialMode = () => {
    if (!tutorialMode || !tutorialSequence || !tutorialSequence.isActive)
      return null;

    const currentStep = tutorialSequence.steps[tutorialSequence.currentStep];
    if (!currentStep) return null;

    return (
      <div className="absolute inset-0 bg-black/50 flex items-center justify-center pointer-events-auto">
        <div className="bg-gray-900 rounded-lg p-6 max-w-md mx-4 border border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Tutorial</h3>
            <button
              onClick={skipTutorial}
              className="text-gray-400 hover:text-white transition-colors"
            >
              Skip
            </button>
          </div>

          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-3xl">
                {getGestureIcon(currentStep.gestureType as GestureType)}
              </span>
              <div>
                <h4 className="text-white font-medium">
                  Step {tutorialSequence.currentStep + 1}
                </h4>
                <p className="text-gray-300 text-sm">
                  {currentStep.instruction}
                </p>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-3 mb-4">
              <p className="text-gray-400 text-sm mb-2">Tips:</p>
              <ul className="space-y-1">
                {currentStep.hints.map((hint, index) => (
                  <li
                    key={index}
                    className="text-gray-300 text-sm flex items-start space-x-2"
                  >
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>{hint}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">
                {tutorialSequence.currentStep + 1} of{" "}
                {tutorialSequence.steps.length}
              </div>
              <button
                onClick={nextTutorialStep}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                {tutorialSequence.currentStep >=
                tutorialSequence.steps.length - 1
                  ? "Complete"
                  : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Gesture prediction visualization
  const renderPredictions = () => {
    if (!showPredictions || predictions.size === 0) return null;

    return (
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: "100%", height: "100%" }}
      >
        {Array.from(predictions.entries()).map(([gestureType, prediction]) => (
          <g key={gestureType}>
            <circle
              cx={prediction.x}
              cy={prediction.y}
              r="8"
              fill="none"
              stroke={getGestureColor(gestureType)}
              strokeWidth="2"
              strokeDasharray="5,5"
              opacity={prediction.confidence}
            />
            <circle
              cx={prediction.x}
              cy={prediction.y}
              r="3"
              fill={getGestureColor(gestureType)}
              opacity={prediction.confidence}
            />
          </g>
        ))}
      </svg>
    );
  };

  const renderGestureIndicator = (
    gesture: GestureDetectionResult,
    index: number,
  ) => {
    const mapping = feedbackState.activeMappings.find(
      (m) => m.gestureType === gesture.gestureType,
    );
    const valueKey = mapping ? `${mapping.id}-value` : "";
    const animatedValue = valueKey ? animatedValues.get(valueKey) : null;

    return (
      <div
        key={`${gesture.gestureType}-${index}`}
        className="flex items-center space-x-2 bg-gray-800 rounded-lg p-3 border-l-4 border-blue-500"
      >
        <div className="text-2xl">{getGestureIcon(gesture.gestureType)}</div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-white truncate">
              {gesture.gestureType.replace(/_/g, " ").toUpperCase()}
            </span>
            <span
              className={`text-xs ${getConfidenceColor(gesture.confidence)}`}
            >
              {Math.round(gesture.confidence * 100)}%
            </span>
          </div>

          {mapping && (
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-lg">{getStemIcon(mapping.targetStem)}</span>
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
    const stems: Array<StemType | "original"> = [
      "drums",
      "bass",
      "melody",
      "vocals",
      "original",
    ];

    return (
      <div className="grid grid-cols-5 gap-2">
        {stems.map((stem) => {
          const isActive = feedbackState.stemIndicators[stem];
          const activeMappings = feedbackState.activeMappings.filter(
            (m) => m.targetStem === stem,
          );

          return (
            <div
              key={stem}
              className={`flex flex-col items-center p-3 rounded-lg border-2 transition-all duration-200 ${
                isActive
                  ? "border-blue-500 bg-blue-500/20 text-blue-300"
                  : "border-gray-600 bg-gray-800 text-gray-400"
              }`}
            >
              <div className="text-2xl mb-1">{getStemIcon(stem)}</div>
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
            <div
              className={`w-3 h-3 rounded-full ${
                feedbackState.activeGestures.length > 0
                  ? "bg-green-400"
                  : "bg-gray-600"
              }`}
            />
            <span className="text-sm text-gray-300">
              {feedbackState.activeGestures.length} gestures
            </span>
          </div>

          {showConfidence && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Confidence:</span>
              <span
                className={`text-sm font-medium ${getConfidenceColor(feedbackState.confidence)}`}
              >
                {Math.round(feedbackState.confidence * 100)}%
              </span>
            </div>
          )}

          {showLatency && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Latency:</span>
              <span
                className={`text-sm font-medium ${getLatencyColor(feedbackState.latency)}`}
              >
                {Math.round(feedbackState.latency)}ms
              </span>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-400">Channel {channel + 1}</div>
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
                <span className="text-xl">
                  {getGestureIcon(gesture.gestureType)}
                </span>
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
    <div className="relative bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      {/* Gesture Trails Overlay */}
      {renderGestureTrails()}

      {/* Gesture Predictions Overlay */}
      {renderPredictions()}

      {/* Tutorial Mode Overlay */}
      {renderTutorialMode()}

      {/* Main Content */}
      <div className="relative">
        {/* Header */}
        <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">
                Gesture Control
              </h3>
              <p className="text-sm text-gray-400">
                Real-time gesture to stem mapping
              </p>
            </div>
            {tutorialMode && !tutorialSequence?.isActive && (
              <button
                onClick={() => startTutorial("basic-gestures")}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors"
              >
                Start Tutorial
              </button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        <div className="p-4 border-b border-gray-700">{renderStatusBar()}</div>

        {/* Stem Indicators */}
        <div className="p-4 border-b border-gray-700">
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Active Stems
          </h4>
          {renderStemIndicators()}
        </div>

        {/* Active Gestures */}
        <div className="p-4">
          <h4 className="text-sm font-medium text-gray-300 mb-3">
            Active Gestures
          </h4>
          <div className="space-y-3">
            {feedbackState.activeGestures.length > 0 ? (
              feedbackState.activeGestures.map((gesture, index) => {
                return renderGestureIndicator(gesture, index);
              })
            ) : (
              <div className="text-center text-gray-500 py-8">
                <div className="text-4xl mb-2">👋</div>
                <p>Start making gestures to see them here</p>
                {tutorialMode && (
                  <button
                    onClick={() => startTutorial("basic-gestures")}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Learn Gestures
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GestureFeedback;
