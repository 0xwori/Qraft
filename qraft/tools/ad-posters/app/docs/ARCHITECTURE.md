# Ad Posters Architecture

Ad Posters mirrors the React-source side of Qraft Presentations.

```text
qraft/tools/ad-posters/app/              # application source
qraft/tools/ad-posters/workspace/        # global context and client registry
projects/<project>/tools/ad-posters/     # project campaigns, assets, exports, context
```

Every campaign is source-first:

```text
campaign.tsx
  -> browser preview
  -> PNG export from browser screenshot
  -> MP4 export from browser-rendered frames and ffmpeg
```

The React source is the design surface. Codex edits `campaign.tsx`; the local UI only lists campaigns, previews variants, and exports files.

## MCP Control Surface

Ad Posters exposes a stdio MCP server. The MCP is the function layer; the browser is only the rendering and export layer.

The normal agent flow is:

1. Read project context with `read_context`.
2. Create a campaign with `create_campaign`.
3. Read the generated source with `open_campaign`.
4. Replace the source with `update_campaign_source`.
5. Check the bundle with `validate_campaign`.
6. Preview or export with `launch_ui` or `export_campaign`.

V1 exports files only. It does not post, launch, spend budget, or call ad platform APIs.
