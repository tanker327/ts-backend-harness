# Feature Plan: Auth E2E Tests (TASK-011)

refs ADR-013 (userId from JWT only), ADR-017 (e2e via app.request)

## Goal
Verify the Better Auth integration works end-to-end: registration, login, session handling, and JWT-scoped access.

## Implementation

### `tests/e2e/auth.test.ts`

**Test cases**:
1. **POST /api/auth/sign-up/email** — register a new user, expect 200 + session cookie
2. **POST /api/auth/sign-in/email** — login with registered user, expect 200 + session cookie
3. **POST /api/auth/sign-in/email** — login with wrong password, expect 401
4. **GET /api/auth/session** — with valid session cookie, expect user data
5. **GET /api/auth/session** — without cookie, expect 401/empty
6. **POST /api/auth/sign-out** — sign out, confirm session invalidated

**Test setup**:
- Use existing `tests/e2e/helpers.ts` seedTestData/cleanTestData pattern
- Use `app.request()` with proper headers (Cookie, Content-Type)
- Each test cleans up created users via cleanTestData

### Dependencies
- TASK-006 must be resolved first (test infra must work)
- May need to verify Better Auth routes are mounted correctly in `src/index.ts`

## Verification
- `bun run test` passes including new auth tests
- Each test case covers a distinct auth flow path
