import { consumer } from "@/broker/consumer";

let isShuttingDown = false;

async function teardown() {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log("Gracefully shutting down...");

  await consumer.stop();
  await consumer.disconnect();
}

process.on("SIGINT", teardown);
process.on("SIGTERM", teardown);
