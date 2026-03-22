# ADR-002: Environment Variables Validated via Zod Schema

- **Status**: Accepted
- **Date**: 2026-03-22
- **Enforced by**: Biome lint rule, code review, structural convention

## Context

Unvalidated environment variables cause runtime failures that are hard to debug.
Direct `process.env` access scatters config concerns across the codebase.

## Decision

All environment variables are validated via a Zod schema in `src/config/env.ts`.
Direct `process.env` access is prohibited outside `src/config/`.
The app fails fast at startup if required env vars are missing or invalid.

## Consequences

### Positive
- Single source of truth for all config
- Fail-fast on startup — no runtime surprises
- Full type safety for env vars

### Negative
- Every new env var requires updating the schema

### Enforcement
- Convention: only `src/config/` may access `process.env`
- Code review + grep for `process.env` outside config
