import {
  AutoMixSuggestion,
  Recommendation,
  StemMeta,
  StemTrack,
} from "../../types/stem-player";

const baseStems: StemMeta[] = [
  {
    id: "vocals",
    label: "Vocals",
    color: "#f97316",
    volume: 0.85,
    muted: false,
    solo: false,
    waveform: createMockWaveform(512, 0.4),
    latencyMs: 42,
    hlsUrl: "/media/demo-track/vocals.m3u8",
  },
  {
    id: "drums",
    label: "Drums",
    color: "#22d3ee",
    volume: 0.7,
    muted: false,
    solo: false,
    waveform: createMockWaveform(512, 0.6),
    latencyMs: 38,
    hlsUrl: "/media/demo-track/drums.m3u8",
  },
  {
    id: "bass",
    label: "Bass",
    color: "#a855f7",
    volume: 0.75,
    muted: false,
    solo: false,
    waveform: createMockWaveform(512, 0.5),
    latencyMs: 45,
    hlsUrl: "/media/demo-track/bass.m3u8",
  },
  {
    id: "other",
    label: "Melody",
    color: "#34d399",
    volume: 0.65,
    muted: false,
    solo: false,
    waveform: createMockWaveform(512, 0.55),
    latencyMs: 50,
    hlsUrl: "/media/demo-track/melody.m3u8",
  },
];

const baseTrack: StemTrack = {
  id: "demo-track",
  title: "Neon Skyline",
  artist: "OX Collective",
  description:
    "AI-assisted electronic track showcasing real-time stem remixing capabilities.",
  durationSeconds: 276,
  bpm: 122,
  musicalKey: "B minor",
  createdAt: new Date("2024-11-04").toISOString(),
  updatedAt: new Date("2024-11-18").toISOString(),
  artworkUrl: "/artwork/demo-track.jpg",
  stems: baseStems,
};

const baseRecommendations: Recommendation[] = [
  {
    id: "rec-ai-mix",
    title: "Try the AI Auto-Mix",
    description:
      "Balance dynamics automatically with latency-aware gain staging tailored to this track.",
    reason:
      "Vocals are trending 6dB hotter than recommended for neo-soul playlists.",
    actionLabel: "Apply Auto-Mix",
    route: "#mixer",
    category: "mixing",
  },
  {
    id: "rec-playlist",
    title: "Add to Lush Chillwave",
    description:
      "Curated playlist with 120-125 BPM downtempo stems optimized for stem swapping.",
    reason: "Your listeners spent 18% longer in this mood last week.",
    actionLabel: "Open Playlist",
    route: "#playlists",
    category: "playlist",
  },
  {
    id: "rec-generation",
    title: "Generate a Companion Beat",
    description:
      "Prompt Suno-style models for a 16-bar breakbeat to layer under this session.",
    reason:
      "AI detected a sparse percussive section at 1:42 – ideal for augmentation.",
    actionLabel: "Open Generator",
    route: "#generator",
    category: "generation",
  },
];

const baseAutoMix: AutoMixSuggestion = {
  id: "automix-demo",
  summary: "Balanced stems for crisp vocals and punchy low-end",
  confidence: 0.82,
  createdAt: new Date().toISOString(),
  adjustments: [
    { stemId: "vocals", targetVolume: 0.78 },
    { stemId: "drums", targetVolume: 0.72 },
    { stemId: "bass", targetVolume: 0.8 },
    { stemId: "other", targetVolume: 0.6 },
  ],
};

export function createDefaultTrack(): StemTrack {
  return {
    ...baseTrack,
    stems: baseTrack.stems.map((stem) => ({
      ...stem,
      waveform: [...stem.waveform],
    })),
  };
}

export function createDefaultRecommendations(): Recommendation[] {
  return baseRecommendations.map((recommendation) => ({ ...recommendation }));
}

export function createDefaultAutoMix(): AutoMixSuggestion {
  return {
    ...baseAutoMix,
    adjustments: baseAutoMix.adjustments.map((adjustment) => ({
      ...adjustment,
    })),
  };
}

export function createMockWaveform(length = 512, amplitude = 0.5): number[] {
  const values: number[] = [];
  for (let i = 0; i < length; i += 1) {
    const t = i / length;
    const envelope = Math.sin(Math.PI * t);
    const modulation = Math.sin(2 * Math.PI * 8 * t) * 0.3 + 0.7;
    const noise = (Math.random() - 0.5) * 0.1;
    values.push(Number((amplitude * envelope * modulation + noise).toFixed(4)));
  }
  return values;
}
