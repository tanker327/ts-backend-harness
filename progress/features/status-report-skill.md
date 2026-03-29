# Feature Plan: /status-report Skill

## Goal

Create a `/status-report` skill that regenerates `project-status-report.md` at the project root, pulling live data from `progress/current.json`, `git log`, `git branch`, test results, and ADR files. The report should be updated alongside task completion commits so it always reflects the current state.

## Integration Point

The `/commit` skill (step 8) already creates a follow-up commit to update `progress/current.json` after a task commit. The status report update should be folded into that same step — regenerate the report, stage it alongside `progress/current.json`, and include it in the progress-update commit. This keeps the report in sync without adding a separate commit.

## Skill Behavior

When invoked standalone (`/status-report`), the skill:

1. **Gather data** (all in parallel where possible):
   - Read `progress/current.json` for task list, sprint name, known issues, tech debt
   - Run `git branch --show-current` for current branch
   - Run `git rev-list --count main..HEAD` for commits ahead of main
   - Run `git log --oneline -15` for recent commit history
   - Run `bun run test` and capture summary line (files, test count, pass/fail)
   - Run `bunx biome check .` and capture summary
   - Run `bunx tsc --noEmit` and capture pass/fail
   - List `docs/adr/*.md` for ADR table
   - Parse test file names from vitest output for coverage breakdown

2. **Compute derived values**:
   - Count completed vs total tasks, calculate percentage
   - Identify next task to pick up (highest priority pending with deps met)
   - Build dependency chain for pending tasks
   - Determine health check status from step 1 results

3. **Write report**: Overwrite `project-status-report.md` at root with the updated content, following the existing format (see sections below).

4. **Report**: Print a one-line summary of what changed (e.g., "Updated status report: 12/14 tasks complete, all checks green").

## Report Sections (fixed format)

1. **Header** — project name, date (today), branch, sprint
2. **Health Check** — lint, typecheck, test results table
3. **Sprint Progress** — completion fraction + full task table with status
4. **Pending Tasks — Dependency Chain** — ASCII tree of what's blocked and what's next
5. **Architecture Decisions (ADRs)** — table from `docs/adr/` listing
6. **Test Coverage** — breakdown by test file
7. **Known Issues & Tech Debt** — from `progress/current.json` fields
8. **Recent Commit History** — last 15 commits on current branch

## /commit Integration — Spawned Agent (critical)

**Problem**: Invoking `/status-report` as a Skill inside `/commit` creates a turn boundary and stops the commit flow mid-process.

**Solution**: In `/commit` step 8, spawn an Agent (subagent) to regenerate the report instead of invoking the skill. Pass the already-collected verify results as context in the agent prompt so it does NOT re-run lint, typecheck, or tests.

Modify `/commit` skill step 8 to:

1. After updating task status in `progress/current.json`
2. **Spawn an agent** with a prompt that includes:
   - The verify results from step 3 (lint summary, typecheck pass/fail, test summary line)
   - Instruction to regenerate `project-status-report.md` following the report format
   - Instruction to gather only the data it doesn't already have (git info, ADR list, progress/current.json)
   - Instruction to NOT run `bun run test`, `bunx biome check`, or `bunx tsc --noEmit` — these results are provided
3. Wait for the agent to complete
4. Stage both `progress/current.json` and `project-status-report.md`
5. Commit together as: `chore(harness): update progress for TASK-XXX`

### Agent prompt template (for step 8)

```
Regenerate the file project-status-report.md at the project root.

Verify results (already ran — do NOT re-run these):
- Lint: {lint_summary}
- Typecheck: {typecheck_result}
- Tests: {test_summary}

Steps:
1. Read progress/current.json
2. Run: git branch --show-current, git rev-list --count main..HEAD, git log --oneline -15
3. List docs/adr/*.md
4. Write project-status-report.md using the fixed report format (see the existing file for the template)
5. Do NOT stage or commit — the caller handles that
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `.claude/skills/status-report/skill.md` | Create — standalone skill definition (runs verify itself) |
| `.claude/skills/commit/skill.md` | Modify — step 8 spawns agent with pre-collected verify results |

## Design Decisions

- **Agent, not Skill, in /commit**: Skill invocation creates a turn boundary that breaks the commit flow. Spawning an agent avoids this and allows passing verify results as context.
- **No duplicate work**: When called from `/commit`, verify already ran. The agent prompt explicitly says "do NOT re-run" and provides the results inline. The standalone `/status-report` skill runs verify itself since it has no prior results.
- **No script, just a skill + agent**: The report is markdown generated from simple CLI outputs. A skill prompt is simpler than maintaining a separate TypeScript script. Follows Occam's Razor.
- **Fixed format**: The report sections are fixed (not configurable). This keeps the skill simple and the report predictable.
- **Overwrite, not patch**: Always regenerate the full report rather than trying to patch individual sections. Simpler and avoids drift.
