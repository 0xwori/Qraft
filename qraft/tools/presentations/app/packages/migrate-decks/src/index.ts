import path from "node:path";
import { promises as fs } from "node:fs";

interface LegacyBlock {
  id: string;
  slot?: string;
  type: string;
  text?: string;
  textRole?: string;
  value?: string;
  label?: string;
  description?: string;
  quote?: string;
  attribution?: string;
}

interface LegacySlide {
  id: string;
  layoutId?: string;
  title?: string;
  notes?: string;
  blocks: LegacyBlock[];
}

interface LegacyDeck {
  id: string;
  clientId: string;
  title: string;
  themeId?: string;
  slides: LegacySlide[];
}

function escapeJsx(s: string): string {
  return JSON.stringify(s ?? "");
}

function pickBySlot(blocks: LegacyBlock[], slot: string): LegacyBlock | undefined {
  return blocks.find((b) => b.slot === slot);
}

function pickByRole(blocks: LegacyBlock[], role: string): LegacyBlock | undefined {
  return blocks.find((b) => b.textRole === role);
}

function metricBlocks(blocks: LegacyBlock[]): LegacyBlock[] {
  return blocks.filter((b) => b.type === "metric");
}

function quoteBlocks(blocks: LegacyBlock[]): LegacyBlock[] {
  return blocks.filter((b) => b.type === "quote");
}

function bodyText(blocks: LegacyBlock[]): string {
  const body = pickByRole(blocks, "body") ?? pickBySlot(blocks, "body") ?? pickBySlot(blocks, "items");
  return body?.text ?? "";
}

function slideToJsx(slide: LegacySlide, isFirst: boolean): string {
  const layout = (slide.layoutId ?? "").toLowerCase();
  const blocks = slide.blocks ?? [];
  const titleText = pickByRole(blocks, "title")?.text ?? slide.title ?? "";
  const subtitleText = pickByRole(blocks, "subtitle")?.text ?? "";

  if (isFirst || layout === "cover") {
    return `<Broadside.Cover number="01" section="" title=${escapeJsx(titleText)} subtitle=${escapeJsx(subtitleText)} author="" context="" />`;
  }

  const quotes = quoteBlocks(blocks);
  if (layout === "quote" || quotes.length > 0) {
    const q = quotes[0];
    return `<Broadside.Quote quote=${escapeJsx(q?.quote ?? titleText)} attribution=${escapeJsx(q?.attribution ?? "")} />`;
  }

  const metrics = metricBlocks(blocks);
  if (layout.includes("metric") || layout === "dashboard" || metrics.length > 0) {
    const stats = metrics.map((m) => `{ value: ${escapeJsx(m.value ?? "")}, label: ${escapeJsx(m.label ?? "")} }`).join(", ");
    return `<Broadside.Stats eyebrow="" headline=${escapeJsx(titleText)} stats={[${stats}]} />`;
  }

  if (layout === "agenda" || layout === "list" || layout === "timeline" || layout === "comparison") {
    const body = bodyText(blocks);
    const items = body
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => `{ title: ${escapeJsx(line)}, body: "" }`)
      .join(", ");
    return `<Broadside.List eyebrow="" headline=${escapeJsx(titleText)} items={[${items}]} />`;
  }

  if (layout === "split") {
    const left = pickBySlot(blocks, "left")?.text ?? bodyText(blocks);
    return `<Broadside.Split eyebrow="" headline=${escapeJsx(titleText)} body=${escapeJsx(left)} image="" imageAlt="" />`;
  }

  return `<Broadside.Statement eyebrow="" statement=${escapeJsx(titleText || subtitleText || "(migrate me)")} attribution="" />`;
}

export interface MigrateOptions {
  /** Absolute path to deck folder containing deck.json. */
  deckDir: string;
  /** When true, overwrite existing deck.tsx. */
  force?: boolean;
}

export async function migrateDeck(opts: MigrateOptions): Promise<{ written: string } | { skipped: string }> {
  const deckJsonPath = path.join(opts.deckDir, "deck.json");
  const deckTsxPath = path.join(opts.deckDir, "deck.tsx");
  if (!opts.force) {
    const exists = await fs.access(deckTsxPath).then(() => true, () => false);
    if (exists) return { skipped: deckTsxPath };
  }
  const raw = await fs.readFile(deckJsonPath, "utf8");
  const legacy = JSON.parse(raw) as LegacyDeck;
  const slidesJsx = (legacy.slides ?? []).map((s, i) => `      ${slideToJsx(s, i === 0)}`).join("\n");
  const tsx = `import { Deck } from "@micro-keynote/deck-runtime";
import { Broadside } from "@micro-keynote/templates";
import "@micro-keynote/templates/broadside/styles.css";

export default function MigratedDeck() {
  return (
    <Deck theme="broadside" title=${escapeJsx(legacy.title ?? legacy.id)}>
${slidesJsx}
    </Deck>
  );
}
`;
  await fs.writeFile(deckTsxPath, tsx, "utf8");
  const meta = {
    schemaVersion: 1,
    id: legacy.id,
    clientId: legacy.clientId,
    title: legacy.title,
    revision: "0001",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    migratedFrom: "deck.json",
  };
  await fs.writeFile(path.join(opts.deckDir, "deck.meta.json"), JSON.stringify(meta, null, 2), "utf8");
  await fs.rename(deckJsonPath, path.join(opts.deckDir, "deck.json.bak")).catch(() => undefined);
  return { written: deckTsxPath };
}

export async function migrateAll(decksRoot: string, opts: { force?: boolean } = {}): Promise<void> {
  const entries = await fs.readdir(decksRoot, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const deckDir = path.join(decksRoot, entry.name);
    const hasJson = await fs.access(path.join(deckDir, "deck.json")).then(() => true, () => false);
    if (!hasJson) continue;
    const result = await migrateDeck({ deckDir, force: opts.force }).catch((err) => ({ error: String(err) }));
    if ("written" in result) console.log(`migrated ${result.written}`);
    else if ("skipped" in result) console.log(`skipped ${result.skipped} (already exists)`);
    else console.warn(`failed ${deckDir}: ${(result as { error: string }).error}`);
  }
}
