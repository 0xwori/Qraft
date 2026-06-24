#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
QRAFT_CORE_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd -- "${QRAFT_CORE_ROOT}/.." && pwd)"

created=0
kept=0

ensure_dir() {
  local path="$1"
  if [ -d "${path}" ]; then
    kept=$((kept + 1))
    printf 'kept dir: %s\n' "${path}"
  else
    mkdir -p "${path}"
    created=$((created + 1))
    printf 'created dir: %s\n' "${path}"
  fi
}

ensure_file() {
  local path="$1"
  local content="$2"
  ensure_dir "$(dirname -- "${path}")"
  if [ -e "${path}" ]; then
    kept=$((kept + 1))
    printf 'kept file: %s\n' "${path}"
  else
    printf '%s\n' "${content}" > "${path}"
    created=$((created + 1))
    printf 'created file: %s\n' "${path}"
  fi
}

ensure_json_file() {
  ensure_file "$1" "$2"
}

ensure_dir "${QRAFT_CORE_ROOT}/registry"
ensure_dir "${QRAFT_CORE_ROOT}/scripts"
ensure_dir "${QRAFT_CORE_ROOT}/skills"
ensure_dir "${QRAFT_CORE_ROOT}/tools"
ensure_dir "${REPO_ROOT}/.agents/plugins"
ensure_dir "${REPO_ROOT}/plugins/qraft/.codex-plugin"
ensure_dir "${REPO_ROOT}/plugins/qraft/skills"
ensure_dir "${REPO_ROOT}/projects"
ensure_dir "${QRAFT_CORE_ROOT}/templates/project"
ensure_dir "${QRAFT_CORE_ROOT}/tools/presentations/app"
ensure_dir "${QRAFT_CORE_ROOT}/tools/presentations/scripts"
ensure_dir "${QRAFT_CORE_ROOT}/tools/presentations/workspace/global"
ensure_dir "${QRAFT_CORE_ROOT}/tools/presentations/workspace/templates/registry"
ensure_dir "${QRAFT_CORE_ROOT}/tools/ad-posters/app"
ensure_dir "${QRAFT_CORE_ROOT}/tools/ad-posters/scripts"
ensure_dir "${QRAFT_CORE_ROOT}/tools/ad-posters/workspace/global"

ensure_json_file "${QRAFT_CORE_ROOT}/registry/tools.json" '{
  "schemaVersion": 1,
  "tools": [
    {
      "id": "presentations",
      "name": "Presentations",
      "kind": "mcp",
      "command": "bash qraft/tools/presentations/scripts/start-presentations-mcp.sh"
    },
    {
      "id": "ad-posters",
      "name": "Ad Posters",
      "kind": "mcp",
      "command": "bash qraft/tools/ad-posters/scripts/start-ad-posters-mcp.sh"
    }
  ]
}'

ensure_json_file "${QRAFT_CORE_ROOT}/registry/projects.json" '{
  "schemaVersion": 1,
  "projects": []
}'

ensure_file "${QRAFT_CORE_ROOT}/tools/presentations/workspace/global/PRODUCT.md" '# Qraft Presentation Product Context

Use this file for shared presentation context, audience assumptions, terminology, positioning, and claims to avoid.

This file is context input for Presentations. It is read-only in normal presentation editing mode.'

ensure_file "${QRAFT_CORE_ROOT}/tools/presentations/workspace/global/DESIGN.md" '# Qraft Presentation Design Context

Use this file for shared slide design guidance, brand notes, chart conventions, typography, and visual style.

This file is context input for Presentations. It is read-only in normal presentation editing mode.'

ensure_json_file "${QRAFT_CORE_ROOT}/tools/presentations/workspace/client.registry.json" '{
  "schemaVersion": 1,
  "clients": []
}'

if [ -L "${REPO_ROOT}/skills" ] && [ "$(readlink "${REPO_ROOT}/skills")" != "qraft/skills" ]; then
  rm "${REPO_ROOT}/skills"
  ln -s qraft/skills "${REPO_ROOT}/skills"
  created=$((created + 1))
  printf 'repaired symlink: %s\n' "${REPO_ROOT}/skills"
elif [ -L "${REPO_ROOT}/skills" ]; then
  kept=$((kept + 1))
  printf 'kept symlink: %s\n' "${REPO_ROOT}/skills"
elif [ -e "${REPO_ROOT}/skills" ]; then
  kept=$((kept + 1))
  printf 'kept path: %s\n' "${REPO_ROOT}/skills"
else
  ln -s qraft/skills "${REPO_ROOT}/skills"
  created=$((created + 1))
  printf 'created symlink: %s\n' "${REPO_ROOT}/skills"
fi

cp "${REPO_ROOT}/.codex-plugin/plugin.json" "${REPO_ROOT}/plugins/qraft/.codex-plugin/plugin.json"
rsync -a --delete "${QRAFT_CORE_ROOT}/skills/" "${REPO_ROOT}/plugins/qraft/skills/"
cp "${REPO_ROOT}/.pluginignore" "${REPO_ROOT}/plugins/qraft/.pluginignore" 2>/dev/null || true
cp "${REPO_ROOT}/.codexignore" "${REPO_ROOT}/plugins/qraft/.codexignore" 2>/dev/null || true
cat > "${REPO_ROOT}/plugins/qraft/.mcp.json" <<EOF
{
  "mcpServers": {
    "presentations": {
      "command": "bash",
      "args": [
        "${REPO_ROOT}/qraft/tools/presentations/scripts/start-presentations-mcp.sh"
      ]
    },
    "brandkit": {
      "command": "bash",
      "args": [
        "${REPO_ROOT}/qraft/tools/brandkit/scripts/start-brandkit-mcp.sh"
      ]
    },
    "ad-posters": {
      "command": "bash",
      "args": [
        "${REPO_ROOT}/qraft/tools/ad-posters/scripts/start-ad-posters-mcp.sh"
      ]
    },
    "lms-jira": {
      "command": "node",
      "args": [
        "${REPO_ROOT}/projects/lms/mcp/jira-mcp-codex/dist/index.js"
      ]
    },
    "lms-phrase": {
      "command": "node",
      "args": [
        "${REPO_ROOT}/projects/lms/mcp/phrase-mcp-codex/dist/index.js"
      ]
    }
  }
}
EOF
kept=$((kept + 1))
printf 'synced plugin wrapper: %s\n' "${REPO_ROOT}/plugins/qraft"

node --input-type=module - "${REPO_ROOT}" <<'NODE'
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.argv[2];
const marketplacePath = path.join(root, ".agents/plugins/marketplace.json");
const marketplace = existsSync(marketplacePath)
  ? JSON.parse(readFileSync(marketplacePath, "utf8"))
  : { name: "qraft", interface: { displayName: "Qraft" }, plugins: [] };

marketplace.name = marketplace.name || "qraft";
marketplace.interface ??= { displayName: "Qraft" };
marketplace.interface.displayName ??= "Qraft";
marketplace.plugins ??= [];

const entry = {
  name: "qraft",
  source: {
    source: "local",
    path: "./plugins/qraft",
  },
  policy: {
    installation: "AVAILABLE",
    authentication: "ON_INSTALL",
  },
  category: "Productivity",
};

const index = marketplace.plugins.findIndex((plugin) => plugin.name === "qraft");
if (index >= 0) {
  marketplace.plugins[index] = { ...marketplace.plugins[index], ...entry };
} else {
  marketplace.plugins.push(entry);
}

writeFileSync(marketplacePath, `${JSON.stringify(marketplace, null, 2)}\n`);
NODE

ensure_file "${QRAFT_CORE_ROOT}/tools/ad-posters/workspace/global/PRODUCT.md" '# Qraft Ad Posters Product Context

Ad Posters creates browser-rendered ad campaigns from React source files.

This file is context input for Ad Posters. It is read-only in normal ad-poster editing mode.'

ensure_file "${QRAFT_CORE_ROOT}/tools/ad-posters/workspace/global/DESIGN.md" '# Qraft Ad Posters Design Context

Use this file for shared ad creative guidance, brand notes, typography, motion rules, and platform-safe design direction.

This file is context input for Ad Posters. It is read-only in normal ad-poster editing mode.'

ensure_json_file "${QRAFT_CORE_ROOT}/tools/ad-posters/workspace/client.registry.json" '{
  "schemaVersion": 1,
  "clients": []
}'

ensure_project_presentations() {
  local project_id="$1"
  local project_name="$2"
  local project_root="${REPO_ROOT}/projects/${project_id}"
  local deck_root="${project_root}/tools/presentations"

  ensure_dir "${project_root}/assets"
  ensure_dir "${project_root}/scripts"
  ensure_dir "${project_root}/skills"
  ensure_dir "${project_root}/mcp"
  ensure_dir "${project_root}/tools"
  ensure_dir "${project_root}/outputs"
  ensure_dir "${project_root}/ai-log"
  ensure_dir "${deck_root}/decks"
  ensure_dir "${deck_root}/exports"

  ensure_file "${deck_root}/PRODUCT.md" "# ${project_name} Presentation Product Context

Use this file for project-specific presentation context.

Do not store secrets here."

  ensure_file "${deck_root}/DESIGN.md" "# ${project_name} Presentation Design Context

Use this file for project-specific slide design guidance.

Do not store secrets here."

  ensure_file "${deck_root}/AGENTS.md" "# ${project_name} Presentations Guide

This folder stores deck data and presentation context for this project.

Generated decks belong under \`decks/\`. Exports belong under \`exports/\`."

  ensure_json_file "${deck_root}/deck.index.json" '{
  "schemaVersion": 1,
  "decks": []
}'
}

ensure_project_ad_posters() {
  local project_id="$1"
  local project_name="$2"
  local project_root="${REPO_ROOT}/projects/${project_id}"
  local ad_root="${project_root}/tools/ad-posters"

  ensure_dir "${ad_root}/campaigns"
  ensure_dir "${ad_root}/assets"
  ensure_dir "${ad_root}/exports"

  ensure_file "${ad_root}/PRODUCT.md" "# ${project_name} Ad Posters Product Context

Use this file for project-specific ad campaign context.

Do not store secrets here."

  ensure_file "${ad_root}/DESIGN.md" "# ${project_name} Ad Posters Design Context

Use this file for project-specific ad design guidance.

Do not store secrets here."

  ensure_file "${ad_root}/AGENTS.md" "# ${project_name} Ad Posters Guide

This folder stores code-first ad campaign data and context for this project.

Generated campaigns belong under \`campaigns/\`. Exports belong inside each campaign \`.export/\` folder."

  ensure_json_file "${ad_root}/campaign.index.json" '{
  "schemaVersion": 1,
  "campaigns": []
}'
}

if [ -f "${QRAFT_CORE_ROOT}/registry/projects.json" ]; then
  while IFS=$'\t' read -r project_id project_name; do
    [ -n "${project_id}" ] || continue
    ensure_project_presentations "${project_id}" "${project_name}"
    ensure_project_ad_posters "${project_id}" "${project_name}"
  done < <(node --input-type=module - "${QRAFT_CORE_ROOT}" <<'NODE'
import { readFileSync } from "node:fs";
import path from "node:path";

const root = process.argv[2];
const registryPath = path.join(root, "registry/projects.json");
const registry = JSON.parse(readFileSync(registryPath, "utf8"));
const projects = Array.isArray(registry.projects) ? registry.projects : [];
for (const project of projects) {
  if (!project.id || !project.name) continue;
  console.log(`${project.id}\t${project.name}`);
}
NODE
)
fi

printf 'Qraft init complete: %s created, %s kept.\n' "${created}" "${kept}"
