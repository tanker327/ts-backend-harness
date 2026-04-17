# ADR-025: Migrate SQLite to PostgreSQL

- **Status**: Accepted
- **Date**: 2026-04-06
- **Enforced by**: drizzle config dialect, schema imports, Docker services

## Context

SQLite cannot handle concurrent writes well, lacks native timestamp and boolean
types, and is not suitable for production multi-instance deployments. As the
application grows, we need a database engine that supports true concurrent access
and richer column types out of the box.

## Decision

Migrate from SQLite (via LibSQL/Turso) to PostgreSQL with the postgres-js driver.
Use native PG types — `timestamp with time zone` for all temporal columns and
`boolean` for flag columns. Development and test environments run PostgreSQL via
Docker Compose.

## Consequences

### Positive

- True concurrent read/write support without WAL hacks or busy timeouts
- Native `timestamptz` and `boolean` columns — no more integer-encoded timestamps
- Production-ready: supports multi-instance deployments behind a load balancer
- Richer query capabilities (JSONB, array types, full-text search) available for
  future features

### Negative

- Developers must have Docker installed to run the database locally
- Slightly more complex local setup compared to a single SQLite file
- Existing data in SQLite databases must be manually migrated (one-time cost)

### Enforcement

- `drizzle.config.ts` dialect set to `"postgresql"`
- Schema imports from `drizzle-orm/pg-core` (architectural tests can verify)
- Docker Compose provides `postgres` and `postgres-test` services
