/**
 * Shared helpers for e2e tests.
 *
 * Provides test fixtures (TEST_USER), seed/clean utilities for the test
 * database, and re-exports the Hono app for use with app.request().
 *
 * Note: test helpers access the DB directly (outside src/repos/) because
 * this is test infrastructure, not application code.
 */
import { db } from "../../src/config/db.ts";
import {
  accounts,
  authorAccounts,
  contents,
  sessions,
  users,
  verifications,
} from "../../src/repos/schema.ts";

export { app } from "../../src/index.ts";

export const TEST_USER = {
  id: "test-user-1",
  name: "Test User",
  email: "test@example.com",
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

/** Insert baseline test records. Call in beforeAll(). */
export async function seedTestData() {
  await db.insert(users).values(TEST_USER).onConflictDoNothing();
}

/** Remove all seeded records. Call in afterAll(). */
export async function cleanTestData() {
  await db.delete(contents);
  await db.delete(authorAccounts);
  await db.delete(sessions);
  await db.delete(accounts);
  await db.delete(verifications);
  await db.delete(users);
}
