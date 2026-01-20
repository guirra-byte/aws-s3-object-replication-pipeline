import dotenv from "dotenv";
import { connect } from "amqplib";

dotenv.config();
function createConnection() {
  let channel;
  return async () => {
    console.log("Rabbitmq connection stablished");

    if (channel) return channel;
    const rabbitMq = await connect({
      username: process.env.RABBITMQ_DEFAULT_USER,
      password: process.env.RABBITMQ_DEFAULT_PASS
    });

    channel = await rabbitMq.createChannel();
    channel.reject();
    return channel;
  }
}

async function setupDLQ(broker) {
  await Promise.all([
    broker.assertExchange("dlx", "direct", { durable: true }),
    broker.assertQueue("dead_letter_queue", { durable: true })
  ]);

  await broker.bindQueue("dead_letter_queue", "dlx", "dead_letter");
}

async function setupRetryQueues(retry_config) {
  const { delays } = retry_config;
  const retryQueueBaseName = "retry_queue";

  for (let index = 0; index < delays.length; index++) {
    const ttl = delays[index] * 1000;
    const nxtQueue = index === delays.length - 1 ? "error_queue" : index++;

    await broker.assertQueue(
      `${retryQueueBaseName}_${index}`,
      {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': nxtQueue, // Route to next queue in chain
          'x-message-ttl': ttl
        }
      }
    );
  }

  await broker.assertQueue("error_queue", { durable: true });
}

const connection = createConnection();
const broker = await connection();

export { broker, setupDLQ, setupRetryQueues };