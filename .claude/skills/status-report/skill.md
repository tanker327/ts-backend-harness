---
name: status-report
description: Regenerate project-status-report.md with live data from progress tasks, git history, test results, and ADRs.
---

Regenerate `project-status-report.md` at the project root with current data. Always overwrite the entire file.

## Steps

1. **Gather data** (run in parallel where possible):
   - Read `progress/current.json` for task list, sprint name, known issues, tech debt
   - Run `git branch --show-current` for current branch
   - Run `git rev-list --count main..HEAD` for commits ahead of main
   - Run `git log --oneline -15` for recent commit history
   - Run `bunx biome check .` and capture the summary line
   - Run `bunx tsc --noEmit` and capture pass/fail
   - Run `bun run test` and capture the summary lines (test files count, tests count, pass/fail)
   - List `docs/adr/*.md` to build the ADR table

2. **Compute derived values**:
   - Count completed vs total tasks, calculate percentage
   - Identify next eligible task (highest priority pending with all `depends_on` completed)
   - Build dependency chain tree for pending tasks
   - Parse test file names and counts from vitest output

3. **Write report**: Overwrite `project-status-report.md` using the fixed format below.

4. **Report**: Print a one-line summary (e.g., "Updated status report: 12/14 tasks complete, all checks green").

## Report Format

```markdown
# Project Status Report

**Project:** ts-backend-harness
**Date:** {today YYYY-MM-DD}
**Branch:** {branch} ({N} commits ahead of main)
**Sprint:** {sprint name from current.json}

## Health Check

| Check      | Status |
|------------|--------|
| Lint       | {Pass/Fail} ({details}) |
| Typecheck  | {Pass/Fail} |
| Tests      | {Pass/Fail} ({N} files, {N} tests) |

## Sprint Progress

**Completed: {done} / {total} tasks ({pct}%)**

| ID | Title | Status | Type |
|----|-------|--------|------|
{for each task: | TASK-XXX | title | Completed or **Pending** or **In Progress** | type |}

## Pending Tasks — Dependency Chain

{ASCII tree showing pending tasks, their blockers, and which is next}

**Next task to pick up:** {TASK-XXX} — {title}.

## Architecture Decisions (ADRs)

| ADR | Title |
|-----|-------|
{for each docs/adr/NNN-*.md: | ADR-NNN | title from filename |}

## Test Coverage

| File | Tests |
|------|-------|
{breakdown by test file from vitest output}
| **Total** | **{N}** |

## Known Issues & Tech Debt

{bullet list from current.json known_issues and tech_debt}

## Recent Commit History ({branch})

{git log --oneline -15 output in a code block}
```
