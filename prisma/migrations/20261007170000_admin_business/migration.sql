-- Admin dashboard, packages 2 to 5: the business figures (cash, fixed costs, ads), the mail log, Pro events, the decision log
-- and the cache of outside services. Plus the open items that wait for a Claude API key, and a first set of decisions.

-- CreateEnum
CREATE TYPE "FixedCostInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ProEventKind" AS ENUM ('STARTED', 'ENDED');

-- CreateTable
CREATE TABLE "AdminSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "cashBalanceCents" INTEGER,
    "cashBalanceAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashSnapshot" (
    "id" TEXT NOT NULL,
    "balanceCents" INTEGER NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CashSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedCost" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "interval" "FixedCostInterval" NOT NULL DEFAULT 'MONTHLY',
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FixedCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdSpend" (
    "id" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "channel" TEXT NOT NULL,
    "campaignKey" TEXT NOT NULL,
    "campaignName" TEXT NOT NULL,
    "spendCents" INTEGER NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdSpend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailLog" (
    "id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProEvent" (
    "id" TEXT NOT NULL,
    "kind" "ProEventKind" NOT NULL,
    "side" "Role" NOT NULL,
    "profileId" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisionLog" (
    "id" TEXT NOT NULL,
    "decidedOn" DATE NOT NULL,
    "title" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DecisionLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalSnapshot" (
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "fetchedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalSnapshot_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "CashSnapshot_at_idx" ON "CashSnapshot"("at");

-- CreateIndex
CREATE INDEX "AdSpend_day_idx" ON "AdSpend"("day");

-- CreateIndex
CREATE UNIQUE INDEX "AdSpend_day_channel_campaignKey_key" ON "AdSpend"("day", "channel", "campaignKey");

-- CreateIndex
CREATE INDEX "MailLog_createdAt_idx" ON "MailLog"("createdAt");

-- CreateIndex
CREATE INDEX "ProEvent_at_idx" ON "ProEvent"("at");

-- CreateIndex
CREATE INDEX "DecisionLog_decidedOn_idx" ON "DecisionLog"("decidedOn");

-- Things the dashboard does not do yet because they run through the Claude API (billed per use, not part of the Pro plan).
INSERT INTO "AdminTask" ("id", "title", "reason", "priority", "source", "status", "href", "dedupeKey", "updatedAt")
VALUES
  ('seed-claude-briefing', 'Claude-Briefing, Chat und Aufgaben von Claude im Panel', 'Läuft über die Claude-API (Key und Guthaben nötig, nicht im Pro-Abo). Noch nicht gebaut.', 'LOW', 'MANUAL', 'OPEN', NULL, 'seed-claude-briefing', CURRENT_TIMESTAMP),
  ('seed-claude-content', 'Content-Studio: Post- und Textentwürfe mit Claude', 'Läuft über die Claude-API (Key und Guthaben nötig, nicht im Pro-Abo). Noch nicht gebaut.', 'LOW', 'MANUAL', 'OPEN', NULL, 'seed-claude-content', CURRENT_TIMESTAMP),
  ('seed-claude-weekly', 'Wochenrückblick von Claude und Claude-Verbrauch mit Monatslimit', 'Läuft über die Claude-API (Key und Guthaben nötig, nicht im Pro-Abo). Noch nicht gebaut.', 'LOW', 'MANUAL', 'OPEN', NULL, 'seed-claude-weekly', CURRENT_TIMESTAMP);

-- The decisions made so far, so the log starts with something.
INSERT INTO "DecisionLog" ("id", "decidedOn", "title", "decision", "reason")
VALUES
  ('seed-decision-founding', '2026-10-06', 'Founding-Plätze: die ersten 50 Marken und 100 Creator', 'Pro auf Lebenszeit für die ersten 50 Marken und die ersten 100 Creator. Ein freigewordener Platz (gelöschtes Konto) wird neu vergeben.', 'Frühe Nutzer belohnen und das Erfolgsgefühl im Onboarding stärken.'),
  ('seed-decision-dashboard', '2026-10-07', 'Admin-Dashboard: Seitenleiste, Karten und Claude-Panel, grüner Akzent, Deutsch', 'Das Dashboard wächst aus dem bestehenden Admin-Bereich. Layout mit Claude-Panel rechts (einklappbar), Fortschrittsringe für Ziele, ⌘K-Suche.', 'Nach dem Vergleich von vier Layouts so gewählt.'),
  ('seed-decision-song', '2026-10-07', 'Morgen-Song nur lokal im Browser', 'Die Song-Datei bleibt im Browser des Admins (IndexedDB) und wird nie hochgeladen.', 'Keine Kopie einer urheberrechtlich geschützten Datei auf dem Server oder im Repo, und nicht für jeden abrufbar.'),
  ('seed-decision-utm', '2026-10-07', 'Kampagnen-Erfassung über Link-Parameter statt Tracking-Pixel', 'Anzeigenlinks tragen utm_*-Parameter, die beim Signup am Konto gespeichert werden. Kein Cookie, kein Pixel.', 'Die App bleibt frei von Trackern und braucht keinen Einwilligungsbanner.'),
  ('seed-decision-claude', '2026-10-07', 'Claude-Funktionen im Dashboard vorerst nicht bauen', 'Content-Studio, Briefing, Chat, Aufgaben von Claude, Wochenrückblick und Verbrauchsübersicht bleiben als offene Aufgaben liegen.', 'Sie laufen über die Claude-API und sind nicht im Pro-Abo enthalten (Kosten pro Nutzung).');
