# ADR-007: Contract-First API with Zod + @hono/zod-openapi

- **Status**: Accepted (backfilled 2026-04-17)
- **Date**: 2026-04-17
- **Enforced by**: `@hono/zod-openapi` `OpenAPIHono` app, `@hono/swagger-ui`, convention in `src/routes/`

## Context

An HTTP API has three artifacts that must agree: the request/response validation logic, the TypeScript types handlers rely on, and the OpenAPI documentation that clients consume. Keeping them in sync by hand is a recurring source of drift — validators forget to check a field, types allow something the runtime rejects, or docs describe a response that doesn't exist.

## Decision

Use **Zod** as the single source of truth for:

1. Runtime request validation (body, params, query)
2. TypeScript types (derived via `z.infer`)
3. OpenAPI documentation (emitted by `@hono/zod-openapi`)

Every route is defined with `createRoute()` from `@hono/zod-openapi`. Schemas live in `src/types/`. Swagger UI is served from a documented path via `@hono/swagger-ui`.

## Consequences

### Positive
- One schema change updates validation, types, and docs atomically
- Clients and server can never disagree about the contract
- OpenAPI spec is always accurate — no maintenance burden
- Strong type inference for handlers: the request object's types are derived from the schema

### Negative
- Slightly more ceremony to define a route (must write a schema first)
- Complex response shapes (unions, conditional returns) require careful schema composition

### Enforcement
- Route handlers in `src/routes/` use `OpenAPIHono` and `createRoute`, not plain Hono routes
- Schemas live in `src/types/` and are imported by both routes and repos/services as needed
- Adding a new validation or documentation library is an ADR trigger (see ADR-002)
