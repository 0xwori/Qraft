# Release Advice Mail Procedure

Follow this procedure whenever Wouter asks for a release advice mail, a TeK release advice request, or a release advice draft for 112NL, Burgernet, NL-Alert, backend/general, or a combined LMS release.

## Required Outcome

The task is only complete when:

- The release advice mail has To, CC, subject, and body filled.
- One release-items PDF exists for each linked Jira release version.
- All generated PDFs are attached to the mail draft.
- The `.eml` draft is opened in Microsoft Outlook for Wouter to review.

Do not stop at a text-only mail draft unless Outlook cannot be opened. If Outlook cannot be opened, clearly say that and provide the `.eml` and PDF paths.

## Steps

1. Read the LMS stakeholder list, mail template, and recurring mail skill.
2. Confirm or preserve placeholders for product, version, platforms, build numbers, Jira release links, reply ticket, and planned go-live.
3. Use the release advice script to generate the Jira release-items PDFs and the `.eml` draft.
4. Check that every linked Jira release version has its own PDF attachment.
5. Open the generated `.eml` draft in Microsoft Outlook.
6. Verify the draft has the expected To, CC, subject, body, and PDF attachments.
7. Tell Wouter where the draft and PDFs were created, and whether Outlook opened successfully.

## Command Pattern

Use this script pattern and fill the real values or visible placeholders:

```sh
python3 projects/lms/skills/recurring-mails-outlook/scripts/release_advice.py \
  --product NL-Alert \
  --version 1.5.0 \
  --jira-version-link Android=https://jira.example.com/projects/LMSMMA/versions/15203 \
  --jira-version-link iOS=https://jira.example.com/projects/LMSMMA/versions/15204 \
  --reply-ticket LMSMMA-896 \
  --go-live "ASAP after green light." \
  --platform Android=1591 \
  --platform iOS=215
```

The script opens Outlook by default. Do not add `--no-open` unless Wouter explicitly asks not to open Outlook.

## Safety

- Do not send the mail. Wouter reviews and sends it.
- Do not invent missing operational facts.
- Do not write real secrets or credentials into markdown, logs, examples, or chat summaries.
