-- The admin dashboard's own inbox: the daily and weekly reports and the urgent notices, shown in the dashboard and
-- (when switched on per kind) mailed to the admins.
CREATE TYPE "AdminNoticeKind" AS ENUM ('DAILY', 'WEEKLY', 'URGENT');

CREATE TABLE "AdminNotice" (
    "id" TEXT NOT NULL,
    "kind" "AdminNoticeKind" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "dedupeKey" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminNotice_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminNotice_dedupeKey_key" ON "AdminNotice"("dedupeKey");
CREATE INDEX "AdminNotice_createdAt_idx" ON "AdminNotice"("createdAt");
CREATE INDEX "AdminNotice_readAt_idx" ON "AdminNotice"("readAt");

ALTER TABLE "AdminPreference" ADD COLUMN "mailDaily" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AdminPreference" ADD COLUMN "mailUrgent" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AdminPreference" ADD COLUMN "mailWeekly" BOOLEAN NOT NULL DEFAULT true;
