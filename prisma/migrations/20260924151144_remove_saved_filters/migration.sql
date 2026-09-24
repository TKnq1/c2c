/*
  Warnings:

  - You are about to drop the `SavedFilter` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "SavedFilter" DROP CONSTRAINT "SavedFilter_userId_fkey";

-- DropTable
DROP TABLE "SavedFilter";
