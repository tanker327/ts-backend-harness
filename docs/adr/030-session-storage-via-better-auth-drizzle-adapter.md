# ADR-030: Session Storage via better-auth's Drizzle Adapter (PostgreSQL)

- **Status**: Accepted (backfilled 2026-04-17)
- **Date**: 2026-04-17
- **Enforced by**: `src/providers/auth.ts`, `src/repos/schema.ts`, ADR-012 (better-auth)

## Context

better-auth (ADR-012) supports multiple session backends — in-memory, Redis, or the primary database. The choice affects durability, horizontal scalability, and operational complexity.

Candidates:

- **In-memory** — fastest but sessions disappear on restart and cannot be shared across instances. Unacceptable for any multi-instance deployment.
- **Redis** — fast, shared, but introduces a second storage system for identity (Redis is already present for BullMQ via ADR-014, so the dependency is not new — but session data in Redis alone is non-durable if Redis is configured without persistence).
- **Primary database (PostgreSQL) via Drizzle adapter** — durable, transactional, reuses the existing DB (ADR-009). Slightly slower per-session lookup than Redis, but read load is tiny compared to app queries and PG's buffer cache handles it efficiently.

## Decision

Use **better-auth's Drizzle adapter backed by PostgreSQL** for session storage. Configured in `src/providers/auth.ts`:

```ts
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema, usePlural: true }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
});
```

Session, user, account, and verification tables live in the primary PG schema (`src/repos/schema.ts`) alongside domain tables. Migrations for these tables flow through the normal Drizzle workflow (ADR-028).

## Consequences

### Positive
- Sessions survive app restarts and are visible across all app instances
- Transactional consistency with user data — a user + session can be created atomically
- One storage system to back up, monitor, and reason about
- Redis (ADR-014) stays scoped to background jobs — no overloading it with auth state

### Negative
- Every authenticated request performs a session lookup against PG — a cost that Redis-backed sessions would avoid
- Session table grows over time; purging expired sessions becomes an operational task (cron job or DB-side TTL)
- Tightly couples auth availability to PG availability — if PG is down, auth is down (but so is the rest of the app, so the coupling is not unique)

### Enforcement
- `src/providers/auth.ts` is the only place the adapter is configured
- Schema for session tables lives in `src/repos/schema.ts`
- Switching session backends (e.g., to Redis) is an ADR trigger (ADR-002) — it changes a security/identity boundary
