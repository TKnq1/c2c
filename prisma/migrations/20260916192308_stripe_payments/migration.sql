-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'ACCEPTED';

-- AlterTable
ALTER TABLE "CreatorProfile" ADD COLUMN     "stripeAccountId" TEXT,
ADD COLUMN     "stripeOnboarded" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Interest" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "stripeChargeId" TEXT,
ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripeRefundId" TEXT,
ADD COLUMN     "stripeTransferId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Interest_stripeCheckoutSessionId_key" ON "Interest"("stripeCheckoutSessionId");

