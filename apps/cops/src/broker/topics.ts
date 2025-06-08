import { broker } from "@/broker/broker";

const admin = broker.admin();

export async function createTopics() {
  await admin.connect();

  await admin.createTopics({
    topics: [{ topic: "cops-events", numPartitions: 1 }],
    waitForLeaders: true,
  });

  await admin.disconnect();
}
