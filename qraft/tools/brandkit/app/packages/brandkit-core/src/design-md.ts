/**
 * Emitter: FusedTokenBundle → design.md
 *
 * Produces the exact frontmatter shape the Presentations template-importer
 * consumes (see contract.ts for the role-alias mapping), plus a Markdown
 * token-reference table that the Brandkit skill agent uses as source material
 * when writing the prose body (Overview / Colors / Typography / …).
 *
 * The prose body itself is NOT generated here — the emitter inserts a
 * PROSE-TODO section that the agent replaces.
 */

import yaml from "js-yaml";
import type { FusedTokenBundle } from "./dtcg.js";
import { COLOR_ROLE_CANDIDATES, TYPOGRAPHY_ROLE_CANDIDATES, TYPOGRAPHY_DEFAULTS } from "./contract.js";

export interface EmitOptions {
  slug: string;
  name: string;
  description?: string;
  /** Extra keys to include in colors: block beyond what the fuser emits */
  extraColors?: Record<string, string>;
}

export interface EmittedDesignMd {
  /** Full design.md content (frontmatter + PROSE-TODO body) */
  content: string;
  /** Flat color map (key → hex) for inspection and round-trip tests */
  flatColors: Record<string, string>;
  /** Which canonical roles were filled */
  coveredColorRoles: string[];
  /** Which canonical roles were missing */
  missingColorRoles: string[];
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function emitDesignMd(
  bundle: FusedTokenBundle,
  opts: EmitOptions,
): EmittedDesignMd {
  // 1. Build flat color map: key → hex value
  const flatColors: Record<string, string> = {};
  for (const [key, token] of Object.entries(bundle.colors)) {
    flatColors[key] = token.$value;
  }

  // 2. Resolve which importer roles are covered
  const coveredColorRoles: string[] = [];
  const missingColorRoles: string[] = [];
  for (const [role, candidates] of COLOR_ROLE_CANDIDATES) {
    const hit = candidates.some(
      (c) => c.toLowerCase() in flatColors || Object.keys(flatColors).some((k) => k.toLowerCase() === c.toLowerCase()),
    );
    if (hit) coveredColorRoles.push(role);
    else missingColorRoles.push(role);
  }

  // 3. Build typography block (full CSS properties, not just fontFamily)
  const typographyBlock: Record<string, Record<string, unknown>> = {};
  for (const [key, token] of Object.entries(bundle.typography)) {
    typographyBlock[key] = { ...token.$value };
  }
  // Ensure the three canonical roles (display/body/mono) exist
  for (const [role, candidates] of TYPOGRAPHY_ROLE_CANDIDATES) {
    if (!(role in typographyBlock)) {
      const hit = candidates.find((c) => c in typographyBlock);
      if (hit) {
        typographyBlock[role] = typographyBlock[hit];
      } else {
        typographyBlock[role] = { fontFamily: TYPOGRAPHY_DEFAULTS[role] };
      }
    }
  }

  // 4. Build spacing block
  const spacingBlock: Record<string, unknown> = {};
  for (const [key, token] of Object.entries(bundle.spacing)) {
    spacingBlock[key] = token.$value;
  }
  if (!spacingBlock.radius) spacingBlock.radius = 8;

  // 5. Build the YAML frontmatter object
  const frontmatter: Record<string, unknown> = {
    version: "alpha",
    name: opts.name,
    ...(opts.description ? { description: opts.description } : {}),
    colors: flatColors,
    typography: typographyBlock,
    spacing: spacingBlock,
    canvas: { width: "100vw", height: "100vh" },
  };

  // 6. Render the frontmatter + token table + PROSE-TODO
  const fm = yaml.dump(frontmatter, {
    indent: 2,
    lineWidth: 120,
    quotingType: '"',
    forceQuotes: false,
  }).trimEnd();

  const colorTable = buildColorTable(flatColors, coveredColorRoles);
  const typeTable = buildTypeTable(typographyBlock);
  const provenance = buildProvenanceNote(bundle);

  const content = [
    "---",
    fm,
    "---",
    "",
    "<!-- BRANDKIT-GENERATED: frontmatter is machine-written; prose below is agent-written -->",
    "<!-- PROSE-TODO: Replace this section with grounded brand prose. Use the token tables -->",
    "<!-- below as your only source of truth for hex values, font names, and sizing. -->",
    "<!-- Follow the house style of the existing templates (studio, broadside, soft-editorial). -->",
    "<!-- Apply the Impeccable brand.md anti-slop guidance. Do not invent token values. -->",
    "",
    "## Token Reference",
    "",
    "### Colors",
    "",
    colorTable,
    "",
    "### Typography",
    "",
    typeTable,
    "",
    provenance,
    "",
    "## Overview",
    "",
    "<!-- TODO: Write 2–3 paragraphs. Name the aesthetic register. Describe the visual identity -->",
    "<!-- (color strategy, type personality, density philosophy, key structural patterns). -->",
    "<!-- One sentence on what makes this brand visually distinctive. -->",
    "",
    "## Colors",
    "",
    "<!-- TODO: For each named color, describe its role, usage, and any opacity variants. -->",
    "<!-- Document light/dark surface logic if present. Name the default surface. -->",
    "",
    "## Typography",
    "",
    "<!-- TODO: Describe the font families and their roles. Document the type scale with -->",
    "<!-- a table (token | size | family | weight | use). List signature treatments -->",
    "<!-- (e.g. all-caps headlines, tight tracking, uppercase labels). -->",
    "",
    "## Layout",
    "",
    "<!-- TODO: Canvas system (vw/vh or fixed px?). Padding scale. Grid rhythm. -->",
    "<!-- Chrome patterns (top bar, footer, etc.). Density philosophy. -->",
    "",
    "## Depth and Elevation",
    "",
    "<!-- TODO: Flat or elevated? Drop shadows? Border radius philosophy? Gradients? -->",
    "",
    "## Do's and Don'ts",
    "",
    "<!-- TODO: 5–8 concrete Do's and 5–8 concrete Don'ts grounded in the extracted tokens. -->",
  ].join("\n");

  return { content, flatColors, coveredColorRoles, missingColorRoles };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildColorTable(
  flatColors: Record<string, string>,
  coveredRoles: string[],
): string {
  const rows = Object.entries(flatColors).map(([key, value]) => {
    const isRole = coveredRoles.includes(key) ? "✓" : "";
    return `| \`${key}\` | \`${value}\` | ${isRole} |`;
  });
  return [
    "| Key | Value | Canonical role |",
    "|-----|-------|----------------|",
    ...rows,
  ].join("\n");
}

function buildTypeTable(
  typographyBlock: Record<string, Record<string, unknown>>,
): string {
  const rows = Object.entries(typographyBlock).map(([key, props]) => {
    const family = String(props.fontFamily ?? "—");
    const size = String(props.fontSize ?? "—");
    const weight = String(props.fontWeight ?? "—");
    return `| \`${key}\` | ${family} | ${size} | ${weight} |`;
  });
  return [
    "| Token | fontFamily | fontSize | fontWeight |",
    "|-------|-----------|----------|------------|",
    ...rows,
  ].join("\n");
}

function buildProvenanceNote(bundle: FusedTokenBundle): string {
  const sources = bundle.sourcePriority.join(" > ");
  return `> **Extraction:** ${bundle.fusedAt} · sources: ${sources}`;
}
