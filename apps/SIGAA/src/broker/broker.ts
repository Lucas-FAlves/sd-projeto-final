import { Kafka, logLevel } from "kafkajs";

if (!process.env.KAFKA_BROKER) {
  throw new Error("KAFKA_BROKER environment variable is not set");
}

if (!process.env.SERVICE_NAME) {
  throw new Error("SERVICE_NAME environment variable is not set");
}

export const broker = new Kafka({
  clientId: process.env.SERVICE_NAME,
  brokers: [process.env.KAFKA_BROKER],
  logLevel: logLevel.ERROR,
});
