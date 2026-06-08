/**
 * Website extractor — CSS-only implementation.
 *
 * Does NOT use Playwright or call any external AI API. Fetches the HTML,
 * collects inline <style> blocks and linked stylesheets, and extracts:
 * - Hex color values
 * - font-family declarations
 * - Google Fonts @import / <link> hrefs
 *
 * The MCP server can optionally take a screenshot and return it as a visual
 * content block so the host Claude / Codex app can do additional brand
 * perception on top of the CSS data.
 */

import type { EvidenceBundle, ColorToken, TypographyToken } from "@qraft/brandkit-core";

export async function extractWebsite(
  url: string,
  _assetsDir: string,
): Promise<EvidenceBundle> {
  const colors: Record<string, ColorToken> = {};
  const typography: Record<string, TypographyToken> = {};
  const fontImports: string[] = [];

  try {
    const { default: fetch } = await import("node-fetch");

    const html = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Qraft-Brandkit/0.1" },
    })
      .then((r) => r.text())
      .catch(() => "");

    const cssBlocks = extractInlineCss(html);

    // Fetch up to 5 external stylesheets
    const sheetHrefs = [...html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)]
      .map((m) => resolveUrl(m[1], url))
      .slice(0, 5);

    for (const href of sheetHrefs) {
      const sheet = await fetch(href, { headers: { "User-Agent": "Qraft-Brandkit/0.1" } })
        .then((r) => r.text())
        .catch(() => "");
      cssBlocks.push(sheet);
      for (const m of sheet.matchAll(/@import\s+url\(["']?(https:\/\/fonts\.googleapis\.com[^"')]+)["']?\)/gi)) {
        fontImports.push(m[1]);
      }
    }

    // Collect Google Fonts <link> tags from HTML
    for (const m of html.matchAll(/<link[^>]+href=["'](https:\/\/fonts\.googleapis\.com[^"']+)["']/gi)) {
      fontImports.push(m[1]);
    }

    const combined = cssBlocks.join("\n");

    // Extract hex colors
    const hexSeen = new Set<string>();
    for (const [, hex] of combined.matchAll(/#([0-9A-Fa-f]{6})\b/g)) {
      hexSeen.add(`#${hex.toUpperCase()}`);
    }

    const colorSlots = ["bg", "primary", "secondary", "accent", "text", "muted", "border"];
    [...hexSeen].slice(0, 12).forEach((hex, i) => {
      const key = colorSlots[i] ?? `color-${i + 1}`;
      colors[key] = {
        $type: "color",
        $value: hex,
        $extensions: { brandkit: { source: "website", confidence: 0.6 } },
      };
    });

    // Extract font-family values
    const fontsSeen = new Map<string, string>();
    for (const [, value] of combined.matchAll(/font-family\s*:\s*([^;}{]+)/gi)) {
      const families = value.split(",").map((f) => f.trim().replace(/['"]/g, "")).filter(Boolean);
      if (families[0]) {
        const slug = families[0].toLowerCase().replace(/\s+/g, "-");
        if (!fontsSeen.has(slug)) fontsSeen.set(slug, families.join(", "));
      }
    }

    const typoSlots = ["display", "body", "mono"];
    [...fontsSeen.values()].slice(0, 3).forEach((family, i) => {
      const role = typoSlots[i];
      if (role) {
        typography[role] = {
          $type: "typography",
          $value: { fontFamily: family },
          $extensions: { brandkit: { source: "website", confidence: 0.6 } },
        };
      }
    });
  } catch {
    // Best-effort
  }

  return {
    source: "website",
    extractedAt: new Date().toISOString(),
    colors,
    typography,
    spacing: {},
    fontImports: [...new Set(fontImports)],
    assets: [],
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractInlineCss(html: string): string[] {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
}

function resolveUrl(href: string, base: string): string {
  try { return new URL(href, base).href; } catch { return href; }
}
