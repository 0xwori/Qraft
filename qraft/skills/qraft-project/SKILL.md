---
name: qraft-project
description: Work with Qraft projects, project context, project scripts, project tools, and project creation.
---

# Qraft Project

Use this skill for `Qraft project ...` and `Qraft run ...`.

## Project Commands

```bash
bash qraft/scripts/qraft-project.sh list
bash qraft/scripts/qraft-project.sh show tapwise
bash qraft/scripts/qraft-project.sh create project-id "Project Name"
bash qraft/scripts/qraft-project.sh run tapwise atlassian-basic-auth
```

## How To Work With A Project

1. Read `qraft/registry/projects.json`.
2. Find the project by `id` or obvious name match.
3. Read the project files:
   - `AGENTS.md`
   - `Memory.md`
   - `context.md`
   - `scripts/manifest.json`
4. Tell Wouter which context, scripts, and tools are available.
5. Run only scripts that are marked safe:
   - `mutatesExternalSystem: false`
   - `requiresConfirmation: false`

## Script Safety

If a script has `requiresConfirmation: true` or `mutatesExternalSystem: true`, ask before running it.

Never print `.env` values or generated secret headers.
