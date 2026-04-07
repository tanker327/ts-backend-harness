# Database Rules

- ORM: Drizzle ORM only. No raw SQL unless wrapped in a repo function.
- All queries live in src/repos/. Route handlers NEVER touch the DB directly.
- Every user-owned table has a `userId` FK. Always scope queries by userId from JWT.
- userId comes from JWT payload (c.get('jwtPayload')), NEVER from request body/params.
- Single-resource fetches must double-check ownership. If record belongs to another user, return 404 (never leak existence).
- PostgreSQL runs via Docker Compose: dev on port 5432, test on port 5433 (separate `docker-compose.test.yml`).
- Migrations via Drizzle Kit. Run `bunx drizzle-kit generate` then `bunx drizzle-kit migrate`.
