// BRAND_DEALS_ENABLED switches the brand-deal feature on for new work: an accepted offer becomes a deal, the briefing
// builder and the Deals screens appear. Off (the default, and what production runs until it is switched on on purpose),
// everything behaves as it did before deals existed.
//
// Off never strands a deal that exists: its pages, the webhooks, the daily job and the admin screen keep working, and the
// Deals tab stays for a person who has deals (see canUseDeals in queries.ts). Only the way in is closed.
//
// next.config.ts copies BRAND_DEALS_ENABLED into NEXT_PUBLIC_BRAND_DEALS_ENABLED, so the navigation (a client component)
// reads the same switch without a request. Both are fixed at build time on Vercel; a change takes a new deployment.

const ON = new Set(["1", "true", "on", "yes"]);

export function parseDealsFlag(raw: string | undefined): boolean {
  return ON.has((raw ?? "").trim().toLowerCase());
}

export function dealsEnabled(): boolean {
  // "||", not "??": the public copy is an empty string when the switch was not set at build time.
  return parseDealsFlag(process.env.NEXT_PUBLIC_BRAND_DEALS_ENABLED || process.env.BRAND_DEALS_ENABLED);
}
