-- CreateEnum
CREATE TYPE "OutreachEventKind" AS ENUM ('OPEN', 'CLICK');

-- CreateTable
CREATE TABLE "OutreachDelivery" (
    "id" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "resendId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedAt" TIMESTAMP(3),
    "clickedAt" TIMESTAMP(3),
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "clickCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OutreachDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutreachDeliveryEvent" (
    "id" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "kind" "OutreachEventKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachDeliveryEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutreachDelivery_resendId_key" ON "OutreachDelivery"("resendId");

-- CreateIndex
CREATE INDEX "OutreachDelivery_addressId_sentAt_idx" ON "OutreachDelivery"("addressId", "sentAt");

-- AddForeignKey
ALTER TABLE "OutreachDelivery" ADD CONSTRAINT "OutreachDelivery_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "OutreachAddress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OutreachDeliveryEvent" ADD CONSTRAINT "OutreachDeliveryEvent_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "OutreachDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
