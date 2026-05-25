# qraftPptx Architecture

qraftPptx is split into application source, global workspace data, and client-owned deck work.

```text
<repo-root>/qraft/tools/qraftPptx/app/             # application source
<repo-root>/qraft/tools/qraftPptx/workspace/       # global defaults, client registry, shared templates
<repo-root>/projects/<project>/tools/qraftPptx/    # project context, deck index, decks, assets, exports
```

Codex connects to the MCP server. The browser UI connects to the same local runtime over WebSocket. All mutations pass through `@micro-keynote/core`, which serializes edits per deck, writes revisions, appends AI logs, updates `deck.index.json`, validates the deck, and broadcasts live UI events.

`deck.json` is the data source of truth. `@micro-keynote/renderer` resolves that data into a canonical render scene with theme tokens, slide backgrounds, block geometry, typography, asset references, and export compatibility. The UI canvas, slide thumbnails, standalone HTML export, and PDF export all render through that same HTML scene. PPTX export projects the same render scene into editable PowerPoint objects where feasible and uses explicit fallback warnings for lower-fidelity blocks.

```text
deck.json
  -> @micro-keynote/renderer render scene
  -> HTML/UI renderer
  -> PDF from controlled HTML
  -> PPTX from the same resolved scene
```

Normal mode never exposes arbitrary file write/delete/read or shell execution. Presentation tools write only inside the central workspace and registered client roots from `workspace/client.registry.json`.
