/**
 * Better Auth provider with Drizzle adapter for PostgreSQL.
 * Handles email/password authentication.
 */
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../config/db.ts";
import { env } from "../config/env.ts";
import * as schema from "../repos/schema.ts";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
  },
});
