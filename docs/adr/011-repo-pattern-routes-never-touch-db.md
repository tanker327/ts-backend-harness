# ADR-011: Repo Pattern — Route Handlers Never Touch the Database Directly (Specialization of ADR-005)

- **Status**: Accepted (backfilled 2026-04-17)
- **Date**: 2026-04-17
- **Enforced by**: `tests/architecture/layer-deps.test.ts` (via ADR-005 import rule), `.claude/rules/database.md`, code review

## Context

This ADR **specializes ADR-005** (six-layer architecture) with a specific rule for database access — the most commonly violated invariant in server codebases. ADR-005 defines the import direction; this ADR names the concrete consequence for SQL/ORM access.

When route handlers call the DB directly (via ORM, raw SQL, or a query builder), three problems emerge:

1. **Business logic leaks into HTTP handlers** — ownership scoping, pagination, and invariant checks get scattered across routes.
2. **Unit tests become integration tests** — you cannot test a route without a live DB.
3. **Authorization checks get copy-pasted** — see ADR-013 (userId scoping) for the failure mode this enables.

## Decision

**All database access lives in `src/repos/`.** No other layer imports the Drizzle client or issues queries.

- `src/repos/*.ts` exports functions that take domain arguments (including `userId`) and return domain objects
- `src/services/*.ts` orchestrates repo calls, applies business logic, and is the only caller of repos
- `src/routes/*.ts` validates input, calls services, shapes responses

Raw SQL is permitted inside repo functions when Drizzle's query builder cannot express the query — but never outside `src/repos/`.

## Consequences

### Positive
- Route handlers are thin and predictable — easy to test with a service mock
- Business logic concentrates in services, where it can be unit-tested without a DB
- Ownership scoping (ADR-013) can be enforced in repos with a single audit
- Swapping the ORM affects only `src/repos/` — no ripple through routes or services

### Negative
- Small files can feel over-decomposed — a trivial GET endpoint still goes route → service → repo
- Developers from simpler stacks may find this indirect at first

### Enforcement
- Import rule from ADR-005 forbids `routes/` or `services/` from importing `drizzle-orm` directly
- `.claude/rules/database.md` states the rule explicitly
- Code review flags any Drizzle or SQL import outside `src/repos/`
- Structural test in `tests/architecture/` can be extended to enforce the import pattern mechanically
