# LMS Jira Workflow

## Issue Flow

```text
Backlog -> Ready for Sprint -> In Development -> In QA -> In TeK -> Ready for Release -> Released
```

## Work Types

- Story: new functionality
- Task: enabler
- Bug: bugfix

## Release Flow

1. Select issues from the `NEXT` backlog or release candidate set.
2. At cut-off, lock the release scope by setting the release `fixVersion`.
3. Complete acceptance testing.
4. Request TeK release advice and chain testing where applicable.
5. Process Go/No-Go.
6. Mark Jira version released.
7. Transition release issues to `Released` when appropriate.
8. Send release announcement.

## Important Rules

- Quote `fixVersion = "NEXT"` in JQL.
- Confirm version name and included issue set before changing Jira versions.
- Confirm whether release notes are frontend, backend, Android, iOS, or combined.

