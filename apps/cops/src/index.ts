import "@/teardown";

import { bootstrap } from "@/bootstrap";
import { db } from "@/db/db";
import { consumer } from "@/broker/consumer";
import { producer } from "@/broker/producer";
import { Notification, Feedback, ExamResults } from "@sd/contracts";
import { nanoid } from "nanoid";
import { marshal, TOPICS, unmarshal } from "@sd/broker";
import { eq, desc, and } from "drizzle-orm";
import { candidates, examResults, exams } from "./db/schema/exams-results";

const APPROVAL_LIMIT = 20;

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
        const parsed = unmarshal<ExamResults>(value);

        const existingExam = await db
          .select()
          .from(exams)
          .where(eq(exams.id, parsed.exam.id))
          .limit(1);

        let examId: string;

        if (existingExam.length > 0) {
          examId = existingExam[0].id;
        } else {
          const inserted = await db
            .insert(exams)
            .values({
              id: parsed.exam.id,
              name: parsed.exam.name,
              date: parsed.exam.date,
            })
            .returning({ id: exams.id });

          examId = inserted[0].id;
        }

        for (const result of parsed.results) {
          await db.transaction(async (tx) => {
            await tx
              .insert(candidates)
              .values({
                id: result.candidate.id,
                name: result.candidate.name,
                email: result.candidate.email,
              })
              .onConflictDoNothing();

            await tx.insert(examResults).values({
              candidateId: result.candidate.id,
              examId: examId,
              grade: result.grade,
            });
          });
        }

        await producer.send({
          topic: TOPICS.PROCESS_FINISHED_RESPONSE,
          messages: [
            {
              value: marshal<Feedback>({
                id: nanoid(),
                message:
                  "COPS: Resultados recebidos e processados com sucesso.",
              }),
            },
          ],
        });

        await db.transaction(async (tx) => {
          const approvedCandidates = await tx
            .select()
            .from(examResults)
            .where(eq(examResults.examId, examId))
            .orderBy(desc(examResults.grade))
            .limit(APPROVAL_LIMIT);

          const updates = approvedCandidates.map((candidate, index) => {
            return tx
              .update(examResults)
              .set({
                isApproved: true,
                approvalRank: index + 1,
              })
              .where(
                and(
                  eq(examResults.examId, examId),
                  eq(examResults.candidateId, candidate.candidateId)
                )
              );
          });

          await Promise.all(updates);
        });

        const ranked = await db
          .select({
            id: candidates.id,
            name: candidates.name,
            email: candidates.email,
            grade: examResults.grade,
            approvalRank: examResults.approvalRank,
          })
          .from(examResults)
          .innerJoin(candidates, eq(examResults.candidateId, candidates.id))
          .where(
            and(
              eq(examResults.examId, examId),
              eq(examResults.isApproved, true)
            )
          )
          .orderBy(desc(examResults.approvalRank));

        const notificationMessages = ranked.map((user) => ({
          value: marshal<Notification>({
            id: nanoid(),
            to: user.email,
            message: `Você foi aprovado no exame ${parsed.exam.name} (${
              parsed.exam.id
            }) com nota ${user.grade.toFixed(2)} e está em ${
              user.approvalRank
            }º lugar.`,
          }),
        }));

        const reprovedCandidates = await db
          .select({
            id: candidates.id,
            name: candidates.name,
            email: candidates.email,
            grade: examResults.grade,
          })
          .from(examResults)
          .innerJoin(candidates, eq(examResults.candidateId, candidates.id))
          .where(
            and(
              eq(examResults.examId, examId),
              eq(examResults.isApproved, false)
            )
          )
          .orderBy(desc(examResults.grade));

        const reprovedMessages = reprovedCandidates.map((user) => ({
          value: marshal<Notification>({
            id: nanoid(),
            to: user.email,
            message: `Você foi reprovado no exame ${parsed.exam.name} (${
              parsed.exam.id
            }) com nota ${user.grade.toFixed(2)}.`,
          }),
        }));

        await Promise.all([
          producer.send({
            topic: TOPICS.NOTIFICATION,
            messages: notificationMessages,
          }),
          producer.send({
            topic: TOPICS.NOTIFICATION,
            messages: reprovedMessages,
          }),
          producer.send({
            topic: TOPICS.PROCESS_FINISHED_RESPONSE,
            messages: [
              {
                value: marshal<Feedback>({
                  id: nanoid(),
                  message: "COPS: Processo seletivo deferido.",
                }),
              },
            ],
          }),
        ]);
      }
    },
  });
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
