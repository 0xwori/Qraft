---
name: mma-cut-off
description: Run the monthly Politie MMA Cut-Off workflow for LMS by creating Jira release versions per app/platform and moving eligible NEXT tickets into the correct release batch.
---

# MMA Cut-Off

Use this skill when doing the monthly LMS Cut-Off, locking release scope, creating Jira release versions, or moving `fixVersion = "NEXT"` issues into monthly release candidate batches.

## Core Rule

Cut-Off creates one Jira release/fixVersion per app and platform:

```text
APP_PLATFORM_RC_MM.YY
```

Examples:

- `NLAlert_Android_RC_06.26`
- `Burgernet_iOS_RC_06.26`
- `112NL_Android_RC_06.26`

## Apps And Platforms

Apps:

- `112NL`
- `Burgernet`
- `NLAlert`

Platforms:

- `iOS`
- `Android`

## Eligible Jira Issues

Project: `LMSMMA`

Only move tickets that:

- Have `fixVersion = "NEXT"`; quote `"NEXT"` in JQL.
- Match the selected app by label or summary.
- Match the selected platform by Jira `Platform` field, label, summary, or existing fixVersion.
- Have status `Ready for Release`, `Released`, or Jira `statusCategory = Done`.

Tickets that do not clearly match one app and one platform must stay unchanged and be shown under manual review.

## Safety Workflow

1. Always run a dry-run first and show the planned versions and ticket list.
2. Check manual review tickets before changing Jira.
3. Only run with `--execute` after explicit user confirmation.
4. Never print Jira tokens, `.env` values, or other secrets.

## Jira MCP First

When the user asks Codex to do the Cut-Off in Jira, use the `lms-jira` MCP tools first.

Use:

- `search_jql` to find eligible `NEXT` tickets.
- `get_project_versions` to check whether monthly batch versions already exist.
- `create_project_version` to create missing batch versions after confirmation.
- `update_issue` to set each eligible issue's `fixVersions`.
- `create_issue` to create the release checklist task.
- `get_current_sprint_for_project` and `add_issues_to_sprint` to place the release task in the active sprint.

The bundled script is a repeatable dry-run/execution helper, but MCP is the preferred path when the user explicitly asks Codex to perform Jira work.

## Script

Use the bundled script for repeatable cut-off work:

```sh
python3 projects/lms/skills/mma-cut-off/scripts/cutoff_release.py --month 06 --year 26
```

Useful options:

- `--apps 112NL,Burgernet,NLAlert`
- `--platforms iOS,Android`
- `--create-release-task`
- `--task-version 2.3.0`
- `--release-date YYYY-MM-DD`
- `--execute`

Default behavior is dry-run. In dry-run mode the script reads Jira and prints what would happen, but does not create versions or update tickets.

With `--execute`, the script:

- Creates missing Jira versions for the selected app/platform/month.
- Replaces each eligible issue's fixVersion with the app/platform batch version.
- If `--create-release-task` is set, creates a Jira Task and adds it to the active sprint.

## Release Task

Use `--create-release-task` when the Cut-Off also needs a release coordination task in the current sprint.

The task must include:

- Version, release date, client contact person, tech lead, and developers.
- English and Dutch release notes section.
- Jira release-note links for iOS and Android.
- TeK Team release advice table.
- Release checklist table.

Default people:

- Client contact person: `[CLIENT_CONTACT]`
- Tech Lead: `[TECH_LEAD]`
- Developers: `[DEVELOPERS]`

Default placeholder values:

- Version: `XXX`
- Release date: `XXX`

Useful release-task options:

```sh
python3 projects/lms/skills/mma-cut-off/scripts/cutoff_release.py \
  --month 06 \
  --year 26 \
  --create-release-task \
  --task-version 2.3.0 \
  --release-date 2026-06-30
```

## Output To Review

For each app/platform batch, review:

- Version name.
- Whether the version already exists or would be created.
- Ticket count.
- Ticket key, status, and summary.

For manual review, check:

- Tickets with no clear app match.
- Tickets with no clear platform match.
- Tickets that match multiple apps or platforms.

For the release task, review:

- The active sprint found by Jira.
- The task summary.
- The release notes text.
- The release advice and checklist tables.
