/**
 * Smoke test for BullMQ worker integration with Redis.
 * Skips automatically when Redis is not reachable.
 */

import type { Queue, QueueEvents, Worker } from "bullmq";
import IORedis from "ioredis";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const TEST_REDIS_PORT = Number(process.env.REDIS_PORT ?? 6379);

/** Quick check if Redis is reachable before running the suite. */
async function canReachRedis(): Promise<boolean> {
  const client = new IORedis({
    host: "localhost",
    port: TEST_REDIS_PORT,
    lazyConnect: true,
    retryStrategy: () => null,
  });
  client.on("error", () => {});
  try {
    await client.connect();
    await client.ping();
    await client.quit();
    return true;
  } catch {
    client.disconnect();
    return false;
  }
}

const redisAvailable = await canReachRedis();

describe.skipIf(!redisAvailable)("BullMQ worker smoke test", () => {
  let queue: Queue;
  let queueEvents: QueueEvents;
  let worker: Worker;

  beforeAll(async () => {
    const { QueueEvents: QE } = await import("bullmq");
    const { createQueue, redisConnection } = await import("../../src/config/queue.ts");
    const { createDefaultWorker } = await import("../../src/services/worker.ts");

    queue = createQueue("default");
    queueEvents = new QE("default", { connection: redisConnection });
    worker = createDefaultWorker();

    await queueEvents.waitUntilReady();
    await worker.waitUntilReady();
  });

  afterAll(async () => {
    await worker?.close();
    await queueEvents?.close();
    await queue?.close();
  });

  it("processes a ping job and returns pong", async () => {
    const job = await queue.add("ping", { type: "ping" });

    const result = await job.waitUntilFinished(queueEvents, 5_000);

    expect(result).toEqual({ ok: true, message: "pong" });
  });

  it("returns failure for unknown job type", async () => {
    const job = await queue.add("unknown", { type: "unknown-type" });

    const result = await job.waitUntilFinished(queueEvents, 5_000);

    expect(result).toEqual({ ok: false, message: "unknown job type: unknown-type" });
  });
});
