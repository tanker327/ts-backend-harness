# ADR-006: Hono as the Web Framework

- **Status**: Accepted (backfilled 2026-04-17; original adoption at project start, see ADR-001)
- **Date**: 2026-04-17
- **Enforced by**: `package.json` dependency, `src/routes/` structure, `src/index.ts` app bootstrap

## Context

The project needs an HTTP framework. Candidates considered:

- **Express** — de facto standard, huge middleware ecosystem, but callback-style API, no built-in TypeScript-first design, no built-in validation, no OpenAPI integration.
- **Fastify** — faster, schema-based validation (AJV/JSON Schema), mature, but heavier API surface and JSON Schema is awkward next to TypeScript types.
- **Elysia** — Bun-native, end-to-end type safety, but tighter coupling to Bun internals and smaller ecosystem at decision time.
- **Hono** — Web Fetch API-based (`Request`/`Response`), runs on Bun / Node / Deno / edge runtimes, first-class TypeScript, has `@hono/zod-openapi` for contract-first APIs, minimal surface.

The project targets Bun (ADR-003) and wants contract-first Zod-based APIs (ADR-007). Hono is the best fit because it works natively with Bun, integrates cleanly with Zod via `@hono/zod-openapi`, and its Web Fetch request/response model makes in-process e2e tests trivial via `app.request()` (see ADR-017).

## Decision

Use **Hono** as the HTTP framework. All routes live in `src/routes/` and are mounted from `src/index.ts`.

- Route handlers use the `@hono/zod-openapi` `OpenAPIHono` app for schema-first endpoints
- Swagger UI is served via `@hono/swagger-ui`
- Middleware (logging, auth) is mounted globally in `src/index.ts`

## Consequences

### Positive
- Web Fetch API means e2e tests can use `app.request()` without a running server (ADR-017)
- Cross-runtime portability (could deploy to Cloudflare Workers with minimal changes)
- Native Zod integration produces an OpenAPI spec with zero extra work (ADR-007)
- Small learning curve for developers familiar with Express-style routing

### Negative
- Smaller middleware ecosystem than Express
- Some conventions (error handling, request-scoped context) differ from Node norms — contributors may need orientation

### Enforcement
- `src/index.ts` is the single app bootstrap
- `src/routes/` contains all route modules
- Route handlers never import repos directly — they call services (see ADR-005)
