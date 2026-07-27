-- AlterTable
ALTER TABLE "companies" ADD COLUMN     "deleted_at" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "email" VARCHAR(255),
ADD COLUMN     "phone" VARCHAR(50),
ADD COLUMN     "tax_code" VARCHAR(50),
ADD COLUMN     "website" VARCHAR(255),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "logo_url" SET DATA TYPE VARCHAR(255),
ALTER COLUMN "status" SET NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ALTER COLUMN "status" SET DATA TYPE VARCHAR(50);

-- CreateIndex
CREATE UNIQUE INDEX "companies_tax_code_key" ON "companies"("tax_code");
