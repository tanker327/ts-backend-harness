# Project Status Report

**Project:** ts-backend-harness
**Date:** 2026-03-30
**Branch:** main
**Sprint:** v0.2.1

## Health Check

| Check      | Status |
|------------|--------|
| Lint       | Pass (51 files checked, 1 warning, no errors) |
| Typecheck  | Pass |
| Tests      | Pass (11 files, 70 tests — 70 passed) |

## Sprint Progress

**Completed: 1 / 1 tasks (100%)**

| ID | Title | Status | Type |
|----|-------|--------|------|
| TASK-014 | Worker: show clean error warning when Redis is unavailable | Completed | fix |

## Pending Tasks — Dependency Chain

All tasks completed. No pending work in this sprint.

## Architecture Decisions (ADRs)

| ADR | Title |
|-----|-------|
| ADR-001 | Adopt harness engineering |
| ADR-002 | Env vars validated via Zod |
| ADR-003 | userId from JWT only |
| ADR-004 | E2E tests via app request |
| ADR-005 | Progress tracking with sprint archive |
| ADR-006 | Worktree isolation for parallel tasks |

## Test Coverage

| File | Tests |
|------|-------|
| tests/unit/sanity.test.ts | 2 |
| tests/unit/services/ai.test.ts | 3 |
| tests/unit/services/author-accounts.test.ts | 6 |
| tests/unit/services/contents.test.ts | 6 |
| tests/architecture/layer-deps.test.ts | 2 |
| tests/e2e/health.test.ts | 2 |
| tests/e2e/auth.test.ts | 6 |
| tests/e2e/author-accounts.test.ts | 12 |
| tests/e2e/contents.test.ts | 15 |
| tests/integration/worker.test.ts | 2 |
| tests/unit/services/generate-title.test.ts | 14 |
| **Total** | **70** |

## Known Issues & Tech Debt

**Known Issues:**
- drizzle-kit push may fail in vitest global-setup.ts — needs diagnosis (TASK-006)

**Tech Debt:**
- Quality scores (docs/quality/scores.json) not automated

## Recent Commit History (v0.2.1)

```
d44691b chore(harness): update progress for TASK-014
91eae85 fix(services): show clean error when Redis unavailable in worker
f45cc99 arch(harness): add ask-before-implementing rule and PreToolUse hook
0b7da25 feat(services): add generate-title worker job and standalone entrypoint
c68d348 fix(infra): isolate test redis on port 6380 to avoid dev conflicts
48edbb6 fix(harness): auto-start redis for tests and skip when unavailable
910f57c fix(harness): fix e2e test cleanup order and disable file parallelism
970fa83 fix(infra): add redis service container to ci test job
99f1b52 docs(harness): update README with missing scripts, ADRs, and corrections
```
