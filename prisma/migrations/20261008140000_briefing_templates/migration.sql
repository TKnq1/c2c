
-- CreateTable
CREATE TABLE "BriefingTemplate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BriefingTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BriefingDraft" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "values" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BriefingDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BriefingTemplate_userId_updatedAt_idx" ON "BriefingTemplate"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "BriefingTemplate_userId_name_key" ON "BriefingTemplate"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "BriefingDraft_requestId_key" ON "BriefingDraft"("requestId");

-- AddForeignKey
ALTER TABLE "BriefingTemplate" ADD CONSTRAINT "BriefingTemplate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BriefingDraft" ADD CONSTRAINT "BriefingDraft_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;
