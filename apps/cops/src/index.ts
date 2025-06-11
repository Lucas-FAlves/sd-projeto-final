import "@/bootstrap";
import "@/teardown";

import { db } from "@/db/db";
import { users } from "@/db/schema/users";
import { consumer } from "@/broker/consumer";
import { producer } from "./broker/producer";
import { Notification } from "@sd/contracts";
import { nanoid } from "nanoid";

async function main() {
  const _users = await db.select().from(users);
  console.log(_users);

  await consumer.subscribe({ topic: "process-finished", fromBeginning: true });

  consumer.run({
    eachMessage: async ({ message }) => {
      console.log({ value: message.value?.toString() });

      await producer.connect();

      const processFinishedNotification: Notification = {
        id: nanoid(),
        to: `user-${nanoid(5)}@gmail.com`,
        message: `process ${nanoid()} finished`,
      };

      await Promise.all([
        producer.send({
          topic: "notification",
          messages: [
            {
              value: JSON.stringify(processFinishedNotification),
            },
          ],
        }),
        producer.send({
          topic: "process-finished-response",
          messages: [{ value: "ok" }],
        }),
      ]);

      await producer.disconnect();
    },
  });
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
