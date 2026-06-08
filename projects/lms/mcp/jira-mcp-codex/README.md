# Legacy Jira MCP Server for Codex

Stdio MCP server for Jira Server/Data Center, built for Jira 8.20.x REST APIs. It also exposes Confluence tools when `CONFLUENCE_URL` is configured.

## Setup

1. Install and build:

```sh
npm install
npm run build
```

2. Edit `.env`:

```sh
JIRA_URL=https://jira.example.com
JIRA_PAT=your-personal-access-token
JIRA_PROJECT=PROJECTKEY
CONFLUENCE_URL=https://confluence.example.com
```

Aliases are also supported for your current naming style: `JIRA_BASE_URL` for `JIRA_URL`, and `JIRA_PROJECT_KEY` for `JIRA_PROJECT`.

`JIRA_PROJECT` is optional but recommended. When set, `create_issue` uses it as the default project if `fields.project` is omitted, `get_field_metadata` defaults to that project, and `rovo_search_jira_and_confluence` scopes Jira text search to it unless `useDefaultProject` is set to `false`.

`CONFLUENCE_URL` is optional. Leave it empty if you only need Jira tools.

3. Add the server to Codex MCP config:

```json
{
  "mcpServers": {
    "legacy-jira": {
      "command": "node",
      "args": ["/Users/wouter.rijmenam/Documents/Projects/jira-mcp-codex/dist/index.js"]
    }
  }
}
```

## Tools

Interactive/read tools:

- `retrieve_confluence_page`
- `search_confluence_cql`
- `get_issue`
- `search_jql`
- `transition_issue`
- `get_current_user_info`
- `list_accessible_resources`
- `get_spaces`
- `get_pages_in_space`
- `get_page_comments`
- `list_page_inline_comments`
- `get_comment_replies`
- `list_page_descendants`
- `get_transitions`
- `get_remote_links`
- `get_projects`
- `get_project_versions`
- `get_agile_boards`
- `get_board_sprints`
- `get_current_sprint_for_project`
- `get_issue_types`
- `get_field_metadata`
- `lookup_users`
- `get_issue_link_types`
- `rovo_search_jira_and_confluence`
- `fetch_content_with_ari`

Write tools:

- `update_issue`
- `create_issue`
- `create_project_version`
- `add_issues_to_sprint`
- `create_confluence_page`
- `update_confluence_page`
- `create_confluence_footer_comment`
- `create_confluence_inline_comment`
- `add_comment`
- `add_or_update_worklog`
- `create_issue_link`

## Notes for older Atlassian versions

- Jira 8.20 uses `/rest/api/2`, which is the default.
- Personal Access Tokens are sent as `Authorization: Bearer <token>`.
- For self-signed internal TLS, set `VERIFY_TLS=false`.
- Confluence is a separate product/API. Configure `CONFLUENCE_URL` to enable Confluence tools.
