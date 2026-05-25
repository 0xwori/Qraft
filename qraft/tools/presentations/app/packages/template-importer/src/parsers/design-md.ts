import { promises as fs } from "node:fs";
import path from "node:path";
import yaml from "js-yaml";

export interface RawTemplate {
  slug: string;
  sourceDir: string;
  meta: Record<string, unknown>;
  designFrontmatter: Record<string, unknown>;
  designBody: string;
  templateHtml: string;
}

const FRONTMATTER_RE = /^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/;

export async function readRawTemplate(sourceDir: string): Promise<RawTemplate | null> {
  const slug = path.basename(sourceDir);
  const designPath = path.join(sourceDir, "design.md");
  const metaPath = path.join(sourceDir, "template.json");
  const htmlPath = path.join(sourceDir, "template.html");
  if (!(await exists(designPath))) return null;
  const designRaw = await fs.readFile(designPath, "utf8");
  const match = FRONTMATTER_RE.exec(designRaw);
  let frontmatter: Record<string, unknown> = {};
  let body = designRaw;
  if (match) {
    try {
      frontmatter = (yaml.load(match[1]) ?? {}) as Record<string, unknown>;
    } catch (err) {
      console.warn(`[importer] YAML parse failed for ${slug}: ${(err as Error).message}`);
    }
    body = match[2];
  }
  const meta = (await readJsonOptional(metaPath)) ?? {};
  const templateHtml = (await readTextOptional(htmlPath)) ?? "";
  return { slug, sourceDir, meta, designFrontmatter: frontmatter, designBody: body, templateHtml };
}

async function exists(p: string) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function readJsonOptional(p: string) {
  if (!(await exists(p))) return null;
  try {
    return JSON.parse(await fs.readFile(p, "utf8"));
  } catch {
    return null;
  }
}

async function readTextOptional(p: string) {
  if (!(await exists(p))) return null;
  try {
    return await fs.readFile(p, "utf8");
  } catch {
    return null;
  }
}

export function extractGoogleFontsImports(html: string): string[] {
  const urls = new Set<string>();
  const linkRe = /<link[^>]+href=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html))) {
    const href = m[1];
    if (href.includes("fonts.googleapis.com") || href.includes("fonts.gstatic.com")) {
      urls.add(href);
    }
  }
  // Also pick up @import url(...) lines inside inline <style> blocks.
  const importRe = /@import\s+url\(["']?([^"')]+)["']?\)/gi;
  while ((m = importRe.exec(html))) {
    if (m[1].includes("fonts.googleapis.com")) urls.add(m[1]);
  }
  return Array.from(urls);
}

/**
 * Best-effort extraction of distinctive decorative CSS from a template's
 * `<style>` block. We pull selectors whose names contain motif keywords
 * (scanlines, grain, grid, scatter, dots, vignette, starfield, glow).
 * The result is opt-in decorative chrome that the renderer scopes under
 * `.mk-theme-{id}` — never required for the deck to be readable.
 */
export function extractDecorCss(html: string): string {
  const styleRe = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  const motifs = /^(\s*)(\.[a-z][\w-]*\s*(?:[.#:][\w-]+\s*)*)\s*\{/i;
  const motifKeywords = /(scanline|grain|grid|scatter|noise|vignette|starfield|crt|glow|particle|stripes|dots|texture|halftone)/i;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = styleRe.exec(html))) {
    const css = m[1];
    // Walk top-level rules.
    let i = 0;
    while (i < css.length) {
      const rest = css.slice(i);
      const ruleMatch = motifs.exec(rest);
      if (!ruleMatch) break;
      const startSel = i + ruleMatch.index;
      const braceOpen = css.indexOf("{", startSel);
      if (braceOpen === -1) break;
      let depth = 1;
      let j = braceOpen + 1;
      while (j < css.length && depth > 0) {
        if (css[j] === "{") depth++;
        else if (css[j] === "}") depth--;
        j++;
      }
      const block = css.slice(startSel, j);
      if (motifKeywords.test(ruleMatch[2])) {
        out.push(block.trim());
      }
      i = j;
    }
  }
  return out.join("\n\n");
}
