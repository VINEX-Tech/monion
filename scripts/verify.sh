#!/usr/bin/env bash
# Runs the same checks as CI, except the PostgreSQL suite (see
# scripts/test-postgres.sh). Set FLUTTER to a Flutter binary if it is not on PATH.
set -euo pipefail
repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_dir"

npm run db:generate
npm run contracts:check
npm run lint
npm run typecheck
npm test
npm run build

if grep -rnE --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=build --exclude-dir=.dart_tool \
  '(rtsp://[^[:space:]]+:[^[:space:]@]+@|adminPassword[[:space:]]*=|cameraPassword[[:space:]]*=)' \
  apps packages infra; then
  echo 'Potential hardcoded credential found in source.' >&2
  exit 1
fi

flutter_bin="${FLUTTER:-flutter}"
if command -v "$flutter_bin" >/dev/null 2>&1; then
  (cd apps/mobile && "$flutter_bin" pub get && "$flutter_bin" analyze && "$flutter_bin" test)
else
  echo 'SKIP: Flutter SDK not found; set FLUTTER=/path/to/flutter to run mobile checks.'
fi
echo 'Monion verification passed.'
