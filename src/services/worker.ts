/**
 * Minimal BullMQ worker for the "default" queue.
 * Processes simple job types (e.g. "ping") to verify Redis + BullMQ integration.
 */

import type { Job } from "bullmq";
import { Worker } from "bullmq";
import { redisConnection } from "../config/queue.ts";

/** Job data shape for the default queue. */
export interface DefaultJobData {
  type: string;
  payload?: Record<string, unknown>;
}

/** Job result shape for the default queue. */
export interface DefaultJobResult {
  ok: boolean;
  message: string;
}

/**
 * Process a single job from the default queue.
 * Routes by job data `type` field.
 */
async function processJob(job: Job<DefaultJobData>): Promise<DefaultJobResult> {
  switch (job.data.type) {
    case "ping":
      return { ok: true, message: "pong" };
    default:
      return { ok: false, message: `unknown job type: ${job.data.type}` };
  }
}

/**
 * Create and return a BullMQ worker for the "default" queue.
 * Caller is responsible for closing the worker when done.
 */
export function createDefaultWorker(): Worker<DefaultJobData, DefaultJobResult> {
  return new Worker<DefaultJobData, DefaultJobResult>("default", processJob, {
    connection: redisConnection,
  });
}
