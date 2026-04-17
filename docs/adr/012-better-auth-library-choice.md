# ADR-012: better-auth as the Authentication Library

- **Status**: Accepted (backfilled 2026-04-17)
- **Date**: 2026-04-17
- **Enforced by**: `package.json`, `src/providers/auth.ts`, convention

## Context

The app needs authentication with session management, JWT issuance, and a clean integration path for Drizzle-backed user storage. Options considered:

- **Custom JWT** — roll your own signup/login/password-hashing/session flow. Full control, but reinvents wheels and is a common source of security bugs.
- **Lucia** — small, database-agnostic, TypeScript-first. Mature, but at decision time its v3 rewrite was in progress and the adapter story was shifting.
- **Clerk / Auth0 / hosted auth** — fastest to integrate, but introduces a hosted third-party dependency, per-MAU cost, and vendor lock-in. Overkill for a self-hosted template.
- **better-auth** — TypeScript-first, self-hosted, first-class Drizzle adapter, session + JWT support, plugin architecture for OAuth/2FA/magic links, actively developed.

The template must be self-hosted (no required third-party auth service) and work cleanly with the Drizzle schema (ADR-010). better-auth matches both.

## Decision

Use **better-auth** as the authentication library. It lives in the providers layer (`src/providers/auth.ts`) and is the only module that issues or validates sessions.

- User / session / account tables are managed by better-auth's Drizzle adapter
- JWT payloads include `userId`, consumed by route middleware
- ADR-013 governs how `userId` is extracted and scoped in queries — it depends on better-auth's JWT output

## Consequences

### Positive
- Self-hosted — no per-user cost, no external dependency at runtime
- Drizzle adapter keeps schema in one place
- TypeScript-first; types flow into route handlers via `c.get('jwtPayload')`
- Plugin model allows incremental addition of OAuth, 2FA, magic links without switching libraries

### Negative
- Younger library than Lucia or custom rolled JWT stacks — fewer production war stories
- Schema changes in better-auth releases may require migration adjustments
- Less community content than hosted alternatives

### Enforcement
- `src/providers/auth.ts` is the only import boundary for better-auth
- Swapping auth libraries or adding a second one is an ADR trigger (ADR-002)
- ADR-013 depends on this choice: `userId` comes from the JWT payload better-auth produces
