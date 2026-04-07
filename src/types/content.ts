/**
 * Zod schemas for content validation and OpenAPI spec generation.
 * A content represents an external piece of content (post, article, video, etc.)
 * across platforms, with optional author attribution and thread support.
 */
import { z } from "@hono/zod-openapi";

export const contentPlatformSchema = z.enum(["x", "youtube", "instagram", "web", "rss", "note"]);

export const textFormatSchema = z.enum(["plain", "markdown", "html"]);

export const contentTypeSchema = z.enum([
  "post",
  "article",
  "video",
  "reel",
  "thread",
  "podcast",
  "note",
]);

export const contentStatusSchema = z.enum([
  "fetched",
  "understanding",
  "analyzing",
  "done",
  "partial",
  "failed",
]);

export const languageSchema = z.enum(["zh", "en", "mixed"]);

export const createContentSchema = z.object({
  platform: contentPlatformSchema,
  sourceId: z.string().nullable().optional(),
  url: z.string().url().nullable().optional(),
  authorAccountId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
  title: z.string().nullable().optional(),
  text: z.string().nullable().optional(),
  textFormat: textFormatSchema.optional().default("plain"),
  slug: z.string().nullable().optional(),
  language: languageSchema.nullable().optional(),
  contentType: contentTypeSchema.nullable().optional(),
  likes: z.number().int().nonnegative().nullable().optional(),
  reposts: z.number().int().nonnegative().nullable().optional(),
  replies: z.number().int().nonnegative().nullable().optional(),
  views: z.number().int().nonnegative().nullable().optional(),
  bookmarks: z.number().int().nonnegative().nullable().optional(),
  status: contentStatusSchema.optional(),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  postedAt: z.date().nullable().optional(),
  fetchedAt: z.date().nullable().optional(),
  archivedAt: z.date().nullable().optional(),
  readAt: z.date().nullable().optional(),
  meta: z.string().nullable().optional(),
  rawPayload: z.string().nullable().optional(),
});

export const updateContentSchema = createContentSchema.partial();

export const contentSchema = z.object({
  id: z.string(),
  platform: contentPlatformSchema,
  sourceId: z.string().nullable(),
  url: z.string().nullable(),
  authorAccountId: z.string().nullable(),
  parentId: z.string().nullable(),
  title: z.string().nullable(),
  text: z.string().nullable(),
  textFormat: z.string().nullable(),
  slug: z.string().nullable(),
  language: z.string().nullable(),
  contentType: z.string().nullable(),
  likes: z.number().int().nullable(),
  reposts: z.number().int().nullable(),
  replies: z.number().int().nullable(),
  views: z.number().int().nullable(),
  bookmarks: z.number().int().nullable(),
  status: z.string(),
  rating: z.number().int().nullable(),
  postedAt: z.coerce.date().nullable(),
  fetchedAt: z.coerce.date().nullable(),
  archivedAt: z.coerce.date().nullable(),
  readAt: z.coerce.date().nullable(),
  meta: z.string().nullable(),
  rawPayload: z.string().nullable(),
});

export type CreateContent = z.input<typeof createContentSchema>;
export type UpdateContent = z.input<typeof updateContentSchema>;
export type Content = z.infer<typeof contentSchema>;
