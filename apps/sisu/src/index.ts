import "@/teardown";

import { bootstrap } from "@/bootstrap";
import { producer } from "@/broker/producer";
import { consumer } from "@/broker/consumer";
import { marshal, TOPICS, unmarshal } from "@sd/broker";
import { ExamResults } from "@sd/contracts";
import { nanoid } from "nanoid";
import { faker } from "@faker-js/faker";

async function sendExamResults() {
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
  console.log("Sent exam results at", new Date().toISOString());
}

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

  await sendExamResults();

  const intervalId = setInterval(async () => {
    try {
      await sendExamResults();
    } catch (error) {
      console.error("Error sending exam results:", error);
    }
  }, 30000);

  process.on("SIGINT", () => {
    console.log("Shutting down...");
    clearInterval(intervalId);
    process.exit(0);
  });

  console.log("SISU service started - sending exam results every 30 seconds");
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
