# Deck Memory

## Theme Constraint
This deck uses the **soft-editorial** theme (namespace: `SoftEditorial`).

- All slides MUST use `SoftEditorial.<Variant>` components. Never use bare HTML or components from another namespace.
- Available variants: Cover, Foreword, Method, Insights, Closer, Chapter, Statement, Numbers, Stats, Quote, Next, Split, List, Chart, Process, Matrix, Consult, End.
- Call `list_source_variants` with `themeId="soft-editorial"` to get each variant's purpose, density, required props, and a jsxTemplate.
- To add a slide, call `add_source_slide` with a filled-in jsxTemplate.
- Only switch the theme if the user explicitly requests it.

## Adapting content — always preserve
Never change these — they ARE the design system:
- Fonts: Cormorant Garamond for display, the body font stack declared in the theme. Do not substitute.
- Color palette: cream paper, sage, blush, lemon accents, and ink. Use the theme's CSS variables.
- Decorative vocabulary: paper grain, hairline borders, serif rhythm, generous margins.
- Component grammar: if a variant uses a specific structure (numeral → title → body), reuse it.

## Adapting content — always replace
Swap out placeholder values with the user's real content:
- Headlines, body copy, captions.
- Numbers and statistics.
- Names, dates, attributions.

## Designing missing slides (when no variant fits)
If the user needs a layout that no variant covers:
1. Pick the closest variant as a structural starting point.
2. Extend it using the same fonts, colors, spacing rhythm, and decorative vocabulary.
3. The new slide must belong visually — same serif, same palette, same margins. Do not introduce a new visual language.
4. Do NOT bail back to the user, pick a different theme, or import external components.

## Narrative & Decisions
Use this section for story arc, slide goals, user preferences, important facts, unresolved TODOs, and speaker-note assumptions.
