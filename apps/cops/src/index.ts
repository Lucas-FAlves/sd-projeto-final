import "@/bootstrap.js";
import "@/teardown.js";

import { db } from "@/db/db.js";
import { users } from "@/db/schema/users.js";
import { consumer } from "./broker/consumer.js";

const _users = await db.select().from(users);
console.log(_users);

await consumer.subscribe({ topic: "cops", fromBeginning: true });

consumer.run({
  eachMessage: async ({ message }) => {
    console.log({
      value: message?.value?.toString(),
    });
  },
});
