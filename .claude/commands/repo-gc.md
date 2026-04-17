# /repo-gc — Two-pass harness entropy sweep

Scan the repo for drift and dead weight: unused exports, broken doc links, orphan rule files, stale tasks, archivable issues, ADR violations, doc-code drift, route pattern deviations, and CLAUDE.md bloat. Reports only — does **not** auto-fix.

## What to do

Spawn a single **Explore / general-purpose** agent with the prompt below. Do **not** perform the sweep yourself — delegate so the report stays clean and the main context uncluttered.

After the agent returns, relay its report verbatim under the output shape defined below. End with: "What do you want to do about each finding?" — do **not** auto-fix anything. The sweep reports; the user decides.

One exception: if the agent appended new findings to `progress/adr-debt.md`, mention that in your summary so the user knows the file changed.

## Output shape (what the agent returns, what you relay)

```
# /repo-gc report — <YYYY-MM-DD>

## Critical (should fix)
- <check-id> — <file:line> — <one-line description>

## Warnings (probably fix)
- ...

## Info / candidates
- ...

## Summary
- Pass 1 checks: <N> run, <M> findings
- Pass 2 checks: <N> run, <M> findings
- Suppressed via .gcignore: <K>
```

Severity bucketing:
- **Critical** — ADR violations in `src/`, broken doc links inside ADRs or CLAUDE.md
- **Warnings** — unused exports, route-modal-pattern drift, doc-code drift, stale tasks with no commit
- **Info** — orphan rule files, archivable issues, CLAUDE.md length, stale tasks older than 30 days with a commit

## Agent prompt (pass verbatim to the agent)

```
You are sweeping a TypeScript backend template project at /Users/ericwu/projects/work/ts-backend-harness for drift, dead weight, and policy violations. This is a two-pass sweep: Pass 1 is deterministic (run tools and grep), Pass 2 uses judgment. Same single call — do both passes.

## Setup: load suppressions

Before any check, read `.gcignore` at the repo root if it exists. Each non-empty, non-`#`-comment line is one of:
- A glob (skip files whose path matches) — e.g. `src/experiments/**`
- `rule:<id>` — skip that check entirely (e.g. `rule:route-modal-pattern`)
- `finding:<hash>` — ignore a specific finding whose stable hash matches. Hash = first 12 hex chars of sha256("<check-id>|<file>|<line>").

Also honor inline `// gc:ignore <rule-id>` comments in source files — suppress that rule ONLY for the line the comment sits on (or the line immediately after, if the comment is on its own line).

Count every suppressed finding and report the total at the end.

## Pass 1 — deterministic checks

### 1.1 `unused-exports`
Run `bunx knip --no-progress` if the repo has `knip` configured (check `package.json` or `knip.json`). Otherwise fall back to `bunx ts-prune`. If neither is available, skip with a note `unused-exports: skipped — install knip or ts-prune`. Do NOT install anything. Report each finding as `<file>:<line> — <symbol>`.

### 1.2 `broken-doc-links`
For every `docs/**/*.md`, `CLAUDE.md`, and `.claude/**/*.md`:
- Extract markdown links `](<path>)` where `<path>` does NOT start with `http://`, `https://`, `#`, or `mailto:`.
- Also extract bare `<file.md>` references where `file.md` looks like a relative path.
- Resolve relative to the file's directory. If the target does not exist on disk, flag as broken with source file + line.

### 1.3 `orphan-rule-files`
For every `.claude/rules/*.md`:
- Take the basename minus `.md`.
- Grep the whole repo (excluding the rule file itself) for that basename. If there are zero matches outside `.claude/rules/`, flag as orphan.

### 1.4 `stale-completed-tasks`
Parse `progress/current.json`. For every task with `status: "completed"`:
- If no `commit` field → flag as `missing-commit`.
- If `completed_at` is more than 30 days before today (today is provided in the env context) → flag as `stale-completed`.

### 1.5 `archivable-issues`
For every file in `progress/issues/`:
- If the filename (without extension) is NOT listed in `known_issues` in `progress/current.json`, AND the file contains `## Status: fixed`, AND the `## First seen:` date (or the newest date in the body) is more than 14 days before today → flag as archive candidate.

## Pass 2 — semantic checks

### 2.1 `adr-violation`
For each `docs/adr/NNN-*.md` (skip `template.md`):
- Extract enforceable rules — look for bullet points under `## Decision` or `## Enforcement` that use words like "MUST", "never", "only", "always".
- Translate obvious ones into grep queries. Known patterns to check:
  - ADR-013 (userId from JWT): flag `req.body.userId`, `body.userId`, `params.userId`, `req.params.userId`, `request.body.userId` inside `src/` (ignore `tests/`, `**/*.test.ts`, `**/*.spec.ts`, and any fixture dirs).
  - Any ADR that names a directory restriction (e.g., "X lives only in src/Y/"): grep for imports of X outside src/Y/.
- Be **conservative**. False positives are worse than misses. If a match is ambiguous, skip it and mention in the report that the rule needs a more precise grep.

**Side effect (only for this check):** if there are new findings, append them to `progress/adr-debt.md` under a new subsection `## /repo-gc findings — <YYYY-MM-DD>`. Append only; never overwrite. If the file doesn't exist, create it with a one-line header. Skip the append if this check had zero findings.

### 2.2 `doc-code-drift`
For each `docs/**/*.md`:
- Extract referenced paths matching `src/[a-zA-Z0-9_/.-]+\.(ts|tsx|js)`.
- For each: verify the file exists. If not, flag as stale path.
- Extract referenced symbol names (look for backtick-wrapped `functionName`, `ClassName`, or `exportName` near a file citation). Grep the cited file for the symbol. If absent, flag as stale symbol.

### 2.3 `route-modal-pattern`
For every file under `src/routes/` (excluding `index.ts` / barrel files that only re-export):
- Confirm it imports something resembling `createRoute` (or the project's equivalent — check `src/routes/` for the dominant pattern first, then flag deviations from that).
- Confirm it imports at least one zod schema (either from `src/types/` or via `z.object`).
- Flag files that have route-like handlers but no OpenAPI spec wiring.

### 2.4 `claude-md-bloat`
Count non-empty, non-heading lines in `CLAUDE.md`. If greater than ~150, flag with `CLAUDE.md: <N> instruction lines — consider trimming or splitting into .claude/rules/`.

## Output

Return a single markdown report in exactly this shape:

    # /repo-gc report — <YYYY-MM-DD>

    ## Critical (should fix)
    - <check-id> — <file:line> — <description>

    ## Warnings (probably fix)
    - ...

    ## Info / candidates
    - ...

    ## Summary
    - Pass 1 checks: 5 run, <M> findings
    - Pass 2 checks: 4 run, <M> findings
    - Suppressed via .gcignore: <K>

Severity bucketing:
- Critical: `adr-violation`, broken links inside ADRs or CLAUDE.md
- Warnings: `unused-exports`, `route-modal-pattern`, `doc-code-drift`, `stale-completed-tasks` with `missing-commit`
- Info: `orphan-rule-files`, `archivable-issues`, `claude-md-bloat`, plain `stale-completed` tasks

Rules for the report:
- One line per finding. Include the check-id so users can `.gcignore` it.
- Group by severity. Within severity, group by check-id.
- Be concrete — file paths and line numbers.
- Be concise — under 1500 words total.
- No preamble, no recommendations beyond what the check produced.
- If a check was skipped (e.g., no knip installed), list it in Summary with `skipped: <reason>`.

Finally: if you appended to `progress/adr-debt.md`, say so in one line after the Summary block.
```

## Why two passes

Pass 1 is cheap, deterministic, and safe to re-run often. Pass 2 costs judgment and can false-positive — keeping it separate lets the user decide per-check whether to trust it. Both run in the same agent call so the sweep is one round-trip, but the report distinguishes them in the Summary counts.

## Suppression

- `.gcignore` at repo root — glob, `rule:<id>`, or `finding:<hash>` entries. Lines starting with `#` are comments.
- Inline `// gc:ignore <rule-id>` comments in source for line-local waivers.
- Every suppression is counted in the Summary block so silent drift is visible.

## Promoting to scheduled agent

Once the false-positive rate is low after ~3 manual invocations, move this to a scheduled remote agent via the `schedule` skill — e.g., weekly cadence that posts the report to a known channel or file. Do not schedule it before the baseline is trusted; a noisy scheduled agent is worse than no agent.
