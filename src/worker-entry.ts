/**
 * Standalone entry point for the BullMQ worker process.
 * Run with: bun run worker
 */
import { createDefaultWorker } from "./services/worker.ts";

const worker = createDefaultWorker();

console.log(`[worker] started, processing queue: ${worker.name}`);

const shutdown = async () => {
  console.log("[worker] shutting down...");
  await worker.close();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
