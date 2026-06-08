# Qraft

Qraft is a Codex plugin and workfolder in one, and its tools also run in the **Claude Desktop app** (see [Use Qraft in Claude Desktop](#use-qraft-in-claude-desktop)).

It gives Codex a clear way to work per project:

- read the right project context
- use the right project assets
- run safe local scripts
- call shared tools like the Presentations tool
- keep notes and outputs in predictable folders

## Folder Rules

```text
qraft/      Qraft product engine, commands, skills, templates, and shared tools
projects/   project-specific context, scripts, assets, and logs
```

Inside `qraft/`:

```text
registry/    project and tool registries
scripts/     local setup, health check, and project commands
skills/      Codex command routing for Qraft
templates/   starter files for new projects
tools/       shared tools that can be reused by projects
```

## Main Commands

```bash
npm run qraft:init
npm run qraft:doctor
npm run qraft:project -- list
npm run qraft:project -- show tapwise
npm run qraft:project -- create new-project
npm run qraft:project -- run tapwise atlassian-basic-auth
npm run presentations:ui
```

The easier aliases are:

```bash
npm run qraft:setup
npm run qraft:check
npm run qraft:projects
npm run qraft:open -- tapwise
```

Inside Codex, use:

- `Qraft`
- `Qraft setup`
- `Qraft check`
- `Qraft projects`
- `Qraft open Tapwise`
- `Qraft presentations`
- `Qraft run Tapwise atlassian-basic-auth`

## Use Qraft in Claude Desktop

Qraft is dual-target. The same tools (Presentations, Brandkit, and project MCP servers
like LMS Jira/Phrase) can run inside the **Claude Desktop app**. Desktop launches Qraft's
local MCP servers, so you call the tools directly in Desktop chat.

```bash
bash qraft/scripts/qraft-claude-desktop.sh    # or: Qraft claude
```

This reads `.mcp.json` and merges Qraft's servers into the Claude Desktop config
(`~/Library/Application Support/Claude/claude_desktop_config.json`), using absolute paths so
they launch reliably on macOS. Your existing servers are kept and the file is backed up first.

Then **quit and reopen Claude Desktop** and check Settings → Developer. Preview without writing
with `bash qraft/scripts/qraft-claude-desktop.sh --print`. This is additive — Codex keeps working.

## Project Shape

Each project should use this structure:

```text
projects/<project>/
├── AGENTS.md
├── Memory.md
├── context.md
├── assets/
├── scripts/
├── skills/
├── mcp/
├── tools/
├── outputs/
└── ai-log/
```

## Safety Rules

- Do not commit `.env` files.
- Put real secrets only in local `.env` files.
- Use `.env.example` to document which variables are needed.
- Scripts that change external systems should be marked with `requiresConfirmation: true`.
- Generated files should go in `outputs/` or a project tool folder.

## Presentations

Presentations is the first shared Qraft tool. It creates, edits, previews, and exports local presentation decks.

The app source lives in:

```text
qraft/tools/presentations/app/
```

The shared Presentations workspace lives in:

```text
qraft/tools/presentations/workspace/
```

Project decks live inside the project:

```text
projects/<project>/tools/presentations/
```
