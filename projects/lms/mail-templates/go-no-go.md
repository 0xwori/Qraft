# Go/No-Go Mail Template

## Purpose

Use this mail after the Go/No-Go decision and production deployment.

## Subject

```text
Go/No-Go update - [PRODUCT] v[VERSION]
```

## Body

```text
Dear all,

As discussed in the Go/No-Go meeting of [PRODUCT] v[VERSION], we are pleased to inform you that [PRODUCT] v[VERSION] has been successfully deployed to production and is now live.

Please find below the deploy overview for release to Production:

Go-live date: [GO_LIVE_DATE]
App version: [APP_VERSION]
Status: Deployed to production
Jira link(s):
[JIRA_LINKS]

Release Notes - [AREA_1]:
[RELEASE_NOTES_AREA_1]

Release Notes - [AREA_2]:
[RELEASE_NOTES_AREA_2]

Should you have any questions or require further information, feel free to reach out.

Kind regards,
Project owner
```

## Example Notes

For frontend/backend releases, separate release notes by area and include the correct Jira version links for each area.

