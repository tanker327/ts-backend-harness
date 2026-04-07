/**
 * Zod schemas for author account validation and OpenAPI spec generation.
 * An author account represents an external content creator profile on a platform.
 */
import { z } from "@hono/zod-openapi";

export const platformSchema = z.enum(["x", "youtube", "instagram", "web", "rss"]);

export const createAuthorAccountSchema = z.object({
  platform: platformSchema,
  accountId: z.string().min(1),
  accountUrl: z.string().url().nullable().optional(),
  handle: z.string().nullable().optional(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  followers: z.number().int().nonnegative().nullable().optional(),
  isVerified: z.boolean().optional().default(false),
  meta: z.string().nullable().optional(),
});

export const updateAuthorAccountSchema = createAuthorAccountSchema.partial();

export const authorAccountSchema = z.object({
  id: z.string(),
  platform: platformSchema,
  accountId: z.string(),
  accountUrl: z.string().nullable(),
  handle: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  followers: z.number().int().nullable(),
  isVerified: z.boolean(),
  meta: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type CreateAuthorAccount = z.input<typeof createAuthorAccountSchema>;
export type UpdateAuthorAccount = z.input<typeof updateAuthorAccountSchema>;
export type AuthorAccount = z.infer<typeof authorAccountSchema>;
