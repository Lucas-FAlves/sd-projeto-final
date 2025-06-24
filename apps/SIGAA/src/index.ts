import "@/teardown";

import { bootstrap } from "@/bootstrap";
import { db } from "@/db/db";
import { users } from "@/db/schema/users";
import { exams, results } from "@/db/schema/exams";
import { consumer } from "@/broker/consumer";
import { producer } from "@/broker/producer";
import { Notification, Feedback, Results } from "@sd/contracts";
import { nanoid } from "nanoid";
import { marshal, TOPICS } from "@sd/broker";
import { eq, desc } from "drizzle-orm";

async function simulateDB() {
  for(let i = 0; i < 10; i++){
    await db.insert(users)
      .values({
        id: i,
        name: "student" + i,
        age: i + 20,
        email: "student" + i + "@example.com"
      })
  }
}

async function main() {
  await bootstrap();

  // simula o banco de dados de usuários
  await simulateDB();

  await consumer.subscribe({
    topic: TOPICS.REGISTER_SOLICITED,
    fromBeginning: true
  });

  await consumer.run({
    eachMessage: async ({ topic, message: { value } }) => {
      if (!value) return;

      if (topic === TOPICS.REGISTER_SOLICITED) {
          const student: StudentReg = unmarshal<StudentReg>().parse(value);

          const [newUser] = await db.insert(users).values({
            name: student.name,
            age: student.age,
            email: student.email
          }).returning();
          
          const response: Feedback = {
            id: newUser.id.toString(),
            message: `${newUser.name} matriculado com sucesso sob matricula ${newUser.id}.`
          };

          await producer.send({
          topic: TOPICS.REGISTER_FINISHED,
          messages: 
          [
            {
              value: marshal<Feedback>(response),
            },
          ],
        });
    }
  }
})

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});