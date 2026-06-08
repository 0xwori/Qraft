#!/usr/bin/env node
/**
 * Brandkit MCP server.
 * Mirrors the @micro-keynote/mcp-server pattern exactly:
 *   server.registerTool() with inputSchema: Record<string, z.ZodTypeAny>
 *   handler: (args: Record<string, unknown>) => Promise<unknown>
 *
 * Tools:
 *   brandkit_create_brand   scaffold per-brand folder + brand.json + sources.json
 *   brandkit_add_source     register a PPTX file, website URL, Figma file key, or image folder
 *   brandkit_extract        run extractors → evidence/*.dtcg.json
 *   brandkit_fuse           merge evidence → tokens.dtcg.json + coverage.json
 *   brandkit_emit           write design.md (frontmatter + token tables + PROSE-TODO)
 *   brandkit_handoff        copy into Presentations workspace + run importer
 *   brandkit_read_images    return brand images as visual content for Claude to analyse
 *   brandkit_save_image_evidence  save Claude-extracted token JSON as evidence/image.dtcg.json
 *   brandkit_save_prose     write the agent-written prose body into design.md
 *   brandkit_read_jsx_context     return design.md + Studio reference for JSX generation
 *   brandkit_save_jsx       write Claude-generated slides.tsx + styles.css into Presentations
 *
 * Resources:
 *   brandkit://brand/{projectId}/{slug}/tokens    → tokens.dtcg.json
 *   brandkit://brand/{projectId}/{slug}/coverage  → coverage.json
 */

import path from "node:path";
import os from "node:os";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";

import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

import { BrandkitCore, emitDesignMd } from "@qraft/brandkit-core";
import type { SourcesManifest, EvidenceBundle } from "@qraft/brandkit-core";
import { extractPptx, extractWebsite, extractFigma, findBrandImages, copyImagesToAssets } from "@qraft/brandkit-extractors";
import { fuseEvidence, buildCoverageReport } from "@qraft/brandkit-fuse";

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

const core = new BrandkitCore();
await core.initialize();

const server = new McpServer({
  name: "brandkit",
  version: "0.1.0",
});

// ---------------------------------------------------------------------------
// register() helper — mirrors mcp-server/src/index.ts exactly
// ---------------------------------------------------------------------------

function register(
  name: string,
  description: string,
  inputSchema: Record<string, z.ZodTypeAny>,
  readOnly: boolean,
  handler: (args: Record<string, unknown>) => Promise<unknown>,
) {
  server.registerTool(
    name,
    {
      title: titleFromName(name),
      description,
      inputSchema,
      annotations: {
        readOnlyHint: readOnly,
        destructiveHint: !readOnly,
        idempotentHint: readOnly,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        return jsonResult(await handler(args as Record<string, unknown>));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}

/** Like register() but the handler returns raw MCP content blocks (e.g. image blocks). */
function registerRaw(
  name: string,
  description: string,
  inputSchema: Record<string, z.ZodTypeAny>,
  readOnly: boolean,
  handler: (args: Record<string, unknown>) => Promise<{ content: Array<{ type: string; [k: string]: unknown }> }>,
) {
  server.registerTool(
    name,
    {
      title: titleFromName(name),
      description,
      inputSchema,
      annotations: {
        readOnlyHint: readOnly,
        destructiveHint: !readOnly,
        idempotentHint: readOnly,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        return await handler(args as Record<string, unknown>) as ReturnType<typeof jsonResult>;
      } catch (err) {
        return errorResult(err);
      }
    },
  );
}

// ---------------------------------------------------------------------------
// Tool: brandkit_create_brand
// ---------------------------------------------------------------------------

register(
  "brandkit_create_brand",
  "Scaffold a new brand folder and register it. Call this once per brand before adding sources.",
  {
    projectId: z.string().min(1).describe("Qraft project ID (e.g. 'tapwise')"),
    slug: z.string().min(1).describe("URL-safe brand slug (e.g. 'acme')"),
    name: z.string().min(1).describe("Display name (e.g. 'Acme Corp')"),
    repoRoot: z.string().optional().describe("Absolute path to repo root (autodetected if omitted)"),
  },
  false,
  async (args) => {
    const projectId = String(args.projectId);
    const slug = String(args.slug);
    const name = String(args.name);
    const root = args.repoRoot ? String(args.repoRoot) : autoRepoRoot();
    const brandFolder = path.join(root, "projects", projectId, "tools", "brandkit", slug);
    await core.scaffoldBrandFolder(brandFolder, slug, name, projectId);
    await core.registerBrand({ id: `${projectId}/${slug}`, name, root: brandFolder, projectId });
    return { ok: true, brandFolder, message: `Brand '${name}' scaffolded at ${brandFolder}` };
  },
);

// ---------------------------------------------------------------------------
// Tool: brandkit_add_source
// ---------------------------------------------------------------------------

register(
  "brandkit_add_source",
  "Register a source for a brand: a PPTX file path, website URL, Figma file key, or image file/folder.",
  {
    projectId: z.string().min(1),
    slug: z.string().min(1),
    kind: z.enum(["pptx", "website", "figma", "image"]),
    value: z.string().min(1).describe(
      "File path (pptx), URL (website), fileKey (figma), or image file/folder path (image). " +
      "For image: pass a single image file path or a folder path. Files are copied into inputs/images/.",
    ),
    tokensStudioJson: z.string().optional().describe("Figma only: path to Tokens Studio JSON"),
    repoRoot: z.string().optional(),
  },
  false,
  async (args) => {
    const projectId = String(args.projectId);
    const slug = String(args.slug);
    const kind = args.kind as "pptx" | "website" | "figma" | "image";
    const value = String(args.value);
    const root = args.repoRoot ? String(args.repoRoot) : autoRepoRoot();
    const brandFolder = path.join(root, "projects", projectId, "tools", "brandkit", slug);
    const manifest: SourcesManifest = (await core.readSources(brandFolder)) ?? {
      schemaVersion: 1,
      sources: [],
    };

    if (kind === "image") {
      // Set up inputs/images folder; copy file into it if value is a file path
      const imagesFolder = path.join(brandFolder, "inputs", "images");
      await fs.mkdir(imagesFolder, { recursive: true });

      const stat = await fs.stat(value).catch(() => null);
      if (stat?.isFile()) {
        await fs.copyFile(value, path.join(imagesFolder, path.basename(value)));
      }
      // Only one image source entry per brand (stores the folder path)
      manifest.sources = manifest.sources.filter((s) => s.kind !== "image");
      manifest.sources.push({ kind: "image", folder: "inputs/images" });
    } else {
      manifest.sources = manifest.sources.filter((s) => s.kind !== kind);
      if (kind === "pptx") manifest.sources.push({ kind: "pptx", file: value });
      else if (kind === "website") manifest.sources.push({ kind: "website", url: value });
      else {
        const tsj = args.tokensStudioJson ? String(args.tokensStudioJson) : undefined;
        manifest.sources.push({ kind: "figma", fileKey: value, tokensStudioJson: tsj });
      }
    }

    await core.writeSources(brandFolder, manifest);
    return { ok: true, sources: manifest.sources };
  },
);

// ---------------------------------------------------------------------------
// Tool: brandkit_extract
// ---------------------------------------------------------------------------

register(
  "brandkit_extract",
  "Run extractors on all registered sources and write per-source evidence files to evidence/.",
  {
    projectId: z.string().min(1),
    slug: z.string().min(1),
    figmaPat: z.string().optional().describe("Figma Personal Access Token (or set FIGMA_PAT env)"),
    repoRoot: z.string().optional(),
  },
  false,
  async (args) => {
    const projectId = String(args.projectId);
    const slug = String(args.slug);
    const root = args.repoRoot ? String(args.repoRoot) : autoRepoRoot();
    const brandFolder = path.join(root, "projects", projectId, "tools", "brandkit", slug);
    const assetsDir = path.join(brandFolder, "assets");
    const evidenceDir = path.join(brandFolder, "evidence");
    await fs.mkdir(evidenceDir, { recursive: true });

    const manifest = await core.readSources(brandFolder);
    if (!manifest || manifest.sources.length === 0) {
      throw new Error("No sources registered. Run brandkit_add_source first.");
    }

    const results: Array<{ source: string; file: string; colorCount: number; typographyCount: number }> = [];

    for (const source of manifest.sources) {
      let bundle: EvidenceBundle;
      if (source.kind === "pptx") {
        const pptxPath = path.isAbsolute(source.file)
          ? source.file
          : path.join(brandFolder, "inputs", source.file);
        bundle = await extractPptx(pptxPath, assetsDir);
      } else if (source.kind === "website") {
        bundle = await extractWebsite(source.url, assetsDir);
      } else if (source.kind === "image") {
        // Image extraction requires Claude vision — skip the automated evidence
        // write and return images as visual content blocks instead. Claude must
        // call brandkit_save_image_evidence after analysing the images.
        const imageFolder = path.isAbsolute(source.folder)
          ? source.folder
          : path.join(brandFolder, source.folder);
        await copyImagesToAssets(await findBrandImages(imageFolder), assetsDir);
        results.push({
          source: source.kind,
          file: "(pending — call brandkit_read_images then brandkit_save_image_evidence)",
          colorCount: 0,
          typographyCount: 0,
        });
        continue;
      } else {
        const pat = args.figmaPat ? String(args.figmaPat) : (process.env.FIGMA_PAT ?? "");
        if (!pat) throw new Error("Figma PAT required. Pass figmaPat or set FIGMA_PAT env var.");
        bundle = await extractFigma(source.fileKey, pat, assetsDir, source.tokensStudioJson);
      }
      const outFile = path.join(evidenceDir, `${source.kind}.dtcg.json`);
      await fs.writeFile(outFile, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");
      results.push({
        source: source.kind,
        file: outFile,
        colorCount: Object.keys(bundle.colors).length,
        typographyCount: Object.keys(bundle.typography).length,
      });
    }
    return { ok: true, extracted: results };
  },
);

// ---------------------------------------------------------------------------
// Tool: brandkit_fuse
// ---------------------------------------------------------------------------

register(
  "brandkit_fuse",
  "Merge all evidence bundles into tokens.dtcg.json and generate coverage.json.",
  {
    projectId: z.string().min(1),
    slug: z.string().min(1),
    repoRoot: z.string().optional(),
  },
  false,
  async (args) => {
    const projectId = String(args.projectId);
    const slug = String(args.slug);
    const root = args.repoRoot ? String(args.repoRoot) : autoRepoRoot();
    const brandFolder = path.join(root, "projects", projectId, "tools", "brandkit", slug);
    const evidenceDir = path.join(brandFolder, "evidence");

    const evidenceFiles = (await fs.readdir(evidenceDir).catch(() => [])).filter((f) =>
      f.endsWith(".dtcg.json"),
    );
    if (evidenceFiles.length === 0) {
      throw new Error("No evidence files found. Run brandkit_extract first.");
    }

    const bundles: EvidenceBundle[] = await Promise.all(
      evidenceFiles.map(async (f) => {
        const raw = await fs.readFile(path.join(evidenceDir, f), "utf8");
        return JSON.parse(raw) as EvidenceBundle;
      }),
    );

    const fused = fuseEvidence(bundles);
    const coverage = buildCoverageReport(fused);

    await fs.writeFile(
      path.join(brandFolder, "tokens.dtcg.json"),
      `${JSON.stringify(fused, null, 2)}\n`,
      "utf8",
    );
    await fs.writeFile(
      path.join(brandFolder, "coverage.json"),
      `${JSON.stringify(coverage, null, 2)}\n`,
      "utf8",
    );

    return {
      ok: true,
      colorCount: Object.keys(fused.colors).length,
      typographyCount: Object.keys(fused.typography).length,
      overallConfidence: coverage.overallConfidence,
      missingColorRoles: coverage.colorRoles.filter((r) => !r.found).map((r) => r.role),
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: brandkit_emit
// ---------------------------------------------------------------------------

register(
  "brandkit_emit",
  "Generate design.md (frontmatter + token tables + PROSE-TODO), template.json stub, and template.html stub. After this, the agent reads the tokens resource and writes the prose body.",
  {
    projectId: z.string().min(1),
    slug: z.string().min(1),
    name: z.string().min(1).describe("Brand display name"),
    description: z.string().optional().describe("One-sentence brand description"),
    repoRoot: z.string().optional(),
  },
  false,
  async (args) => {
    const projectId = String(args.projectId);
    const slug = String(args.slug);
    const name = String(args.name);
    const description = args.description ? String(args.description) : undefined;
    const root = args.repoRoot ? String(args.repoRoot) : autoRepoRoot();
    const brandFolder = path.join(root, "projects", projectId, "tools", "brandkit", slug);

    const tokensPath = path.join(brandFolder, "tokens.dtcg.json");
    if (!(await exists(tokensPath))) {
      throw new Error("tokens.dtcg.json not found. Run brandkit_fuse first.");
    }

    const bundle = JSON.parse(await fs.readFile(tokensPath, "utf8"));
    const { content, coveredColorRoles, missingColorRoles } = emitDesignMd(bundle, {
      slug,
      name,
      description,
    });

    await fs.writeFile(path.join(brandFolder, "design.md"), content, "utf8");

    const templateJson = {
      slug,
      name,
      tagline: description ?? `${name} brand template.`,
      mood: [],
      tone: [],
      formality: "medium",
      density: "medium",
      scheme: "light",
    };
    await fs.writeFile(
      path.join(brandFolder, "template.json"),
      `${JSON.stringify(templateJson, null, 2)}\n`,
      "utf8",
    );

    const fontImports: string[] = (bundle.fontImports as string[] | undefined) ?? [];
    const linkTags = fontImports
      .map((url: string) => `  <link href="${url}" rel="stylesheet">`)
      .join("\n");
    const templateHtml = `<!doctype html>
<html>
<head>
${linkTags}
</head>
<body>
  <section class="slide"><h1>${name}</h1></section>
</body>
</html>
`;
    await fs.writeFile(path.join(brandFolder, "template.html"), templateHtml, "utf8");

    return {
      ok: true,
      designMdPath: path.join(brandFolder, "design.md"),
      coveredColorRoles,
      missingColorRoles,
      nextStep:
        "Read brandkit://brand/{projectId}/{slug}/tokens, then write the design.md prose body replacing PROSE-TODO sections.",
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: brandkit_handoff
// ---------------------------------------------------------------------------

register(
  "brandkit_handoff",
  "Copy the brand source files into Presentations template sources and run the importer to generate the theme JSON.",
  {
    projectId: z.string().min(1),
    slug: z.string().min(1),
    repoRoot: z.string().optional(),
  },
  false,
  async (args) => {
    const projectId = String(args.projectId);
    const slug = String(args.slug);
    const root = args.repoRoot ? String(args.repoRoot) : autoRepoRoot();
    const brandFolder = path.join(root, "projects", projectId, "tools", "brandkit", slug);
    const presentationsSourcesDir = path.join(
      root,
      "qraft",
      "tools",
      "presentations",
      "workspace",
      "templates",
      "sources",
      slug,
    );

    // The importer expects: <src>/templates/<slug>/design.md
    // Build that structure in a temp directory, then run with --src <tmpDir>
    const { mkdtemp } = await import("node:fs/promises");
    const tmpDir = await mkdtemp(path.join(os.tmpdir(), "brandkit-handoff-"));
    const tmpSlugDir = path.join(tmpDir, "templates", slug);
    await fs.mkdir(tmpSlugDir, { recursive: true });

    for (const file of ["design.md", "template.json", "template.html"]) {
      const src = path.join(brandFolder, file);
      if (await exists(src)) {
        await fs.copyFile(src, path.join(tmpSlugDir, file));
      }
    }

    // Also keep a copy in the presentations sources dir for reference
    await fs.mkdir(presentationsSourcesDir, { recursive: true });
    for (const file of ["design.md", "template.json", "template.html"]) {
      const src = path.join(brandFolder, file);
      if (await exists(src)) {
        await fs.copyFile(src, path.join(presentationsSourcesDir, file));
      }
    }

    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execFileAsync = promisify(execFile);

    const importerDir = path.join(root, "qraft", "tools", "presentations", "app");
    const result = await execFileAsync(
      "npm",
      ["run", "import:templates", "--", "--src", tmpDir, "--only", slug, "--no-copy-sources"],
      { cwd: importerDir },
    ).catch((err: unknown) => {
      const e = err as Error & { stdout?: string; stderr?: string };
      return { stdout: e.stdout ?? "", stderr: e.stderr ?? e.message };
    });

    // Cleanup temp dir
    await fs.rm(tmpDir, { recursive: true, force: true });

    const themeFile = path.join(
      root,
      "qraft",
      "tools",
      "presentations",
      "workspace",
      "templates",
      "registry",
      "themes",
      `${slug}.json`,
    );
    const themeExists = await exists(themeFile);

    return {
      ok: themeExists,
      copiedTo: presentationsSourcesDir,
      themeFile: themeExists ? themeFile : null,
      importerOutput: result.stdout.trim(),
      importerError: result.stderr?.trim() || undefined,
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: brandkit_read_images
// ---------------------------------------------------------------------------

registerRaw(
  "brandkit_read_images",
  "Return the brand's image files as visual content so Claude can analyse them. After seeing the images, call brandkit_save_image_evidence with the extracted colors and typography.",
  {
    projectId: z.string().min(1),
    slug: z.string().min(1),
    repoRoot: z.string().optional(),
  },
  true,
  async (args) => {
    const projectId = String(args.projectId);
    const slug = String(args.slug);
    const root = args.repoRoot ? String(args.repoRoot) : autoRepoRoot();
    const brandFolder = path.join(root, "projects", projectId, "tools", "brandkit", slug);
    const manifest = await core.readSources(brandFolder);
    const imageSource = manifest?.sources.find((s) => s.kind === "image");
    if (!imageSource || imageSource.kind !== "image") {
      throw new Error("No image source registered. Call brandkit_add_source with kind=image first.");
    }
    const imageFolder = path.isAbsolute(imageSource.folder)
      ? imageSource.folder
      : path.join(brandFolder, imageSource.folder);
    const imagePaths = await findBrandImages(imageFolder);
    if (imagePaths.length === 0) {
      throw new Error(`No images found in ${imageFolder}. Add image files (.png/.jpg/.webp) there first.`);
    }

    const content: Array<{ type: string; [k: string]: unknown }> = [];

    for (const imgPath of imagePaths) {
      const ext = path.extname(imgPath).toLowerCase().replace(".", "");
      const mimeMap: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };
      const mimeType = mimeMap[ext] ?? "image/png";
      const data = await fs.readFile(imgPath);
      content.push({ type: "image", data: data.toString("base64"), mimeType });
      content.push({ type: "text", text: `↑ ${path.basename(imgPath)}` });
    }

    content.push({
      type: "text",
      text: [
        `\nAnalyse the ${imagePaths.length} brand image(s) above.`,
        "Extract: 4–12 named hex colors (semantic slugs: bg, primary, secondary, accent, text, muted, border, etc.) and 1–3 typography entries (roles: display, body, mono).",
        "Then call **brandkit_save_image_evidence** with the extracted JSON.",
        `\nContext: projectId="${projectId}", slug="${slug}"`,
      ].join("\n"),
    });

    return { content };
  },
);

// ---------------------------------------------------------------------------
// Tool: brandkit_save_image_evidence
// ---------------------------------------------------------------------------

register(
  "brandkit_save_image_evidence",
  "Save Claude-extracted brand tokens from image analysis as evidence/image.dtcg.json. Call this after brandkit_read_images and visual analysis.",
  {
    projectId: z.string().min(1),
    slug: z.string().min(1),
    colors: z.record(z.string()).describe(
      "Object mapping semantic slug → hex string, e.g. { \"primary\": \"#0B1F3A\", \"bg\": \"#FFFFFF\" }",
    ),
    typography: z.record(z.object({
      fontFamily: z.string(),
      fontWeight: z.union([z.number(), z.string()]).optional(),
      fontSize: z.string().optional(),
    })).describe(
      "Object mapping role (display|body|mono) → { fontFamily, fontWeight?, fontSize? }",
    ),
    repoRoot: z.string().optional(),
  },
  false,
  async (args) => {
    const projectId = String(args.projectId);
    const slug = String(args.slug);
    const root = args.repoRoot ? String(args.repoRoot) : autoRepoRoot();
    const brandFolder = path.join(root, "projects", projectId, "tools", "brandkit", slug);
    const evidenceDir = path.join(brandFolder, "evidence");
    await fs.mkdir(evidenceDir, { recursive: true });

    const rawColors = args.colors as Record<string, string>;
    const rawTypo = args.typography as Record<string, { fontFamily: string; fontWeight?: number | string; fontSize?: string }>;

    const colors: EvidenceBundle["colors"] = {};
    for (const [key, hex] of Object.entries(rawColors)) {
      if (/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(hex)) {
        colors[key] = {
          $type: "color",
          $value: hex,
          $extensions: { brandkit: { source: "image", confidence: 0.7 } },
        };
      }
    }

    const typography: EvidenceBundle["typography"] = {};
    for (const [role, props] of Object.entries(rawTypo)) {
      if (props.fontFamily) {
        typography[role] = {
          $type: "typography",
          $value: {
            fontFamily: props.fontFamily,
            ...(props.fontWeight !== undefined ? { fontWeight: props.fontWeight } : {}),
            ...(props.fontSize !== undefined ? { fontSize: props.fontSize } : {}),
          },
          $extensions: { brandkit: { source: "image", confidence: 0.65 } },
        };
      }
    }

    const bundle: EvidenceBundle = {
      source: "image",
      extractedAt: new Date().toISOString(),
      colors,
      typography,
      spacing: {},
      assets: [],
    };

    await fs.writeFile(
      path.join(evidenceDir, "image.dtcg.json"),
      `${JSON.stringify(bundle, null, 2)}\n`,
      "utf8",
    );

    return {
      ok: true,
      colorCount: Object.keys(colors).length,
      typographyCount: Object.keys(typography).length,
      nextStep: "Run brandkit_fuse to merge all evidence files.",
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: brandkit_save_prose
// ---------------------------------------------------------------------------

register(
  "brandkit_save_prose",
  "Write the agent-authored prose body into design.md, replacing the PROSE-TODO stubs. The prose must start at ## Overview and cover: Overview, Colors, Typography, Layout, Depth and Elevation, Do's and Don'ts.",
  {
    projectId: z.string().min(1),
    slug: z.string().min(1),
    prose: z.string().min(1).describe(
      "The full prose body starting from ## Overview through ## Do's and Don'ts. Plain markdown, no frontmatter, no token reference tables.",
    ),
    repoRoot: z.string().optional(),
  },
  false,
  async (args) => {
    const projectId = String(args.projectId);
    const slug = String(args.slug);
    const prose = String(args.prose).trim();
    const root = args.repoRoot ? String(args.repoRoot) : autoRepoRoot();
    const brandFolder = path.join(root, "projects", projectId, "tools", "brandkit", slug);
    const designMdPath = path.join(brandFolder, "design.md");

    if (!(await exists(designMdPath))) throw new Error("design.md not found. Run brandkit_emit first.");

    const current = await fs.readFile(designMdPath, "utf8");

    // Keep everything up to (but not including) ## Overview
    const overviewIdx = current.indexOf("\n## Overview");
    const base = overviewIdx !== -1
      ? current.slice(0, overviewIdx + 1)
      : current.replace(/<!-- PROSE-TODO:[\s\S]*?-->\n?/g, "");

    // Strip PROSE-TODO banner
    const cleaned = base.replace(/<!-- PROSE-TODO:[\s\S]*?-->\n?/g, "");

    await fs.writeFile(designMdPath, cleaned.trimEnd() + "\n\n" + prose + "\n", "utf8");

    return { ok: true, designMdPath, nextStep: "Run brandkit_read_jsx_context then generate and save JSX." };
  },
);

// ---------------------------------------------------------------------------
// Tool: brandkit_read_jsx_context
// ---------------------------------------------------------------------------

register(
  "brandkit_read_jsx_context",
  "Return the brand's design.md plus the Studio template reference files (slides.tsx and styles.css) so Claude can generate a matching JSX template. After reading, generate the files and call brandkit_save_jsx.",
  {
    projectId: z.string().min(1),
    slug: z.string().min(1),
    repoRoot: z.string().optional(),
  },
  true,
  async (args) => {
    const projectId = String(args.projectId);
    const slug = String(args.slug);
    const root = args.repoRoot ? String(args.repoRoot) : autoRepoRoot();
    const brandFolder = path.join(root, "projects", projectId, "tools", "brandkit", slug);

    const designMd = await fs.readFile(path.join(brandFolder, "design.md"), "utf8")
      .catch(() => { throw new Error("design.md not found. Run brandkit_emit (and brandkit_save_prose) first."); });

    const studiosDir = path.join(root, "qraft", "tools", "presentations", "app", "packages", "templates", "src", "studio");
    const studioSlides = await fs.readFile(path.join(studiosDir, "slides.tsx"), "utf8");
    const studioStyles = await fs.readFile(path.join(studiosDir, "styles.css"), "utf8");

    const pascalSlug = slug.replace(/(^|[-_])(\w)/g, (_: string, _sep: string, c: string) => c.toUpperCase());
    const prefix = slug.replace(/-/g, "");

    return {
      ok: true,
      slug,
      pascalSlug,
      prefix,
      designMd,
      studioSlidesTsx: studioSlides,
      studioStylesCss: studioStyles,
      instructions: [
        `Generate slides.tsx and styles.css for the "${slug}" brand template.`,
        `Replace all "studio-" class prefixes with "${prefix}-" and all "Studio" namespace names with "${pascalSlug}".`,
        `Scope CSS under ".mk-theme-${slug}".`,
        `Include all 18 slide types from the Studio reference.`,
        `Use the brand's colors and typography from the design.md frontmatter.`,
        `Then call brandkit_save_jsx with { projectId, slug, slidesTsx, stylesCss }.`,
      ].join(" "),
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: brandkit_save_jsx
// ---------------------------------------------------------------------------

register(
  "brandkit_save_jsx",
  "Write the Claude-generated slides.tsx and styles.css into the Presentations templates directory, create index.ts + fixtures.tsx, and append the export to the template index.",
  {
    projectId: z.string().min(1),
    slug: z.string().min(1),
    slidesTsx: z.string().min(1).describe("Full TypeScript source of the slides.tsx file"),
    stylesCss: z.string().min(1).describe("Full CSS source of the styles.css file"),
    repoRoot: z.string().optional(),
  },
  false,
  async (args) => {
    const projectId = String(args.projectId);
    const slug = String(args.slug);
    const slidesTsx = String(args.slidesTsx).replace(/^```tsx?\n?/, "").replace(/\n?```$/, "");
    const stylesCss = String(args.stylesCss).replace(/^```css\n?/, "").replace(/\n?```$/, "");
    const root = args.repoRoot ? String(args.repoRoot) : autoRepoRoot();

    const outDir = path.join(root, "qraft", "tools", "presentations", "app", "packages", "templates", "src", slug);
    await fs.mkdir(outDir, { recursive: true });

    const pascalSlug = slug.replace(/(^|[-_])(\w)/g, (_: string, _sep: string, c: string) => c.toUpperCase());

    // Derive component names from exported functions/consts in slides.tsx
    const componentNames = [...slidesTsx.matchAll(/^export (?:function|const) ([A-Z][A-Za-z]+)/gm)]
      .map((m) => m[1]);

    const interfaceNames = [...slidesTsx.matchAll(/^export interface ([A-Z][A-Za-z]+)/gm)]
      .map((m) => m[1]);

    const indexTs = [
      `export {`,
      ...componentNames.map((n) => `  ${n},`),
      `} from "./slides";`,
      ``,
      ...(interfaceNames.length > 0
        ? [`export type {`, ...interfaceNames.map((n) => `  ${n},`), `} from "./slides";`, ``]
        : []),
      `import {`,
      ...componentNames.map((n) => `  ${n},`),
      `} from "./slides";`,
      ``,
      `export const ${pascalSlug} = {`,
      ...componentNames.map((n) => `  ${n},`),
      `};`,
    ].join("\n");

    const fixturesTsx = [
      `import * as React from "react";`,
      `import { ${componentNames.join(", ")} } from "./slides";`,
      ``,
      `export const FIXTURES: Record<string, React.ReactElement> = {`,
      ...componentNames.map((n) => `  ${n}: <${n} />,`),
      `};`,
    ].join("\n");

    await Promise.all([
      fs.writeFile(path.join(outDir, "slides.tsx"), slidesTsx + "\n", "utf8"),
      fs.writeFile(path.join(outDir, "styles.css"), stylesCss + "\n", "utf8"),
      fs.writeFile(path.join(outDir, "index.ts"), indexTs + "\n", "utf8"),
      fs.writeFile(path.join(outDir, "fixtures.tsx"), fixturesTsx + "\n", "utf8"),
    ]);

    // Append export to templates/src/index.ts
    const templatesIndex = path.join(root, "qraft", "tools", "presentations", "app", "packages", "templates", "src", "index.ts");
    const existingIndex = await fs.readFile(templatesIndex, "utf8");
    const exportLine = `export { ${pascalSlug} } from "./${slug}";`;
    if (!existingIndex.includes(exportLine)) {
      await fs.writeFile(templatesIndex, existingIndex.trimEnd() + "\n" + exportLine + "\n", "utf8");
    }

    // Write a dynamic catalog entry so the Presentations UI picks up this theme
    // without requiring a code change to the hardcoded THEME_CATALOG.
    const catalogDir = path.join(
      root, "qraft", "tools", "presentations",
      "workspace", "templates", "registry", "catalog",
    );
    await fs.mkdir(catalogDir, { recursive: true });
    const catalogEntry = buildCatalogEntry(slug, pascalSlug, componentNames);
    await fs.writeFile(
      path.join(catalogDir, `${slug}.json`),
      `${JSON.stringify(catalogEntry, null, 2)}\n`,
      "utf8",
    );

    return {
      ok: true,
      files: [
        path.join(outDir, "slides.tsx"),
        path.join(outDir, "styles.css"),
        path.join(outDir, "index.ts"),
        path.join(outDir, "fixtures.tsx"),
      ],
      catalogEntry: path.join(catalogDir, `${slug}.json`),
      componentCount: componentNames.length,
      nextStep: "Run brandkit_handoff then restart Presentations — the theme will appear at /templates.",
    };
  },
);

// ---------------------------------------------------------------------------
// Catalog entry builder — used by brandkit_save_jsx
// ---------------------------------------------------------------------------

interface CatalogVariantMeta {
  variant: string;
  purpose: string;
  density: "low" | "medium" | "high";
  requiredProps: string[];
  optionalProps: string[];
  jsxTemplate: string;
}

interface CatalogEntry {
  namespace: string;
  themeId: string;
  variants: string[];
  variantMeta: CatalogVariantMeta[];
}

const VARIANT_METADATA: Record<string, { purpose: string; density: "low" | "medium" | "high"; optionalProps: string[]; jsxSlots: string }> = {
  Cover:          { purpose: "Opening slide with hero image and title", density: "low",    optionalProps: ["title", "image", "metaLeft", "metaCenter", "metaRight"], jsxSlots: `title="[Presentation Title]"` },
  ChapterLight:   { purpose: "Section divider on light surface", density: "low",           optionalProps: ["chapter", "title"], jsxSlots: `chapter="01 /" title="[Section Title]"` },
  ChapterDark:    { purpose: "Section divider on dark surface", density: "low",            optionalProps: ["chapter", "title"], jsxSlots: `chapter="02 /" title="[Section Title]"` },
  StatementLight: { purpose: "Single bold statement on light surface", density: "low",     optionalProps: ["title"], jsxSlots: `title="[Bold Statement]"` },
  StatementDark:  { purpose: "Single bold statement on dark surface", density: "low",      optionalProps: ["title"], jsxSlots: `title="[Bold Statement]"` },
  Split:          { purpose: "Text and image split layout", density: "medium",             optionalProps: ["title", "body", "bullets", "image"], jsxSlots: `title="[Title]" body="[Body text]" image="https://placehold.co/600x400"` },
  ImageFull:      { purpose: "Full-frame image with caption", density: "medium",           optionalProps: ["title", "body", "image"], jsxSlots: `title="[Caption]" image="https://placehold.co/600x400"` },
  ImageLeft:      { purpose: "Image left, text right", density: "medium",                 optionalProps: ["title", "body", "image"], jsxSlots: `title="[Title]" body="[Body text]" image="https://placehold.co/600x400"` },
  ImageRight:     { purpose: "Text left, image right", density: "medium",                 optionalProps: ["title", "body", "image"], jsxSlots: `title="[Title]" body="[Body text]" image="https://placehold.co/600x400"` },
  DiagramFull:    { purpose: "Full-canvas diagram or process flow", density: "high",       optionalProps: ["title", "body", "items"], jsxSlots: `title="[Diagram Title]"` },
  DiagramLeft:    { purpose: "Diagram left, readout right", density: "medium",             optionalProps: ["title", "body", "items"], jsxSlots: `title="[Diagram Title]" body="[Readout]"` },
  DiagramRight:   { purpose: "Readout left, diagram right", density: "medium",             optionalProps: ["title", "body", "items"], jsxSlots: `title="[Diagram Title]" body="[Readout]"` },
  Stats:          { purpose: "Grid of key metrics and numbers", density: "high",           optionalProps: ["title", "stats"], jsxSlots: `title="[Stats Title]" stats={[{ value: "42%", label: "Key metric", note: "Source" }]}` },
  List:           { purpose: "Bulleted or numbered list", density: "high",                 optionalProps: ["title", "body", "items"], jsxSlots: `title="[List Title]" items={["Item one", "Item two", "Item three"]}` },
  Quote:          { purpose: "Pull quote with attribution", density: "low",               optionalProps: ["quote", "attribution", "role"], jsxSlots: `quote="[Quote text]" attribution="[Name]"` },
  Compare:        { purpose: "Two-column before/after or A vs B", density: "high",         optionalProps: ["left", "right"], jsxSlots: `left={{ label: "Before", title: "[Left]", body: "[Copy]", bullets: [] }} right={{ label: "After", title: "[Right]", body: "[Copy]", bullets: [] }}` },
  Chart:          { purpose: "Bar chart with title and source", density: "medium",         optionalProps: ["title", "bars", "caption"], jsxSlots: `title="[Chart Title]"` },
  End:            { purpose: "Closing slide with contact or CTA", density: "low",          optionalProps: ["title", "contacts"], jsxSlots: `title="[Closing line]"` },
};

function buildCatalogEntry(slug: string, pascalSlug: string, componentNames: string[]): CatalogEntry {
  const variantMeta: CatalogVariantMeta[] = componentNames.map((name) => {
    const meta = VARIANT_METADATA[name];
    if (meta) {
      return {
        variant: name,
        purpose: meta.purpose,
        density: meta.density,
        requiredProps: [],
        optionalProps: meta.optionalProps,
        jsxTemplate: `<${pascalSlug}.${name}\n  ${meta.jsxSlots}\n/>`,
      };
    }
    return {
      variant: name,
      purpose: `${name} slide`,
      density: "medium" as const,
      requiredProps: [],
      optionalProps: ["title", "body"],
      jsxTemplate: `<${pascalSlug}.${name} title="[Title]" />`,
    };
  });

  return {
    namespace: pascalSlug,
    themeId: slug,
    variants: componentNames,
    variantMeta,
  };
}

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

server.registerResource(
  "brandkit-tokens",
  new ResourceTemplate("brandkit://brand/{projectId}/{slug}/tokens", { list: undefined }),
  { title: "Brand Token Bundle", mimeType: "application/json" },
  async (uri, variables) => {
    const root = autoRepoRoot();
    const p = path.join(
      root,
      "projects",
      String(variables.projectId),
      "tools",
      "brandkit",
      String(variables.slug),
      "tokens.dtcg.json",
    );
    const text = await fs.readFile(p, "utf8").catch(() => "{}");
    return { contents: [{ uri: uri.href, mimeType: "application/json", text }] };
  },
);

server.registerResource(
  "brandkit-coverage",
  new ResourceTemplate("brandkit://brand/{projectId}/{slug}/coverage", { list: undefined }),
  { title: "Brand Coverage Report", mimeType: "application/json" },
  async (uri, variables) => {
    const root = autoRepoRoot();
    const p = path.join(
      root,
      "projects",
      String(variables.projectId),
      "tools",
      "brandkit",
      String(variables.slug),
      "coverage.json",
    );
    const text = await fs.readFile(p, "utf8").catch(() => "{}");
    return { contents: [{ uri: uri.href, mimeType: "application/json", text }] };
  },
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const transport = new StdioServerTransport();
await server.connect(transport);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function autoRepoRoot(): string {
  const file = fileURLToPath(import.meta.url);
  // dist/ → brandkit-mcp/ → packages/ → app/ → brandkit/ → tools/ → qraft/ → <repo>
  return path.resolve(path.dirname(file), "..", "..", "..", "..", "..", "..", "..");
}

function titleFromName(name: string): string {
  return name
    .replace(/^brandkit_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function jsonResult(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
  };
}

function errorResult(err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  return {
    isError: true,
    content: [{ type: "text" as const, text: `Error: ${msg}` }],
  };
}

async function exists(p: string): Promise<boolean> {
  try { await fs.access(p); return true; } catch { return false; }
}
