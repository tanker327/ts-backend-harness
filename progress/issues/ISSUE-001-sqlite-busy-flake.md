# ISSUE-001: SQLITE_BUSY flake in parallel e2e tests

## Status: open
## Severity: non-blocker (intermittent, does not block any task)
## First seen: 2026-03-29

## Summary
When running the full test suite, multiple e2e test files hit the SQLite database concurrently, causing `SQLITE_BUSY: database is locked` errors. Individual test files pass reliably in isolation.

## Affected tests
- `tests/e2e/author-accounts.test.ts` — fails intermittently on duplicate 409 check or seed/cleanup
- `tests/e2e/health.test.ts` — fails intermittently during seed/cleanup
- `tests/e2e/contents.test.ts` — may also be affected

## Error evidence

```
SQLITE_BUSY: database is locked

 ❯ tests/e2e/author-accounts.test.ts
   → POST /author-accounts > rejects duplicate platform + accountId with 409
   Expected: 409
   Received: 500

   The route returns 500 because the underlying SQLite error is SQLITE_BUSY
   (concurrency lock), not a UNIQUE constraint violation.
```

```
 Test Files  1 failed | 7 passed (8)
      Tests  1 failed | 34 passed (35)
```

## Root cause analysis
- Vitest runs test files in parallel by default
- All e2e test files share the same SQLite database (`data/test.db`)
- `beforeEach` / `beforeAll` cleanup queries compete for write locks
- SQLite only allows one writer at a time — concurrent writes from different test files cause SQLITE_BUSY

## Potential fixes
1. **Run e2e tests sequentially** — add `pool: 'forks', poolOptions: { forks: { singleFork: true } }` or use `--sequence` for e2e files
2. **Isolate databases per test file** — each e2e file gets its own `.db` file
3. **Add WAL mode** — `PRAGMA journal_mode=WAL` allows concurrent reads + single writer with less locking
4. **Retry on SQLITE_BUSY** — configure `busy_timeout` pragma (quick fix but masks the real issue)
5. **Split vitest config** — separate configs for unit vs e2e with different concurrency settings
