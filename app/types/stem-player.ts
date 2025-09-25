export type StemId = "vocals" | "drums" | "bass" | "other" | string;

export interface StemMeta {
  id: StemId;
  label: string;
  color: string;
  volume: number;
  muted: boolean;
  solo: boolean;
  waveform: number[];
  latencyMs: number;
  hlsUrl?: string;
}

export interface StemTrack {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  bpm: number;
  musicalKey: string;
  stems: StemMeta[];
  createdAt: string;
  updatedAt: string;
  artworkUrl?: string;
  description?: string;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  reason: string;
  actionLabel: string;
  route: string;
  category: "mixing" | "generation" | "playlist" | "business";
}

export interface AutoMixAdjustment {
  stemId: StemId;
  targetVolume: number;
  muted?: boolean;
}

export interface AutoMixSuggestion {
  id: string;
  summary: string;
  createdAt: string;
  confidence: number;
  adjustments: AutoMixAdjustment[];
}

export type PlaybackState =
  | "idle"
  | "loading"
  | "stopped"
  | "playing"
  | "paused";

export type SubscriptionTier = "free" | "standard" | "pro";

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: string;
  description: string;
  annualPrice?: string;
  features: string[];
  limits: string[];
  highlight?: boolean;
}

export interface GenerationTask {
  id: string;
  prompt: string;
  status: "queued" | "processing" | "completed" | "failed";
  createdAt: string;
  previewUrl?: string;
  error?: string;
  durationSeconds?: number;
}

export interface PlayerAnalytics {
  averageLatencyMs: number;
  hlsBufferHealth: number;
  generationQueueDepth: number;
  downloadQuotaUsed: number;
  sessionMinutes: number;
}
