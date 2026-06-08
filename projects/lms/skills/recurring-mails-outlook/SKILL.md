---
name: recurring-mails-outlook
description: Draft recurring LMS stakeholder mails and open Outlook when possible for release advice, Go/No-Go, TeK handover, and release announcements for 112NL, Burgernet, and NL-Alert.
---

# Recurring LMS Mails With Outlook

Use this skill when drafting or preparing recurring LMS emails for 112NL, Burgernet, NL-Alert, backend/general releases, TeK handovers, release advice, Go/No-Go, or release announcements.

## Inputs To Collect

Before finalizing a mail, identify:

- Product: 112NL, Burgernet, NL-Alert, backend/general, or combined.
- Mail type: release advice, Go/No-Go, TeK handover, or release announcement.
- Version and platform scope.
- Build numbers where applicable.
- Jira version links and release notes.
- Reply ticket when applicable.
- Planned go-live date or timing.

If a value is missing, keep a visible placeholder like `[ANDROID_BUILD_NUMBER]`; do not invent operational facts.

## References

- Stakeholders: `references/stakeholder-lists.md`
- Release advice: `references/release-advice.md`
- Go/No-Go: `references/go-no-go.md`
- Mandatory release advice procedure: `../../procedures/release-advice-mail.md`

## Workflow

1. Pick the stakeholder group by product.
2. Draft To, CC, subject, and body.
3. For release advice, generate one Jira release-items PDF per linked release version and attach all PDFs to the draft.
4. Keep wording professional, concise, and ready to paste into Outlook.
5. Always open the generated `.eml` draft in Outlook for review, unless Wouter explicitly asks not to open Outlook.
6. Do not send externally without explicit confirmation.

## Release Advice Script

Use the bundled script to create the release-items PDF and `.eml` draft:

```sh
python3 projects/lms/skills/recurring-mails-outlook/scripts/release_advice.py \
  --product NL-Alert \
  --version 1.5.0 \
  --jira-version-link https://jira.example.com/projects/LMSMMA/versions/15203 \
  --reply-ticket LMSMMA-896 \
  --go-live "ASAP after green light." \
  --platform Android=1591 \
  --platform iOS=215
```

If the Jira release link does not contain `/versions/<id>`, add `--fix-version VERSION_NAME`.

The script opens Outlook by default. Do not use `--no-open` unless Wouter explicitly asks for files only.

## Output Format

```text
To:
CC:
Subject:

Body:
...

Draft:
PDFs:
Opened in Outlook:
```

## Safety

- Never include passwords, tokens, VPN details, or private credentials.
- Confirm final recipients before external sending.
- Use placeholders for missing build numbers, Jira links, ticket IDs, and dates.
