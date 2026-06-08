/**
 * Mirror of the Presentations template-importer alias mapping.
 * Keep this in lockstep with:
 *   qraft/tools/presentations/app/packages/template-importer/src/mappers/tokens.ts
 *
 * The emitter must produce color keys and typography keys that survive this
 * alias resolution so the generated theme.json has correctly-populated roles.
 */

/**
 * The canonical color role slots the Presentations importer fills.
 * Each entry: [targetRole, [candidateKeys ordered by preference]].
 * The importer picks the first candidate key that exists in the flat colors map.
 */
export const COLOR_ROLE_CANDIDATES: Array<[string, string[]]> = [
  ["bg", ["bg", "paper", "surface", "background", "canvas", "page"]],
  ["primary", ["primary", "accent", "ink", "accent-1", "accent-primary", "deep-navy", "navy"]],
  ["secondary", ["secondary", "accent-2", "accent-secondary"]],
  ["accent", ["accent", "highlight", "accent-3"]],
  ["text", ["text", "ink", "text-primary", "fg", "foreground"]],
  ["muted", ["muted", "mute", "text-muted", "text-secondary", "subdued"]],
  ["light", ["light", "text-light", "subtle"]],
  ["card", ["card", "card-bg", "surface-card", "panel"]],
  ["border", ["border", "hairline", "rule"]],
  ["positive", ["positive", "success"]],
  ["negative", ["negative", "error", "danger"]],
];

/**
 * The canonical typography role slots the Presentations importer fills.
 * Picks the fontFamily from the first matching token.
 */
export const TYPOGRAPHY_ROLE_CANDIDATES: Array<[string, string[]]> = [
  ["display", ["display", "h1", "hero", "pixel-hero", "headline", "title"]],
  ["body", ["body", "p", "paragraph", "lede", "hero-tagline"]],
  ["mono", ["mono", "code", "label-pill", "label-eyebrow", "caption-mono", "counter", "badge", "label"]],
];

/** Default font stacks the importer falls back to when a role is missing. */
export const TYPOGRAPHY_DEFAULTS: Record<string, string> = {
  display: "Inter, system-ui, sans-serif",
  body: "Inter, system-ui, sans-serif",
  mono: "JetBrains Mono, ui-monospace, monospace",
};

/**
 * Given a flat map of color tokens, resolve which value the importer would
 * assign to each role. Used by tests and by the emitter to verify coverage.
 */
export function resolveColorRoles(
  flatColors: Record<string, string>,
): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  const lowered: Record<string, string> = {};
  for (const [k, v] of Object.entries(flatColors)) lowered[k.toLowerCase()] = v;
  for (const [role, candidates] of COLOR_ROLE_CANDIDATES) {
    for (const candidate of candidates) {
      if (candidate.toLowerCase() in lowered) {
        result[role] = lowered[candidate.toLowerCase()];
        break;
      }
      // Also check nested keys ending in the candidate (dot-flattened)
      for (const [k, v] of Object.entries(lowered)) {
        if (k.endsWith(`.${candidate.toLowerCase()}`)) {
          result[role] = v;
          break;
        }
      }
      if (result[role]) break;
    }
  }
  return result;
}
