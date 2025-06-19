import "@/teardown";

import { bootstrap } from "@/bootstrap";
import { producer } from "@/broker/producer";
import { consumer } from "@/broker/consumer";
import { marshal, TOPICS, unmarshal } from "@sd/broker";
import { ExamResults } from "@sd/contracts";
import { nanoid } from "nanoid";
import { faker } from "@faker-js/faker";

async function main() {
  await bootstrap();

  await producer.send({
    topic: TOPICS.PROCESS_FINISHED,
    messages: [
      {
        value: marshal<ExamResults>({
          id: nanoid(),
          exam: {
            date: faker.date.recent().toISOString(),
            id: nanoid(),
            name: "SISU",
          },
          results: Array.from({ length: 100 }, () => ({
            candidate: {
              id: nanoid(),
              name: faker.person.fullName(),
              email: faker.internet.email(),
            },
            grade: faker.number.float({ min: 0, max: 10, fractionDigits: 2 }),
          })),
        }),
      },
    ],
  });

  await consumer.subscribe({
    topic: TOPICS.PROCESS_FINISHED_RESPONSE,
    fromBeginning: true,
  });

  consumer.run({
    eachMessage: async ({ message: { value: message } }) => {
      if (message) console.log(unmarshal(message));
    },
  });
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
