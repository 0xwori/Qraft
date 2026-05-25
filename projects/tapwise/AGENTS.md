# Tapwise Administration Workspace

This folder is for Tapwise administration, product work, marketing work, planning, documentation, Jira work, and project memory.

This folder is not the Tapwise coding repo.

The real Tapwise code repo is here:

```text
/Users/woutervanrijmenam/Documents/Projects/Tapwise-new/tapwise
```

Use that path only as a reference from this workspace. Coding tasks should happen in a separate coding project or coding session.

## How To Work Here

- Keep explanations simple and clear because Wouter is a junior developer.
- Focus on product thinking, admin work, marketing, planning, Jira, user stories, documentation, and decision tracking.
- Store Tapwise-specific memory in `Memory.md`.
- Store Tapwise-specific skills in `skills/`.
- Store Tapwise-specific MCP templates in `mcp/`.
- Store Tapwise session logs in `ai-log/`.
- Do not store secrets, API tokens, passwords, personal data, customer data, or production data in markdown files or logs.

## Tapwise Runtime Checks

When discussing Tapwise runtime issues, ingestion, enrichment, AI generation, usage tracking, Supabase-backed behavior, topic orchestration, or Trigger.dev tasks:

1. Check Trigger.dev first for task status, errors, attempts, logs, traces, and spans.
2. Check local Supabase monitoring second for database health, relevant rows, counts, and read-only SQL checks.
3. Do not run broad production checks.
4. Do not mutate data unless Wouter explicitly asks for it.
5. Explain simply what was checked, what it showed, and whether anything still needs manual validation.

## Tapwise Jira MCP

- Use `mcp/jira.template.json` as the Tapwise Atlassian Rovo MCP template.
- Use `mcp/rovo-permissions.json` for the tool permission rules.
- Ask before creating or updating Jira/Confluence content unless the permission file explicitly says `allow`.
- Never paste Atlassian tokens or generated auth headers into markdown files, logs, or chat summaries.

## AI Logs

Use timestamped markdown files for logs:

```text
YYYY-MM-DD-HHMM-topic.md
```

Keep logs useful and short.
