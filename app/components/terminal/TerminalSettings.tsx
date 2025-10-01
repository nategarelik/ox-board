"use client";

import React, { useState } from "react";
import {
  Settings,
  Sliders,
  Camera,
  Cpu,
  Save,
  RotateCcw,
  Monitor,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/terminal/TerminalCard";

export function TerminalSettings() {
  const [settings, setSettings] = useState({
    audioLatency: 20,
    bufferSize: 2048,
    gestureSmoothing: 0.3,
    gestureSensitivity: 0.7,
    cameraFPS: 30,
    enableStemSeparation: true,
    enableGestureControl: true,
    darkMode: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updateSetting = (key: keyof typeof settings, value: number) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-2 border-green-500/50 bg-black/60 p-4">
        <h1 className="text-2xl font-bold text-green-400 tracking-wider font-mono">
          SYSTEM_SETTINGS
        </h1>
        <p className="text-green-600 text-sm mt-1 font-mono">
          CONFIGURATION // SYSTEM PARAMETERS
        </p>
      </div>

      {/* Audio Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sliders className="w-5 h-5" />
            AUDIO_ENGINE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Audio Latency */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-green-600 font-mono text-sm">
              <span>TARGET_LATENCY</span>
              <span className="text-green-400">{settings.audioLatency}ms</span>
            </div>
            <input
              type="range"
              min="10"
              max="50"
              value={settings.audioLatency}
              onChange={(e) =>
                updateSetting("audioLatency", parseInt(e.target.value))
              }
              className="w-full h-2 bg-black border-2 border-green-700 appearance-none
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-green-400
                       [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-green-500"
            />
            <div className="flex justify-between text-xs text-green-700 font-mono">
              <span>LOW (10ms)</span>
              <span>HIGH (50ms)</span>
            </div>
          </div>

          {/* Buffer Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-green-600 font-mono text-sm">
              <span>BUFFER_SIZE</span>
              <span className="text-green-400">
                {settings.bufferSize} samples
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[512, 1024, 2048, 4096].map((size) => (
                <button
                  key={size}
                  onClick={() => updateSetting("bufferSize", size)}
                  className={`border-2 py-2 font-mono text-sm transition-all duration-200 ${
                    settings.bufferSize === size
                      ? "border-green-500 bg-green-500/20 text-green-400"
                      : "border-green-700 bg-black/60 text-green-600 hover:border-green-500"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Stem Separation Toggle */}
          <div className="flex items-center justify-between p-3 border border-green-700/50 bg-black/40">
            <div>
              <div className="text-green-400 font-mono text-sm font-bold">
                STEM_SEPARATION
              </div>
              <div className="text-green-700 font-mono text-xs mt-1">
                Enable real-time stem separation
              </div>
            </div>
            <button
              onClick={() => toggleSetting("enableStemSeparation")}
              className={`relative w-16 h-8 border-2 transition-all duration-200 ${
                settings.enableStemSeparation
                  ? "border-green-500 bg-green-500/20"
                  : "border-green-700 bg-black/60"
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-green-400 transition-all duration-200 ${
                  settings.enableStemSeparation ? "left-9" : "left-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Gesture Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            GESTURE_RECOGNITION
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Gesture Control */}
          <div className="flex items-center justify-between p-3 border border-green-700/50 bg-black/40">
            <div>
              <div className="text-green-400 font-mono text-sm font-bold">
                GESTURE_CONTROL
              </div>
              <div className="text-green-700 font-mono text-xs mt-1">
                Enable hand tracking for controls
              </div>
            </div>
            <button
              onClick={() => toggleSetting("enableGestureControl")}
              className={`relative w-16 h-8 border-2 transition-all duration-200 ${
                settings.enableGestureControl
                  ? "border-green-500 bg-green-500/20"
                  : "border-green-700 bg-black/60"
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-green-400 transition-all duration-200 ${
                  settings.enableGestureControl ? "left-9" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Smoothing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-green-600 font-mono text-sm">
              <span>SMOOTHING</span>
              <span className="text-green-400">
                {(settings.gestureSmoothing * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.gestureSmoothing * 100}
              onChange={(e) =>
                updateSetting(
                  "gestureSmoothing",
                  parseInt(e.target.value) / 100,
                )
              }
              className="w-full h-2 bg-black border-2 border-green-700 appearance-none
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-green-400
                       [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-green-500"
            />
          </div>

          {/* Sensitivity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-green-600 font-mono text-sm">
              <span>SENSITIVITY</span>
              <span className="text-green-400">
                {(settings.gestureSensitivity * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.gestureSensitivity * 100}
              onChange={(e) =>
                updateSetting(
                  "gestureSensitivity",
                  parseInt(e.target.value) / 100,
                )
              }
              className="w-full h-2 bg-black border-2 border-green-700 appearance-none
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
                       [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-green-400
                       [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-green-500"
            />
          </div>

          {/* Camera FPS */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-green-600 font-mono text-sm">
              <span>CAMERA_FPS</span>
              <span className="text-green-400">{settings.cameraFPS} fps</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map((fps) => (
                <button
                  key={fps}
                  onClick={() => updateSetting("cameraFPS", fps)}
                  className={`border-2 py-2 font-mono text-sm transition-all duration-200 ${
                    settings.cameraFPS === fps
                      ? "border-green-500 bg-green-500/20 text-green-400"
                      : "border-green-700 bg-black/60 text-green-600 hover:border-green-500"
                  }`}
                >
                  {fps} FPS
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="w-5 h-5" />
            SYSTEM
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between p-3 border border-green-700/50 bg-black/40">
            <div>
              <div className="text-green-400 font-mono text-sm font-bold">
                TERMINAL_MODE
              </div>
              <div className="text-green-700 font-mono text-xs mt-1">
                Retro CRT terminal interface
              </div>
            </div>
            <button
              onClick={() => toggleSetting("darkMode")}
              className={`relative w-16 h-8 border-2 transition-all duration-200 ${
                settings.darkMode
                  ? "border-green-500 bg-green-500/20"
                  : "border-green-700 bg-black/60"
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-green-400 transition-all duration-200 ${
                  settings.darkMode ? "left-9" : "left-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          className="flex-1 border-2 border-green-500 bg-green-500/20 hover:bg-green-500/30
                   px-6 py-3 text-green-400 font-mono font-bold tracking-wider
                   transition-all duration-200 flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          SAVE_CONFIG
        </button>
        <button
          className="flex-1 border-2 border-green-700 bg-black/60 hover:bg-green-500/10
                   hover:border-green-500 px-6 py-3 text-green-600 hover:text-green-400
                   font-mono font-bold tracking-wider transition-all duration-200
                   flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          RESET_DEFAULTS
        </button>
      </div>

      {/* Info Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Monitor className="w-4 h-4" />
            SYSTEM_INFO
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 font-mono text-sm">
            <div>
              <div className="text-green-700">VERSION</div>
              <div className="text-green-400">v1.0.0</div>
            </div>
            <div>
              <div className="text-green-700">BUILD</div>
              <div className="text-green-400">2025-10-01</div>
            </div>
            <div>
              <div className="text-green-700">AUDIO_ENGINE</div>
              <div className="text-green-400">Web Audio API</div>
            </div>
            <div>
              <div className="text-green-700">GESTURE_ENGINE</div>
              <div className="text-green-400">MediaPipe v0.10</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
