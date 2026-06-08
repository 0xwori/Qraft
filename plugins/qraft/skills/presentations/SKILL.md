---
name: presentations
description: Create, edit, preview, and export presentation decks through Qraft's local Presentations tool.
---

# Presentations

Presentations is bundled in Qraft at `qraft/tools/presentations`.

## Setup

Run setup when dependencies or builds are missing:

```bash
bash qraft/tools/presentations/scripts/setup.sh
```

Start the MCP server:

```bash
bash qraft/tools/presentations/scripts/start-mcp.sh
```

Start the local UI:

```bash
bash qraft/tools/presentations/scripts/start-ui.sh
```

## Easy Codex Commands

```text
$qraft:presentations setup
$qraft:presentations start
$qraft:presentations open ui
$qraft:presentations list decks
$qraft:presentations export deck
```

## Path Rules

- App source lives in `qraft/tools/presentations/app`.
- Shared templates and global context live in `qraft/tools/presentations/workspace`.
- Project deck data lives in `projects/<project>/tools/presentations`.
- Do not put project deck data inside the shared app source.
- Do not hardcode machine-specific paths.

## Common Commands

From `qraft/tools/presentations/app`:

```bash
npm run build
npm test
npm run start:mcp
npm run start:ui
```
