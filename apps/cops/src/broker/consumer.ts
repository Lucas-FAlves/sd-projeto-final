import { broker } from "@/broker/broker";

export const consumer = broker.consumer({ groupId: "cops" });
