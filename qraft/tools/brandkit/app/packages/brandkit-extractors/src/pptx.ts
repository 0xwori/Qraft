/**
 * PPTX extractor — reads the Office Open XML theme from a .pptx file.
 *
 * A .pptx is a ZIP (OPC package). Brand colors live in:
 *   ppt/theme/theme1.xml  →  <a:clrScheme>  (dk1/lt1/dk2/lt2/accent1-6/hlink/folHlink)
 *   ppt/theme/theme1.xml  →  <a:fontScheme> (majorFont / minorFont → <a:latin typeface>)
 *
 * Logos and other media live in:
 *   ppt/media/*  (png/jpg/svg/emf)
 *
 * References:
 *   http://officeopenxml.com/prSlide-styles-themes.php
 *   http://www.datypic.com/sc/ooxml/e-a_clrScheme-1.html
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { XMLParser } from "fast-xml-parser";
import type {
  EvidenceBundle,
  ColorToken,
  TypographyToken,
} from "@qraft/brandkit-core";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function extractPptx(
  pptxPath: string,
  assetsDir: string,
): Promise<EvidenceBundle> {
  const data = await fs.readFile(pptxPath);
  const zip = await JSZip.loadAsync(data);

  const themeXml = await readThemeXml(zip);
  const clrScheme = parseClrScheme(themeXml);
  const fontScheme = parseFontScheme(themeXml);

  await extractMedia(zip, assetsDir);

  const now = new Date().toISOString();

  // Build color tokens from the 12 OOXML scheme slots
  const colors: Record<string, ColorToken> = {};
  for (const [slot, hex] of Object.entries(clrScheme)) {
    const role = ooXmlSlotToRole(slot);
    // Write under the semantic role name so the importer alias hits
    const key = role ?? slot;
    colors[key] = {
      $type: "color",
      $value: `#${hex.toUpperCase()}`,
      $description: `OOXML clrScheme slot: ${slot}`,
      $extensions: {
        brandkit: {
          source: "pptx",
          confidence: 0.95,
          path: `ppt/theme/theme1.xml#${slot}`,
        },
      },
    };
  }

  // Typography
  const typography: Record<string, TypographyToken> = {};
  if (fontScheme.major) {
    typography["display"] = {
      $type: "typography",
      $value: { fontFamily: fontScheme.major },
      $description: "OOXML majorFont (headings)",
      $extensions: {
        brandkit: {
          source: "pptx",
          confidence: 0.95,
          path: "ppt/theme/theme1.xml#majorFont",
        },
      },
    };
  }
  if (fontScheme.minor) {
    typography["body"] = {
      $type: "typography",
      $value: { fontFamily: fontScheme.minor },
      $description: "OOXML minorFont (body)",
      $extensions: {
        brandkit: {
          source: "pptx",
          confidence: 0.95,
          path: "ppt/theme/theme1.xml#minorFont",
        },
      },
    };
  }

  return {
    source: "pptx",
    extractedAt: now,
    colors,
    typography,
    spacing: {},
  };
}

// ---------------------------------------------------------------------------
// Theme XML reading
// ---------------------------------------------------------------------------

async function readThemeXml(zip: JSZip): Promise<unknown> {
  // Try theme1.xml first, then theme2.xml (multiple slide masters)
  const themeEntry =
    zip.file("ppt/theme/theme1.xml") ?? zip.file("ppt/theme/theme2.xml");
  if (!themeEntry) throw new Error("No ppt/theme/themeN.xml found in PPTX");
  const xml = await themeEntry.async("text");
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    isArray: () => false,
  });
  return parser.parse(xml);
}

// ---------------------------------------------------------------------------
// Color scheme parsing
// ---------------------------------------------------------------------------

/** OOXML color scheme slot names in order */
const CLR_SCHEME_SLOTS = [
  "dk1", "lt1", "dk2", "lt2",
  "accent1", "accent2", "accent3", "accent4", "accent5", "accent6",
  "hlink", "folHlink",
] as const;

type ClrSchemeSlot = (typeof CLR_SCHEME_SLOTS)[number];

function parseClrScheme(parsed: unknown): Partial<Record<ClrSchemeSlot, string>> {
  const result: Partial<Record<ClrSchemeSlot, string>> = {};
  // Navigate: <a:theme> → <a:themeElements> → <a:clrScheme>
  const theme = getPath(parsed, ["a:theme", "a:themeElements", "a:clrScheme"])
    ?? getPath(parsed, ["a:theme", "themeElements", "clrScheme"]);
  if (!theme) return result;

  for (const slot of CLR_SCHEME_SLOTS) {
    const node = (theme as Record<string, unknown>)[`a:${slot}`]
      ?? (theme as Record<string, unknown>)[slot];
    if (!node) continue;
    const hex = extractHexFromColorNode(node);
    if (hex) result[slot] = hex;
  }
  return result;
}

function extractHexFromColorNode(node: unknown): string | null {
  if (!node || typeof node !== "object") return null;
  const n = node as Record<string, unknown>;

  // <a:srgbClr val="RRGGBB"/>
  const srgb = n["a:srgbClr"] ?? n["srgbClr"];
  if (srgb) {
    const val = (srgb as Record<string, unknown>)["@_val"];
    if (typeof val === "string" && /^[0-9A-Fa-f]{6}$/.test(val)) return val;
  }

  // <a:sysClr val="..." lastClr="RRGGBB"/>  — read lastClr
  const sys = n["a:sysClr"] ?? n["sysClr"];
  if (sys) {
    const lastClr = (sys as Record<string, unknown>)["@_lastClr"];
    if (typeof lastClr === "string" && /^[0-9A-Fa-f]{6}$/.test(lastClr))
      return lastClr;
  }

  // <a:schemeClr> / <a:prstClr> — can't resolve without theme context; skip
  return null;
}

// ---------------------------------------------------------------------------
// Font scheme parsing
// ---------------------------------------------------------------------------

function parseFontScheme(parsed: unknown): { major?: string; minor?: string } {
  const fontScheme = getPath(parsed, ["a:theme", "a:themeElements", "a:fontScheme"])
    ?? getPath(parsed, ["a:theme", "themeElements", "fontScheme"]);
  if (!fontScheme) return {};
  const fs = fontScheme as Record<string, unknown>;

  const majorNode = fs["a:majorFont"] ?? fs["majorFont"];
  const minorNode = fs["a:minorFont"] ?? fs["minorFont"];

  return {
    major: extractLatinTypeface(majorNode),
    minor: extractLatinTypeface(minorNode),
  };
}

function extractLatinTypeface(node: unknown): string | undefined {
  if (!node || typeof node !== "object") return undefined;
  const n = node as Record<string, unknown>;
  const latin = n["a:latin"] ?? n["latin"];
  if (!latin || typeof latin !== "object") return undefined;
  const typeface = (latin as Record<string, unknown>)["@_typeface"];
  if (typeof typeface === "string" && typeface && typeface !== "+mj-lt" && typeface !== "+mn-lt")
    return typeface;
  // +mj-lt / +mn-lt are theme-font references; fall back to Calibri/Calibri Light
  if (typeface === "+mj-lt") return "Calibri Light";
  if (typeface === "+mn-lt") return "Calibri";
  return undefined;
}

// ---------------------------------------------------------------------------
// Media extraction
// ---------------------------------------------------------------------------

async function extractMedia(zip: JSZip, assetsDir: string): Promise<void> {
  await fs.mkdir(assetsDir, { recursive: true });
  const mediaFiles = zip.filter(
    (rel) =>
      rel.startsWith("ppt/media/") &&
      !rel.endsWith("/") &&
      /\.(png|jpg|jpeg|svg|emf|gif|webp)$/i.test(rel),
  );
  for (const file of mediaFiles) {
    const buf = await file.async("nodebuffer");
    const basename = path.basename(file.name);
    await fs.writeFile(path.join(assetsDir, basename), buf);
  }
}

// ---------------------------------------------------------------------------
// Slot → semantic role mapping
// Aligns with the COLOR_ROLE_CANDIDATES candidates in contract.ts
// ---------------------------------------------------------------------------

function ooXmlSlotToRole(slot: string): string | null {
  const map: Record<string, string> = {
    lt1: "bg",       // Light 1 → background
    dk1: "text",     // Dark 1 → text/ink
    dk2: "primary",  // Dark 2 → primary brand color
    lt2: "card",     // Light 2 → surface/card
    accent1: "accent",
    accent2: "secondary",
    hlink: "hlink",  // hyperlink — carry through as raw
  };
  return map[slot] ?? null;
}

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

function getPath(obj: unknown, keys: string[]): unknown {
  let cur: unknown = obj;
  for (const key of keys) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}
