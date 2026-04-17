# ADR-009: PostgreSQL as the Primary Database

- **Status**: Accepted (supersedes the SQLite/LibSQL/Turso choice implied by ADR-001; migration event recorded in ADR-025)
- **Date**: 2026-04-17
- **Enforced by**: `src/config/db.ts`, `drizzle.config.ts` (`dialect: "postgresql"`), `docker-compose.yml`, `docker-compose.test.yml`

## Context

The project originally used SQLite via LibSQL/Turso (as referenced in ADR-001's tech stack). That choice was revisited because:

- SQLite serializes writes — concurrent requests block each other
- SQLite lacks native `timestamp with time zone` and `boolean` columns (stored as integers/text)
- Multi-instance deployments behind a load balancer require a shared DB, which SQLite does not support

This ADR records the current-state decision: **PostgreSQL is the database.** The one-time migration from SQLite to PG is documented separately as a historical event in ADR-025.

Alternatives reconsidered:
- **MySQL** — mature, but PG's richer type system (JSONB, arrays, full-text search), stricter SQL, and better ORM support tipped the scale
- **SQLite (keep)** — ruled out for the concurrency and multi-instance reasons above
- **Serverless SQL (Neon, PlanetScale, Turso)** — viable for production, but the template targets local Docker-based dev; any serverless target is compatible with a standard PG driver

## Decision

Use **PostgreSQL** as the database for all environments:

- Driver: `postgres-js` (fast, TypeScript-first, used by Drizzle's PG adapter)
- Local dev: Docker Compose service on port **5432**
- Local test: separate Docker Compose service on port **5433** (see ADR-021 for the compose-split rationale)
- Schema: Drizzle `pgTable` with native `timestamp with time zone` and `boolean` columns

## Consequences

### Positive
- True concurrent read/write support
- Native `timestamptz`, `boolean`, `jsonb`, array, and full-text search columns
- Production-ready: compatible with any hosted Postgres (RDS, Supabase, Neon, etc.)
- Clean separation of dev and test DBs via port + compose file split

### Negative
- Developers need Docker installed to run the database locally
- Marginally heavier local setup than a single SQLite file
- Requires running `bunx drizzle-kit generate && bunx drizzle-kit migrate` for schema changes

### Enforcement
- `drizzle.config.ts` sets `dialect: "postgresql"`
- Schema files import exclusively from `drizzle-orm/pg-core`
- Any DB driver or dialect change is an ADR trigger (ADR-002)
