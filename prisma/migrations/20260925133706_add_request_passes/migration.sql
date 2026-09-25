-- CreateTable
CREATE TABLE "RequestPass" (
    "id" TEXT NOT NULL,
    "creatorId" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestPass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RequestPass_creatorId_requestId_key" ON "RequestPass"("creatorId", "requestId");

-- AddForeignKey
ALTER TABLE "RequestPass" ADD CONSTRAINT "RequestPass_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "CreatorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RequestPass" ADD CONSTRAINT "RequestPass_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
