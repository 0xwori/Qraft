import type { ThemeDefinition } from "@micro-keynote/core";
import type { RawTemplate } from "../parsers/design-md.js";

const SCHEMA_VERSION = 1;
const NATIVE_ALL = { html: "native", pdf: "native", pptx: "native" } as const;

const COLOR_ALIASES: Array<[string, string[]]> = [
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

const TYPOGRAPHY_ALIASES: Array<[string, string[]]> = [
  ["display", ["display", "h1", "hero", "pixel-hero", "headline", "title"]],
  ["body", ["body", "p", "paragraph", "lede", "hero-tagline"]],
  ["mono", ["mono", "code", "label-pill", "label-eyebrow", "caption-mono", "counter", "badge"]],
];

function flatten(input: unknown, prefix = ""): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (input == null || typeof input !== "object") return out;
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flatten(value, path));
    } else {
      out[path] = value;
    }
  }
  return out;
}

function pickAlias(entries: Record<string, unknown>, candidates: string[]): string | undefined {
  const lowered: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(entries)) lowered[k.toLowerCase()] = v;
  for (const candidate of candidates) {
    if (candidate.toLowerCase() in lowered) {
      const v = lowered[candidate.toLowerCase()];
      if (typeof v === "string") return v;
      if (typeof v === "number") return String(v);
    }
  }
  // Scan for nested keys ending in candidate.
  for (const [k, v] of Object.entries(lowered)) {
    for (const candidate of candidates) {
      if (k.endsWith(`.${candidate.toLowerCase()}`) || k === candidate.toLowerCase()) {
        if (typeof v === "string") return v;
      }
    }
  }
  return undefined;
}

function pickFontFamily(typography: Record<string, unknown>, candidates: string[]): string | undefined {
  for (const candidate of candidates) {
    const node = typography[candidate];
    if (node && typeof node === "object" && "fontFamily" in (node as Record<string, unknown>)) {
      const ff = (node as Record<string, unknown>).fontFamily;
      if (typeof ff === "string") return ff;
    }
  }
  // Try lowercase key match.
  const lower: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(typography)) lower[k.toLowerCase()] = v;
  for (const candidate of candidates) {
    const node = lower[candidate.toLowerCase()];
    if (node && typeof node === "object" && "fontFamily" in (node as Record<string, unknown>)) {
      const ff = (node as Record<string, unknown>).fontFamily;
      if (typeof ff === "string") return ff;
    }
  }
  return undefined;
}

export function buildThemeDefinition(raw: RawTemplate, decorCss: string, fontImports: string[]): ThemeDefinition {
  const fm = raw.designFrontmatter;
  const flatColors = flatten(fm.colors);
  const colors: Record<string, string> = {};
  for (const [target, candidates] of COLOR_ALIASES) {
    const value = pickAlias(flatColors, candidates);
    if (value) colors[target] = resolveTokenRefs(value, flatColors);
  }
  // Always carry through every color the template defines under its raw key
  // so theme-specific decor CSS can still reference them via {colors.<name>}.
  for (const [k, v] of Object.entries(flatColors)) {
    if (typeof v !== "string") continue;
    if (!(k in colors)) colors[k.replace(/\./g, "-")] = resolveTokenRefs(v, flatColors);
  }

  const typography: Record<string, string> = {};
  const typographyRaw = (fm.typography ?? {}) as Record<string, unknown>;
  for (const [target, candidates] of TYPOGRAPHY_ALIASES) {
    const ff = pickFontFamily(typographyRaw, candidates);
    if (ff) typography[target] = ff;
  }
  if (!typography.display) typography.display = "Inter, system-ui, sans-serif";
  if (!typography.body) typography.body = typography.display;
  if (!typography.mono) typography.mono = "JetBrains Mono, ui-monospace, monospace";

  const spacing: Record<string, string | number> = {
    slidePadding: 48,
    grid: 8,
    radius: 8,
  };
  const spacingRaw = (fm.spacing ?? {}) as Record<string, unknown>;
  if (typeof spacingRaw["pad-slide-y"] === "string" || typeof spacingRaw.slidePadding === "number") {
    const v = spacingRaw.slidePadding ?? spacingRaw["pad-slide-y"];
    if (typeof v === "number") spacing.slidePadding = v;
  }
  if (typeof spacingRaw.radius === "number") spacing.radius = spacingRaw.radius;

  const id = raw.slug;
  const name = (typeof fm.name === "string" && fm.name) || (typeof raw.meta.name === "string" && raw.meta.name) || raw.slug;
  const description = typeof fm.description === "string" ? fm.description : undefined;

  return {
    schemaVersion: SCHEMA_VERSION,
    id,
    name,
    sourceTemplateId: raw.slug,
    colors,
    typography,
    spacing,
    exportCompatibility: NATIVE_ALL,
    description,
    decorCss: decorCss || undefined,
    fontImports: fontImports.length ? fontImports : undefined,
  };
}

function resolveTokenRefs(value: string, flatColors: Record<string, unknown>): string {
  return value.replace(/\{colors\.([a-zA-Z0-9_.-]+)\}/g, (_match, key) => {
    const direct = flatColors[key];
    if (typeof direct === "string") return direct;
    return _match;
  });
}
