#!/usr/bin/env bash
# Run Drizzle ORM database migrations: generate SQL from schema, then apply.
set -euo pipefail

echo "==> Generating migration files from schema..."
bunx drizzle-kit generate

echo "==> Applying migrations..."
bunx drizzle-kit migrate

echo "==> Migrations complete."
