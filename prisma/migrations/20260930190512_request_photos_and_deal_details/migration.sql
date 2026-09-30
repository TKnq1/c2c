-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "budgetMaxCents" INTEGER,
ADD COLUMN     "budgetMinCents" INTEGER,
ADD COLUMN     "deliverables" TEXT,
ADD COLUMN     "platform" TEXT,
ADD COLUMN     "postBy" DATE,
ADD COLUMN     "productIncluded" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "RequestImage" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "contentType" TEXT NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RequestImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RequestImage_requestId_position_idx" ON "RequestImage"("requestId", "position");

-- AddForeignKey
ALTER TABLE "RequestImage" ADD CONSTRAINT "RequestImage_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE ON UPDATE CASCADE;

