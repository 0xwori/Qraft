# Deck Memory

## Theme Constraint
This deck uses the **block-frame** theme (namespace: `BlockFrame`).

- Prefer `BlockFrame.<Variant>` components. Small raw JSX sections are allowed only when needed to keep Jira issue lists readable in the same blockform visual language.
- Available variants used here: Cover, Stats, Overview, DiagramFull, End.
- Call `list_source_variants` with `themeId="block-frame"` to get each variant's purpose, density, required props, and a jsxTemplate.
- To add a slide, call `add_source_slide` with a filled-in jsxTemplate.
- Only switch the theme if the user explicitly requests it.

## Adapting content — always preserve
Never change these — they ARE the design system:
- Fonts: Inter and Space Grotesk from the BlockFrame theme.
- Color palette: off-white, black borders, pink, blue, green, yellow, and cream blocks.
- Decorative vocabulary: thick black borders, hard shadows, chunky labels, and block cards.
- Component grammar: block-first, high-contrast, readable issue rows.

## Adapting content — always replace
Swap out placeholder values with the user's real content:
- Headlines, body copy, captions.
- Numbers and statistics.
- Names, dates, attributions.

## Data
The deck uses Tapwise Jira stories whose returned Jira status name is `Done`, fetched 2026-05-25.

## Narrative & Decisions
Use this section for story arc, slide goals, user preferences, important facts, unresolved TODOs, and speaker-note assumptions.
