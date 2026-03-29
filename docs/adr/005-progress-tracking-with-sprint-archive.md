# ADR-005: Progress tracking with sprint archive strategy

- **Status**: Accepted
- **Date**: 2026-03-29
- **Enforced by**: CLAUDE.md session startup + task management rules

## Context

`progress.json` existed at the project root but was never populated or updated. The guide at `docs/harness/Progress-Tracking-Guide.md` documents best practices from Anthropic and the Harness Engineering methodology for cross-session task tracking.

Key problems to solve:
1. Agent has no memory between sessions — needs a structured file to restore context
2. Tasks need enough detail (notes, subtasks, dependencies) for the Agent to work independently
3. The file will grow over time and waste context window if not managed

## Decision

Adopt the sprint archive strategy from the Progress Tracking Guide:

1. Move from `progress.json` (root) to `progress/current.json` + `progress/archive/`
2. Use the full task schema: id, title, status, priority, type, notes, subtasks, depends_on, started_at, completed_at, commit
3. Agent reads only `progress/current.json` at session start
4. Detailed feature plans live in `progress/features/<name>.md` — only read when a task references them
5. When a sprint ends, archive completed tasks to `progress/archive/vX.X.X.json`
6. Active tasks should not exceed 20-30
7. Agent may update task status and subtasks, but must NOT create top-level tasks without human approval
8. Planning workflow: discuss → ADR → feature plan → tasks → user review → execute

## Consequences

### Positive
- Agent can restore context quickly from a small, focused file
- Sprint archives preserve history without bloating the active file
- Subtasks and notes give Agent enough detail to work independently

### Negative
- Requires discipline to archive completed tasks at sprint boundaries
- One more file to maintain (though Agent does most of the updates)

### Enforcement
- CLAUDE.md Session Startup reads `progress/current.json`
- CLAUDE.md task management rules govern Agent behavior
