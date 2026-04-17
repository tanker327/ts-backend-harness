# ADR-036: Graceful Shutdown — Worker Handles Signals, HTTP Server Deferred

- **Status**: Accepted
- **Date**: 2026-04-17
- **Enforced by**: `src/worker-entry.ts` (SIGINT/SIGTERM handlers), absence in `src/index.ts`

## Context

The BullMQ worker process (`src/worker-entry.ts`) already listens for `SIGINT` and `SIGTERM`, calls `worker.close()` to drain the current job, and exits zero. This is necessary: if the worker is killed mid-job, BullMQ treats the job as stalled and may duplicate work on retry — a correctness issue, not just a polish issue.

The HTTP server (`src/index.ts`) has **no** shutdown handler. Bun's `export default { fetch }` pattern means the runtime owns the listening socket, and SIGTERM causes an abrupt exit. For a request-idempotent API with no long-lived connections (no SSE, no WebSockets today), this is acceptable — an aborted request is safe to retry — but it is a deliberate choice, not an oversight.

## Decision

**Worker side (already in place)**:
- `src/worker-entry.ts` registers `SIGINT` and `SIGTERM` handlers that call `worker.close()` and `process.exit(0)`.
- The worker is the canonical example of the shutdown pattern. Any new worker process must follow the same shape.

**HTTP server side (deferred)**:
- No shutdown handler is registered in `src/index.ts` at this time.
- All current routes are short-lived JSON request/response. Terminating mid-request is safe because clients retry.
- Add a handler **when any one** of the following becomes true:
  1. A route streams responses (SSE, chunked uploads, long polling) — an abrupt exit visibly breaks clients.
  2. A route performs non-idempotent side effects before responding — a kill mid-handler could double-commit.
  3. The deployment platform adds a drain-phase contract (Kubernetes preStop, ECS task draining) that expects a clean socket close.

When added, the HTTP shutdown should:
- Stop accepting new connections.
- Wait up to N seconds (env-configured) for in-flight requests to finish.
- Close the Pino logger's async destination (prevents log loss).
- Close the DB pool (`client.end()` on the postgres-js client from `src/config/db.ts`).

## Consequences

### Positive
- Worker correctness is protected today (no stalled jobs from SIGTERM).
- HTTP server stays minimal; no speculative shutdown code that might itself have bugs.
- Trigger conditions are explicit — the next engineer adding SSE knows they also own adding shutdown.

### Negative
- Kubernetes-style orchestration will see the HTTP server exit abruptly; short tail-latency requests may return a truncated response to the client and require a retry.
- The DB connection pool is closed by the OS, not the app — mildly ugly in logs but correct (postgres-js will reconnect on next call in a new process).

### Enforcement
- Every new long-running entrypoint (server, worker, scheduler) must register SIGINT/SIGTERM handlers or supersede this ADR.
- Code review rejects PRs that add streaming or non-idempotent writes without either adding HTTP shutdown or superseding this ADR.
- Introducing a shutdown orchestrator (e.g., `close-with-grace`, a shared `registerShutdown()` helper) is an ADR trigger (ADR-002 — new cross-cutting pattern).
