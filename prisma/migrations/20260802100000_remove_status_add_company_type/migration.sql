-- AlterTable
ALTER TABLE "companies" DROP COLUMN "status";
ALTER TABLE "companies" ADD COLUMN     "company_type" VARCHAR(100);
