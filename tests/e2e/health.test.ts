/**
 * E2E tests for the health and OpenAPI endpoints.
 *
 * Uses Hono's built-in app.request() to call endpoints in-process
 * against a test PostgreSQL database created by global-setup.ts.
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app, cleanTestData, seedTestData } from "./helpers.ts";

beforeAll(async () => {
  await seedTestData();
});

afterAll(async () => {
  await cleanTestData();
});

describe("GET /health", () => {
  it("returns 200 with status ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: "ok" });
  });
});

describe("GET /openapi.json", () => {
  it("returns 200 with valid OpenAPI 3.1.0 spec", async () => {
    const res = await app.request("/openapi.json");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { openapi: string; info: { title: string } };
    expect(body.openapi).toBe("3.1.0");
    expect(body.info.title).toBe("ts-backend-harness API");
  });
});
