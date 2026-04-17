# ADR-005: Six-Layer Architecture with One-Way Imports

- **Status**: Accepted (backfilled 2026-04-17; architecture established in ADR-001; revised 2026-04-17 to place `providers/` below `services/`)
- **Date**: 2026-04-17
- **Enforced by**: `tests/architecture/layer-deps.test.ts` (structural test), CLAUDE.md, code review

## Context

ADR-001 lists "Six-layer architecture" as one of the harness decisions but does not specify the layers, the import direction rule, or how it's enforced. This ADR formalizes the rule as a first-class architectural contract.

Without a formal layer rule, large backends devolve into circular imports (routes → services → routes), business logic in route handlers, and DB calls from controllers — all of which make refactoring, testing, and onboarding harder.

## Decision

The codebase is divided into six top-level directories in `src/`, grouped into five dependency tiers. `repos/` and `providers/` sit at the same tier — both are integrations with external systems (the DB vs. third-party SDKs) and services orchestrate both.

Tiers (low → high):

1. **types/** — schemas and shared type definitions (Zod schemas, TypeScript types)
2. **config/** — environment loading (ADR-008), DB/queue clients, logger instance
3. **repos/** — data access; the only layer allowed to touch the database (ADR-011)
3. **providers/** — external integrations (auth, logger, AI SDK); wraps third-party APIs so they are swappable (ADR-022)
4. **services/** — business logic; orchestrates repos and providers
5. **routes/** — HTTP handlers; thin wrappers that validate input, call services, return responses

### Import direction rule

A layer may only import from layers at a **lower** tier:

```
types → config → (repos | providers) → services → routes
```

- `routes` may import from any lower tier
- `services` may import from repos, providers, config, types
- `types` may import nothing from this list
- Circular imports are forbidden

### Peer-tier exception: providers → repos

`repos/` and `providers/` share tier 3, so same-tier imports between them must be addressed explicitly:

- **Allowed**: `providers/` may import from `repos/` (e.g., `providers/auth.ts` uses the Drizzle schema from `repos/schema.ts` for the better-auth adapter).
- **Forbidden**: `repos/` may **not** import from `providers/`. Repos are a pure data-access layer; introducing provider dependencies would break that guarantee. If a repo ever needs a provider (e.g., structured logging in data access), that is an ADR trigger, not a silent relaxation.

### Enforcement

A structural test at `tests/architecture/layer-deps.test.ts` walks the import graph and fails CI if the rule is violated, including same-tier imports that are not on the explicit allowlist. Adding a new top-level `src/` directory is itself an ADR trigger (see ADR-002).

## Revision 2026-04-17

The original layer list placed `providers/` above `services/`, which contradicted both this ADR's own prose ("services orchestrates repos and providers") and ADR-022 (services call provider wrappers, never the vendor SDK directly). The import-direction rule as encoded forbade services from importing providers, making ADR-022 impossible to satisfy.

The fix: place `providers/` at the same tier as `repos/` (both are external-system integrations) and let `services/` orchestrate both. This matches the intended semantics and unblocks ADR-022.

## Consequences

### Positive
- Testable in isolation: each layer can be unit-tested by mocking its dependencies
- Clear ownership of responsibilities — prevents business logic in route handlers
- Mechanical enforcement catches violations before review
- Services are now the true orchestration layer, matching ADR-022

### Negative
- Requires discipline to keep thin wrappers at the `routes/` layer instead of embedding logic
- Peer-tier exception (`providers → repos`) needs explicit handling in the structural test; future peer exceptions must go through an ADR

### Enforcement
- `tests/architecture/layer-deps.test.ts` — fails if any import violates the direction rule or the same-tier allowlist
- CLAUDE.md lists the layer order and the rule
- ADR-002 requires an ADR before adding a new layer or changing the rule
