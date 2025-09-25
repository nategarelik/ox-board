# OX Board Stem Studio 🎛️

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)

An AI-native web stem player where producers can upload, generate, and mix songs directly in the browser. OX Board splits music into stems, streams them with ultra-low latency, and layers in AI workflows for auto-mixing, personalized recommendations, and commercial-ready exports.

## ✨ Highlights

- ⚙️ **Stem-first architecture** – HLS-friendly stem model with real-time Web Audio playback and gain staging.
- 🤖 **AI everywhere** – Prompt-to-track generation, intelligent auto-mix suggestions, and mood-aware recommendations.
- ☁️ **Serverless ready** – Next.js 15 App Router with API routes for stem separation, generation, and personalization.
- 💸 **Subscription model** – Stripe-ready tiering with download quotas and licensing upgrades.
- 📊 **Agentic analytics** – Live latency, buffer, and queue metrics to keep sessions running smoothly.

## 🧱 Project Structure

```
app/
├── api/                      # Serverless endpoints for AI + stems
│   ├── generate/route.ts     # Prompt-to-track generation handler
│   ├── recommendations/      # Personalized feed
│   └── stemify/              # Upload + stem separation
├── components/
│   ├── stem-player/          # Stem player UI, upload, subscription, analytics
│   └── ClientApp.tsx         # Entry point wiring the dashboard
├── hooks/
│   ├── usePlayer.ts          # Store bindings
│   └── useStemPlayback.ts    # Web Audio playback engine
├── lib/
│   ├── audio/stemPlaybackEngine.ts
│   └── data/defaultTrack.ts  # Seed data + waveform helpers
├── stores/stemPlayerStore.ts # Zustand store managing stems + AI tasks
└── types/stem-player.ts      # Shared typing for stems, plans, analytics
```

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to launch the stem studio. Upload a song or craft an AI prompt to start generating stems.

## 🧪 Key Workflows

- **Stem Upload**: Drag in MP3/WAV → `/api/stemify` simulates Music.ai-class separation → stems hydrate the mixer.
- **AI Generation**: Submit prompts via `/api/generate` → mocked Suno/AIVA response seeds new tasks in the queue.
- **Auto Mix**: Web Audio engine mirrors adjustments when you call the AI auto-mixer, keeping gain staging consistent.
- **Personalization**: `/api/recommendations` tailors suggestions per subscription tier and session context.

## 🛡️ Security & Ethics

- API keys remain server-side; front-end only calls internal routes.
- Playback honors browser gesture requirements before unlocking Web Audio.
- Recommendation copy nudges toward ethical, royalty-friendly usage of AI music.

## 🗺️ Roadmap

- [ ] Wire real HLS stem streaming (e.g., stemplayer-js or hls.js integration)
- [ ] Replace mock APIs with production-grade Music.ai & Suno clients
- [ ] Add Stripe billing webhooks + Supabase storage for stems
- [ ] Build collaborative sessions with presence + messaging

## 🤝 Contributing

We welcome issues and pull requests! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

Built with care for producers exploring the future of AI-assisted music creation.
