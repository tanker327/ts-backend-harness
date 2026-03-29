# Plan: Create `/commit` Skill

## Context

The project currently uses a generic built-in `/commit` command from `~/.claude/commands/commit.md`. It doesn't follow this project's commit-message conventions (type/scope format, TASK-XXX refs) and doesn't run the project's validation pipeline before committing. A project-level skill will override the built-in and enforce the project's workflow automatically.

## Approach

Create a single file: `.claude/skills/commit/SKILL.md`

The skill will:
1. Assess changes via `git status` / `git diff`
2. Skip validation for markdown-only changes (no code to break)
3. Run `/verify` (lint, typecheck, tests) — reuses existing skill, no duplication
4. Stage files by name (never `git add -A`, never stage `.env`)
5. Read `progress/current.json` for in-progress TASK-XXX to reference in footer
6. Generate commit message following `.claude/rules/commit-message.md` format
7. Commit with HEREDOC format, no `--no-verify`, Co-Authored-By trailer
8. Handle pre-commit hook failures (fix + new commit, never amend)

Key design decisions:
- **Delegates to `/verify`** instead of duplicating lint/typecheck/test commands
- **No confirmation prompt** — invoking `/commit` IS the user's confirmation
- **Markdown shortcut** — skips full validation for docs-only changes

## Files to Create/Modify

| File | Action |
|---|---|
| `.claude/skills/commit/SKILL.md` | Create — the skill definition |

No other files need changes. The skill references existing files:
- `.claude/skills/verify/SKILL.md` — called for validation
- `.claude/rules/commit-message.md` — commit format rules
- `progress/current.json` — active task lookup

## Verification

1. Make a small code change, run `/commit` — confirm it runs verify, stages, and commits with correct format
2. Make a markdown-only change, run `/commit` — confirm it skips validation
3. Introduce a lint error, run `/commit` — confirm it stops and reports the failure
4. Check `git log --oneline -1` — confirm message follows `type(scope): description` format with refs footer
