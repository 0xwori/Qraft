# Jira MCP Config Example

Use this file as a shape/reference only. Do not store real credentials here.

## Environment Values

```text
JIRA_BASE_URL=https://jira.example.com
JIRA_PROJECT_KEY=LMSMMA
JIRA_AUTH_METHOD=token-or-mcp-secret-store
JIRA_TOKEN=DO_NOT_STORE_HERE
```

## Notes

- Jira access requires VPN.
- Store real tokens in the MCP client's secure storage, environment manager, or OS keychain.
- Do not commit PATs, passwords, cookies, private certificates, or VPN credentials.

