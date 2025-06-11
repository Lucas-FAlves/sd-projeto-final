import "@/teardown";
import { bootstrap } from "@/bootstrap";
import { consumer } from "./broker/consumer";
import { Notification } from "@sd/contracts";
import { TOPICS, unmarshal } from "@sd/broker";

async function main() {
  await bootstrap();

  await consumer.subscribe({
    topic: TOPICS.NOTIFICATION,
    fromBeginning: true,
  });

  consumer.run({
    eachMessage: async ({ message: { value: message } }) => {
      if (message) console.log(unmarshal<Notification>(message));
    },
  });
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
