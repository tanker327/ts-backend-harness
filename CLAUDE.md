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
- When a user raises an improvement or fix, ask whether to implement it now or add it to progress tasks for later — let the user decide
- One feature per task — do not bundle unrelated changes
- Before implementing any change, consider if it is an architectural decision — if yes, create or update the ADR first, then implement
- Additional rules auto-load from .claude/rules/ based on file context

## Decision Records
- ADRs: docs/adr/
- Template: docs/adr/template.md

## Task Management
- Current tasks: progress/current.json — read at session start, update as you work
- Feature plans: progress/features/<name>.md — detailed plans, only read when a task references it
- Archived sprints: progress/archive/
- Update task status to "in_progress" when starting, "completed" when done (add completed_at + commit)
- You may update status, subtasks, and notes — do NOT create top-level tasks without human approval
- If you discover needed work, note it in the current task's notes field
- Keep notes short (1-2 sentences) — detailed plans go in progress/features/
- All plans MUST be created in progress/features/<name>.md inside the repo — never use ~/.claude/plans/ (not shareable with the team)

## Planning Workflow
1. Discuss — align on requirements with the user
2. Ask — implement now or add to progress tasks for later? Let the user decide before proceeding
3. ADR — create docs/adr/ entry if it's an architectural decision
4. Feature plan — write detailed implementation plan in progress/features/<name>.md
5. Tasks — add tasks to progress/current.json referencing the plan and ADR
6. User reviews — get approval before starting execution
7. Execute — work through tasks by priority order, commit with refs TASK-XXX

## Session Startup (run every new session)
1. `git pull` — pull latest from remote before starting
2. `git log --oneline -20` — review recent changes
3. `cat progress/current.json` — check task status
4. Pick highest priority "pending" task (skip tasks with unmet depends_on)
5. `bun run dev` — verify server starts
6. Begin work on selected task
