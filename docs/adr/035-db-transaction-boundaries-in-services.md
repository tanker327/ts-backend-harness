# ADR-035: Database Transaction Boundaries Live in the Service Layer

- **Status**: Accepted
- **Date**: 2026-04-17
- **Enforced by**: `.claude/rules/database.md`, code review, repo-layer discipline (ADR-011)

## Context

Current repos (`src/repos/*.ts`) expose single-statement functions — one `insert`, `select`, `update`, or `delete` per call against `db` from `src/config/db.ts` (ADR-010). This works for every endpoint that exists today, because each route performs exactly one write.

But several operations in the near future will require atomicity across multiple writes — e.g., creating a content row plus its initial status history, enqueuing a job after a DB write must succeed or roll back together, or updating a parent/child pair where partial failure corrupts the read model. Without a convention, the first such case will pick an ad-hoc pattern (transactions inside the repo? a new "transaction service"? a route-level transaction?) that the rest of the codebase is then forced to imitate.

## Decision

Transactions are owned by the **service layer** (ADR-005). Concretely:

1. **Repos never open their own transactions.** Each repo function receives a Drizzle "executor" — either the global `db` or a transaction handle `tx` — and runs one statement on it. Repo signatures accept an optional executor argument; when omitted, they fall back to `db`.
2. **Services decide when to wrap.** A service function that needs atomicity calls `db.transaction(async (tx) => { ... })` and threads `tx` into each repo call inside the callback.
3. **Routes never see transactions.** Routes call services; transaction scope is invisible above the service layer.
4. **No nested transactions.** If a service calls another service that also needs atomicity, refactor so the outer service opens the transaction and calls both repos directly, or use savepoints only with explicit justification in an ADR supersession.
5. **Side effects (BullMQ enqueue, external API calls) happen *after* the transaction commits.** Do not enqueue jobs inside `db.transaction` — if the transaction rolls back but the enqueue succeeded, the worker runs against nonexistent state.

## Consequences

### Positive
- The layer that owns the business invariant (service) also owns the atomicity boundary. Repos stay single-purpose.
- The repo-pattern rule (ADR-011) remains clean: routes → services → repos, no DB primitives leak upward.
- Easy to reason about: "where are transactions?" → grep `db.transaction` under `src/services/`.

### Negative
- Repo signatures must accept an optional executor argument once any transactional code exists — a small boilerplate tax on every repo function.
- Contributors must remember to pass `tx` through; forgetting means a statement silently runs outside the transaction. Catch at code review.
- Side-effect-after-commit discipline is a human rule, not mechanically enforceable.

### Enforcement
- `.claude/rules/database.md` carries the "transactions in services, not repos" rule as a near-term amendment.
- Code review rejects `db.transaction` calls outside `src/services/`.
- The first service that needs atomicity is the reference implementation — subsequent services should match its shape.
- Introducing savepoints, long-running transactions, or transaction managers is an ADR trigger (ADR-002 — cross-cutting pattern).
