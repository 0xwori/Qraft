---
name: qraft
description: Route simple Qraft commands. Use when the user says Qraft, Qraft setup, Qraft check, Qraft projects, Qraft open, Qraft presentations, or Qraft run.
---

# Qraft

Qraft is the local Codex work-agent plugin and project workfolder.

## Commands

Slash prefixes are optional. Treat `/Qraft setup` and `Qraft setup` the same.

| Command | Purpose |
|---|---|
| `Qraft` | Show the available Qraft commands. |
| `Qraft setup` | Create or repair Qraft folders and safe placeholder files. |
| `Qraft check` | Check that Qraft is installed and healthy. |
| `Qraft projects` | List registered projects. |
| `Qraft open <project>` | Load project context and show project tools/scripts. |
| `Qraft presentations` | Route to presentation work. |
| `Qraft run <project> <script>` | Run a safe project script when its manifest allows it. |

Older aliases still work: `Qraft init`, `Qraft doctor`, `Qraft project list`, and `Qraft project <name>`.

## Routing

1. Normalize the first token after `Qraft` by lowercasing it and ignoring a leading slash.
2. If no command is provided, show the command menu.
3. For `setup` or `init`, run:

```bash
bash qraft/scripts/qraft-init.sh
```

4. For `check` or `doctor`, run:

```bash
bash qraft/scripts/qraft-doctor.sh
```

5. For `projects`, `open`, `project`, and `run`, use `qraft/skills/project/SKILL.md`.
6. For `presentations`, use `qraft/skills/presentations/SKILL.md`.

## Safety

- Keep shared tool source under `qraft/tools/`.
- Keep project work under `projects/<project>/`.
- Do not copy, print, or infer secret values.
- Do not overwrite existing project files during init.
- Ask before running scripts that mutate external systems.
