-- AlterTable
ALTER TABLE "Interest" ADD COLUMN     "disputeReason" TEXT,
ADD COLUMN     "disputedAt" TIMESTAMP(3),
ADD COLUMN     "proofSubmittedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Interest_paymentStatus_proofSubmittedAt_idx" ON "Interest"("paymentStatus", "proofSubmittedAt");

