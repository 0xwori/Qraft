# Microsoft Graph Outlook Setup Notes

Use this file to prepare Outlook monitoring for q-Tapwise.

No live Outlook access is configured by this file.

## Goal

Allow an agent to read Outlook mail through Microsoft Graph so it can summarize inbox activity, find Tapwise-related opportunities, and suggest follow-up actions.

## Planned Access

Mail scope: whole inbox.

Because this is broad access, the agent must store only short summaries and action items. It must not store raw email bodies or personal data in project files.

## Environment Variables

Use `.env` locally for real values. Use `.env.example` for variable names only.

Required variable names:

```text
MICROSOFT_TENANT_ID
MICROSOFT_CLIENT_ID
MICROSOFT_CLIENT_SECRET
MICROSOFT_REDIRECT_URI
MICROSOFT_GRAPH_SCOPES
MICROSOFT_MAILBOX_USER_ID
MICROSOFT_OUTLOOK_DELTA_LINK
```

## Suggested Graph Permissions

Start with the smallest useful permission set.

- `offline_access`
- `User.Read`
- `Mail.Read`

Do not add send, delete, or write permissions unless Wouter explicitly asks for that later.

## Monitoring Output Shape

When mailbox monitoring exists, summarize like this:

```markdown
# Outlook Summary - YYYY-MM-DD

## Important Messages

- Sender type: lead / partner / customer / internal / unknown
- Topic: short neutral summary
- Suggested action: what Wouter should do next
- Deadline: only if present

## Follow-Ups

- Action item
- Owner
- Suggested timing

## Notes

- Mention if anything needs manual review.
- Do not paste raw email bodies.
```
