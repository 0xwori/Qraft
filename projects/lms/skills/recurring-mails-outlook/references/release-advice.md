# Release Advice Mail

Use after cut-off and acceptance testing when requesting TeK release advice and chain testing.

## Recipients

For release advice mails, Release stakeholder is always the primary addressee:

```text
To: Release stakeholder <[email omitted]>
CC: Release CC stakeholder <[email omitted]>; [email omitted]; Release CC stakeholder <[email omitted]>; Delivery stakeholder <[email omitted]>; Delivery stakeholder <[email omitted]>
```

Use product contacts only when explicitly requested; do not replace the configured release stakeholder as the To recipient for release advice.
Always include Release CC stakeholder, Release CC stakeholder, Release CC stakeholder, Delivery stakeholder, and Delivery stakeholder in CC for release advice.

## Attachment

Generate and attach one PDF per linked Jira release version before preparing the Outlook draft. The PDF list should only include ticket ID, type, and story title.

## Outlook Draft

Always open the generated `.eml` draft in Microsoft Outlook after the PDFs are attached. A release advice request is not finished when only the mail text is shown in chat.

## Subject

```text
Request for release advice and chain testing - [PRODUCT] v[VERSION]
```

## Template

```text
Hi TeK-Team,

Hereby a request for release advice and chain testing - [PRODUCT] v[VERSION]

[PLATFORM]:
Build number: [BUILD_NUMBER]
Release notes: [JIRA_VERSION_LINK]

[PLATFORM]:
Build number: [BUILD_NUMBER]
Release notes: [JIRA_VERSION_LINK]

Attachments: [RELEASE_ITEMS_PDF_PER_RELEASE]

Release advice reply on the following ticket: [JIRA_TICKET]

Planned go-live: [GO_LIVE_TIMING]

Kind regards,
Project owner
```
