# ADR-037: Pagination Deferred — Unpaged List Endpoints for Now

- **Status**: Accepted
- **Date**: 2026-04-17
- **Enforced by**: Route shapes in `src/routes/contents.ts`, `src/routes/author-accounts.ts`; this ADR

## Context

Current list endpoints (`GET /contents`, `GET /author-accounts`) return the full filtered result set as a plain JSON array. They accept filter query parameters (platform, status, content_type, author_account_id) but no `limit`, `offset`, `cursor`, or `page`. The OpenAPI spec reflects this — responses are `z.array(schema)`.

For the current dataset sizes (hundreds of rows in dev, single-user test fixtures) this is fine. But the moment the DB holds tens of thousands of rows — or the moment a consumer depends on stable ordering across calls — unpaged responses become a problem: response size explodes, queries slow, and an accidental `LIMIT 10000` stays missing.

Picking a pagination shape prematurely would lock in an early contract. Offset pagination is simpler but incorrect under concurrent inserts. Cursor pagination is correct but requires a stable sort key baked into every list route. Choosing wrong and then migrating generated clients (ADR-007) is expensive.

## Decision

Do **not** add pagination parameters to list endpoints at this time. Responses remain unwrapped arrays.

Adopt pagination **before** any of the following:

1. A list query can return more than ~500 rows in realistic dev data.
2. A consumer of the API needs to display paged results to a user.
3. A table backing a list route crosses ~10k rows in any environment.

When adopted, follow this shape (documented here so it is decided once, not per-endpoint):

- **Cursor-based**, using the table's primary key (ULID-ordered) as the cursor. Offset pagination is not adopted — it is incorrect under concurrent writes.
- Request: `?limit=<int, default 50, max 200>&cursor=<opaque string>`
- Response envelope: `{ "items": [...], "next_cursor": "..." | null }`
- Cursors are opaque base64 strings — never raw IDs — so the encoding can evolve.
- Apply to **all** list routes at the same time, not piecemeal.

Rolling this out is a breaking change for generated clients. Bundle it with an API version bump (ADR-033) if external consumers exist by then.

## Consequences

### Positive
- Current routes stay minimal — no speculative envelope around small arrays.
- A single future ADR (or this one, superseded) defines the shape for every list route at once — avoids per-endpoint divergence.
- Cursor-first decision is made now, before muscle memory picks offset.

### Negative
- Rolling out paging later is disruptive: response shape changes from `T[]` to `{ items: T[], next_cursor: ... }`, affecting every client.
- If a dataset grows past the threshold before anyone notices, the endpoint degrades silently until someone hits a timeout.

### Enforcement
- Code review rejects new list routes that add `limit`/`cursor` in isolation without either (a) applying the shape universally via this ADR's supersession, or (b) justifying divergence in a new ADR.
- Introducing pagination is an ADR trigger (ADR-002 — cross-cutting pattern) and supersedes this ADR with a follow-up describing the universal rollout.
