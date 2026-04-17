# ADR-029: Test DB + Redis Lifecycle via Vitest globalSetup

- **Status**: Accepted (backfilled 2026-04-17)
- **Date**: 2026-04-17
- **Enforced by**: `tests/e2e/global-setup.ts`, `vitest.config.ts`, `docker-compose.test.yml`

## Context

Integration and e2e tests depend on a live PostgreSQL and Redis (ADR-009, ADR-014). Contributors running `bun run test` should not have to manually:

1. Start the test PG container
2. Start the test Redis container
3. Push the Drizzle schema to the test DB
4. Tear them down afterwards

If any of these steps is manual, the test suite is fragile on first-run, in CI, and between contributors' machines. A globalSetup hook (ADR-016) can automate the lifecycle so `bun run test` "just works."

## Decision

`tests/e2e/global-setup.ts` runs once before all test files and handles the full lifecycle:

1. **Check if test Redis is already running on port 6380** (ADR-021). If yes, reuse it. If not and Docker is available, start `redis-test` via `docker compose -f docker-compose.test.yml up -d`. If Docker is unavailable, log a warning and let integration tests skip.
2. **Check if test PostgreSQL is already running on port 5433.** Same reuse / start / warn pattern.
3. **Push the Drizzle schema to the test DB** via `drizzle-kit push --force`. This is faster than `generate + migrate` and safe because the test DB has no data worth preserving (see ADR-028 for why production uses generate-then-migrate).

A teardown hook stops only the containers the setup started (tracked via `weStartedRedis` / `weStartedPostgres` flags). If the contributor already had the containers running, setup reuses them and teardown leaves them alone.

## Consequences

### Positive
- `bun run test` works on first run with only `docker` installed — no manual `docker compose up` needed
- Idempotent: reuses already-running containers; does not over-start
- Respects contributor intent: only stops containers setup started
- Schema is always in sync with the test DB before any test runs
- Works identically in CI and locally (GitHub Actions supports `docker compose`)

### Negative
- First-run of tests is slow when Docker has to cold-start PG + Redis (~5–15s)
- If Docker is unavailable, failures are graceful but partial — integration tests will skip or fail
- `drizzle-kit push --force` is destructive for the test DB — but that is the intent

### Enforcement
- `vitest.config.ts` registers `globalSetup: ["tests/e2e/global-setup.ts"]`
- ADR-028 explicitly calls out the `push --force` exception for the test DB
- Changing the test lifecycle (e.g., introducing a new service dependency) is an ADR trigger (ADR-002)
