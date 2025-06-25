import "@/teardown";

import { bootstrap } from "@/bootstrap";
import { producer } from "@/broker/producer";
import { consumer } from "@/broker/consumer";
import { marshal, TOPICS, unmarshal } from "@sd/broker";
import { AwaitingAppeals, ExamResults, Appeal } from "@sd/contracts";
import { nanoid } from "nanoid";
import { faker } from "@faker-js/faker";

// Store candidates that want to request appeal
let candidatesToRequestAppeal: Array<{
  candidate: { id: string; name: string; email: string };
  grade: number;
}> = [];

async function sendSisuResults() {
  await producer.send({
    topic: TOPICS.EXAM_FINISHED,
    messages: [
      {
        value: marshal<ExamResults>({
          id: nanoid(),
          exam: {
            date: faker.date.recent().toISOString(),
            id: nanoid(),
            name: "SISU",
          },
          results: Array.from({ length: 20 }, () => ({
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

async function sendInternalExamResults() {
  const candidatesResults = Array.from({ length: 10 }, () => ({
    candidate: {
      id: nanoid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
    },
    grade: faker.number.float({ min: 0, max: 10, fractionDigits: 2 }),
  }));

  // Update the global candidates list for appeal requests
  candidatesToRequestAppeal = [...candidatesResults].filter(
    (result) => Math.random() < 0.7
  );

  await producer.send({
    topic: TOPICS.EXAM_FINISHED,
    messages: [
      {
        value: marshal<ExamResults>({
          id: nanoid(),
          exam: {
            date: faker.date.recent().toISOString(),
            id: nanoid(),
            name: "Processo Seletivo Interno",
          },
          results: candidatesResults,
        }),
      },
    ],
  });

  console.log("Sent internal exam results at", new Date().toISOString());
}

async function handleAppeals() {
  await consumer.subscribe({
    topic: TOPICS.AWAITING_APPEALS,
    fromBeginning: true,
  });

  consumer.run({
    eachMessage: async ({ message: { value: message } }) => {
      if (message) {
        const parsed = unmarshal<AwaitingAppeals>(message);

        const nonApprovedCandidates = candidatesToRequestAppeal.filter(
          (result) =>
            !parsed.approvedCandidates.some(
              (candidate) => candidate.id === result.candidate.id
            )
        );

        if (nonApprovedCandidates.length > 0) {
          await producer.send({
            topic: TOPICS.APPEAL_REQUESTED,
            messages: nonApprovedCandidates.map((c) => {
              return {
                value: marshal<Appeal>({
                  id: nanoid(),
                  candidate: c.candidate,
                  grade: c.grade,
                }),
              };
            }),
          });

          candidatesToRequestAppeal = [];

          console.log(
            `Sent ${nonApprovedCandidates.length} appeal requests at`,
            new Date().toISOString()
          );
        }
      }
    },
  });
}

async function main() {
  await bootstrap();

  await sendSisuResults();
  await sendInternalExamResults();
  await handleAppeals();

  const sisuInterval = setInterval(async () => {
    try {
      await sendSisuResults();
    } catch (error) {
      console.error("Error sending exam results:", error);
    }
  }, 0.5 * 60 * 1000);

  const internalInterval = setInterval(async () => {
    try {
      await sendInternalExamResults();
    } catch (error) {
      console.error("Error sending internal exam results:", error);
    }
  }, 0.5 * 60 * 1000);

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
