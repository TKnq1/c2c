-- Admin dashboard: per-admin settings, the "Offen" task list, and the ad campaign a sign-up came from.

-- CreateEnum
CREATE TYPE "AdminTaskPriority" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "AdminTaskSource" AS ENUM ('CHECK', 'CLAUDE', 'MANUAL');

-- CreateEnum
CREATE TYPE "AdminTaskStatus" AS ENUM ('OPEN', 'DONE', 'SNOOZED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "utmCampaign" TEXT,
ADD COLUMN     "utmContent" TEXT,
ADD COLUMN     "utmMedium" TEXT,
ADD COLUMN     "utmSource" TEXT;

-- CreateTable
CREATE TABLE "AdminPreference" (
    "userId" TEXT NOT NULL,
    "displayName" TEXT,
    "accent" TEXT NOT NULL DEFAULT 'green',
    "compact" BOOLEAN NOT NULL DEFAULT false,
    "hiddenTiles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "tileOrder" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "goalBrands" INTEGER NOT NULL DEFAULT 50,
    "goalCreators" INTEGER NOT NULL DEFAULT 100,
    "goalMonthlyFeeCents" INTEGER NOT NULL DEFAULT 100000,
    "morningEnabled" BOOLEAN NOT NULL DEFAULT true,
    "morningFromHour" INTEGER NOT NULL DEFAULT 5,
    "morningToHour" INTEGER NOT NULL DEFAULT 11,
    "morningEveryTime" BOOLEAN NOT NULL DEFAULT false,
    "songVolume" INTEGER NOT NULL DEFAULT 55,
    "panelOpen" BOOLEAN NOT NULL DEFAULT true,
    "setupDoneAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminPreference_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "AdminTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "reason" TEXT,
    "priority" "AdminTaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "source" "AdminTaskSource" NOT NULL,
    "status" "AdminTaskStatus" NOT NULL DEFAULT 'OPEN',
    "href" TEXT,
    "dedupeKey" TEXT,
    "snoozedUntil" TIMESTAMP(3),
    "doneAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminTask_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdminTask_dedupeKey_key" ON "AdminTask"("dedupeKey");

-- CreateIndex
CREATE INDEX "AdminTask_status_priority_idx" ON "AdminTask"("status", "priority");

-- AddForeignKey
ALTER TABLE "AdminPreference" ADD CONSTRAINT "AdminPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Two open items the owner already knows about, so the list starts with something real.
INSERT INTO "AdminTask" ("id", "title", "reason", "priority", "source", "status", "href", "dedupeKey", "updatedAt")
VALUES
  ('seed-agb-founding', 'AGB: Founding-Satz rechtlich prüfen lassen', 'Der Satz zu lebenslangem Pro für die ersten Marken und Creator', 'MEDIUM', 'MANUAL', 'OPEN', '/legal/terms', 'seed-agb-founding', CURRENT_TIMESTAMP),
  ('seed-search-console-favicon', 'Search Console: Indexierung für das neue Favicon beantragen', 'Damit Google das neue Symbol schneller übernimmt', 'LOW', 'MANUAL', 'OPEN', NULL, 'seed-search-console-favicon', CURRENT_TIMESTAMP);
