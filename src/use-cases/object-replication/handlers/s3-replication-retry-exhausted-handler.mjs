import { ReplicationStatus } from "@prisma/client";
import { prisma } from "../../../core/libs/prisma/index.mjs";

export async function S3ReplicationRetryExhaustedHandler(data) {
  if (data) {
    try {
      const { targets, key, retryAttempts, exhaustedAt } = JSON.parse(Buffer.from(data).toString("utf-8"));
      await Promise.all(
        targets.map(async (target) => {
          const bucket = await prisma.buckets.findUnique({
            where: { name: target.bucket },
            include: {
              replications: {
                refS3Key: true
              }
            }
          });

          if (!bucket) {
            throw Error("Bucket not defined!");
          }

          if (bucket.replications.length === 0) {
            throw new Error("No replications found for Bucket");
          }

          const replication = bucket.replication.find(rep => rep.refS3Key === key);
          if (!replication) {
            throw new Error("The target replication is undefined!");
          }

          await prisma.replication.update({
            where: { id: replication.id },
            data: {
              retryAttempts: retryAttempts,
              retryExhaustedAt: exhaustedAt,
              status: ReplicationStatus.FAILED,
            }
          });
        }));

      return;
    }
    catch (err) {
      console.error(err);
      return;
    }
  }
}