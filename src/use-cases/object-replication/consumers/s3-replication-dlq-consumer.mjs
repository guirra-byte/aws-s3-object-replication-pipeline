import { broker } from "../../../core/libs/rabbitmq/index.mjs";

import { S3ReplicationRetryExhaustedHandler as RetryExhaustedHandler } from "../handlers/s3-replication-retry-exhausted-handler.mjs";
import { S3ReplicationFailureEventHandler as FailureEventHandler } from "../handlers/s3-replication-failure-event-handler.mjs";

export function s3ReplicationDlqConsumer(max_retries, retryExhaustedHandler, failureEventHandler) {
  broker.on("failure-event", async (args) => { await failureEventHandler(args) });
  broker.on("retry-exhausted", async (args) => { await retryExhaustedHandler(args) });

  broker.consume("dead-letter-queue", async (msg) => {
    if (!msg) return;

    const dlqHeaders = msg.headers["x-death"] || [];
    const deathFromQueue = dlqHeaders[0].queue;

    if (deathFromQueue) {
      const retryCount = Number(deathFromQueue.count);

      const queueNameParts = deathFromQueue.split("_"); // ["retry", "queue", "1"]
      const queueIndex = Number(queueNameParts[2]); // 1
      const retryQueuesBaseName = queueNameParts[0].concat(`_${queueNameParts[1]}`); // "retry_queue"

      if (retryCount >= max_retries || deathFromQueue === `${retryQueuesBaseName}_${max_retries - 1}`) {
        broker.nack(msg, false, false);

        const { replicationConfig, key } = JSON.parse(msg);
        broker.emit("retry-exhausted", Buffer.from({
          payload: {
            key,
            replicationConfig,
            retryAttempts: retryCount,
            exhaustedAt: new Date()
          }
        }));
      }

      else if (retryCount < max_retries) {
        if (Number(queueNameParts) < max_retries) {
          const { replicationsMap, replicationConfig, key } = JSON.parse(msg);
          await broker.publish(`failure-event`, Buffer.from({
            key,
            replicationsMap,
            replicationConfig,
            retryAttempts: retryCount
          }));

          await broker.publish(`${retryQueuesBaseName}_${queueIndex + 1}`, Buffer.from(msg));
          await broker.ack(msg);
        }
      }
    }
  });
}

s3ReplicationDlqConsumer(3, RetryExhaustedHandler, FailureEventHandler);