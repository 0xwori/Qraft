# LMS MCP Guide

This folder contains local MCP setup notes and server projects for LMS tooling.

## Scope

- `jira/`: setup notes and examples for Jira.
- `jira-mcp-codex/`: local Jira MCP server project.
- `phrase/`: setup notes for Phrase.
- `phrase-mcp-codex/`: local Phrase MCP server project.
- `affine/`, `figma/`, and `outlook/`: setup notes for related tools.

## MCP Surfaces

- `lms-jira`: Jira Server/Data Center MCP for LMS backlog, workflow, versions, releases, sprint data, and velocity work.
- `lms-phrase`: Phrase Strings MCP for translation keys and locale content used in user stories and release work.

## Safety Rules

- Jira requires VPN access before using Jira APIs or MCP tools.
- Real credentials belong only in the relevant `.env` file inside the server project.
- Never print, copy, or summarize token values from `.env` in markdown, logs, generated examples, or chat.
- Keep setup examples placeholder-based, for example `JIRA_PAT=<personal access token>` and `PHRASE_ACCESS_TOKEN=<phrase access token>`.

## Jira Change Rules

- Main project key: `LMSMMA`.
- Always quote `fixVersion = "NEXT"` in JQL.
- Confirm the target app, platform, fixVersion, sprint, and issue list before creating versions, updating issues, or changing sprint membership.
- Prefer a dry-run or preview list for release/cut-off actions before mutation.
- Use GreenHopper data for sprint-start committed story points when velocity commitment matters.

## Phrase Change Rules

- Search existing keys before proposing or creating new keys.
- Confirm project, branch, locale, key name, and production impact before creating or updating Phrase content.
- Keep key names descriptive and scoped to the screen or component.
- Use placeholders for uncertain translations or missing product copy instead of inventing final wording.

## Local Server Work

- For changes in `jira-mcp-codex/`, run `npm run typecheck` and `npm run build` in that folder before handoff.
- For changes in `phrase-mcp-codex/`, run `npm run typecheck` and `npm run build` in that folder before handoff.
- Do not move server project folders without updating Codex MCP configuration and the setup notes, because paths are referenced directly.
- Do not commit or document `node_modules` contents.
