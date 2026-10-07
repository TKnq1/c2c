-- The admin dashboard starts calmer: the right-hand panel is closed until it is opened. The one admin who has used the
-- dashboard so far asked for exactly this, so the stored choice is reset once too.
ALTER TABLE "AdminPreference" ALTER COLUMN "panelOpen" SET DEFAULT false;
UPDATE "AdminPreference" SET "panelOpen" = false;
