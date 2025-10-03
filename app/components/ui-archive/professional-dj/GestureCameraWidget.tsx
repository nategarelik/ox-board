"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { Camera, CameraOff, Activity } from "lucide-react";

const CameraFeed = dynamic(() => import("../../Camera/CameraFeed"), {
  ssr: false,
});

interface GestureCameraWidgetProps {
  onHandsDetected: (hands: any[]) => void;
  enabled: boolean;
}

export default function GestureCameraWidget({
  onHandsDetected,
  enabled,
}: GestureCameraWidgetProps) {
  return (
    <div className="relative w-full h-full bg-black/60 rounded-lg overflow-hidden">
      {enabled ? (
        <>
          <CameraFeed
            onHandsDetected={onHandsDetected}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 bg-green-500/20 rounded-full border border-green-500/40">
            <Activity className="w-3 h-3 text-green-400 animate-pulse" />
            <span className="text-xs text-green-400">Active</span>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-gray-500">
          <CameraOff className="w-12 h-12 mb-2" />
          <p className="text-sm">Camera Disabled</p>
          <p className="text-xs text-gray-600 mt-1">
            Press &apos;G&apos; to enable
          </p>
        </div>
      )}

      {/* Gesture Indicators */}
      {enabled && (
        <div className="absolute bottom-2 left-2 right-2 flex justify-between text-xs">
          <div className="flex items-center gap-1">
            <div className="w-6 h-6 rounded bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <span className="text-cyan-400">L</span>
            </div>
            <span className="text-gray-400">Left Hand</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-400">Right Hand</span>
            <div className="w-6 h-6 rounded bg-magenta-500/20 border border-magenta-500/40 flex items-center justify-center">
              <span className="text-magenta-400">R</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
