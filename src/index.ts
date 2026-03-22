import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { auth } from "./providers/auth.ts";
import { honoLogger } from "./providers/logger.ts";
import { createRouter } from "./routes/index.ts";

const app = new OpenAPIHono();

app.use("*", honoLogger());

// Better Auth handler
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

// API routes
const api = createRouter();
app.route("/", api);

// OpenAPI spec + Swagger UI
app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "ts-backend-harness API",
    version: "0.1.0",
  },
});
app.get("/docs", swaggerUI({ url: "/openapi.json" }));

export default {
  port: 3000,
  fetch: app.fetch,
};

export { app };
