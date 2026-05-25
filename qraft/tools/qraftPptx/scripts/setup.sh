#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TOOL_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
APP_DIR="${TOOL_ROOT}/app"

cd "${APP_DIR}"
npm ci
npm run build
