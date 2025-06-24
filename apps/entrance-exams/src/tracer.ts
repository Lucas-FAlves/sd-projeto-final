import { trace } from "@opentelemetry/api";

if (!process.env.SERVICE_NAME) {
  throw new Error("SERVICE_NAME environment variable is not set");
}

export const tracer = trace.getTracer(process.env.SERVICE_NAME);
