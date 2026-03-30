/**
 * Vitest global setup/teardown for e2e tests.
 *
 * Runs once before all test files:
 * - Ensures Redis is running (starts via docker compose if needed)
 * - Creates a fresh SQLite test database with Drizzle schema
 * - Enables WAL mode + busy_timeout to prevent SQLITE_BUSY errors
 *
 * Runs once after all test files:
 * - Deletes the test database file
 * - Stops Redis if we started it (leaves it alone if it was already running)
 */
import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { createClient } from "@libsql/client";
import IORedis from "ioredis";

const TEST_DB_PATH = "./data/test.db";
const TEST_REDIS_PORT = 6380;
let weStartedRedis = false;

/** Check if the test Redis is reachable on localhost:6380. */
async function isRedisRunning(): Promise<boolean> {
  const client = new IORedis({
    host: "localhost",
    port: TEST_REDIS_PORT,
    lazyConnect: true,
    retryStrategy: () => null,
  });
  client.on("error", () => {});
  try {
    await client.connect();
    await client.ping();
    await client.quit();
    return true;
  } catch {
    client.disconnect();
    return false;
  }
}

/** Check if Docker daemon is available. */
function isDockerRunning(): boolean {
  try {
    execSync("docker info", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

/** Start Redis via docker compose and wait until it accepts connections. */
function startRedis() {
  console.log("[global-setup] Test Redis not running — starting via docker compose...");
  execSync("docker compose up -d redis-test", { stdio: "pipe" });

  // Wait up to 30s for Redis to be ready
  for (let i = 0; i < 30; i++) {
    try {
      execSync("docker compose exec redis-test redis-cli ping", { stdio: "pipe" });
      console.log("[global-setup] Test Redis is ready");
      return;
    } catch {
      execSync("sleep 1", { stdio: "pipe" });
    }
  }
  throw new Error("Test Redis failed to start within 30 seconds");
}

export async function setup() {
  // --- Redis ---
  if (await isRedisRunning()) {
    console.log("[global-setup] Test Redis already running");
  } else if (isDockerRunning()) {
    startRedis();
    weStartedRedis = true;
  } else {
    console.warn(
      "[global-setup] Test Redis not running and Docker unavailable — integration tests will be skipped",
    );
  }

  // --- SQLite test DB ---
  execSync(
    `bunx drizzle-kit push --force --dialect sqlite --schema ./src/repos/schema.ts --url "file:${TEST_DB_PATH}"`,
    { stdio: "pipe" },
  );

  const client = createClient({ url: `file:${TEST_DB_PATH}` });
  await client.executeMultiple("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;");
  client.close();
}

/** Remove the test DB and stop Redis if we started it. */
export function teardown() {
  rmSync(TEST_DB_PATH, { force: true });
  rmSync(`${TEST_DB_PATH}-wal`, { force: true });
  rmSync(`${TEST_DB_PATH}-shm`, { force: true });

  if (weStartedRedis) {
    console.log("[global-setup] Stopping test Redis...");
    execSync("docker compose down redis-test", { stdio: "pipe" });
  }
}
