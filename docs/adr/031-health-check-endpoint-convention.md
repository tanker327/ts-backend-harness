# ADR-031: Health Check Endpoint Convention

- **Status**: Accepted
- **Date**: 2026-04-17
- **Enforced by**: `src/routes/health.ts`, e2e test at `tests/e2e/health.test.ts`, code review

## Context

Load balancers, container orchestrators, and uptime monitors all need a consistent, cheap-to-call endpoint to determine whether the service is alive. Without a convention, each consumer invents its own probe path, some check downstream dependencies (DB, Redis) and some don't, and failures cascade unpredictably (a slow DB causes the LB to mark the app unhealthy and pull it out of rotation even though it could still serve cached reads).

This ADR fixes the shape and semantics of the health endpoint.

## Decision

- Path: `GET /health` — unauthenticated, unversioned, always available.
- Response body: `{ "status": "ok" }` with HTTP 200 on success.
- Response schema declared via `@hono/zod-openapi` so it appears in the generated spec under the `System` tag (ADR-007).
- **Liveness only** — the endpoint does not probe the database, Redis, or any downstream. It confirms the process is accepting HTTP traffic.
- Readiness / dependency checks (DB reachable, Redis reachable, migrations applied) are out of scope for this endpoint. If needed later, add `GET /ready` as a separate route.

## Consequences

### Positive
- Zero-dependency probe never flaps due to transient downstream issues.
- Consistent shape across environments; OpenAPI spec documents it for clients and monitoring config.
- Cheap enough for sub-second LB probes without rate concerns.

### Negative
- Does not detect "app is running but DB is dead" — a split-brain state. Operators needing that guarantee must add `/ready` or scrape metrics.
- Fixed response shape means a future richer health protocol (e.g., multi-component status) would be a breaking change for existing consumers.

### Enforcement
- `src/routes/health.ts` owns the implementation — single file, single route.
- `tests/e2e/health.test.ts` asserts shape and status code.
- Adding probes that touch runtime dependencies (DB/Redis/etc.) is an ADR trigger (ADR-002 — "changing a cross-cutting pattern") and should introduce `/ready` rather than mutating `/health`.
