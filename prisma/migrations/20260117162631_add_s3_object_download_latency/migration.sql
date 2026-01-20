/*
  Warnings:

  - You are about to drop the column `lastLatencyCheck` on the `buckets` table. All the data in the column will be lost.
  - You are about to drop the column `latency` on the `buckets` table. All the data in the column will be lost.
  - You are about to drop the column `cratedAt` on the `s3_objects_references` table. All the data in the column will be lost.
  - You are about to drop the column `from_bucket` on the `s3_objects_references` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "buckets" DROP COLUMN "lastLatencyCheck",
DROP COLUMN "latency";

-- AlterTable
ALTER TABLE "replications" ADD COLUMN     "downloadLatency" TEXT,
ADD COLUMN     "lastLatencyCheck" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "s3_objects_references" DROP COLUMN "cratedAt",
DROP COLUMN "from_bucket",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "main_bucket_download_latency_ms" TEXT,
ADD COLUMN     "main_bucket_id" TEXT;

-- CreateTable
CREATE TABLE "MainBucket" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "MainBucket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MainBucket_name_key" ON "MainBucket"("name");

-- AddForeignKey
ALTER TABLE "s3_objects_references" ADD CONSTRAINT "s3_objects_references_main_bucket_id_fkey" FOREIGN KEY ("main_bucket_id") REFERENCES "MainBucket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
