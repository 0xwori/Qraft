# LMS Context

## Role

Project owner works as Product Manager for LMS and supports the Politie MMA Team.

## Products

- 112NL
- Burgernet
- NL-Alert

## Tools

- Jira via VPN
- Figma
- Affine
- Outlook

## MMA Cadence Rhythm

The team works in rolling 12-week cadences. A new cadence starts 4 weeks after the previous one, so multiple cadences overlap.

Each cadence is divided into 3 batches of 4 weeks.

| Week | Milestone | What happens |
|---|---|---|
| Week 1 | Start | Cadence kicks off |
| Week 4 | Cut-off | Stories assigned to this release are locked with `fixVersion` in Jira |
| Week 8 | TeK Handover | Software is handed to TeK for external testing and a formal email goes out |
| Week 12 | Release | Jira version is marked released and release announcement email is sent |

## Batch Model

| Batch | Weeks | DEV track | Test track |
|---|---:|---|---|
| Batch 0 | 1-4 | Development -> Development and Bugfixing | QA |
| Batch 1 | 5-8 | Development -> Development and TeK Bugfixing | Regressie |
| Batch 2 | 9-12 | TeK bugs first / build next batch -> bugfix focus | TeK Testing and Bugfixing TeK |

Parallel rows:

- DEV
- QA
- Regressie
- TeK Testing
- Bugfixing TeK

## Jira Workflow

```text
Backlog -> Ready for Sprint -> In Development -> In QA -> In TeK -> Ready for Release -> Released
```

Work categories:

- Stories: nieuwe functionaliteiten
- Tasks: enablers
- Bugs: bugfixes

## Velocity Tracking

The team tracks sprint-by-sprint:

- Committed SP, captured at sprint start via GreenHopper
- Completed SP with feature, enabler, and bug breakdown
- Trends such as average velocity, commitment accuracy, and growth versus the 12-sprint average

## Cadence App Context

The MMA cadence app visualizes the process:

- `/overview` shows the diagonal waterfall of overlapping cadences across the year.
- `/dashboard` shows sprint velocity health.
- `/settings` controls the cadence anchor date.

Known implementation decisions from the cadence app:

- Use GreenHopper API for committed SP.
- Keep `jiraRequest` separate from `jiraFetch` because GreenHopper/Agile paths do not start with `/rest/api/2`.
- Quote `fixVersion = "NEXT"` in JQL.
- Keep the app light-mode only.

