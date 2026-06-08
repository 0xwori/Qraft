---
name: mma-pre-release-walkthrough
description: Create LMS pre-release walkthrough and demo presentations for Team MMA, including developed work tables, demo agendas, and Demo time sections for Burgernet, NL-Alert, and 112NL.
---

# MMA Pre-Release Walkthrough

Use this skill when creating a pre-release walkthrough deck, sprint demo deck, product demo, or developed-work presentation for Team MMA products: Burgernet, NL-Alert, or 112NL.

## Output

- Create an editable `.pptx` by default.
- Use the Presentations plugin/skill for actual deck creation, rendering, preview QA, and PPTX export.
- Do not require direct `.key` output. PPTX can be opened in Keynote when needed.

## Required Inputs

Before making the deck, identify:

- Product: `Burgernet`, `NLAlert`, or `112NL`.
- Scope: release/fixVersion, sprint, or explicit Jira ticket set.
- Optional demo focus, presenter notes, screenshots, or manual additions.

If a value is missing, use clear placeholders such as `[RELEASE_NAME]`, `[SPRINT]`, or `[DEMO_FOCUS]`.

## Jira MCP First

Use `lms-jira` MCP as the default source for developed work. Do not rely on ad-hoc scripts when Jira data is needed.

Use Jira MCP to:

- Search issues with `search_jql`.
- Scope by `project = LMSMMA`.
- Match the product through summary, labels, exact selected fixVersion names, or explicit ticket selection.
- Scope by selected release/fixVersion or sprint.
- Include Stories, Tasks, and Bugs.
- Prioritize `Ready for Release`, `Released`, and Jira status category Done.

Jira does not support broad text search with `fixVersion ~ "Product"`. Use exact fixVersion names when scoping by release, or use summary/labels for product matching.

Manual user input may supplement Jira data, but should not replace Jira MCP unless explicitly requested.

## Developed Work Table

Transform Jira results into a PM-ready table. Keep it readable enough for a walkthrough slide.

Default columns:

- Jira key(s)
- Theme / functionality
- Platform
- Status
- Release / fixVersion
- Demo relevance

Combine related tickets into feature/theme rows when that improves readability. Keep ticket keys visible. Mark technical/background work as not demo-worthy instead of forcing it into the demo flow.

## Deck Shape

Use the fixed structure in `references/deck-structure.md`.

For Burgernet, default table framing:

- `Burgernet - Developed work`
- `What we are going to present`
- `Demo time!`

## Visual Reference

Use the copied Keynote deck as a visual reference for pacing, tone, and layout feel:

```text
assets/reference/NL-Alert-68 - Demo- Team MMA.key
```

Treat it as a reference, not as a file to modify. Preserve client material; create new generated decks in a separate output location.

## Presentation Rules

- Keep the deck practical and demo-oriented, not a stakeholder report.
- Use concise slide copy.
- Use large, readable tables.
- Move dense ticket lists to appendix if needed.
- Keep the “Demo time!” section clear and obvious.
- Include open points, risks, or follow-ups only if useful for the walkthrough.

## Quality Check

Before delivering a final PPTX:

- Render previews.
- Check table readability.
- Confirm product and release/sprint scope.
- Confirm Jira keys are included.
- Confirm “Demo time!” is present.
- Confirm the deck visually follows the reference deck’s pacing and tone.
