import { broker } from "../../../core/libs/rabbitmq/index.mjs";
import { S3ReplicationService } from "../services/s3-replication-service.mjs";

export async function s3ReplicationConsumer() {
  console.log("s3-replication-consumer is asking for queue messages...");

  broker.assertQueue("dispatch-to-replication");
  broker.consume("dispatch-to-replication", async (msg) => {
    await S3ReplicationService(msg);
  });
};

s3ReplicationConsumer();