import "./use-cases/object-replication/consumers/index.mjs";

import { createServer } from "node:http";
import { broker, setupDLQ, setupRetryQueues } from "./core/libs/rabbitmq/index.mjs";
import { replicationConfig } from "../replication.config.json";

const app = createServer((request, response) => {
  if (request.method === "POST" && request.url === "/replicate") {
    request.on("data", async (rawData) => {
      const parsedData = Buffer.from(rawData).toString();
      const event = JSON.parse(parsedData);

      if (event && event["detail-type"] === "Object Created") {
        if (event.detail.bucket.name === process.env.AWS_HEAD_BUCKET_NAME) {
          if (replicationConfig.enabled && replicationConfig.targets.length > 0) {
            await setupDLQ(broker);
            await setupRetryQueues({ delays: [5, 10, 15] });
            await broker.assertQueue("dispatch-to-replication",
              {
                durable: true,
                arguments: {
                  "x-dead-letter-exchange": "dlx",
                  "x-dead-letter-routing-key": "dead_letter"
                }
              });

            await broker.publish("", "dispatch-to-replication",
              Buffer.from({
                bucket: event.detail.bucket.name,
                key: event.detail.object.key,
                replicationConfig
              }));
          }
        }
      }

    });
  }
});

app.listen(3000, () => console.log("Server is running on port: ", 3000));