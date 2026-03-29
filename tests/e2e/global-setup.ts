/**
 * Vitest global setup/teardown for e2e tests.
 *
 * Runs once before all test files: creates a fresh SQLite test database
 * and pushes the Drizzle schema into it. Runs once after all test files:
 * deletes the test database file.
 */
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";

const TEST_DB_PATH = "./data/test.db";

/** Push schema from src/repos/schema.ts into the test DB via drizzle-kit. */
export function setup() {
  execSync("bunx drizzle-kit push --force", {
    env: {
      ...process.env,
      DATABASE_URL: `file:${TEST_DB_PATH}`,
    },
    stdio: "pipe",
  });
}

/** Remove the test DB file so it doesn't persist between runs. */
export function teardown() {
  rmSync(TEST_DB_PATH, { force: true });
}
