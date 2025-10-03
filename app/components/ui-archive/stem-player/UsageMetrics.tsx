"use client";

import { PlayerAnalytics } from "../../../types/stem-player";

interface UsageMetricsProps {
  analytics: PlayerAnalytics;
}

const METRIC_LABELS: Record<keyof PlayerAnalytics, string> = {
  averageLatencyMs: "Avg Latency",
  hlsBufferHealth: "Buffer Health",
  generationQueueDepth: "Gen Queue",
  downloadQuotaUsed: "Download Usage",
  sessionMinutes: "Session Minutes",
};

export default function UsageMetrics({ analytics }: UsageMetricsProps) {
  return (
    <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-slate-900/80 to-black/80 p-6 text-white shadow-xl shadow-black/30">
      <h3 className="text-lg font-semibold">Realtime analytics</h3>
      <p className="mt-2 text-sm text-white/70">
        Monitoring your playback latency, queue health, and quota usage ensures
        a reliable studio experience.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
        {(Object.keys(analytics) as Array<keyof PlayerAnalytics>).map((key) => (
          <div
            key={key}
            className="rounded-2xl border border-white/10 bg-black/60 p-4"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              {METRIC_LABELS[key]}
            </p>
            <p className="mt-2 text-lg font-semibold text-white">
              {key === "hlsBufferHealth"
                ? `${Math.round(analytics[key] * 100)}%`
                : key === "downloadQuotaUsed"
                  ? `${Math.round(analytics[key] * 100)}%`
                  : analytics[key]}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
