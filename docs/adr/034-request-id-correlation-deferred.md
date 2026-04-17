# ADR-034: Request ID / Correlation ID Deferred

- **Status**: Accepted
- **Date**: 2026-04-17
- **Enforced by**: Absence of request-ID middleware in `src/index.ts`; this ADR

## Context

Structured logging is in place via hono-pino (ADR-015), but log lines are not currently threaded with a request-scoped correlation ID. Each request's log line stands alone — there is no way to collect every log produced during a single request, and no way to correlate an HTTP request with the BullMQ job it may enqueue (ADR-014).

Adding a correlation ID has two parts:

1. **Generation / ingestion** — accept `x-request-id` from the caller if trusted, otherwise generate a ULID/UUID at request entry.
2. **Propagation** — attach to the Pino logger for that request, attach to outbound calls (DB query tags, BullMQ job payloads, AI provider metadata per ADR-022), and echo back in the response headers.

Done well, this unlocks trace-style debugging. Done poorly (global mutable state, partial propagation), it's a liability.

## Decision

Do **not** implement request ID / correlation propagation at this time.

Adopt it when **any one** of the following becomes true:

1. The first multi-service call chain exists (HTTP → worker → HTTP, or HTTP → external API → callback) and debugging requires stitching logs together.
2. Log volume grows past the point where manual correlation via timestamp and path is practical.
3. An external SLA / incident-response requirement (e.g., operator hands a correlation ID to support) makes it mandatory.

When adopted, the implementation should:

- Use a Hono middleware registered **before** `honoLogger()` that reads `x-request-id` or generates one.
- Attach the ID to `c.get('logger')` via a child logger, not a global.
- Propagate into BullMQ jobs by adding the ID to the job `data` payload at enqueue time and binding it to the worker's logger when processing.
- Echo the ID back in the response's `x-request-id` header.

## Consequences

### Positive
- No premature middleware that may need to be reworked when the first real multi-hop case appears.
- Pino setup stays minimal; adding correlation later is additive, not a rewrite.
- Documented trigger conditions prevent ad-hoc adoption.

### Negative
- Debugging a production issue today requires grepping by timestamp and path — tractable now, painful later.
- Worker logs cannot be stitched to the originating HTTP request.

### Enforcement
- Introducing request-ID middleware is an ADR trigger (ADR-002 — new cross-cutting pattern) and supersedes this ADR.
- Code review: a PR that adds request-ID handling must either supersede this ADR or be rejected.
