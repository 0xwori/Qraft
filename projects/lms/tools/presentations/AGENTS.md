# LMS Presentations Guide

This folder is the LMS client-local Presentations deck workspace. It stores deck data and LMS presentation context, not the shared Presentations plugin source.

## Scope

- `decks/`: generated or edited LMS Presentations deck folders.
- `PRODUCT.md`: LMS-specific business/product context for deck generation.
- `DESIGN.md`: LMS-specific brand, typography, spacing, chart, and slide-design guidance.

## Working Rules

- Use `PRODUCT.md` and `DESIGN.md` as client-local context before creating or materially editing LMS decks.
- Store generated decks under `decks/`.
- Preserve existing deck folders unless the user explicitly asks to edit or replace that deck.
- Keep deck content PM-ready: concise, stakeholder-safe, and useful for walkthroughs, demos, releases, and planning.
- Keep ticket keys, product names, release names, and operational placeholders visible where they matter.
- Do not embed passwords, tokens, VPN details, private keys, or other credentials in decks, exported files, notes, or screenshots.

## Presentations Workflow

- Use the Presentations plugin workflow for deck creation, preview, render QA, and export.
- Use the local deck folder as the working source of truth for LMS-specific deck content.
- Render and inspect previews before handoff when making deck changes.
- Export only after previews are readable and the requested deck scope is represented.

## Coordination With Shared Tools

- Shared Presentations app source lives under `/Users/wouter.rijmenam/Documents/Projects/Qraft/Tools/Presentations/app`.
- LMS deck data stays under `/Users/wouter.rijmenam/Documents/Projects/Qraft/LMS/Tools/Presentations`.
- Do not move LMS deck data into the shared plugin app source.
