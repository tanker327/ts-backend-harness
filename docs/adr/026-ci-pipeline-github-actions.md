# ADR-026: CI Pipeline on GitHub Actions

- **Status**: Accepted (backfilled 2026-04-17)
- **Date**: 2026-04-17
- **Enforced by**: `.github/workflows/ci.yml`, GitHub branch protection (if enabled)

## Context

Pre-commit hooks (ADR-020) catch formatting, linting, type, and ADR-gate violations before a commit exists. They do not replace a remote backstop: pre-commit can be bypassed (`--no-verify`), skipped on machines without Lefthook installed, or silently misconfigured. CI runs the same gates in a clean environment on every push and PR — catching everything the local hook misses.

For a Bun-first TypeScript template, CI needs to:

1. Use a runtime that matches production (Bun)
2. Provision the runtime services tests depend on (Redis; PostgreSQL is started on-demand by Vitest's globalSetup — see ADR-029)
3. Run the same quality gates as pre-commit (Biome check, `tsc --noEmit`) plus the full test suite (Vitest)
4. Produce coverage artifacts for review

GitHub Actions is chosen because the repo lives on GitHub and Actions is the zero-friction CI for that host. Alternatives (CircleCI, GitLab CI) would require a separate integration and offer no advantage for this workload.

## Decision

Use **GitHub Actions** for CI, configured in `.github/workflows/ci.yml`:

**Triggers**
- `push` to `main`
- `pull_request` targeting `main`

**Jobs**
1. **quality** (runs first)
   - Checkout + `oven-sh/setup-bun@v2`
   - `bun install --frozen-lockfile`
   - `bunx biome check .` (lint + format check)
   - `bunx tsc --noEmit` (typecheck)

2. **test** (runs after `quality`)
   - Same Bun setup
   - Redis service container on port 6380 (matches test config from ADR-021)
   - PostgreSQL is started on-demand by Vitest's `globalSetup` via `docker compose -f docker-compose.test.yml` (ADR-029 documents this lifecycle)
   - `bun run test` (full Vitest suite)
   - `bun run test:coverage`
   - Upload coverage artifact (retention 7 days)

**What CI does *not* do (yet)**
- No deployment / build / release steps — template does not ship a Dockerfile
- No branch protection rule is enforced at the repo level — configuring it is a per-deployment decision

## Consequences

### Positive
- Every push and PR runs the full gate set in a clean environment
- Matches local `lefthook.yml` gates — no surprise CI failures for developers
- Coverage artifact is retained for review without needing a third-party service
- Services (Redis) are provisioned via GitHub's service container feature — no manual setup

### Negative
- CI invocation of `--frozen-lockfile` means PRs must update `bun.lock` explicitly when deps change
- PostgreSQL is started via `docker compose` inside a job instead of as a service container — works on GitHub-hosted runners (Docker is available), may not work on some self-hosted runners
- No matrix testing across Bun versions — pins to `latest`, which can drift

### Enforcement
- `.github/workflows/ci.yml` is the single source for CI config
- Changing the CI gate set is an ADR trigger (ADR-002 — "changing a testing boundary")
- If branch protection is added to require CI checks before merge, document the rule in the repo README
