import "@/bootstrap";
import "@/teardown";

import { db } from "@/db/db";
import { users } from "@/db/schema/users";
import { consumer } from "@/broker/consumer";
import { tracer } from "./tracer";

async function main() {
  const _users = await db.select().from(users);
  console.log(_users);

  await consumer.subscribe({ topic: "cops-events", fromBeginning: true });

  consumer.run({
    eachMessage: async ({ message }) => {
      const span = tracer.startSpan("received message");
      console.log({
        value: message?.value?.toString(),
      });

      if (message.value) {
        span.setAttribute("message.value", message.value.toString());
      }

      span.end();
    },
  });
}

main().catch((error) => {
  console.error("Error in main:", error);
  process.exit(1);
});
