# ADR-018: Test Pyramid — Unit / Integration / E2E / Architecture

- **Status**: Accepted (backfilled 2026-04-17)
- **Date**: 2026-04-17
- **Enforced by**: `tests/` directory convention, `vitest.config.ts`, `docker-compose.test.yml`

## Context

Tests at different boundaries have different costs and catch different bugs. Without explicit tiers, everything becomes "a test" — slow, fragile, and unclear what a failure means.

## Decision

Four test tiers, each in its own directory under `tests/`:

### 1. `tests/unit/`
- Scope: single module, no DB, no network, no filesystem
- Mocks the module's collaborators
- Fast (<100ms per test), runs on every pre-commit

### 2. `tests/integration/`
- Scope: multiple modules with real collaborators (real DB, real queue)
- Uses the test PostgreSQL on port **5433** from `docker-compose.test.yml` (ADR-021)
- Seeds and tears down state per test or per file
- Slower (hundreds of ms), still runs locally

### 3. `tests/e2e/`
- Scope: full HTTP stack via `app.request()` (ADR-017) — no real network
- Hits the test DB
- Validates request → response contracts end-to-end
- Shares `tests/e2e/global-setup.ts` for DB lifecycle

### 4. `tests/architecture/`
- Scope: structural invariants of the codebase
- Enforces the six-layer import rule (ADR-005)
- Runs like a unit test but fails on architectural drift

### Test DB lifecycle

`vitest.config.ts` runs `tests/e2e/global-setup.ts` once per test run. It executes `drizzle-kit push` against the test DB (port 5433), then tears it down after all tests. Unit tests never touch a DB.

## Consequences

### Positive
- Each tier catches a different class of bug
- Architecture tier makes "no route touches the DB directly" (ADR-011) automatic
- Test DB on a separate port (5433) prevents accidental clobber of dev data
- Contributors know where to put a new test

### Negative
- Four directories instead of one — slightly more setup
- Integration and e2e require Docker running

### Enforcement
- `tests/` is organized by tier, not by feature
- `vitest.config.ts` is the single config
- Adding a new test tier (e.g., `tests/performance/`) is an ADR trigger (ADR-002)
