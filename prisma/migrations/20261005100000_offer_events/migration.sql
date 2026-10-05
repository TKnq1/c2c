-- CreateEnum
CREATE TYPE "OfferEventOutcome" AS ENUM ('PENDING', 'SUPERSEDED', 'DECLINED', 'WITHDRAWN', 'ACCEPTED');

-- CreateTable
CREATE TABLE "OfferEvent" (
    "id" TEXT NOT NULL,
    "interestId" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "payoutCents" INTEGER,
    "outcome" "OfferEventOutcome" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfferEvent_interestId_createdAt_idx" ON "OfferEvent"("interestId", "createdAt");

-- AddForeignKey
ALTER TABLE "OfferEvent" ADD CONSTRAINT "OfferEvent_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One row for each offer that already exists, so those threads have a
-- starting point. Declined and withdrawn offers were cleared and can't be
-- reconstructed.
INSERT INTO "OfferEvent" ("id", "interestId", "role", "amountCents", "payoutCents", "outcome", "createdAt")
SELECT
    'legacy_' || i."id",
    i."id",
    i."offerRole",
    i."amountCents",
    i."payoutCents",
    CASE
        WHEN i."paymentStatus" = 'OFFERED' THEN 'PENDING'::"OfferEventOutcome"
        ELSE 'ACCEPTED'::"OfferEventOutcome"
    END,
    COALESCE(i."offeredAt", i."createdAt")
FROM "Interest" i
WHERE i."amountCents" IS NOT NULL
  AND i."paymentStatus" IS NOT NULL
  AND i."offerRole" IS NOT NULL;
