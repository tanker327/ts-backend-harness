import { Queue } from "bullmq";
import { env } from "./env.ts";

const connection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
};

export function createQueue(name: string) {
  return new Queue(name, { connection });
}

export { connection as redisConnection };
