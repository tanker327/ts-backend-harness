/**
 * REST endpoints for contents with OpenAPI spec.
 * Provides CRUD operations for external content (posts, articles, videos, etc.).
 */
import type { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute, z } from "@hono/zod-openapi";
import * as contentService from "../services/contents.ts";
import {
  type Content,
  contentPlatformSchema,
  contentSchema,
  contentStatusSchema,
  contentTypeSchema,
  createContentSchema,
  updateContentSchema,
} from "../types/content.ts";

const tags = ["Contents"];

const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

const createRoute_ = createRoute({
  method: "post",
  path: "/contents",
  tags,
  summary: "Create a content",
  request: {
    body: {
      content: {
        "application/json": { schema: createContentSchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: contentSchema } },
      description: "Content created",
    },
    409: {
      content: { "application/json": { schema: errorSchema } },
      description: "Duplicate platform + sourceId",
    },
  },
});

const listRoute = createRoute({
  method: "get",
  path: "/contents",
  tags,
  summary: "List contents",
  request: {
    query: z.object({
      platform: contentPlatformSchema.optional(),
      status: contentStatusSchema.optional(),
      content_type: contentTypeSchema.optional(),
      author_account_id: z.string().optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(contentSchema) },
      },
      description: "List of contents",
    },
  },
});

const getByIdRoute = createRoute({
  method: "get",
  path: "/contents/{id}",
  tags,
  summary: "Get a content by ID",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: contentSchema } },
      description: "Content found",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "Content not found",
    },
  },
});

const updateRoute = createRoute({
  method: "put",
  path: "/contents/{id}",
  tags,
  summary: "Update a content",
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        "application/json": { schema: updateContentSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: contentSchema } },
      description: "Content updated",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "Content not found",
    },
  },
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/contents/{id}",
  tags,
  summary: "Delete a content",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ success: z.boolean() }),
        },
      },
      description: "Content deleted",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "Content not found",
    },
  },
});

/** Register all content CRUD routes on the given Hono app. */
export function registerContentRoutes(app: OpenAPIHono) {
  app.openapi(createRoute_, async (c) => {
    const body = c.req.valid("json");
    try {
      const row = await contentService.create(body);
      return c.json(row as Content, 201);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? `${err.message} ${(err as { cause?: Error }).cause?.message ?? ""}`
          : "";
      const cause = err instanceof Error ? (err as { cause?: { code?: string } }).cause : null;
      const isPgDuplicate = cause?.code === "23505";
      if (
        isPgDuplicate ||
        errMsg.includes("UNIQUE constraint") ||
        errMsg.includes("SQLITE_CONSTRAINT_UNIQUE")
      ) {
        return c.json(
          {
            error: {
              code: "DUPLICATE",
              message: "Content with this platform and sourceId already exists",
            },
          },
          409,
        );
      }
      throw err;
    }
  });

  app.openapi(listRoute, async (c) => {
    const { platform, status, content_type, author_account_id } = c.req.valid("query");
    const opts: {
      platform?: string;
      status?: string;
      contentType?: string;
      authorAccountId?: string;
    } = {};
    if (platform) opts.platform = platform;
    if (status) opts.status = status;
    if (content_type) opts.contentType = content_type;
    if (author_account_id) opts.authorAccountId = author_account_id;
    const rows = await contentService.list(Object.keys(opts).length > 0 ? opts : undefined);
    return c.json(rows as Content[], 200);
  });

  app.openapi(getByIdRoute, async (c) => {
    const { id } = c.req.valid("param");
    const row = await contentService.getById(id);
    if (!row) {
      return c.json({ error: { code: "NOT_FOUND", message: "Content not found" } }, 404);
    }
    return c.json(row as Content, 200);
  });

  app.openapi(updateRoute, async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const row = await contentService.update(id, body);
    if (!row) {
      return c.json({ error: { code: "NOT_FOUND", message: "Content not found" } }, 404);
    }
    return c.json(row as Content, 200);
  });

  app.openapi(deleteRoute, async (c) => {
    const { id } = c.req.valid("param");
    const deleted = await contentService.remove(id);
    if (!deleted) {
      return c.json({ error: { code: "NOT_FOUND", message: "Content not found" } }, 404);
    }
    return c.json({ success: true }, 200);
  });
}
