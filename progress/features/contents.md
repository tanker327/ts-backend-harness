# Feature: Contents (Full 6-Layer CRUD)

## Goal
Store external content (posts, articles, videos, etc.) across platforms. Second domain feature after author_accounts. FK to `author_accounts` for author attribution, self-referencing `parent_id` for threads/replies.

This is shared reference data, not user-owned, so no `userId` FK.

## Schema

```sql
CREATE TABLE contents (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,                  -- 'x' | 'youtube' | 'instagram' | 'web' | 'rss' | 'note'
  source_id TEXT,
  url TEXT,
  author_account_id TEXT REFERENCES author_accounts(id),
  parent_id TEXT REFERENCES contents(id),
  title TEXT,
  text TEXT,
  text_format TEXT DEFAULT 'plain',        -- 'plain' | 'markdown' | 'html'
  slug TEXT,
  language TEXT,                           -- 'zh' | 'en' | 'mixed'
  content_type TEXT,                       -- 'post' | 'article' | 'video' | 'reel' | 'thread' | 'podcast' | 'note'
  likes INTEGER,
  reposts INTEGER,
  replies INTEGER,
  views INTEGER,
  bookmarks INTEGER,
  status TEXT NOT NULL DEFAULT 'fetched',  -- 'fetched' | 'understanding' | 'analyzing' | 'done' | 'partial' | 'failed'
  rating INTEGER,                          -- optional personal score 1–5
  posted_at INTEGER,
  fetched_at INTEGER,
  archived_at INTEGER,
  read_at INTEGER,
  meta TEXT,
  raw_payload TEXT,
  UNIQUE (platform, source_id)
);
```

## Implementation Steps

### 1. Types — `src/types/content.ts`
Zod schemas for validation + OpenAPI spec generation:
- `contentPlatformSchema` — z.enum(['x', 'youtube', 'instagram', 'web', 'rss', 'note'])
- `textFormatSchema` — z.enum(['plain', 'markdown', 'html'])
- `contentTypeSchema` — z.enum(['post', 'article', 'video', 'reel', 'thread', 'podcast', 'note'])
- `contentStatusSchema` — z.enum(['fetched', 'understanding', 'analyzing', 'done', 'partial', 'failed'])
- `languageSchema` — z.enum(['zh', 'en', 'mixed'])
- `createContentSchema` — POST body (platform required, rest optional except id/status)
- `updateContentSchema` — PUT body (all optional, partial update)
- `contentSchema` — full response shape with id + all fields

### 2. Schema — update `src/repos/schema.ts`
- Add `unique` to drizzle-orm/sqlite-core import
- Add `contents` table after `authorAccounts` definition
- Drizzle column mapping:
  - `text()` for all string columns
  - `integer()` for engagement metrics + rating
  - `integer({ mode: "timestamp" })` for `postedAt`, `fetchedAt`, `archivedAt`, `readAt`
  - `.references(() => authorAccounts.id)` for author FK
  - `.references(() => contents.id)` for self-referencing parent FK
  - Composite unique: `(t) => [unique("contents_platform_source_id").on(t.platform, t.sourceId)]`
- Note: self-referencing FK works in Drizzle via lazy callback pattern

### 3. Repo — `src/repos/contents.ts`
CRUD data access:
- `createContent(data)` — insert + returning
- `getContentById(id)` — select by PK
- `listContents(opts?: { platform?, status?, contentType?, authorAccountId? })` — list with optional filters
- `updateContent(id, data)` — partial update, returning
- `deleteContent(id)` — delete by PK, returning

### 4. Service — `src/services/contents.ts`
Business logic:
- `create(data)` — generate UUID, default status to 'fetched', set fetchedAt to now, call repo
- `getById(id)` — passthrough, return null if not found
- `list(opts?)` — passthrough with filter validation
- `update(id, data)` — call repo, return updated or null
- `remove(id)` — call repo, return success or null

### 5. Routes — `src/routes/contents.ts`
REST endpoints with zod-openapi:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/contents` | Create |
| GET | `/contents` | List (optional `?platform=`, `?status=`, `?content_type=`, `?author_account_id=`) |
| GET | `/contents/:id` | Get by ID |
| PUT | `/contents/:id` | Update |
| DELETE | `/contents/:id` | Delete |

Register via `registerContentRoutes(app)` in `src/routes/index.ts`.

### 6. Tests
- `tests/unit/services/contents.test.ts` — unit tests for service (UUID gen, default status, fetchedAt)
- `tests/e2e/contents.test.ts` — e2e tests for all endpoints (create, get, list+filters, update, delete, 404s, duplicate platform+source_id)
- Update `tests/e2e/helpers.ts` — add contents to cleanTestData

### 7. Migration + Verify
```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
bun run test
bunx biome check .
```

## Dependencies
- TASK-014 (author_accounts CRUD) must be completed first — contents has FK to author_accounts

## Not in scope
- Pagination (add when needed)
- Lookup by platform+source_id endpoint (add when ingestion pipeline needs it)
- Children/thread traversal endpoint (add when needed)
- Auth middleware (separate concern)
