/*
  Warnings:

  - You are about to drop the column `bucketId` on the `replications` table. All the data in the column will be lost.
  - You are about to drop the column `headBucketName` on the `replications` table. All the data in the column will be lost.
  - You are about to drop the column `key` on the `replications` table. All the data in the column will be lost.
  - You are about to drop the column `retryAttempts` on the `replications` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `replications` table. All the data in the column will be lost.
  - You are about to drop the column `uploadedAt` on the `replications` table. All the data in the column will be lost.
  - Added the required column `s3ObjectRefId` to the `replications` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "replications" DROP CONSTRAINT "replications_bucketId_fkey";

-- DropIndex
DROP INDEX "replications_key_key";

-- AlterTable
ALTER TABLE "replications" DROP COLUMN "bucketId",
DROP COLUMN "headBucketName",
DROP COLUMN "key",
DROP COLUMN "retryAttempts",
DROP COLUMN "size",
DROP COLUMN "uploadedAt",
ADD COLUMN     "bucket_id" TEXT,
ADD COLUMN     "retry_attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "retry_exhausted_at" TIMESTAMP(3),
ADD COLUMN     "s3ObjectRefId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "s3_objects_references" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "from_bucket" TEXT NOT NULL,
    "cratedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploaded_at" TIMESTAMP(3),

    CONSTRAINT "s3_objects_references_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "s3_objects_references_key_key" ON "s3_objects_references"("key");

-- AddForeignKey
ALTER TABLE "replications" ADD CONSTRAINT "replications_bucket_id_fkey" FOREIGN KEY ("bucket_id") REFERENCES "buckets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replications" ADD CONSTRAINT "replications_s3ObjectRefId_fkey" FOREIGN KEY ("s3ObjectRefId") REFERENCES "s3_objects_references"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
