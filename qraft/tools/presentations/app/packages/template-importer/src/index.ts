#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { MicroKeynoteCore } from "@micro-keynote/core";
import { extractDecorCss, extractGoogleFontsImports, readRawTemplate } from "./parsers/design-md.js";
import { buildThemeDefinition } from "./mappers/tokens.js";

interface CliOptions {
  src: string;
  only?: string[];
  dryRun: boolean;
  copySources: boolean;
}

const DEFAULT_SOURCE = process.env.MICRO_KEYNOTE_TEMPLATE_SOURCE ?? path.resolve(process.cwd(), "templates");

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const core = new MicroKeynoteCore();
  await core.initialize();

  const sourceRoot = path.resolve(options.src);
  if (!(await exists(sourceRoot))) {
    console.warn(`[importer] Template source not found: ${sourceRoot}`);
    process.exit(0);
  }
  const templatesDir = path.join(sourceRoot, "templates");
  if (!(await exists(templatesDir))) {
    console.warn(`[importer] Templates dir not found: ${templatesDir}`);
    process.exit(0);
  }

  const themeRoot = path.join(core.centralRoot, "workspace", "templates", "registry", "themes");
  const sourcesRoot = path.join(core.centralRoot, "workspace", "templates", "sources");
  await fs.mkdir(themeRoot, { recursive: true });

  const overridesDir = path.resolve(new URL("../overrides", import.meta.url).pathname);

  const slugs = (await fs.readdir(templatesDir, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((slug) => !options.only || options.only.includes(slug))
    .sort();

  let written = 0;
  for (const slug of slugs) {
    const dir = path.join(templatesDir, slug);
    const raw = await readRawTemplate(dir);
    if (!raw) {
      console.warn(`[importer] Skipping ${slug}: no design.md`);
      continue;
    }
    const fontImports = extractGoogleFontsImports(raw.templateHtml);
    const decorCss = extractDecorCss(raw.templateHtml);
    let theme = buildThemeDefinition(raw, decorCss, fontImports);
    const override = await readJsonOptional(path.join(overridesDir, `${slug}.json`));
    if (override) {
      theme = mergeOverride(theme, override);
    }
    const targetPath = path.join(themeRoot, `${theme.id}.json`);
    if (options.dryRun) {
      console.log(`[importer] (dry-run) would write ${targetPath}`);
    } else {
      await fs.writeFile(targetPath, `${JSON.stringify(theme, null, 2)}\n`, "utf8");
      written++;
    }
    if (options.copySources) {
      await copySources(dir, path.join(sourcesRoot, slug));
    }
  }

  console.log(`[importer] ${options.dryRun ? "Validated" : "Wrote"} ${written || slugs.length} themes to ${themeRoot}`);
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { src: DEFAULT_SOURCE, dryRun: false, copySources: true };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--src") opts.src = argv[++i];
    else if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--no-copy-sources") opts.copySources = false;
    else if (arg === "--only") opts.only = argv[++i].split(",");
    else if (!arg.startsWith("--") && i === 0) opts.src = arg;
  }
  return opts;
}

async function copySources(srcDir: string, targetDir: string) {
  await fs.mkdir(targetDir, { recursive: true });
  for (const file of ["template.json", "design.md", "template.html", "styles.css", "deck-stage.js"]) {
    const sourceFile = path.join(srcDir, file);
    if (await exists(sourceFile)) {
      await fs.copyFile(sourceFile, path.join(targetDir, file));
    }
  }
}

function mergeOverride(theme: ReturnType<typeof buildThemeDefinition>, override: Record<string, unknown>) {
  return {
    ...theme,
    ...override,
    colors: { ...theme.colors, ...((override.colors as Record<string, string>) ?? {}) },
    typography: { ...theme.typography, ...((override.typography as Record<string, string>) ?? {}) },
    spacing: { ...theme.spacing, ...((override.spacing as Record<string, string | number>) ?? {}) },
  };
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
