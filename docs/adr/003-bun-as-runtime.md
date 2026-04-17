# ADR-003: Bun as the JavaScript Runtime

- **Status**: Accepted (backfilled 2026-04-17; original adoption at project start, see ADR-001)
- **Date**: 2026-04-17
- **Enforced by**: `bun.lock`, `package.json` scripts, Lefthook running `bunx` commands

## Context

The project needs a server-side JavaScript runtime. The candidates at project inception were:

- **Node.js** — mature, ubiquitous, huge ecosystem, but slow startup and requires separate tools for TypeScript execution (tsx / ts-node), bundling, package management (npm/pnpm).
- **Deno** — built-in TypeScript and tooling, but smaller ecosystem and incompatible import semantics with most npm packages at the time.
- **Bun** — fast startup, native TypeScript support, bundled package manager + test runner + file watcher, drop-in compatible with npm packages via `node_modules`.

The project is a template for AI-agent-driven development. Fast feedback loops (startup, install, test) matter more than ecosystem maturity, because every second in the agent loop compounds.

## Decision

Use **Bun** as the runtime and toolchain for development and production.

- Package manager: `bun install`
- Script runner: `bun run`
- Watcher: `bun run --watch`
- Lockfile: `bun.lock`
- TypeScript: executed directly by Bun — no separate compile step for dev

Node.js compatibility is preserved where the `node:` import prefix is needed, but the project targets Bun first.

## Consequences

### Positive
- Near-instant startup in dev (`bun run --watch src/index.ts`)
- No TypeScript build step for running source
- Single tool for install, run, test (though we use Vitest instead of `bun test` — see ADR-016)
- Fast package installs

### Negative
- Smaller ecosystem of Bun-specific tooling than Node's
- Some npm packages with native bindings may require Node-compat shims
- Contributors must install Bun (`curl -fsSL https://bun.sh/install | bash`)

### Enforcement
- `bun.lock` in the repo root is authoritative — PRs with `package-lock.json` or `pnpm-lock.yaml` should be rejected
- `package.json` scripts all use `bun run` / `bunx`
- CI (when added) must install Bun, not Node
