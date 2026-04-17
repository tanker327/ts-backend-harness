#!/usr/bin/env bash
# Bootstrap the project from a clean checkout to a running state.
set -euo pipefail

echo "==> Installing dependencies..."
bun install

# Create .env from template if missing
if [ ! -f .env ]; then
  cp .env.example .env
  echo "==> Created .env from .env.example — edit secrets before production use"
else
  echo "==> .env already exists, skipping"
fi

# Ensure data directory exists
mkdir -p data

# Push schema to local DB
echo "==> Pushing schema to local database..."
bunx drizzle-kit push --force --dialect sqlite --schema ./src/repos/schema.ts --url "file:./data/local.db"

# Start Redis if Docker is available
if command -v docker &> /dev/null; then
  echo "==> Starting Redis via docker compose..."
  docker compose up -d redis
else
  echo "==> Warning: Docker not found — Redis/BullMQ features will not work"
fi

# Run tests as smoke check
echo "==> Running tests..."
bun run test

echo ""
echo "==> Init complete. Run 'bun run dev' to start the server."
