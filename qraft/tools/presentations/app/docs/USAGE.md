# Presentations Usage

Install and build from the plugin root:

```bash
bash qraft/tools/presentations/scripts/setup.sh
```

Or install and build from `qraft/tools/presentations/app`:

```bash
npm install
npm run build
```

Start the local UI runtime:

```bash
bash qraft/tools/presentations/scripts/start-ui.sh
```

Start the MCP server over stdio:

```bash
bash qraft/tools/presentations/scripts/start-mcp.sh
```

Import source snapshots from the HTML template gallery:

```bash
npm run import:templates -- /path/to/beautiful-html-templates-main
```

The runtime uses normalized template registry files only. Source snapshots under `workspace/templates/sources/` are never referenced by decks.
