#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
QRAFT_CORE_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd -- "${QRAFT_CORE_ROOT}/.." && pwd)"

failures=0

pass() {
  printf 'PASS: %s\n' "$1"
}

warn() {
  printf 'WARN: %s\n' "$1"
}

fail() {
  failures=$((failures + 1))
  printf 'FAIL: %s\n' "$1"
}

check_file() {
  if [ -f "${REPO_ROOT}/$1" ]; then
    pass "$1 exists"
  else
    fail "$1 is missing"
  fi
}

check_core_file() {
  if [ -f "${QRAFT_CORE_ROOT}/$1" ]; then
    pass "qraft/$1 exists"
  else
    fail "qraft/$1 is missing"
  fi
}

check_file ".codex-plugin/plugin.json"
check_file ".mcp.json"
check_core_file "registry/projects.json"
check_core_file "registry/tools.json"
check_core_file "tools/qraftPptx/app/package-lock.json"

node --input-type=module - "${REPO_ROOT}" "${QRAFT_CORE_ROOT}" <<'NODE' || failures=$((failures + 1))
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.argv[2];
const qraftRoot = process.argv[3];
const readRepoJson = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const readQraftJson = (file) => JSON.parse(readFileSync(path.join(qraftRoot, file), "utf8"));

const plugin = readRepoJson(".codex-plugin/plugin.json");
if (plugin.name !== "qraft") throw new Error("plugin name must be qraft");
if (plugin.skills !== "./qraft/skills/") throw new Error("plugin skills must point to ./qraft/skills/");

const mcp = readRepoJson(".mcp.json");
const qraftPptx = mcp.mcpServers?.["qraftPptx"];
if (!qraftPptx) throw new Error("qraftPptx MCP server must be configured");
if (!qraftPptx.args?.includes("./qraft/tools/qraftPptx/scripts/start-qraftPptx-mcp.sh")) {
  throw new Error("qraftPptx MCP server must use the qraft tool script");
}

const projects = readQraftJson("registry/projects.json");
if (projects.schemaVersion !== 1) throw new Error("project registry schemaVersion must be 1");
if (!Array.isArray(projects.projects)) throw new Error("project registry projects must be an array");
for (const project of projects.projects) {
  if (!project.id || !project.name || !project.root) throw new Error("each project needs id, name, and root");
}

const tools = readQraftJson("registry/tools.json");
if (tools.schemaVersion !== 1) throw new Error("tool registry schemaVersion must be 1");
if (!Array.isArray(tools.tools)) throw new Error("tool registry tools must be an array");

console.log("PASS: plugin and registries parse correctly");
NODE

if git -C "${REPO_ROOT}" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  tracked_env="$(git -C "${REPO_ROOT}" ls-files | grep -E '(^|/)\.env($|\.)' | grep -v '\.env\.example$' || true)"
  if [ -z "${tracked_env}" ]; then
    pass "no tracked secret .env files"
  else
    fail "tracked secret .env files found: ${tracked_env}"
  fi
else
  warn "not inside a git worktree, skipped tracked .env check"
fi

if [ -d "${QRAFT_CORE_ROOT}/tools/qraftPptx/app/node_modules" ]; then
  pass "qraftPptx dependencies are installed"
else
  fail "qraftPptx dependencies are missing; run npm run qraftPptx:setup"
fi

if [ -f "${QRAFT_CORE_ROOT}/tools/qraftPptx/app/packages/mcp-server/dist/index.js" ]; then
  pass "qraftPptx MCP build exists"
else
  fail "qraftPptx MCP build is missing; run npm run qraftPptx:setup"
fi

if [ "${failures}" -eq 0 ]; then
  printf 'Qraft doctor passed.\n'
else
  printf 'Qraft doctor found %s issue(s).\n' "${failures}"
  exit 1
fi
