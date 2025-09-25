import { SubscriptionPlan } from "../types/stem-player";

export function getSubscriptionPlans(): SubscriptionPlan[] {
  return [
    {
      id: "free",
      name: "Free",
      price: "$0",
      description: "Kick-start your mixing journey with limited exports.",
      features: [
        "3 downloads per month",
        "AI stem separation (preview quality)",
        "Watermarked exports",
      ],
      limits: ["Credit attribution required", "Stream-only playback"],
    },
    {
      id: "standard",
      name: "Standard",
      price: "$11/mo",
      annualPrice: "$132 billed annually",
      description: "Unlimited generations with pro-grade playback.",
      features: [
        "Unlimited AI track generations",
        "15 downloads every month",
        "Lossless HLS streaming",
        "Personalized playlists",
      ],
      limits: ["Social monetization allowed", "Attribution optional"],
      highlight: true,
    },
    {
      id: "pro",
      name: "Pro",
      price: "$33/mo",
      annualPrice: "$396 billed annually",
      description: "Commercial-ready stems with royalty-free licensing.",
      features: [
        "300 monthly downloads",
        "WAV & MIDI exports",
        "Full copyright ownership",
        "Agentic marketing automations",
      ],
      limits: ["Unlimited commercial projects", "Priority support"],
    },
  ];
}
