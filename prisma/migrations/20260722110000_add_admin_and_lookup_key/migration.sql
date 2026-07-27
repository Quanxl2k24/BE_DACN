-- AlterEnum: Thêm giá trị ADMIN vào UserType
ALTER TYPE "UserType" ADD VALUE 'ADMIN';

-- AlterTable: Thêm cột lookup_key cho user_sessions
ALTER TABLE "user_sessions" ADD COLUMN "lookup_key" TEXT;
UPDATE "user_sessions" SET "lookup_key" = '' WHERE "lookup_key" IS NULL;
ALTER TABLE "user_sessions" ALTER COLUMN "lookup_key" SET NOT NULL;
ALTER TABLE "user_sessions" ADD CONSTRAINT "user_sessions_lookup_key_key" UNIQUE ("lookup_key");
