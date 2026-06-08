/**
 * brandkit-fuse — Phase 1 implementation.
 *
 * Merges evidence bundles from multiple extractors into a single
 * FusedTokenBundle. Higher-priority sources win on a per-key basis.
 *
 * Phase 1: priority merge only — no OKLCH clustering, no role scoring,
 * no WCAG contrast nudging. Those arrive in Phase 2.
 *
 * Priority order (highest → lowest): figma > pptx > website > manual
 */

import type {
  EvidenceBundle,
  FusedTokenBundle,
  ColorToken,
  TypographyToken,
  SpacingToken,
  SourceKind,
  CoverageReport,
} from "@qraft/brandkit-core";
import { COLOR_ROLE_CANDIDATES, TYPOGRAPHY_ROLE_CANDIDATES, TYPOGRAPHY_DEFAULTS } from "@qraft/brandkit-core";

const SOURCE_PRIORITY: SourceKind[] = ["figma", "pptx", "website", "manual"];

export function fuseEvidence(bundles: EvidenceBundle[]): FusedTokenBundle {
  // Sort bundles by source priority (highest first)
  const sorted = [...bundles].sort(
    (a, b) => SOURCE_PRIORITY.indexOf(a.source) - SOURCE_PRIORITY.indexOf(b.source),
  );

  const colors: Record<string, ColorToken> = {};
  const typography: Record<string, TypographyToken> = {};
  const spacing: Record<string, SpacingToken> = {};
  const fontImportSet = new Set<string>();

  // Higher-priority sources go first; lower-priority fills gaps
  for (const bundle of sorted) {
    for (const [key, token] of Object.entries(bundle.colors)) {
      if (!(key in colors)) colors[key] = token;
    }
    for (const [key, token] of Object.entries(bundle.typography)) {
      if (!(key in typography)) typography[key] = token;
    }
    for (const [key, token] of Object.entries(bundle.spacing)) {
      if (!(key in spacing)) spacing[key] = token;
    }
    for (const url of bundle.fontImports ?? []) fontImportSet.add(url);
  }

  // Ensure the three canonical typography roles always exist
  for (const [role, candidates] of TYPOGRAPHY_ROLE_CANDIDATES) {
    if (!(role in typography)) {
      const hit = candidates.find((c) => c in typography);
      if (hit) {
        typography[role] = typography[hit];
      } else {
        typography[role] = {
          $type: "typography",
          $value: { fontFamily: TYPOGRAPHY_DEFAULTS[role] },
          $description: `Default fallback for missing ${role} role`,
          $extensions: {
            brandkit: { source: "manual", confidence: 0.1 },
          },
        };
      }
    }
  }

  const presentSources = [
    ...new Set(sorted.map((b) => b.source)),
  ] as SourceKind[];

  return {
    fusedAt: new Date().toISOString(),
    sourcePriority: presentSources.sort(
      (a, b) => SOURCE_PRIORITY.indexOf(a) - SOURCE_PRIORITY.indexOf(b),
    ),
    colors,
    typography,
    spacing,
    fontImports: fontImportSet.size ? [...fontImportSet] : undefined,
  };
}

// ---------------------------------------------------------------------------
// Coverage report
// ---------------------------------------------------------------------------

export function buildCoverageReport(bundle: FusedTokenBundle): CoverageReport {
  const flatColors: Record<string, string> = {};
  for (const [k, t] of Object.entries(bundle.colors)) flatColors[k] = t.$value;

  const colorRoles = COLOR_ROLE_CANDIDATES.map(([role, candidates]) => {
    const matchKey = candidates.find(
      (c) =>
        c.toLowerCase() in flatColors ||
        Object.keys(flatColors).some((k) => k.toLowerCase() === c.toLowerCase()),
    );
    const token = matchKey ? bundle.colors[matchKey] ?? bundle.colors[
      Object.keys(bundle.colors).find((k) => k.toLowerCase() === matchKey.toLowerCase()) ?? ""
    ] : undefined;
    return {
      role,
      found: !!matchKey,
      source: token?.$extensions?.brandkit.source,
      confidence: token?.$extensions?.brandkit.confidence,
      defaultApplied: matchKey ? undefined : `role "${role}" not found in extracted colors`,
    };
  });

  const typographyRoles = TYPOGRAPHY_ROLE_CANDIDATES.map(([role]) => {
    const token = bundle.typography[role];
    return {
      role,
      found: !!token,
      source: token?.$extensions?.brandkit.source,
      confidence: token?.$extensions?.brandkit.confidence,
      defaultApplied: token?.$extensions?.brandkit.confidence === 0.1
        ? `default fallback: ${token?.$value.fontFamily}`
        : undefined,
    };
  });

  const spacingRoles = [{ name: "radius" }, { name: "pad-x" }, { name: "pad-y" }].map(
    ({ name }) => ({
      role: name,
      found: name in bundle.spacing,
      source: bundle.spacing[name]?.$extensions?.brandkit.source,
      confidence: bundle.spacing[name]?.$extensions?.brandkit.confidence,
    }),
  );

  const allConfidences = [
    ...colorRoles.map((r) => r.confidence ?? (r.found ? 0.5 : 0)),
    ...typographyRoles.map((r) => r.confidence ?? (r.found ? 0.5 : 0)),
  ];
  const overallConfidence =
    allConfidences.length > 0
      ? allConfidences.reduce((a, b) => a + b, 0) / allConfidences.length
      : 0;

  return {
    generatedAt: new Date().toISOString(),
    colorRoles,
    typographyRoles,
    spacingRoles,
    overallConfidence: Math.round(overallConfidence * 100) / 100,
  };
}
