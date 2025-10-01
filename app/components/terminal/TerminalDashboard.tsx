"use client";

import React, { useEffect, useState } from "react";
import {
  Cpu,
  Disc,
  Waves,
  Camera,
  Activity,
  TrendingUp,
  Gauge,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/terminal/TerminalCard";

export function TerminalDashboard() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const systemStats = [
    { label: "AUDIO_ENGINE", value: "ONLINE", status: "active", icon: Waves },
    { label: "GESTURE_TRACK", value: "READY", status: "active", icon: Camera },
    { label: "DECK_A", value: "LOADED", status: "active", icon: Disc },
    { label: "DECK_B", value: "STANDBY", status: "idle", icon: Disc },
  ];

  const performanceMetrics = [
    { label: "LATENCY", value: "12ms", trend: "down", icon: Activity },
    { label: "CPU_USAGE", value: "34%", trend: "stable", icon: Cpu },
    { label: "FPS", value: "60", trend: "stable", icon: TrendingUp },
    { label: "BUFFER", value: "2048", trend: "stable", icon: Gauge },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="border-2 border-green-500/50 bg-black/60 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-green-400 tracking-wider font-mono">
              SYSTEM_DASHBOARD
            </h1>
            <p className="text-green-600 text-sm mt-1 font-mono">
              GESTURE-CONTROLLED DJ PLATFORM // REAL-TIME MONITORING
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-mono text-green-400 tabular-nums">
              {time.toLocaleTimeString("en-US", { hour12: false })}
            </div>
            <div className="text-sm text-green-600 font-mono">
              {time.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
        </div>
      </div>

      {/* System Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {systemStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-8 h-8 ${
                      stat.status === "active"
                        ? "text-green-400"
                        : "text-green-700"
                    }`}
                  />
                  <div className="flex-1">
                    <div className="text-xs text-green-600 font-mono">
                      {stat.label}
                    </div>
                    <div
                      className={`text-lg font-bold font-mono ${
                        stat.status === "active"
                          ? "text-green-400"
                          : "text-green-700"
                      }`}
                    >
                      {stat.value}
                    </div>
                  </div>
                  {stat.status === "active" && (
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            PERFORMANCE_METRICS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {performanceMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="space-y-2">
                  <div className="flex items-center gap-2 text-green-600 text-xs font-mono">
                    <Icon className="w-4 h-4" />
                    {metric.label}
                  </div>
                  <div className="text-3xl font-bold text-green-400 font-mono tabular-nums">
                    {metric.value}
                  </div>
                  <div className="flex items-center gap-1">
                    <div
                      className={`w-full h-1 ${
                        metric.trend === "down"
                          ? "bg-green-500"
                          : metric.trend === "stable"
                            ? "bg-green-600"
                            : "bg-yellow-500"
                      }`}
                    >
                      <div className="h-full w-3/4 bg-green-400 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Log */}
      <Card>
        <CardHeader>
          <CardTitle>SYSTEM_LOG</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 font-mono text-sm">
            {[
              {
                time: "14:23:45",
                level: "INFO",
                msg: "Audio engine initialized successfully",
              },
              {
                time: "14:23:46",
                level: "INFO",
                msg: "Gesture recognition module loaded",
              },
              {
                time: "14:23:47",
                level: "INFO",
                msg: "Deck A: Track loaded - sample.mp3",
              },
              {
                time: "14:23:48",
                level: "SUCCESS",
                msg: "All systems operational",
              },
            ].map((log, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-green-600 hover:text-green-400 transition-colors"
              >
                <span className="text-green-700">[{log.time}]</span>
                <span
                  className={`px-2 py-0.5 text-xs ${
                    log.level === "SUCCESS"
                      ? "bg-green-500/20 text-green-400"
                      : log.level === "ERROR"
                        ? "bg-red-500/20 text-red-400"
                        : "bg-blue-500/20 text-blue-400"
                  }`}
                >
                  {log.level}
                </span>
                <span>{log.msg}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {["LOAD_TRACK", "START_REC", "CALIBRATE", "DIAGNOSTICS"].map(
          (action) => (
            <button
              key={action}
              className="border-2 border-green-700 bg-black/60 hover:bg-green-500/20 hover:border-green-500
                     text-green-600 hover:text-green-400 p-4 font-mono font-bold tracking-wider
                     transition-all duration-200"
            >
              {action}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
