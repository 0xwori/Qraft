import { EventEmitter } from "node:events";
import { createHash, randomUUID } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

export const SCHEMA_VERSION = 1;
export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

export type ExportTarget = "html" | "pdf" | "pptx";
export type ExportSupport = "native" | "image-fallback" | "fallback" | "unsupported";
export type ExportCompatibility = Record<ExportTarget, ExportSupport>;
export type BlockType =
  | "text"
  | "image"
  | "chart"
  | "diagram"
  | "shape"
  | "table"
  | "metric"
  | "quote"
  | "group"
  | "placeholder";

export type ValidationSeverity = "info" | "warning" | "error";

export interface ValidationWarning {
  id: string;
  severity: ValidationSeverity;
  path: string;
  message: string;
}

export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BaseBlock {
  id: string;
  type: BlockType;
  slot?: string;
  frame: Frame;
  style?: Record<string, unknown>;
  exportCompatibility: ExportCompatibility;
  createdAt: string;
  updatedAt: string;
}

export interface TextBlock extends BaseBlock {
  type: "text";
  text: string;
  richText?: unknown;
  textRole?: "title" | "subtitle" | "body" | "caption" | "eyebrow";
}

export interface ImageBlock extends BaseBlock {
  type: "image";
  assetId?: string;
  altText?: string;
  fit?: "cover" | "contain" | "fill";
  prompt?: string;
}

export interface ChartBlock extends BaseBlock {
  type: "chart";
  chartType: "bar" | "line" | "area" | "pie" | "scatter";
  title?: string;
  data: Array<Record<string, string | number>>;
  encoding?: Record<string, string>;
  sourceData?: string;
}

export interface DiagramBlock extends BaseBlock {
  type: "diagram";
  diagramType: "mermaid";
  source: string;
}

export interface ShapeBlock extends BaseBlock {
  type: "shape";
  shape: "rect" | "ellipse" | "line";
  text?: string;
}

export interface TableBlock extends BaseBlock {
  type: "table";
  columns: string[];
  rows: Array<Array<string | number>>;
}

export interface MetricBlock extends BaseBlock {
  type: "metric";
  value: string;
  label: string;
  description?: string;
}

export interface QuoteBlock extends BaseBlock {
  type: "quote";
  quote: string;
  attribution?: string;
}

export interface GroupBlock extends BaseBlock {
  type: "group";
  childIds: string[];
}

export interface PlaceholderBlock extends BaseBlock {
  type: "placeholder";
  label: string;
  prompt?: string;
  intendedType?: BlockType;
}

export type DeckBlock =
  | TextBlock
  | ImageBlock
  | ChartBlock
  | DiagramBlock
  | ShapeBlock
  | TableBlock
  | MetricBlock
  | QuoteBlock
  | GroupBlock
  | PlaceholderBlock;

export interface Slide {
  id: string;
  layoutId: string;
  title: string;
  notes?: string;
  background?: string;
  blocks: DeckBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface AssetMetadata {
  schemaVersion: number;
  id: string;
  kind: "upload" | "generated" | "placeholder";
  source: "upload" | "generated" | "placeholder" | "imported";
  prompt?: string;
  altText?: string;
  localPath: string;
  checksum?: string;
  mimeType?: string;
  createdAt: string;
  usageRefs: string[];
}

export interface Deck {
  schemaVersion: number;
  id: string;
  clientId: string;
  title: string;
  themeId: string;
  revision: string;
  createdAt: string;
  updatedAt: string;
  slides: Slide[];
  assets: AssetMetadata[];
  metadata: {
    productContextSource: "global" | "client" | "snapshot";
    designContextSource: "global" | "client" | "snapshot";
    importedTemplateIds: string[];
  };
}

export interface ClientRegistry {
  schemaVersion: number;
  clients: Array<{
    id: string;
    name: string;
    root: string;
  }>;
}

export interface DeckIndex {
  schemaVersion: number;
  clientId: string;
  generatedAt: string;
  decks: Array<{
    id: string;
    title: string;
    themeId: string;
    slideCount: number;
    revision: string;
    updatedAt: string;
    path: string;
  }>;
}

export interface ContextSnapshot {
  schemaVersion: number;
  clientId: string;
  deckId: string;
  generatedAt: string;
  product: {
    global: string;
    client: string;
  };
  design: {
    global: string;
    client: string;
  };
  memory: string;
}

export interface LayoutDefinition {
  schemaVersion: number;
  id: string;
  name: string;
  purpose: string;
  slots: Array<{
    id: string;
    name: string;
    required: boolean;
    supportedBlockTypes: BlockType[];
    defaultFrame: Frame;
  }>;
  defaultBlocks: Array<Partial<DeckBlock> & { type: BlockType; slot: string }>;
  themeTokens: string[];
  exportCompatibility: ExportCompatibility;
  /** Optional CSS class applied to the slide root for theme-specific decorative wrappers. */
  wrapperClass?: string;
}

export interface ThemeDefinition {
  schemaVersion: number;
  id: string;
  name: string;
  sourceTemplateId: string;
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string | number>;
  exportCompatibility: ExportCompatibility;
  /** Optional description / tagline surfaced in the theme picker. */
  description?: string;
  /**
   * Optional CSS injected into the renderer style block, scoped under
   * `.mk-theme-{id}`. Used by imported templates to ship decorative motifs
   * (scanlines, grid lines, scatter dots, etc.) without forking layouts.
   */
  decorCss?: string;
  /**
   * Optional Google Fonts (or other) CSS @import rules to preload theme fonts.
   * Stored as a list of import URLs (e.g. https://fonts.googleapis.com/css2?...).
   */
  fontImports?: string[];
}

export interface TemplateManifest {
  schemaVersion: number;
  generatedAt: string;
  sources: string[];
  themes: string[];
  layouts: string[];
  components: string[];
}

export interface MutationResult<T = unknown> {
  changedSlideIds: string[];
  changedBlockIds: string[];
  validationWarnings: ValidationWarning[];
  revisionBefore: string;
  revisionAfter: string;
  previewUrl: string;
  eventId: string;
  data?: T;
}

export const FrameSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  width: z.number().positive(),
  height: z.number().positive(),
});

const ExportCompatibilitySchema = z.object({
  html: z.enum(["native", "image-fallback", "fallback", "unsupported"]),
  pdf: z.enum(["native", "image-fallback", "fallback", "unsupported"]),
  pptx: z.enum(["native", "image-fallback", "fallback", "unsupported"]),
});

const BaseBlockSchema = z.object({
  id: z.string(),
  slot: z.string().optional(),
  frame: FrameSchema,
  style: z.record(z.unknown()).optional(),
  exportCompatibility: ExportCompatibilitySchema,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const DeckBlockSchema: z.ZodType<DeckBlock> = z.discriminatedUnion("type", [
  BaseBlockSchema.extend({
    type: z.literal("text"),
    text: z.string(),
    richText: z.unknown().optional(),
    textRole: z.enum(["title", "subtitle", "body", "caption", "eyebrow"]).optional(),
  }),
  BaseBlockSchema.extend({
    type: z.literal("image"),
    assetId: z.string().optional(),
    altText: z.string().optional(),
    fit: z.enum(["cover", "contain", "fill"]).optional(),
    prompt: z.string().optional(),
  }),
  BaseBlockSchema.extend({
    type: z.literal("chart"),
    chartType: z.enum(["bar", "line", "area", "pie", "scatter"]),
    title: z.string().optional(),
    data: z.array(z.record(z.union([z.string(), z.number()]))),
    encoding: z.record(z.string()).optional(),
    sourceData: z.string().optional(),
  }),
  BaseBlockSchema.extend({
    type: z.literal("diagram"),
    diagramType: z.literal("mermaid"),
    source: z.string(),
  }),
  BaseBlockSchema.extend({
    type: z.literal("shape"),
    shape: z.enum(["rect", "ellipse", "line"]),
    text: z.string().optional(),
  }),
  BaseBlockSchema.extend({
    type: z.literal("table"),
    columns: z.array(z.string()),
    rows: z.array(z.array(z.union([z.string(), z.number()]))),
  }),
  BaseBlockSchema.extend({
    type: z.literal("metric"),
    value: z.string(),
    label: z.string(),
    description: z.string().optional(),
  }),
  BaseBlockSchema.extend({
    type: z.literal("quote"),
    quote: z.string(),
    attribution: z.string().optional(),
  }),
  BaseBlockSchema.extend({
    type: z.literal("group"),
    childIds: z.array(z.string()),
  }),
  BaseBlockSchema.extend({
    type: z.literal("placeholder"),
    label: z.string(),
    prompt: z.string().optional(),
    intendedType: z.enum(["text", "image", "chart", "diagram", "shape", "table", "metric", "quote", "group", "placeholder"]).optional(),
  }),
]) as z.ZodType<DeckBlock>;

export const SlideSchema: z.ZodType<Slide> = z.object({
  id: z.string(),
  layoutId: z.string(),
  title: z.string(),
  notes: z.string().optional(),
  background: z.string().optional(),
  blocks: z.array(DeckBlockSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const AssetMetadataSchema: z.ZodType<AssetMetadata> = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: z.string(),
  kind: z.enum(["upload", "generated", "placeholder"]),
  source: z.enum(["upload", "generated", "placeholder", "imported"]),
  prompt: z.string().optional(),
  altText: z.string().optional(),
  localPath: z.string(),
  checksum: z.string().optional(),
  mimeType: z.string().optional(),
  createdAt: z.string(),
  usageRefs: z.array(z.string()),
});

export const ClientRegistrySchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  clients: z.array(z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    root: z.string().min(1),
  })),
});

export const DeckIndexSchema = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  clientId: z.string(),
  generatedAt: z.string(),
  decks: z.array(z.object({
    id: z.string(),
    title: z.string(),
    themeId: z.string(),
    slideCount: z.number().int().nonnegative(),
    revision: z.string(),
    updatedAt: z.string(),
    path: z.string(),
  })),
});

export const DeckSchema: z.ZodType<Deck> = z.object({
  schemaVersion: z.literal(SCHEMA_VERSION),
  id: z.string(),
  clientId: z.string(),
  title: z.string(),
  themeId: z.string(),
  revision: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  slides: z.array(SlideSchema),
  assets: z.array(AssetMetadataSchema),
  metadata: z.object({
    productContextSource: z.enum(["global", "client", "snapshot"]),
    designContextSource: z.enum(["global", "client", "snapshot"]),
    importedTemplateIds: z.array(z.string()),
  }),
});

export interface CoreOptions {
  centralRoot?: string;
  defaultPort?: number;
}

export interface DeckLocator {
  clientId: string;
  deckId: string;
}

export interface CreateDeckInput {
  clientId: string;
  title: string;
  themeId?: string;
  layoutId?: string;
  intent?: string;
}

export interface MutatingInput extends DeckLocator {
  intent?: string;
  expectedRevision?: string;
  toolName?: string;
}

const DATE_STAMP = () => new Date().toISOString();
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,96}$/;
const FILE_RE = /^[A-Za-z0-9][A-Za-z0-9_. -]{0,160}$/;

const DEFAULT_GLOBAL_PRODUCT = `# Qraft Presentation Product Context

Use this file for shared presentation context, audience assumptions, terminology, positioning, and claims to avoid.

This file is context input for qraftPptx. It is read-only in normal presentation editing mode.
`;

const DEFAULT_GLOBAL_DESIGN = `# Qraft Presentation Design Context

Use this file for shared slide design guidance, brand notes, chart conventions, typography, and visual style.

This file is context input for qraftPptx. It is read-only in normal presentation editing mode.
`;

const DEFAULT_CLIENT_PRODUCT = `# Client Product Context

Describe client-specific business/product context, audience, terminology, positioning, and claims to avoid.
`;

const DEFAULT_CLIENT_DESIGN = `# Client Design Context

Describe client-specific brand rules, colors, typography, spacing, image style, chart style, and slide design guidance.
`;

const DEFAULT_MEMORY = `# Deck Memory

Use this file for narrative decisions, slide goals, user preferences, important facts, unresolved TODOs, and speaker-note assumptions for this deck.
`;

/**
 * Themes with a ported React component namespace in @micro-keynote/templates.
 * createDeck scaffolds deck.tsx using the namespace's Cover variant.
 */
const THEME_REACT_PORTS: Record<string, { namespace: string; cover: string; variants: string }> = {
  "soft-editorial": {
    namespace: "SoftEditorial",
    cover: "Cover",
    variants:
      "Cover, Foreword, Method, Insights, Closer, Chapter, Statement, " +
      "Numbers, Stats, Quote, Next, Split, List, Chart, Process, Matrix, Consult, End",
  },
};

const DEFAULT_REACT_THEME_ID = "soft-editorial";

function reactDeckMemory(themeId: string): string {
  const port = THEME_REACT_PORTS[themeId];
  if (!port) return DEFAULT_MEMORY;
  return `# Deck Memory

## Theme Constraint
This deck uses the **${themeId}** theme (namespace: \`${port.namespace}\`).

- All slides MUST use \`${port.namespace}.<Variant>\` components. Never use bare HTML or components from another namespace.
- Available variants: ${port.variants}.
- Call \`list_source_variants\` with \`themeId="${themeId}"\` to get each variant's purpose, density, required props, and a jsxTemplate.
- To add a slide, call \`add_source_slide\` with a filled-in jsxTemplate.
- Only switch the theme if the user explicitly requests it.

## Adapting content — always preserve
Never change these — they ARE the design system:
- Fonts: Cormorant Garamond for display, the body font stack declared in the theme. Do not substitute.
- Color palette: cream paper, sage, blush, lemon accents, and ink. Use the theme's CSS variables.
- Decorative vocabulary: paper grain, hairline borders, serif rhythm, generous margins.
- Component grammar: if a variant uses a specific structure (numeral → title → body), reuse it.

## Adapting content — always replace
Swap out placeholder values with the user's real content:
- Headlines, body copy, captions.
- Numbers and statistics.
- Names, dates, attributions.

## Designing missing slides (when no variant fits)
If the user needs a layout that no variant covers:
1. Pick the closest variant as a structural starting point.
2. Extend it using the same fonts, colors, spacing rhythm, and decorative vocabulary.
3. The new slide must belong visually — same serif, same palette, same margins. Do not introduce a new visual language.
4. Do NOT bail back to the user, pick a different theme, or import external components.

## Narrative & Decisions
Use this section for story arc, slide goals, user preferences, important facts, unresolved TODOs, and speaker-note assumptions.
`;
}

function reactDeckScaffold(themeId: string, title: string): string {
  const port = THEME_REACT_PORTS[themeId];
  if (!port) throw new Error(`Theme "${themeId}" has no React port. Available: ${Object.keys(THEME_REACT_PORTS).join(", ")}`);
  const safeTitle = JSON.stringify(title);
  return `import { Deck } from "@micro-keynote/deck-runtime";
import { ${port.namespace} } from "@micro-keynote/templates";
import "@micro-keynote/templates/${themeId}/styles.css";

export default function GeneratedDeck() {
  return (
    <Deck theme=${JSON.stringify(themeId)} title=${safeTitle} width={1920} height={1080}>
      <${port.namespace}.${port.cover}
        kicker="New deck"
        title=${safeTitle}
      />
    </Deck>
  );
}
`;
}

function countDeckSlides(tsx: string): number {
  // Count top-level JSX children inside <Deck>...</Deck>. Cheap regex — good
  // enough for the index. The mcp-server uses ts-morph for accuracy.
  const m = tsx.match(/<Deck[\s\S]*?>([\s\S]*)<\/Deck>/);
  if (!m) return 0;
  const body = m[1];
  return (body.match(/<\w[\w.]*\b/g) ?? []).length;
}

const nativeAll: ExportCompatibility = { html: "native", pdf: "native", pptx: "native" };

export const DEFAULT_THEMES: ThemeDefinition[] = [
  {
    schemaVersion: SCHEMA_VERSION,
    id: "soft-editorial",
    name: "Soft Editorial",
    sourceTemplateId: "soft-editorial",
    colors: {
      bg: "#F2EEDF",
      primary: "#2A241B",
      text: "#2A241B",
      paper: "#F2EEDF",
      "paper-2": "#ECE6D2",
      ink: "#2A241B",
      "ink-soft": "#5C5345",
      pink: "#E1A4C2",
      lemon: "#D6DD63",
      blush: "#E8C9B6",
      sage: "#B7C7A8",
      lilac: "#C9BEDC",
      "card-fill": "rgba(255,255,255,0.55)",
      "rule-soft": "rgba(42,36,27,0.18)",
      "rule-medium": "rgba(42,36,27,0.35)",
    },
    typography: {
      display: "Cormorant Garamond, Garamond, serif",
      body: "Work Sans, sans-serif",
      mono: "JetBrains Mono, ui-monospace, monospace",
    },
    spacing: {
      slidePadding: 48,
      grid: 8,
      radius: 8,
    },
    exportCompatibility: nativeAll,
    description: "Warm magazine-style slides with cream paper, serif headlines, and soft accent colors.",
    fontImports: [
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com",
      "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Work+Sans:wght@300;400;500;600&display=swap",
    ],
  },
];

export const DEFAULT_LAYOUTS: LayoutDefinition[] = [
  layout("cover", "Cover", "Strong title slide with subtitle and presenter/date.", [
    slot("title", true, ["text"], 96, 152, 760, 130),
    slot("subtitle", false, ["text"], 96, 300, 620, 84),
    slot("meta", false, ["text"], 96, 514, 440, 48),
    slot("visual", false, ["image", "shape", "placeholder"], 888, 0, 392, 720),
  ], [
    { type: "text", slot: "title", textRole: "title", text: "Untitled presentation" } as Partial<TextBlock> & { type: "text"; slot: string },
    { type: "text", slot: "subtitle", textRole: "subtitle", text: "Add a concise executive subtitle." } as Partial<TextBlock> & { type: "text"; slot: string },
    { type: "text", slot: "meta", textRole: "caption", text: "Prepared with qraftPptx" } as Partial<TextBlock> & { type: "text"; slot: string },
    { type: "shape", slot: "visual", shape: "rect", style: { opacity: 0.08 } } as Partial<ShapeBlock> & { type: "shape"; slot: string },
  ]),
  layout("agenda", "Agenda", "Structured agenda or table of contents.", [
    slot("title", true, ["text"], 76, 60, 760, 76),
    slot("items", true, ["text", "table"], 96, 166, 760, 420),
  ], [
    { type: "text", slot: "title", textRole: "title", text: "Agenda" } as Partial<TextBlock> & { type: "text"; slot: string },
    { type: "text", slot: "items", textRole: "body", text: "01 Context\n02 Insight\n03 Direction\n04 Decision" } as Partial<TextBlock> & { type: "text"; slot: string },
  ]),
  layout("key-metrics", "Key Metrics", "Three large metrics with concise supporting copy.", [
    slot("title", true, ["text"], 76, 56, 800, 72),
    slot("metric-1", true, ["metric"], 76, 198, 330, 260),
    slot("metric-2", true, ["metric"], 474, 198, 330, 260),
    slot("metric-3", true, ["metric"], 872, 198, 330, 260),
  ], [
    { type: "text", slot: "title", textRole: "title", text: "Key metrics" } as Partial<TextBlock> & { type: "text"; slot: string },
    { type: "metric", slot: "metric-1", value: "42%", label: "Primary metric", description: "Add the most important signal." } as Partial<MetricBlock> & { type: "metric"; slot: string },
    { type: "metric", slot: "metric-2", value: "3.1x", label: "Momentum", description: "Add relevant comparison." } as Partial<MetricBlock> & { type: "metric"; slot: string },
    { type: "metric", slot: "metric-3", value: "12", label: "Decision points", description: "Add implication." } as Partial<MetricBlock> & { type: "metric"; slot: string },
  ]),
  layout("stat-dashboard", "Stat Dashboard", "Dense executive dashboard with six stat cards.", [
    slot("title", true, ["text"], 76, 52, 820, 64),
    slot("dashboard", true, ["metric", "chart", "table"], 76, 148, 1128, 474),
  ], [
    { type: "text", slot: "title", textRole: "title", text: "Dashboard" } as Partial<TextBlock> & { type: "text"; slot: string },
    { type: "chart", slot: "dashboard", chartType: "bar", title: "Illustrative data", data: [{ name: "A", value: 42 }, { name: "B", value: 64 }, { name: "C", value: 51 }], encoding: { x: "name", y: "value" } } as Partial<ChartBlock> & { type: "chart"; slot: string },
  ]),
  layout("two-column", "Two Column Split", "Narrative on one side, evidence or visual on the other.", [
    slot("title", true, ["text"], 76, 54, 940, 68),
    slot("left", true, ["text", "quote", "metric"], 76, 164, 510, 430),
    slot("right", true, ["image", "chart", "diagram", "table", "placeholder"], 652, 164, 552, 430),
  ], [
    { type: "text", slot: "title", textRole: "title", text: "A clear split argument" } as Partial<TextBlock> & { type: "text"; slot: string },
    { type: "text", slot: "left", textRole: "body", text: "Use this side for the message, rationale, and decision." } as Partial<TextBlock> & { type: "text"; slot: string },
    { type: "placeholder", slot: "right", label: "Add image, chart, or diagram", intendedType: "image" } as Partial<PlaceholderBlock> & { type: "placeholder"; slot: string },
  ]),
  layout("chart-ranking", "Chart Ranking", "Horizontal ranking, comparison, or simple chart story.", [
    slot("title", true, ["text"], 76, 54, 900, 66),
    slot("chart", true, ["chart"], 108, 164, 1020, 420),
  ], [
    { type: "text", slot: "title", textRole: "title", text: "Ranked comparison" } as Partial<TextBlock> & { type: "text"; slot: string },
    { type: "chart", slot: "chart", chartType: "bar", title: "Ranking", data: [{ name: "Option A", value: 72 }, { name: "Option B", value: 58 }, { name: "Option C", value: 41 }], encoding: { x: "name", y: "value" } } as Partial<ChartBlock> & { type: "chart"; slot: string },
  ]),
  layout("quote", "Quote", "Large quote or executive statement with attribution.", [
    slot("quote", true, ["quote"], 126, 188, 930, 300),
    slot("source", false, ["text"], 126, 516, 600, 58),
  ], [
    { type: "quote", slot: "quote", quote: "Add the statement that should stay with the audience.", attribution: "Source" } as Partial<QuoteBlock> & { type: "quote"; slot: string },
  ]),
  layout("timeline", "Timeline", "Process flow, milestones, or roadmap.", [
    slot("title", true, ["text"], 76, 54, 850, 68),
    slot("flow", true, ["diagram", "text", "table"], 88, 164, 1080, 420),
  ], [
    { type: "text", slot: "title", textRole: "title", text: "Timeline" } as Partial<TextBlock> & { type: "text"; slot: string },
    { type: "diagram", slot: "flow", diagramType: "mermaid", source: "flowchart LR\nA[Start] --> B[Build]\nB --> C[Validate]\nC --> D[Launch]" } as Partial<DiagramBlock> & { type: "diagram"; slot: string },
  ]),
  layout("detail", "Detail", "Structured detail slide with bullets, sub-points, or notes.", [
    slot("title", true, ["text"], 76, 54, 960, 68),
    slot("body", true, ["text", "table"], 96, 150, 740, 450),
    slot("aside", false, ["metric", "quote", "placeholder"], 900, 166, 270, 390),
  ], [
    { type: "text", slot: "title", textRole: "title", text: "Detailed analysis" } as Partial<TextBlock> & { type: "text"; slot: string },
    { type: "text", slot: "body", textRole: "body", text: "Primary point\nSupporting evidence\nOperational implication" } as Partial<TextBlock> & { type: "text"; slot: string },
    { type: "metric", slot: "aside", value: "1", label: "Key takeaway", description: "Use the aside for emphasis." } as Partial<MetricBlock> & { type: "metric"; slot: string },
  ]),
  layout("closing", "Closing", "Final call-to-action or decision slide.", [
    slot("title", true, ["text"], 96, 176, 770, 128),
    slot("subtitle", false, ["text"], 96, 326, 650, 88),
    slot("contact", false, ["text"], 96, 530, 500, 54),
  ], [
    { type: "text", slot: "title", textRole: "title", text: "Decision and next step" } as Partial<TextBlock> & { type: "text"; slot: string },
    { type: "text", slot: "subtitle", textRole: "subtitle", text: "Close with the action you want from the room." } as Partial<TextBlock> & { type: "text"; slot: string },
  ]),
];

function slot(id: string, required: boolean, supportedBlockTypes: BlockType[], x: number, y: number, width: number, height: number) {
  return { id, name: titleCase(id), required, supportedBlockTypes, defaultFrame: { x, y, width, height } };
}

function layout(
  id: string,
  name: string,
  purpose: string,
  slots: LayoutDefinition["slots"],
  defaultBlocks: LayoutDefinition["defaultBlocks"],
): LayoutDefinition {
  return {
    schemaVersion: SCHEMA_VERSION,
    id,
    name,
    purpose,
    slots,
    defaultBlocks,
    themeTokens: ["colors.bg", "colors.primary", "colors.text", "typography.display", "typography.body"],
    exportCompatibility: nativeAll,
  };
}

export class MicroKeynoteError extends Error {
  constructor(message: string, public details?: unknown) {
    super(message);
    this.name = "MicroKeynoteError";
  }
}

export class MicroKeynoteCore {
  readonly centralRoot: string;
  readonly appRoot: string;
  readonly workspaceRoot: string;
  readonly events = new EventEmitter();
  private readonly defaultPort: number;
  private readonly deckLocks = new Map<string, Promise<void>>();
  private layoutRegistryCache: LayoutDefinition[] = DEFAULT_LAYOUTS;
  private themeRegistryCache: ThemeDefinition[] = DEFAULT_THEMES;

  constructor(options: CoreOptions = {}) {
    this.centralRoot = path.resolve(options.centralRoot ?? defaultCentralRoot());
    this.appRoot = path.join(this.centralRoot, "app");
    this.workspaceRoot = path.join(this.centralRoot, "workspace");
    this.defaultPort = options.defaultPort ?? Number(process.env.MICRO_KEYNOTE_PORT ?? 3456);
  }

  async initialize(): Promise<void> {
    await ensureDir(this.workspaceRoot);
    await ensureDir(path.join(this.workspaceRoot, "global"));
    await ensureDir(path.join(this.workspaceRoot, "templates", "sources"));
    await ensureDir(this.templateLayoutRoot());
    await ensureDir(this.templateThemeRoot());
    await ensureDir(this.templateComponentRoot());
    await writeIfMissing(path.join(this.workspaceRoot, "global", "PRODUCT.md"), DEFAULT_GLOBAL_PRODUCT);
    await writeIfMissing(path.join(this.workspaceRoot, "global", "DESIGN.md"), DEFAULT_GLOBAL_DESIGN);
    await this.ensureClientRegistry();
    await this.seedTemplateRegistry();
    await this.refreshTemplateRegistry();

    const registry = await this.readClientRegistry();
    for (const client of registry.clients) {
      await this.ensureClientContext(client.id);
    }
  }

  async readClientRegistry(): Promise<ClientRegistry> {
    await this.ensureClientRegistry();
    const parsed = ClientRegistrySchema.safeParse(await readJson(path.join(this.workspaceRoot, "client.registry.json")));
    if (!parsed.success) {
      throw new MicroKeynoteError("client.registry.json is invalid.", parsed.error.flatten());
    }
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
    await ensureDir(path.join(clientRoot, "decks"));
    await writeIfMissing(path.join(clientRoot, "PRODUCT.md"), DEFAULT_CLIENT_PRODUCT);
    await writeIfMissing(path.join(clientRoot, "DESIGN.md"), DEFAULT_CLIENT_DESIGN);
    const indexPath = path.join(clientRoot, "deck.index.json");
    if (!(await exists(indexPath))) {
      await this.rebuildDeckIndex(clientId);
    }
    return clientRoot;
  }

  async readContext(clientId: string, deckId?: string) {
    await this.ensureClientContext(clientId);
    const globalProduct = await readText(path.join(this.workspaceRoot, "global", "PRODUCT.md"));
    const globalDesign = await readText(path.join(this.workspaceRoot, "global", "DESIGN.md"));
    const clientRoot = await this.resolveClientRoot(clientId);
    const clientProduct = await readText(path.join(clientRoot, "PRODUCT.md"));
    const clientDesign = await readText(path.join(clientRoot, "DESIGN.md"));
    const memory = deckId ? await readText(path.join(await this.deckRoot(clientId, deckId), "memory.md")).catch(() => "") : "";
    return {
      schemaVersion: SCHEMA_VERSION,
      clientId,
      deckId,
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

  async updateClientContext(input: {
    clientId: string;
    productMd?: string;
    designMd?: string;
    explicitUserIntent: boolean;
  }) {
    if (!input.explicitUserIntent) {
      throw new MicroKeynoteError("Client context updates require explicit user intent.");
    }
    const clientRoot = await this.ensureClientContext(input.clientId);
    if (input.productMd !== undefined) {
      await writeTextAtomic(path.join(clientRoot, "PRODUCT.md"), input.productMd);
    }
    if (input.designMd !== undefined) {
      await writeTextAtomic(path.join(clientRoot, "DESIGN.md"), input.designMd);
    }
    return this.readContext(input.clientId);
  }

  async updateDeckMemory(input: MutatingInput & { append?: string; replace?: string }) {
    return this.mutateDeck(input, async (deck, ctx) => {
      const memoryPath = path.join(await this.deckRoot(input.clientId, input.deckId), "memory.md");
      const current = await readText(memoryPath).catch(() => DEFAULT_MEMORY);
      const next = input.replace !== undefined
        ? input.replace
        : `${current.trim()}\n\n${input.append ?? ""}\n`;
      await writeTextAtomic(memoryPath, next);
      await this.writeContextSnapshot(deck);
      ctx.changedSlideIds.push(...deck.slides.map((slide) => slide.id));
      return deck;
    }, { staleMode: "warn", toolName: input.toolName ?? "update_deck_memory" });
  }

  async listDecks(clientId: string): Promise<DeckIndex> {
    await this.ensureClientContext(clientId);
    const clientRoot = await this.resolveClientRoot(clientId);
    const indexPath = path.join(clientRoot, "deck.index.json");
    const parsed = DeckIndexSchema.safeParse(await readJson(indexPath).catch(() => null));
    if (!parsed.success) {
      return this.rebuildDeckIndex(clientId);
    }
    return parsed.data;
  }

  async rebuildDeckIndex(clientId: string): Promise<DeckIndex> {
    assertSafeId(clientId, "clientId");
    const clientRoot = await this.resolveClientRoot(clientId);
    await ensureDir(path.join(clientRoot, "decks"));
    const deckDirs = await fs.readdir(path.join(clientRoot, "decks"), { withFileTypes: true }).catch(() => []);
    const decks: DeckIndex["decks"] = [];
    for (const entry of deckDirs) {
      if (!entry.isDirectory() || !ID_RE.test(entry.name)) continue;
      const deckDir = path.join(clientRoot, "decks", entry.name);
      const tsxPath = path.join(deckDir, "deck.tsx");
      const metaPath = path.join(deckDir, "deck.meta.json");
      try {
        const tsx = await fs.readFile(tsxPath, "utf8");
        const meta = JSON.parse(await fs.readFile(metaPath, "utf8")) as {
          id?: string;
          title?: string;
          themeId?: string;
          revision?: string;
          updatedAt?: string;
          slideCount?: number;
        };
        decks.push({
          id: meta.id ?? entry.name,
          title: meta.title ?? entry.name,
          themeId: meta.themeId ?? "soft-editorial",
          slideCount: meta.slideCount ?? countDeckSlides(tsx),
          revision: meta.revision ?? "0001",
          updatedAt: meta.updatedAt ?? new Date().toISOString(),
          path: `decks/${entry.name}/deck.tsx`,
        });
        continue;
      } catch {
        // fall through to legacy deck.json
      }
      const deckPath = path.join(deckDir, "deck.json");
      try {
        const deck = DeckSchema.parse(await readJson(deckPath));
        decks.push({
          id: deck.id,
          title: deck.title,
          themeId: deck.themeId,
          slideCount: deck.slides.length,
          revision: deck.revision,
          updatedAt: deck.updatedAt,
          path: `decks/${deck.id}/deck.json`,
        });
      } catch {
        // A corrupt deck should not make the whole library inaccessible.
      }
    }
    decks.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    const index: DeckIndex = { schemaVersion: SCHEMA_VERSION, clientId, generatedAt: DATE_STAMP(), decks };
    await writeJsonAtomic(path.join(clientRoot, "deck.index.json"), index);
    return index;
  }

  async createDeck(input: CreateDeckInput): Promise<MutationResult<Deck>> {
    await this.initialize();
    assertSafeId(input.clientId, "clientId");
    const title = input.title.trim() || "Untitled deck";
    const clientRoot = await this.ensureClientContext(input.clientId);
    const deckId = await uniqueDeckId(path.join(clientRoot, "decks"), slugify(title));
    const deckRoot = path.join(clientRoot, "decks", deckId);
    await this.ensureDeckDirs(deckRoot);

    const themeId = input.themeId ?? DEFAULT_REACT_THEME_ID;
    if (!THEME_REACT_PORTS[themeId]) {
      throw new Error(
        `Theme "${themeId}" has no React port. Available themes: ${Object.keys(THEME_REACT_PORTS).join(", ")}`,
      );
    }
    const now = DATE_STAMP();
    const tsx = reactDeckScaffold(themeId, title);
    const starterSlide = this.createSlideFromLayout(input.layoutId ?? "cover", title);
    const slideCount = countDeckSlides(tsx) || 1;
    const meta = {
      schemaVersion: SCHEMA_VERSION,
      id: deckId,
      clientId: input.clientId,
      title,
      themeId,
      revision: "0001",
      createdAt: now,
      updatedAt: now,
      slideCount,
    };

    const deckShell: Deck = {
      schemaVersion: SCHEMA_VERSION,
      id: deckId,
      clientId: input.clientId,
      title,
      themeId,
      revision: "0001",
      createdAt: now,
      updatedAt: now,
      slides: [starterSlide],
      assets: [],
      metadata: {
        productContextSource: "client",
        designContextSource: "client",
        importedTemplateIds: [themeId],
      },
    };

    await writeTextAtomic(path.join(deckRoot, "memory.md"), reactDeckMemory(themeId));
    await writeTextAtomic(path.join(deckRoot, "deck.tsx"), tsx);
    await writeJsonAtomic(path.join(deckRoot, "deck.json"), deckShell);
    await writeJsonAtomic(path.join(deckRoot, "deck.meta.json"), meta);
    await this.appendAiLog(input.clientId, deckId, {
      actor: "codex",
      tool: "create_deck",
      intent: input.intent ?? `Create deck "${title}"`,
      changed: [deckId],
      revisionBefore: "0000",
      revisionAfter: meta.revision,
    });
    await this.rebuildDeckIndex(input.clientId);
    const result = this.mutationResult(deckShell, "0000", meta.revision, [starterSlide.id], starterSlide.blocks.map((block) => block.id), [], deckShell);
    this.events.emit("deckChanged", { type: "deckChanged", clientId: input.clientId, deckId, result });
    return result;
  }

  async openDeck(input: DeckLocator) {
    const deck = await this.readDeck(input.clientId, input.deckId);
    return {
      schemaVersion: SCHEMA_VERSION,
      deck,
      context: await this.readContext(input.clientId, input.deckId),
      validationWarnings: this.validateDeck(deck),
      previewUrl: this.previewUrl(input.clientId, input.deckId),
    };
  }

  async duplicateDeck(input: MutatingInput & { title?: string }) {
    const source = await this.readDeck(input.clientId, input.deckId);
    const created = await this.createDeck({
      clientId: input.clientId,
      title: input.title ?? `${source.title} copy`,
      themeId: source.themeId,
      layoutId: source.slides[0]?.layoutId,
      intent: input.intent ?? `Duplicate deck ${source.id}`,
    });
    const newDeck = created.data!;
    return this.mutateDeck({ clientId: input.clientId, deckId: newDeck.id, intent: "Copy source deck content", toolName: input.toolName ?? "duplicate_deck" }, async (deck, ctx) => {
      deck.slides = source.slides.map((slide) => ({
        ...slide,
        id: createId("slide"),
        blocks: slide.blocks.map((block) => ({ ...block, id: createId("block") } as DeckBlock)),
      }));
      deck.assets = source.assets.map((asset) => ({ ...asset, usageRefs: [] }));
      ctx.changedSlideIds.push(...deck.slides.map((slide) => slide.id));
      ctx.changedBlockIds.push(...deck.slides.flatMap((slide) => slide.blocks.map((block) => block.id)));
      return deck;
    });
  }

  async deleteDeck(input: DeckLocator & { intent?: string }) {
    const deckRoot = await this.deckRoot(input.clientId, input.deckId);
    await assertInside(await this.resolveClientRoot(input.clientId), deckRoot);
    await fs.rm(deckRoot, { recursive: true, force: true });
    await this.rebuildDeckIndex(input.clientId);
    const result = this.mutationResult({ id: input.deckId }, "unknown", "deleted", [], [], [], { id: input.deckId });
    this.events.emit("deckDeleted", { type: "deckDeleted", clientId: input.clientId, deckId: input.deckId, result });
    return result;
  }

  async createSlide(input: MutatingInput & { layoutId?: string; title?: string; position?: number }) {
    return this.mutateDeck(input, async (deck, ctx) => {
      const slide = this.createSlideFromLayout(input.layoutId ?? "detail", input.title ?? "New slide");
      const position = clamp(Math.trunc(input.position ?? deck.slides.length), 0, deck.slides.length);
      deck.slides.splice(position, 0, slide);
      ctx.changedSlideIds.push(slide.id);
      ctx.changedBlockIds.push(...slide.blocks.map((block) => block.id));
      return deck;
    }, { toolName: input.toolName ?? "create_slide" });
  }

  async updateSlide(input: MutatingInput & { slideId: string; patch: Partial<Pick<Slide, "title" | "notes" | "background" | "layoutId">> }) {
    assertSafeId(input.slideId, "slideId");
    return this.mutateDeck(input, async (deck, ctx) => {
      const slide = findSlide(deck, input.slideId);
      Object.assign(slide, sanitizeSlidePatch(input.patch), { updatedAt: DATE_STAMP() });
      ctx.changedSlideIds.push(slide.id);
      return deck;
    }, { staleMode: "warn", toolName: input.toolName ?? "update_slide" });
  }

  async deleteSlide(input: MutatingInput & { slideId: string }) {
    assertSafeId(input.slideId, "slideId");
    return this.mutateDeck(input, async (deck, ctx) => {
      if (deck.slides.length <= 1) throw new MicroKeynoteError("A deck must contain at least one slide.");
      const idx = deck.slides.findIndex((slide) => slide.id === input.slideId);
      if (idx < 0) throw new MicroKeynoteError(`Slide not found: ${input.slideId}`);
      const [removed] = deck.slides.splice(idx, 1);
      ctx.changedSlideIds.push(input.slideId);
      ctx.changedBlockIds.push(...(removed?.blocks.map((block) => block.id) ?? []));
      return deck;
    }, { toolName: input.toolName ?? "delete_slide" });
  }

  async reorderSlides(input: MutatingInput & { slideIds: string[] }) {
    return this.mutateDeck(input, async (deck, ctx) => {
      const ids = new Set(input.slideIds);
      if (ids.size !== deck.slides.length || deck.slides.some((slide) => !ids.has(slide.id))) {
        throw new MicroKeynoteError("reorder_slides must include every current slide exactly once.");
      }
      deck.slides = input.slideIds.map((id) => findSlide(deck, id));
      ctx.changedSlideIds.push(...input.slideIds);
      return deck;
    }, { toolName: input.toolName ?? "reorder_slides" });
  }

  async addBlock(input: MutatingInput & { slideId: string; block: Partial<DeckBlock> & { type: BlockType } }) {
    return this.mutateDeck(input, async (deck, ctx) => {
      const slide = findSlide(deck, input.slideId);
      const block = this.createBlock(input.block.type, input.block);
      slide.blocks.push(block);
      slide.updatedAt = DATE_STAMP();
      ctx.changedSlideIds.push(slide.id);
      ctx.changedBlockIds.push(block.id);
      return deck;
    }, { staleMode: "warn", toolName: input.toolName ?? "add_block" });
  }

  async updateBlock(input: MutatingInput & { slideId: string; blockId: string; patch: Partial<DeckBlock> }) {
    return this.mutateDeck(input, async (deck, ctx) => {
      const slide = findSlide(deck, input.slideId);
      const block = findBlock(slide, input.blockId);
      const patch = sanitizeBlockPatch(input.patch);
      Object.assign(block, patch, { updatedAt: DATE_STAMP() });
      if (patch.type && patch.type !== block.type) {
        throw new MicroKeynoteError("Changing block type is not supported by update_block; delete and add a new block.");
      }
      slide.updatedAt = DATE_STAMP();
      ctx.changedSlideIds.push(slide.id);
      ctx.changedBlockIds.push(block.id);
      return deck;
    }, { staleMode: "warn", toolName: input.toolName ?? "update_block" });
  }

  async deleteBlock(input: MutatingInput & { slideId: string; blockId: string }) {
    return this.mutateDeck(input, async (deck, ctx) => {
      const slide = findSlide(deck, input.slideId);
      const idx = slide.blocks.findIndex((block) => block.id === input.blockId);
      if (idx < 0) throw new MicroKeynoteError(`Block not found: ${input.blockId}`);
      slide.blocks.splice(idx, 1);
      slide.updatedAt = DATE_STAMP();
      ctx.changedSlideIds.push(slide.id);
      ctx.changedBlockIds.push(input.blockId);
      return deck;
    }, { toolName: input.toolName ?? "delete_block" });
  }

  async moveBlock(input: MutatingInput & { slideId: string; blockId: string; x: number; y: number }) {
    return this.updateBlock({
      ...input,
      toolName: input.toolName ?? "move_block",
      patch: {
        frame: {
          ...findBlock(findSlide(await this.readDeck(input.clientId, input.deckId), input.slideId), input.blockId).frame,
          x: snap(input.x),
          y: snap(input.y),
        },
      } as Partial<DeckBlock>,
    });
  }

  async resizeBlock(input: MutatingInput & { slideId: string; blockId: string; width: number; height: number }) {
    return this.updateBlock({
      ...input,
      toolName: input.toolName ?? "resize_block",
      patch: {
        frame: {
          ...findBlock(findSlide(await this.readDeck(input.clientId, input.deckId), input.slideId), input.blockId).frame,
          width: Math.max(24, snap(input.width)),
          height: Math.max(24, snap(input.height)),
        },
      } as Partial<DeckBlock>,
    });
  }

  async setTheme(input: MutatingInput & { themeId: string }) {
    assertSafeId(input.themeId, "themeId");
    return this.mutateDeck(input, async (deck, ctx) => {
      const themes = await this.listThemes();
      if (!themes.some((theme) => theme.id === input.themeId)) {
        throw new MicroKeynoteError(`Unknown theme: ${input.themeId}`);
      }
      deck.themeId = input.themeId;
      deck.metadata.importedTemplateIds = Array.from(new Set([...deck.metadata.importedTemplateIds, input.themeId]));
      ctx.changedSlideIds.push(...deck.slides.map((slide) => slide.id));
      return deck;
    }, { staleMode: "warn", toolName: input.toolName ?? "set_theme" });
  }

  async listAssets(input: DeckLocator) {
    const deck = await this.readDeck(input.clientId, input.deckId);
    return deck.assets;
  }

  async addAsset(input: MutatingInput & {
    fileName?: string;
    mimeType?: string;
    dataBase64?: string;
    kind?: AssetMetadata["kind"];
    altText?: string;
    prompt?: string;
  }) {
    return this.mutateDeck(input, async (deck) => {
      const deckRoot = await this.deckRoot(input.clientId, input.deckId);
      const id = createId("asset");
      const now = DATE_STAMP();
      const kind = input.kind ?? (input.dataBase64 ? "upload" : "placeholder");
      const fileName = sanitizeFileName(input.fileName ?? `${id}.txt`);
      const folder = kind === "generated" ? "generated" : kind === "placeholder" ? "placeholders" : "uploads";
      const relPath = `assets/${folder}/${id}-${fileName}`;
      const absPath = path.join(deckRoot, relPath);
      let checksum: string | undefined;
      if (input.dataBase64) {
        const buffer = Buffer.from(stripBase64Prefix(input.dataBase64), "base64");
        const data = input.mimeType?.includes("svg") || fileName.toLowerCase().endsWith(".svg")
          ? Buffer.from(sanitizeSvg(buffer.toString("utf8")), "utf8")
          : buffer;
        checksum = checksumBuffer(data);
        await writeFileAtomic(absPath, data);
      } else {
        await writeTextAtomic(absPath, input.prompt ? `Image placeholder prompt:\n${input.prompt}\n` : "Image placeholder\n");
      }
      const asset: AssetMetadata = {
        schemaVersion: SCHEMA_VERSION,
        id,
        kind,
        source: kind,
        prompt: input.prompt,
        altText: input.altText,
        localPath: relPath,
        checksum,
        mimeType: input.mimeType,
        createdAt: now,
        usageRefs: [],
      };
      deck.assets.push(asset);
      return deck;
    }, { staleMode: "warn", toolName: input.toolName ?? "add_asset" });
  }

  async replaceAsset(input: MutatingInput & { assetId: string; fileName?: string; mimeType?: string; dataBase64: string; altText?: string }) {
    return this.mutateDeck(input, async (deck, ctx) => {
      const asset = deck.assets.find((item) => item.id === input.assetId);
      if (!asset) throw new MicroKeynoteError(`Asset not found: ${input.assetId}`);
      const deckRoot = await this.deckRoot(input.clientId, input.deckId);
      const fileName = sanitizeFileName(input.fileName ?? path.basename(asset.localPath));
      const relPath = `assets/uploads/${asset.id}-${fileName}`;
      const buffer = Buffer.from(stripBase64Prefix(input.dataBase64), "base64");
      const data = input.mimeType?.includes("svg") || fileName.toLowerCase().endsWith(".svg")
        ? Buffer.from(sanitizeSvg(buffer.toString("utf8")), "utf8")
        : buffer;
      await writeFileAtomic(path.join(deckRoot, relPath), data);
      asset.localPath = relPath;
      asset.mimeType = input.mimeType;
      asset.altText = input.altText ?? asset.altText;
      asset.checksum = checksumBuffer(data);
      asset.kind = "upload";
      asset.source = "upload";
      ctx.changedSlideIds.push(...deck.slides.filter((slide) => slide.blocks.some((block) => block.type === "image" && block.assetId === asset.id)).map((slide) => slide.id));
      return deck;
    }, { staleMode: "warn", toolName: input.toolName ?? "replace_asset" });
  }

  async deleteAsset(input: MutatingInput & { assetId: string }) {
    return this.mutateDeck(input, async (deck) => {
      const idx = deck.assets.findIndex((asset) => asset.id === input.assetId);
      if (idx < 0) throw new MicroKeynoteError(`Asset not found: ${input.assetId}`);
      const [asset] = deck.assets.splice(idx, 1);
      if (asset) {
        const deckRoot = await this.deckRoot(input.clientId, input.deckId);
        await fs.rm(path.join(deckRoot, asset.localPath), { force: true });
      }
      return deck;
    }, { toolName: input.toolName ?? "delete_asset" });
  }

  async listLayouts(): Promise<LayoutDefinition[]> {
    await this.seedTemplateRegistry();
    return this.refreshLayoutRegistry();
  }

  async listThemes(): Promise<ThemeDefinition[]> {
    await this.seedTemplateRegistry();
    return this.refreshThemeRegistry();
  }

  async readDeck(clientId: string, deckId: string): Promise<Deck> {
    assertSafeId(clientId, "clientId");
    assertSafeId(deckId, "deckId");
    await this.ensureClientContext(clientId);
    const deck = DeckSchema.parse(await readJson(path.join(await this.deckRoot(clientId, deckId), "deck.json")));
    return deck;
  }

  async writeDeckForExport(clientId: string, deckId: string, fileName: string, contents: string | Buffer) {
    const deckRoot = await this.deckRoot(clientId, deckId);
    const safe = sanitizeFileName(fileName);
    const exportPath = path.join(deckRoot, "exports", safe);
    await assertInside(path.join(deckRoot, "exports"), exportPath);
    await writeFileAtomic(exportPath, typeof contents === "string" ? Buffer.from(contents, "utf8") : contents);
    return exportPath;
  }

  async exportDir(clientId: string, deckId: string) {
    const dir = path.join(await this.deckRoot(clientId, deckId), "exports");
    await ensureDir(dir);
    return dir;
  }

  validateDeck(deck: Deck): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];
    const themeIds = new Set(this.themeRegistryCache.map((theme) => theme.id));
    const layoutIds = new Set(this.layoutRegistryCache.map((layoutDef) => layoutDef.id));
    if (!themeIds.has(deck.themeId)) {
      warnings.push(warn("missing-theme", "error", "deck.themeId", `Theme not found: ${deck.themeId}`));
    }
    for (const slide of deck.slides) {
      if (!layoutIds.has(slide.layoutId)) {
        warnings.push(warn("missing-layout", "error", `slides.${slide.id}.layoutId`, `Layout not found: ${slide.layoutId}`));
      }
      for (const block of slide.blocks) {
        if (!FrameSchema.safeParse(block.frame).success) {
          warnings.push(warn("invalid-frame", "error", `slides.${slide.id}.blocks.${block.id}.frame`, "Block frame is invalid."));
        }
        if (block.type === "image" && block.assetId && !deck.assets.some((asset) => asset.id === block.assetId)) {
          warnings.push(warn("missing-asset", "error", `slides.${slide.id}.blocks.${block.id}.assetId`, `Asset not found: ${block.assetId}`));
        }
        if (block.type === "chart" && block.data.length === 0) {
          warnings.push(warn("empty-chart", "warning", `slides.${slide.id}.blocks.${block.id}.data`, "Chart has no data."));
        }
        if (block.type === "diagram" && !block.source.trim()) {
          warnings.push(warn("empty-diagram", "warning", `slides.${slide.id}.blocks.${block.id}.source`, "Diagram source is empty."));
        }
        if (block.type === "text" && block.text.length > Math.max(400, block.frame.width * block.frame.height / 260)) {
          warnings.push(warn("possible-overflow", "warning", `slides.${slide.id}.blocks.${block.id}.text`, "Text may overflow the block frame."));
        }
        if (block.exportCompatibility.pptx === "unsupported") {
          warnings.push(warn("pptx-unsupported", "warning", `slides.${slide.id}.blocks.${block.id}`, `${block.type} is not supported for PPTX export.`));
        }
      }
    }
    for (const asset of deck.assets) {
      if (path.isAbsolute(asset.localPath) || asset.localPath.includes("..")) {
        warnings.push(warn("unsafe-asset-path", "error", `assets.${asset.id}.localPath`, "Asset path must be relative and stay inside the deck folder."));
      }
      if (/^https?:\/\//i.test(asset.localPath)) {
        warnings.push(warn("remote-asset", "warning", `assets.${asset.id}.localPath`, "Remote asset URL requires explicit review."));
      }
      if (asset.mimeType?.includes("svg")) {
        warnings.push(warn("svg-asset", "info", `assets.${asset.id}.mimeType`, "SVG asset was sanitized on upload; rasterize if export fidelity is poor."));
      }
    }
    return warnings;
  }

  previewUrl(clientId: string, deckId: string) {
    return `http://localhost:${this.defaultPort}/editor?clientId=${encodeURIComponent(clientId)}&deckId=${encodeURIComponent(deckId)}`;
  }

  async deckRoot(clientId: string, deckId: string): Promise<string> {
    assertSafeId(deckId, "deckId");
    const clientRoot = await this.resolveClientRoot(clientId);
    const deckRoot = path.resolve(clientRoot, "decks", deckId);
    await assertInside(clientRoot, deckRoot);
    return deckRoot;
  }

  async resolveClientRoot(clientId: string): Promise<string> {
    assertSafeId(clientId, "clientId");
    const registry = await this.readClientRegistryFileOnly();
    const client = registry.clients.find((item) => item.id === clientId);
    if (!client) throw new MicroKeynoteError(`Client is not registered: ${clientId}`);
    const root = path.resolve(this.centralRoot, client.root);
    const repoRoot = path.resolve(this.centralRoot, "../../..");
    await assertInside(repoRoot, root);
    const realRepoRoot = await fs.realpath(repoRoot).catch(() => repoRoot);
    const normalizedRoot = path.resolve(realRepoRoot, path.relative(repoRoot, root));
    const realRoot = await fs.realpath(root).catch(() => normalizedRoot);
    const realAppRoot = await fs.realpath(this.appRoot).catch(() => this.appRoot);
    await assertInside(realRepoRoot, realRoot);
    if (realRoot === realAppRoot || realRoot.startsWith(`${realAppRoot}${path.sep}`)) {
      throw new MicroKeynoteError("Client roots may not point inside application source.");
    }
    return normalizedRoot;
  }

  private async readClientRegistryFileOnly(): Promise<ClientRegistry> {
    const registryPath = path.join(this.workspaceRoot, "client.registry.json");
    if (!(await exists(registryPath))) {
      return {
        schemaVersion: SCHEMA_VERSION,
        clients: [{ id: "tapwise", name: "Tapwise", root: "../../../projects/tapwise/tools/qraftPptx" }],
      };
    }
    return ClientRegistrySchema.parse(await readJson(registryPath));
  }

  private async ensureClientRegistry() {
    const registryPath = path.join(this.workspaceRoot, "client.registry.json");
    if (!(await exists(registryPath))) {
      await writeJsonAtomic(registryPath, {
        schemaVersion: SCHEMA_VERSION,
        clients: [{ id: "tapwise", name: "Tapwise", root: "../../../projects/tapwise/tools/qraftPptx" }],
      } satisfies ClientRegistry);
    }
  }

  private async seedTemplateRegistry() {
    await ensureDir(this.templateLayoutRoot());
    await ensureDir(this.templateThemeRoot());
    await ensureDir(this.templateComponentRoot());
    for (const theme of DEFAULT_THEMES) {
      await writeJsonIfMissing(path.join(this.templateThemeRoot(), `${theme.id}.json`), theme);
    }
    for (const item of DEFAULT_LAYOUTS) {
      await writeJsonIfMissing(path.join(this.templateLayoutRoot(), `${item.id}.json`), item);
    }
    const manifest: TemplateManifest = {
      schemaVersion: SCHEMA_VERSION,
      generatedAt: DATE_STAMP(),
      sources: ["soft-editorial"],
      themes: DEFAULT_THEMES.map((theme) => theme.id),
      layouts: DEFAULT_LAYOUTS.map((item) => item.id),
      components: [],
    };
    await writeJsonIfMissing(path.join(this.workspaceRoot, "templates", "registry", "manifest.json"), manifest);
  }

  private templateLayoutRoot() {
    return path.join(this.workspaceRoot, "templates", "registry", "layouts");
  }

  private templateThemeRoot() {
    return path.join(this.workspaceRoot, "templates", "registry", "themes");
  }

  private templateComponentRoot() {
    return path.join(this.workspaceRoot, "templates", "registry", "components");
  }

  private createSlideFromLayout(layoutId: string, title: string): Slide {
    assertSafeId(layoutId, "layoutId");
    const layoutDef = this.layoutRegistryCache.find((item) => item.id === layoutId) ?? this.layoutRegistryCache[0] ?? DEFAULT_LAYOUTS[0]!;
    const now = DATE_STAMP();
    const blocks = layoutDef.defaultBlocks.map((block) => {
      const slotDef = layoutDef.slots.find((item) => item.id === block.slot);
      const next = this.createBlock(block.type, {
        ...block,
        frame: block.frame ?? slotDef?.defaultFrame,
      });
      if (next.type === "text" && next.textRole === "title" && next.text === "Untitled presentation") {
        next.text = title;
      }
      return next;
    });
    return {
      id: createId("slide"),
      layoutId: layoutDef.id,
      title,
      blocks,
      createdAt: now,
      updatedAt: now,
    };
  }

  private createBlock(type: BlockType, partial: Partial<DeckBlock>): DeckBlock {
    if ((type as string) === "raw-html") {
      throw new MicroKeynoteError("raw-html blocks are disabled in normal mode.");
    }
    const now = DATE_STAMP();
    const base = {
      id: partial.id && ID_RE.test(partial.id) ? partial.id : createId("block"),
      slot: partial.slot,
      frame: normalizeFrame(partial.frame),
      style: partial.style ?? {},
      exportCompatibility: partial.exportCompatibility ?? defaultExportCompatibility(type),
      createdAt: partial.createdAt ?? now,
      updatedAt: now,
    };
    switch (type) {
      case "text":
        return { ...base, type, text: (partial as Partial<TextBlock>).text ?? "Text", richText: (partial as Partial<TextBlock>).richText, textRole: (partial as Partial<TextBlock>).textRole ?? "body" };
      case "image":
        return { ...base, type, assetId: (partial as Partial<ImageBlock>).assetId, altText: (partial as Partial<ImageBlock>).altText, fit: (partial as Partial<ImageBlock>).fit ?? "cover", prompt: (partial as Partial<ImageBlock>).prompt };
      case "chart":
        return { ...base, type, chartType: (partial as Partial<ChartBlock>).chartType ?? "bar", title: (partial as Partial<ChartBlock>).title, data: (partial as Partial<ChartBlock>).data ?? [], encoding: (partial as Partial<ChartBlock>).encoding, sourceData: (partial as Partial<ChartBlock>).sourceData };
      case "diagram":
        return { ...base, type, diagramType: "mermaid", source: (partial as Partial<DiagramBlock>).source ?? "flowchart LR\nA[Start] --> B[Next]" };
      case "shape":
        return { ...base, type, shape: (partial as Partial<ShapeBlock>).shape ?? "rect", text: (partial as Partial<ShapeBlock>).text };
      case "table":
        return { ...base, type, columns: (partial as Partial<TableBlock>).columns ?? ["Column"], rows: (partial as Partial<TableBlock>).rows ?? [] };
      case "metric":
        return { ...base, type, value: (partial as Partial<MetricBlock>).value ?? "0", label: (partial as Partial<MetricBlock>).label ?? "Metric", description: (partial as Partial<MetricBlock>).description };
      case "quote":
        return { ...base, type, quote: (partial as Partial<QuoteBlock>).quote ?? "Quote", attribution: (partial as Partial<QuoteBlock>).attribution };
      case "group":
        return { ...base, type, childIds: (partial as Partial<GroupBlock>).childIds ?? [] };
      case "placeholder":
        return { ...base, type, label: (partial as Partial<PlaceholderBlock>).label ?? "Placeholder", prompt: (partial as Partial<PlaceholderBlock>).prompt, intendedType: (partial as Partial<PlaceholderBlock>).intendedType };
      default:
        throw new MicroKeynoteError(`Unsupported block type: ${String(type)}`);
    }
  }

  private async mutateDeck<T = Deck>(
    input: MutatingInput,
    apply: (deck: Deck, ctx: { changedSlideIds: string[]; changedBlockIds: string[] }) => Promise<T | Deck> | T | Deck,
    options: { staleMode?: "reject" | "warn"; toolName?: string } = {},
  ): Promise<MutationResult<T | Deck>> {
    const lockKey = `${input.clientId}:${input.deckId}`;
    return this.withDeckLock(lockKey, async () => {
      const deck = await this.readDeck(input.clientId, input.deckId);
      const staleWarnings: ValidationWarning[] = [];
      if (input.expectedRevision && input.expectedRevision !== deck.revision) {
        const warning = warn("stale-revision", options.staleMode === "warn" ? "warning" : "error", "deck.revision", `Expected revision ${input.expectedRevision}, current revision is ${deck.revision}.`);
        if (options.staleMode === "warn") staleWarnings.push(warning);
        else throw new MicroKeynoteError(warning.message, warning);
      }

      const revisionBefore = deck.revision;
      await this.writeRevision(input.clientId, deck.id, revisionBefore, deck);
      const ctx = { changedSlideIds: [] as string[], changedBlockIds: [] as string[] };
      const applyResult = await apply(deck, ctx);
      deck.revision = nextRevision(revisionBefore);
      deck.updatedAt = DATE_STAMP();
      for (const slide of deck.slides) {
        if (ctx.changedSlideIds.includes(slide.id)) slide.updatedAt = DATE_STAMP();
      }
      DeckSchema.parse(deck);
      await writeJsonAtomic(path.join(await this.deckRoot(input.clientId, input.deckId), "deck.json"), deck);
      await this.writeContextSnapshot(deck);
      await this.writeRevision(input.clientId, deck.id, deck.revision, deck);
      const warnings = [...staleWarnings, ...this.validateDeck(deck)];
      await this.appendAiLog(input.clientId, deck.id, {
        actor: "codex",
        tool: input.toolName ?? options.toolName ?? "mutation",
        intent: input.intent ?? "Deck mutation",
        changed: [...ctx.changedSlideIds, ...ctx.changedBlockIds],
        revisionBefore,
        revisionAfter: deck.revision,
      });
      await this.rebuildDeckIndex(input.clientId);
      const result = this.mutationResult(deck, revisionBefore, deck.revision, unique(ctx.changedSlideIds), unique(ctx.changedBlockIds), warnings, applyResult);
      this.events.emit("deckChanged", { type: "deckChanged", clientId: input.clientId, deckId: input.deckId, result });
      return result;
    });
  }

  private mutationResult<T>(deckLike: Deck | unknown, revisionBefore: string, revisionAfter: string, changedSlideIds: string[], changedBlockIds: string[], validationWarnings: ValidationWarning[], data: T): MutationResult<T> {
    const deck = isDeck(deckLike) ? deckLike : undefined;
    const clientId = deck?.clientId ?? "";
    const deckId = deck?.id ?? "";
    return {
      changedSlideIds,
      changedBlockIds,
      validationWarnings,
      revisionBefore,
      revisionAfter,
      previewUrl: clientId && deckId ? this.previewUrl(clientId, deckId) : "",
      eventId: createId("event"),
      data,
    };
  }

  private async writeContextSnapshot(deck: Deck) {
    const context = await this.readContext(deck.clientId, deck.id);
    const snapshot: ContextSnapshot = {
      schemaVersion: SCHEMA_VERSION,
      clientId: deck.clientId,
      deckId: deck.id,
      generatedAt: DATE_STAMP(),
      product: context.product,
      design: context.design,
      memory: context.memory,
    };
    await writeJsonAtomic(path.join(await this.deckRoot(deck.clientId, deck.id), "context.snapshot.json"), snapshot);
  }

  private async appendAiLog(clientId: string, deckId: string, entry: {
    actor: "codex" | "ui" | "system";
    tool: string;
    intent: string;
    changed: string[];
    revisionBefore: string;
    revisionAfter: string;
  }) {
    const deckRoot = await this.deckRoot(clientId, deckId);
    const payload = {
      timestamp: DATE_STAMP(),
      ...entry,
    };
    await fs.appendFile(path.join(deckRoot, "ai-log.jsonl"), `${JSON.stringify(payload)}\n`, "utf8");
    await fs.appendFile(
      path.join(deckRoot, "ai-log.md"),
      `\n## ${payload.timestamp} · ${entry.tool}\n\n- Actor: ${entry.actor}\n- Intent: ${entry.intent}\n- Revision: ${entry.revisionBefore} -> ${entry.revisionAfter}\n- Changed: ${entry.changed.join(", ") || "none"}\n`,
      "utf8",
    );
  }

  private async writeRevision(clientId: string, deckId: string, revision: string, deck: Deck) {
    const deckRoot = await this.deckRoot(clientId, deckId);
    const revisionPath = path.join(deckRoot, "revisions", `${revision}.json`);
    if (!(await exists(revisionPath))) {
      await writeJsonAtomic(revisionPath, deck);
    }
  }

  private async ensureDeckDirs(deckRoot: string) {
    await ensureDir(deckRoot);
    await ensureDir(path.join(deckRoot, "revisions"));
    await ensureDir(path.join(deckRoot, "assets", "uploads"));
    await ensureDir(path.join(deckRoot, "assets", "generated"));
    await ensureDir(path.join(deckRoot, "assets", "placeholders"));
    await ensureDir(path.join(deckRoot, "assets", "thumbnails"));
    await ensureDir(path.join(deckRoot, "exports"));
  }

  private async withDeckLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const previous = this.deckLocks.get(key) ?? Promise.resolve();
    let release!: () => void;
    const next = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.deckLocks.set(key, previous.then(() => next, () => next));
    await previous.catch(() => undefined);
    try {
      return await fn();
    } finally {
      release();
      if (this.deckLocks.get(key) === next) this.deckLocks.delete(key);
    }
  }

  private async refreshTemplateRegistry() {
    await Promise.all([this.refreshLayoutRegistry(), this.refreshThemeRegistry()]);
  }

  private async refreshLayoutRegistry(): Promise<LayoutDefinition[]> {
    const files = await fs.readdir(this.templateLayoutRoot()).catch(() => []);
    const layouts = await Promise.all(files.filter((file) => file.endsWith(".json")).map(async (file) => readJson(path.join(this.templateLayoutRoot(), file)) as Promise<LayoutDefinition>));
    this.layoutRegistryCache = layouts.length ? layouts : DEFAULT_LAYOUTS;
    return this.layoutRegistryCache;
  }

  private async refreshThemeRegistry(): Promise<ThemeDefinition[]> {
    const files = await fs.readdir(this.templateThemeRoot()).catch(() => []);
    const themes = await Promise.all(files.filter((file) => file.endsWith(".json")).map(async (file) => readJson(path.join(this.templateThemeRoot(), file)) as Promise<ThemeDefinition>));
    this.themeRegistryCache = themes.length ? themes : DEFAULT_THEMES;
    return this.themeRegistryCache;
  }
}

function defaultCentralRoot() {
  const file = fileURLToPath(import.meta.url);
  const dir = path.dirname(file);
  const packageRoot = ["dist", "src"].includes(path.basename(dir)) ? path.dirname(dir) : dir;
  return path.resolve(packageRoot, "../../..");
}

function defaultExportCompatibility(type: BlockType): ExportCompatibility {
  if (type === "chart" || type === "diagram") return { html: "native", pdf: "native", pptx: "image-fallback" };
  return nativeAll;
}

function assertSafeId(value: string, label: string) {
  if (!ID_RE.test(value)) throw new MicroKeynoteError(`${label} contains unsupported characters.`);
}

async function assertInside(parent: string, child: string) {
  const relative = path.relative(path.resolve(parent), path.resolve(child));
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new MicroKeynoteError(`Path escapes allowed root: ${child}`);
  }
}

function normalizeFrame(frame?: Partial<Frame>): Frame {
  return {
    x: snap(Number(frame?.x ?? 96)),
    y: snap(Number(frame?.y ?? 96)),
    width: Math.max(24, snap(Number(frame?.width ?? 420))),
    height: Math.max(24, snap(Number(frame?.height ?? 160))),
  };
}

function snap(value: number) {
  return Math.round(value / 8) * 8;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function sanitizeSlidePatch(patch: Partial<Pick<Slide, "title" | "notes" | "background" | "layoutId">>) {
  const allowed: Partial<Pick<Slide, "title" | "notes" | "background" | "layoutId">> = {};
  if (patch.title !== undefined) allowed.title = String(patch.title);
  if (patch.notes !== undefined) allowed.notes = String(patch.notes);
  if (patch.background !== undefined) allowed.background = String(patch.background);
  if (patch.layoutId !== undefined) {
    assertSafeId(String(patch.layoutId), "layoutId");
    allowed.layoutId = String(patch.layoutId);
  }
  return allowed;
}

function sanitizeBlockPatch(patch: Partial<DeckBlock>) {
  if ((patch.type as string | undefined) === "raw-html") {
    throw new MicroKeynoteError("raw-html blocks are disabled in normal mode.");
  }
  const next = { ...patch };
  if (next.id !== undefined) delete next.id;
  if (next.createdAt !== undefined) delete next.createdAt;
  if (next.frame) next.frame = normalizeFrame(next.frame);
  return next;
}

function findSlide(deck: Deck, slideId: string): Slide {
  assertSafeId(slideId, "slideId");
  const slide = deck.slides.find((item) => item.id === slideId);
  if (!slide) throw new MicroKeynoteError(`Slide not found: ${slideId}`);
  return slide;
}

function findBlock(slide: Slide, blockId: string): DeckBlock {
  assertSafeId(blockId, "blockId");
  const block = slide.blocks.find((item) => item.id === blockId);
  if (!block) throw new MicroKeynoteError(`Block not found: ${blockId}`);
  return block;
}

function createId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function slugify(value: string) {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 50);
  return slug || "deck";
}

async function uniqueDeckId(decksRoot: string, base: string) {
  for (let i = 0; i < 1000; i += 1) {
    const candidate = i === 0 ? `${base}-${randomUUID().slice(0, 6)}` : `${base}-${i}-${randomUUID().slice(0, 4)}`;
    if (!(await exists(path.join(decksRoot, candidate)))) return candidate;
  }
  throw new MicroKeynoteError("Could not allocate deck id.");
}

function nextRevision(revision: string) {
  return String(Number(revision || "0") + 1).padStart(4, "0");
}

function titleCase(value: string) {
  return value.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

function warn(id: string, severity: ValidationSeverity, warningPath: string, message: string): ValidationWarning {
  return { id, severity, path: warningPath, message };
}

function isDeck(value: unknown): value is Deck {
  return typeof value === "object" && value !== null && "slides" in value && "revision" in value;
}

async function exists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

async function readJson(filePath: string) {
  return JSON.parse(await fs.readFile(filePath, "utf8")) as unknown;
}

async function readText(filePath: string) {
  return fs.readFile(filePath, "utf8");
}

async function writeIfMissing(filePath: string, contents: string) {
  if (!(await exists(filePath))) await writeTextAtomic(filePath, contents);
}

async function writeJsonIfMissing(filePath: string, value: unknown) {
  if (!(await exists(filePath))) await writeJsonAtomic(filePath, value);
}

async function writeJsonAtomic(filePath: string, value: unknown) {
  await writeTextAtomic(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

async function writeTextAtomic(filePath: string, contents: string) {
  await writeFileAtomic(filePath, Buffer.from(contents, "utf8"));
}

async function writeFileAtomic(filePath: string, contents: Buffer) {
  await ensureDir(path.dirname(filePath));
  const tmp = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  await fs.writeFile(tmp, contents);
  await fs.rename(tmp, filePath);
}

function checksumBuffer(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function sanitizeFileName(fileName: string) {
  const base = path.basename(fileName).replace(/^\.+/, "").trim();
  if (!base || !FILE_RE.test(base) || base.includes("..")) return "asset.bin";
  return base;
}

function stripBase64Prefix(value: string) {
  return value.replace(/^data:[^;]+;base64,/, "");
}

function sanitizeSvg(svg: string) {
  return svg
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
}
