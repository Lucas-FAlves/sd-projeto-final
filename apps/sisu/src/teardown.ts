import { consumer } from "@/broker/consumer";
import { producer } from "./broker/producer";

async function teardown() {
  await consumer.stop();
  await consumer.disconnect();
  await producer.disconnect();
}

process.on("SIGINT", teardown);
process.on("SIGTERM", teardown);
