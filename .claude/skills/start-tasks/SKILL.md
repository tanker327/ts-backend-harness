---
name: start-tasks
description: Run session startup — pull latest, verify server, then work through all pending tasks in priority order with a separate commit per task.
---

Run the full session startup workflow, then execute every actionable task. Stop and report at any step that fails.

## Setup

1. **Pull latest**: Run `git pull`. If it fails (merge conflicts, auth error, etc.), stop and report — do not continue.

2. **Review recent changes**: Run `git log --oneline -20` and briefly note what changed.

3. **Read task state**: Read `progress/current.json`.

4. **Verify server starts**: Run `bun run dev` and wait a few seconds to confirm it starts without errors, then kill the process. If it fails, stop and report.

## Task Loop

Repeat until no pending or in_progress tasks remain:

1. **Select task** (in priority order):
   a. If any task has `"status": "in_progress"`, resume it first.
   b. Otherwise, pick the highest priority (lowest number) `"pending"` task whose `depends_on` tasks are all `"completed"`.
   c. If no eligible task exists, report that all tasks are done and stop.

2. **Prepare**: Update the task's status to `"in_progress"` and set `"started_at"` to today's date in `progress/current.json` (skip if already in_progress). If the task's notes reference a feature plan in `progress/features/` or an ADR in `docs/adr/`, read those files.

3. **Implement**: Do the work described by the task.

4. **Verify**: Run `/verify` (lint, typecheck, tests). If it fails, fix the issues and re-run. If verification cannot be made to pass, stop the loop and report.

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

7. **Next**: Loop back to step 1.
