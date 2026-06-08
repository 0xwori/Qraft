/**
 * BrandkitCore — central SDK class.
 * Mirrors the MicroKeynoteCore shape from the Presentations tool.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Brand registry schema
// ---------------------------------------------------------------------------

const REGISTRY_SCHEMA_VERSION = 1;

export const BrandEntry = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Absolute or relative path to the brand output folder */
  root: z.string().min(1),
  projectId: z.string().optional(),
});
export type BrandEntry = z.infer<typeof BrandEntry>;

export const BrandRegistry = z.object({
  schemaVersion: z.literal(REGISTRY_SCHEMA_VERSION),
  brands: z.array(BrandEntry),
});
export type BrandRegistry = z.infer<typeof BrandRegistry>;

// ---------------------------------------------------------------------------
// Sources manifest — records what inputs are registered for a brand
// ---------------------------------------------------------------------------

export const SourceEntry = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("pptx"),
    file: z.string(), // path relative to brand folder inputs/
  }),
  z.object({
    kind: z.literal("website"),
    url: z.string().url(),
  }),
  z.object({
    kind: z.literal("figma"),
    fileKey: z.string(),
    /** Path to a Tokens Studio JSON file if present (relative to brand folder) */
    tokensStudioJson: z.string().optional(),
  }),
  z.object({
    kind: z.literal("image"),
    /** Path to a folder containing images, relative to brand folder */
    folder: z.string(),
  }),
]);
export type SourceEntry = z.infer<typeof SourceEntry>;

export const SourcesManifest = z.object({
  schemaVersion: z.literal(1),
  sources: z.array(SourceEntry),
});
export type SourcesManifest = z.infer<typeof SourcesManifest>;

// ---------------------------------------------------------------------------
// BrandkitCore
// ---------------------------------------------------------------------------

export interface BrandkitCoreOptions {
  centralRoot?: string;
}

export class BrandkitCore {
  readonly centralRoot: string;
  readonly appRoot: string;
  readonly workspaceRoot: string;

  constructor(options: BrandkitCoreOptions = {}) {
    this.centralRoot = path.resolve(options.centralRoot ?? defaultCentralRoot());
    this.appRoot = path.join(this.centralRoot, "app");
    this.workspaceRoot = path.join(this.centralRoot, "workspace");
  }

  async initialize(): Promise<void> {
    await fs.mkdir(path.join(this.workspaceRoot, "global"), { recursive: true });
    await ensureJsonFile(
      path.join(this.workspaceRoot, "brand.registry.json"),
      JSON.stringify({ schemaVersion: REGISTRY_SCHEMA_VERSION, brands: [] }, null, 2),
    );
  }

  /** Resolve the absolute root folder for a given brand slug + project */
  brandRoot(projectId: string, slug: string): string {
    return path.resolve(
      this.centralRoot,
      "..", "..", "..", // app/ -> brandkit/ -> tools/ -> qraft/
      "..",             // qraft/ -> repo root
      "projects",
      projectId,
      "tools",
      "brandkit",
      slug,
    );
  }

  /** Resolve brand root from an arbitrary repo root (used by CLI) */
  brandRootFromRepo(repoRoot: string, projectId: string, slug: string): string {
    return path.join(repoRoot, "projects", projectId, "tools", "brandkit", slug);
  }

  async readRegistry(): Promise<BrandRegistry> {
    const raw = await fs.readFile(
      path.join(this.workspaceRoot, "brand.registry.json"),
      "utf8",
    );
    return BrandRegistry.parse(JSON.parse(raw));
  }

  async registerBrand(entry: BrandEntry): Promise<void> {
    const registry = await this.readRegistry();
    const exists = registry.brands.find((b) => b.id === entry.id);
    if (!exists) registry.brands.push(entry);
    await fs.writeFile(
      path.join(this.workspaceRoot, "brand.registry.json"),
      `${JSON.stringify(registry, null, 2)}\n`,
      "utf8",
    );
  }

  async readSources(brandFolder: string): Promise<SourcesManifest | null> {
    const p = path.join(brandFolder, "inputs", "sources.json");
    if (!(await exists(p))) return null;
    const raw = await fs.readFile(p, "utf8");
    return SourcesManifest.parse(JSON.parse(raw));
  }

  async writeSources(brandFolder: string, manifest: SourcesManifest): Promise<void> {
    await fs.mkdir(path.join(brandFolder, "inputs"), { recursive: true });
    await fs.writeFile(
      path.join(brandFolder, "inputs", "sources.json"),
      `${JSON.stringify(manifest, null, 2)}\n`,
      "utf8",
    );
  }

  /** Scaffold the per-brand folder structure */
  async scaffoldBrandFolder(brandFolder: string, slug: string, name: string, projectId: string): Promise<void> {
    for (const sub of ["inputs", "evidence", "assets"]) {
      await fs.mkdir(path.join(brandFolder, sub), { recursive: true });
    }
    const brandJsonPath = path.join(brandFolder, "brand.json");
    if (!(await exists(brandJsonPath))) {
      await fs.writeFile(
        brandJsonPath,
        `${JSON.stringify({ slug, name, projectId, createdAt: new Date().toISOString() }, null, 2)}\n`,
        "utf8",
      );
    }
    await this.writeSources(brandFolder, { schemaVersion: 1, sources: [] });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultCentralRoot(): string {
  const file = fileURLToPath(import.meta.url);
  const dir = path.dirname(file);
  // Walk up: packages/brandkit-core/dist/  -> packages/brandkit-core/ -> packages/ -> app/
  const packageRoot = ["dist", "src"].includes(path.basename(dir))
    ? path.dirname(dir)
    : dir;
  return path.resolve(packageRoot, "..", "..", "..");
}

async function exists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureJsonFile(p: string, defaultContent: string): Promise<void> {
  if (!(await exists(p))) {
    await fs.writeFile(p, `${defaultContent}\n`, "utf8");
  }
}
