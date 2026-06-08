# Phrase Setup Notes

## Purpose

Use Phrase Strings for LMS translation keys and locale content used in user stories and release work.

## Codex MCP Server

Configured Codex server name:

```text
lms-phrase
```

Server location:

```text
/Users/wouter.rijmenam/Documents/Projects/Qraft/projects/lms/mcp/phrase-mcp-codex
```

Codex launch command:

```text
node /Users/wouter.rijmenam/Documents/Projects/Qraft/projects/lms/mcp/phrase-mcp-codex/dist/index.js
```

The server reads secrets from:

```text
/Users/wouter.rijmenam/Documents/Projects/Qraft/projects/lms/mcp/phrase-mcp-codex/.env
```

Required value:

```text
PHRASE_ACCESS_TOKEN=<phrase access token>
```

Optional values:

```text
PHRASE_PROJECT_ID=<default project id>
PHRASE_BRANCH=<default branch>
PHRASE_PLATFORM_TOKEN_ENDPOINT=https://eu.phrase.com/idm/oauth/token
PHRASE_OTP=<two-factor token when required>
REQUEST_TIMEOUT_MS=30000
```

Supported alias:

```text
PHRASE_TOKEN
```

Useful commands:

```sh
codex mcp list
codex mcp get lms-phrase
codex mcp remove lms-phrase
```

After adding or changing MCP config, restart Codex or open a new chat if the tools do not appear in the current session.

## Working Rules

- Keep real Phrase tokens only in `.env`.
- Legacy Strings access tokens and newer Phrase Platform API tokens are both supported.
- Do not copy token values into markdown, logs, examples, or chat summaries.
- Prefer searching existing keys before creating new keys.
- Confirm project, branch, locale, and key name before creating or updating production Phrase content.
