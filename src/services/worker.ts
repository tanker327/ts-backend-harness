/**
 * Minimal BullMQ worker for the "default" queue.
 * Processes simple job types (e.g. "ping") to verify Redis + BullMQ integration.
 */

import type { Job } from "bullmq";
import { Worker } from "bullmq";
import { redisConnection } from "../config/queue.ts";
import * as contentRepo from "../repos/contents.ts";

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

/** Extract a title from text by taking the first N words. */
export function generateTitleFromText(text: string, maxWords = 8): string {
  const words = text.trim().split(/\s+/);
  const title = words.slice(0, maxWords).join(" ");
  return words.length > maxWords ? `${title}...` : title;
}

/**
 * Process a single job from the default queue.
 * Routes by job data `type` field.
 */
export async function processJob(job: Job<DefaultJobData>): Promise<DefaultJobResult> {
  switch (job.data.type) {
    case "ping":
      return { ok: true, message: "pong" };

    case "generate-title": {
      const contentId = job.data.payload?.contentId as string | undefined;
      if (!contentId) {
        return { ok: false, message: "missing contentId in payload" };
      }

      console.log(`[worker] generate-title: processing content ${contentId}`);

      const content = await contentRepo.getContentById(contentId);
      if (!content) {
        return { ok: false, message: `content not found: ${contentId}` };
      }

      if (content.title?.trim()) {
        console.log(`[worker] generate-title: content ${contentId} already has a title, skipping`);
        return { ok: true, message: "title already exists, skipping" };
      }

      if (!content.text?.trim()) {
        return { ok: false, message: "content has no text to generate title from" };
      }

      const title = generateTitleFromText(content.text);
      await contentRepo.updateContent(contentId, { title });

      console.log(`[worker] generate-title: content ${contentId} title set to "${title}"`);
      return { ok: true, message: `title generated: ${title}` };
    }

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
