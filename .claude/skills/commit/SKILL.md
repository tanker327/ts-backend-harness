---
name: commit
description: "use following steps to commit all the changes. Do NOT ask for confirmation before committing — committing IS the user's confirmation."
---

Commit all current changes following the project's commit-message conventions. Do NOT ask for confirmation — invoking `/commit` IS the user's confirmation.

## Steps

1. **Assess changes**
   - Run `git status` (never use `-uall`) and `git diff` to understand what changed.
   - If there are no changes to commit, report that and stop.

2. **Determine if docs-only**
   - If every changed file is markdown (`.md`), skip validation (step 3) — there is no code to break.

3. **Validate** (skip for docs-only changes)
   - Spawn an Agent to run verification. Do NOT use the `/verify` skill — skill invocations create turn boundaries that halt the flow. Launch an Agent with this prompt: "Run these three checks in sequence, stopping at the first failure: 1) `bunx biome check .` 2) `bunx tsc --noEmit` 3) `bun run test`. Report pass/fail and any error output." (lint, typecheck, tests).
   - If verification fails, fix the issues and re-run `/verify`. If it still fails, stop and report — do not commit broken code.

4. **Stage files**
   - Stage changed files by name — NEVER use `git add -A` or `git add .`.
   - NEVER stage `.env` or files that likely contain secrets.

5. **Look up active task**
   - Read `progress/current.json`.
   - Find any task with `"status": "in_progress"` — its `id` (e.g. `TASK-005`) will go in the commit footer.

6. **Generate commit message**
   - Follow the rules in `.claude/rules/commit-message.md` exactly:
     - Format: `type(scope): short description`
     - Subject: 72 chars max, lowercase, no trailing period
     - Body (optional): explain *why*, not *what*, wrap at 100 chars
     - Footer: add `refs TASK-XXX` if an in-progress task exists; add `refs ADR-XXX` if the change relates to an ADR
   - Choose the correct **type** (`feat`, `fix`, `test`, `arch`, `chore`, `docs`, `refactor`) and **scope** (`types`, `config`, `repos`, `services`, `providers`, `routes`, `harness`, `infra`).

7. **Commit**
   - Use HEREDOC format for the message:
     ```
     git commit -m "$(cat <<'EOF'
     type(scope): short description

     Optional body explaining why.

     refs TASK-XXX

     Co-Authored-By: Claude <noreply@anthropic.com>
     EOF
     )"
     ```
   - NEVER use `--no-verify`.
   - If the pre-commit hook fails: fix the issue, re-stage, and create a NEW commit (never `--amend`).

8. **Update progress + status report** (only if an in-progress task was found in step 5)
   - Get the commit hash from step 7.
   - Update the task in `progress/current.json` — set `"commit"` to that hash.
   - **Spawn an agent** to regenerate `project-status-report.md`. Pass the verify results from step 3 so it does NOT re-run lint, typecheck, or tests. Use this prompt (fill in the `{...}` values):
     ```
     Regenerate the file project-status-report.md at the project root.
     Follow the report format defined in .claude/skills/status-report/skill.md.

     Verify results (already ran — do NOT re-run these):
     - Lint: {lint_summary}
     - Typecheck: {typecheck_result}
     - Tests: {test_summary}

     Steps:
     1. Read progress/current.json
     2. Run: git branch --show-current, git rev-list --count main..HEAD, git log --oneline -15
     3. List docs/adr/*.md
     4. Write project-status-report.md using the report format from the skill file
     5. Do NOT stage or commit — the caller handles that
     ```
   - Wait for the agent to complete.
   - Stage `progress/current.json` and `project-status-report.md`, then create a NEW commit:
     ```
     git commit -m "$(cat <<'EOF'
     chore(harness): update progress for TASK-XXX

     Co-Authored-By: Claude <noreply@anthropic.com>
     EOF
     )"
     ```

9. **Report**
   - Show the final commit hash and message summary.
