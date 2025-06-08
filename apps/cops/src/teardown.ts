import { consumer } from "./broker/consumer.js";

async function teardown() {
  await consumer.stop();
  await consumer.disconnect();
}

process.on("SIGINT", teardown);
process.on("SIGTERM", teardown);
