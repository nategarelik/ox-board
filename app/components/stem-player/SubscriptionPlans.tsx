"use client";

import clsx from "clsx";
import { getSubscriptionPlans } from "../../services/subscriptionService";
import { SubscriptionTier } from "../../types/stem-player";

interface SubscriptionPlansProps {
  currentTier: SubscriptionTier;
  onTierSelect: (tier: SubscriptionTier) => void;
}

export default function SubscriptionPlans({
  currentTier,
  onTierSelect,
}: SubscriptionPlansProps) {
  const plans = getSubscriptionPlans();

  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6 text-white shadow-xl shadow-black/30">
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold">Choose your plan</h3>
        <p className="text-sm text-white/70">
          Unlock lossless stems, high-volume exports, and commercial licenses
          with flexible tiers built for creators.
        </p>
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => onTierSelect(plan.id)}
            className={clsx(
              "flex h-full flex-col gap-4 rounded-2xl border p-5 text-left transition",
              plan.highlight
                ? "border-purple-400/60 bg-purple-500/10 shadow-lg shadow-purple-500/40"
                : "border-white/10 bg-black/60 hover:border-white/20",
              currentTier === plan.id && "ring-2 ring-orange-400/60",
            )}
          >
            <div className="flex items-baseline justify-between">
              <h4 className="text-lg font-semibold">{plan.name}</h4>
              <span className="text-sm text-white/70">{plan.price}</span>
            </div>
            {plan.annualPrice && (
              <p className="text-xs uppercase tracking-[0.3em] text-orange-200">
                {plan.annualPrice}
              </p>
            )}
            <p className="text-sm text-white/70">{plan.description}</p>
            <ul className="flex flex-col gap-2 text-xs text-white/80">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500" />
                  {feature}
                </li>
              ))}
            </ul>
            <ul className="flex flex-col gap-1 text-[11px] uppercase tracking-[0.2em] text-white/40">
              {plan.limits.map((limit) => (
                <li key={limit}>{limit}</li>
              ))}
            </ul>
            <span
              className={clsx(
                "mt-auto inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em]",
                currentTier === plan.id
                  ? "bg-white text-black"
                  : "bg-white/10 text-white/70",
              )}
            >
              {currentTier === plan.id ? "Current Plan" : "Switch"}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
