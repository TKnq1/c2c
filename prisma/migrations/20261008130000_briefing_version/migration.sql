-- AlterTable
ALTER TABLE "CampaignBriefing" ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "Interest" ADD COLUMN     "offerBriefingVersion" INTEGER;
