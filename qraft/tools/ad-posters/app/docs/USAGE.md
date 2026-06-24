# Ad Posters Usage

Install and build:

```bash
bash qraft/tools/ad-posters/scripts/setup.sh
```

Start the MCP server:

```bash
bash qraft/tools/ad-posters/scripts/start-mcp.sh
```

The MCP server is stdio-based. Codex or another MCP client can call these tools:

- `list_clients`: see registered ad workspaces.
- `list_ad_sizes`: see the default performance size pack.
- `read_context`: read global and project ad design context.
- `create_campaign`: create a new React-first campaign.
- `open_campaign`: read `campaign.tsx`, metadata, and preview URL.
- `update_campaign_source`: replace `campaign.tsx` after Codex edits the design.
- `validate_campaign`: check that the React campaign bundles for browser preview.
- `upload_asset`: add image/video assets to a campaign.
- `launch_ui`: open the simple browser preview/export UI.
- `export_campaign`: export PNG or MP4 files. This does not post ads.

Preview before export:

1. Save or update `campaign.tsx`.
2. Validate the campaign.
3. Open the browser preview and inspect the selected variant.
4. Export only after the preview is accepted.

Start the browser UI:

```bash
bash qraft/tools/ad-posters/scripts/start-ui.sh
```

Campaign data belongs in:

```text
projects/<project>/tools/ad-posters/campaigns/<campaign-id>/
```
