# LMS MCP Workspace

Local setup notes and MCP server projects for LMS tooling.

```text
mcp/
├── README.md
├── affine/             # Affine setup notes
├── figma/              # Figma setup notes
├── jira/               # Jira setup notes and examples
├── jira-mcp-codex/     # Local Jira MCP server project
├── outlook/            # Outlook setup notes
├── phrase/             # Phrase setup notes
└── phrase-mcp-codex/   # Local Phrase MCP server project
```

## Notes

- Keep setup documentation in the tool-named folders.
- Keep runnable local server projects in their existing `*-mcp-codex/` folders.
- Do not move the server project folders without also updating Codex MCP configuration and the setup notes, because those paths are referenced directly.
- Keep real tool credentials in the relevant `.env` files only.

