# Feature Plan: CI/CD Pipeline (TASK-007)

refs ADR-001 (harness engineering requires CI-backed validation)

## Goal
Add Tier 3 feedback loop — automated lint + typecheck + test on every push and PR.

## Implementation

### GitHub Actions workflow: `.github/workflows/ci.yml`

**Trigger**: push to `main`, pull_request to `main`

**Jobs**:
1. **quality** (runs in parallel):
   - `bun install`
   - `bunx biome check .` (lint)
   - `bunx tsc --noEmit` (typecheck)
2. **test** (depends on quality):
   - `bun install`
   - `bun run test` (vitest — unit, e2e, architecture)
   - Upload coverage report as artifact

**Environment**:
- Runner: `ubuntu-latest`
- Bun version: pin to latest stable (e.g. `1.1.x`)
- No Redis needed initially (tests use SQLite only)
- When BullMQ tests are added later, add Redis service container

### ADR
- ADR-026: CI pipeline enforces quality on every push
- Enforcement: GitHub branch protection requires CI to pass before merge

## Verification
- Push a branch, confirm workflow runs and passes
- Introduce a lint error on a branch, confirm CI fails
- Confirm coverage artifact is uploaded
