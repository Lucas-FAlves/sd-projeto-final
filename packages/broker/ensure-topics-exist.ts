import type { Kafka } from "kafkajs";

export async function ensureTopicsExist(broker: Kafka, topics: string[]) {
  const admin = broker.admin();
  await admin.connect();

  try {
    const existingTopics = await admin.listTopics();
    const topicsToCreate = topics
      .filter((topic) => !existingTopics.includes(topic))
      .map((topic) => ({ topic, numPartitions: 1 }));

    if (topicsToCreate.length > 0) {
      await admin.createTopics({
        topics: topicsToCreate,
        waitForLeaders: true,
      });
      console.log(
        `Created topics: ${topicsToCreate.map((t) => t.topic).join(", ")}`
      );
    }
  } finally {
    await admin.disconnect();
  }
}
