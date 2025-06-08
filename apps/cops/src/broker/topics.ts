import { broker } from "./broker.js";

const admin = broker.admin();

await admin.connect();

await admin.createTopics({
  topics: [{ topic: "cops", numPartitions: 1 }],
  waitForLeaders: true,
});

await admin.disconnect();
