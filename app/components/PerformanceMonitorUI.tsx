"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Activity,
  Zap,
  HardDrive,
  Clock,
  Cpu,
  Wifi,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Gauge,
  BarChart3,
} from "lucide-react";
import { PerformanceMonitor } from "../lib/optimization/performanceMonitor";

interface PerformanceMonitorUIProps {
  performanceMonitor: PerformanceMonitor;
  gestureSystem?: any;
  onClose?: () => void;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  status: "good" | "fair" | "poor";
  icon: React.ReactNode;
  trend?: "up" | "down" | "stable";
  description?: string;
}

function MetricCard({
  title,
  value,
  unit = "",
  status,
  icon,
  trend,
  description,
}: MetricCardProps) {
  const getStatusColor = () => {
    switch (status) {
      case "good":
        return "text-green-400 border-green-500/30 bg-green-500/10";
      case "fair":
        return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
      case "poor":
        return "text-red-400 border-red-500/30 bg-red-500/10";
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-3 h-3" />;
      case "down":
        return <TrendingDown className="w-3 h-3" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-lg border backdrop-blur-sm ${getStatusColor()}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {trend && (
          <div
            className={`flex items-center space-x-1 ${
              trend === "up"
                ? "text-green-400"
                : trend === "down"
                  ? "text-red-400"
                  : "text-white/60"
            }`}
          >
            {getTrendIcon()}
          </div>
        )}
      </div>

      <div className="flex items-center space-x-1 mb-1">
        <span className="text-2xl font-bold">{value}</span>
        {unit && <span className="text-sm text-white/60">{unit}</span>}
      </div>

      {description && <p className="text-xs text-white/60">{description}</p>}
    </motion.div>
  );
}

export default function PerformanceMonitorUI({
  performanceMonitor,
  gestureSystem,
  onClose,
  className = "",
}: PerformanceMonitorUIProps) {
  const [currentSnapshot, setCurrentSnapshot] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateMetrics = () => {
      setCurrentSnapshot(performanceMonitor.getCurrentSnapshot());
      setAlerts(performanceMonitor.getAlerts());
      setAnalysis(performanceMonitor.getPerformanceAnalysis());
    };

    // Initial update
    updateMetrics();

    // Update every 2 seconds
    const interval = setInterval(updateMetrics, 2000);

    return () => clearInterval(interval);
  }, [performanceMonitor]);

  const formatLatency = (latency: number) => {
    return latency.toFixed(1);
  };

  const formatMemory = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(1);
  };

  const getLatencyStatus = (latency: number): "good" | "fair" | "poor" => {
    if (latency <= 50) return "good";
    if (latency <= 100) return "fair";
    return "poor";
  };

  const getMemoryStatus = (memory: number): "good" | "fair" | "poor" => {
    if (memory <= 100) return "good";
    if (memory <= 200) return "fair";
    return "poor";
  };

  const getFPSStatus = (fps: number): "good" | "fair" | "poor" => {
    if (fps >= 50) return "good";
    if (fps >= 30) return "fair";
    return "poor";
  };

  if (!currentSnapshot) {
    return (
      <div
        className={`bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg p-6 ${className}`}
      >
        <div className="flex items-center justify-center">
          <div className="text-white/60 text-center">
            <Gauge className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Loading performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-black/40 backdrop-blur-sm border border-white/10 rounded-lg ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Performance Monitor
            </h3>
            <p className="text-xs text-white/60">Real-time system metrics</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <BarChart3 className="w-4 h-4" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Performance Overview */}
      <div className="p-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            {analysis?.overall === "good" && (
              <CheckCircle className="w-5 h-5 text-green-400" />
            )}
            {analysis?.overall === "fair" && (
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
            )}
            {analysis?.overall === "poor" && (
              <AlertTriangle className="w-5 h-5 text-red-400" />
            )}
            <span className="text-sm font-medium text-white capitalize">
              Status: {analysis?.overall || "Unknown"}
            </span>
          </div>

          {alerts.length > 0 && (
            <div className="flex items-center space-x-1 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">{alerts.length} Alerts</span>
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <MetricCard
            title="FPS"
            value={Math.round(currentSnapshot.fps)}
            status={getFPSStatus(currentSnapshot.fps)}
            icon={<Zap className="w-4 h-4" />}
            description="Frame rate"
          />

          <MetricCard
            title="Latency"
            value={formatLatency(currentSnapshot.latency.total)}
            unit="ms"
            status={getLatencyStatus(currentSnapshot.latency.total)}
            icon={<Clock className="w-4 h-4" />}
            description="Total latency"
          />

          <MetricCard
            title="Memory"
            value={formatMemory(currentSnapshot.memory.used * 1024 * 1024)}
            unit="MB"
            status={getMemoryStatus(currentSnapshot.memory.used)}
            icon={<HardDrive className="w-4 h-4" />}
            description="Used memory"
          />

          <MetricCard
            title="CPU"
            value={Math.round(currentSnapshot.cpu.usage)}
            unit="%"
            status={
              currentSnapshot.cpu.usage <= 70
                ? "good"
                : currentSnapshot.cpu.usage <= 90
                  ? "fair"
                  : "poor"
            }
            icon={<Cpu className="w-4 h-4" />}
            description="CPU usage"
          />
        </div>

        {/* Detailed Metrics */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              {/* Audio Performance */}
              <div>
                <h4 className="text-sm font-medium text-white mb-3 flex items-center">
                  <Activity className="w-4 h-4 mr-2 text-blue-400" />
                  Audio Performance
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-white/70 mb-1">
                      Audio Latency
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatLatency(currentSnapshot.latency.audio)}ms
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-white/70 mb-1">
                      Worklet Latency
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatLatency(currentSnapshot.latency.audioWorklet)}ms
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-white/70 mb-1">
                      Buffer Health
                    </div>
                    <div className="text-lg font-semibold text-green-400">
                      Good
                    </div>
                  </div>
                </div>
              </div>

              {/* Gesture Performance */}
              {gestureSystem?.performanceMetrics && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center">
                    <Activity className="w-4 h-4 mr-2 text-cyan-400" />
                    Gesture Performance
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-xs text-white/70 mb-1">
                        Gesture Latency
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {formatLatency(
                          gestureSystem.performanceMetrics.averageLatency,
                        )}
                        ms
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-xs text-white/70 mb-1">
                        Frame Rate
                      </div>
                      <div className="text-lg font-semibold text-white">
                        {Math.round(gestureSystem.performanceMetrics.frameRate)}{" "}
                        FPS
                      </div>
                    </div>
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="text-xs text-white/70 mb-1">Accuracy</div>
                      <div className="text-lg font-semibold text-cyan-400">
                        {Math.round(
                          gestureSystem.performanceMetrics.gestureAccuracy *
                            100,
                        )}
                        %
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Network Performance */}
              <div>
                <h4 className="text-sm font-medium text-white mb-3 flex items-center">
                  <Wifi className="w-4 h-4 mr-2 text-green-400" />
                  Network
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-white/70 mb-1">
                      Active Requests
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {currentSnapshot.network.activeRequests}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="text-xs text-white/70 mb-1">
                      Avg Latency
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {formatLatency(currentSnapshot.network.averageLatency)}ms
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Alerts */}
              {alerts.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-white mb-3 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />
                    Active Alerts
                  </h4>
                  <div className="space-y-2">
                    {alerts.slice(0, 3).map((alert, index) => (
                      <div
                        key={index}
                        className="bg-red-500/10 border border-red-500/30 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-white">
                              {alert.message}
                            </span>
                          </div>
                          <span className="text-xs text-white/60">
                            {new Date(alert.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis?.recommendations &&
                analysis.recommendations.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-white mb-3">
                      Recommendations
                    </h4>
                    <div className="space-y-2">
                      {analysis.recommendations.map(
                        (rec: string, index: number) => (
                          <div
                            key={index}
                            className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3"
                          >
                            <p className="text-sm text-blue-400">{rec}</p>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="px-4 pb-4">
        <div className="text-xs text-white/50 text-center">
          Last updated:{" "}
          {new Date(currentSnapshot.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
