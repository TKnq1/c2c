-- A creator now picks up to three niches instead of one. Existing creators
-- keep theirs; "" is the placeholder a creator mid-onboarding has, which
-- becomes an empty list.

-- AlterTable
ALTER TABLE "CreatorProfile" ADD COLUMN     "niches" TEXT[] DEFAULT ARRAY[]::TEXT[];

UPDATE "CreatorProfile" SET "niches" = ARRAY["niche"] WHERE "niche" <> '';

-- AlterTable
ALTER TABLE "CreatorProfile" DROP COLUMN "niche";
