/**
 * E2E tests for Better Auth email/password authentication flow.
 * Tests sign-up, sign-in, session retrieval, and sign-out via app.request().
 */
import { describe, expect, it } from "vitest";
import { app } from "./helpers.ts";

interface AuthResponse {
  user?: { email: string; name: string; id: string } | null;
}

const AUTH_USER = {
  name: "Auth Test User",
  email: "authtest@example.com",
  password: "secure-password-at-least-8-chars",
};

describe("Auth flow", () => {
  let sessionCookie = "";

  it("POST /api/auth/sign-up/email — registers a new user", async () => {
    const res = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: AUTH_USER.name,
        email: AUTH_USER.email,
        password: AUTH_USER.password,
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as AuthResponse;
    expect(body.user).toBeDefined();
    expect(body.user?.email).toBe(AUTH_USER.email);

    // Capture session cookie for subsequent requests
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/[^ ;]+=[^ ;]+/);
      sessionCookie = match ? match[0] : "";
    }
  });

  it("POST /api/auth/sign-up/email — rejects duplicate email", async () => {
    const res = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: AUTH_USER.name,
        email: AUTH_USER.email,
        password: AUTH_USER.password,
      }),
    });

    expect(res.status).not.toBe(200);
  });

  it("POST /api/auth/sign-in/email — logs in with correct credentials", async () => {
    const res = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: AUTH_USER.email,
        password: AUTH_USER.password,
      }),
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as AuthResponse;
    expect(body.user).toBeDefined();
    expect(body.user?.email).toBe(AUTH_USER.email);

    // Update session cookie
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/[^ ;]+=[^ ;]+/);
      sessionCookie = match ? match[0] : "";
    }
    expect(sessionCookie).not.toBe("");
  });

  it("POST /api/auth/sign-in/email — rejects wrong password", async () => {
    const res = await app.request("/api/auth/sign-in/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: AUTH_USER.email,
        password: "wrong-password",
      }),
    });

    expect(res.status).not.toBe(200);
  });

  it("GET /api/auth/get-session — returns user with valid session", async () => {
    const res = await app.request("/api/auth/get-session", {
      headers: { Cookie: sessionCookie },
    });

    expect(res.status).toBe(200);
    const body = (await res.json()) as AuthResponse;
    expect(body.user).toBeDefined();
    expect(body.user?.email).toBe(AUTH_USER.email);
  });

  it("GET /api/auth/get-session — returns no user without session", async () => {
    const res = await app.request("/api/auth/get-session");

    expect(res.status).toBe(200);
    const body = (await res.json()) as AuthResponse | null;
    // Better Auth returns null body or { user: null } when no session
    expect(body === null || body.user === null).toBe(true);
  });
});
