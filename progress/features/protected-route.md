# Feature Plan: Protected Route — Full 6-Layer Flow (TASK-014)

refs ADR-005 (6-layer architecture), ADR-013 (userId from JWT)

## Goal
Build one CRUD endpoint that exercises all 6 architectural layers end-to-end, demonstrating the full request flow: `Request → CORS → Rate Limit → JWT → Route → Service → Repo → DB`

## Implementation

### Suggested domain: Tasks (simple CRUD)

**Layer 1 — Types** (`src/types/task.ts`):
- Zod schemas: CreateTaskSchema, UpdateTaskSchema, TaskResponseSchema
- TypeScript types inferred from schemas

**Layer 2 — Config**: No changes (env.ts already has DB config)

**Layer 3 — Repos** (`src/repos/task.repo.ts`):
- Drizzle schema: `tasks` table (id, title, description, status, userId, createdAt, updatedAt)
- Drizzle migration
- CRUD functions: findByUserId, findById, create, update, delete
- All queries scoped by userId (ADR-013)

**Layer 4 — Services** (`src/services/task.service.ts`):
- Business logic: createTask, getTask, listTasks, updateTask, deleteTask
- Ownership validation: findById checks userId match, returns null if mismatch

**Layer 5 — Providers**: No changes (auth.ts + logger.ts already exist)

**Layer 6 — Routes** (`src/routes/tasks.ts`):
- OpenAPI-spec routes via hono-zod-openapi
- `GET /api/tasks` — list user's tasks
- `GET /api/tasks/:id` — get single task (404 if not owned)
- `POST /api/tasks` — create task
- `PATCH /api/tasks/:id` — update task
- `DELETE /api/tasks/:id` — delete task
- All routes require JWT auth middleware

### Tests
- `tests/e2e/tasks.test.ts` — full CRUD flow with auth
- `tests/unit/services/task.test.ts` — business logic unit tests

### ADR
- No new ADR needed (follows existing ADR-001, 003, 004)

## Verification
- `bun run test` passes with new tests
- Layer dependency test still passes (no upward imports)
- OpenAPI spec at `/openapi.json` includes task endpoints
- Swagger UI at `/docs` shows task routes
