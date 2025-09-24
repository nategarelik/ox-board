"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import Script from "next/script";

declare global {
  interface Window {
    Hands: any;
    Camera: any;
  }
}

interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

interface Hand {
  landmarks: HandLandmark[];
  handedness: "Left" | "Right";
  score: number;
}

interface CameraFeedProps {
  onHandsDetected?: (hands: Hand[]) => void;
  onCameraReady?: () => void;
  onError?: (error: string) => void;
  className?: string;
  showOverlay?: boolean;
}

export default function CameraFeed({
  onHandsDetected,
  onCameraReady,
  onError,
  className = "",
  showOverlay = true,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [scriptsLoaded, setScriptsLoaded] = useState(false);

  // MediaPipe configuration
  const handsConfig = useMemo(
    () => ({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    }),
    [],
  );

  // Draw hand connections (simplified version)
  const drawHandConnections = (
    ctx: CanvasRenderingContext2D,
    landmarks: any[],
    width: number,
    height: number,
    handedness: string,
  ) => {
    // Simplified hand connections - just draw basic hand shape
    if (landmarks.length < 21) return;

    // Draw palm connections
    const palmPoints = [0, 5, 9, 13, 17, 0]; // Thumb to pinky back to thumb
    ctx.strokeStyle = handedness === "Right" ? "#FF0000" : "#00FF00";
    ctx.lineWidth = 2;
    ctx.beginPath();

    palmPoints.forEach((point, index) => {
      const x = landmarks[point].x * width;
      const y = landmarks[point].y * height;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  };

  // Draw hand landmarks and connections
  const drawHands = useCallback((results: any) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw hand landmarks
    if (results.multiHandLandmarks) {
      results.multiHandLandmarks.forEach((hand: any, handIndex: number) => {
        // Swap handedness for display to match the corrected detection
        const originalHandedness = results.multiHandedness[handIndex]?.label;
        const handedness = originalHandedness === "Left" ? "Right" : "Left";

        // Draw landmarks
        hand.forEach((landmark: any) => {
          const x = landmark.x * canvas.width;
          const y = landmark.y * canvas.height;

          ctx.beginPath();
          ctx.arc(x, y, 3, 0, 2 * Math.PI);
          ctx.fillStyle = handedness === "Right" ? "#FF0000" : "#00FF00";
          ctx.fill();
        });

        // Draw connections
        drawHandConnections(ctx, hand, canvas.width, canvas.height, handedness);
      });
    }
  }, []);

  // Initialize MediaPipe Hands
  const initializeMediaPipe = useCallback(async () => {
    // Prevent re-initialization if already initialized
    if (isInitialized || handsRef.current || cameraRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Wait for scripts to load
      if (!scriptsLoaded) {
        console.log("Waiting for MediaPipe scripts to load...");
        return;
      }

      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      // Check if MediaPipe is loaded
      if (!window.Hands || !window.Camera) {
        throw new Error("MediaPipe not loaded. Please refresh the page.");
      }

      // Create Hands instance using window object
      const hands = new window.Hands(handsConfig);

      // Configure hands detection
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1, // 0=Lite, 1=Full (use 1 for better accuracy)
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
        selfieMode: true, // Mirror image for user
      });

      // Set up results callback
      hands.onResults((results: any) => {
        if (onHandsDetected && results.multiHandLandmarks) {
          const detectedHands: Hand[] = results.multiHandLandmarks.map(
            (landmarks: any[], index: number) => ({
              landmarks: landmarks.map((landmark) => ({
                x: landmark.x,
                y: landmark.y,
                z: landmark.z,
              })),
              // Swap handedness because MediaPipe uses mirror view
              handedness:
                results.multiHandedness[index]?.label === "Left"
                  ? "Right"
                  : "Left",
              score: results.multiHandedness[index]?.score || 0,
            }),
          );
          onHandsDetected(detectedHands);
        }

        // Draw hand landmarks on canvas
        drawHands(results);
      });

      // Create camera instance using window object
      const camera = new window.Camera(videoRef.current, {
        onFrame: async () => {
          if (hands && videoRef.current) {
            await hands.send({ image: videoRef.current });
          }
        },
        width: 1280,
        height: 720,
        facingMode: "user",
      });

      handsRef.current = hands;
      cameraRef.current = camera;

      // Start camera
      await camera.start();

      setIsInitialized(true);
      setIsLoading(false);
      onCameraReady?.();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize camera";
      console.error("Camera error:", errorMessage);
      setError(errorMessage);
      setIsLoading(false);
      onError?.(errorMessage);
    }
  }, [
    scriptsLoaded,
    isInitialized,
    drawHands,
    handsConfig,
    onCameraReady,
    onError,
    onHandsDetected,
  ]);

  // Initialize when scripts are loaded
  useEffect(() => {
    if (scriptsLoaded && !isInitialized) {
      initializeMediaPipe();
    }
  }, [scriptsLoaded, isInitialized, initializeMediaPipe]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, []);

  return (
    <>
      {/* Load MediaPipe scripts */}
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("MediaPipe Hands loaded");
        }}
      />
      <Script
        src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log("MediaPipe Camera Utils loaded");
          setScriptsLoaded(true);
        }}
      />

      <div className={`relative w-full h-full ${className}`}>
        {/* Video element (hidden, used for MediaPipe processing) */}
        <video ref={videoRef} className="hidden" playsInline muted />

        {/* Canvas for displaying video and hand landmarks */}
        <canvas
          ref={canvasRef}
          className="w-full h-full object-cover rounded-lg"
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-ox-background/80 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-ox-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-ox-primary font-mono text-sm">
                {scriptsLoaded
                  ? "Initializing Camera..."
                  : "Loading MediaPipe..."}
              </p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 bg-ox-error/20 flex items-center justify-center rounded-lg">
            <div className="text-center">
              <div className="w-8 h-8 mx-auto mb-4">
                <svg
                  className="w-full h-full text-ox-error"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <p className="text-ox-error font-mono text-sm">{error}</p>
              <button
                onClick={() => {
                  setIsInitialized(false);
                  handsRef.current = null;
                  cameraRef.current = null;
                  initializeMediaPipe();
                }}
                className="mt-2 px-4 py-2 bg-ox-error text-white rounded text-xs hover:bg-red-600 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Status indicator */}
        {isInitialized && !error && (
          <div className="absolute top-2 right-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-ox-success animate-pulse"></div>
            <span className="text-xs text-ox-success font-mono">
              Hand Tracking Active
            </span>
          </div>
        )}
      </div>
    </>
  );
}
