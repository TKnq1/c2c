-- AlterEnum
ALTER TYPE "DisputeReason" ADD VALUE 'CHARGEBACK';

-- DropIndex
DROP INDEX "Invoice_dealId_kind_key";

-- AlterTable
ALTER TABLE "DealDispute" ADD COLUMN     "stripeDisputeId" TEXT;

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "cancelReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelsInvoiceId" TEXT,
ADD COLUMN     "revision" INTEGER NOT NULL DEFAULT 0;


-- CreateIndex
CREATE UNIQUE INDEX "DealDispute_stripeDisputeId_key" ON "DealDispute"("stripeDisputeId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_cancelsInvoiceId_key" ON "Invoice"("cancelsInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_dealId_kind_revision_key" ON "Invoice"("dealId", "kind", "revision");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_cancelsInvoiceId_fkey" FOREIGN KEY ("cancelsInvoiceId") REFERENCES "Invoice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
