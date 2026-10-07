-- A check task that closed itself because its cause went away comes back at once when the cause returns; one the admin
-- ticked off waits a day first. This tells the two apart.
ALTER TABLE "AdminTask" ADD COLUMN "autoClosed" BOOLEAN NOT NULL DEFAULT false;
