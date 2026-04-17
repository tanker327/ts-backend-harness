# ADR-020: Lefthook for Pre-commit Gates

- **Status**: Accepted (backfilled 2026-04-17; pre-commit use established in ADR-001)
- **Date**: 2026-04-17
- **Enforced by**: `lefthook.yml`, installed via `lefthook install`

## Context

ADR-001 lists "Lefthook to manage pre-commit hooks" as part of the harness, but does not explain the choice or enumerate the gates. This ADR fills that gap.

Pre-commit gates are the cheapest place to catch mistakes — cheaper than CI, much cheaper than code review. They run in milliseconds on the developer's machine before a commit exists. For an AI-agent-driven template, they are essential: the agent commits frequently and benefits from immediate, mechanical feedback.

Alternatives to Lefthook:

- **Husky + lint-staged** — ubiquitous but slower (Node startup per hook), more config files
- **pre-commit (Python)** — language-agnostic, but introduces a Python dependency for a TS project
- **Lefthook** — single binary, parallel-by-default, fast, YAML config, language-agnostic

## Decision

Use **Lefthook** to run pre-commit gates in parallel on staged files:

1. **biome-format** — `bunx biome format --write {staged_files}` — auto-fixes formatting
2. **biome-lint** — `bunx biome check {staged_files}` — blocks on lint errors
3. **typecheck** — `bunx tsc --noEmit` — blocks on TypeScript errors
4. **adr-check** — `scripts/check-adr-required.sh` — blocks dependency additions without an ADR (added by ADR-002)

All four run in parallel. Auto-fixes from biome-format are re-staged.

## Consequences

### Positive
- Developers and agents get instant feedback on format, lint, types, and ADR discipline
- CI only has to re-run the same gates as a backstop — the primary catch is local
- Single YAML config; easy to add or remove gates
- Parallel execution keeps pre-commit under a second on typical changes

### Negative
- `--no-verify` can bypass all of this — policy (commit-message rule) forbids it, but it is not mechanically prevented
- Contributors must run `lefthook install` once after cloning

### Enforcement
- `lefthook.yml` at repo root defines all gates
- `.claude/rules/commit-message.md` forbids `--no-verify`
- Adding or removing a gate is an ADR trigger (ADR-002), because gates are part of the harness contract
