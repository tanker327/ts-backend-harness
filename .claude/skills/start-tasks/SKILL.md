---
name: start-tasks
description: Run session startup — pull latest, verify server, then work through all pending tasks in priority order with a separate commit per task.
---

Run the full session startup workflow, then execute every actionable task autonomously. Stop ONLY when no eligible tasks remain or a step fails irrecoverably. Do NOT stop between tasks — immediately continue to the next one.

## Setup

1. **Pull latest**: Run `git pull`. If it fails (merge conflicts, auth error, etc.), stop and report — do not continue.

2. **Review recent changes**: Run `git log --oneline -20` and briefly note what changed.

3. **Read task state**: Read `progress/current.json`.

4. **Verify server starts**: Run `bun run dev` and wait a few seconds to confirm it starts without errors, then kill the process. If it fails, stop and report.

## Task Loop

CRITICAL: Repeat this loop until no pending or in_progress tasks remain. After completing each task, immediately proceed to the next — do NOT pause, summarize, or wait for user input between tasks.

1. **Select task** (in priority order):
   a. If any task has `"status": "in_progress"`, resume it first.
   b. Otherwise, pick the highest priority (lowest number) `"pending"` task whose `depends_on` tasks are all `"completed"`.
   c. If no eligible task exists, check the `known_issues` list in `progress/current.json`. If there are open issues with corresponding files in `progress/issues/`, pick the first one and treat it as the next task — read the issue file, fix it, verify, commit with `fix(scope): description` and `refs ISSUE-XXX` in the footer, then remove the entry from `known_issues`.
   d. If no eligible tasks AND no open issues remain, report that all work is done and stop.

2. **Prepare**: Update the task's status to `"in_progress"` and set `"started_at"` to today's date in `progress/current.json` (skip if already in_progress). If the task's notes reference a feature plan in `progress/features/` or an ADR in `docs/adr/`, read those files and include them in the implementation prompt.

3. **Implement**: Spawn an Agent to do the implementation work. This keeps the main context window clean for orchestration. Give the agent a detailed prompt including:
   - The task title and description
   - Any feature plan or ADR content from step 2
   - The project conventions: layer order, commit rules, test requirements
   - Instruction to implement and leave files on disk (do NOT commit)
   When the agent completes, briefly note what it did (1-2 sentences) — do NOT echo its full output.

4. **Verify**: Spawn an Agent to run verification (lint → typecheck → tests). Do NOT use the `/verify` skill — skill invocations create turn boundaries that stop the task loop. Instead, launch an Agent with this prompt:
   > Run these three checks in sequence, stopping at the first failure: 1) `bunx biome check .` 2) `bunx tsc --noEmit` 3) `bun run test`. Report pass/fail and any error output.
   If the agent reports failure, fix the issues and re-run verification. If verification cannot be made to pass, stop the loop and report.

5. **Commit**: Create a separate commit for this task following `.claude/rules/commit-message.md`:
   - Stage changed files by name (never `git add -A`, never stage `.env`)
   - Use `type(scope): description` format
   - Add `refs TASK-XXX` in the footer
   - Use HEREDOC format for the commit message
   - Include `Co-Authored-By: Claude <noreply@anthropic.com>` trailer
   - Never use `--no-verify`

6. **Complete**: Update the task in `progress/current.json` — set status to `"completed"`, add `"completed_at"` date and `"commit"` hash (from step 5). Stage `progress/current.json` and create a separate commit:
   ```
   git commit -m "chore(harness): update progress for TASK-XXX

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

7. **Next**: Go back to step 1 IMMEDIATELY. Do not summarize, do not wait. Just select the next task.
