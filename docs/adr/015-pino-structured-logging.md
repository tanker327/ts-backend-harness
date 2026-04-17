# ADR-015: Pino + hono-pino for Structured Logging

- **Status**: Accepted (backfilled 2026-04-17)
- **Date**: 2026-04-17
- **Enforced by**: `package.json`, `src/providers/logger.ts`, Hono middleware in `src/index.ts`

## Context

The app needs structured logging that:

- Emits JSON in production (machine-parseable, fits any log aggregator)
- Stays human-readable in dev (`pino-pretty`)
- Integrates with Hono to log each HTTP request with a request ID, duration, and status
- Has low overhead (logging a hot path should not dominate CPU)

Candidates:

- **console.log** — trivial, no structure, no levels, no ship-to-aggregator story.
- **Winston** — popular, feature-rich, but heavier and slower than pino.
- **Pino** — fastest JSON logger in the Node/TS ecosystem, transport-based architecture, battle-tested in high-throughput services.
- **hono-pino** — Hono middleware wrapping pino for request-scoped logs.

## Decision

Use **pino** as the base logger with **pino-pretty** for dev output and **hono-pino** as request middleware.

- The logger instance lives in `src/providers/logger.ts` (providers layer — swappable)
- In dev: `pino-pretty` transport formats output for terminals
- In prod: raw JSON to stdout; log aggregator ingests
- Every HTTP request is logged with method, path, status, duration, and a request ID
- Log levels follow the standard (fatal, error, warn, info, debug, trace); default `info`

## Consequences

### Positive
- Structured logs are searchable / filterable in any aggregator (Loki, Datadog, CloudWatch)
- Low overhead — suitable for hot paths
- Dev experience matches prod semantics (same fields, different rendering)
- Request IDs allow tracing a single request across services/logs

### Negative
- JSON logs are less readable raw — requires `pino-pretty` or an aggregator to be useful
- Adds two deps (`pino`, `pino-pretty`, `hono-pino`)

### Enforcement
- `src/providers/logger.ts` is the single logger instance; all layers import from there
- No direct `console.log` / `console.error` in `src/` — code review enforces
- Swapping logger libraries is an ADR trigger (ADR-002)
