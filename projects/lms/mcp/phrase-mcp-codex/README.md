# Phrase MCP Server for Codex

Stdio MCP server for Phrase Strings PM workflows in the LMS client workspace.

## Setup

1. Install and build:

```sh
npm install
npm run build
```

2. Create `.env`:

```sh
PHRASE_ACCESS_TOKEN=your-phrase-access-token
PHRASE_PROJECT_ID=your-default-project-id
PHRASE_BRANCH=optional-default-branch
PHRASE_PLATFORM_TOKEN_ENDPOINT=https://eu.phrase.com/idm/oauth/token
REQUEST_TIMEOUT_MS=30000
```

`PHRASE_TOKEN` is also supported as an alias for `PHRASE_ACCESS_TOKEN`.

3. Add the server to Codex MCP config:

```sh
codex mcp add lms-phrase -- node /Users/wouter.rijmenam/Documents/Projects/Qraft/projects/lms/mcp/phrase-mcp-codex/dist/index.js
```

Restart Codex or open a new chat if the tools do not appear in the current session.

## Tools

Read tools:

- `list_phrase_projects`
- `get_phrase_project`
- `list_phrase_locales`
- `search_phrase_keys`
- `get_phrase_key`
- `list_phrase_translations_by_locale`

Write tools:

- `create_phrase_key`
- `create_phrase_translation`
- `update_phrase_translation`

## Notes

- This server targets Phrase Strings API v2 at `https://api.phrase.com/v2`.
- Legacy Strings access tokens are sent as `Authorization: token <token>`.
- Phrase Platform API tokens are exchanged for a short-lived JWT and then sent as `Authorization: Bearer <jwt>`.
- Keep real tokens in `.env` only. Do not copy them into notes, logs, examples, or chat.
