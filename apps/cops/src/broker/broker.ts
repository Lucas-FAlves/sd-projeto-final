import { Kafka, logLevel } from "kafkajs";

if (!process.env.KAFKA_BROKER) {
  throw new Error("KAFKA_BROKER environment variable is not set");
}

export const broker = new Kafka({
  clientId: "cops",
  brokers: [process.env.KAFKA_BROKER],
  logLevel: logLevel.INFO,
});
