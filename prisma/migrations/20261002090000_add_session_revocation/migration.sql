-- AlterTable
ALTER TABLE "User" ADD COLUMN     "keptSessionId" TEXT,
ADD COLUMN     "sessionsRevokedAt" TIMESTAMP(3);
