#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
QRAFT_CORE_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd -- "${QRAFT_CORE_ROOT}/.." && pwd)"
REGISTRY="${QRAFT_CORE_ROOT}/registry/projects.json"

usage() {
  cat <<'TEXT'
Usage:
  qraft-project list
  qraft-project show <project-id>
  qraft-project create <project-id> [Project Name]
  qraft-project run <project-id> <script-id> [args...]
TEXT
}

slugify() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//; s/-+/-/g'
}

cmd="${1:-}"
shift || true

case "${cmd}" in
  list)
    node --input-type=module - "${REGISTRY}" <<'NODE'
import { readFileSync } from "node:fs";
const registry = JSON.parse(readFileSync(process.argv[2], "utf8"));
for (const project of registry.projects ?? []) {
  console.log(`${project.id}\t${project.name}\t${project.root}`);
}
NODE
    ;;
  show)
    project_id="${1:-}"
    [ -n "${project_id}" ] || { usage; exit 1; }
    node --input-type=module - "${REGISTRY}" "${project_id}" <<'NODE'
import { readFileSync } from "node:fs";
const registry = JSON.parse(readFileSync(process.argv[2], "utf8"));
const project = (registry.projects ?? []).find((item) => item.id === process.argv[3]);
if (!project) {
  console.error(`Project not found: ${process.argv[3]}`);
  process.exit(1);
}
console.log(JSON.stringify(project, null, 2));
NODE
    ;;
  create)
    raw_id="${1:-}"
    raw_name="${2:-}"
    [ -n "${raw_id}" ] || { usage; exit 1; }
    project_id="$(slugify "${raw_id}")"
    project_name="${raw_name:-${raw_id}}"
    project_root="${REPO_ROOT}/projects/${project_id}"
    if [ -e "${project_root}" ]; then
      echo "Project folder already exists: ${project_root}" >&2
      exit 1
    fi
    cp -R "${QRAFT_CORE_ROOT}/templates/project" "${project_root}"
    node --input-type=module - "${REGISTRY}" "${project_id}" "${project_name}" <<'NODE'
import { readFileSync, writeFileSync } from "node:fs";
const registryPath = process.argv[2];
const id = process.argv[3];
const name = process.argv[4];
const registry = JSON.parse(readFileSync(registryPath, "utf8"));
registry.projects ??= [];
if (registry.projects.some((project) => project.id === id)) {
  throw new Error(`Project is already registered: ${id}`);
}
registry.projects.push({
  id,
  name,
  root: `projects/${id}`,
  tools: ["presentations"],
  scripts: []
});
writeFileSync(registryPath, `${JSON.stringify(registry, null, 2)}\n`);
NODE
    bash "${QRAFT_CORE_ROOT}/scripts/qraft-init.sh" >/dev/null
    echo "Created project: ${project_id}"
    ;;
  run)
    project_id="${1:-}"
    script_id="${2:-}"
    shift 2 || true
    [ -n "${project_id}" ] && [ -n "${script_id}" ] || { usage; exit 1; }
    node --input-type=module - "${REPO_ROOT}" "${REGISTRY}" "${project_id}" "${script_id}" "$@" <<'NODE'
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const [root, registryPath, projectId, scriptId, ...args] = process.argv.slice(2);
const registry = JSON.parse(readFileSync(registryPath, "utf8"));
const project = (registry.projects ?? []).find((item) => item.id === projectId);
if (!project) throw new Error(`Project not found: ${projectId}`);

const projectRoot = path.join(root, project.root);
const manifestPath = path.join(projectRoot, "scripts/manifest.json");
if (!existsSync(manifestPath)) throw new Error(`Script manifest missing for ${projectId}`);

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const script = (manifest.scripts ?? []).find((item) => item.id === scriptId);
if (!script) throw new Error(`Script not found: ${scriptId}`);
if (script.requiresConfirmation || script.mutatesExternalSystem) {
  throw new Error(`Script requires explicit confirmation before running: ${scriptId}`);
}

const commandParts = String(script.command).split(/\s+/).filter(Boolean);
const result = spawnSync(commandParts[0], [...commandParts.slice(1), ...args], {
  cwd: projectRoot,
  stdio: "inherit",
  env: process.env
});
process.exit(result.status ?? 1);
NODE
    ;;
  *)
    usage
    exit 1
    ;;
esac
