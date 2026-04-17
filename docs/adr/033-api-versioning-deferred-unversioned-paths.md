# ADR-033: API Versioning Deferred — Unversioned Paths for v0

- **Status**: Accepted
- **Date**: 2026-04-17
- **Enforced by**: Route registration in `src/routes/index.ts`; this ADR

## Context

The API currently exposes routes at unversioned paths (`/health`, `/author-accounts`, `/contents`, `/api/auth/**`). There is no `/v1` prefix, no version header, and no negotiation. The OpenAPI spec reports `info.version: "0.1.0"` (document version, not route version).

For a pre-1.0 template with no external paying consumers and a single generated client (hey-api, ADR-007), path versioning would be ceremony without benefit: every breaking change today is coordinated in one PR across server + generated client. Premature versioning would lock in an early URL shape we may want to reshape.

## Decision

Do **not** prefix routes with a version segment at this time. Handle breakage via:

- **Tolerant additions** — adding optional request fields and new response fields is non-breaking when consumers use the generated client (they ignore unknown fields).
- **Coordinated breaking changes** — breaking changes regenerate the hey-api client in the same PR cycle. Because all consumers live in repos under the same team, this is feasible.
- **Document version in OpenAPI** — bump `info.version` on breaking changes so the spec itself records the cutover point.

Adopt URL versioning (`/v1/...`) when **any one** of the following becomes true:

1. An external / untrusted consumer depends on the API (not just repo-local hey-api clients).
2. A breaking change needs to land before all consumers can be updated in lockstep.
3. Two incompatible versions must serve traffic simultaneously.

When that day comes, prefix new routes with `/v1` first (documenting the implicit pre-versioning era as v0), and add a follow-up ADR describing deprecation windows and sunset policy.

## Consequences

### Positive
- Zero versioning overhead while the API is small and consumers are colocated.
- Freedom to reshape URLs before they're frozen by external dependents.
- Clear trigger conditions mean the decision to add versioning is mechanical, not political.

### Negative
- If an external consumer appears suddenly (e.g., a partner integration), we must version retroactively — every current path becomes the "v0 legacy" set.
- New contributors may assume versioning exists because it's industry-standard and be surprised by unversioned paths.

### Enforcement
- `src/routes/index.ts` registers routes at root paths — no `basePath('/v1')` call today.
- Introducing version prefixes is an ADR trigger (ADR-002 — new cross-cutting pattern) and supersedes this ADR.
- Code review: a PR that adds a version prefix to some routes but not others must be rejected or must supersede this ADR.
