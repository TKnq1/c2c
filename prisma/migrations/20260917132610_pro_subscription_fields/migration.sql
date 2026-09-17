-- AlterTable
ALTER TABLE "StartupProfile" ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "stripeSubscriptionId" TEXT;

-- CreateIndex
CREATE INDEX "StartupProfile_stripeCustomerId_idx" ON "StartupProfile"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "StartupProfile_stripeSubscriptionId_idx" ON "StartupProfile"("stripeSubscriptionId");
