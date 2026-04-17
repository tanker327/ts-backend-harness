# ADR-028: Drizzle Migration Workflow — `generate` then `migrate`

- **Status**: Accepted (backfilled 2026-04-17)
- **Date**: 2026-04-17
- **Enforced by**: `scripts/migrate.sh`, `drizzle.config.ts`, `package.json` `db:migrate` script

## Context

Drizzle Kit offers two paths to apply schema changes to a database:

1. **`drizzle-kit push`** — compare the TS schema to the live DB and apply differences directly. No SQL file is produced. Fast for local development, but the applied change is not reviewable, not in git history, and not replayable on another environment.
2. **`drizzle-kit generate` + `drizzle-kit migrate`** — generate a versioned SQL migration file, then apply it. The SQL lands in `drizzle/` and is committed to the repo. Review-able, replayable, and auditable.

Option 1 is convenient for rapid iteration but is not safe for any environment you care about. Option 2 is the industry norm for production databases.

## Decision

Use the **generate → migrate** pair for all environments that matter. Rapid iteration (dev) is allowed but migrations must be generated and committed before any change reaches `main`.

**Workflow:**
```
bunx drizzle-kit generate   # produces drizzle/NNNN_*.sql
bunx drizzle-kit migrate    # applies pending migrations
```

Wrapped as `scripts/migrate.sh` and exposed as `bun run db:migrate`.

**Exception — test DB:**
Vitest's globalSetup uses `drizzle-kit push --force` against the test database (ADR-029). This is safe because the test DB is ephemeral, unversioned, and rebuilt per run. No test data is preserved.

**What lands in git:**
- `drizzle/NNNN_*.sql` migration files
- `drizzle/meta/` snapshots

## Consequences

### Positive
- Schema changes are reviewable as SQL in PRs
- Migrations are replayable — any environment can reach the same state
- Production rollbacks are possible (by writing a reverse migration)
- Test DB lifecycle stays fast (`push --force` skips the versioning ceremony)

### Negative
- Developers must remember to run `bun run db:migrate` after pulling a schema change
- Conflicts between parallel migrations (two devs generate against the same base) require manual resolution — no automated merge strategy yet
- Forward-only by default; rollback requires an explicit reverse migration

### Enforcement
- `scripts/migrate.sh` uses `generate` + `migrate` — not `push`
- Test-only path documented in ADR-029 (globalSetup uses `push --force` intentionally)
- Changing the migration workflow (e.g., adopting `push` for production) is an ADR trigger (ADR-002)
