#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TOOL_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
APP_DIR="${TOOL_ROOT}/app"

if [ ! -f "${APP_DIR}/package.json" ]; then
  echo "[brandkit] package.json not found at ${APP_DIR}." >&2
  exit 1
fi

cd "${APP_DIR}"
npm install
npm run build
echo "[brandkit] Setup complete."
