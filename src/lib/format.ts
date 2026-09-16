export function formatCents(cents: number): string {
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

// Follower counts drift constantly, so public displays show a rounded-down
// "orientation" figure (e.g. "12K+") rather than a false-precision exact
// number. Floors (never rounds up) so the "+" is always honest.
export function formatFollowers(count: number): string {
  if (count < 1000) return `${count}`;
  if (count < 1_000_000) return `${Math.floor(count / 1000)}K+`;
  return `${Math.floor(count / 100_000) / 10}M+`;
}
