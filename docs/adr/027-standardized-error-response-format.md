# ADR-027: Standardized API Error Response Format

- **Status**: Accepted (backfilled 2026-04-17)
- **Date**: 2026-04-17
- **Enforced by**: `.claude/rules/api-design.md`, code review, route schema definitions in `src/routes/`

## Context

API clients need to distinguish error kinds programmatically (e.g., "this email is already taken" vs. "the server is on fire") and render a user-facing message without hand-parsing strings. If every route invents its own error shape, the client has to branch per endpoint and error handling grows linearly with API surface.

`.claude/rules/api-design.md` already names the format as a rule but no ADR captures the decision. This backfill fills that gap.

## Decision

Every API error response follows this JSON shape:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description."
  }
}
```

- `code` — stable machine-readable identifier in `SCREAMING_SNAKE_CASE` (e.g., `EMAIL_EXISTS`, `NOT_FOUND`, `UNAUTHORIZED`). Clients branch on this, never on `message`.
- `message` — human-readable text safe to surface to the user.
- HTTP status code conveys the class of error (4xx client, 5xx server); `code` conveys the specific reason.

Route schemas in `src/routes/` declare this shape via `@hono/zod-openapi` so the OpenAPI spec reflects it (ADR-007). Ownership leaks return **404 with `NOT_FOUND`**, never 403 (see ADR-013).

## Consequences

### Positive
- One error-handling path on every client — no per-endpoint branching
- OpenAPI spec includes consistent error schemas for generated client code
- Stable `code` values survive message wording changes
- The 404-not-403 ownership rule (ADR-013) fits this format naturally

### Negative
- Adding a new error kind requires minting a new `code` and documenting it in the schema
- Validation errors from Zod/@hono/zod-openapi arrive in a library-specific shape — routes must translate them to this format when returning to the client

### Enforcement
- `.claude/rules/api-design.md` states the rule
- `@hono/zod-openapi` response schemas declare the shape — OpenAPI spec drift would be visible
- Changing the error format is an ADR trigger (ADR-002 — "changing a cross-cutting pattern")
