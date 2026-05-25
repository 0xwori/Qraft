#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TOOL_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
APP_DIR="${TOOL_ROOT}/app"

if [ ! -f "${APP_DIR}/package-lock.json" ]; then
  echo "qraftPptx package-lock.json was not found at ${APP_DIR}." >&2
  exit 1
fi

cd "${APP_DIR}"

if [ ! -d "node_modules" ]; then
  npm ci
fi

if [ ! -f "packages/mcp-server/dist/runtime-cli.js" ]; then
  npm run build
fi

exec npm run start:ui
