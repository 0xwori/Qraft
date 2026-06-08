/**
 * W3C Design Tokens Community Group (DTCG) v2025.10 types + Zod schemas.
 * Internal canonical model. Every extractor normalises into this shape.
 * All tokens carry a brandkit extension block recording source + confidence.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Provenance extension (attached to every token's $extensions)
// ---------------------------------------------------------------------------

export const SourceKind = z.enum(["pptx", "website", "figma", "manual", "image"]);
export type SourceKind = z.infer<typeof SourceKind>;

export const TokenProvenance = z.object({
  source: SourceKind,
  /** 0–1: 1 = explicit declared value, 0 = guessed/defaulted */
  confidence: z.number().min(0).max(1),
  /** Human-readable path inside the source (e.g. "ppt/theme/theme1.xml#accent1") */
  path: z.string().optional(),
});
export type TokenProvenance = z.infer<typeof TokenProvenance>;

// ---------------------------------------------------------------------------
// Color token
// ---------------------------------------------------------------------------

/** Hex string #RRGGBB or #RRGGBBAA */
export const HexColor = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/, "Must be #RRGGBB or #RRGGBBAA");
export type HexColor = z.infer<typeof HexColor>;

/** DTCG-style color value — we store canonical hex for simplicity */
export const DtcgColorValue = z.union([
  HexColor,
  z.string().regex(/^rgba?\(/, "CSS rgba/rgb literal"),
]);
export type DtcgColorValue = z.infer<typeof DtcgColorValue>;

export const ColorToken = z.object({
  $type: z.literal("color"),
  $value: DtcgColorValue,
  $description: z.string().optional(),
  $extensions: z
    .object({
      brandkit: TokenProvenance,
    })
    .optional(),
});
export type ColorToken = z.infer<typeof ColorToken>;

// ---------------------------------------------------------------------------
// Typography token
// ---------------------------------------------------------------------------

export const TypographyValue = z.object({
  fontFamily: z.string(),
  fontSize: z.string().optional(), // e.g. "1.2vw" or "clamp(16px, 1.2vw, 24px)"
  fontWeight: z.union([z.number(), z.string()]).optional(),
  lineHeight: z.union([z.number(), z.string()]).optional(),
  letterSpacing: z.string().optional(),
  textTransform: z.string().optional(),
});
export type TypographyValue = z.infer<typeof TypographyValue>;

export const TypographyToken = z.object({
  $type: z.literal("typography"),
  $value: TypographyValue,
  $description: z.string().optional(),
  $extensions: z
    .object({
      brandkit: TokenProvenance,
    })
    .optional(),
});
export type TypographyToken = z.infer<typeof TypographyToken>;

// ---------------------------------------------------------------------------
// Spacing / dimension token
// ---------------------------------------------------------------------------

export const SpacingToken = z.object({
  $type: z.literal("dimension"),
  $value: z.union([z.number(), z.string()]),
  $description: z.string().optional(),
  $extensions: z
    .object({
      brandkit: TokenProvenance,
    })
    .optional(),
});
export type SpacingToken = z.infer<typeof SpacingToken>;

// ---------------------------------------------------------------------------
// Evidence bundle — one per extractor run
// ---------------------------------------------------------------------------

export const EvidenceBundle = z.object({
  /** Which source produced this bundle */
  source: SourceKind,
  /** ISO timestamp of extraction */
  extractedAt: z.string(),
  colors: z.record(z.string(), ColorToken),
  typography: z.record(z.string(), TypographyToken),
  spacing: z.record(z.string(), SpacingToken),
  /** Raw font import URLs (Google Fonts <link> hrefs) */
  fontImports: z.array(z.string()).optional(),
  /** Paths to extracted asset files (relative to brand folder assets/) */
  assets: z.array(z.string()).optional(),
});
export type EvidenceBundle = z.infer<typeof EvidenceBundle>;

// ---------------------------------------------------------------------------
// Fused token bundle — output of brandkit-fuse
// ---------------------------------------------------------------------------

export const FusedTokenBundle = z.object({
  fusedAt: z.string(),
  /** Ordered list of source kinds, highest priority first */
  sourcePriority: z.array(SourceKind),
  colors: z.record(z.string(), ColorToken),
  typography: z.record(z.string(), TypographyToken),
  spacing: z.record(z.string(), SpacingToken),
  fontImports: z.array(z.string()).optional(),
});
export type FusedTokenBundle = z.infer<typeof FusedTokenBundle>;

// ---------------------------------------------------------------------------
// Coverage report
// ---------------------------------------------------------------------------

export const CoverageItem = z.object({
  role: z.string(),
  found: z.boolean(),
  source: SourceKind.optional(),
  confidence: z.number().optional(),
  defaultApplied: z.string().optional(),
  note: z.string().optional(),
});

export const CoverageReport = z.object({
  generatedAt: z.string(),
  colorRoles: z.array(CoverageItem),
  typographyRoles: z.array(CoverageItem),
  spacingRoles: z.array(CoverageItem),
  overallConfidence: z.number(),
});
export type CoverageReport = z.infer<typeof CoverageReport>;
