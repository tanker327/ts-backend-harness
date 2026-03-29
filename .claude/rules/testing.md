# Testing Strategy

| Layer | Tool | Scope |
|---|---|---|
| Unit | Vitest | Schemas, utils, business logic in services |
| Integration | Vitest | Service + repo layer with test DB |
| Endpoint | Vitest + app.request() | API contracts, auth flows, request chaining |
| Architecture | Vitest | Layer dependency direction validation |
| Coverage | @vitest/coverage-v8 | Unit + integration only |

- Every new route needs at least one e2e test in tests/e2e/.
- Every new service function needs a unit test.
- Every agent mistake -> add a test to prevent recurrence.
