/**
 * E2E tests for the author accounts CRUD endpoints.
 *
 * Tests all five REST operations against a test PostgreSQL database.
 */
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { db } from "../../src/config/db.ts";
import { authorAccounts, contents } from "../../src/repos/schema.ts";
import type { AuthorAccount } from "../../src/types/author-account.ts";
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
  await db.delete(authorAccounts);
});

const validPayload = {
  platform: "youtube",
  accountId: "UC1234",
  accountUrl: "https://youtube.com/@test",
  handle: "@TestCreator",
  name: "Test Creator",
  description: "A test channel",
  avatarUrl: "https://example.com/avatar.jpg",
  followers: 1000,
  isVerified: true,
  meta: '{"subscriberCount":1000}',
};

async function createAccount(payload = validPayload) {
  return app.request("/author-accounts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

describe("POST /author-accounts", () => {
  it("creates an author account and returns 201", async () => {
    const res = await createAccount();
    expect(res.status).toBe(201);
    const body = (await res.json()) as AuthorAccount;
    expect(body.platform).toBe("youtube");
    expect(body.accountId).toBe("UC1234");
    expect(body.name).toBe("Test Creator");
    expect(body.isVerified).toBe(true);
    expect(body.id).toBeDefined();
    expect(body.createdAt).toBeTypeOf("string");
  });

  it("rejects duplicate platform + accountId with 409", async () => {
    await createAccount();
    const res = await createAccount();
    expect(res.status).toBe(409);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error.code).toBe("DUPLICATE");
  });

  it("rejects invalid payload with 400", async () => {
    const res = await app.request("/author-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform: "invalid" }),
    });
    expect(res.status).toBe(400);
  });
});

describe("GET /author-accounts", () => {
  it("returns empty array when no accounts exist", async () => {
    const res = await app.request("/author-accounts");
    expect(res.status).toBe(200);
    const body = (await res.json()) as AuthorAccount[];
    expect(body).toEqual([]);
  });

  it("lists all accounts", async () => {
    await createAccount();
    await createAccount({
      ...validPayload,
      platform: "x",
      accountId: "12345",
      handle: "@test",
    });
    const res = await app.request("/author-accounts");
    expect(res.status).toBe(200);
    const body = (await res.json()) as AuthorAccount[];
    expect(body).toHaveLength(2);
  });

  it("filters by platform", async () => {
    await createAccount();
    await createAccount({
      ...validPayload,
      platform: "x",
      accountId: "12345",
      handle: "@test",
    });
    const res = await app.request("/author-accounts?platform=youtube");
    expect(res.status).toBe(200);
    const body = (await res.json()) as AuthorAccount[];
    expect(body).toHaveLength(1);
    expect(body[0]?.platform).toBe("youtube");
  });
});

describe("GET /author-accounts/:id", () => {
  it("returns the account by ID", async () => {
    const createRes = await createAccount();
    const created = (await createRes.json()) as AuthorAccount;
    const res = await app.request(`/author-accounts/${created.id}`);
    expect(res.status).toBe(200);
    const body = (await res.json()) as AuthorAccount;
    expect(body.id).toBe(created.id);
    expect(body.name).toBe("Test Creator");
  });

  it("returns 404 for non-existent ID", async () => {
    const res = await app.request("/author-accounts/nonexistent");
    expect(res.status).toBe(404);
    const body = (await res.json()) as ErrorResponse;
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

describe("PUT /author-accounts/:id", () => {
  it("updates the account and returns it", async () => {
    const createRes = await createAccount();
    const created = (await createRes.json()) as AuthorAccount;
    const res = await app.request(`/author-accounts/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated Name", followers: 5000 }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as AuthorAccount;
    expect(body.name).toBe("Updated Name");
    expect(body.followers).toBe(5000);
    expect(new Date(body.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(created.updatedAt).getTime(),
    );
  });

  it("returns 404 for non-existent ID", async () => {
    const res = await app.request("/author-accounts/nonexistent", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Nope" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /author-accounts/:id", () => {
  it("deletes the account and returns success", async () => {
    const createRes = await createAccount();
    const created = (await createRes.json()) as AuthorAccount;
    const res = await app.request(`/author-accounts/${created.id}`, {
      method: "DELETE",
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean };
    expect(body.success).toBe(true);

    const getRes = await app.request(`/author-accounts/${created.id}`);
    expect(getRes.status).toBe(404);
  });

  it("returns 404 for non-existent ID", async () => {
    const res = await app.request("/author-accounts/nonexistent", {
      method: "DELETE",
    });
    expect(res.status).toBe(404);
  });
});
