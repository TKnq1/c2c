-- Security hardening. Additive on purpose (previews share the live database and the
-- previous release keeps running on it until the new one is live): new tables and
-- columns, and `token` becomes optional instead of being renamed.


-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "totpLastStep" INTEGER;

-- AlterTable
ALTER TABLE "PasswordResetToken" ADD COLUMN     "tokenHash" TEXT,
ALTER COLUMN "token" DROP NOT NULL;

-- AlterTable
ALTER TABLE "EmailVerificationToken" ADD COLUMN     "tokenHash" TEXT,
ALTER COLUMN "token" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "closedByAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RateLimitHit" (
    "id" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateLimitHit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevokedSession" (
    "sid" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevokedSession_pkey" PRIMARY KEY ("sid")
);

-- CreateTable
CREATE TABLE "AdminAuditLog" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "targetId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateLimitHit_bucket_key_createdAt_idx" ON "RateLimitHit"("bucket", "key", "createdAt");

-- CreateIndex
CREATE INDEX "RateLimitHit_createdAt_idx" ON "RateLimitHit"("createdAt");

-- CreateIndex
CREATE INDEX "RevokedSession_expiresAt_idx" ON "RevokedSession"("expiresAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_adminId_createdAt_idx" ON "AdminAuditLog"("adminId", "createdAt");

-- CreateIndex
CREATE INDEX "AdminAuditLog_targetId_idx" ON "AdminAuditLog"("targetId");

-- CreateIndex
CREATE INDEX "AdminAuditLog_createdAt_idx" ON "AdminAuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "LoginAttempt_ipAddress_createdAt_idx" ON "LoginAttempt"("ipAddress", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");


-- Password reset and email verification links are stored hashed from now on (tokenHash).
-- The plaintext column is emptied: links issued before this migration stop working,
-- the person asks for a new one.
UPDATE "PasswordResetToken" SET "token" = NULL WHERE "token" IS NOT NULL;
UPDATE "EmailVerificationToken" SET "token" = NULL WHERE "token" IS NOT NULL;
DELETE FROM "PasswordResetToken" WHERE "expiresAt" < now() - interval '1 day';
DELETE FROM "EmailVerificationToken" WHERE "expiresAt" < now() - interval '1 day';

-- Email addresses are compared in lower case. Accounts that differ only by letter case
-- are left alone (and the unique index is skipped) so nothing is merged by accident.
UPDATE "User" AS u
SET "email" = lower(u."email")
WHERE u."email" <> lower(u."email")
  AND NOT EXISTS (SELECT 1 FROM "User" o WHERE o."id" <> u."id" AND lower(o."email") = lower(u."email"));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "User" GROUP BY lower("email") HAVING count(*) > 1) THEN
    RAISE NOTICE 'Accounts differ only by letter case: lower(email) unique index skipped. Resolve them, then create "User_email_lower_key".';
  ELSE
    CREATE UNIQUE INDEX IF NOT EXISTS "User_email_lower_key" ON "User" (lower("email"));
  END IF;
END $$;

-- Links shown to other people are http(s) only (see httpUrl in src/lib/validation.ts).
UPDATE "StartupProfile" SET "website" = NULL WHERE "website" IS NOT NULL AND "website" !~* '^https?://';
UPDATE "CreatorPlatform" SET "url" = NULL WHERE "url" IS NOT NULL AND "url" !~* '^https?://';
DELETE FROM "StartupSocialLink" WHERE "url" !~* '^https?://';
