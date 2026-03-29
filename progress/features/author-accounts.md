# Feature: Author Accounts (Full 6-Layer CRUD)

## Goal
First domain feature — stores external content creator profiles across platforms (X, YouTube, Instagram, web, RSS). Exercises all 6 architectural layers: Types → Config → Repos → Services → Providers → Routes.

This is shared reference data, not user-owned, so no `userId` FK.

## Schema

```sql
CREATE TABLE author_accounts (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,            -- 'x' | 'youtube' | 'instagram' | 'web' | 'rss'
  account_id TEXT NOT NULL,          -- youtube: channelId
  account_url TEXT,
  handle TEXT,                       -- youtube: @Handle, x: @screenName
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  followers INTEGER,
  is_verified INTEGER DEFAULT 0,
  meta TEXT,                         -- JSON string for platform-specific data
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE (platform, account_id)
);
```

## Implementation Steps

### 1. Types — `src/types/author-account.ts`
Zod schemas for validation + OpenAPI spec generation:
- `platformSchema` — enum: x, youtube, instagram, web, rss
- `createAuthorAccountSchema` — POST body validation
- `updateAuthorAccountSchema` — PUT body (partial)
- `authorAccountSchema` — response shape (includes id, timestamps)

### 2. Schema — update `src/repos/schema.ts`
- Add `unique` to drizzle imports
- Add `authorAccounts` table using existing patterns
- `isVerified` → `integer({ mode: "boolean" }).default(false)`
- Composite unique: `(t) => [unique(...).on(t.platform, t.accountId)]`

### 3. Repo — `src/repos/author-accounts.ts`
CRUD data access:
- `createAuthorAccount(data)` — insert + returning
- `getAuthorAccountById(id)` — select by PK
- `getAuthorAccountByPlatformId(platform, accountId)` — select by unique pair
- `listAuthorAccounts(opts?: { platform? })` — list with optional filter
- `updateAuthorAccount(id, data)` — partial update, auto-set updatedAt
- `deleteAuthorAccount(id)` — delete by PK

### 4. Service — `src/services/author-accounts.ts`
Business logic:
- `create(data)` — generate UUID, set timestamps, call repo
- `getById(id)` — passthrough
- `getByPlatformId(platform, accountId)` — passthrough
- `list(opts?)` — passthrough
- `update(id, data)` — call repo, return updated or throw
- `remove(id)` — call repo, return success or throw

### 5. Routes — `src/routes/author-accounts.ts`
REST endpoints with zod-openapi:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/author-accounts` | Create |
| GET | `/author-accounts` | List (optional `?platform=` filter) |
| GET | `/author-accounts/:id` | Get by ID |
| PUT | `/author-accounts/:id` | Update |
| DELETE | `/author-accounts/:id` | Delete |

Register via `registerAuthorAccountRoutes(app)` in `src/routes/index.ts`.

### 6. Tests
- `tests/unit/services/author-accounts.test.ts` — unit tests for service
- `tests/e2e/author-accounts.test.ts` — e2e tests for all endpoints

### 7. Migration + Verify
```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
bun run test
bunx biome check .
```

## Not in scope
- Auth middleware (doesn't exist yet, separate concern)
- Pagination (add when needed)
