/**
 * Top-level route aggregator. Creates the API router and registers all route modules.
 */
import { OpenAPIHono } from "@hono/zod-openapi";
import { registerHealthRoutes } from "./health.ts";

/** Create the API router with all registered route modules. */
export function createRouter(): OpenAPIHono {
  const router = new OpenAPIHono();
  registerHealthRoutes(router);
  return router;
}
