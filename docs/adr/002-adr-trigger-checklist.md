# ADR-002: ADR Trigger Checklist — When an ADR is Required

- **Status**: Accepted
- **Date**: 2026-04-17
- **Enforced by**: `.claude/rules/adr-required.md` (agent-side), `scripts/check-adr-required.sh` via Lefthook pre-commit (human-side)

## Context

Several architectural decisions were introduced without an ADR (BullMQ + Redis, better-auth, Drizzle, the six-layer architecture itself, Bun, Hono, and more). Their reasoning lives only in people's heads and commit messages. ADR-001 said "use ADRs" but did not define *when* one is required — so "architecturally significant" was judged ad hoc and decisions slipped through.

This ADR closes that gap. It is numbered 002 deliberately: ADR-001 establishes that ADRs are the decision record; ADR-002 establishes the trigger rule that governs every ADR after it. Existing ADRs were renumbered on 2026-04-17 to make space for this one at the top of the decision chain.

## Decision

An ADR **must** be written (and merged in the same PR) before landing any change that meets one of the following triggers.

### Triggers that require an ADR

1. **New runtime service dependency** — daemon, container, or external service the app relies on at runtime (DBs, queues, caches, search, object stores, hosted auth, third-party APIs invoked from server).
2. **New npm dependency that changes the stack's shape** — a library with architectural alternatives worth comparing (ORM, web framework, auth library, logger, queue client, validation library, test runner). Utility libraries with no meaningful alternative (date-fns, uuid, nanoid) do not trigger.
3. **New `src/` top-level directory or layer** — extends the six-layer architecture (ADR-005).
4. **New cross-cutting pattern** — auth strategy, error handling, logging format, request-scoped context, API versioning, caching policy.
5. **Security or data-integrity boundary** — where data lives, who can read it, how identity resolves (e.g., userId source, tenant isolation).
6. **Schema convention that applies to every table** — FK pattern, soft-delete policy, audit columns, timestamp convention.
7. **Testing boundary change** — new test tier, new runner, new CI gate.
8. **Change that requires updating a structural/layer test** — if the architectural invariants change, the decision is architectural by definition.

### Triggers that do *not* require an ADR

- Bug fixes that preserve behavior and contracts
- Refactors within a single layer with unchanged public interface
- New routes / services / endpoints that follow existing patterns
- Dependency version bumps (unless the bump is architecturally breaking)
- Utility npm packages with no alternative worth debating
- Minor tooling tweaks (Biome rule adjustments, test timeout changes)

### Backfill policy

Decisions that slipped through without an ADR are tracked in `progress/adr-debt.md` and backfilled when time allows. Backfill ADRs reflect **actual historical reasoning**, not invented justification. Each backfill is dated on the day it was written and states "Backfilled" explicitly — the reader can then cross-check with git history for the original introduction date.

### Skip policy

A change that meets a trigger may still skip an ADR **only** if explicitly bypassed:

- Human commits: set `ADR_SKIP=1` on the commit and add a one-line reason in the commit body. The skip is logged in `progress/adr-debt.md`.
- Agents: must ask the user before skipping. Never set `ADR_SKIP` silently.

## Consequences

### Positive
- Shared, explicit definition of "architecturally significant" — removes ambiguity.
- Agents have a concrete checklist to run before implementing.
- Mechanical pre-commit gate catches human-initiated dependency additions.
- Backfill debt becomes visible instead of invisible.
- As a template, the repo now demonstrates how the decision chain grows: one meta-decision (001), one governance rule (002), then the stack decisions that follow.

### Negative
- Small friction when adding dependencies — must decide "ADR or skip."
- The trigger list will need revision as the project evolves.
- One-time renumbering of existing ADRs breaks past commit-message references (git commit messages cannot be rewritten; readers of old commits should consult this ADR for the remap).

### Enforcement
- **Agent gate**: `.claude/rules/adr-required.md` loads with other project rules and instructs agents to run the trigger checklist before any change that might qualify.
- **Human gate**: Lefthook `pre-commit` runs `scripts/check-adr-required.sh`, which blocks commits that add entries to `package.json` `dependencies` / `devDependencies` unless (a) a new `docs/adr/*.md` file is staged in the same commit, or (b) `ADR_SKIP=1` is set.
- **Periodic audit**: `/adr-audit` slash command (see `.claude/commands/adr-audit.md`) cross-checks every ADR against the current code and surfaces gaps, mismatches, and chronology violations.

### Renumbering note (one-time event, 2026-04-17)

Existing ADRs were renumbered to place this governance rule at 002 and to group related decisions into numbered phases (runtime, architecture, data, auth, jobs, observability, testing, tooling, integrations, operations). The old→new mapping:

| Old | New | Title |
|---|---|---|
| 002 | 008 | env-vars-validated-via-zod |
| 003 | 013 | userid-from-jwt-only |
| 004 | 017 | e2e-tests-via-app-request |
| 005 | 023 | progress-tracking-with-sprint-archive |
| 006 | 024 | worktree-isolation-for-parallel-tasks |
| 007 | 025 | migrate-sqlite-to-postgresql |

Old references in git history remain correct at the time they were written. In-repo references have been updated.
