-- The optional "How did you hear about us?" answer (a fixed code, see src/lib/heard-from.ts).
ALTER TABLE "User" ADD COLUMN "heardFrom" TEXT;
