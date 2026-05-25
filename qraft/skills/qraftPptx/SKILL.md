---
name: qraftPptx
description: Create, edit, preview, and export presentation decks through Qraft's local qraftPptx tool.
---

# qraftPptx

qraftPptx is bundled in Qraft at `qraft/tools/qraftPptx`.

## Setup

Run setup when dependencies or builds are missing:

```bash
bash qraft/tools/qraftPptx/scripts/setup.sh
```

Start the MCP server:

```bash
bash qraft/tools/qraftPptx/scripts/start-mcp.sh
```

Start the local UI:

```bash
bash qraft/tools/qraftPptx/scripts/start-ui.sh
```

## Path Rules

- App source lives in `qraft/tools/qraftPptx/app`.
- Shared templates and global context live in `qraft/tools/qraftPptx/workspace`.
- Project deck data lives in `projects/<project>/tools/qraftPptx`.
- Do not put project deck data inside the shared app source.
- Do not hardcode machine-specific paths.

## Common Commands

From `qraft/tools/qraftPptx/app`:

```bash
npm run build
npm test
npm run start:mcp
npm run start:ui
```
