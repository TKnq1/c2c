-- A creator now picks up to three niches. This is the expand step: `niches`
-- is added and filled from `niche`, which stays as the first of them (the
-- app keeps it in sync) so the release before this one keeps working on this
-- schema while a deploy rolls out. A later migration drops `niche`.
--
-- Safe to run on a database an earlier draft of this change already touched
-- (that draft dropped `niche`): the column is added back if it's missing,
-- and each of the two is filled from the other wherever it's empty.

-- AlterTable
ALTER TABLE "CreatorProfile" ADD COLUMN IF NOT EXISTS "niches" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "CreatorProfile" ADD COLUMN IF NOT EXISTS "niche" TEXT NOT NULL DEFAULT '';
ALTER TABLE "CreatorProfile" ALTER COLUMN "niche" SET DEFAULT '';

-- "" is what a creator mid-onboarding has; it stays an empty list.
UPDATE "CreatorProfile" SET "niches" = ARRAY["niche"]
WHERE "niche" <> '' AND COALESCE(cardinality("niches"), 0) = 0;
UPDATE "CreatorProfile" SET "niche" = "niches"[1]
WHERE "niche" = '' AND COALESCE(cardinality("niches"), 0) > 0;
