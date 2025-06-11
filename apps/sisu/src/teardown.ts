import { consumer } from "@/broker/consumer";
import { producer } from "@/broker/producer";

let isShuttingDown = false;

async function teardown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("Gracefully shutting down...");

  await consumer.stop();
  await consumer.disconnect();
  await producer.disconnect();
}

process.on("SIGINT", teardown);
process.on("SIGTERM", teardown);
