// A transparent, explainable "Best match" score — not a black-box model,
// just a weighted blend of signals that actually matter when picking a
// collab partner: proven quality, track record, and responsiveness. New
// profiles get a neutral (not punishing) score on signals they don't have
// data for yet, so lacking history doesn't permanently bury them under
// established ones — the cold-start problem a naive "sort by rating" has.
const WEIGHTS = { rating: 0.4, completedCollabs: 0.3, responseTime: 0.2, recency: 0.1 };
const COLLABS_CAP = 10; // saturates here — #1 at 10 vs 50 completed collabs shouldn't matter much more
const RESPONSE_TIME_CAP_MS = 3 * 24 * 60 * 60 * 1000; // 3 days, matches formatResponseTime's own "varies" cutoff
const RECENCY_HALF_LIFE_DAYS = 60;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function computeRelevanceScore(entry: {
  rating: { average: number; count: number };
  completedCollabs: number;
  responseTimeMs: number | null;
  createdAt: number;
}): number {
  const ratingScore = entry.rating.count > 0 ? entry.rating.average / 5 : 0.5;
  const collabsScore = Math.min(entry.completedCollabs / COLLABS_CAP, 1);
  const responseScore =
    entry.responseTimeMs === null ? 0.5 : Math.max(0, 1 - entry.responseTimeMs / RESPONSE_TIME_CAP_MS);
  const daysOld = (Date.now() - entry.createdAt) / MS_PER_DAY;
  const recencyScore = 1 / (1 + daysOld / RECENCY_HALF_LIFE_DAYS);

  return (
    ratingScore * WEIGHTS.rating +
    collabsScore * WEIGHTS.completedCollabs +
    responseScore * WEIGHTS.responseTime +
    recencyScore * WEIGHTS.recency
  );
}
