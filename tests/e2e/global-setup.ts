/**
 * Vitest global setup/teardown for e2e tests.
 *
 * Runs once before all test files:
 * - Ensures Redis is running (starts via docker compose if needed)
 * - Ensures PostgreSQL test container is running
 * - Pushes Drizzle schema to the test database
 *
 * Runs once after all test files:
 * - Stops containers if we started them
 */
import { execSync } from "node:child_process";
import IORedis from "ioredis";

const TEST_REDIS_PORT = 6380;
const TEST_PG_PORT = 5433;
let weStartedRedis = false;
let weStartedPostgres = false;

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

/** Check if the test PostgreSQL is reachable on localhost:5433. */
function isPostgresRunning(): boolean {
  try {
    execSync(`docker compose exec postgres-test pg_isready -U postgres`, { stdio: "pipe" });
    return true;
  } catch {
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

/** Start PostgreSQL test container via docker compose and wait until it accepts connections. */
function startPostgres() {
  console.log("[global-setup] Test PostgreSQL not running — starting via docker compose...");
  execSync("docker compose up -d postgres-test", { stdio: "pipe" });

  // Wait up to 30s for PostgreSQL to be ready
  for (let i = 0; i < 30; i++) {
    try {
      execSync("docker compose exec postgres-test pg_isready -U postgres", { stdio: "pipe" });
      console.log("[global-setup] Test PostgreSQL is ready");
      return;
    } catch {
      execSync("sleep 1", { stdio: "pipe" });
    }
  }
  throw new Error("Test PostgreSQL failed to start within 30 seconds");
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

  // --- PostgreSQL ---
  if (isPostgresRunning()) {
    console.log("[global-setup] Test PostgreSQL already running");
  } else if (isDockerRunning()) {
    startPostgres();
    weStartedPostgres = true;
  } else {
    console.warn(
      "[global-setup] Test PostgreSQL not running and Docker unavailable — database tests will fail",
    );
  }

  // --- Push schema to test DB ---
  execSync(
    `bunx drizzle-kit push --force --dialect postgresql --schema ./src/repos/schema.ts --url "postgresql://postgres:postgres@localhost:${TEST_PG_PORT}/test"`,
    { stdio: "pipe" },
  );
}

/** Stop containers if we started them. */
export function teardown() {
  if (weStartedPostgres) {
    console.log("[global-setup] Stopping test PostgreSQL...");
    execSync("docker compose down postgres-test", { stdio: "pipe" });
  }

  if (weStartedRedis) {
    console.log("[global-setup] Stopping test Redis...");
    execSync("docker compose down redis-test", { stdio: "pipe" });
  }
}
