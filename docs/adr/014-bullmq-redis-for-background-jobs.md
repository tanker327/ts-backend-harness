# ADR-014: BullMQ + Redis for Background Jobs

- **Status**: Accepted (backfilled 2026-04-17)
- **Date**: 2026-04-17
- **Enforced by**: `src/config/queue.ts`, `src/services/worker.ts`, `src/worker-entry.ts`, Docker Compose Redis service

## Context

Some work in the app cannot run synchronously inside an HTTP request — e.g., calls to external APIs that take seconds (AI generation via the Anthropic SDK — see ADR-022), scheduled tasks, retries with backoff. The app needs a background job system.

Options:

- **Plain cron + HTTP endpoints** — trivial, no new dependency, but no retries, no concurrency control, no failure dashboard.
- **pg-boss** — Postgres-backed queue. No extra service (reuses existing PG from ADR-009). Good for low volume, but ties queue throughput to DB write performance.
- **Temporal** — workflow engine with durable execution. Powerful but massive for a template — introduces a whole orchestration paradigm.
- **AWS SQS / GCP Tasks** — hosted, reliable, but cloud-specific and breaks the "works locally with Docker Compose" story.
- **BullMQ + Redis** — TypeScript-first, Redis-backed, supports delayed jobs, retries with backoff, concurrency controls, repeatable jobs, and has a good UI (Bull Board). Standard in the Node/TS ecosystem.

The template targets self-hosted with Docker Compose (ADR-021). BullMQ + Redis fits: Redis becomes one more Compose service alongside PostgreSQL.

## Decision

Use **BullMQ** for background job orchestration, backed by **Redis**.

- Queue definitions live in `src/config/queue.ts`
- Worker logic lives in `src/services/worker.ts`
- The worker process is started separately via `src/worker-entry.ts` (`bun run worker`) — not in the HTTP server process
- Redis runs as a Docker Compose service in both dev and test compose files (ADR-021)
- Graceful degradation: if Redis is unavailable at worker startup, the worker logs a clear error instead of crashing (TASK-014)

## Consequences

### Positive
- Durable job queue with retries, delayed jobs, and failure tracking
- Worker process can scale independently of the HTTP server
- Redis is a small, well-understood dependency
- BullMQ's TypeScript types work cleanly with Bun

### Negative
- Adds **Redis as a runtime dependency** — another service to install, deploy, and monitor
- Two process types to run locally (server + worker)
- Failure modes multiply: DB down, Redis down, worker crashed — each needs a story
- Memory-heavy workloads may require Redis tuning (maxmemory-policy)

### Enforcement
- `src/config/queue.ts` is the only queue definition module
- `src/worker-entry.ts` is the only worker bootstrap
- Adding a second queue system (e.g., keeping BullMQ and adding Temporal) is an ADR trigger (ADR-002)
- Removing Redis (going queue-less or moving to pg-boss) is also an ADR trigger
