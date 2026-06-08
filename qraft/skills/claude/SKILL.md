---
name: claude
description: Set up Qraft's MCP tools (Presentations, Brandkit, LMS Jira/Phrase) inside the Claude Desktop app. Use when the user says "Qraft claude", "Qraft desktop", "use Qraft in Claude", or "Qraft Claude Desktop setup".
---

# Qraft in Claude Desktop

Qraft is dual-target: the same tools that run as a Codex plugin can also run inside
the **Claude Desktop app**. The bridge is Qraft's local **MCP servers** — Desktop can
launch them and they reach the real local filesystem, so Presentations, Brandkit, and the
LMS Jira/Phrase tools become available in Desktop chat.

## What works where

- **Claude Desktop**: the **MCP tools** are the integration surface. Desktop has no general
  shell, so the bash command-routing (`Qraft setup`, `Qraft check`) is a Codex / Claude Code
  thing — in Desktop you call the tools directly through chat.
- Desktop loads MCP servers from its **own** config file, not `.mcp.json`:
  `~/Library/Application Support/Claude/claude_desktop_config.json`.
- macOS GUI apps do **not** inherit your shell `PATH`, so the config needs **absolute**
  command/args paths and an explicit `PATH`. The setup script handles all of this.

## Setup

```bash
bash qraft/scripts/qraft-claude-desktop.sh
```

This reads `.mcp.json` (the source of truth for the server list), resolves every path to
absolute, bakes in `PATH` and `type: "stdio"`, then **merges** the entries into the Desktop
config under `mcpServers` — namespaced as `qraft-presentations`, `qraft-brandkit`, plus the
project servers `lms-jira` / `lms-phrase`. Any servers you already had are preserved, and the
existing config is backed up to `*.bak` first.

Preview without writing anything:

```bash
bash qraft/scripts/qraft-claude-desktop.sh --print
```

Override the target file (other OS / testing):

```bash
CLAUDE_DESKTOP_CONFIG=/path/to/claude_desktop_config.json bash qraft/scripts/qraft-claude-desktop.sh
```

## Before you start

Make sure the tools are built so the servers actually launch:

```bash
bash qraft/scripts/qraft-doctor.sh        # or: npm run presentations:setup
```

## After running

1. **Quit Claude Desktop completely and reopen it** — the config is only read at launch.
2. In **Settings → Developer**, confirm the `qraft-*` servers show as connected.
3. If a server fails, check the log: `~/Library/Application Support/Claude/mcp.log`
   (usually a Node/PATH problem; the absolute paths this script writes are meant to avoid it).

## Notes

- This is **additive** and does not touch the Codex packaging (`.codex-plugin/`,
  `plugins/qraft/`, `.agents/plugins/marketplace.json`). Codex keeps working.
- Re-run the script any time `.mcp.json` changes (e.g. a new project MCP server) and restart
  Desktop.
- One-click `.mcpb` Desktop Extensions are a possible future upgrade; for now the merged
  config is the supported path.
