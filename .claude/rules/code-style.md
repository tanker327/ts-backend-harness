---
paths: ["src/**", "tests/**"]
---

# Code Style Rules

- NO `process.env` outside `src/config/` — use the Zod-validated `env` object from `src/config/env.ts`
- NO editing `biome.json` / `tsconfig.json` / `lefthook.yml` — fix the code, not the tooling config
- Every new file must have a top-level JSDoc comment explaining its purpose
- Every exported function must have a brief JSDoc comment explaining what it does
