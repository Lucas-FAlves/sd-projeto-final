import "@/broker/broker";
import { consumer } from "@/broker/consumer";
import { createTopics } from "@/broker/topics";
import { producer } from "./broker/producer";

async function bootstrap() {
  await createTopics();
  await consumer.connect();
}

bootstrap().catch((error) => {
  console.error("Error during bootstrap:", error);
  process.exit(1);
});
