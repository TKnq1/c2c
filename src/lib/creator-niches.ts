// What a creator's niche choice is stored as. `niche` is the first pick, still
// written so the release before the multi-niche one keeps working on a
// database that's been migrated to this one (see CreatorProfile in
// schema.prisma); nothing reads it any more.
export function creatorNicheColumns(niches: string[]) {
  return { niches, niche: niches[0] ?? "" };
}
