import "@/teardown";

import { bootstrap } from "@/bootstrap";
import { db } from "@/db/db";
import { students } from "@/db/schema/student";
import { consumer } from "@/broker/consumer";
import { producer } from "@/broker/producer";
import {
  Candidate,
  DocumentReviewed,
  Feedback,
  ProcessFinished,
  StudentReg,
} from "@sd/contracts";
import { marshal, TOPICS, unmarshal } from "@sd/broker";

async function main() {
  await bootstrap();

  await consumer.subscribe({
    topics: [TOPICS.DOCUMENT_REVIEWED],
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, message: { value } }) => {
      if (!value) return;

      if (topic === TOPICS.DOCUMENT_REVIEWED) {
        const parsed = unmarshal<DocumentReviewed>(value);

        if (parsed.status === "rejected") {
          return;
        }

        await db.insert(students).values({
          id: parsed.candidate.id,
          name: parsed.candidate.name,
          email: parsed.candidate.email,
          age: parsed.candidate.age,
        });

        await producer.send({
          topic: TOPICS.NOTIFICATION,
          messages: [
            {
              value: marshal<Notification>({
                id: parsed.candidate.id,
                to: parsed.candidate.email,
                message: `Olá ${parsed.candidate.name}, sua matricula foi realizada com sucesso!`,
              }),
            },
          ],
        });
      }
    },
  });
}
main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
