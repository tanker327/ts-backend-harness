# ADR-006: Worktree Isolation for Parallel Tasks

- **Status**: Accepted
- **Date**: 2026-03-29
- **Enforced by**: convention, Claude Code worktree support

## Context

When multiple tasks run concurrently (e.g., agent + human, or multiple agent sessions), a shared mutable working directory creates conflicts: uncommitted changes collide, test databases lock, and partial state leaks between tasks.

The harness setup manual recommends: "one task per worktree, container, or devbox — do not rely on a single shared mutable environment for unrelated tasks."

## Decision

Use **git worktrees** for parallel task isolation:

1. Each independent task gets its own worktree via `git worktree add`
2. Claude Code's built-in `isolation: "worktree"` mode handles creation/cleanup automatically
3. Each worktree has its own `data/` directory (SQLite test DB) — no lock contention
4. Merge back to the main branch via PR or fast-forward after task completion
5. For sequential tasks within a single session, worktrees are not required

## Consequences

### Positive
- No SQLite BUSY lock errors between concurrent sessions
- Each task has a clean, predictable starting state
- Failed experiments can be discarded without reverting main branch changes

### Negative
- Disk usage increases with multiple worktrees (node_modules duplicated)
- Contributors must understand git worktree basics

### Enforcement
- Convention documented in this ADR
- Claude Code agent config supports `isolation: "worktree"` natively
- No automated enforcement — this is a workflow guideline, not a code constraint
