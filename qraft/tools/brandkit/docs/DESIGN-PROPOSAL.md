# Brandkit — Brand Intake → Design System Tool

**Status:** proposal / research
**Date:** 2026-05-29
**Author:** Qraft

## 1. Goal

A new, **separate** Qraft tool that ingests multiple brand assets of *your* brand or
a client's brand — `.pptx`, a website URL, images/logos, a Figma file, a brand
guideline PDF — and produces an **extensive `design.md`** (plus an `assets/`
folder describing imagery, colors, type, logos in detail).

That `design.md` is then **imported by the Presentations tool** to generate a
brand-specific deck template/theme.

The key realization: **the output contract already exists.** Presentations'
`template-importer` already reads a `design.md` (YAML frontmatter +
prose body) and emits a `ThemeDefinition`. So Brandkit's job is not to invent a
format — it is to *produce that exact `design.md`*, grounded in real extracted
brand evidence rather than hand-authored.

```
brand assets ──► [Brandkit intake] ──► design.md + assets/ ──► [Presentations importer] ──► theme JSON ──► deck
```

## 2. The integration contract (what we must emit)

The Presentations importer (`qraft/tools/presentations/app/packages/template-importer`)
consumes a per-template folder:

```
<slug>/
  design.md      # YAML frontmatter (tokens) + prose body  ← the spec
  template.json  # mood / occasion / tone / palette metadata
  template.html  # reference render; importer harvests <link> Google Fonts + decorative CSS motifs
```

`design.md` frontmatter shape the importer understands (see
`mappers/tokens.ts`):

- `name`, `description`
- `colors:` named hex/rgba values. The importer aliases them to canonical roles
  (`bg`, `primary`, `secondary`, `accent`, `text`, `muted`, `card`, `border`,
  `positive`, `negative`) via `COLOR_ALIASES`, and carries every raw color
  through so prose `{colors.<name>}` refs resolve.
- `color-aliases:` optional semantic remap.
- `typography:` per-token objects (`display`, `h1`, `h2`, `body`, `label`, …)
  with `fontFamily`, `fontSize`, `fontWeight`, `lineHeight`, `letterSpacing`,
  `textTransform`. Importer reduces to `display` / `body` / `mono` font stacks
  via `TYPOGRAPHY_ALIASES`.
- `spacing:` `pad-x/y`, `gap-*`, `radius`, etc.
- `canvas:` width/height.
- `components:` named component recipes referencing `{colors.*}` / `{spacing.*}` /
  `{typography.*}` tokens.

Prose body sections (from the studio/broadside templates): Overview, Colors,
Typography, Layout, Depth & Elevation, Shapes & Treatment, Do's & Don'ts,
Responsive Behavior, Iteration Guide, Known Gaps.

**Implication:** Brandkit must emit (1) frontmatter tokens, (2) a grounded prose
spec, (3) `template.json` metadata, (4) ideally a `template.html` reference so the
importer can harvest font `<link>`s and decorative CSS. Plus an `assets/` folder
(logos, fonts, representative imagery, swatch sheet).

## 2b. v1 input scope

v1 targets **three inputs: PPTX, website URL, and Figma link.** These cover most
real cases without the harder extraction paths. Brand-guide PDF (vision LLM) and
raw-image color quantization are deferred to a later version.

**Recommended build order** (reliability vs. effort):

1. **PPTX first** — fully local, deterministic, no auth. Reading `theme1.xml`
   gives exact hex + font names. Proves the whole spine
   (extract → DTCG → design.md → presentations importer) with zero external deps.
2. **Website second** — broad coverage (every brand has a site); palette is
   *inferred* from computed-style usage frequency rather than declared.
3. **Figma last** — cleanest tokens when accessible, but the Variables API is
   Enterprise-gated (see §7b), so the realistic path is Styles→Nodes and depends
   on the file having named styles. Most uncertain of the three — save it until
   the spine is proven.

All three reconcile in Stage 3 (priority: figma > pptx > website); having more
than one source improves confidence and surfaces conflicts.

## 3. Pipeline architecture

Five stages. Canonical internal model is **W3C DTCG design tokens** (stable
v2025.10) so every source normalizes into one shape with provenance, then a
single emitter maps DTCG → the Presentations `design.md`.

```
                 ┌─────────── extractors (per source) ───────────┐
 drop/ assets ─► │ pptx · figma · website · pdf/img · raw image   │
                 └───────────────────┬───────────────────────────┘
                                     ▼ evidence (DTCG tokens + provenance + confidence)
                              [2] fuse / reconcile
                                     ▼ canonical DTCG token set + asset manifest
                              [3] derive (roles · scale · contrast)
                                     ▼
                              [4] synthesize design.md (+ template.json, template.html, assets/)
                                     ▼
                              [5] handoff → Presentations importer
```

### Stage 1 — Ingest & classify
A drop folder per brand: `inputs/` holds whatever the user dropped plus a
`sources.json` describing non-file inputs (website URL, Figma file key + token).
Classify by extension/MIME and route.

### Stage 2 — Extractors (one per source type)

Each extractor emits **evidence**: DTCG-style tokens tagged with
`$extensions.brandkit.source` and a confidence score. Nothing is authoritative
yet.

| Source | Technique | Libraries / APIs |
|---|---|---|
| **PPTX** | Unzip OPC; read `ppt/theme/theme1.xml` → `<a:clrScheme>` (dk1/lt1/dk2/lt2/accent1-6/hlink — read `lastClr` on `sysClr`) and `<a:fontScheme>` (`majorFont`/`minorFont` → `<a:latin typeface>`). Pull logos from `ppt/media/`. | `jszip` + `fast-xml-parser` (zero native deps) |
| **Figma** | REST: `GET /v1/files/:key/variables/local` for color/number tokens (Enterprise) → fall back to `GET /v1/files/:key/styles` then resolve values via `GET /v1/files/:key/nodes?ids=` (read `fills[].color` {r,g,b,a 0-1}, `style.fontFamily/fontWeight/fontSize/lineHeight`). If client uses Tokens Studio, ingest its DTCG JSON directly. | `X-Figma-Token` PAT; honor `Retry-After` on 429 |
| **Website** | Headless render; in-page collect `:root` `--*` custom props, frequency-map `getComputedStyle` `fontFamily`/`color`/`backgroundColor` on headings/body/buttons; grab logo (`<link rel=icon>`, `og:image`, header svg); quantize a screenshot for dominant colors. Optional shortcut: Brandfetch Brand API (`colors[]`, `fonts[]`, `logos[]`). | `playwright`; `node-vibrant`; optional Brandfetch |
| **Brand guide PDF / brand board** | Render pages to PNG, send to a vision model with **forced tool-use** whose `input_schema` IS the token schema (≈99.9% schema-valid). Extract hex, font names, spacing/grid rules, logo clearspace/min-size, do/don't pairs. One page at a time; `null` for unknowns. | `pdf-to-img` (pure JS via pdfjs); Claude vision + strict tool use |
| **Raw images / logos** | Color quantization in a perceptual space; score candidates for role assignment. | `material-color-utilities` (Celebi/Wu + WSMeans, HCT) for quality, or `node-vibrant` for instant named swatches |

### Stage 3 — Fuse, derive, validate

1. **Reconcile** evidence across sources by priority:
   `explicit brand guide PDF > Figma variables > PPTX theme > website computed
   styles > image-derived`. Merge near-duplicate colors by clustering in
   **OKLCH** (perceptually linear hue; native CSS).
2. **Assign roles** with a Material-You-style score: highest-population
   high-chroma → primary; next distinct hue → secondary; high-chroma /
   low-population → accent; lowest-chroma cluster → neutral/bg/text.
3. **Build the type scale**: fit observed font sizes to the nearest modular
   ratio (1.2 / 1.25 / 1.333 / 1.5), emit `clamp()` fluid sizes. Map
   heading font → `display`, body font → `body`, any mono → `mono`.
4. **Enforce contrast**: for each text/bg pair, hold hue+chroma and nudge OKLCH
   lightness (or HCT tone) until ≥ 4.5:1 (normal) / 3:1 (large). Record
   adjustments.
5. **Validate** the DTCG bundle (Zod schema) and produce a confidence/coverage
   report listing gaps (e.g. "no body font found — defaulted to Inter").

### Stage 4 — Synthesize `design.md`

A `dtcg → design.md` emitter:
- **Frontmatter**: deterministic mapping DTCG → `colors` / `color-aliases` /
  `typography` (full CSS props) / `spacing` / `canvas` / `components`.
- **Prose body**: a grounded Claude pass writes Overview / Colors / Typography /
  Layout / Do's & Don'ts in the house style of the existing templates,
  **constrained to the extracted tokens** (no invented hexes). Mirrors the
  Impeccable `brand.md` register guidance.
- **`template.json`**: derive `mood`/`tone`/`occasion`/`formality`/`density` from
  palette + type characteristics (and the guide's voice words if present).
- **`template.html`**: a reference deck render so the importer harvests Google
  Font `<link>`s and any decorative CSS motifs.
- **`assets/`**: deduped logos (light/dark), font files or Google Fonts links, a
  swatch sheet PNG, representative imagery, and `provenance.json`.

### Stage 5 — Handoff to Presentations
Copy the produced source folder into
`qraft/tools/presentations/workspace/templates/sources/<brand>/` (shared) or a
project root, then run the existing importer to emit the theme JSON. Brandkit
never writes theme JSON itself — it stops at the `design.md` contract, keeping a
clean seam.

## 4. Placement in Qraft

```
qraft/tools/brandkit/                 # new shared tool (parallel to presentations)
  app/                                # TS source: extractors, fuse, emitter, MCP server
  scripts/  setup.sh start-mcp.sh
  docs/     DESIGN-PROPOSAL.md (this file)
qraft/skills/brandkit/SKILL.md        # routed from the qraft skill (e.g. "Qraft brand")
qraft/registry/tools.json             # register kind:"mcp"
projects/<project>/tools/brandkit/<brand>/
  inputs/        # dropped assets + sources.json
  design.md      # ← emitted
  template.json template.html assets/
```

Reuse the Presentations `client.registry.json` roots so a brand lives beside its
decks.

## 5. Phasing

- **Phase 0 — contract test.** Hand-write a `design.md` for one real brand, run it
  through the Presentations importer, confirm a theme + deck render. Locks the
  contract before any extraction code.
- **Phase 1 — happy-path single source.** PPTX **or** website extractor →
  DTCG → deterministic `design.md` frontmatter (skip prose synthesis; stub
  body). Proves the spine end-to-end.
- **Phase 2 — color/type intelligence.** OKLCH clustering, role scoring, modular
  scale fitting, WCAG contrast enforcement. Add image/logo extractor.
- **Phase 3 — multi-source fusion + vision.** Reconciliation by priority; brand
  guide PDF via vision + forced tool use; Figma REST.
- **Phase 4 — prose synthesis + template.html + assets.** Full studio-quality
  `design.md`, swatch sheets, logo handling, handoff automation.

## 6. Key risks / decisions

- **Figma Variables API is Enterprise-only.** Fallback path (styles → nodes) and
  Tokens Studio JSON import are mandatory, not optional.
- **Font identification from rendered images is hard** (DeepFont ~80% top-5).
  Prefer computed-style scraping (website) and explicit font names (PPTX
  fontScheme, guide PDF text) over visual recognition; treat image-only font ID
  as a last resort / suggestion.
- **External API dependence** (Brandfetch, Figma, vision) vs. fully-local. Keep
  every external source optional with a local fallback.
- **Prose quality.** The body must read like the existing templates, not generic
  AI brand copy — lean on the Impeccable `brand.md` anti-slop guidance and ground
  strictly in extracted tokens.
- **Provenance & trust.** Every token records its source and confidence; the
  human reviews `design.md` before it becomes a template.

## 7. Reference stack

- Tokens: **W3C DTCG v2025.10** internal model; **Style Dictionary v4** if we ever
  emit CSS/SCSS.
- Color: `material-color-utilities` (HCT, Celebi quantizer, score) and/or
  `node-vibrant`; `culori`/`chroma.js` for OKLCH math + contrast.
- PPTX: `jszip` + `fast-xml-parser`.
- Website: `playwright`; optional Brandfetch Brand API.
- PDF: `pdf-to-img` (pdfjs) → Claude vision with strict tool use.
- Figma: REST `variables/local`, `styles`, `nodes`.

## 7b. Figma deep-dive (priority source)

Figma is the highest-value source because, when a brand maintains a Figma
library, the tokens are *already* structured — no inference needed. But access
tier matters a lot, so the extractor needs a layered strategy.

**Auth.** Personal Access Token in header `X-Figma-Token: <pat>` (or OAuth2
bearer). PATs now expire (90-day max). The `file_key` is the segment in a Figma
URL: `figma.com/file/<file_key>/...` or `/design/<file_key>/...`.

**Layered extraction strategy (best → fallback):**

1. **Local Variables** — `GET /v1/files/:key/variables/local`.
   - Returns `meta.variableCollections` (each: `modes[]`, `defaultModeId`,
     `variableIds[]`) and `meta.variables` keyed by id.
   - Each variable: `resolvedType` (`COLOR` | `FLOAT` | `STRING` | `BOOLEAN`),
     `valuesByMode` (modeId → value), `scopes`.
   - A `COLOR` value is `{ r, g, b, a }` floats **0–1** → convert to `#RRGGBB`.
     Aliases appear as `{ type: "VARIABLE_ALIAS", id: "..." }` → resolve
     transitively. `FLOAT` variables in a "spacing"/"radius" collection map to
     `spacing` tokens; multi-mode collections (light/dark) map to theme variants.
   - **Caveat:** the Variables REST API requires the `file_variables:read` OAuth
     scope and is **Enterprise-org only** for full members. This is the cleanest
     path but won't be available for many clients.

2. **Tokens Studio JSON** (no API needed). If the team uses the Tokens Studio
   (formerly "Figma Tokens") plugin, tokens are synced to a Git repo or stored as
   plugin data in DTCG-ish JSON: `{ "color": { "primary": { "value": "#...",
   "type": "color" } } }`. Ingest that file directly — it maps almost 1:1 to our
   DTCG internal model. Treat this as a first-class input alongside the API.

3. **Styles → Nodes** (works on any paid seat; the realistic default).
   - `GET /v1/files/:key/styles` returns style *metadata only* (`key`, `name`,
     `style_type` ∈ `FILL` | `TEXT` | `EFFECT` | `GRID`) — **not values**.
   - Resolve values via `GET /v1/files/:key/nodes?ids=<comma-separated>`: read
     `fills[]` (SolidPaint `{ color:{r,g,b,a}, opacity }`) for FILL styles, and
     `style` (`fontFamily`, `fontWeight`, `fontSize`, `lineHeight`,
     `letterSpacing`) for TEXT styles, `effects[]` for shadows.
   - Style `name` strings (e.g. `Brand/Primary`, `Heading/H1`) carry the role
     semantics — parse the `/`-delimited path into token groups.

4. **Whole-file walk** (last resort, no design system). `GET /v1/files/:key` and
   frequency-map fills/text styles across frames to infer the palette and type
   the way the website extractor does for computed styles.

**Rate limits (since 2025-11-17):** leaky-bucket, tiered. File/nodes/images
≈ 10–20/min; variables/comments ≈ 25–100/min; lower seats much stricter. On
`429`, honor `Retry-After`; inspect `X-Figma-Rate-Limit-Type` /
`X-Figma-Plan-Tier`. Cache aggressively, batch node ids, exponential backoff.

**Logos/imagery from Figma:** `GET /v1/images/:key?ids=<node-ids>&format=svg|png`
renders selected nodes (logo frames, brand marks) to downloadable URLs for the
`assets/` folder.

**Extractor inputs (`sources.json`):** `{ "figma": { "fileKey": "...",
"token": "<pat or env ref>", "tokensStudioJson": "optional/path.json" } }`.
Never store the PAT in the repo — read from env / project `.env`.

## 8. Research sources

Color / tokens / type:
- Material color utilities (HCT, Celebi, score): https://github.com/material-foundation/material-color-utilities
- node-vibrant: https://github.com/Vibrant-Colors/node-vibrant · chroma.js: https://gka.github.io/chroma.js/ · culori/Color.js: https://colorjs.io/
- OKLAB/OKLCH (Ottosson): https://bottosson.github.io/posts/oklab/
- DeepFont (Adobe, ACM MM 2015): https://arxiv.org/abs/1507.03196
- DTCG format (stable v2025.10): https://www.designtokens.org/tr/drafts/format/ · Style Dictionary DTCG: https://styledictionary.com/info/dtcg/
- Fluid modular scale + clamp(): https://www.aleksandrhovhannisyan.com/blog/fluid-type-scale-with-css-clamp/

Asset parsing:
- OOXML theme (clrScheme/fontScheme): http://officeopenxml.com/prSlide-styles-themes.php · http://www.datypic.com/sc/ooxml/e-a_clrScheme-1.html
- Figma REST variables/styles/nodes: https://developers.figma.com/docs/rest-api/variables-endpoints/ · https://developers.figma.com/docs/rest-api/rate-limits/
- Brandfetch Brand API: https://docs.brandfetch.com/brand-api/overview
- Playwright computed styles / CSS custom props: https://www.projectwallace.com/custom-property-inspector
- pdf-to-img: https://www.npmjs.com/package/pdf-to-img · Claude vision + structured outputs: https://platform.claude.com/docs/en/build-with-claude/structured-outputs
