import { FOUNDING_BRAND_LIMIT, FOUNDING_CREATOR_LIMIT } from "@/lib/constants";

// The founding places: the first brands and the first creators get Pro for as long as their account exists.
// Each side has its own numbers (brand no. 1 and creator no. 1 both exist) and its own limit. Kept apart from
// src/lib/founding.ts, which talks to the database, so the wizard can use it too.
export type FoundingSide = "brand" | "creator";

export const FOUNDING_LIMIT: Record<FoundingSide, number> = {
  brand: FOUNDING_BRAND_LIMIT,
  creator: FOUNDING_CREATOR_LIMIT,
};
