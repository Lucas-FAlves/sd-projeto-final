import "@/teardown";

import { bootstrap } from "@/bootstrap";
import { producer } from "@/broker/producer";
import { consumer } from "@/broker/consumer";
import { marshal, TOPICS, unmarshal } from "@sd/broker";
import { ExamResults } from "@sd/contracts";
import { nanoid } from "nanoid";
import { faker } from "@faker-js/faker";

async function sendSisuResults() {
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

async function internalExamClojure() {
  const candidatesResults = Array.from({ length: 100 }, () => ({
    candidate: {
      id: nanoid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
    },
    grade: faker.number.float({ min: 0, max: 10, fractionDigits: 2 }),
  }));

  const candidatesToRequestAppeal = [...candidatesResults].filter(
    (result) => result.grade < 5 && Math.random() < 0.1
  );

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
          results: candidatesResults,
        }),
      },
    ],
  });

  console.log("Sent exam results at", new Date().toISOString());

  await consumer.run({
    eachMessage: async ({ topic, message: { value } }) => {},
  });
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

  await sendSisuResults();
  await internalExamClojure();

  const sisuInterval = setInterval(async () => {
    try {
      await sendSisuResults();
    } catch (error) {
      console.error("Error sending exam results:", error);
    }
  }, 5 * 60 * 1000);

  const internalInterval = setInterval(async () => {
    try {
      await internalExamClojure();
    } catch (error) {
      console.error("Error sending internal exam results:", error);
    }
  }, 5 * 60 * 1000);

  process.on("SIGINT", () => {
    console.log("Shutting down...");
    clearInterval(sisuInterval);
    clearInterval(internalInterval);
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
