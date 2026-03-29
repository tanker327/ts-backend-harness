/**
 * Health check endpoint with OpenAPI spec.
 * Returns service status for monitoring and load balancer probes.
 */
import type { OpenAPIHono } from "@hono/zod-openapi";
import { createRoute, z } from "@hono/zod-openapi";

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["System"],
  summary: "Health check",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({
            status: z.string(),
          }),
        },
      },
      description: "Service is healthy",
    },
  },
});

/** Register the GET /health route on the given Hono app. */
export function registerHealthRoutes(app: OpenAPIHono) {
  app.openapi(healthRoute, (c) => {
    return c.json({ status: "ok" }, 200);
  });
}
