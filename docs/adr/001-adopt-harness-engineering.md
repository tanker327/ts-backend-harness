# ADR-001: Adopt Harness Engineering + TypeScript Backend Stack

- **Status**: Accepted
- **Date**: 2026-03-22
- **Enforced by**: lefthook.yml, .claude/settings.json, tests/architecture/

## Context

The project uses AI Coding Agent (Claude Code) for development.
A systematic Harness is needed to ensure Agent output conforms to architectural standards and quality requirements.
Tech stack is based on Bun + Hono + Drizzle + Turso, as defined in typescript-backend-stack.md.

## Decision

1. Use CLAUDE.md as the Agent's pointer-style entry document (under 50 lines)
2. Use Lefthook to manage Pre-commit Hooks (Biome format + lint + tsc)
3. Use Claude Code PostToolUse Hooks for millisecond-level feedback loops
4. Use ADRs to record all architectural decisions
5. Six-layer architecture: Types -> Config -> Repos -> Services -> Providers -> Routes
6. All architectural constraints enforced mechanically via linter rules and structural tests

## Consequences

### Positive
- Agent works within constraint boundaries, ensuring architectural consistency
- Every linter rule and test has a compounding effect across all future Agent sessions
- Feedback loop accelerated from human review (hours) to PostToolUse (milliseconds)

### Negative
- Upfront time investment required to build Harness infrastructure

### Enforcement
- Pre-commit: lefthook.yml (Biome + tsc)
- PostToolUse: .claude/settings.json
- Structure test: tests/architecture/layer-deps.test.ts
