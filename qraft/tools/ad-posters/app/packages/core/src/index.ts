import { EventEmitter } from "node:events";
import { randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

export const SCHEMA_VERSION = 1;
export const DEFAULT_DURATION_MS = 6000;
export const DEFAULT_FPS = 30;

export type ExportFormat = "png" | "mp4";

export interface AdSize {
  id: string;
  label: string;
  width: number;
  height: number;
  placement: string;
}

export interface CampaignMeta {
  schemaVersion: number;
  id: string;
  clientId: string;
  title: string;
  durationMs: number;
  fps: number;
  revision: string;
  createdAt: string;
  updatedAt: string;
  variants: AdSize[];
}

export interface CampaignIndex {
  schemaVersion: number;
  clientId: string;
  generatedAt: string;
  campaigns: CampaignSummary[];
}

export interface CampaignSummary {
  id: string;
  title: string;
  durationMs: number;
  fps: number;
  variantCount: number;
  updatedAt: string;
  path: string;
}

export interface ClientRegistry {
  schemaVersion: number;
  clients: Array<{
    id: string;
    name: string;
    root: string;
  }>;
}

export interface CreateCampaignInput {
  clientId: string;
  title: string;
  durationMs?: number;
  fps?: number;
  variants?: AdSize[];
}

export interface UpdateCampaignSourceInput {
  clientId: string;
  campaignId: string;
  source: string;
}

export interface OpenCampaignResult {
  schemaVersion: number;
  clientId: string;
  campaignId: string;
  campaignRoot: string;
  meta: CampaignMeta;
  source: string;
  previewUrl: string;
}

export interface AdPostersCoreOptions {
  centralRoot?: string;
  defaultPort?: number;
}

export const PERFORMANCE_SIZE_PACK: AdSize[] = [
  { id: "story-9x16", label: "Story / Reel", width: 1080, height: 1920, placement: "Meta story and reel" },
  { id: "feed-4x5", label: "Feed Portrait", width: 1080, height: 1350, placement: "Instagram and Facebook feed" },
  { id: "square-1x1", label: "Square", width: 1080, height: 1080, placement: "Social feed square" },
  { id: "landscape-1200x628", label: "Landscape Link", width: 1200, height: 628, placement: "Link and landscape ads" },
  { id: "medium-rectangle-300x250", label: "Medium Rectangle", width: 300, height: 250, placement: "Display ad" },
  { id: "half-page-300x600", label: "Half Page", width: 300, height: 600, placement: "Display ad" },
  { id: "leaderboard-728x90", label: "Leaderboard", width: 728, height: 90, placement: "Display ad" },
  { id: "billboard-970x250", label: "Billboard", width: 970, height: 250, placement: "Display ad" },
  { id: "skyscraper-160x600", label: "Wide Skyscraper", width: 160, height: 600, placement: "Display ad" },
  { id: "mobile-320x50", label: "Mobile Banner", width: 320, height: 50, placement: "Mobile display ad" },
];

const ID_RE = /^[a-z0-9][a-z0-9_-]{0,80}$/;
const DATE_STAMP = () => new Date().toISOString();

const AdSizeSchema = z.object({
  id: z.string().regex(ID_RE),
  label: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  placement: z.string(),
});

const CampaignMetaSchema: z.ZodType<CampaignMeta> = z.object({
  schemaVersion: z.number(),
  id: z.string().regex(ID_RE),
  clientId: z.string().regex(ID_RE),
  title: z.string(),
  durationMs: z.number().int().positive(),
  fps: z.number().int().positive(),
  revision: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  variants: z.array(AdSizeSchema).min(1),
});

const ClientRegistrySchema: z.ZodType<ClientRegistry> = z.object({
  schemaVersion: z.number(),
  clients: z.array(z.object({
    id: z.string().regex(ID_RE),
    name: z.string(),
    root: z.string(),
  })),
});

export class AdPostersError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
  }
}

export class AdPostersCore {
  readonly centralRoot: string;
  readonly appRoot: string;
  readonly workspaceRoot: string;
  readonly events = new EventEmitter();
  readonly defaultPort: number;

  constructor(options: AdPostersCoreOptions = {}) {
    this.centralRoot = path.resolve(options.centralRoot ?? defaultCentralRoot());
    this.appRoot = path.join(this.centralRoot, "app");
    this.workspaceRoot = path.join(this.centralRoot, "workspace");
    this.defaultPort = options.defaultPort ?? Number(process.env.AD_POSTERS_PORT ?? 3466);
  }

  async initialize(): Promise<void> {
    await ensureDir(this.workspaceRoot);
    await ensureDir(path.join(this.workspaceRoot, "global"));
    await writeIfMissing(path.join(this.workspaceRoot, "global", "PRODUCT.md"), DEFAULT_GLOBAL_PRODUCT);
    await writeIfMissing(path.join(this.workspaceRoot, "global", "DESIGN.md"), DEFAULT_GLOBAL_DESIGN);
    await this.ensureClientRegistry();
    const registry = await this.readClientRegistry();
    for (const client of registry.clients) {
      await this.ensureClientContext(client.id);
    }
  }

  async readClientRegistry(): Promise<ClientRegistry> {
    await this.ensureClientRegistry();
    const parsed = ClientRegistrySchema.safeParse(await readJson(path.join(this.workspaceRoot, "client.registry.json")));
    if (!parsed.success) throw new AdPostersError("client.registry.json is invalid.", parsed.error.flatten());
    return parsed.data;
  }

  async listClients() {
    const registry = await this.readClientRegistry();
    return Promise.all(registry.clients.map(async (client) => ({
      ...client,
      resolvedRoot: await this.resolveClientRoot(client.id),
    })));
  }

  async ensureClientContext(clientId: string): Promise<string> {
    assertSafeId(clientId, "clientId");
    const clientRoot = await this.resolveClientRoot(clientId);
    await ensureDir(clientRoot);
    await ensureDir(path.join(clientRoot, "campaigns"));
    await ensureDir(path.join(clientRoot, "assets"));
    await ensureDir(path.join(clientRoot, "exports"));
    await writeIfMissing(path.join(clientRoot, "AGENTS.md"), DEFAULT_CLIENT_AGENTS);
    await writeIfMissing(path.join(clientRoot, "PRODUCT.md"), DEFAULT_CLIENT_PRODUCT);
    await writeIfMissing(path.join(clientRoot, "DESIGN.md"), DEFAULT_CLIENT_DESIGN);
    if (!(await exists(path.join(clientRoot, "campaign.index.json")))) {
      await this.rebuildCampaignIndex(clientId);
    }
    return clientRoot;
  }

  async readContext(clientId: string, campaignId?: string) {
    await this.ensureClientContext(clientId);
    const clientRoot = await this.resolveClientRoot(clientId);
    const globalProduct = await readText(path.join(this.workspaceRoot, "global", "PRODUCT.md"));
    const globalDesign = await readText(path.join(this.workspaceRoot, "global", "DESIGN.md"));
    const clientProduct = await readText(path.join(clientRoot, "PRODUCT.md"));
    const clientDesign = await readText(path.join(clientRoot, "DESIGN.md"));
    const memory = campaignId ? await readText(path.join(await this.campaignRoot(clientId, campaignId), "memory.md")).catch(() => "") : "";
    return {
      schemaVersion: SCHEMA_VERSION,
      clientId,
      campaignId,
      product: { global: globalProduct, client: clientProduct },
      design: { global: globalDesign, client: clientDesign },
      memory,
      effective: {
        product: `${globalProduct.trim()}\n\n${clientProduct.trim()}`.trim(),
        design: `${globalDesign.trim()}\n\n${clientDesign.trim()}`.trim(),
        memory,
      },
    };
  }

  async listCampaigns(clientId: string): Promise<CampaignIndex> {
    await this.ensureClientContext(clientId);
    const clientRoot = await this.resolveClientRoot(clientId);
    const indexPath = path.join(clientRoot, "campaign.index.json");
    const parsed = CampaignIndexSchema.safeParse(await readJson(indexPath).catch(() => null));
    if (!parsed.success) return this.rebuildCampaignIndex(clientId);
    return parsed.data;
  }

  async rebuildCampaignIndex(clientId: string): Promise<CampaignIndex> {
    assertSafeId(clientId, "clientId");
    const clientRoot = await this.resolveClientRoot(clientId);
    const campaignsDir = path.join(clientRoot, "campaigns");
    await ensureDir(campaignsDir);
    const entries = await fs.readdir(campaignsDir, { withFileTypes: true }).catch(() => []);
    const campaigns: CampaignSummary[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory() || !ID_RE.test(entry.name)) continue;
      const campaignDir = path.join(campaignsDir, entry.name);
      try {
        await fs.access(path.join(campaignDir, "campaign.tsx"));
        const meta = await this.readCampaignMeta(clientId, entry.name);
        campaigns.push({
          id: meta.id,
          title: meta.title,
          durationMs: meta.durationMs,
          fps: meta.fps,
          variantCount: meta.variants.length,
          updatedAt: meta.updatedAt,
          path: path.relative(clientRoot, campaignDir),
        });
      } catch {
        // Skip incomplete campaign folders.
      }
    }
    campaigns.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const index = { schemaVersion: SCHEMA_VERSION, clientId, generatedAt: DATE_STAMP(), campaigns };
    await writeJsonAtomic(path.join(clientRoot, "campaign.index.json"), index);
    return index;
  }

  async createCampaign(input: CreateCampaignInput) {
    await this.initialize();
    assertSafeId(input.clientId, "clientId");
    const title = input.title.trim() || "Untitled ad campaign";
    const clientRoot = await this.ensureClientContext(input.clientId);
    const campaignId = await uniqueId(path.join(clientRoot, "campaigns"), slugify(title));
    const campaignRoot = path.join(clientRoot, "campaigns", campaignId);
    await ensureDir(campaignRoot);
    await ensureDir(path.join(campaignRoot, "assets"));
    await ensureDir(path.join(campaignRoot, ".export"));
    const now = DATE_STAMP();
    const variants = input.variants?.length ? input.variants : PERFORMANCE_SIZE_PACK;
    const meta: CampaignMeta = {
      schemaVersion: SCHEMA_VERSION,
      id: campaignId,
      clientId: input.clientId,
      title,
      durationMs: input.durationMs ?? DEFAULT_DURATION_MS,
      fps: input.fps ?? DEFAULT_FPS,
      revision: "0001",
      createdAt: now,
      updatedAt: now,
      variants,
    };
    await writeTextAtomic(path.join(campaignRoot, "campaign.tsx"), campaignScaffold(meta));
    await writeJsonAtomic(path.join(campaignRoot, "campaign.meta.json"), meta);
    await writeTextAtomic(path.join(campaignRoot, "memory.md"), DEFAULT_CAMPAIGN_MEMORY);
    await this.rebuildCampaignIndex(input.clientId);
    this.events.emit("campaignChanged", { type: "campaignChanged", clientId: input.clientId, campaignId });
    return { schemaVersion: SCHEMA_VERSION, meta, campaignRoot, previewUrl: this.previewPath(input.clientId, campaignId) };
  }

  async openCampaign(clientId: string, campaignId: string): Promise<OpenCampaignResult> {
    const campaignRoot = await this.campaignRoot(clientId, campaignId);
    const meta = await this.readCampaignMeta(clientId, campaignId);
    const source = await readText(path.join(campaignRoot, "campaign.tsx"));
    return {
      schemaVersion: SCHEMA_VERSION,
      clientId,
      campaignId,
      campaignRoot,
      meta,
      source,
      previewUrl: this.previewPath(clientId, campaignId),
    };
  }

  async updateCampaignSource(input: UpdateCampaignSourceInput) {
    const campaignRoot = await this.campaignRoot(input.clientId, input.campaignId);
    const meta = await this.readCampaignMeta(input.clientId, input.campaignId);
    const source = input.source.trimEnd();
    if (!source) throw new AdPostersError("campaign.tsx source cannot be empty.");
    if (!source.includes("export default")) throw new AdPostersError("campaign.tsx must include a default export.");

    const updatedMeta = {
      ...meta,
      revision: nextRevision(meta.revision),
      updatedAt: DATE_STAMP(),
    };
    await writeTextAtomic(path.join(campaignRoot, "campaign.tsx"), `${source}\n`);
    await writeJsonAtomic(path.join(campaignRoot, "campaign.meta.json"), updatedMeta);
    await this.rebuildCampaignIndex(input.clientId);
    this.events.emit("campaignChanged", { type: "campaignChanged", clientId: input.clientId, campaignId: input.campaignId });
    return {
      schemaVersion: SCHEMA_VERSION,
      meta: updatedMeta,
      campaignRoot,
      previewUrl: this.previewPath(input.clientId, input.campaignId),
    };
  }

  async readCampaignMeta(clientId: string, campaignId: string): Promise<CampaignMeta> {
    const metaPath = path.join(await this.campaignRoot(clientId, campaignId), "campaign.meta.json");
    const parsed = CampaignMetaSchema.safeParse(await readJson(metaPath));
    if (!parsed.success) throw new AdPostersError(`campaign.meta.json is invalid for ${campaignId}.`, parsed.error.flatten());
    return parsed.data;
  }

  async deleteCampaign(clientId: string, campaignId: string) {
    const campaignRoot = await this.campaignRoot(clientId, campaignId);
    await fs.rm(campaignRoot, { recursive: true, force: true });
    await this.rebuildCampaignIndex(clientId);
    this.events.emit("campaignDeleted", { type: "campaignDeleted", clientId, campaignId });
    return { schemaVersion: SCHEMA_VERSION, deleted: campaignId };
  }

  async uploadAsset(input: { clientId: string; campaignId: string; fileName: string; dataBase64: string }) {
    const campaignRoot = await this.campaignRoot(input.clientId, input.campaignId);
    const assetsDir = path.join(campaignRoot, "assets");
    await ensureDir(assetsDir);
    const fileName = sanitizeFileName(input.fileName);
    const ext = path.extname(fileName);
    const stem = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, "_") || "asset";
    const finalName = `${stem}-${Date.now().toString(36)}${ext}`;
    const filePath = path.join(assetsDir, finalName);
    await assertInside(assetsDir, filePath);
    await fs.writeFile(filePath, Buffer.from(stripBase64Prefix(input.dataBase64), "base64"));
    return {
      schemaVersion: SCHEMA_VERSION,
      fileName: finalName,
      url: `/campaign-assets/${encodeURIComponent(input.clientId)}/${encodeURIComponent(input.campaignId)}/assets/${encodeURIComponent(finalName)}`,
    };
  }

  async resolveAssetPath(clientId: string, campaignId: string, relPath: string) {
    if (!relPath || relPath.includes("..") || path.isAbsolute(relPath)) throw new AdPostersError("Invalid asset path.");
    const campaignRoot = await this.campaignRoot(clientId, campaignId);
    const assetRoot = path.join(campaignRoot, "assets");
    const candidate = path.resolve(campaignRoot, relPath);
    const realAssetRoot = await fs.realpath(assetRoot);
    const realCandidate = await fs.realpath(candidate);
    await assertInside(realAssetRoot, realCandidate);
    return realCandidate;
  }

  async campaignRoot(clientId: string, campaignId: string): Promise<string> {
    assertSafeId(campaignId, "campaignId");
    const clientRoot = await this.resolveClientRoot(clientId);
    const campaignRoot = path.resolve(clientRoot, "campaigns", campaignId);
    await assertInside(clientRoot, campaignRoot);
    return campaignRoot;
  }

  async resolveClientRoot(clientId: string): Promise<string> {
    assertSafeId(clientId, "clientId");
    const registry = await this.readClientRegistryFileOnly();
    const client = registry.clients.find((item) => item.id === clientId);
    if (!client) throw new AdPostersError(`Client is not registered: ${clientId}`);
    const root = path.resolve(this.centralRoot, client.root);
    const repoRoot = path.resolve(this.centralRoot, "../../..");
    await assertInside(repoRoot, root);
    const realRepoRoot = await fs.realpath(repoRoot).catch(() => repoRoot);
    const normalizedRoot = path.resolve(realRepoRoot, path.relative(repoRoot, root));
    const realRoot = await fs.realpath(root).catch(() => normalizedRoot);
    const realAppRoot = await fs.realpath(this.appRoot).catch(() => this.appRoot);
    await assertInside(realRepoRoot, realRoot);
    if (realRoot === realAppRoot || realRoot.startsWith(`${realAppRoot}${path.sep}`)) {
      throw new AdPostersError("Client roots may not point inside application source.");
    }
    return normalizedRoot;
  }

  previewPath(clientId: string, campaignId: string) {
    return `/preview/${encodeURIComponent(clientId)}/${encodeURIComponent(campaignId)}`;
  }

  private async ensureClientRegistry() {
    await writeIfMissing(path.join(this.workspaceRoot, "client.registry.json"), JSON.stringify({
      schemaVersion: SCHEMA_VERSION,
      clients: [],
    }, null, 2));
  }

  private async readClientRegistryFileOnly(): Promise<ClientRegistry> {
    const registryPath = path.join(this.workspaceRoot, "client.registry.json");
    if (!(await exists(registryPath))) await this.ensureClientRegistry();
    const parsed = ClientRegistrySchema.safeParse(await readJson(registryPath));
    if (!parsed.success) throw new AdPostersError("client.registry.json is invalid.", parsed.error.flatten());
    return parsed.data;
  }
}

const CampaignIndexSchema: z.ZodType<CampaignIndex> = z.object({
  schemaVersion: z.number(),
  clientId: z.string().regex(ID_RE),
  generatedAt: z.string(),
  campaigns: z.array(z.object({
    id: z.string().regex(ID_RE),
    title: z.string(),
    durationMs: z.number().int().positive(),
    fps: z.number().int().positive(),
    variantCount: z.number().int().nonnegative(),
    updatedAt: z.string(),
    path: z.string(),
  })),
});

function campaignScaffold(meta: CampaignMeta) {
  const variants = JSON.stringify(meta.variants, null, 2);
  return `import { AdCampaign, AdVariant, ease, interpolate, useAdTime } from "@qraft-ad-posters/runtime";
import { TapwiseBadge, TapwiseCta, TapwiseShell } from "@qraft-ad-posters/templates";
import "@qraft-ad-posters/templates/tapwise/styles.css";

const variants = ${variants} as const;

type LayoutMode = "standard" | "compact" | "leaderboard" | "narrow";

function Creative({ layout = "standard" }: { layout?: LayoutMode }) {
  const time = useAdTime();
  const intro = ease(interpolate(time, [0, 900], [0, 1]));
  const proof = ease(interpolate(time, [650, 1400], [0, 1]));
  const mockup = ease(interpolate(time, [800, 1700], [0, 1]));
  const cta = ease(interpolate(time, [1450, 2300], [0, 1]));
  const introY = interpolate(intro, [0, 1], [22, 0]);
  const mockupY = interpolate(mockup, [0, 1], [24, 0]);
  const mockupScale = interpolate(mockup, [0, 1], [0.98, 1]);
  const ctaY = interpolate(cta, [0, 1], [12, 0]);
  const layoutClass = layout === "standard" ? "tw-ad-layout" : \`tw-ad-layout tw-ad-layout-\${layout}\`;

  return (
    <TapwiseShell>
      <div className={layoutClass}>
        <div className="tw-ad-content" style={{ opacity: intro, transform: \`translateY(\${introY}px)\` }}>
          <div className="tw-ad-brand-row">
            <span className="tw-ad-mark">T</span>
            <span className="tw-ad-brand">Tapwise</span>
            <span className="tw-ad-beta">Beta</span>
          </div>
          <TapwiseBadge>Voor leerlingen en ouders</TapwiseBadge>
          <h1 className="tw-ad-title">Maak leren makkelijker met je eigen materiaal.</h1>
          <p className="tw-ad-copy">
            Tapwise verandert notities en lesstof in oefenvragen, samenvattingen en slimme studiehulp.
          </p>
          <div className="tw-ad-proof-row" style={{ opacity: proof }}>
            <span className="tw-ad-proof">Eigen materiaal</span>
            <span className="tw-ad-proof">Oefenvragen</span>
            <span className="tw-ad-proof">Samenvattingen</span>
          </div>
          <div className="tw-ad-footer" style={{ opacity: cta, transform: \`translateY(\${ctaY}px)\` }}>
            <TapwiseCta>Probeer Tapwise</TapwiseCta>
            <span className="tw-ad-note">Start met je eigen notities.</span>
          </div>
        </div>
        <div className="tw-ad-visual" style={{ opacity: mockup, transform: \`translateY(\${mockupY}px) scale(\${mockupScale})\` }}>
          <div className="tw-ad-mockup-card">
            <div className="tw-ad-mockup-top">
              <span>Van lesstof naar oefening</span>
              <span className="tw-ad-mockup-dots" aria-hidden="true">
                <span className="tw-ad-mockup-dot" />
                <span className="tw-ad-mockup-dot" />
                <span className="tw-ad-mockup-dot" />
              </span>
            </div>
            <h2 className="tw-ad-mockup-title">Vandaag oefenen</h2>
            <div className="tw-ad-workflow">
              <div className="tw-ad-workflow-row">
                <span className="tw-ad-workflow-icon">1</span>
                <span className="tw-ad-workflow-text">
                  <strong>Upload je stof</strong>
                  Notities, hoofdstuk of samenvatting
                </span>
              </div>
              <div className="tw-ad-workflow-row">
                <span className="tw-ad-workflow-icon">2</span>
                <span className="tw-ad-workflow-text">
                  <strong>Laat Tapwise helpen</strong>
                  Direct oefenen met je eigen materiaal
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </TapwiseShell>
  );
}

export default function Campaign() {
  return (
    <AdCampaign title=${JSON.stringify(meta.title)} durationMs={${meta.durationMs}} fps={${meta.fps}}>
      {variants.map((variant) => (
        <AdVariant key={variant.id} {...variant}>
          <Creative layout={variant.height < 140 ? "leaderboard" : variant.width <= 340 && variant.height >= 500 ? "narrow" : variant.width < 520 || variant.height < 340 ? "compact" : "standard"} />
        </AdVariant>
      ))}
    </AdCampaign>
  );
}
`;
}

const DEFAULT_GLOBAL_PRODUCT = `# Qraft Ad Posters Product Context

Ad Posters creates browser-rendered ad campaigns from React source files.
`;

const DEFAULT_GLOBAL_DESIGN = `# Qraft Ad Posters Design Context

Keep ad creative clear, readable, and export-ready.
`;

const DEFAULT_CLIENT_AGENTS = `# Ad Posters Guide

This folder stores code-first ad campaigns for this project.

Generated campaigns belong under \`campaigns/\`. Exported files belong inside each campaign's \`.export/\` folder.
`;

const DEFAULT_CLIENT_PRODUCT = `# Ad Posters Product Context

Use this file for project-specific campaign context.
`;

const DEFAULT_CLIENT_DESIGN = `# Ad Posters Design Context

Use this file for project-specific ad design guidance.
`;

const DEFAULT_CAMPAIGN_MEMORY = `# Campaign Memory

Use this for campaign goals, copy notes, platform notes, and export decisions.

Do not store secrets or customer data here.
`;

async function uniqueId(root: string, base: string) {
  const safe = base || "campaign";
  for (let i = 0; i < 50; i += 1) {
    const id = i === 0 ? `${safe}-${randomUUID().slice(0, 6)}` : `${safe}-${randomUUID().slice(0, 8)}`;
    if (!(await exists(path.join(root, id)))) return id;
  }
  throw new AdPostersError("Could not create a unique campaign id.");
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-+/g, "-").slice(0, 48) || "campaign";
}

function nextRevision(revision: string) {
  const current = Number.parseInt(revision, 10);
  if (!Number.isNaN(current)) return String(current + 1).padStart(4, "0");
  return `${revision}-next`;
}

function defaultCentralRoot() {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(here, "../../../..");
}

function assertSafeId(id: string, label: string) {
  if (!ID_RE.test(id)) throw new AdPostersError(`${label} must be a safe id.`);
}

async function assertInside(root: string, candidate: string) {
  const rel = path.relative(path.resolve(root), path.resolve(candidate));
  if (rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new AdPostersError(`Path escapes allowed root: ${candidate}`);
  }
}

async function exists(filePath: string) {
  return fs.access(filePath).then(() => true, () => false);
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readText(filePath: string) {
  return fs.readFile(filePath, "utf8");
}

async function readJson(filePath: string) {
  return JSON.parse(await readText(filePath)) as unknown;
}

async function writeIfMissing(filePath: string, contents: string) {
  if (await exists(filePath)) return;
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, contents.endsWith("\n") ? contents : `${contents}\n`, "utf8");
}

async function writeTextAtomic(filePath: string, contents: string) {
  await ensureDir(path.dirname(filePath));
  const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, contents, "utf8");
  await fs.rename(tmp, filePath);
}

async function writeJsonAtomic(filePath: string, value: unknown) {
  await writeTextAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function sanitizeFileName(fileName: string) {
  const base = path.basename(fileName).replace(/^\.+/, "").trim();
  if (!base || base.includes("..")) return "asset.bin";
  return base.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function stripBase64Prefix(value: string) {
  return value.replace(/^data:[^;]+;base64,/, "");
}
