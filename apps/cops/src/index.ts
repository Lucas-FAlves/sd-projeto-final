import "@/teardown";

import { bootstrap } from "@/bootstrap";
import { db } from "@/db/db";
import { users } from "@/db/schema/users";
import { consumer } from "@/broker/consumer";
import { producer } from "@/broker/producer";
import { Notification } from "@sd/contracts";
import { nanoid } from "nanoid";
import { marshal, TOPICS, unmarshal } from "@sd/broker";

async function main() {
  await bootstrap();

  const _users = await db.select().from(users);
  console.log(_users);

  await consumer.subscribe({
    topic: TOPICS.PROCESS_FINISHED,
    fromBeginning: true,
  });

  consumer.run({
    eachMessage: async ({ message: { value: message } }) => {
      if (message) console.log(unmarshal(message));

      await Promise.all([
        producer.send({
          topic: "notification",
          messages: [
            {
              value: marshal<Notification>({
                id: nanoid(),
                to: `user-${nanoid(5)}@gmail.com`,
                message: `process ${nanoid()} finished`,
              }),
            },
          ],
        }),
        producer.send({
          topic: TOPICS.PROCESS_FINISHED_RESPONSE,
          messages: [{ value: marshal({ response: "ok" }) }],
        }),
      ]);
    },
  });
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
