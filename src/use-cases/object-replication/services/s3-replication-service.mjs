import { PassThrough } from "node:stream";
import { Upload } from "@aws-sdk/lib-storage";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { createS3Client } from "../../../core/libs/aws/s3.mjs";
import { broker } from "../../../core/libs/rabbitmq/index.mjs";
import { prisma } from "../../../core/libs/prisma/index.mjs";

async function S3ReplicationService(msg) {
  const { bucket, key, replicationConfig } = JSON.parse(msg);
  const s3Client = createS3Client();
  const s3 = s3Client();

  try {
    let mainBucket = await prisma.mainBucket.findUnique({ where: { name: bucket } });
    if (!mainBucket) {
      await prisma.mainBucket.create({
        data: {
          name: bucket,
          region: process.env.AWS_DEFAULT_REGION
        }
      });
    }

    const objectRefAlreadyExists = mainBucket.objects.find(obj => obj.key === key);
    if (!objectRefAlreadyExists) {
      await prisma.s3ObjectRef.create({
        data: {
          key,
          mainBucketId: mainBucket.id,
        }
      })
    }

    const getObjectCommand = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const passThrough = new PassThrough();
    const downloadObjectStreams = await s3.send(getObjectCommand);

    let downloadLatencyMs;
    downloadObjectStreams.Body.on("data", () => downloadLatencyMs = process.hrtime.bigint());
    downloadObjectStreams.Body.on("end", async () => {
      downloadLatencyMs = Number(process.hrtime.bigint() - downloadLatencyMs) / 1_000_000;
      await prisma.s3ObjectRef.update({
        where: { key },
        data: {
          mainBucketDownloadLatencyMs: downloadLatencyMs
        }
      })
    });

    const uploadInheritStreams = replicationConfig.targets.map(async (target) => {
      return new Promise(async (resolve, reject) => {
        try {
          let currentBucket = await prisma.buckets.findUnique({ where: { name: target.bucket } });
          if (!currentBucket) {
            currentBucket = await prisma.buckets.create({
              data: {
                name: target.bucket,
                region: target.region
              }
            })
          }

          let replication = await prisma.replication.findUnique({
            where: {
              bucketId: currentBucket.id,
              refS3Key: { key }
            },
          });

          if (!replication) {
            replication = await prisma.replication.create({
              data: {
                bucketId: currentBucket.id,
                seObjectRefId
              }
            });
          }

          const parallelUploadS3 = new Upload({
            Bucket: target.bucket,
            Key: key,
            Body: passThrough
          });

          await parallelUploadS3.done();
          resolve({ target: { bucket: target.bucket, region: target.region }, replicationId: replication.id });
        } catch (err) {
          console.error("Error in replication service...", err);
          reject({ target: { bucket: target.bucket, region: target.region }, replicationId: replication.id });
        }
      });
    });


    downloadObjectStreams.Body.pipe(passThrough);
    await Promise.allSettled(uploadInheritStreams)
      .then(async (results) => {
        const replicationsMap = new Map();
        const rejectedResults = results
          .filter(result => result.status === "rejected")
          .map(result => {
            const data = JSON.parse(result.reason);
            if (!replicationsMap.has(data.replicationId)) {
              replicationsMap.set(`${data.replicationId}`, data.target);
            }

            return data.target;
          });

        const dlqPayload = Buffer.from({
          replicationsMap,
          replicationConfig: {
            ...replicationConfig,
            targets: [...rejectedResults]
          }
        });

        await broker.publish("dlx", "dead_letter", dlqPayload, { durable: true });
      });
  }
  catch (error) {
    throw error;
  }
}

export { S3ReplicationService }