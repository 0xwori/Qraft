# LMS Workspace Guide

This folder is Project owner's client workspace for Qraft LMS work with the Politie MMA Team.

## Role and Scope

- Role: Product Manager for LMS.
- Current client area: LMS / Politie MMA Team.
- Active products: `112NL`, `Burgernet`, and `NL-Alert`.
- Main responsibilities: product management, user stories, release coordination, recurring stakeholder mails, Jira hygiene, cadence/release planning, and coordination with development, QA, regression, TeK testing, and bugfixing tracks.
- Keep the Qraft root client-neutral. Project-specific operational material belongs under `projects/lms/`.

## Landscape

- `memory.md`: durable PM memory and working rules.
- `context.md`: current LMS context, cadence model, and app notes.
- `stakeholders.md`: stakeholder groups and recurring mail recipients.
- `apps/`: product notes for 112NL, Burgernet, and NL-Alert.
- `jira/`: workflows, JQL snippets, and exports.
- `releases/`: release planning, go-live notes, and release records.
- `mail-templates/`: reusable stakeholder mail templates.
- `procedures/`: mandatory step-by-step procedures for recurring LMS work.
- `mcp/`: local MCP setup notes and server projects.
- `skills/`: reusable LMS-specific Codex skills.
- `tools/presentations/`: LMS client-local Presentations deck workspace.
- `ai-log/`: timestamped Codex work notes for meaningful operational work and durable handoffs.

## Tools

- Jira via VPN for backlog, workflow, versions, releases, sprint, and velocity work.
- Figma for designs and design references.
- Affine as the Miro-style collaboration board.
- Outlook for stakeholder and release communication.
- Phrase for translation keys and locale content when needed.
- Presentations for local deck creation, preview, and export.

## Working Style

- Prefer concise PM-ready output: direct, structured, and immediately usable.
- Keep user stories small, clear, testable, and useful for developers, testers, and non-technical stakeholders.
- Keep stakeholder summaries clear enough for non-technical readers, with ticket keys and operational details visible where they matter.
- Use explicit placeholders such as `[BUILD_NUMBER]`, `[JIRA_VERSION]`, `[GO_LIVE_DATE]`, or `TBD` when facts are missing. Do not invent operational facts.
- When drafting mails, use the relevant LMS stakeholder list and keep missing build numbers, Jira versions, tickets, release notes links, and go-live dates visible as placeholders.
- Confirm final recipients before external sending. Do not send externally without explicit confirmation.
- When logging work, create a short timestamped note in `ai-log/` with decisions, actions, and open follow-ups for meaningful operational work or long-running handoffs.

## Safety Rules

- Store full working context locally when useful, but keep passwords, API tokens, PATs, VPN credentials, certificates, private keys, and other secrets out of markdown and logs.
- Store client-specific secrets only in the relevant `.env` file.
- Never copy real secret values into memory, examples, logs, generated decks, mail drafts, or chat summaries.
- Keep `.env` values private even when debugging MCP servers or scripts.

## MMA Cadence Summary

- Cadences are rolling 12-week periods, each starting 4 weeks after the previous one.
- Each cadence has 3 batches of 4 weeks.
- Key milestones: Week 1 Start, Week 4 Cut-off, Week 8 TeK Handover, Week 12 Release.
- Parallel rows: DEV, QA, Regressie, TeK Testing, Bugfixing TeK.
- Jira workflow: Backlog -> Ready for Sprint -> In Development -> In QA -> In TeK -> Ready for Release -> Released.
- Work types: Stories are new features, Tasks are enablers, Bugs are bugfixes.

## Jira Rules

- Jira access depends on VPN.
- Main project key: `LMSMMA`.
- `fixVersion = "NEXT"` must be quoted because `NEXT` is a reserved JQL word.
- GreenHopper velocity data is preferred for committed story points because it captures sprint-start commitment more accurately.
- Confirm target app, platform, version name, sprint, and issue set before mutating Jira.
- For release/cut-off work, show the planned versions and ticket list before changing fixVersions, versions, or sprint membership.

## Output Standards

- User stories must follow the LMS story style in `memory.md` and the `mma-user-stories` skill: include platform tag, Goal, User Context, Design, Acceptance Criteria, Phrase Keys, Technical Briefing, and Accessibility Requirements.
- Acceptance criteria should be short, grouped by behavior, and written in clear if/then or show/display/hide/disable statements.
- Release advice and Go/No-Go mails must use the stakeholder lists and templates in `stakeholders.md` and `mail-templates/`.
- Release advice mail requests must also follow `procedures/release-advice-mail.md`: generate the release-items PDFs, attach every PDF, and open the mail draft in Outlook before the task is considered done.
- Cadence planning should keep the 12-week rhythm, overlapping batches, cut-off, TeK handover, and release moments explicit.
- Jira hygiene output should include issue keys, status, fixVersion, platform/app assumptions, and any manual-review items.

## Skill Routing

- Use `skills/mma-release-cadence/` for cadence planning, explanation, and operationalization.
- Use `skills/mma-cut-off/` for cut-off, release-version creation, and moving `NEXT` tickets into release candidates.
- Use `skills/mma-user-stories/` for writing or refining LMS user stories.
- Use `skills/mma-pre-release-walkthrough/` for pre-release walkthrough or demo decks.
- Use `skills/recurring-mails-outlook/` for release advice, Go/No-Go, TeK handover, and release announcement mails.

## Local Knowledge Sources

- Durable context: `memory.md`
- LMS client context: `context.md`
- LMS stakeholders: `stakeholders.md`
- Mail templates: `mail-templates/`
- Mandatory procedures: `procedures/`
- Reusable skills: `skills/`
- MCP/tool setup notes: `mcp/`
- Client-local secrets: `.env`
