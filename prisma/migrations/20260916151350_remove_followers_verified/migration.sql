/*
  Warnings:

  - You are about to drop the column `followersVerified` on the `CreatorPlatform` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CreatorPlatform" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "creatorId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "followerCount" INTEGER NOT NULL DEFAULT 0,
    "url" TEXT,
    CONSTRAINT "CreatorPlatform_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CreatorPlatform" ("creatorId", "followerCount", "id", "platform", "url") SELECT "creatorId", "followerCount", "id", "platform", "url" FROM "CreatorPlatform";
DROP TABLE "CreatorPlatform";
ALTER TABLE "new_CreatorPlatform" RENAME TO "CreatorPlatform";
CREATE UNIQUE INDEX "CreatorPlatform_creatorId_platform_key" ON "CreatorPlatform"("creatorId", "platform");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
