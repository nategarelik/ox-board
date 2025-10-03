"use client";

import { Recommendation, SubscriptionTier } from "../../../types/stem-player";

interface RecommendationPanelProps {
  recommendations: Recommendation[];
  subscriptionTier: SubscriptionTier;
}

export default function RecommendationPanel({
  recommendations,
  subscriptionTier,
}: RecommendationPanelProps) {
  return (
    <div
      id="insights"
      className="flex h-full flex-col gap-4 rounded-3xl border border-white/10 bg-black/70 p-6 text-white shadow-xl shadow-black/40"
    >
      <div>
        <h3 className="text-lg font-semibold">Personalized suggestions</h3>
        <p className="text-sm text-white/70">
          Tailored using your playback history, AI stem profiles, and
          subscription benefits ({subscriptionTier}).
        </p>
      </div>
      <div className="flex flex-col gap-4">
        {recommendations.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/80"
          >
            <header className="flex items-center justify-between text-xs text-white/60">
              <span className="uppercase tracking-[0.3em]">
                {item.category}
              </span>
              <span>{item.reason}</span>
            </header>
            <h4 className="mt-2 text-base font-semibold text-white">
              {item.title}
            </h4>
            <p className="mt-1 text-white/70">{item.description}</p>
            <a
              href={item.route}
              className="mt-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-orange-300 transition hover:text-orange-100"
            >
              {item.actionLabel}
            </a>
          </article>
        ))}
        {recommendations.length === 0 && (
          <p className="text-sm text-white/60">
            Recommendations appear after you upload stems or generate music.
          </p>
        )}
      </div>
    </div>
  );
}
