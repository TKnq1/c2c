-- When a founding brand was told about its Pro (see src/lib/founding-notice.ts). Brands that got their place
-- through the migration before this one stay null until the admin sends the notice.
ALTER TABLE "StartupProfile" ADD COLUMN "foundingNoticeSentAt" TIMESTAMP(3);
