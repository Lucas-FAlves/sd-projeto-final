import { broker } from "@/broker/broker";

if (!process.env.SERVICE_NAME) {
  throw new Error("SERVICE_NAME environment variable is not set");
}

export const consumer = broker.consumer({ groupId: process.env.SERVICE_NAME });
