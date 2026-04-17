# ADR Required — Trigger Checklist

Before introducing a change, run this checklist. If **any** trigger fires, STOP and write (or update) an ADR first — do not implement until the ADR is drafted and the user has approved it.

Full policy: `docs/adr/002-adr-trigger-checklist.md`. This file is the fast agent-side version.

## Triggers (any one requires an ADR)

- [ ] Adding a new **runtime service dependency** (database, queue, cache, search, object store, hosted auth, third-party runtime API, etc.)
- [ ] Adding a new **npm dependency with architectural alternatives** (ORM, web framework, auth lib, logger, queue client, validation lib, test runner)
- [ ] Creating a new **`src/` top-level directory** or extending the six-layer architecture (ADR-005)
- [ ] Introducing a new **cross-cutting pattern** (auth, error handling, logging, caching, API versioning)
- [ ] Changing a **security / data-integrity boundary** (where data lives, who reads it, how identity resolves)
- [ ] Introducing a **schema convention that applies to every table** (FK patterns, soft delete, audit columns)
- [ ] Changing a **testing boundary** (new tier, new runner, new CI gate)
- [ ] The change would require **updating a structural/layer test** (ADR-005)

## Not triggers (proceed normally)

- Bug fixes that preserve behavior and contracts
- Refactors within a single layer with unchanged public interface
- New routes / services / endpoints that follow existing patterns
- Dependency version bumps (unless the bump is architecturally breaking)
- Utility npm packages with no alternative worth debating
- Minor tooling tweaks

## Workflow when a trigger fires

1. STOP. Do not write code yet.
2. Tell the user which trigger fired and propose an ADR.
3. Draft `docs/adr/NNN-<slug>.md` using `docs/adr/template.md`.
4. Get user approval on the ADR.
5. Then implement the change in the same PR as the ADR.

## Skip policy

Never silently bypass this rule. If the user wants to skip the ADR for a trigger that fired, they must say so explicitly and the skip goes into `progress/adr-debt.md` for later backfill.
