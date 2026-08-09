-- CreateEnum
CREATE TYPE "InterviewMode" AS ENUM ('ONLINE', 'OFFLINE');

-- CreateEnum
CREATE TYPE "InterviewStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "interviews" (
    "id" UUID NOT NULL,
    "application_id" UUID NOT NULL,
    "interviewer_id" UUID NOT NULL,
    "scheduled_by" UUID NOT NULL,
    "mode" "InterviewMode" NOT NULL,
    "location" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "note" TEXT,
    "status" "InterviewStatus" NOT NULL DEFAULT 'SCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interviews_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_interviewer_id_fkey" FOREIGN KEY ("interviewer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_scheduled_by_fkey" FOREIGN KEY ("scheduled_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
