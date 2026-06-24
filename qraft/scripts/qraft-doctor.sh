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
check_file ".agents/plugins/marketplace.json"
check_core_file "registry/projects.json"
check_core_file "registry/tools.json"
check_core_file "tools/presentations/app/package-lock.json"
check_core_file "tools/ad-posters/app/package-lock.json"

node --input-type=module - "${REPO_ROOT}" "${QRAFT_CORE_ROOT}" <<'NODE' || failures=$((failures + 1))
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.argv[2];
const qraftRoot = process.argv[3];
const readRepoJson = (file) => JSON.parse(readFileSync(path.join(root, file), "utf8"));
const readQraftJson = (file) => JSON.parse(readFileSync(path.join(qraftRoot, file), "utf8"));

const plugin = readRepoJson(".codex-plugin/plugin.json");
if (plugin.name !== "qraft") throw new Error("plugin name must be qraft");
if (plugin.skills !== "./skills/") throw new Error("plugin skills must point to ./skills/");

const marketplace = readRepoJson(".agents/plugins/marketplace.json");
const marketplacePlugin = marketplace.plugins?.find((item) => item.name === "qraft");
if (!marketplacePlugin) throw new Error("marketplace must include qraft plugin");
if (marketplacePlugin.source?.path !== "./plugins/qraft") {
  throw new Error("marketplace qraft source must point to ./plugins/qraft");
}

const wrapperPlugin = readRepoJson("plugins/qraft/.codex-plugin/plugin.json");
if (wrapperPlugin.name !== "qraft") throw new Error("plugins/qraft plugin wrapper must be named qraft");
if (wrapperPlugin.skills !== "./skills/") throw new Error("plugins/qraft plugin wrapper skills must point to ./skills/");

const mcp = readRepoJson(".mcp.json");
const presentations = mcp.mcpServers?.["presentations"];
if (!presentations) throw new Error("Presentations MCP server must be configured");
if (!presentations.args?.includes("./qraft/tools/presentations/scripts/start-presentations-mcp.sh")) {
  throw new Error("Presentations MCP server must use the qraft tool script");
}
const adPosters = mcp.mcpServers?.["ad-posters"];
if (!adPosters) throw new Error("Ad Posters MCP server must be configured");
if (!adPosters.args?.includes("./qraft/tools/ad-posters/scripts/start-ad-posters-mcp.sh")) {
  throw new Error("Ad Posters MCP server must use the qraft tool script");
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

if [ -L "${REPO_ROOT}/skills" ] && [ "$(readlink "${REPO_ROOT}/skills")" = "qraft/skills" ]; then
  pass "skills points to qraft/skills"
else
  fail "skills symlink is missing or points to the wrong path"
fi

if [ -f "${REPO_ROOT}/plugins/qraft/.codex-plugin/plugin.json" ] && [ -d "${REPO_ROOT}/plugins/qraft/skills" ]; then
  pass "plugins/qraft wrapper exists"
else
  fail "plugins/qraft wrapper is missing"
fi

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

if [ -d "${QRAFT_CORE_ROOT}/tools/presentations/app/node_modules" ]; then
  pass "Presentations dependencies are installed"
else
  fail "Presentations dependencies are missing; run npm run presentations:setup"
fi

if [ -f "${QRAFT_CORE_ROOT}/tools/presentations/app/packages/mcp-server/dist/index.js" ]; then
  pass "Presentations MCP build exists"
else
  fail "Presentations MCP build is missing; run npm run presentations:setup"
fi

if [ -d "${QRAFT_CORE_ROOT}/tools/ad-posters/app/node_modules" ]; then
  pass "Ad Posters dependencies are installed"
else
  fail "Ad Posters dependencies are missing; run bash qraft/tools/ad-posters/scripts/setup.sh"
fi

if [ -f "${QRAFT_CORE_ROOT}/tools/ad-posters/app/packages/mcp-server/dist/index.js" ]; then
  pass "Ad Posters MCP build exists"
else
  fail "Ad Posters MCP build is missing; run bash qraft/tools/ad-posters/scripts/setup.sh"
fi

# Claude Desktop integration is optional and per-machine, so this section only warns.
DESKTOP_CONFIG="${CLAUDE_DESKTOP_CONFIG:-${HOME}/Library/Application Support/Claude/claude_desktop_config.json}"
if [ -f "${DESKTOP_CONFIG}" ]; then
  desktop_status="$(
    node --input-type=module - "${DESKTOP_CONFIG}" <<'NODE' 2>/dev/null || echo "PARSE_ERROR"
import { existsSync, readFileSync } from "node:fs";

const configPath = process.argv[2];
const config = JSON.parse(readFileSync(configPath, "utf8"));
const servers = config.mcpServers ?? {};
const expected = ["qraft-presentations", "qraft-brandkit"];
const present = expected.filter((name) => servers[name]);
if (present.length === 0) {
  console.log("NOT_CONFIGURED");
} else {
  const missingCmd = present.filter((name) => {
    const cmd = servers[name].command;
    return cmd && cmd.startsWith("/") && !existsSync(cmd);
  });
  console.log(missingCmd.length ? `BAD_COMMAND:${missingCmd.join(",")}` : "OK");
}
NODE
  )"
  case "${desktop_status}" in
    OK) pass "Claude Desktop config has qraft servers" ;;
    NOT_CONFIGURED) warn "Claude Desktop config found but no qraft servers; run: bash qraft/scripts/qraft-claude-desktop.sh" ;;
    BAD_COMMAND:*) warn "Claude Desktop qraft server command path does not resolve (${desktop_status#BAD_COMMAND:}); re-run: bash qraft/scripts/qraft-claude-desktop.sh" ;;
    *) warn "Claude Desktop config could not be parsed: ${DESKTOP_CONFIG}" ;;
  esac
else
  warn "Claude Desktop not configured (optional); run: bash qraft/scripts/qraft-claude-desktop.sh"
fi

if [ "${failures}" -eq 0 ]; then
  printf 'Qraft doctor passed.\n'
else
  printf 'Qraft doctor found %s issue(s).\n' "${failures}"
  exit 1
fi
