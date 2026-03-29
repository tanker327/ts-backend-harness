/**
 * BullMQ queue factory using Redis for async job processing.
 */
import { Queue } from "bullmq";
import { env } from "./env.ts";

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
};

/** Create a named BullMQ queue connected to the configured Redis instance. */
export function createQueue(name: string) {
  return new Queue(name, { connection });
}

export { connection as redisConnection };
