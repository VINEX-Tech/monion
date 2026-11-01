#!/usr/bin/env bash
# Starts a throwaway PostgreSQL from infra/compose.yaml, applies the
# migrations, checks the schema has no drift, and runs the PostgreSQL suite.
set -euo pipefail
repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"

port="${POSTGRES_PORT:-55432}"
password="${POSTGRES_PASSWORD:-local-test-only}"
project="monion-test"
export POSTGRES_PORT="$port" POSTGRES_PASSWORD="$password"
export DATABASE_URL="postgresql://monion:${password}@localhost:${port}/monion?schema=public"

cleanup() { docker compose -p "$project" -f infra/compose.yaml down -v >/dev/null 2>&1 || true; }
trap cleanup EXIT

docker compose -p "$project" -f infra/compose.yaml up -d --wait postgres
npm run db:generate
npm run db:deploy
npm run db:check
npm run test:integration
