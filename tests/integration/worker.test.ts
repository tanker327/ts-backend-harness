/**
 * Smoke test for BullMQ worker integration with Redis.
 * Skips automatically when Redis is not reachable.
 */

import { QueueEvents } from "bullmq";
import IORedis from "ioredis";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createQueue, redisConnection } from "../../src/config/queue.ts";
import { createDefaultWorker } from "../../src/services/worker.ts";

/** Quick check if Redis is reachable before running the suite. */
async function canReachRedis(): Promise<boolean> {
  const client = new IORedis({ host: "localhost", port: 6379, lazyConnect: true });
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
  const queue = createQueue("default");
  const queueEvents = new QueueEvents("default", { connection: redisConnection });
  const worker = createDefaultWorker();

  beforeAll(async () => {
    await queueEvents.waitUntilReady();
    await worker.waitUntilReady();
  });

  afterAll(async () => {
    await worker.close();
    await queueEvents.close();
    await queue.close();
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
