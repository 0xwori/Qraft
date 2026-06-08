---
name: mma-user-stories
description: Write small, clear, dev-ready user stories for the Politie MMA Team across 112NL, Burgernet, NL-Alert, backend, web, and enabler work.
---

# MMA User Stories

Use this skill when writing or refining user stories for the Politie MMA Team.

## Principles

- Keep stories small, simple, straight to the point, and valuable to developers, testers, and non-technical stakeholders.
- Use concrete behavior and avoid broad implementation guesses.
- Keep acceptance criteria short and grouped by behavior.
- Include accessibility and localization expectations by default.
- If design or endpoint details are missing, use `TBD` placeholders instead of inventing facts.

## Required Template

Use the full template in `references/user-story-template.md`.

## Platform Tags

Use one of:

- `[Platform: APP]`
- `[Platform: Backend]`
- `[Platform: WEB]`
- `[Platform: ENABLER]`

## Acceptance Criteria Style

- Use top-down structure: navigation, content blocks, feedback, interactions.
- Include relevant states: normal, empty, error, settings/permissions, and offline modes.
- Use simple forms:
  - If `[condition]`, then `[expected result]`.
  - Show `[UI element]` with `[behavior or rule]`.
  - Display `[logic]` when `[trigger]`.
  - Hide or disable `[component]` under `[condition]`.

## Phrase Key Rules

- Keys are descriptive and scoped to screen or component.
- Start with the screen/component prefix.
- End in `_title`, `_subtitle`, `_button`, `_message`, or similar.
- Use `general_` prefix for reusable keys.
- Image/icon-only buttons must include `accessibility_` keys.

## Accessibility Defaults

Unless explicitly out of scope, include:

- Dynamic font support up to maximum system size.
- Dark mode support.
- Landscape support.
- VoiceOver / TalkBack naming, order, visibility, and grouping.

