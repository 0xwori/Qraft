---
name: qraft
description: Route top-level Qraft commands. Use when the user says Qraft, Qraft init, Qraft doctor, Qraft project, Qraft presentations, or Qraft run.
---

# Qraft

Qraft is the local Codex work-agent plugin and project workfolder.

## Commands

Slash prefixes are optional. Treat `/Qraft init` and `Qraft init` the same.

| Command | Purpose |
|---|---|
| `Qraft` | Show the available Qraft commands. |
| `Qraft init` | Create or repair Qraft folders and safe placeholder files. |
| `Qraft doctor` | Check that Qraft is installed and healthy. |
| `Qraft project list` | List registered projects. |
| `Qraft project <name>` | Load project context and show project tools/scripts. |
| `Qraft presentations` | Route to qraftPptx presentation work. |
| `Qraft run <project> <script>` | Run a safe project script when its manifest allows it. |

## Routing

1. Normalize the first token after `Qraft` by lowercasing it and ignoring a leading slash.
2. If no command is provided, show the command menu.
3. For `init`, run:

```bash
bash qraft/scripts/qraft-init.sh
```

4. For `doctor`, run:

```bash
bash qraft/scripts/qraft-doctor.sh
```

5. For `project` and `run`, use `qraft/skills/qraft-project/SKILL.md`.
6. For `presentations`, use `qraft/skills/qraftPptx/SKILL.md`.

## Safety

- Keep shared tool source under `qraft/tools/`.
- Keep project work under `projects/<project>/`.
- Do not copy, print, or infer secret values.
- Do not overwrite existing project files during init.
- Ask before running scripts that mutate external systems.
