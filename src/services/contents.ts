/**
 * Business logic for contents.
 * Handles ID generation, default values, and delegates to the repo layer.
 */
import * as repo from "../repos/contents.ts";
import type { CreateContent, UpdateContent } from "../types/content.ts";

/** Create a new content with a generated UUID. Defaults status to 'fetched' and fetchedAt to now. */
export async function create(data: CreateContent) {
  const id = crypto.randomUUID();
  const now = new Date();
  return repo.createContent(id, data, now);
}

/** Get a content by ID, or null if not found. */
export async function getById(id: string) {
  return repo.getContentById(id);
}

/** List contents, optionally filtered by platform, status, contentType, or authorAccountId. */
export async function list(opts?: {
  platform?: string;
  status?: string;
  contentType?: string;
  authorAccountId?: string;
}) {
  return repo.listContents(opts);
}

/** Update a content by ID. Returns the updated row or null. */
export async function update(id: string, data: UpdateContent) {
  return repo.updateContent(id, data);
}

/** Delete a content by ID. Returns true if deleted. */
export async function remove(id: string) {
  return repo.deleteContent(id);
}
