-- CreateEnum
CREATE TYPE "OutreachSide" AS ENUM ('CREATOR', 'STARTUP');

-- CreateTable
CREATE TABLE "OutreachAddress" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "side" "OutreachSide" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OutreachAddress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutreachAddress_email_side_key" ON "OutreachAddress"("email", "side");

-- CreateIndex
CREATE INDEX "OutreachAddress_side_createdAt_idx" ON "OutreachAddress"("side", "createdAt");
