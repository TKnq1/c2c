-- Pro for creators: the same plan brands have, €10/month, and a payment gets the reduced fee when either side
-- has it. The first 100 creators get it for as long as their account exists (see src/lib/founding.ts).
ALTER TABLE "CreatorProfile" ADD COLUMN "isPro" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CreatorProfile" ADD COLUMN "proSince" TIMESTAMP(3);
ALTER TABLE "CreatorProfile" ADD COLUMN "stripeCustomerId" TEXT;
ALTER TABLE "CreatorProfile" ADD COLUMN "stripeSubscriptionId" TEXT;
ALTER TABLE "CreatorProfile" ADD COLUMN "foundingNumber" INTEGER;
ALTER TABLE "CreatorProfile" ADD COLUMN "foundingNoticeSentAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "CreatorProfile_foundingNumber_key" ON "CreatorProfile"("foundingNumber");
CREATE INDEX "CreatorProfile_stripeCustomerId_idx" ON "CreatorProfile"("stripeCustomerId");
CREATE INDEX "CreatorProfile_stripeSubscriptionId_idx" ON "CreatorProfile"("stripeSubscriptionId");

-- A withdrawal from Pro can now be a creator's. The release still serving traffic only ever writes startupId.
ALTER TABLE "ProWithdrawal" ALTER COLUMN "startupId" DROP NOT NULL;
ALTER TABLE "ProWithdrawal" ADD COLUMN "creatorId" TEXT;
ALTER TABLE "ProWithdrawal" ADD CONSTRAINT "ProWithdrawal_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Creators that already exist count too, like the founding brands did: the oldest 100 accounts that are neither
-- deleted nor suspended get numbers 1..100 in the order they signed up.
WITH ranked AS (
  SELECT cp."id", ROW_NUMBER() OVER (ORDER BY u."createdAt", cp."id") AS n
  FROM "CreatorProfile" cp
  JOIN "User" u ON u."id" = cp."userId"
  WHERE u."deletedAt" IS NULL AND u."suspendedAt" IS NULL
)
UPDATE "CreatorProfile" cp
SET "foundingNumber" = ranked.n,
    "isPro" = true,
    "proSince" = now()
FROM ranked
WHERE cp."id" = ranked."id" AND ranked.n <= 100;
