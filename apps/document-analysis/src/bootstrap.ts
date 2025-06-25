import { broker } from "@/broker/broker";
import { consumer } from "@/broker/consumer";
import { ensureTopicsExist, TOPICS } from "@sd/broker";
import { producer } from "@/broker/producer";

export async function bootstrap() {
  await ensureTopicsExist(broker, [TOPICS.PROCESS_FINISHED]);
  await consumer.connect();
  await producer.connect();
}
