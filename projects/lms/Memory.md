# Memory

## Role

Project owner works as Product Manager for LMS. He maintains and coordinates work for 112NL, Burgernet, and NL-Alert.

## Tools

- Jira via VPN
- Figma
- Affine
- Outlook

## MMA Way of Working

- Team MMA works in rolling 12-week cadences.
- A new cadence starts every 4 weeks, so multiple cadences overlap.
- Each cadence has 3 batches of 4 weeks.
- Milestones:
  - Week 1: Start
  - Week 4: Cut-off, stories are locked for release via Jira `fixVersion`
  - Week 8: TeK Handover, software is handed to external testing party TeK
  - Week 12: Release, Jira version is released and release announcement is sent
- Rows/tracks: DEV, QA, Regressie, TeK Testing, Bugfixing TeK.
- Jira workflow: Backlog -> Ready for Sprint -> In Development -> In QA -> In TeK -> Ready for Release -> Released.
- Work categories:
  - Stories: new functionality
  - Tasks: enablers
  - Bugs: bugfixes

## Stakeholder Groups

- 112NL has 112NL PO as PO and 112NL theme expert as theme expert.
- NL-Alert and Burgernet use Product stakeholder as main recipient.
- Common CC group includes Delivery stakeholder, Delivery stakeholder, and Release stakeholder.
- Release advice mails always use Release stakeholder as the primary addressee.
- Backend/general stakeholders: 112NL PO, Release stakeholder, Product stakeholder.

## User Story Style

Stories must be small, simple, straight to the point, and valuable to developers, testers, and non-technical stakeholders.

Required sections:

- Title with platform tag: `[Platform: APP, Backend, WEB, ENABLER]`
- Goal
- User Context
- Design
- Acceptance Criteria
- Phrase Keys
- Technical Briefing
- Accessibility Requirements

Acceptance criteria should be short, grouped by behavior, and written in clear if/then or show/display/hide/disable statements.

## Recurring Mail Patterns

- Release advice mail: sent after cut-off and acceptance testing to Release stakeholder, asks TeK for release advice and chain testing, includes app version, platform build numbers, release notes links, reply ticket, planned go-live, one release-items PDF per linked Jira release version, and an Outlook draft opened for Wouter's review.
- Go/No-Go mail: confirms successful production deployment, includes go-live date, app version, status, Jira links, frontend/backend release notes, and a support closing.

## Safety Rules

- Store full operational context locally when useful.
- Store passwords, API tokens, PATs, and MCP secrets only in the client-local `.env`.
- Never copy secret values into markdown notes, logs, memory, examples, or chat summaries.
- Keep missing values as clear placeholders.
