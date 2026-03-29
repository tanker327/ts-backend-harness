/**
 * REST endpoints for author accounts with OpenAPI spec.
 * Provides CRUD operations for external content creator profiles.
 */
import type { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute, z } from "@hono/zod-openapi";
import * as authorAccountService from "../services/author-accounts.ts";
import {
  type AuthorAccount,
  authorAccountSchema,
  createAuthorAccountSchema,
  platformSchema,
  updateAuthorAccountSchema,
} from "../types/author-account.ts";

const tags = ["Author Accounts"];

const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

const createRoute_ = createRoute({
  method: "post",
  path: "/author-accounts",
  tags,
  summary: "Create an author account",
  request: {
    body: {
      content: {
        "application/json": { schema: createAuthorAccountSchema },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: authorAccountSchema } },
      description: "Author account created",
    },
    409: {
      content: { "application/json": { schema: errorSchema } },
      description: "Duplicate platform + accountId",
    },
  },
});

const listRoute = createRoute({
  method: "get",
  path: "/author-accounts",
  tags,
  summary: "List author accounts",
  request: {
    query: z.object({
      platform: platformSchema.optional(),
    }),
  },
  responses: {
    200: {
      content: {
        "application/json": { schema: z.array(authorAccountSchema) },
      },
      description: "List of author accounts",
    },
  },
});

const getByIdRoute = createRoute({
  method: "get",
  path: "/author-accounts/{id}",
  tags,
  summary: "Get an author account by ID",
  request: {
    params: z.object({ id: z.string() }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: authorAccountSchema } },
      description: "Author account found",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "Author account not found",
    },
  },
});

const updateRoute = createRoute({
  method: "put",
  path: "/author-accounts/{id}",
  tags,
  summary: "Update an author account",
  request: {
    params: z.object({ id: z.string() }),
    body: {
      content: {
        "application/json": { schema: updateAuthorAccountSchema },
      },
    },
  },
  responses: {
    200: {
      content: { "application/json": { schema: authorAccountSchema } },
      description: "Author account updated",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "Author account not found",
    },
  },
});

const deleteRoute = createRoute({
  method: "delete",
  path: "/author-accounts/{id}",
  tags,
  summary: "Delete an author account",
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
      description: "Author account deleted",
    },
    404: {
      content: { "application/json": { schema: errorSchema } },
      description: "Author account not found",
    },
  },
});

/** Register all author account CRUD routes on the given Hono app. */
export function registerAuthorAccountRoutes(app: OpenAPIHono) {
  app.openapi(createRoute_, async (c) => {
    const body = c.req.valid("json");
    try {
      const row = await authorAccountService.create(body);
      return c.json(row as AuthorAccount, 201);
    } catch (err: unknown) {
      const errMsg =
        err instanceof Error
          ? `${err.message} ${(err as { cause?: Error }).cause?.message ?? ""}`
          : "";
      if (errMsg.includes("UNIQUE constraint") || errMsg.includes("SQLITE_CONSTRAINT_UNIQUE")) {
        return c.json(
          {
            error: {
              code: "DUPLICATE",
              message: "Author account with this platform and accountId already exists",
            },
          },
          409,
        );
      }
      throw err;
    }
  });

  app.openapi(listRoute, async (c) => {
    const { platform } = c.req.valid("query");
    const rows = await authorAccountService.list(platform ? { platform } : undefined);
    return c.json(rows as AuthorAccount[], 200);
  });

  app.openapi(getByIdRoute, async (c) => {
    const { id } = c.req.valid("param");
    const row = await authorAccountService.getById(id);
    if (!row) {
      return c.json({ error: { code: "NOT_FOUND", message: "Author account not found" } }, 404);
    }
    return c.json(row as AuthorAccount, 200);
  });

  app.openapi(updateRoute, async (c) => {
    const { id } = c.req.valid("param");
    const body = c.req.valid("json");
    const row = await authorAccountService.update(id, body);
    if (!row) {
      return c.json({ error: { code: "NOT_FOUND", message: "Author account not found" } }, 404);
    }
    return c.json(row as AuthorAccount, 200);
  });

  app.openapi(deleteRoute, async (c) => {
    const { id } = c.req.valid("param");
    const deleted = await authorAccountService.remove(id);
    if (!deleted) {
      return c.json({ error: { code: "NOT_FOUND", message: "Author account not found" } }, 404);
    }
    return c.json({ success: true }, 200);
  });
}
