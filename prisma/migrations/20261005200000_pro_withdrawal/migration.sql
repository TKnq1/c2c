-- CreateTable
CREATE TABLE "ProWithdrawal" (
    "id" TEXT NOT NULL,
    "startupId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "stripeRefundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProWithdrawal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProWithdrawal_createdAt_idx" ON "ProWithdrawal"("createdAt");

-- AddForeignKey
ALTER TABLE "ProWithdrawal" ADD CONSTRAINT "ProWithdrawal_startupId_fkey" FOREIGN KEY ("startupId") REFERENCES "StartupProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
