# Feature: Migrate SQLite to PostgreSQL

**Task**: TASK-015
**ADR**: ADR-007 (to be created)
**Status**: Planned

## Context
Replace SQLite/LibSQL with PostgreSQL. No production data — clean rebuild with PG best practices (native timestamps, `withTimezone`).

## Steps

### 1. ADR (`docs/adr/007-migrate-sqlite-to-postgresql.md`)

### 2. Docker (`docker-compose.yml`)
- `postgres` — dev on port 5432, volume-persisted, health check
- `postgres-test` — test on port 5433, ephemeral, health check

### 3. Dependencies (`package.json`)
- Remove: `@libsql/client`
- Add: `postgres` (postgres-js)

### 4. Schema (`src/repos/schema.ts`)
- `sqliteTable` → `pgTable`, imports from `drizzle-orm/pg-core`
- `integer("x", { mode: "timestamp" })` → `timestamp("x", { withTimezone: true })`
- `integer("x", { mode: "boolean" })` → `boolean("x")`
- `AnySQLiteColumn` → `AnyPgColumn`
- Raw integer timestamps in authorAccounts/contents → `timestamp({ withTimezone: true })`

### 5. DB client (`src/config/db.ts`)
- `postgres` + `drizzle-orm/postgres-js`, remove SQLite pragmas

### 6. Env config (`src/config/env.ts`)
- `DATABASE_URL`: `z.url()` → `z.string()`
- Remove `DATABASE_AUTH_TOKEN`

### 7. Drizzle config (`drizzle.config.ts`)
- `dialect: "postgresql"`, single `{ url }` credentials

### 8. Better Auth (`src/providers/auth.ts`)
- `provider: "sqlite"` → `provider: "pg"`

### 9. Repos (`src/repos/author-accounts.ts`, `src/repos/contents.ts`)
- `now: number` → `now: Date`

### 10. Services (`src/services/author-accounts.ts`, `src/services/contents.ts`)
- `Math.floor(Date.now() / 1000)` → `new Date()`

### 11. Zod types (`src/types/author-account.ts`, `src/types/content.ts`)
- Timestamp fields in response schemas: `z.number().int()` → `z.coerce.date()`
- Timestamp fields in create/update schemas: `z.number().int()` → `z.coerce.date()`

### 12. Migrations (`drizzle/`)
- Delete old SQLite migrations, run `bunx drizzle-kit generate`

### 13. Tests (`tests/e2e/global-setup.ts`, `vitest.config.ts`)
- Push schema to PG test DB instead of SQLite file
- Start postgres-test container alongside redis-test
- `DATABASE_URL: "postgresql://postgres:postgres@localhost:5433/test"`

### 14. Env files (`.env.example`, `.env`)
- `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dev`
- Remove `DATABASE_AUTH_TOKEN`

### 15. Lint + test
- `bunx biome format --write . && bunx biome check .`
- `bun run test`

## Files (18)
| File | Change |
|------|--------|
| `docs/adr/007-migrate-sqlite-to-postgresql.md` | NEW |
| `docker-compose.yml` | Add postgres services |
| `package.json` | Swap deps |
| `src/repos/schema.ts` | pgTable, PG types |
| `src/config/db.ts` | postgres-js client |
| `src/config/env.ts` | Update validation |
| `drizzle.config.ts` | PG dialect |
| `src/providers/auth.ts` | provider: "pg" |
| `src/repos/author-accounts.ts` | now: Date |
| `src/repos/contents.ts` | now: Date |
| `src/services/author-accounts.ts` | new Date() |
| `src/services/contents.ts` | new Date() |
| `src/types/author-account.ts` | Timestamp schemas |
| `src/types/content.ts` | Timestamp schemas |
| `tests/e2e/global-setup.ts` | PG test setup |
| `vitest.config.ts` | PG test URL |
| `.env.example` | PG connection string |
| `.env` | PG connection string |
| `drizzle/` | Delete old, regenerate |
