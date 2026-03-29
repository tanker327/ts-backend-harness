# ts-backend-harness

A TypeScript backend starter template built for **AI Agent-first development** with [Claude Code](https://claude.ai/claude-code). Combines a modern Bun + Hono stack with a structured harness that keeps AI agents productive and architecturally consistent.

## Tech Stack

| Category | Tool |
|----------|------|
| Runtime | [Bun](https://bun.sh) |
| Framework | [Hono](https://hono.dev) + [zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi) |
| Database | [Drizzle ORM](https://orm.drizzle.team) + [Turso](https://turso.tech) (SQLite) |
| Auth | [Better Auth](https://www.better-auth.com) |
| Validation | [Zod](https://zod.dev) |
| Queue | [BullMQ](https://bullmq.io) + Redis |
| Logging | [Pino](https://getpino.io) + hono-pino |
| AI | [Anthropic SDK](https://docs.anthropic.com/en/api) |
| Testing | [Vitest](https://vitest.dev) |
| Linting | [Biome](https://biomejs.dev) |
| Git Hooks | [Lefthook](https://github.com/evilmartians/lefthook) |

## Quick Start

```bash
# One-command bootstrap (installs deps, creates .env, pushes schema, starts Redis, runs tests)
bun run init

# Or manually:
bun install
cp .env.example .env        # then edit secrets
docker compose up -d         # start Redis (required for BullMQ)
bun run db:migrate           # generate and apply database migrations
bun run dev                  # start dev server with hot reload
# Server: http://localhost:3000
# Swagger UI: http://localhost:3000/docs
# OpenAPI spec: http://localhost:3000/openapi.json
```

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server with watch mode |
| `bun run test` | Run all tests |
| `bun run test:watch` | Run tests in watch mode |
| `bun run test:coverage` | Run tests with coverage |
| `bun run lint` | Lint with Biome |
| `bun run format` | Auto-format with Biome |
| `bun run db:migrate` | Generate and apply Drizzle migrations |
| `bun run init` | Full project bootstrap |
| `bun run quality` | Update per-layer quality scores |
| `bun run harness-metrics` | Update harness effectiveness metrics |

## Architecture

Six-layer architecture with strict dependency direction:

```
Types(1) -> Config(2) -> Repos(3) -> Services(4) -> Providers(5) -> Routes(6)
```

Each layer may only import from layers with a **lower** number.

```
src/
  types/       # Layer 1: Zod schemas + TS types (zero runtime)
  config/      # Layer 2: Env validation, DB client, queue config
  repos/       # Layer 3: Data access (Drizzle ORM)
  services/    # Layer 4: Business logic
  providers/   # Layer 5: Cross-cutting (auth, logging)
  routes/      # Layer 6: Hono route handlers (OpenAPI)
```

This rule is **mechanically enforced** by `tests/architecture/layer-deps.test.ts`.

## The Harness

This template is designed around three pillars that keep AI agents on track:

### Context Engineering
- **CLAUDE.md** — Pointer-style entry doc (under 50 lines) with build commands, rules, and links
- **.claude/rules/** — On-demand rule files for database, API design, and testing patterns
- **docs/adr/** — Architecture Decision Records for all significant choices

### Architectural Constraints
- **Biome** — Linting + formatting (no `any`, import ordering)
- **TypeScript strict** — `noUncheckedIndexedAccess`, `noImplicitOverride`
- **Lefthook pre-commit** — Runs biome format, biome lint, and `tsc --noEmit` on every commit
- **Structural tests** — Layer dependency test prevents upward imports

### Feedback Loops

| Tier | Speed | Mechanism |
|------|-------|-----------|
| 1 | Milliseconds | Claude Code PostToolUse Hook (auto biome on file write) |
| 2 | Seconds | Lefthook pre-commit (biome + tsc) |
| 3 | Minutes | Vitest full suite |
| 4 | Hours | Human PR review |

Claude Code hooks also **block** modifications to config files (`biome.json`, `tsconfig.json`, `lefthook.yml`) and usage of `--no-verify`.

## Project Structure

```
├── .claude/
│   ├── settings.json         # Claude Code hooks
│   └── rules/                # Context-triggered rule files
├── CLAUDE.md                 # Agent entry point
├── docs/
│   ├── architecture.md       # Layer diagram + dependency rules
│   ├── adr/                  # Architecture Decision Records
│   └── quality/              # Quality scores + harness metrics
├── src/                      # Six-layer source code
├── tests/
│   ├── unit/                 # Vitest unit tests
│   ├── integration/          # Vitest integration tests
│   ├── architecture/         # Structural constraint tests
│   └── e2e/                  # E2E endpoint tests (app.request)
├── scripts/                  # Bootstrap, migration, quality scripts
├── progress/                 # Task tracking + feature plans
├── data/                     # Local SQLite database (gitignored)
├── docker-compose.yml        # Redis for BullMQ
├── drizzle.config.ts         # Drizzle Kit migration config
└── biome.json / tsconfig.json / lefthook.yml
```

## Adding a New Feature

1. Define types/schemas in `src/types/`
2. Add data access in `src/repos/`
3. Write business logic in `src/services/`
4. Create OpenAPI routes in `src/routes/`
5. Add tests in `tests/unit/` and `tests/e2e/`
6. Run `bun run test` to verify

## ADRs

| # | Title |
|---|-------|
| 001 | [Adopt Harness Engineering](docs/adr/001-adopt-harness-engineering.md) |
| 002 | [Env vars validated via Zod](docs/adr/002-env-vars-validated-via-zod.md) |
| 003 | [userId extracted from JWT only](docs/adr/003-userid-from-jwt-only.md) |
| 004 | [E2E tests via app.request](docs/adr/004-e2e-tests-via-app-request.md) |
| 005 | [Progress tracking with sprint archive](docs/adr/005-progress-tracking-with-sprint-archive.md) |
| 006 | [Worktree isolation for parallel tasks](docs/adr/006-worktree-isolation-for-parallel-tasks.md) |

## Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://www.docker.com) (for Redis)
- [Lefthook](https://github.com/evilmartians/lefthook) (`brew install lefthook`)

## License

MIT
