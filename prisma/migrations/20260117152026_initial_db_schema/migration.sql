-- CreateEnum
CREATE TYPE "ReplicationStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "replications" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "headBucketName" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL,
    "retryAttempts" INTEGER NOT NULL DEFAULT 0,
    "status" "ReplicationStatus" NOT NULL DEFAULT 'PENDING',
    "bucketId" TEXT,

    CONSTRAINT "replications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "buckets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "latency" TEXT,
    "lastLatencyCheck" TIMESTAMP(3),

    CONSTRAINT "buckets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "replications_key_key" ON "replications"("key");

-- CreateIndex
CREATE UNIQUE INDEX "buckets_name_key" ON "buckets"("name");

-- AddForeignKey
ALTER TABLE "replications" ADD CONSTRAINT "replications_bucketId_fkey" FOREIGN KEY ("bucketId") REFERENCES "buckets"("id") ON DELETE SET NULL ON UPDATE CASCADE;
