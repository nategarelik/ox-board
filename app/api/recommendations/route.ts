import { NextRequest } from "next/server";

const RECOMMENDATION_LIBRARY = [
  {
    id: "ai-sculpt",
    title: "Sculpt vocals with spectral ducking",
    description:
      "Auto-EQ the vocal stem against the bass to open more headroom.",
    reason: "Detected overlapping harmonics at 220Hz.",
    actionLabel: "Apply AI EQ",
    route: "#mixer",
    category: "mixing",
  },
  {
    id: "playlist-deep",
    title: "Send to Deep Focus subscribers",
    description:
      "Match with high-retention playlists in lo-fi + downtempo niches.",
    reason: "Listeners similar to yours replayed this vibe 2.4x last week.",
    actionLabel: "Open campaign",
    route: "#marketing",
    category: "business",
  },
  {
    id: "generation-hook",
    title: "Generate an intro hook",
    description:
      "Prompt AI to deliver a 12-bar intro using the same harmonic fingerprint.",
    reason: "Drop-off spikes during the first 8 seconds of the current mix.",
    actionLabel: "Create intro",
    route: "#generator",
    category: "generation",
  },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const tier = searchParams.get("tier") ?? "free";

  const recommendations = RECOMMENDATION_LIBRARY.filter((item) => {
    if (tier === "free") {
      return item.category !== "business";
    }
    if (tier === "standard") {
      return item.category !== "business" || item.id === "playlist-deep";
    }
    return true;
  });

  return Response.json({ recommendations });
}
