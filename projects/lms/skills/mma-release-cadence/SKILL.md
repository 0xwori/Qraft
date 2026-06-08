---
name: mma-release-cadence
description: Work with the Politie MMA 12-week release cadence, batches, Jira workflow, cut-off, TeK handover, release moments, and velocity concepts.
---

# MMA Release Cadence

Use this skill when planning, explaining, logging, or operationalizing MMA cadence work.

## Core Model

- Cadences last 12 weeks.
- A new cadence starts every 4 weeks, so cadences overlap.
- Each cadence contains 3 batches of 4 weeks.
- Milestones: Start, Cut-off, TeK Handover, Release.
- Parallel rows: DEV, QA, Regressie, TeK Testing, Bugfixing TeK.

## Milestones

- Week 1 Start: cadence kicks off.
- Week 4 Cut-off: release scope is locked in Jira with `fixVersion`.
- Week 8 TeK Handover: software is handed to TeK and a formal email goes out.
- Week 12 Release: Jira version is released, issues are transitioned, and release announcement is sent.

## Jira Workflow

```text
Backlog -> Ready for Sprint -> In Development -> In QA -> In TeK -> Ready for Release -> Released
```

## Work Types

- Stories: nieuwe functionaliteiten
- Tasks: enablers
- Bugs: bugfixes

## Velocity

Track:

- Committed SP at sprint start via GreenHopper.
- Completed SP with feature, enabler, and bug breakdown.
- Average velocity, commitment accuracy, and growth versus the 12-sprint average.

## References

Detailed cadence reference: `references/cadence-rhythm.md`

