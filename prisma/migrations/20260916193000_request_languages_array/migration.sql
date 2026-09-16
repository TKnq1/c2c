-- AlterTable
ALTER TABLE "Request" DROP COLUMN "language",
ADD COLUMN     "languages" TEXT[] DEFAULT ARRAY['English']::TEXT[];
