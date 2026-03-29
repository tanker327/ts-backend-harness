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
   - Run `/verify` (lint, typecheck, tests).
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

8. **Update progress** (only if an in-progress task was found in step 5)
   - Get the commit hash from step 7.
   - Update the task in `progress/current.json` — set `"commit"` to that hash.
   - Stage `progress/current.json` and create a NEW commit:
     ```
     git commit -m "$(cat <<'EOF'
     chore(harness): update progress for TASK-XXX

     Co-Authored-By: Claude <noreply@anthropic.com>
     EOF
     )"
     ```

9. **Report**
   - Show the final commit hash and message summary.
