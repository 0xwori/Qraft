# Qraft Workspace

Qraft is a Codex plugin and workfolder system. It is **dual-target**: its tools also run in
the Claude Desktop app via local MCP servers. Set that up with `Qraft claude` (see
`qraft/skills/claude/SKILL.md`). The Claude path is additive and does not change the Codex
packaging.

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
- Use `qraft/skills/brandkit/SKILL.md` for brand asset intake and design.md generation.
- Use `qraft/skills/claude/SKILL.md` for setting up Qraft's MCP tools in the Claude Desktop app.

## Shared Tools

- Presentations lives in `qraft/tools/presentations/`.
- The Presentations MCP server is started by `qraft/tools/presentations/scripts/start-presentations-mcp.sh`.
- Project deck data should live in `projects/<project>/tools/presentations/`, not inside the shared app source.
- Brandkit lives in `qraft/tools/brandkit/`.
- The Brandkit MCP server is started by `qraft/tools/brandkit/scripts/start-brandkit-mcp.sh`.
- Per-brand output data lives in `projects/<project>/tools/brandkit/<slug>/`, not inside the shared app source.

## Design Review Procedure

When a new or revised design is ready, always do a quick check with the Impeccable skill before final handoff:

```text
/Users/woutervanrijmenam/.agents/skills/impeccable/SKILL.md
```

For the quick check, verify brand fit, visual hierarchy, spacing, typography, text fit, imagery/icons, motion, accessibility basics, and whether the design feels specific instead of generic. If the check finds issues, fix them and re-preview before saying the design is done.

## Project Rules

Each project should have:

- `AGENTS.md` for project-specific working instructions.
- `Memory.md` for stable project memory.
- `context.md` for current project context.
- `scripts/manifest.json` for script metadata.
- `ai-log/` for short session notes.

Scripts that mutate external systems must ask before running unless their metadata clearly says otherwise.
