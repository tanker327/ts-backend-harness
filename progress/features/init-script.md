# Feature Plan: Startup Script (TASK-009)

## Goal
Create `scripts/init.sh` so any new session or contributor can go from clean checkout to running app in one command.

## Implementation

### `scripts/init.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail

# 1. Install dependencies
bun install

# 2. Create .env from template if missing
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — edit secrets before production use"
fi

# 3. Ensure data/ directory exists
mkdir -p data

# 4. Push schema to local DB
bunx drizzle-kit push --force

# 5. Start Redis (if docker compose available)
if command -v docker &> /dev/null; then
  docker compose up -d redis
  echo "Redis started via docker compose"
else
  echo "Warning: Docker not found — Redis/BullMQ features will not work"
fi

# 6. Smoke test
bun run test
echo "Init complete. Run 'bun run dev' to start the server."
```

### Updates
- Add `"init": "bash scripts/init.sh"` to package.json scripts
- Reference in CLAUDE.md Session Startup section

## Verification
- Run `bash scripts/init.sh` from a clean state (delete node_modules, data/local.db)
- Confirm all steps pass and server starts after
