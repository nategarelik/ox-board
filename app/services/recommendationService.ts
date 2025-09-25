import {
  Recommendation,
  StemTrack,
  SubscriptionTier,
} from "../types/stem-player";

export async function fetchPersonalizedRecommendations(
  track: StemTrack,
  tier: SubscriptionTier,
): Promise<Recommendation[]> {
  const response = await fetch(
    `/api/recommendations?trackId=${encodeURIComponent(track.id)}&tier=${tier}`,
    {
      method: "GET",
    },
  );

  if (!response.ok) {
    throw new Error("Unable to fetch recommendation feed");
  }

  const { recommendations } = await response.json();
  return recommendations;
}
