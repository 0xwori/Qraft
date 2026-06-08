#!/usr/bin/env bash
set -euo pipefail

# Generate or merge a Claude Desktop MCP config from Qraft's .mcp.json.
#
# Claude Desktop loads local MCP servers from its own config file (not .mcp.json),
# and macOS GUI apps do not inherit your shell PATH. So this script translates
# Qraft's relative .mcp.json into Desktop's format with absolute command/args paths
# and an explicit env.PATH, then merges it into the Desktop config (Qraft entries
# are namespaced so non-Qraft servers are preserved).
#
# Usage:
#   bash qraft/scripts/qraft-claude-desktop.sh           # merge into Desktop config
#   bash qraft/scripts/qraft-claude-desktop.sh --print    # print snippet, write nothing
#
# Env overrides:
#   CLAUDE_DESKTOP_CONFIG=/path/to/claude_desktop_config.json

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
QRAFT_CORE_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd -- "${QRAFT_CORE_ROOT}/.." && pwd)"

PRINT_ONLY=0
if [ "${1:-}" = "--print" ]; then
  PRINT_ONLY=1
fi

if [ ! -f "${REPO_ROOT}/.mcp.json" ]; then
  printf 'FAIL: %s/.mcp.json not found. Run Qraft setup first.\n' "${REPO_ROOT}" >&2
  exit 1
fi

# Resolve absolute paths for the launchers Desktop will spawn. macOS GUI apps
# start with a minimal PATH, so we pin these and pass the current PATH through.
BASH_BIN="$(command -v bash || true)"
NODE_BIN="$(command -v node || true)"
CURRENT_PATH="${PATH}"

# Default Claude Desktop config location (macOS). Allow override for other OSes/tests.
DEFAULT_CONFIG="${HOME}/Library/Application Support/Claude/claude_desktop_config.json"
CONFIG_PATH="${CLAUDE_DESKTOP_CONFIG:-${DEFAULT_CONFIG}}"

# Build the namespaced Qraft entries from .mcp.json (printed to stdout as JSON).
QRAFT_ENTRIES="$(
  node --input-type=module - "${REPO_ROOT}" "${BASH_BIN}" "${NODE_BIN}" "${CURRENT_PATH}" <<'NODE'
import { readFileSync } from "node:fs";
import path from "node:path";

import { readdirSync, existsSync } from "node:fs";

const [root, , nodeBin] = process.argv.slice(2);
const mcp = JSON.parse(readFileSync(path.join(root, ".mcp.json"), "utf8"));
const servers = mcp.mcpServers ?? {};

// Bash start-scripts just do `exec node dist/index.js` in the end.
// Claude Desktop cannot reliably run bash wrappers (no npm on its PATH),
// so for bash entries we find the dist/index.js and call node directly —
// the same pattern as the working jira-server.
const findDistIndex = (scriptPath) => {
  // script is .../tools/<tool>/scripts/start-*.sh
  // dist lives at .../tools/<tool>/app/packages/<pkg>/dist/index.js
  // Prefer the package whose directory name contains "mcp" (the MCP server package).
  const pkgDir = path.join(path.resolve(path.dirname(scriptPath), ".."), "app", "packages");
  try {
    const pkgs = readdirSync(pkgDir).filter((d) => !d.startsWith("."));
    const ordered = [
      ...pkgs.filter((d) => d.includes("mcp")),
      ...pkgs.filter((d) => !d.includes("mcp")),
    ];
    for (const pkg of ordered) {
      const candidate = path.join(pkgDir, pkg, "dist", "index.js");
      if (existsSync(candidate)) return candidate;
    }
  } catch {}
  return null;
};

const resolveArg = (arg) => {
  if (typeof arg !== "string" || arg.startsWith("-")) return arg;
  if (!path.isAbsolute(arg) && (arg.startsWith("./") || arg.startsWith("../") || arg.includes("/"))) {
    return path.resolve(root, arg);
  }
  return arg;
};

const out = {};
for (const [name, def] of Object.entries(servers)) {
  // Namespace the Qraft tools; leave already-prefixed project servers (lms-*) alone.
  const key = /^(presentations|brandkit)$/.test(name) ? `qraft-${name}` : name;

  let command = def.command;
  let args = (def.args ?? []).map(resolveArg);

  if (command === "bash") {
    // Replace bash wrapper with direct node call to dist/index.js
    const distIndex = args[0] ? findDistIndex(args[0]) : null;
    if (distIndex) { command = nodeBin || "node"; args = [distIndex]; }
  } else if (command === "node") {
    command = nodeBin || "node";
  }

  out[key] = { command, args };
}

process.stdout.write(JSON.stringify(out, null, 2));
NODE
)"

if [ "${PRINT_ONLY}" -eq 1 ]; then
  printf '%s\n' "{
  \"mcpServers\": ${QRAFT_ENTRIES}
}"
  printf '\nTo apply, add these under "mcpServers" in:\n  %s\nthen quit and reopen Claude Desktop.\n' "${CONFIG_PATH}"
  exit 0
fi

# Merge into the Desktop config, preserving any existing (non-Qraft) servers.
node --input-type=module - "${CONFIG_PATH}" "${QRAFT_ENTRIES}" <<'NODE'
import { existsSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import path from "node:path";

const [configPath, entriesJson] = process.argv.slice(2);
const entries = JSON.parse(entriesJson);

mkdirSync(path.dirname(configPath), { recursive: true });

let config = { mcpServers: {} };
if (existsSync(configPath)) {
  copyFileSync(configPath, `${configPath}.bak`);
  try {
    config = JSON.parse(readFileSync(configPath, "utf8"));
  } catch {
    console.error(`WARN: existing config was not valid JSON; backed up to ${configPath}.bak and starting fresh.`);
    config = { mcpServers: {} };
  }
}

config.mcpServers ??= {};
for (const [name, def] of Object.entries(entries)) {
  config.mcpServers[name] = def;
}

writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Wrote ${Object.keys(entries).length} Qraft MCP server(s) to:`);
console.log(`  ${configPath}`);
NODE

cat <<EOF

Next steps:
  1. Quit Claude Desktop completely, then reopen it (config is only read at launch).
  2. Verify in Settings -> Developer that the qraft servers show as connected.
  3. If a server fails to start, check the log:
       ~/Library/Application Support/Claude/mcp.log
     (usually a Node/PATH issue; this script pins absolute paths to avoid it.)

Tip: make sure the tools are built first (Qraft check / npm run presentations:setup).
EOF
