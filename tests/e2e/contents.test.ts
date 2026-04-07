/**
 * E2E tests for the contents CRUD endpoints.
 *
 * Tests all five REST operations against a test PostgreSQL database.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../src/config/db.ts";
import { contents } from "../../src/repos/schema.ts";
import type { Content } from "../../src/types/content.ts";
import { app, cleanTestData, seedTestData } from "./helpers.ts";

interface ErrorResponse {
  error: { code: string; message: string };
}

beforeAll(async () => {
  await seedTestData();
});

afterAll(async () => {
  await cleanTestData();
});

beforeEach(async () => {
  await db.delete(contents);
});

const validPayload = {
  platform: "x",
  sourceId: "status-123456",
  url: "https://x.com/user/status/123456",
  title: null,
  text: "Hello world from X",
  textFormat: "plain",
  contentType: "post",
  language: "en",
  likes: 42,
  reposts: 5,
  replies: 3,
  views: 1000,
  bookmarks: 10,
  meta: '{"raw":"data"}',
};

async function createContent(payload: Record<string, unknown> = validPayload) {
  return app.request("/contents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("POST /contents", () => {
  it("creates a content and returns 201", async () => {
    const res = await createContent();
    expect(res.status).toBe(201);
    const body = (await res.json()) as Content;
    expect(body.platform).toBe("x");
    expect(body.sourceId).toBe("status-123456");
    expect(body.text).toBe("Hello world from X");
    expect(body.status).toBe("fetched");
    expect(body.id).toBeDefined();
    expect(body.fetchedAt).toBeTypeOf("string");
  });

  it("defaults status to fetched and sets fetchedAt", async () => {
    const res = await createContent({
      platform: "web",
      text: "Minimal content",
    } as typeof validPayload);
    expect(res.status).toBe(201);
    const body = (await res.json()) as Content;
    expect(body.status).toBe("fetched");
    expect(body.fetchedAt).toBeTypeOf("string");
    expect(new Date(body.fetchedAt as unknown as string).getTime()).toBeGreaterThan(0);
  });

  it("rejects duplicate platform + sourceId with 409", async () => {
    await createContent();
    const res = await createContent();
    expect(res.status).toBe(409);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error.code).toBe("DUPLICATE");
  });

  it("rejects invalid payload with 400", async () => {
    const res = await app.request("/contents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "invalid_platform" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /contents", () => {
  it("returns empty array when no contents exist", async () => {
    const res = await app.request("/contents");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Content[];
    expect(body).toEqual([]);
  });

  it("lists all contents", async () => {
    await createContent();
    await createContent({
      ...validPayload,
      platform: "youtube",
      sourceId: "vid-789",
      contentType: "video",
    });
    const res = await app.request("/contents");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Content[];
    expect(body).toHaveLength(2);
  });

  it("filters by platform", async () => {
    await createContent();
    await createContent({
      ...validPayload,
      platform: "youtube",
      sourceId: "vid-789",
    });
    const res = await app.request("/contents?platform=x");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Content[];
    expect(body).toHaveLength(1);
    expect(body[0]?.platform).toBe("x");
  });

  it("filters by status", async () => {
    await createContent();
    await createContent({
      ...validPayload,
      sourceId: "done-1",
      status: "done",
    });
    const res = await app.request("/contents?status=done");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Content[];
    expect(body).toHaveLength(1);
    expect(body[0]?.status).toBe("done");
  });

  it("filters by content_type", async () => {
    await createContent();
    await createContent({
      ...validPayload,
      sourceId: "vid-1",
      contentType: "video",
    });
    const res = await app.request("/contents?content_type=video");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Content[];
    expect(body).toHaveLength(1);
    expect(body[0]?.contentType).toBe("video");
  });
});

describe("GET /contents/:id", () => {
  it("returns the content by ID", async () => {
    const createRes = await createContent();
    const created = (await createRes.json()) as Content;
    const res = await app.request(`/contents/${created.id}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as Content;
    expect(body.id).toBe(created.id);
    expect(body.text).toBe("Hello world from X");
  });

  it("returns 404 for non-existent ID", async () => {
    const res = await app.request("/contents/nonexistent");
    expect(res.status).toBe(404);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

describe("PUT /contents/:id", () => {
  it("updates the content and returns it", async () => {
    const createRes = await createContent();
    const created = (await createRes.json()) as Content;
    const res = await app.request(`/contents/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Updated text", status: "done", rating: 4 }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as Content;
    expect(body.text).toBe("Updated text");
    expect(body.status).toBe("done");
    expect(body.rating).toBe(4);
  });

  it("returns 404 for non-existent ID", async () => {
    const res = await app.request("/contents/nonexistent", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Nope" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /contents/:id", () => {
  it("deletes the content and returns success", async () => {
    const createRes = await createContent();
    const created = (await createRes.json()) as Content;
    const res = await app.request(`/contents/${created.id}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);

    const getRes = await app.request(`/contents/${created.id}`);
    expect(getRes.status).toBe(404);
  });

  it("returns 404 for non-existent ID", async () => {
    const res = await app.request("/contents/nonexistent", {
      method: "DELETE",
    });
    expect(res.status).toBe(404);
  });
});
