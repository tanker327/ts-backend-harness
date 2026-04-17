# ADR-004: TypeScript with Strict Mode

- **Status**: Accepted (backfilled 2026-04-17)
- **Date**: 2026-04-17
- **Enforced by**: `tsconfig.json` (`strict: true`), Lefthook pre-commit `bunx tsc --noEmit`

## Context

The project is a template intended to demonstrate best practices for AI-agent-assisted development. Agents produce a lot of code quickly, and the type system is the cheapest mechanical check available to catch mistakes before they reach runtime or review.

Loose TypeScript (no `strict`, implicit `any`, `strictNullChecks: false`) erases most of that value. Strict mode is a one-time setup cost that pays back on every agent-written line.

## Decision

Use TypeScript with `strict: true` in `tsconfig.json`. This enables:

- `strictNullChecks` — no accidental null/undefined access
- `noImplicitAny` — every untyped value is an error
- `strictFunctionTypes`, `strictBindCallApply`, `strictPropertyInitialization`
- `alwaysStrict`, `noImplicitThis`, `useUnknownInCatchVariables`

Pre-commit runs `bunx tsc --noEmit` to gate commits that break the type check. No `@ts-ignore` or `@ts-expect-error` without a comment explaining why.

## Consequences

### Positive
- Whole classes of runtime errors become compile errors
- Agents get fast feedback from the pre-commit hook
- Types serve as machine-checked documentation for function contracts
- Zod + TypeScript + `z.infer` (see ADR-008) make runtime and compile-time validation agree

### Negative
- Some third-party packages with weak types require `any` casts at boundaries
- Initial learning curve for contributors new to strict TS

### Enforcement
- `tsconfig.json` — `"strict": true`
- `lefthook.yml` — `typecheck: run: bunx tsc --noEmit`
- Any `@ts-ignore` must be accompanied by a comment explaining the specific reason
