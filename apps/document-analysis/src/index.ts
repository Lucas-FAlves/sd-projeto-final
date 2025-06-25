import "@/teardown";

import { bootstrap } from "@/bootstrap";

import { consumer } from "@/broker/consumer";
import { producer } from "@/broker/producer";
import { marshal, TOPICS, unmarshal } from "@sd/broker";
import { DocumentReviewed, ProcessFinished } from "@sd/contracts";
import { nanoid } from "nanoid";

async function main() {
  await bootstrap();

  await consumer.subscribe({
    topic: TOPICS.PROCESS_FINISHED,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, message: { value } }) => {
      if (!value) return;

      if (topic === TOPICS.PROCESS_FINISHED) {
        const parsed = unmarshal<ProcessFinished>(value);

        await producer.send({
          topic: TOPICS.DOCUMENT_REVIEWED,
          messages: parsed.approvedCandidates.map((candidate) => {
            return {
              value: marshal<DocumentReviewed>({
                id: nanoid(),
                examId: parsed.examId,
                candidate,
                status: ["approved", "rejected"][
                  Math.floor(Math.random() * 2)
                ] as "approved" | "rejected",
              }),
            };
          }),
        });
      }
    },
  });
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
