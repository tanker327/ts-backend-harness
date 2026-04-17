# Progress Journal

Append-only, reverse-chronological (newest at top) narrative channel. Complements
progress/current.json — JSON tracks state, this tracks reasoning.

## How to use

- At session start: read the top ~2 entries to pick up where prior sessions left off.
- At session end: append one entry with 3–6 bullets. What you tried, what
  worked, what didn't, any gotchas or surprises.
- **Append only.** Never rewrite or reorder past entries. If an earlier claim
  turned out wrong, add a new bullet saying so — don't edit the old one.
- Keep each entry small. If you have a lot to say, link a doc/ADR instead.
- Rotate when this file exceeds ~150 lines: move the oldest entries to
  `progress/archive/journal-YYYY-MM.md` (preserve order, prepend a note
  that they were rotated on <date>).

## Entry format

### <YYYY-MM-DD> — <short session headline>

- Bullet 1
- Bullet 2
- Bullet 3

---

### 2026-04-17 — /start-tasks batch: stop-gate, session smoke, repo-gc

- TASK-016: redesigned the Stop hook — moved inline full-suite invocation to `.claude/scripts/stop-gate.sh` with a transcript-id file lock and a diff gate, running tsc → biome → vitest as a ladder.
- TASK-017: session smoke check — renamed the old bootstrap init to `scripts/bootstrap.sh`, created a new `scripts/init.sh` health probe, and wired SessionStart via `.claude/scripts/session-start.sh` with a 300s TTL cache.
- TASK-018: `/repo-gc` command added at `.claude/commands/repo-gc.md` — two-pass entropy sweep with `.gcignore` suppression support.
- Gotcha: pre-existing `drizzle/meta/_journal.json` formatting drift broke `biome check` mid-run; formatted inline and moved on — worth a future task to either add drizzle-generated files to biome ignore or wire a post-generate format step.
- Gotcha: the PreToolUse "did you ask before implementing" hook fires on every Write/Edit; during a pre-approved `/start-tasks` batch it's pure noise. Consider suppressing it when the current prompt is a `/start-tasks` invocation.

---
