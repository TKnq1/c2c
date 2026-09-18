-- AlterTable
ALTER TABLE "Interest" ADD COLUMN     "initiatedBy" "Role" NOT NULL DEFAULT 'CREATOR';
