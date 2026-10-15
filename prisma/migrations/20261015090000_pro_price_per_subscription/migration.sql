-- The price each Pro subscription runs at. Every subscription so far was sold at €10 a month.
ALTER TABLE "StartupProfile" ADD COLUMN "proPriceCents" INTEGER;
ALTER TABLE "CreatorProfile" ADD COLUMN "proPriceCents" INTEGER;

UPDATE "StartupProfile" SET "proPriceCents" = 1000 WHERE "stripeSubscriptionId" IS NOT NULL;
UPDATE "CreatorProfile" SET "proPriceCents" = 1000 WHERE "stripeSubscriptionId" IS NOT NULL;
