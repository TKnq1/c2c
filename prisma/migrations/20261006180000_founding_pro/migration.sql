-- Founding brands: the first 50 brands get Pro for as long as the account exists (see src/lib/founding.ts).
ALTER TABLE "StartupProfile" ADD COLUMN "foundingNumber" INTEGER;
CREATE UNIQUE INDEX "StartupProfile_foundingNumber_key" ON "StartupProfile"("foundingNumber");

-- Brands that already exist count too: the oldest 50 accounts that are neither deleted nor suspended
-- get numbers 1..50 in the order they signed up. A brand that already pays for Pro keeps its
-- subscription state and proSince.
WITH ranked AS (
  SELECT sp."id", ROW_NUMBER() OVER (ORDER BY u."createdAt", sp."id") AS n
  FROM "StartupProfile" sp
  JOIN "User" u ON u."id" = sp."userId"
  WHERE u."deletedAt" IS NULL AND u."suspendedAt" IS NULL
)
UPDATE "StartupProfile" sp
SET "foundingNumber" = ranked.n,
    "isPro" = true,
    "proSince" = COALESCE(sp."proSince", now())
FROM ranked
WHERE sp."id" = ranked."id" AND ranked.n <= 50;
