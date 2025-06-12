import "@/teardown";

import { bootstrap } from "@/bootstrap";
import { db } from "@/db/db";
import { users } from "@/db/schema/users";
import { exams, results } from "@/db/schema/exams";
import { consumer } from "@/broker/consumer";
import { producer } from "@/broker/producer";
import { Notification, Results } from "@sd/contracts";
import { nanoid } from "nanoid";
import { marshal, TOPICS } from "@sd/broker";
import { eq } from "drizzle-orm";

async function main() {
  await bootstrap();

  // assina os dois tópicos de uma vez só
  await consumer.subscribe({ topic: TOPICS.RESULTS_QUERY, fromBeginning: true });
  await consumer.subscribe({ topic: TOPICS.PROCESS_FINISHED, fromBeginning: true });

  // executa o consumidor
  await consumer.run({
    eachMessage: async ({ topic, message: { value } }) => {
      if (!value) return;

      if (topic === TOPICS.RESULTS_QUERY) {
        const parsed: Results = JSON.parse(value.toString());

        // verifica se o exame já existe
        const [existingExam] = await db
          .select()
          .from(exams)
          .where(eq(exams.name, parsed.exam.name));

        let examId: number;

        if (existingExam) {
          examId = existingExam.id;
        } else {
          const inserted = await db
            .insert(exams)
            .values({
              name: parsed.exam.name,
              date: parsed.exam.date,
            })
            .returning({ id: exams.id });

          examId = inserted[0].id;

          for (const grade of parsed.grades) {
            await db.insert(results).values({
              id: examId,
              grade: grade.grade,
            });
          }
        }

        // to-do: organizar lista preliminar de aprovados
        // to-do: verificar recursos de nota

        // notifica os usuários a respeito do resultado preliminar
        const _users = await db.select().from(users);

        const notificationMessages = _users.map((user) => ({
          value: marshal<Notification>({
            id: nanoid(),
            to: user.email,
            message: `Process ${nanoid()} finished`,
          }),
        }));

        // to-do: solicitar validação de documentos
        // to-do: organizar lista final de aprovados

        await Promise.all([
          producer.send({
            topic: "notification",
            messages: notificationMessages,
          }),
          producer.send({
            topic: TOPICS.PROCESS_FINISHED_RESPONSE,
            messages: [{ value: marshal({ response: "ok" }) }],
          }),
        ]);
      }

      if (topic === TOPICS.PROCESS_FINISHED) {
        // notificação do resultado final aos candidatos
        const _users = await db.select().from(users);

        const finalNotificationMessages = _users.map((user) => ({
          value: marshal<Notification>({
            id: nanoid(),
            to: user.email,
            message: `Process ${nanoid()} finished`,
          }),
        }));

        await Promise.all([
          producer.send({
            topic: "notification",
            messages: finalNotificationMessages,
          }),
          producer.send({
            topic: TOPICS.PROCESS_FINISHED_RESPONSE,
            messages: [{ value: marshal({ response: "ok" }) }],
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