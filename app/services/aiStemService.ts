import { AutoMixSuggestion, StemTrack } from "../types/stem-player";

interface StemifyPayload {
  fileName: string;
  mimeType: string;
  size: number;
}

interface StemifyResponse {
  jobId: string;
  status: "queued" | "processing" | "complete";
  stems: Array<{
    id: string;
    label: string;
    url: string;
    waveform: number[];
  }>;
  metadata: {
    durationSeconds: number;
    estimatedLatencyMs: number;
  };
}

interface GenerationPayload {
  prompt: string;
  durationSeconds: number;
  style: string;
}

interface GenerationResponse {
  taskId: string;
  status: "queued" | "processing" | "complete";
  previewUrl: string;
  etaSeconds: number;
}

export async function requestStemSeparation(
  payload: StemifyPayload,
): Promise<StemifyResponse> {
  const response = await fetch("/api/stemify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to queue stem separation job");
  }

  return response.json();
}

export async function requestTrackGeneration(
  payload: GenerationPayload,
): Promise<GenerationResponse> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Unable to start generation task");
  }

  return response.json();
}

export async function requestAutoMixSuggestion(
  track: StemTrack,
): Promise<AutoMixSuggestion> {
  const baseline = track.stems.map((stem, index) => ({
    stemId: stem.id,
    targetVolume: Math.min(1, Math.max(0.2, stem.volume - index * 0.02)),
    muted: stem.muted,
  }));

  return {
    id: `automix-${Date.now()}`,
    summary: `Latency-aware gain staging prepared for ${track.title}`,
    createdAt: new Date().toISOString(),
    confidence: 0.78,
    adjustments: baseline,
  };
}
