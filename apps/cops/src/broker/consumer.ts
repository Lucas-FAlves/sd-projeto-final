import { broker } from "./broker.js";

export const consumer = broker.consumer({ groupId: "cops" });
