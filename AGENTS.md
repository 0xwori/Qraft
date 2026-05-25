# Qraft Workspace

Qraft is a Codex plugin and workfolder system.

## How To Work Here

- Keep explanations simple and clear because Wouter is a junior developer.
- Explain what changed, why it matters, and how to use it.
- Keep Qraft product internals in `qraft/`.
- Keep shared tools in `qraft/tools/`.
- Keep project-specific context, scripts, assets, and logs in `projects/<project>/`.
- Keep reusable project starter files in `qraft/templates/`.
- Keep Codex command routing in `qraft/skills/`.
- Never write real API tokens, passwords, secrets, customer data, or personal data into markdown, logs, templates, or chat summaries.
- Use `.env.example` for variable names only.
- Use `.env` locally for real secrets, and keep it ignored.

## Command Routing

- Use `qraft/skills/qraft/SKILL.md` for top-level `Qraft` commands like `Qraft setup`, `Qraft check`, and `Qraft projects`.
- Use `qraft/skills/project/SKILL.md` for project selection and project scripts.
- Use `qraft/skills/presentations/SKILL.md` for presentation work.

## Shared Tools

- Presentations lives in `qraft/tools/presentations/`.
- The Presentations MCP server is started by `qraft/tools/presentations/scripts/start-presentations-mcp.sh`.
- Project deck data should live in `projects/<project>/tools/presentations/`, not inside the shared app source.

## Project Rules

Each project should have:

- `AGENTS.md` for project-specific working instructions.
- `Memory.md` for stable project memory.
- `context.md` for current project context.
- `scripts/manifest.json` for script metadata.
- `ai-log/` for short session notes.

Scripts that mutate external systems must ask before running unless their metadata clearly says otherwise.
