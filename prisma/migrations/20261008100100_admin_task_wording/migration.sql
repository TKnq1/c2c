-- The Claude panel on the right of the admin pages is gone, so the seeded task no longer says "im Panel".
UPDATE "AdminTask" SET "title" = 'Claude-Briefing, Chat und Aufgaben von Claude' WHERE "id" = 'seed-claude-briefing' AND "title" = 'Claude-Briefing, Chat und Aufgaben von Claude im Panel';
