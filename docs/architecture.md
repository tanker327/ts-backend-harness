# Architecture

## Layer Diagram

| # | Layer | Directory | Responsibility | Allowed Dependencies |
|---|---|---|---|---|
| 1 | Types | src/types/ | Zod schemas, TS types, zero runtime | None |
| 2 | Config | src/config/ | Env validation (Zod + dotenv) | Types |
| 3 | Repos | src/repos/ | Data access (Drizzle ORM -> Turso) | Types, Config |
| 4 | Services | src/services/ | Business logic orchestration | Types, Config, Repos |
| 5 | Providers | src/providers/ | Cross-cutting: auth, logging, rate-limit | Types, Config |
| 6 | Routes | src/routes/ | Hono route handlers (hono-zod-openapi) | Types, Config, Services, Providers |

## Dependency Rule

Dependencies MUST flow downward only (lower number -> higher number is forbidden).

Enforced by: `tests/architecture/layer-deps.test.ts`

## Cross-cutting Concerns

Auth (Better Auth), Logging (Pino), Rate Limiting — injected via Providers, not imported directly in Routes.

## Request Flow

```
Request -> CORS -> Rate Limit -> JWT Validation -> Route Handler -> Service -> Repo -> DB
```
