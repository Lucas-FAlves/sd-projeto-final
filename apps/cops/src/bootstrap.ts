import "@/broker/topics.js";
import { consumer } from "./broker/consumer.js";

await consumer.connect();
