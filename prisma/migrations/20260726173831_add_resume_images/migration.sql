-- AlterTable
ALTER TABLE "resumes" ADD COLUMN     "public_id" TEXT;

-- CreateTable
CREATE TABLE "resume_images" (
    "id" UUID NOT NULL,
    "resume_id" UUID NOT NULL,
    "image_url" TEXT NOT NULL,
    "public_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "resume_images" ADD CONSTRAINT "resume_images_resume_id_fkey" FOREIGN KEY ("resume_id") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
