# ADR-016: Vitest as the Test Runner

- **Status**: Accepted (backfilled 2026-04-17)
- **Date**: 2026-04-17
- **Enforced by**: `package.json` scripts, `vitest.config.ts`, `tests/` convention

## Context

The project targets Bun (ADR-003), which ships with its own test runner (`bun test`). An alternative using Bun's native runner would be the obvious default. But:

- **bun test** — fastest, zero-config, but at decision time its globalSetup / fixture / mocking story was less mature than Vitest's, and its coverage reporter less complete.
- **Jest** — ubiquitous, but slow, and transforms were awkward under Bun.
- **Vitest** — Jest-compatible API, ESM-native, fast, excellent globalSetup hook (used for our test DB lifecycle — see ADR-017, ADR-018), strong coverage reporter (`@vitest/coverage-v8`), actively developed.

A test DB lifecycle (`drizzle-kit push` before all tests, teardown after) needs a reliable pre-test hook. Vitest's `globalSetup` export pattern is well-documented and stable. This pushed the decision.

## Decision

Use **Vitest** as the test runner for all test tiers (unit, integration, e2e, architecture).

- `package.json`: `test: vitest run`, `test:watch: vitest`, `test:coverage: vitest run --coverage`
- `vitest.config.ts` defines `globalSetup: tests/e2e/global-setup.ts` and injects test env via `test.env`
- `@vitest/coverage-v8` provides coverage output

## Consequences

### Positive
- Single runner for every test tier — one command, one config
- `globalSetup` makes the test DB lifecycle (ADR-017, ADR-018) trivial
- Jest-compatible API means contributors can onboard fast
- Fast under Bun despite not being Bun-native

### Negative
- Runs on Bun but is not Bun-native — marginally slower than `bun test` would be
- If Vitest and Bun's test runner diverge, migration becomes sticky

### Enforcement
- `bun run test` must succeed before a task is considered complete (Stop Hook — ADR-001)
- Adding a second test runner is an ADR trigger (ADR-002)
