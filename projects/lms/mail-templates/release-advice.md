# Release Advice Mail Template

## Purpose

Use this mail after cut-off and acceptance testing when TeK release advice and chain testing are needed.

## Recipients

```text
To: Release stakeholder <[email omitted]>
CC: Release CC stakeholder <[email omitted]>; [email omitted]; Release CC stakeholder <[email omitted]>; Delivery stakeholder <[email omitted]>; Delivery stakeholder <[email omitted]>
```

For release advice, the configured release stakeholder is always the primary addressee. Product contacts can be added only when explicitly requested.
Release CC stakeholder, Release CC stakeholder, Release CC stakeholder, Delivery stakeholder, and Delivery stakeholder are always included in CC for release advice.

## Attachment

Attach one PDF export per linked Jira release version. Each PDF should include every issue type returned for that specific fixVersion, with only ticket ID, type, and story title.

## Subject

```text
Request for release advice and chain testing - [PRODUCT] v[VERSION]
```

## Body

```text
Hi TeK-Team,

Hereby a request for release advice and chain testing - [PRODUCT] v[VERSION]

[PLATFORM_1]:
Build number: [BUILD_NUMBER]
Release notes: [JIRA_VERSION_LINK]

[PLATFORM_2]:
Build number: [BUILD_NUMBER]
Release notes: [JIRA_VERSION_LINK]

Attachments: [RELEASE_ITEMS_PDF_PER_RELEASE]

Release advice reply on the following ticket: [JIRA_TICKET]

Planned go-live: [GO_LIVE_TIMING]

Kind regards,
Project owner
```

## Example Source

```text
Hi TeK-Team,

Hereby a request for release advice and chain testing - NL-Alert v1.5.0

Android:
Build number: 1591
Release notes: https://jira.example.com/projects/LMSMMA/versions/XXXX

iOS
Build number: 215
Release notes: https://jira.example.com/projects/LMSMMA/versions/XXXXX

Attachments: release-advice-NL-Alert-v1.5.0-Android-items.pdf, release-advice-NL-Alert-v1.5.0-iOS-items.pdf

Release advice reply on the following ticket: LMSMMA-896

Planned go-live: ASAP after green light.

Kind regards,
Project owner
```
