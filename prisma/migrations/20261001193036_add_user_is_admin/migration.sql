-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false;

-- Everyone with role ADMIN keeps admin access through the new flag.
UPDATE "User" SET "isAdmin" = true WHERE "role" = 'ADMIN';

-- An admin account that also has a brand or creator profile gets that role
-- back, so it can use the app normally again (and still open /admin).
UPDATE "User" SET "role" = 'STARTUP'
WHERE "role" = 'ADMIN' AND EXISTS (SELECT 1 FROM "StartupProfile" s WHERE s."userId" = "User"."id");

UPDATE "User" SET "role" = 'CREATOR'
WHERE "role" = 'ADMIN' AND EXISTS (SELECT 1 FROM "CreatorProfile" c WHERE c."userId" = "User"."id");
