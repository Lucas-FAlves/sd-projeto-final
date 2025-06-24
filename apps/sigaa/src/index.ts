import "@/teardown";

import { bootstrap } from "@/bootstrap";
import { db } from "@/db/db";
import { students } from "@/db/schema/student";
import { consumer } from "@/broker/consumer";
import { producer } from "@/broker/producer";
import { Feedback, StudentReg } from "@sd/contracts";
import { marshal, TOPICS, unmarshal } from "@sd/broker";

async function main() {
  await bootstrap();

  await consumer.subscribe({
    topic: TOPICS.REGISTER_SOLICITED,
    fromBeginning: true,
  });

  await consumer.run({
    eachMessage: async ({ topic, message: { value } }) => {
      if (!value) return;

      if (topic === TOPICS.REGISTER_SOLICITED) {
        const student: StudentReg = unmarshal<StudentReg>(value);

        const [newStudent] = await db
          .insert(students)
          .values({
            name: student.name,
            age: student.age,
            email: student.email,
          })
          .returning();

        const response: Feedback = {
          id: newStudent.id.toString(),
          message: `${newStudent.name} matriculado com sucesso sob matricula ${newStudent.id}.`,
        };

        await producer.send({
          topic: TOPICS.REGISTER_FINISHED,
          messages: [
            {
              value: marshal<Feedback>(response),
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
