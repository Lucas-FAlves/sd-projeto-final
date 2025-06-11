import { broker } from "@/broker/broker";

const admin = broker.admin();

export async function createTopics() {
  await admin.connect();

  try {
    const existingTopics = await admin.listTopics();
    const topicsToCreate = [{ topic: "notification", numPartitions: 1 }].filter(
      (topicConfig) => !existingTopics.includes(topicConfig.topic)
    );

    if (topicsToCreate.length > 0) {
      await admin.createTopics({
        topics: topicsToCreate,
        waitForLeaders: true,
      });
    }
  } catch (error) {
    console.error("Error managing topics:", error);
  } finally {
    await admin.disconnect();
  }
}
