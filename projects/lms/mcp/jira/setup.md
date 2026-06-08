# Jira Setup Notes

## Purpose

Use Jira for LMS backlog, releases, issue workflow, sprint data, versions, and velocity tracking.

## Access

- Requires VPN before opening Jira or using Jira APIs/MCP.
- Main known LMS project key: `LMSMMA`.
- Known Jira release note URL pattern: `https://jira.example.com/projects/LMSMMA/versions/XXXX`

## Codex MCP Server

Configured Codex server name:

```text
lms-jira
```

Server location:

```text
/Users/wouter.rijmenam/Documents/Projects/Qraft/projects/lms/mcp/jira-mcp-codex
```

Codex launch command:

```text
node /Users/wouter.rijmenam/Documents/Projects/Qraft/projects/lms/mcp/jira-mcp-codex/dist/index.js
```

The server reads secrets from:

```text
/Users/wouter.rijmenam/Documents/Projects/Qraft/projects/lms/mcp/jira-mcp-codex/.env
```

Required values:

```text
JIRA_URL=https://jira.example.com
JIRA_PAT=<personal access token>
JIRA_PROJECT=LMSMMA
```

Supported aliases:

```text
JIRA_BASE_URL
JIRA_PROJECT_KEY
```

Useful commands:

```sh
codex mcp list
codex mcp get lms-jira
codex mcp remove lms-jira
```

After adding or changing MCP config, restart Codex or open a new chat if the tools do not appear in the current session.

## Workflow

Issues move through:

```text
Backlog -> Ready for Sprint -> In Development -> In QA -> In TeK -> Ready for Release -> Released
```

Work types:

- Stories: new functionality
- Tasks: enablers
- Bugs: bugfixes

## Useful JQL

```jql
project = LMSMMA AND fixVersion = "NEXT"
```

```jql
project = LMSMMA AND status = "Ready for Release" AND fixVersion = "NEXT"
```

```jql
project = LMSMMA AND fixVersion = "VERSION_NAME" ORDER BY issuetype, key
```

## Important Rules

- Always quote `fixVersion = "NEXT"` because `NEXT` is a reserved JQL word.
- Prefer Jira/GreenHopper sprint-start commitment data for committed story points.
- Keep release/version changes deliberate: confirm version name, target app, and included issue set before changing Jira.
- Do not expose values from `.env` in notes, logs, or chat summaries.
