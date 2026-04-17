# ADR Debt

Tracks architectural decisions that slipped through without an ADR (per ADR-002), and `ADR_SKIP` usages awaiting backfill.

## How to use this file

- When a trigger from ADR-002 fires but an ADR is skipped, add a row here with the commit SHA, the trigger that fired, and the reason for skipping.
- When backfilling, write the ADR dated the day it is written (not the original introduction date) and mark it `Backfilled` in the Status line. Then remove the row from this file and note the ADR number.

## Open debt

_None._ The 2026-04-17 backfill round (ADR-008 through ADR-033) cleared the outstanding gaps identified by `/adr-audit`.

## Resolved debt (for history)

Decisions originally introduced without an ADR, backfilled on 2026-04-17:

| Decision | Backfill ADR |
|---|---|
| Bun as runtime | ADR-003 |
| TypeScript strict mode | ADR-004 |
| Hono as web framework | ADR-006 |
| Contract-first API with Zod + OpenAPI | ADR-007 |
| PostgreSQL as database | ADR-009 |
| Drizzle ORM | ADR-010 |
| Repo pattern (routes never touch DB) | ADR-011 |
| Better Auth library choice | ADR-012 |
| BullMQ + Redis for background jobs | ADR-014 |
| Pino structured logging | ADR-015 |
| Vitest as test runner | ADR-016 |
| Test pyramid and boundaries | ADR-018 |
| Biome for lint and format | ADR-019 |
| Lefthook pre-commit gates | ADR-020 |
| Docker Compose for local services | ADR-021 |
| AI provider isolation | ADR-022 |
| CI pipeline (GitHub Actions) | ADR-026 |
| Standardized error response format | ADR-027 |
| Drizzle migration workflow | ADR-028 |
| Test DB/Redis lifecycle via globalSetup | ADR-029 |
| Session storage via Better Auth Drizzle adapter | ADR-030 |
| Health check endpoint convention | ADR-031 |
| CORS deferred until a browser client exists | ADR-032 |
| API versioning deferred (unversioned paths) | ADR-033 |
