import { OpenAPIHono } from "@hono/zod-openapi";
import { registerHealthRoutes } from "./health.ts";

export function createRouter(): OpenAPIHono {
  const router = new OpenAPIHono();
  registerHealthRoutes(router);
  return router;
}
