# Tapwise MCP

Store Tapwise MCP templates and setup notes here.

Current template:
- `jira.template.json`: Atlassian Rovo MCP template for Tapwise Jira.
- `rovo-permissions.json`: Tool permission settings for the Atlassian Rovo MCP server.

Use environment variables for secrets. Do not hardcode API tokens.

## Tapwise Jira

- Jira instance: `https://tapwiseai.atlassian.net/`
- MCP URL for API-token auth: `https://mcp.atlassian.com/v1/mcp`
- Auth format: `Authorization: Basic base64(email:api_token)`

To generate the Basic auth value from the local env file:

```bash
projects/tapwise/scripts/atlassian-basic-auth.sh
```

Then store the result in `projects/tapwise/.env` as `ATLASSIAN_BASIC_AUTH`.

Do not paste the generated value into markdown files or logs.
