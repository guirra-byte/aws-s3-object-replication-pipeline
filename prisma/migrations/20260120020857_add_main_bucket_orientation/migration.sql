/*
  Warnings:

  - You are about to drop the `MainBucket` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `updateAt` to the `replications` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "s3_objects_references" DROP CONSTRAINT "s3_objects_references_main_bucket_id_fkey";

-- AlterTable
ALTER TABLE "replications" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "updateAt" TIMESTAMP(3) NOT NULL;

-- DropTable
DROP TABLE "MainBucket";

-- CreateTable
CREATE TABLE "main_bucket" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,

    CONSTRAINT "main_bucket_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "main_bucket_name_key" ON "main_bucket"("name");

-- AddForeignKey
ALTER TABLE "s3_objects_references" ADD CONSTRAINT "s3_objects_references_main_bucket_id_fkey" FOREIGN KEY ("main_bucket_id") REFERENCES "main_bucket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
