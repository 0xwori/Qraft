# q-Tapwise Workspace

This folder is for q-Tapwise product thinking, go-to-market work, design guidance, social media creation, ad planning, Outlook monitoring setup, and working notes.

This folder is not the Tapwise coding repo.

The real Tapwise code repo is here:

```text
/Users/woutervanrijmenam/Documents/Projects/Tapwise-new/tapwise
```

Use the real repo as reference material only from this workspace. Coding tasks should happen in a separate coding project or coding session.

## How To Work Here

- Keep explanations simple and clear because Wouter is a junior developer.
- Explain what changed, why it matters, and how to use it.
- Store stable project memory in `Memory.md`.
- Store current project context in `context.md`.
- Store project-specific working methods in `skills/`.
- Store connector notes and setup templates in `mcp/`.
- Store generated strategy, content, and planning files in `outputs/`.
- Store short session notes in `ai-log/`.
- Store subproject context in `subprojects/`.
- Store code-first ad campaigns in `tools/ad-posters/`.
- Do not store real API tokens, passwords, secrets, customer data, personal data, or raw email bodies in markdown, logs, templates, or chat summaries.
- Use `.env.example` for variable names only.
- Use `.env` locally for real secrets, and keep it ignored.

## Outlook Monitoring Rules

Outlook access is planned through Microsoft Graph.

- Whole-inbox monitoring is allowed only after OAuth credentials and permissions are configured.
- Do not claim live mailbox access until a working connector or script has been confirmed.
- Do not copy raw email bodies into project files.
- Do not store personal data in `Memory.md`, `context.md`, `ai-log/`, or `outputs/`.
- Store only short summaries, action items, dates, sender type, and follow-up needs.
- If an email contains sensitive information, summarize the business task without repeating the sensitive content.

## Social And Ads Rules

- Social scope starts with LinkedIn, Instagram, and Facebook.
- Ad planning scope starts with Meta Ads for Instagram and Facebook.
- Ad creative exports use the local Ad Posters tool.
- Drafting posts and ad plans is safe.
- Exporting PNG/MP4 ad files is safe.
- Publishing posts, changing ads, spending budget, changing audiences, or mutating external systems must always ask Wouter first.
- Any future script that posts content or changes ads must set `mutatesExternalSystem: true` and `requiresConfirmation: true` in `scripts/manifest.json`.

## Design References

Use these Tapwise design sources when creating q-Tapwise visual or content work:

```text
/Users/woutervanrijmenam/Documents/Projects/Tapwise-new/tapwise/DESIGN.md
/Users/woutervanrijmenam/Documents/Projects/Tapwise-new/tapwise/src/tapwise.landing/DESIGN.md
/Users/woutervanrijmenam/Documents/Projects/Tapwise-new/tapwise/src/tapwise.frontend/DESIGN.md
```

The local q-Tapwise summary is in `design.md`.

## Impeccable Design Check

When a new or revised q-Tapwise design is ready, always do a quick check with the Impeccable skill before final handoff or export:

```text
/Users/woutervanrijmenam/.agents/skills/impeccable/SKILL.md
```

For ads, landing visuals, UI screens, social visuals, and banners, check brand match, visual hierarchy, spacing, typography, text fit, imagery/icons, motion, CTA clarity, and whether the design avoids a generic AI-demo feel.

If the check finds issues, fix them, re-preview the design, and only then call it ready. For Ad Posters specifically, preview first, run the quick Impeccable check, then export only after Wouter approves the preview.
