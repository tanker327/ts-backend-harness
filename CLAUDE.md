# CLAUDE.md

## Build & Test
- Runtime: Bun
- Install: `bun install`
- Dev: `bun run --watch src/index.ts`
- Test all: `bun run test`
- Test single: `bun run vitest run tests/path/to/file.test.ts`
- Lint: `bunx biome check .`
- Format: `bunx biome format --write .`

## Architecture
- Layer order: Types -> Config -> Repos -> Services -> Providers -> Routes
- Each layer may only import from layers to its left
- See: docs/architecture.md

## Key Directories
- Types/Schemas: src/types/
- Config: src/config/env.ts (Zod validated, NOT process.env directly)
- Data access: src/repos/ (Drizzle ORM only)
- Business logic: src/services/
- API routes: src/routes/ (Hono + zod-openapi)
- Tests: tests/

## Rules (MUST follow)
- NO direct DB queries outside src/repos/
- NO process.env outside src/config/ — use validated env config
- NO editing biome.json / tsconfig.json / lefthook.yml
- NO `git commit --no-verify`
- NO `any` type — enforced by tsconfig strict
- All new routes must have integration tests
- Run tests before declaring any task complete
- One feature per task — do not bundle unrelated changes

## Decision Records
- ADRs: docs/adr/
- Template: docs/adr/template.md

## Detailed Guides (read when relevant)
- Database patterns: .claude/rules/database.md
- API design: .claude/rules/api-design.md
- Testing strategy: .claude/rules/testing.md

## Session Startup (run every new session)
1. `git log --oneline -20` — review recent changes
2. `cat progress.json` — check task status
3. Pick highest priority "pending" task
4. `bun run dev` — verify server starts
5. Begin work on selected task
