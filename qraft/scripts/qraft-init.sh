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
ensure_dir "${REPO_ROOT}/projects"
ensure_dir "${QRAFT_CORE_ROOT}/templates/project"
ensure_dir "${QRAFT_CORE_ROOT}/tools/qraftPptx/app"
ensure_dir "${QRAFT_CORE_ROOT}/tools/qraftPptx/scripts"
ensure_dir "${QRAFT_CORE_ROOT}/tools/qraftPptx/workspace/global"
ensure_dir "${QRAFT_CORE_ROOT}/tools/qraftPptx/workspace/templates/registry"

ensure_json_file "${QRAFT_CORE_ROOT}/registry/tools.json" '{
  "schemaVersion": 1,
  "tools": [
    {
      "id": "qraftPptx",
      "name": "qraftPptx",
      "kind": "mcp",
      "command": "bash qraft/tools/qraftPptx/scripts/start-qraftPptx-mcp.sh"
    }
  ]
}'

ensure_json_file "${QRAFT_CORE_ROOT}/registry/projects.json" '{
  "schemaVersion": 1,
  "projects": []
}'

ensure_file "${QRAFT_CORE_ROOT}/tools/qraftPptx/workspace/global/PRODUCT.md" '# Qraft Presentation Product Context

Use this file for shared presentation context, audience assumptions, terminology, positioning, and claims to avoid.

This file is context input for qraftPptx. It is read-only in normal presentation editing mode.'

ensure_file "${QRAFT_CORE_ROOT}/tools/qraftPptx/workspace/global/DESIGN.md" '# Qraft Presentation Design Context

Use this file for shared slide design guidance, brand notes, chart conventions, typography, and visual style.

This file is context input for qraftPptx. It is read-only in normal presentation editing mode.'

ensure_json_file "${QRAFT_CORE_ROOT}/tools/qraftPptx/workspace/client.registry.json" '{
  "schemaVersion": 1,
  "clients": []
}'

ensure_project_qraft_pptx() {
  local project_id="$1"
  local project_name="$2"
  local project_root="${REPO_ROOT}/projects/${project_id}"
  local deck_root="${project_root}/tools/qraftPptx"

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

  ensure_file "${deck_root}/AGENTS.md" "# ${project_name} qraftPptx Guide

This folder stores deck data and presentation context for this project.

Generated decks belong under \`decks/\`. Exports belong under \`exports/\`."

  ensure_json_file "${deck_root}/deck.index.json" '{
  "schemaVersion": 1,
  "decks": []
}'
}

if [ -f "${QRAFT_CORE_ROOT}/registry/projects.json" ]; then
  while IFS=$'\t' read -r project_id project_name; do
    [ -n "${project_id}" ] || continue
    ensure_project_qraft_pptx "${project_id}" "${project_name}"
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
