---
paths: ["src/routes/**"]
---

# API Design Rules

- All routes use hono-zod-openapi for request/response validation + OpenAPI spec generation.
- REST for CRUD. SSE for streaming status.
- Bilingual response fields: `{ "en": "...", "zh": "..." }` where applicable.
- Error responses follow: `{ "error": { "code": "ERROR_CODE", "message": "..." } }`
- OpenAPI spec auto-generated — consumed by hey-api on frontend. No hand-written API docs.
