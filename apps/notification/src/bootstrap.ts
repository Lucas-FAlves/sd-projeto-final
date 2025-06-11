import { broker } from "@/broker/broker";
import { consumer } from "@/broker/consumer";
import { TOPICS } from "@sd/broker";
import { ensureTopicsExist } from "@sd/broker/ensure-topics-exist";

export async function bootstrap() {
  await ensureTopicsExist(broker, [TOPICS.NOTIFICATION]);
  await consumer.connect();
}
