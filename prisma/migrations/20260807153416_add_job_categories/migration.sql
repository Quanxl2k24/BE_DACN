-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "job_category_id" INTEGER;

-- CreateTable
CREATE TABLE "job_categories" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "job_categories_name_key" ON "job_categories"("name");

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_job_category_id_fkey" FOREIGN KEY ("job_category_id") REFERENCES "job_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
