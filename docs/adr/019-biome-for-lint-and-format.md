# ADR-019: Biome for Lint and Format

- **Status**: Accepted (backfilled 2026-04-17)
- **Date**: 2026-04-17
- **Enforced by**: `biome.json`, `lefthook.yml` pre-commit, `package.json` scripts

## Context

The project needs lint + format. Two realistic stacks:

- **ESLint + Prettier** — the ubiquitous default. Two tools, two configs, two plugin ecosystems, occasional conflicts between Prettier and ESLint style rules. Slow on large codebases.
- **Biome** — single Rust-based tool that handles both lint and format with one config (`biome.json`). Fast. One plugin ecosystem (smaller, but growing).

For a template targeting fast feedback loops with AI agents, Biome's speed and single-config model matter more than ESLint's broader plugin ecosystem.

## Decision

Use **Biome** for both lint and format.

- Config: `biome.json` at repo root
- Lint: `bunx biome check .`
- Format: `bunx biome format --write .`
- Pre-commit (via Lefthook — ADR-020) runs both on staged files

### Active rule customization

On top of Biome's `recommended` rule set, the project enables:

- **`suspicious.noExplicitAny: error`** — bans `any` outright. Agents reach for `any` to make type errors go away; promoting this to an error forces them to express the real type or use `unknown` + narrowing. Pairs with `tsconfig.json` `strict: true` (ADR-004).
- **`complexity.noForEach: warn`** — nudges toward `for…of` / array methods that play better with `await` and early `return`. Warn (not error) because legitimate `forEach` cases exist.

Formatter: 2-space indent, 100-column line width. These are settled defaults — not up for debate per change; changing them is an ADR trigger (ADR-002).

Adding, removing, or re-severity-ing a rule is itself an architectural decision (it changes what the harness catches) and requires an ADR.

## Consequences

### Positive
- One tool, one config, one dependency
- Fast — pre-commit finishes in milliseconds on a typical change
- No ESLint/Prettier conflict class
- Simpler mental model for contributors

### Negative
- Smaller rule set than ESLint + TypeScript ESLint combined — some project-specific lints may not have an equivalent
- Younger ecosystem — edge cases may need workarounds
- Not every editor has first-class Biome integration (though VS Code, Zed, etc. now do)

### Enforcement
- `biome.json` is the only lint/format config
- Lefthook pre-commit runs `biome check` and `biome format --write` on staged files
- Adding ESLint / Prettier / another formatter is an ADR trigger (ADR-002)
