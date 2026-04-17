# ADR-039: Providers Wired as Module Singletons, Not a DI Container

- **Status**: Accepted
- **Date**: 2026-04-17
- **Enforced by**: Current provider files (`src/providers/*.ts`, `src/config/db.ts`, `src/config/queue.ts`), code review

## Context

Long-lived resources — database client, Redis/BullMQ connection, Better Auth instance, Pino logger — are instantiated once per process. Today this is done by module-level side effects:

- `src/config/db.ts` calls `postgres(env.DATABASE_URL)` and `drizzle(client)` at import time, exporting `db`.
- `src/config/queue.ts` defines `redisConnection` and the queue instance at import time.
- `src/providers/logger.ts` calls `pino(...)` at import time, exporting `logger`.
- `src/providers/auth.ts` calls `betterAuth(...)` at import time, exporting `auth`.

Consumers do `import { db } from "../config/db.ts"` (or similar) and get the singleton. There is no inversion-of-control container, no factory function per consumer, and no request-scoped instantiation.

This pattern is idiomatic for Node/Bun server apps at this scale. It also has implications worth naming: module singletons are captured by Vitest test workers, env must be valid before any import of a singleton module (hence `vitest.config.ts` sets `test.env` — ADR-017), and mocking for tests requires Vitest's module mocking rather than constructor injection.

## Decision

Keep module-level singletons as the wiring convention:

1. **One singleton per resource**, instantiated at module load in its owning file (`src/config/db.ts` for `db`, `src/providers/logger.ts` for `logger`, `src/providers/auth.ts` for `auth`, `src/config/queue.ts` for queue/connection).
2. **Consumers import the singleton directly.** No factory-per-consumer, no passing `db` into every service function as a parameter.
3. **Env must be valid before singletons import.** The Zod validation in `src/config/env.ts` (ADR-008) runs at process start; singleton modules importing `env` rely on this. Test env (`vitest.config.ts`) must be set before any singleton module is imported.
4. **Tests mock at the module boundary** using `vi.mock("../../src/providers/...")` — not by injecting mock instances through constructor parameters. Unit tests that mock providers belong to the `tests/unit/services/` tier (ADR-018).
5. **No DI container** (`tsyringe`, `InversifyJS`, `awilix`) is adopted. If one is ever considered, it is an ADR trigger (ADR-002 — new cross-cutting pattern).

Accept the known trade-off: singletons make multi-tenant scenarios with per-tenant resource variants awkward. If that need arises, the right response is a narrow factory (`getDbForTenant(id)`) alongside the current singleton, not a container — and it gets its own ADR.

## Consequences

### Positive
- Zero boilerplate: services and repos just import what they need.
- Startup ordering is dictated by ES module semantics — predictable and fast.
- Tests can mock the exact module path; no framework-specific container lifecycle to learn.

### Negative
- Import-time side effects mean "just importing a file" opens a DB connection. This is why `vitest.config.ts` sets test env before imports.
- Multi-tenant-per-request resource isolation is not expressible without refactoring — intentional today, a future constraint.
- Global mutable state for the Pino logger means tests that modify the logger affect other tests unless isolated.

### Enforcement
- Code review rejects introduction of DI container libraries without a superseding ADR.
- Code review rejects factory-per-consumer patterns for resources that have a natural singleton (e.g., don't pass `db` as a parameter to every repo function; exception: transaction handle `tx` under ADR-035).
- Adding per-request or per-tenant resource scoping is an ADR trigger (ADR-002).
