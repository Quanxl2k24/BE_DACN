-- AlterEnum
BEGIN;
CREATE TYPE "JobStatus_new" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'SUSPENDED');
ALTER TABLE "public"."jobs" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "jobs" ALTER COLUMN "status" TYPE "JobStatus_new" USING ("status"::text::"JobStatus_new");
ALTER TYPE "JobStatus" RENAME TO "JobStatus_old";
ALTER TYPE "JobStatus_new" RENAME TO "JobStatus";
DROP TYPE "public"."JobStatus_old";
ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'PUBLISHED';
COMMIT;

-- AlterTable
ALTER TABLE "jobs" ALTER COLUMN "status" SET DEFAULT 'PUBLISHED';
