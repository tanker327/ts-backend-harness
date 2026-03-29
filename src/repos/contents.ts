/**
 * Data access layer for contents.
 * All database queries for the contents table live here.
 */
import { and, eq } from "drizzle-orm";
import { db } from "../config/db.ts";
import type { CreateContent, UpdateContent } from "../types/content.ts";
import { contents } from "./schema.ts";

/** Insert a new content row and return the created row. */
export async function createContent(id: string, data: CreateContent, now: number) {
  const [row] = await db
    .insert(contents)
    .values({
      id,
      platform: data.platform,
      sourceId: data.sourceId ?? null,
      url: data.url ?? null,
      authorAccountId: data.authorAccountId ?? null,
      parentId: data.parentId ?? null,
      title: data.title ?? null,
      text: data.text ?? null,
      textFormat: data.textFormat ?? "plain",
      slug: data.slug ?? null,
      language: data.language ?? null,
      contentType: data.contentType ?? null,
      likes: data.likes ?? null,
      reposts: data.reposts ?? null,
      replies: data.replies ?? null,
      views: data.views ?? null,
      bookmarks: data.bookmarks ?? null,
      status: data.status ?? "fetched",
      rating: data.rating ?? null,
      postedAt: data.postedAt ?? null,
      fetchedAt: data.fetchedAt ?? now,
      archivedAt: data.archivedAt ?? null,
      readAt: data.readAt ?? null,
      meta: data.meta ?? null,
      rawPayload: data.rawPayload ?? null,
    })
    .returning();
  return row;
}

/** Find a content row by its primary key. */
export async function getContentById(id: string) {
  const [row] = await db.select().from(contents).where(eq(contents.id, id));
  return row ?? null;
}

/** List contents with optional filters. */
export async function listContents(opts?: {
  platform?: string;
  status?: string;
  contentType?: string;
  authorAccountId?: string;
}) {
  const conditions = [];
  if (opts?.platform) conditions.push(eq(contents.platform, opts.platform));
  if (opts?.status) conditions.push(eq(contents.status, opts.status));
  if (opts?.contentType) conditions.push(eq(contents.contentType, opts.contentType));
  if (opts?.authorAccountId) conditions.push(eq(contents.authorAccountId, opts.authorAccountId));

  if (conditions.length > 0) {
    return db
      .select()
      .from(contents)
      .where(and(...conditions));
  }
  return db.select().from(contents);
}

/** Update a content row by ID and return the updated row. */
export async function updateContent(id: string, data: UpdateContent) {
  const [row] = await db
    .update(contents)
    .set({ ...data })
    .where(eq(contents.id, id))
    .returning();
  return row ?? null;
}

/** Delete a content row by ID. Returns true if a row was deleted. */
export async function deleteContent(id: string) {
  const result = await db.delete(contents).where(eq(contents.id, id)).returning();
  return result.length > 0;
}
