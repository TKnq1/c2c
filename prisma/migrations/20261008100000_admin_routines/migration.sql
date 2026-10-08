-- The daily plan on the admin's "Heute" page: which routines were ticked off on which day (Europe/Berlin).
CREATE TABLE "AdminRoutineCheck" (
    "id" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "doneAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminRoutineCheck_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AdminRoutineCheck_adminId_day_key_key" ON "AdminRoutineCheck"("adminId", "day", "key");
CREATE INDEX "AdminRoutineCheck_adminId_day_idx" ON "AdminRoutineCheck"("adminId", "day");
