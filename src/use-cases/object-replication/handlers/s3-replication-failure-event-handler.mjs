import { prisma } from "../../../core/libs/prisma/index.mjs";

export async function S3ReplicationFailureEventHandler(data) {
  if (data) {
    try {
      const { retryAttempts, replicationsMap } = JSON.parse(data);
      const replications = Array.from(replicationsMap.keys());
      await Promise.all(
        replications.map(async (key) => {
          if (replicationsMap.has(key)) {
            const replication = await prisma.replication.findUnique({ where: { id: key } });
            if (!replication) throw new Error(`${bucket} Replication was not found for ${key} S3 Object!`);

            await prisma.replication.update({ where: { id: key }, data: { retryAttempts } });
          }
        })
      );

      return;
    } catch (err) {
      console.error(err);
      return;
    }
  }
}