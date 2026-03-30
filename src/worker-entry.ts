/**
 * Standalone entry point for the BullMQ worker process.
 * Run with: bun run worker
 *
 * Checks Redis connectivity before starting the worker.
 * Exits with a clear error message if Redis is unreachable.
 */
import IORedis from "ioredis";
import { redisConnection } from "./config/queue.ts";
import { logger } from "./providers/logger.ts";
import { createDefaultWorker } from "./services/worker.ts";

/** Verify Redis is reachable before starting the worker. */
async function checkRedis(): Promise<void> {
  const client = new IORedis({
    host: redisConnection.host,
    port: redisConnection.port,
    lazyConnect: true,
    retryStrategy: () => null,
  });
  client.on("error", () => {}); // suppress default error logging during probe

  try {
    await client.connect();
    await client.ping();
    await client.quit();
    logger.debug(
      { host: redisConnection.host, port: redisConnection.port },
      "Redis connection verified",
    );
  } catch {
    client.disconnect();
    logger.error(
      { host: redisConnection.host, port: redisConnection.port },
      "Cannot connect to Redis — is it running? The worker requires Redis for job processing.",
    );
    logger.error(
      "Start Redis with: docker compose up -d redis  (or set REDIS_HOST / REDIS_PORT in .env)",
    );
    process.exit(1);
  }
}

await checkRedis();

const worker = createDefaultWorker();

logger.info({ queue: worker.name }, "Worker started, processing queue");

const shutdown = async () => {
  logger.info("Worker shutting down...");
  await worker.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
