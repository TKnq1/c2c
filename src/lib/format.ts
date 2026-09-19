// EUR to match the actual Stripe Checkout/Connect currency (see
// src/lib/actions/payments.ts) — a mismatch here would mean an amount
// displayed as e.g. "$250" is really charged as €250.
export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("de-DE", { style: "currency", currency: "EUR" });
}

// Follower counts drift constantly, so public displays show a rounded-down
// "orientation" figure (e.g. "12K+") rather than a false-precision exact
// number. Floors (never rounds up) so the "+" is always honest.
export function formatFollowers(count: number): string {
  if (count < 1000) return `${count}`;
  if (count < 1_000_000) return `${Math.floor(count / 1000)}K+`;
  return `${Math.floor(count / 100_000) / 10}M+`;
}

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// Drives the "New" badge on Discover cards — a week feels long enough to
// actually be seen by someone browsing, short enough to still mean "new."
export function isRecentlyCreated(createdAt: number): boolean {
  return Date.now() - createdAt < NEW_WINDOW_MS;
}
