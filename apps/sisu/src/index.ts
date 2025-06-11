import "@/teardown";

import { bootstrap } from "@/bootstrap";
import { producer } from "@/broker/producer";
import { consumer } from "@/broker/consumer";
import { marshal, TOPICS, unmarshal } from "@sd/broker";

async function main() {
  await bootstrap();

  await consumer.subscribe({
    topic: TOPICS.PROCESS_FINISHED_RESPONSE,
    fromBeginning: true,
  });

  consumer.run({
    eachMessage: async ({ message: { value: message } }) => {
      if (message) console.log(unmarshal(message));
    },
  });

  await producer.send({
    topic: TOPICS.PROCESS_FINISHED,
    messages: [{ value: marshal({ result: Math.random() }) }],
  });
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
