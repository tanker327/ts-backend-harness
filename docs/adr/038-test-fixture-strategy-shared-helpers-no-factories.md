# ADR-038: Test Fixtures via Shared Helpers, Not Factory Libraries

- **Status**: Accepted
- **Date**: 2026-04-17
- **Enforced by**: `tests/e2e/helpers.ts` (shared fixtures), test conventions, code review

## Context

E2E tests need baseline data: a `TEST_USER` row so auth-scoped queries have a real user to scope to, and table cleanup between runs so tests are independent. Today this is handled by:

- `tests/e2e/helpers.ts` exports `TEST_USER`, `seedTestData()`, and `cleanTestData()`.
- Each e2e test file calls `seedTestData()` in `beforeAll`, `cleanTestData()` in `afterAll`, and a targeted `db.delete(<table>)` in `beforeEach` for the specific table under test.
- Route-specific data is built inline within each test using literal JSON payloads (see `validPayload` in `tests/e2e/contents.test.ts`).

No factory library (Factory Boy style, e.g. `@faker-js/faker` + a factory wrapper) is used. No JSON fixture files on disk. No auto-seed on test DB creation beyond what `seedTestData()` inserts.

## Decision

Keep the current approach as the convention:

1. **Shared helpers in `tests/e2e/helpers.ts`** own `TEST_USER` and any cross-test identity fixtures. Tests import from here, not duplicate the constants.
2. **Inline payloads per test** for domain data. A test that creates a content row builds the payload literally in the test file. Do not extract to a factory until at least three tests share the same payload shape.
3. **Test helpers may access `db` directly** (bypass the repo-pattern rule from ADR-011). This is deliberate: test setup needs to insert states that no production code path produces, so going through services would constrain what tests can express. The top-of-file comment in `tests/e2e/helpers.ts` documents this exception.
4. **Cleanup is explicit, not transactional.** Each test file calls the delete it needs in `beforeEach`; `cleanTestData()` in `afterAll` is a backstop. Transactional rollback-per-test was considered and rejected — it would make Better Auth's connection-pool-based session handling (ADR-030) misbehave.
5. **No seed script for dev DB.** Developers create data via the API or by hand. A seed script may be added later as an ADR supersession.

When any of these break down, adopt the next step:

- Three tests sharing a payload shape → extract to a shared helper (not a factory library yet).
- Five+ tests needing varied-but-valid data → introduce `@faker-js/faker` with a thin factory wrapper; write an ADR.
- Need to reproduce a production dataset snapshot → introduce a fixture-file loader; write an ADR.

## Consequences

### Positive
- Zero dependencies for test data: tests are readable in isolation, payloads are grep-able.
- The "tests use `db` directly" exception is explicit and confined to one file (`tests/e2e/helpers.ts`).
- No factory-DSL learning curve for new contributors.

### Negative
- Payload duplication across tests until the three-test threshold triggers extraction — minor churn.
- `cleanTestData()` must be kept in sync with the schema (`src/repos/schema.ts`) — a new table means a new delete line.
- No canonical way to seed dev DB; onboarding requires clicking through the API.

### Enforcement
- Code review rejects imports of `@faker-js/faker` or similar factory libraries without a superseding ADR.
- Code review rejects tests that bypass `seedTestData()` / `cleanTestData()` and manage their own cross-test fixtures.
- Adding a fixture-loader, factory library, or dev-seed script is an ADR trigger (ADR-002 — cross-cutting pattern).
