import "@/bootstrap";
import "@/teardown";
import { producer } from "./broker/producer";
import { consumer } from "./broker/consumer";

async function main() {
  await consumer.subscribe({
    topic: "process-finished-response",
    fromBeginning: true,
  });

  consumer.run({
    eachMessage: async ({ message }) => {
      console.log({ value: message.value?.toString() });
    },
  });

  await producer.connect();

  await producer.send({
    topic: "process-finished",
    messages: [{ value: Math.random().toString() }],
  });

  await producer.disconnect();
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
