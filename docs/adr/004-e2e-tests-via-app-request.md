# ADR-004: E2E tests via Hono app.request() instead of Hurl

- **Status**: Accepted
- **Date**: 2026-03-29
- **Enforced by**: vitest.config.ts globalSetup, tests/e2e/*.test.ts

## Context

E2E tests were written as Hurl files requiring a running server and the external Hurl binary. This created friction: tests couldn't run in CI without starting the server first, couldn't share test DB setup with unit/integration tests, and couldn't be included in `bun run test`.

Supertest was considered but requires two extra dependencies (`supertest`, `@hono/node-server`) to bridge Hono's Web Fetch API to Node.js HTTP — unnecessary complexity given a simpler alternative exists.

## Decision

Use Hono's built-in `app.request()` for e2e tests:

1. All e2e tests live in `tests/e2e/*.test.ts` as Vitest tests
2. `vitest.config.ts` injects test env vars (DATABASE_URL, secrets) via `test.env` before module singletons initialize
3. `tests/e2e/global-setup.ts` creates a test SQLite DB with `drizzle-kit push` and tears it down after all tests
4. No new dependencies required

## Consequences

### Positive
- All tests (unit, architecture, e2e) run via single `bun run test` command
- Test DB is created and torn down automatically
- No running server needed — tests run in-process
- Full access to Vitest assertions, coverage, and watch mode

### Negative
- Tests run in-process, not over real HTTP — does not test actual network behavior
- If future tests need real HTTP (WebSocket, SSE streaming), will need a `@hono/node-server` bridge

### Enforcement
- `vitest.config.ts` globalSetup ensures test DB lifecycle
- Stop hook runs `bun run test` before Claude can finish a task
