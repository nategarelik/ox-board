"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Camera,
  Settings,
  Target,
  Play,
  Square,
  RotateCcw,
  Eye,
  EyeOff,
  Volume2,
  Sliders,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  Mic,
  Music,
} from "lucide-react";

interface GestureControlPanelProps {
  gestureSystem: any;
  onClose?: () => void;
  className?: string;
}

interface GestureMapping {
  gesture: string;
  action: string;
  sensitivity: number;
  enabled: boolean;
  stemType?: string;
}

const DEFAULT_GESTURE_MAPPINGS: GestureMapping[] = [
  { gesture: "PINCH", action: "volume", sensitivity: 0.7, enabled: true },
  { gesture: "FIST", action: "mute", sensitivity: 0.8, enabled: true },
  { gesture: "PALM_OPEN", action: "solo", sensitivity: 0.6, enabled: true },
  {
    gesture: "SWIPE_VERTICAL",
    action: "volume",
    sensitivity: 0.5,
    enabled: true,
  },
  {
    gesture: "SWIPE_HORIZONTAL",
    action: "pan",
    sensitivity: 0.6,
    enabled: true,
  },
  { gesture: "SPREAD", action: "crossfader", sensitivity: 0.7, enabled: true },
  {
    gesture: "FINGER_COUNT",
    action: "stem_volume",
    sensitivity: 0.8,
    enabled: true,
    stemType: "vocals",
  },
];

export default function GestureControlPanel({
  gestureSystem,
  onClose,
  className = "",
}: GestureControlPanelProps) {
  const [activeTab, setActiveTab] = useState<
    "camera" | "mapping" | "calibration" | "settings"
  >("camera");
  const [cameraDevices, setCameraDevices] = useState<any[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [gestureMappings, setGestureMappings] = useState<GestureMapping[]>(
    DEFAULT_GESTURE_MAPPINGS,
  );
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState<
    Record<string, number>
  >({});
  const [showCameraPreview, setShowCameraPreview] = useState(true);
  const [sensitivity, setSensitivity] = useState(0.7);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera devices
  useEffect(() => {
    const initializeDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(
          (device) => device.kind === "videoinput",
        );
        setCameraDevices(cameras);

        if (cameras.length > 0) {
          setSelectedDevice(cameras[0].deviceId);
        }
      } catch (error) {
        console.error("Failed to enumerate devices:", error);
      }
    };

    initializeDevices();
  }, []);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Failed to start camera:", error);
    }
  }, [selectedDevice]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Start camera when preview is enabled
  useEffect(() => {
    if (showCameraPreview && selectedDevice) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [showCameraPreview, selectedDevice, startCamera]);

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDevice(deviceId);
  };

  const handleMappingChange = (
    index: number,
    field: keyof GestureMapping,
    value: any,
  ) => {
    setGestureMappings((prev) =>
      prev.map((mapping, i) =>
        i === index ? { ...mapping, [field]: value } : mapping,
      ),
    );
  };

  const startCalibration = (gestureType: string) => {
    setIsCalibrating(true);
    setCalibrationProgress((prev) => ({ ...prev, [gestureType]: 0 }));

    gestureSystem.startCalibration(gestureType);

    // Simulate calibration progress
    const interval = setInterval(() => {
      setCalibrationProgress((prev) => {
        const current = prev[gestureType] || 0;
        if (current >= 100) {
          clearInterval(interval);
          gestureSystem.stopCalibration(gestureType);
          setIsCalibrating(false);
          return { ...prev, [gestureType]: 100 };
        }
        return { ...prev, [gestureType]: current + 10 };
      });
    }, 200);
  };

  const stopCalibration = (gestureType: string) => {
    gestureSystem.stopCalibration(gestureType);
    setIsCalibrating(false);
    setCalibrationProgress((prev) => ({ ...prev, [gestureType]: 0 }));
  };

  const saveSettings = () => {
    // Save gesture mappings and settings
    const settings = {
      mappings: gestureMappings,
      sensitivity,
      selectedDevice,
    };

    localStorage.setItem("gesture-control-settings", JSON.stringify(settings));
    console.log("Settings saved:", settings);
  };

  const resetSettings = () => {
    setGestureMappings(DEFAULT_GESTURE_MAPPINGS);
    setSensitivity(0.7);
    if (cameraDevices.length > 0) {
      setSelectedDevice(cameraDevices[0].deviceId);
    }
  };

  const tabs = [
    { id: "camera", label: "Camera", icon: Camera },
    { id: "mapping", label: "Mapping", icon: Target },
    { id: "calibration", label: "Calibration", icon: Settings },
    { id: "settings", label: "Settings", icon: Sliders },
  ];

  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 bg-gradient-to-br from-slate-900 to-slate-950 border-l border-white/10 shadow-2xl z-50 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center">
            <Camera className="w-5 h-5 mr-2 text-cyan-400" />
            Gesture Controls
          </h2>
          <p className="text-xs text-white/60 mt-1">Configure hand tracking</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10">
        {tabs.map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 p-3 text-sm font-medium transition-all flex items-center justify-center space-x-2 ${
                activeTab === tab.id
                  ? "text-cyan-400 bg-cyan-500/10 border-b-2 border-cyan-400"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">
          {/* Camera Tab */}
          {activeTab === "camera" && (
            <motion.div
              key="camera"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Camera Settings
                </h3>

                {/* Camera Device Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/90">
                    Camera Device
                  </label>
                  <select
                    value={selectedDevice}
                    onChange={(e) => handleDeviceChange(e.target.value)}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-cyan-400 focus:outline-none"
                  >
                    {cameraDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label ||
                          `Camera ${device.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Camera Preview Toggle */}
                <div className="flex items-center justify-between mt-4">
                  <label className="text-sm font-medium text-white/90">
                    Preview
                  </label>
                  <button
                    onClick={() => setShowCameraPreview(!showCameraPreview)}
                    className={`p-2 rounded-lg transition-all ${
                      showCameraPreview
                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        : "bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
                    }`}
                  >
                    {showCameraPreview ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Camera Preview */}
                {showCameraPreview && (
                  <div className="mt-4 relative bg-black/40 rounded-lg overflow-hidden aspect-video">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center space-x-1 px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-xs text-green-400">Live</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Camera Controls */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={startCamera}
                    className="p-3 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-all"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start
                  </button>
                  <button
                    onClick={stopCamera}
                    className="p-3 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all"
                  >
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Gesture Mapping Tab */}
          {activeTab === "mapping" && (
            <motion.div
              key="mapping"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Gesture Mapping
                </h3>

                <div className="space-y-3">
                  {gestureMappings.map((mapping, index) => (
                    <div
                      key={index}
                      className="bg-white/5 rounded-lg p-4 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              mapping.enabled
                                ? "bg-cyan-500/20"
                                : "bg-gray-500/20"
                            }`}
                          >
                            {mapping.gesture === "PINCH" && (
                              <Target className="w-4 h-4 text-cyan-400" />
                            )}
                            {mapping.gesture === "FIST" && (
                              <Volume2 className="w-4 h-4 text-red-400" />
                            )}
                            {mapping.gesture === "PALM_OPEN" && (
                              <Eye className="w-4 h-4 text-blue-400" />
                            )}
                            {mapping.gesture === "SWIPE_VERTICAL" && (
                              <Volume2 className="w-4 h-4 text-green-400" />
                            )}
                            {mapping.gesture === "SWIPE_HORIZONTAL" && (
                              <Sliders className="w-4 h-4 text-yellow-400" />
                            )}
                            {mapping.gesture === "SPREAD" && (
                              <Sliders className="w-4 h-4 text-purple-400" />
                            )}
                            {mapping.gesture === "FINGER_COUNT" && (
                              <Music className="w-4 h-4 text-pink-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">
                              {mapping.gesture}
                            </p>
                            <p className="text-xs text-white/60">
                              {mapping.action}
                            </p>
                          </div>
                        </div>

                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={mapping.enabled}
                            onChange={(e) =>
                              handleMappingChange(
                                index,
                                "enabled",
                                e.target.checked,
                              )
                            }
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                        </label>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs text-white/70">
                            Sensitivity
                          </label>
                          <span className="text-xs text-white/60">
                            {Math.round(mapping.sensitivity * 100)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.1"
                          max="1"
                          step="0.1"
                          value={mapping.sensitivity}
                          onChange={(e) =>
                            handleMappingChange(
                              index,
                              "sensitivity",
                              parseFloat(e.target.value),
                            )
                          }
                          className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Calibration Tab */}
          {activeTab === "calibration" && (
            <motion.div
              key="calibration"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Gesture Calibration
                </h3>

                <div className="space-y-3">
                  {["PINCH", "FIST", "PALM_OPEN", "PEACE_SIGN"].map(
                    (gesture) => (
                      <div
                        key={gesture}
                        className="bg-white/5 rounded-lg p-4 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-sm font-medium text-white">
                              {gesture}
                            </p>
                            <p className="text-xs text-white/60">
                              Perform gesture for calibration
                            </p>
                          </div>

                          <div className="flex items-center space-x-2">
                            {calibrationProgress[gesture] === 100 && (
                              <CheckCircle className="w-5 h-5 text-green-400" />
                            )}
                            <span className="text-xs text-white/60 w-12 text-right">
                              {calibrationProgress[gesture] || 0}%
                            </span>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          {isCalibrating && calibrationProgress[gesture] > 0 ? (
                            <button
                              onClick={() => stopCalibration(gesture)}
                              className="flex-1 p-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all"
                            >
                              Stop
                            </button>
                          ) : (
                            <button
                              onClick={() => startCalibration(gesture)}
                              className="flex-1 p-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-all"
                            >
                              Calibrate
                            </button>
                          )}
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3 w-full bg-white/10 rounded-full h-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{
                              width: `${calibrationProgress[gesture] || 0}%`,
                            }}
                            className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full"
                          />
                        </div>
                      </div>
                    ),
                  )}
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <Info className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-400 mb-1">
                        Calibration Tips
                      </p>
                      <ul className="text-xs text-white/70 space-y-1">
                        <li>• Perform each gesture clearly and consistently</li>
                        <li>• Keep your hand in the center of the frame</li>
                        <li>• Avoid rapid movements during calibration</li>
                        <li>• Ensure good lighting for better accuracy</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  General Settings
                </h3>

                {/* Global Sensitivity */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/90">
                    Global Sensitivity
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.1"
                      value={sensitivity}
                      onChange={(e) =>
                        setSensitivity(parseFloat(e.target.value))
                      }
                      className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm text-white/60 w-12">
                      {Math.round(sensitivity * 100)}%
                    </span>
                  </div>
                </div>

                {/* Gesture Recording */}
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Gesture Recording
                      </p>
                      <p className="text-xs text-white/60">
                        Record gestures for analysis
                      </p>
                    </div>
                    <button className="p-2 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-lg">
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Performance Monitoring */}
                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">
                        Performance Monitoring
                      </p>
                      <p className="text-xs text-white/60">
                        Track gesture recognition metrics
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
                    </label>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <button
            onClick={resetSettings}
            className="flex items-center space-x-2 px-4 py-2 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white rounded-lg transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>

          <button
            onClick={saveSettings}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-lg hover:from-cyan-600 hover:to-purple-600 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
