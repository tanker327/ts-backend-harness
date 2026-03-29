# TypeScript Backend Project — Harness Engineering Implementation Plan

> A step-by-step guide to building an AI Agent-First TypeScript backend project, combining the tech stack from `typescript-backend-stack.md` with best practices from the `Harness Engineering Playbook`.

---

## Overview: 4-Week Progressive Rollout

| Week | Theme | Deliverables |
|---|---|---|
| Week 1 | Minimum Viable Harness (MVH) + Project Skeleton | Runnable Hono project + CLAUDE.md + Hooks + ADR + Tests |
| Week 2 | Architectural Constraints + Feedback Loop Hardening | Layer dependency tests + Custom linter rules + Stop Hook |
| Week 3 | Data Layer + Auth + API Spec | Drizzle + Turso + Better Auth + OpenAPI |
| Week 4 | Queues / AI / Observability + Entropy Management | BullMQ + Pino + Background Agent tasks + Quality scores |

---

## Week 1: Minimum Viable Harness + Project Skeleton

### Step 1: Initialize the Project

```bash
# Create project directory
mkdir my-api && cd my-api
bun init

# Install core dependencies
bun add hono @hono/zod-openapi @hono/swagger-ui zod
bun add -d typescript vitest @vitest/coverage-v8 lefthook
```

**Verify**: `bun run index.ts` starts an empty Hono service.

---

### Step 2: Establish Directory Structure (Six-Layer Architecture)

```
my-api/
├── .claude/
│   ├── settings.json              # Claude Code Hooks
│   └── rules/                     # Context-triggered rule files
│       ├── database.md
│       ├── api-design.md
│       └── testing.md
├── CLAUDE.md                      # Pointer-style root instructions (under 50 lines)
├── docs/
│   ├── architecture.md            # Top-level layer map
│   ├── adr/
│   │   ├── template.md
│   │   └── 001-adopt-harness-engineering.md
│   ├── domains/                   # Deep docs by business domain
│   └── plans/
│       ├── active/
│       ├── completed/
│       └── debt/
├── src/
│   ├── types/                     # Layer 1: Pure type definitions + Zod schemas
│   │   └── index.ts
│   ├── config/                    # Layer 2: Environment variables (Zod validated)
│   │   └── env.ts
│   ├── repos/                     # Layer 3: Data access (Drizzle queries)
│   ├── services/                  # Layer 4: Business logic
│   ├── providers/                 # Cross-cutting: auth, telemetry
│   └── routes/                    # Layer 5: Hono routes (Runtime)
│       └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── architecture/              # Structural tests
│   │   └── layer-deps.test.ts
│   └── e2e/                       # Hurl files
├── scripts/
│   └── validate-deps.ts           # Dependency direction validation script
├── biome.json
├── tsconfig.json
├── lefthook.yml
├── vitest.config.ts
├── progress.json                  # Task progress tracking (JSON, not Markdown)
└── package.json
```

**Layer Dependency Rule**:

```
Types(1) → Config(2) → Repos(3) → Services(4) → Providers(5) → Routes(6)
Each layer may only depend on layers with a lower number.
```

---

### Step 3: Create CLAUDE.md (Under 50 Lines)

> Principle: For every line, ask "Would the Agent make a mistake if this line were removed?" If the answer is No, delete it.

```markdown
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
- Layer order: Types → Config → Repos → Services → Providers → Routes
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
```

---

### Step 4: Configure Pre-commit Hook (Lefthook)

```yaml
# lefthook.yml
pre-commit:
  parallel: true
  commands:
    biome-format:
      glob: "*.{ts,tsx,js,json}"
      run: bunx biome format --write {staged_files}
      stage_fixed: true
    biome-lint:
      glob: "*.{ts,tsx,js}"
      run: bunx biome check {staged_files}
    typecheck:
      glob: "*.{ts,tsx}"
      run: bunx tsc --noEmit
```

```bash
# Activate hooks
lefthook install
```

---

### Step 5: Configure Claude Code Hooks (`.claude/settings.json`)

> PostToolUse Hooks provide millisecond-level feedback; PreToolUse Hooks protect config files from Agent tampering.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "bunx biome format --write $CLAUDE_FILE_PATH 2>/dev/null; LINT_OUTPUT=$(bunx biome check $CLAUDE_FILE_PATH 2>&1); if [ -n \"$LINT_OUTPUT\" ]; then echo '{\"decision\": \"allow\", \"hookSpecificOutput\": {\"additionalContext\": \"Biome violations found:\\n'\"$LINT_OUTPUT\"'\"}}'; else echo '{\"decision\": \"allow\"}'; fi"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Write|Edit|MultiEdit",
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$CLAUDE_FILE_PATH\" | grep -qE '(biome\\.json|tsconfig\\.json|lefthook\\.yml)'; then echo '{\"decision\": \"block\", \"reason\": \"Modifying linter/build config is not allowed. Fix the code instead.\"}'; else echo '{\"decision\": \"allow\"}'; fi"
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "COMMAND=$(echo \"$(cat)\" | grep -oE '\"command\"\\s*:\\s*\"[^\"]*\"' | head -1 | sed 's/.*: *\"//;s/\"//'); if echo \"$COMMAND\" | grep -q '\\-\\-no-verify'; then echo '{\"decision\": \"block\", \"reason\": \"--no-verify is not allowed. Fix the issues reported by pre-commit hooks.\"}'; else echo '{\"decision\": \"allow\"}'; fi"
          }
        ]
      }
    ]
  }
}
```

---

### Step 6: Create the First ADR

```markdown
<!-- docs/adr/001-adopt-harness-engineering.md -->

# ADR-001: Adopt Harness Engineering + TypeScript Backend Stack

- **Status**: Accepted
- **Date**: 2026-03-22
- **Enforced by**: lefthook.yml, .claude/settings.json, tests/architecture/

## Context

The project uses AI Coding Agent (Claude Code) for development.
A systematic Harness is needed to ensure Agent output conforms to architectural standards and quality requirements.
Tech stack is based on Bun + Hono + Drizzle + Turso, as defined in typescript-backend-stack.md.

## Decision

1. Use CLAUDE.md as the Agent's pointer-style entry document (under 50 lines)
2. Use Lefthook to manage Pre-commit Hooks (Biome format + lint + tsc)
3. Use Claude Code PostToolUse Hooks for millisecond-level feedback loops
4. Use ADRs to record all architectural decisions
5. Six-layer architecture: Types → Config → Repos → Services → Providers → Routes
6. All architectural constraints enforced mechanically via linter rules and structural tests

## Consequences

### Positive
- Agent works within constraint boundaries, ensuring architectural consistency
- Every linter rule and test has a compounding effect across all future Agent sessions
- Feedback loop accelerated from human review (hours) to PostToolUse (milliseconds)

### Negative
- Upfront time investment required to build Harness infrastructure

### Enforcement
- Pre-commit: lefthook.yml (Biome + tsc)
- PostToolUse: .claude/settings.json
- Structure test: tests/architecture/layer-deps.test.ts
```

---

### Step 7: Establish Basic Test Suite

**vitest.config.ts**:

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/**/*.d.ts"],
    },
  },
});
```

**First test (`tests/unit/sanity.test.ts`)**:

```typescript
import { describe, it, expect } from "vitest";

describe("Test suite sanity check", () => {
  it("should pass basic assertion", () => {
    expect(1 + 1).toBe(2);
  });

  it("should verify test infrastructure works", () => {
    const result = { status: "ok", harness: "active" };
    expect(result).toHaveProperty("status", "ok");
    expect(result).toHaveProperty("harness", "active");
  });
});
```

**`package.json` scripts**:

```json
{
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "bunx biome check .",
    "format": "bunx biome format --write ."
  }
}
```

---

### Step 8: Create Hono Entry Point + Health Check

**`src/index.ts`**:

```typescript
import { serve } from "bun";
import { Hono } from "hono";
import { logger } from "hono/logger";

const app = new Hono();

app.use("*", logger());

app.get("/health", (c) => c.json({ status: "ok" }));

serve({ fetch: app.fetch, port: 3000 });
console.log("Server running on http://localhost:3000");

export default app;
```

---

### Step 9: Validate the MVH

```bash
# 1. Confirm CLAUDE.md is <= 50 lines
wc -l CLAUDE.md

# 2. Verify Lefthook is working
lefthook run pre-commit

# 3. Tests pass
bun run test

# 4. ADR directory exists
ls docs/adr/

# 5. Server starts successfully
bun run dev &
curl http://localhost:3000/health
# Expected: {"status":"ok"}

# 6. Intentionally introduce a lint error, verify Pre-commit catches it
```

**Week 1 Complete State**: A runnable Hono service + a complete three-pillar Harness foundation (Context Engineering + Architectural Constraints + Entropy Management basics).

---

## Week 2: Architectural Constraints + Feedback Loop Hardening

### Step 10: Write Layer Dependency Structural Tests

> Mechanical verification of dependency direction is 100x more reliable than documentation.

**`tests/architecture/layer-deps.test.ts`**:

```typescript
import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

const LAYERS: Record<string, number> = {
  types: 1,
  config: 2,
  repos: 3,
  services: 4,
  providers: 5,
  routes: 6,
};

function getImports(filePath: string): string[] {
  const content = fs.readFileSync(filePath, "utf-8");
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  const imports: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

function getSourceLayer(filePath: string): string | null {
  for (const layer of Object.keys(LAYERS)) {
    if (filePath.includes(`/src/${layer}/`)) return layer;
  }
  return null;
}

function getTargetLayer(importPath: string): string | null {
  for (const layer of Object.keys(LAYERS)) {
    if (importPath.includes(`/${layer}/`) || importPath.includes(`/${layer}`)) {
      return layer;
    }
  }
  return null;
}

function getAllTsFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") {
      results.push(...getAllTsFiles(fullPath));
    } else if (entry.isFile() && /\.tsx?$/.test(entry.name) && !entry.name.includes(".test.")) {
      results.push(fullPath);
    }
  }
  return results;
}

describe("Architecture Layer Dependencies", () => {
  const srcDir = path.resolve(__dirname, "../../src");
  const allFiles = getAllTsFiles(srcDir);

  it("should not have upward layer dependencies", () => {
    const violations: string[] = [];

    for (const file of allFiles) {
      const sourceLayer = getSourceLayer(file);
      if (!sourceLayer) continue;
      const sourceOrder = LAYERS[sourceLayer];

      for (const imp of getImports(file)) {
        const targetLayer = getTargetLayer(imp);
        if (!targetLayer) continue;
        if (LAYERS[targetLayer] > sourceOrder) {
          violations.push(
            `${path.relative(srcDir, file)} (${sourceLayer}) imports from ${targetLayer}`
          );
        }
      }
    }

    if (violations.length > 0) {
      expect.fail(
        [
          `Found ${violations.length} layer violation(s):`,
          ...violations.map((v) => `  - ${v}`),
          "",
          "WHY: Each layer may only import from layers with a lower number.",
          "     Types(1) → Config(2) → Repos(3) → Services(4) → Providers(5) → Routes(6)",
          "FIX: Move shared logic to a lower layer, or use Providers for cross-cutting concerns.",
          "REF: docs/architecture.md",
        ].join("\n")
      );
    }
  });
});
```

---

### Step 11: Create `docs/architecture.md`

```markdown
# Architecture

## Layer Diagram

| # | Layer | Directory | Responsibility | Allowed Dependencies |
|---|---|---|---|---|
| 1 | Types | src/types/ | Zod schemas, TS types, zero runtime | None |
| 2 | Config | src/config/ | Env validation (Zod + dotenv) | Types |
| 3 | Repos | src/repos/ | Data access (Drizzle ORM → Turso) | Types, Config |
| 4 | Services | src/services/ | Business logic orchestration | Types, Config, Repos |
| 5 | Providers | src/providers/ | Cross-cutting: auth, logging, rate-limit | Types, Config |
| 6 | Routes | src/routes/ | Hono route handlers (hono-zod-openapi) | Types, Config, Services, Providers |

## Dependency Rule

Dependencies MUST flow downward only (lower number → higher number is forbidden).

## Cross-cutting Concerns

Auth (Better Auth), Logging (Pino), Rate Limiting — injected via Providers, not imported directly in Routes.

## Request Flow

```
Request → CORS → Rate Limit → JWT Validation → Route Handler → Service → Repo → DB
```
```

---

### Step 12: Configure Biome (`biome.json`)

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.0/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error"
      },
      "complexity": {
        "noForEach": "warn"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "files": {
    "ignore": ["node_modules", "dist", "*.d.ts"]
  }
}
```

---

### Step 13: Create `.claude/rules/` On-Demand Rule Files

**`.claude/rules/database.md`**:

```markdown
# Database Rules

- ORM: Drizzle ORM only. No raw SQL unless wrapped in a repo function.
- All queries live in src/repos/. Route handlers NEVER touch the DB directly.
- Every user-owned table has a `userId` FK. Always scope queries by userId from JWT.
- userId comes from JWT payload (c.get('jwtPayload')), NEVER from request body/params.
- Single-resource fetches must double-check ownership. If record belongs to another user, return 404 (never leak existence).
- Migrations via Drizzle Kit. Run `bunx drizzle-kit generate` then `bunx drizzle-kit migrate`.
```

**`.claude/rules/api-design.md`**:

```markdown
# API Design Rules

- All routes use hono-zod-openapi for request/response validation + OpenAPI spec generation.
- REST for CRUD. SSE for streaming status.
- Bilingual response fields: `{ "en": "...", "zh": "..." }` where applicable.
- Error responses follow: `{ "error": { "code": "ERROR_CODE", "message": "..." } }`
- OpenAPI spec auto-generated — consumed by hey-api on frontend. No hand-written API docs.
```

**`.claude/rules/testing.md`**:

```markdown
# Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Schemas, utils, business logic in services |
| Integration | Vitest | Service + repo layer with test DB |
| Endpoint | Hurl | Live API contracts, auth flows, request chaining |
| Architecture | Vitest | Layer dependency direction validation |
| Coverage | @vitest/coverage-v8 | Unit + integration only |

- Every new route needs at least one Hurl endpoint test.
- Every new service function needs a unit test.
- Every agent mistake → add a test to prevent recurrence.
```

---

### Step 14: Configure Stop Hook (Completion Gate)

> When the Agent claims "done", tests run automatically. If they fail, the Agent cannot stop.

Append to the hooks section in `.claude/settings.json`:

```json
{
  "Stop": [
    {
      "hooks": [
        {
          "type": "command",
          "command": "if [ -z \"$STOP_HOOK_ACTIVE\" ]; then export STOP_HOOK_ACTIVE=1; RESULT=$(bun run test 2>&1); EXIT_CODE=$?; if [ $EXIT_CODE -ne 0 ]; then echo \"{\\\"decision\\\": \\\"block\\\", \\\"reason\\\": \\\"Tests failed. Fix before stopping:\\n$RESULT\\\"}\"; else echo '{\"decision\": \"allow\"}'; fi; else echo '{\"decision\": \"allow\"}'; fi"
        }
      ]
    }
  ]
}
```

---

## Week 3: Data Layer + Auth + API Spec

### Step 15: Configure Environment Variable Validation (`src/config/env.ts`)

```bash
bun add dotenv
```

```typescript
// src/config/env.ts
import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

> Zod validates at startup — missing config causes immediate fail-fast. All other files access config via `import { env } from "@/config/env"`. Direct `process.env` usage is forbidden.

**ADR-002**: Record "All environment variables validated via Zod schema; direct process.env access is prohibited."

---

### Step 16: Install Data Layer (Drizzle + Turso)

```bash
bun add drizzle-orm @libsql/client
bun add -d drizzle-kit
```

- Schema defined in `src/repos/schema.ts`
- Query functions in `src/repos/*.repo.ts`
- Migrations via `bunx drizzle-kit generate` + `bunx drizzle-kit migrate`
- Every user-owned table has a `userId` column; all queries scoped by userId

---

### Step 17: Install Auth Layer (Better Auth + JWT)

```bash
bun add better-auth
```

- Better Auth configured in `src/providers/auth.ts`
- JWT middleware via `hono/jwt`
- Request Flow: `CORS → Rate Limit → JWT → Route Handler`
- userId extracted from `c.get('jwtPayload')` and injected into all DB queries

**ADR-003**: Record "userId is always extracted from JWT; never trust client-provided identity."

---

### Step 18: Configure OpenAPI Routes (hono-zod-openapi)

```bash
bun add @hono/swagger-ui
```

- Each route defined with `createRoute()` using Zod schemas → auto-generates OpenAPI spec
- Swagger UI mounted at `/docs`
- Frontend consumes OpenAPI spec via hey-api — no hand-written API docs

---

### Step 19: Install Hurl for Endpoint Testing

```bash
brew install hurl
```

**`tests/e2e/health.hurl`**:

```hurl
# Health check
GET http://localhost:3000/health
HTTP 200
[Asserts]
jsonpath "$.status" == "ok"
```

Run: `hurl --test tests/e2e/*.hurl`

---

## Week 4: Queues / AI / Observability + Entropy Management

### Step 20: Install Logging (Pino + hono-pino)

```bash
bun add pino hono-pino
```

- Structured JSON logging
- Automatic request/response logging
- Add `logger.info()` / `logger.debug()` for key business operations

---

### Step 21: Install Queue System (BullMQ + Redis)

```bash
bun add bullmq
```

- Workers defined in the corresponding service files under `src/services/`
- Redis runs via Docker Compose
- Bull Board mounted at `/admin/queues` (development only)

**`docker-compose.yml`**:

```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data

volumes:
  redis-data:
```

---

### Step 22: AI Integration

```bash
bun add @anthropic-ai/sdk
```

- AI processor functions live in `src/services/`
- Called asynchronously via BullMQ queues
- Streaming responses use SSE

---

### Step 23: Establish Entropy Management Mechanisms

#### 23a. Create `progress.json` (Task Tracking)

```json
{
  "project": "my-api",
  "last_updated": "2026-03-22T10:00:00Z",
  "current_sprint": "v0.1.0",
  "tasks": []
}
```

#### 23b. Create Quality Scores File `docs/quality/scores.json`

```json
{
  "last_scanned": "2026-03-22",
  "layers": {
    "types": { "coverage": 0, "lint_violations": 0, "notes": "" },
    "config": { "coverage": 0, "lint_violations": 0, "notes": "" },
    "repos": { "coverage": 0, "lint_violations": 0, "notes": "" },
    "services": { "coverage": 0, "lint_violations": 0, "notes": "" },
    "providers": { "coverage": 0, "lint_violations": 0, "notes": "" },
    "routes": { "coverage": 0, "lint_violations": 0, "notes": "" }
  }
}
```

#### 23c. Core Loop

> Every time the Agent makes a mistake, do one of the following:

1. Add a test (prevent functional regression)
2. Add a linter rule (prevent the same class of violation)
3. Update CLAUDE.md or an ADR (prevent directional drift)

---

## Session Management: Standard Startup Routine

Add to the bottom of CLAUDE.md:

```markdown
## Session Startup (run every new session)
1. `git log --oneline -20` — review recent changes
2. `cat progress.json` — check task status
3. Pick highest priority "pending" task
4. `bun run dev` — verify server starts
5. Begin work on selected task
```

---

## Feedback Loop Quick Reference

| Tier | Speed | Mechanism | Tool |
|---|---|---|---|
| Tier 1 | Milliseconds | PostToolUse Hook | Biome format + check |
| Tier 2 | Seconds | Pre-commit Hook (Lefthook) | Biome + tsc --noEmit |
| Tier 3 | Minutes | CI/CD | Vitest + Hurl full suite |
| Tier 4 | Hours | Human Review | PR review |

---

## Key ADR Checklist

| ADR | Title | Enforcement |
|---|---|---|
| 001 | Adopt Harness Engineering | lefthook + hooks + structural tests |
| 002 | Env vars validated via Zod | Biome custom rule banning process.env |
| 003 | userId extracted from JWT | Code review + integration tests |
| 004 | No direct DB queries in Routes | Structural test layer-deps.test.ts |
| 005 | Agent cannot modify config files | PreToolUse Hook |

---

## Common Anti-Pattern Checklist

| # | Anti-Pattern | Defense |
|---|---|---|
| 1 | Agent tampers with Biome/TS config | PreToolUse Hook blocks it |
| 2 | Agent uses `--no-verify` to skip hooks | PreToolUse Hook blocks it |
| 3 | Agent claims "done" but tests fail | Stop Hook auto-verifies |
| 4 | CLAUDE.md bloats beyond 50 lines | Regular review; move details to .claude/rules/ |
| 5 | Agent writes SQL directly in route layer | Structural test + linter rule |
| 6 | Descriptive docs rot silently | Replace prose docs with tests / ADRs / types |
| 7 | Skipping planning, jumping to execution | Have Agent produce a plan first, review before coding |

---

## Full Dependency List

```bash
# Core
bun add hono @hono/zod-openapi @hono/swagger-ui zod dotenv

# Data layer
bun add drizzle-orm @libsql/client

# Auth
bun add better-auth

# Queue
bun add bullmq

# Logging
bun add pino hono-pino

# AI
bun add @anthropic-ai/sdk

# S3
bun add @aws-sdk/client-s3

# Dev dependencies
bun add -d typescript vitest @vitest/coverage-v8 lefthook drizzle-kit
```

System tools (not npm):

```bash
brew install lefthook hurl
```

---

## Core Principles Recap

1. **The repo is the single source of truth** — What the Agent can't see doesn't exist
2. **Map over manual** — CLAUDE.md stays at 50 lines, pointing to docs/
3. **Mechanisms over prompts for quality** — Hooks > documentation guidelines
4. **Constrain invariants, don't micromanage implementation** — Linter rules + structural tests
5. **Faster feedback is always better** — PostToolUse(ms) > Pre-commit(s) > CI(min) > Review(hr)
6. **Separate planning from execution** — Produce a plan first, review it, then code
7. **Every Agent mistake strengthens the Harness** — One test, one rule, or one ADR
