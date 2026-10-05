-- CreateTable
CREATE TABLE "OutreachMailing" (
    "id" TEXT NOT NULL,
    "side" "OutreachSide" NOT NULL,
    "subject" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachMailing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutreachMailing_createdAt_idx" ON "OutreachMailing"("createdAt");

-- AlterTable
ALTER TABLE "OutreachDelivery" ADD COLUMN "mailingId" TEXT,
ADD COLUMN "recipientName" TEXT NOT NULL DEFAULT '',
ADD COLUMN "recipientEmail" TEXT NOT NULL DEFAULT '';

-- A send that already happened becomes its own mailing, so it still shows
-- up in the sent list. The subject was not stored, so it stays blank.
INSERT INTO "OutreachMailing" ("id", "side", "subject", "createdAt")
SELECT d."id", a."side", '', d."sentAt"
FROM "OutreachDelivery" d
JOIN "OutreachAddress" a ON a."id" = d."addressId";

UPDATE "OutreachDelivery" d
SET
  "mailingId" = d."id",
  "recipientName" = a."name",
  "recipientEmail" = a."email"
FROM "OutreachAddress" a
WHERE a."id" = d."addressId";

-- Any row that could not be matched is dropped. Nothing to show it under.
DELETE FROM "OutreachDelivery" WHERE "mailingId" IS NULL;

ALTER TABLE "OutreachDelivery" ALTER COLUMN "mailingId" SET NOT NULL;
ALTER TABLE "OutreachDelivery" ALTER COLUMN "recipientName" DROP DEFAULT;
ALTER TABLE "OutreachDelivery" ALTER COLUMN "recipientEmail" DROP DEFAULT;

-- DropForeignKey
ALTER TABLE "OutreachDelivery" DROP CONSTRAINT "OutreachDelivery_addressId_fkey";

-- AlterTable
ALTER TABLE "OutreachDelivery" ALTER COLUMN "addressId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "OutreachDelivery" ADD CONSTRAINT "OutreachDelivery_mailingId_fkey" FOREIGN KEY ("mailingId") REFERENCES "OutreachMailing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachDelivery" ADD CONSTRAINT "OutreachDelivery_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "OutreachAddress"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "OutreachDelivery_mailingId_idx" ON "OutreachDelivery"("mailingId");
