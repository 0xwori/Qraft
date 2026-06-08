# MMA Cadence Rhythm

## Cadence

Team MMA works in rolling 12-week cadences. Each cadence starts 4 weeks after the previous one.

## Milestones

| Week | Milestone | What happens |
|---|---|---|
| Week 1 | Start | Cadence kicks off |
| Week 4 | Cut-off | Stories assigned to this release are locked with `fixVersion` |
| Week 8 | TeK Handover | Software is handed to TeK for external testing |
| Week 12 | Release | Jira version is marked released and release announcement is sent |

## Batches

| Batch | Weeks | DEV track | Test track |
|---|---:|---|---|
| Batch 0 | 1-4 | Development -> Development and Bugfixing | QA |
| Batch 1 | 5-8 | Development -> Development and TeK Bugfixing | Regressie |
| Batch 2 | 9-12 | TeK bugs first / build next batch -> bugfix focus | TeK Testing and Bugfixing TeK |

## Rows

- DEV
- QA
- Regressie
- TeK Testing
- Bugfixing TeK

## Jira Rules

- Quote `fixVersion = "NEXT"` in JQL.
- Confirm version and included issues before changing fix versions.
- Release communication should align with the relevant product stakeholder list.

