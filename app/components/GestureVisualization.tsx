"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Eye, EyeOff, RotateCcw, Zap, Target } from "lucide-react";
import { GestureData, GesturePerformanceMetrics } from "../hooks/useGestures";

interface GestureVisualizationProps {
  gestureData?: GestureData | null;
  isProcessing?: boolean;
  performanceMetrics?: GesturePerformanceMetrics;
  className?: string;
  showTutorial?: boolean;
  onTutorialToggle?: (show: boolean) => void;
  onCalibrate?: () => void;
}

interface TrailPoint {
  x: number;
  y: number;
  timestamp: number;
  gesture: string;
}

const GESTURE_COLORS = {
  PINCH: "#00ff88",
  FIST: "#ff4444",
  PALM_OPEN: "#0088ff",
  PEACE_SIGN: "#ff8800",
  SWIPE_HORIZONTAL: "#ff00ff",
  SWIPE_VERTICAL: "#ffff00",
  SPREAD: "#88ff00",
  TWO_HAND_PINCH: "#ff0088",
  FINGER_COUNT: "#00ffff",
};

const LANDMARK_CONNECTIONS = [
  // Thumb
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  // Index finger
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  // Middle finger
  [0, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  // Ring finger
  [0, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  // Pinky
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
  // Palm
  [0, 5],
  [5, 9],
  [9, 13],
  [13, 17],
];

export default function GestureVisualization({
  gestureData,
  isProcessing = false,
  performanceMetrics,
  className = "",
  showTutorial = false,
  onTutorialToggle,
  onCalibrate,
}: GestureVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const trailPointsRef = useRef<TrailPoint[]>([]);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 640, height: 480 });

  // Handle canvas resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setCanvasSize({ width: rect.width, height: rect.height });
      }
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, []);

  const drawGestureIndicators = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    if (!gestureData?.gestures) return;

    gestureData.gestures.forEach((gesture, index) => {
      const color =
        GESTURE_COLORS[
          gesture.type as unknown as keyof typeof GESTURE_COLORS
        ] || GESTURE_COLORS.PINCH;
      const y = 30 + index * 25;

      // Gesture name
      ctx.fillStyle = color;
      ctx.font = "14px Inter, sans-serif";
      ctx.fillText(gesture.type, 10, y);

      // Confidence bar
      const barWidth = 100;
      const barHeight = 8;
      const confidenceWidth = barWidth * gesture.confidence;

      ctx.fillStyle = `${color}40`;
      ctx.fillRect(120, y - 6, barWidth, barHeight);

      ctx.fillStyle = color;
      ctx.fillRect(120, y - 6, confidenceWidth, barHeight);

      // Confidence percentage
      ctx.fillStyle = "#ffffff";
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText(`${Math.round(gesture.confidence * 100)}%`, 230, y);
    });
  };

  const drawDebugOverlay = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    if (!performanceMetrics) return;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(10, height - 80, 200, 70);

    ctx.fillStyle = "#ffffff";
    ctx.font = "12px Inter, sans-serif";

    let y = height - 60;
    ctx.fillText(
      `Latency: ${Math.round(performanceMetrics.averageLatency)}ms`,
      15,
      y,
    );
    y += 15;
    ctx.fillText(`FPS: ${Math.round(performanceMetrics.frameRate)}`, 15, y);
    y += 15;
    ctx.fillText(
      `Accuracy: ${Math.round(performanceMetrics.gestureAccuracy * 100)}%`,
      15,
      y,
    );
    y += 15;
    ctx.fillText(
      `Memory: ${Math.round(performanceMetrics.memoryUsage)}MB`,
      15,
      y,
    );

    ctx.restore();
  };

  const drawVisualization = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvasSize;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw trail effect
    drawTrailEffect(ctx, width, height);

    // Draw hand landmarks
    if (gestureData) {
      drawHandLandmarks(ctx, gestureData.leftHand, "left", width, height);
      drawHandLandmarks(ctx, gestureData.rightHand, "right", width, height);

      // Draw gesture indicators
      drawGestureIndicators(ctx, width, height);
    }

    // Draw confidence overlay
    if (showDebugInfo && gestureData) {
      drawDebugOverlay(ctx, width, height);
    }
  }, [
    canvasSize,
    gestureData,
    showDebugInfo,
    drawDebugOverlay,
    drawGestureIndicators,
  ]);

  // Animation loop for continuous gesture visualization
  useEffect(() => {
    if (!canvasRef.current || !gestureData) return;

    let animationFrameRef = { current: 0 };

    const animate = () => {
      if (canvasRef.current && gestureData) {
        drawVisualization();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const cleanup = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    animate();
    return cleanup;
  }, [gestureData, drawVisualization]);

  // Add new trail points when gestures are detected
  const drawTrailEffect = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
  ) => {
    const now = Date.now();
    const trailDuration = 2000; // 2 seconds

    trailPointsRef.current.forEach((point, index) => {
      const age = now - point.timestamp;
      const alpha = Math.max(0, 1 - age / trailDuration);

      if (alpha > 0) {
        ctx.save();
        ctx.globalAlpha = alpha;

        // Create gradient for trail
        const gradient = ctx.createRadialGradient(
          point.x,
          point.y,
          0,
          point.x,
          point.y,
          20,
        );
        gradient.addColorStop(
          0,
          `${GESTURE_COLORS.PINCH}${Math.floor(alpha * 255)
            .toString(16)
            .padStart(2, "0")}`,
        );
        gradient.addColorStop(1, "transparent");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 20, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    });
  };

  const drawHandLandmarks = (
    ctx: CanvasRenderingContext2D,
    hand: any[] | null,
    handType: "left" | "right",
    width: number,
    height: number,
  ) => {
    if (!hand || hand.length < 21) return;

    ctx.save();

    // Draw connections first (behind landmarks)
    ctx.strokeStyle = handType === "left" ? "#00ff88" : "#0088ff";
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6;

    LANDMARK_CONNECTIONS.forEach(([start, end]) => {
      const startPoint = hand[start];
      const endPoint = hand[end];

      if (startPoint && endPoint) {
        ctx.beginPath();
        ctx.moveTo(startPoint.x * width, startPoint.y * height);
        ctx.lineTo(endPoint.x * width, endPoint.y * height);
        ctx.stroke();
      }
    });

    // Draw landmarks
    ctx.globalAlpha = 1;
    hand.forEach((landmark, index) => {
      if (landmark) {
        const x = landmark.x * width;
        const y = landmark.y * height;

        // Different colors for different landmark types
        let color = "#ffffff";
        if (index === 0)
          color = "#ff4444"; // Wrist
        else if (index >= 1 && index <= 4)
          color = "#ff8800"; // Thumb
        else if (index >= 5 && index <= 8)
          color = "#00ff88"; // Index
        else if (index >= 9 && index <= 12)
          color = "#0088ff"; // Middle
        else if (index >= 13 && index <= 16)
          color = "#ff00ff"; // Ring
        else if (index >= 17 && index <= 20) color = "#ffff00"; // Pinky

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Add glow effect
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    });

    ctx.restore();
  };

  const toggleDebugInfo = () => {
    setShowDebugInfo(!showDebugInfo);
  };

  return (
    <div
      className={`relative bg-black/40 rounded-lg overflow-hidden ${className}`}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{ aspectRatio: "4/3" }}
      />

      {/* Processing Indicator */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-4 right-4"
          >
            <div className="flex items-center space-x-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"
              />
              <span className="text-xs text-blue-400">Processing</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gesture Confidence */}
      {gestureData && gestureData.confidence > 0 && (
        <div className="absolute top-4 left-4">
          <div className="flex items-center space-x-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-green-400">
              {Math.round(gestureData.confidence * 100)}% Confidence
            </span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex flex-col space-y-2">
        <button
          onClick={toggleDebugInfo}
          className={`p-2 rounded-lg transition-all ${
            showDebugInfo
              ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
              : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
          }`}
          title="Toggle Debug Info"
        >
          <Eye className="w-4 h-4" />
        </button>

        {onCalibrate && (
          <button
            onClick={onCalibrate}
            className="p-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/30 rounded-lg transition-all"
            title="Calibrate Gestures"
          >
            <Target className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => (trailPointsRef.current = [])}
          className="p-2 bg-white/10 text-white/70 hover:bg-white/20 hover:text-white rounded-lg transition-all"
          title="Clear Trails"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Tutorial Mode Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 flex items-center justify-center"
          >
            <div className="text-center text-white">
              <Camera className="w-16 h-16 mx-auto mb-4 text-cyan-400" />
              <h3 className="text-xl font-semibold mb-2">Gesture Tutorial</h3>
              <p className="text-white/70 mb-4">
                Make different hand gestures to see them visualized
              </p>
              <div className="flex justify-center space-x-4 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-pink-400 rounded-full"></div>
                  <span>Pinch</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span>Fist</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span>Open Palm</span>
                </div>
              </div>
              {onTutorialToggle && (
                <button
                  onClick={() => onTutorialToggle(false)}
                  className="mt-6 px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-all"
                >
                  Start Using Gestures
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Camera Feed Placeholder */}
      {!gestureData && !isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center text-white/60">
          <div className="text-center">
            <Camera className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">
              Enable camera to start gesture recognition
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
