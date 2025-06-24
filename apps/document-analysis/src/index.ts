import "@/teardown";

import { bootstrap } from "@/bootstrap";

import { consumer } from "@/broker/consumer";
import { producer } from "@/broker/producer";
import { marshal, TOPICS, unmarshal } from "@sd/broker";

async function main() {
  await bootstrap();

  await consumer.subscribe({
    topic: TOPICS.ANALYSIS_SOLICITED,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, message: { value } }) => {
      if (!value) return;

      if (topic === TOPICS.ANALYSIS_SOLICITED) {
        const received = unmarshal<Analysis>(value);

        const response: Analysis = {
          id: received.id,
          status: received.status,
        };

        if (received.status === 0) {
          const result = Math.random() < 0.5 ? 1 : -1;
          response.status = result;
        }

        await producer.send({
          topic: TOPICS.ANALYSIS_RESULTS,
          messages: [
            {
              value: marshal<Analysis>(response),
            },
          ],
        });

        console.log(
          `Resposta enviada para ID ${response.id} com status ${response.status}`
        );
      }
    },
  });
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
