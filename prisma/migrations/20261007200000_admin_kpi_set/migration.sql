-- Which four figures stand at the top of "Heute": growth (default), money, marketing or one of each.
ALTER TABLE "AdminPreference" ADD COLUMN "kpiSet" TEXT NOT NULL DEFAULT 'wachstum';
