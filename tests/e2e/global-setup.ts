/**
 * Vitest global setup/teardown for e2e tests.
 *
 * Runs once before all test files: creates a fresh SQLite test database,
 * pushes the Drizzle schema into it, and enables WAL mode + busy_timeout
 * to prevent SQLITE_BUSY errors during parallel test execution.
 * Runs once after all test files: deletes the test database file.
 */
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { createClient } from "@libsql/client";

const TEST_DB_PATH = "./data/test.db";

/** Push schema from src/repos/schema.ts into the test DB via drizzle-kit. */
export async function setup() {
  execSync(
    `bunx drizzle-kit push --force --dialect sqlite --schema ./src/repos/schema.ts --url "file:${TEST_DB_PATH}"`,
    { stdio: "pipe" },
  );

  // Enable WAL mode and busy_timeout to reduce SQLITE_BUSY under concurrency
  const client = createClient({ url: `file:${TEST_DB_PATH}` });
  await client.executeMultiple("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;");
  client.close();
}

/** Remove the test DB and WAL/SHM files so they don't persist between runs. */
export function teardown() {
  rmSync(TEST_DB_PATH, { force: true });
  rmSync(`${TEST_DB_PATH}-wal`, { force: true });
  rmSync(`${TEST_DB_PATH}-shm`, { force: true });
}
