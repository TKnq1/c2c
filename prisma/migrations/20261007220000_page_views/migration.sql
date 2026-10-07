-- Visits to the landing and sign-up pages, counted per day, page and origin. No cookie, no address, no browser string, no
-- identifier of a visitor: only how often a page was opened and where from (the referring site's name or a campaign).
CREATE TABLE "PageView" (
    "id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "page" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "campaign" TEXT NOT NULL DEFAULT '',
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PageView_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PageView_day_page_source_campaign_key" ON "PageView"("day", "page", "source", "campaign");
CREATE INDEX "PageView_day_idx" ON "PageView"("day");
