-- AlterTable
ALTER TABLE "WaitlistEntry" ADD COLUMN     "confirmSentAt" TIMESTAMP(3),
ADD COLUMN     "confirmToken" TEXT,
ADD COLUMN     "confirmedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_confirmToken_key" ON "WaitlistEntry"("confirmToken");
