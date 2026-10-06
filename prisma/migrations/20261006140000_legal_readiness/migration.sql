-- Proof of acceptance of the terms and privacy policy at sign-up.
ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN "termsVersion" TEXT,
ADD COLUMN "ageConfirmedAt" TIMESTAMP(3);

-- Outreach: documented consent per address, and a list of addresses that must never be mailed again.
ALTER TABLE "OutreachAddress" ADD COLUMN "consentNote" TEXT,
ADD COLUMN "consentAt" TIMESTAMP(3);

CREATE TABLE "OutreachSuppression" (
    "id" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachSuppression_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OutreachSuppression_emailHash_key" ON "OutreachSuppression"("emailHash");

-- Open and click tracking is no longer recorded: what was collected is removed. The columns stay for now
-- (the previous deployment still reads them); a later migration drops them.
UPDATE "OutreachDelivery" SET "openedAt" = NULL, "clickedAt" = NULL, "openCount" = 0, "clickCount" = 0;
DELETE FROM "OutreachDeliveryEvent";
