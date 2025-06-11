import { broker } from "@/broker/broker";
import { consumer } from "@/broker/consumer";
import { producer } from "@/broker/producer";
import { ensureTopicsExist, TOPICS } from "@sd/broker";

export async function bootstrap() {
  await ensureTopicsExist(broker, [
    TOPICS.PROCESS_FINISHED,
    TOPICS.PROCESS_FINISHED_RESPONSE,
    TOPICS.NOTIFICATION,
  ]);
  await consumer.connect();
  await producer.connect();
}
