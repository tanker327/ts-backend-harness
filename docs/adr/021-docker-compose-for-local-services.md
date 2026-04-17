# ADR-021: Docker Compose for Local Services, with Dev/Test Split

- **Status**: Accepted (backfilled 2026-04-17; split enacted in commit d1214f3)
- **Date**: 2026-04-17
- **Enforced by**: `docker-compose.yml` (dev), `docker-compose.test.yml` (test), README, ADR-009 (PG), ADR-014 (Redis)

## Context

The app depends on two external services at runtime: PostgreSQL (ADR-009) and Redis (ADR-014). Contributors must be able to spin them up locally with zero tribal knowledge.

Two problems to solve:

1. **How to run the services** — Docker Compose is the least-opinionated option. Alternatives: local install of PG + Redis (messy, version-mismatched across machines), devcontainers (heavier), dev scripts like `asdf` or `mise` (still per-service config).
2. **How to keep dev and test DBs isolated** — running tests against the dev DB destroys local data. Running both services in one compose file with one volume means tests and dev fight for the same state.

## Decision

Use **Docker Compose** for all local services. Split dev and test into two files:

### `docker-compose.yml` — dev
- `postgres` on port **5432**
- `redis` on port **6379**
- Volumes persisted for local development data

### `docker-compose.test.yml` — test
- `postgres-test` on port **5433** (separate container, no volume persistence)
- `redis-test` on port **6380** (if needed)
- Ephemeral — cleared between test runs

Contributors run `docker compose up` for dev and `docker compose -f docker-compose.test.yml up` for tests.

## Consequences

### Positive
- Zero-install setup: `docker compose up` is the only command needed
- Dev and test states cannot clobber each other
- Matches production service topology (real PG, real Redis) — unlike in-memory mocks
- Contributors on any OS get identical local services

### Negative
- Docker is a hard dependency for local development
- Two compose files to keep in sync when service versions change
- Test DB requires port 5433 to be free

### Enforcement
- `docker-compose.yml` and `docker-compose.test.yml` at repo root
- Env vars in `.env` / `vitest.config.ts` point to the correct ports (5432 for dev, 5433 for tests)
- Adding a new runtime service (e.g., Elasticsearch) requires an ADR (ADR-002) and an update to both compose files
