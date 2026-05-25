import type {
  AssetMetadata,
  BlockType,
  ChartBlock,
  Deck,
  DeckBlock,
  ExportCompatibility,
  ExportSupport,
  Frame,
  LayoutDefinition,
  Slide,
  TableBlock,
  ThemeDefinition,
  ValidationWarning,
} from "@micro-keynote/core";

export const RENDERER_VERSION = 1;
export const SLIDE_WIDTH = 1280;
export const SLIDE_HEIGHT = 720;

export interface RenderOptions {
  assetBasePath?: string;
  themes?: ThemeDefinition[];
  layouts?: LayoutDefinition[];
  mode?: "preview" | "export" | "thumbnail";
}

export interface RenderScene {
  schemaVersion: number;
  rendererVersion: number;
  deckId: string;
  deckRevision: string;
  title: string;
  width: number;
  height: number;
  theme: ResolvedTheme;
  slides: RenderSlide[];
  warnings: ValidationWarning[];
}

export interface ResolvedTheme {
  id: string;
  name: string;
  colors: Record<string, string>;
  typography: Record<string, string>;
  spacing: Record<string, string | number>;
  decorCss?: string;
  fontImports?: string[];
}

export interface RenderSlide {
  id: string;
  title: string;
  layoutId: string;
  background: string;
  blocks: RenderBlock[];
  exportCompatibility: ExportCompatibility;
  wrapperClass?: string;
}

export interface RenderBlock {
  id: string;
  type: BlockType;
  source: DeckBlock;
  slot?: string;
  frame: Frame;
  className: string;
  style: ComputedBlockStyle;
  html: string;
  textContent: string;
  asset?: AssetMetadata;
  exportCompatibility: ExportCompatibility;
  pptxSupport: ExportSupport;
}

export interface ComputedBlockStyle {
  left: number;
  top: number;
  width: number;
  height: number;
  zIndex: number;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  fontWeight: number;
  color: string;
  background?: string;
  borderColor?: string;
  borderRadius: number;
  opacity?: number;
  objectFit?: "cover" | "contain" | "fill";
  raw: Record<string, string | number>;
}

const fallbackTheme: ResolvedTheme = {
  id: "fallback",
  name: "Fallback",
  colors: {
    bg: "#fdfae7",
    primary: "#1e2bfa",
    secondary: "#1e2bfa",
    accent: "#1e2bfa",
    text: "#111111",
    muted: "#6b6b6b",
    card: "rgba(30, 43, 250, 0.04)",
    border: "rgba(30, 43, 250, 0.2)",
  },
  typography: {
    display: "Space Grotesk, Inter, Arial, sans-serif",
    body: "Inter, Arial, sans-serif",
    mono: "IBM Plex Mono, ui-monospace, monospace",
  },
  spacing: {
    slidePadding: 52,
    grid: 8,
    radius: 12,
  },
};

export function resolveDeckRenderScene(deck: Deck, options: RenderOptions = {}): RenderScene {
  const theme = resolveTheme(deck.themeId, options.themes);
  const layoutIds = new Set((options.layouts ?? []).map((layout) => layout.id));
  const warnings: ValidationWarning[] = [];
  const assetBase = options.assetBasePath ?? ".";
  const slides = deck.slides.map((slide) => {
    if (layoutIds.size > 0 && !layoutIds.has(slide.layoutId)) {
      warnings.push(warn("missing-layout", "error", `slides.${slide.id}.layoutId`, `Layout not found: ${slide.layoutId}`));
    }
    const layout = options.layouts?.find((item) => item.id === slide.layoutId);
    const blocks = slide.blocks.map((block, index) => resolveBlock(deck, block, theme, assetBase, index, warnings, slide));
    return {
      id: slide.id,
      title: slide.title,
      layoutId: slide.layoutId,
      background: slide.background || theme.colors.bg || fallbackTheme.colors.bg,
      blocks,
      exportCompatibility: mergeCompat(blocks.map((block) => block.exportCompatibility)),
      wrapperClass: layout?.wrapperClass,
    };
  });
  return {
    schemaVersion: 1,
    rendererVersion: RENDERER_VERSION,
    deckId: deck.id,
    deckRevision: deck.revision,
    title: deck.title,
    width: SLIDE_WIDTH,
    height: SLIDE_HEIGHT,
    theme,
    slides,
    warnings,
  };
}

export function renderDeckHtml(scene: RenderScene, options: { standalone?: boolean; exportMode?: boolean } = {}) {
  const slides = scene.slides.map((slide, index) => renderSlideHtml(slide, index, scene.theme.id)).join("\n");
  const deckClass = options.exportMode ? "deck export" : "deck";
  const themeClass = `mk-theme-${themeIdClass(scene.theme.id)}`;
  const body = `<main class="${deckClass} ${themeClass}" data-deck-id="${escapeHtml(scene.deckId)}">\n${slides}\n</main>`;
  if (!options.standalone) return `${renderCss(scene.theme)}\n${body}`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(scene.title)}</title>
${(scene.theme.fontImports ?? []).map((url) => `<link rel="stylesheet" href="${escapeAttribute(url)}" />`).join("\n")}
<style>${renderCss(scene.theme)}</style>
</head>
<body>
${body}
<script>
let current = 0;
const slides = Array.from(document.querySelectorAll('.mk-slide'));
function show(i){ current = Math.max(0, Math.min(slides.length - 1, i)); slides.forEach((s, idx) => s.classList.toggle('active', idx === current)); }
document.addEventListener('keydown', (event) => {
  if (['ArrowRight','PageDown',' '].includes(event.key)) show(current + 1);
  if (['ArrowLeft','PageUp'].includes(event.key)) show(current - 1);
  if (event.key === 'Home') show(0);
  if (event.key === 'End') show(slides.length - 1);
});
show(0);
</script>
</body>
</html>`;
}

export function renderSlideHtml(slide: RenderSlide, index = 0, themeId?: string) {
  const blocks = slide.blocks.map((block) => renderBlockHtml(block)).join("\n");
  const classes = ["mk-slide"];
  if (themeId) classes.push(`mk-theme-${themeIdClass(themeId)}`);
  if (slide.wrapperClass) classes.push(slide.wrapperClass);
  return `<section class="${classes.join(" ")}" data-slide-id="${escapeHtml(slide.id)}" aria-label="${escapeHtml(slide.title || `Slide ${index + 1}`)}" style="background:${escapeAttribute(slide.background)}">${blocks}</section>`;
}

export function renderBlockHtml(block: RenderBlock) {
  const style = [
    `left:${block.frame.x}px`,
    `top:${block.frame.y}px`,
    `width:${block.frame.width}px`,
    `height:${block.frame.height}px`,
    `z-index:${block.style.zIndex}`,
    inlineStyle(block.style.raw),
  ].filter(Boolean).join(";");
  return `<div class="${block.className}" data-block-id="${escapeHtml(block.id)}" data-block-type="${block.type}" style="${style}">${block.html}</div>`;
}

export function renderCss(theme: ResolvedTheme) {
  const decor = theme.decorCss ? `\n/* Theme decor: ${theme.id} */\n${scopeDecorCss(theme.decorCss, themeIdClass(theme.id))}\n` : "";
  return `
:root {
  --mk-bg: ${theme.colors.bg};
  --mk-primary: ${theme.colors.primary};
  --mk-secondary: ${theme.colors.secondary ?? theme.colors.primary};
  --mk-accent: ${theme.colors.accent ?? theme.colors.primary};
  --mk-text: ${theme.colors.text};
  --mk-muted: ${theme.colors.muted};
  --mk-card: ${theme.colors.card};
  --mk-border: ${theme.colors.border};
  --mk-display: ${theme.typography.display};
  --mk-body: ${theme.typography.body};
  --mk-radius: ${Number(theme.spacing.radius ?? 12)}px;
}
* { box-sizing: border-box; }
html, body { width: 100%; min-height: 100%; margin: 0; background: #111; color: var(--mk-text); font-family: var(--mk-body); }
.deck { width: 100vw; min-height: 100vh; display: grid; place-items: center; gap: 40px; padding: 32px; }
.deck.export { display: block; width: ${SLIDE_WIDTH}px; min-height: auto; padding: 0; background: transparent; }
.mk-slide { width: ${SLIDE_WIDTH}px; height: ${SLIDE_HEIGHT}px; position: relative; overflow: hidden; color: var(--mk-text); box-shadow: 0 28px 90px rgba(0,0,0,.32); display: none; break-after: page; page-break-after: always; }
.deck.export .mk-slide { box-shadow: none; margin: 0; }
.mk-slide.active, .deck.export .mk-slide, .deck.thumbnail .mk-slide { display: block; }
.mk-block { position: absolute; overflow: hidden; }
.mk-text-title { font-family: var(--mk-display); font-size: 58px; line-height: 1.04; font-weight: 700; white-space: pre-wrap; letter-spacing: 0; }
.mk-text-subtitle { font-size: 24px; line-height: 1.36; color: var(--mk-muted); white-space: pre-wrap; letter-spacing: 0; }
.mk-text-body { font-size: 24px; line-height: 1.45; white-space: pre-wrap; letter-spacing: 0; }
.mk-text-caption, .mk-text-eyebrow { font-size: 15px; color: var(--mk-muted); text-transform: uppercase; letter-spacing: .08em; white-space: pre-wrap; }
.mk-card { border: 1.5px solid var(--mk-border); background: var(--mk-card); border-radius: var(--mk-radius); padding: 24px; }
.mk-metric-value { font-family: var(--mk-display); color: var(--mk-primary); font-size: 62px; line-height: 1; font-weight: 700; }
.mk-metric-label { font-size: 24px; font-weight: 700; margin-top: 12px; }
.mk-metric-description { color: var(--mk-muted); font-size: 17px; margin-top: 12px; line-height: 1.45; }
.mk-quote { font-family: var(--mk-display); font-size: 42px; line-height: 1.22; }
.mk-quote-source { margin-top: 24px; color: var(--mk-muted); text-transform: uppercase; letter-spacing: .08em; }
.mk-image { width: 100%; height: 100%; object-fit: cover; display: block; border-radius: var(--mk-radius); }
.mk-placeholder { border: 2px dashed var(--mk-border); color: var(--mk-muted); display: grid; place-items: center; height: 100%; padding: 18px; text-align: center; border-radius: var(--mk-radius); white-space: pre-wrap; }
.mk-chart { height: 100%; display: flex; flex-direction: column; gap: 12px; padding: 20px; }
.mk-chart-title { font-family: var(--mk-display); font-weight: 700; font-size: 24px; }
.mk-chart-row { display: grid; grid-template-columns: minmax(72px, 160px) 1fr 54px; align-items: center; gap: 14px; font-size: 15px; }
.mk-chart-bar { height: 18px; background: color-mix(in srgb, var(--mk-primary) 15%, transparent); border-radius: 999px; overflow: hidden; }
.mk-chart-fill { height: 100%; background: var(--mk-primary); display: block; }
.mk-diagram { height: 100%; padding: 24px; white-space: pre-wrap; font-family: ui-monospace, monospace; border: 1.5px solid var(--mk-border); border-radius: var(--mk-radius); background: var(--mk-card); color: var(--mk-text); }
.mk-table { width:100%; border-collapse: collapse; font-size:18px; }
.mk-table th, .mk-table td { text-align:left; border-bottom:1px solid var(--mk-border); padding:8px; }
@page { size: ${SLIDE_WIDTH}px ${SLIDE_HEIGHT}px; margin: 0; }
@media print {
  html, body { width: ${SLIDE_WIDTH}px; background: transparent; }
  .deck { display: block; width: ${SLIDE_WIDTH}px; padding: 0; }
  .mk-slide { display: block; box-shadow: none; }
}
${decor}`;
}

function themeIdClass(id: string) {
  return id.replace(/[^a-zA-Z0-9_-]/g, "-");
}

function scopeDecorCss(css: string, themeClass: string): string {
  // Naive scoping: rewrite top-level selectors so each rule is scoped under
  // `.mk-theme-{id}` (so decor cannot leak outside the deck). Skips @-rules
  // (e.g. @keyframes, @media) which pass through untouched.
  return css.replace(/(^|\})\s*([^{}@]+)\{/g, (match, prefix, selector) => {
    const scoped = selector
      .split(",")
      .map((sel: string) => {
        const trimmed = sel.trim();
        if (!trimmed) return trimmed;
        if (trimmed.startsWith(".mk-theme-")) return trimmed;
        return `.mk-theme-${themeClass} ${trimmed}`;
      })
      .join(", ");
    return `${prefix} ${scoped} {`;
  });
}

export function renderScopedCss(theme: ResolvedTheme) {
  return renderCss(theme)
    .replace(":root", ".mk-viewer-scope")
    .replace(/html, body \{[^}]+\}\n/, "")
    .replace(/@page \{[^}]+\}\n/g, "");
}

export function chartBlockToSvgDataUri(block: RenderBlock, theme: ResolvedTheme) {
  const label = escapeHtml(block.textContent || "Chart");
  const width = Math.max(1, block.frame.width);
  const height = Math.max(1, block.frame.height);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
<rect width="100%" height="100%" rx="12" fill="${escapeAttribute(theme.colors.card)}" stroke="${escapeAttribute(theme.colors.border)}"/>
<foreignObject x="18" y="18" width="${Math.max(1, width - 36)}" height="${Math.max(1, height - 36)}">
<div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Arial,sans-serif;color:${escapeAttribute(theme.colors.text)};font-size:16px;white-space:pre-wrap;">${label}</div>
</foreignObject>
</svg>`;
  return `data:image/svg+xml;base64,${base64(svg)}`;
}

function resolveBlock(deck: Deck, block: DeckBlock, theme: ResolvedTheme, assetBase: string, index: number, warnings: ValidationWarning[], slide: Slide): RenderBlock {
  const style = computeBlockStyle(block, theme, index);
  const asset = block.type === "image" && block.assetId ? deck.assets.find((item) => item.id === block.assetId) : undefined;
  if (block.type === "image" && block.assetId && !asset) {
    warnings.push(warn("missing-asset", "error", `slides.${slide.id}.blocks.${block.id}.assetId`, `Asset not found: ${block.assetId}`));
  }
  const { html, textContent, className } = renderBlockInner(deck, block, theme, assetBase, asset);
  return {
    id: block.id,
    type: block.type,
    source: block,
    slot: block.slot,
    frame: block.frame,
    className,
    style,
    html,
    textContent,
    asset,
    exportCompatibility: block.exportCompatibility,
    pptxSupport: block.exportCompatibility.pptx,
  };
}

function computeBlockStyle(block: DeckBlock, theme: ResolvedTheme, index: number): ComputedBlockStyle {
  const role = block.type === "text" ? block.textRole ?? "body" : "body";
  const fontSize = role === "title" ? 58 : role === "subtitle" ? 24 : role === "caption" || role === "eyebrow" ? 15 : 24;
  const raw = sanitizeStyle(block.style);
  if (block.type === "shape") {
    raw.background = raw.color ?? theme.colors.primary;
    raw.borderRadius = block.shape === "ellipse" ? 999 : Number(raw.borderRadius ?? theme.spacing.radius ?? 12);
    raw.opacity = Number(raw.opacity ?? 0.12);
  }
  return {
    left: block.frame.x,
    top: block.frame.y,
    width: block.frame.width,
    height: block.frame.height,
    zIndex: Number(raw.zIndex ?? index + 1),
    fontFamily: role === "title" ? theme.typography.display : theme.typography.body,
    fontSize,
    lineHeight: role === "title" ? 1.04 : role === "subtitle" ? 1.36 : 1.45,
    fontWeight: role === "title" ? 700 : 400,
    color: String(raw.color ?? theme.colors.text),
    background: typeof raw.background === "string" ? raw.background : undefined,
    borderColor: typeof raw.borderColor === "string" ? raw.borderColor : undefined,
    borderRadius: Number(raw.borderRadius ?? theme.spacing.radius ?? 12),
    opacity: typeof raw.opacity === "number" ? raw.opacity : undefined,
    objectFit: block.type === "image" ? block.fit ?? "cover" : undefined,
    raw,
  };
}

function renderBlockInner(deck: Deck, block: DeckBlock, theme: ResolvedTheme, assetBase: string, asset?: AssetMetadata) {
  switch (block.type) {
    case "text":
      return { className: `mk-block mk-text-${block.textRole ?? "body"}`, html: escapeHtml(block.text), textContent: block.text };
    case "metric":
      return {
        className: "mk-block mk-card",
        html: `<div class="mk-metric-value">${escapeHtml(block.value)}</div><div class="mk-metric-label">${escapeHtml(block.label)}</div><div class="mk-metric-description">${escapeHtml(block.description ?? "")}</div>`,
        textContent: `${block.value}\n${block.label}\n${block.description ?? ""}`.trim(),
      };
    case "quote":
      return {
        className: "mk-block",
        html: `<div class="mk-quote">"${escapeHtml(block.quote)}"</div>${block.attribution ? `<div class="mk-quote-source">${escapeHtml(block.attribution)}</div>` : ""}`,
        textContent: `"${block.quote}"${block.attribution ? ` ${block.attribution}` : ""}`,
      };
    case "image":
      if (!asset) {
        const placeholder = block.prompt ?? block.altText ?? "Image placeholder";
        return { className: "mk-block mk-placeholder", html: escapeHtml(placeholder), textContent: placeholder };
      }
      return {
        className: "mk-block",
        html: `<img class="mk-image" src="${escapeAttribute(joinUrlPath(assetBase, asset.localPath))}" alt="${escapeAttribute(asset.altText ?? block.altText ?? "")}" style="object-fit:${block.fit ?? "cover"}" />`,
        textContent: asset.altText ?? block.altText ?? "",
      };
    case "chart":
      return { className: "mk-block mk-chart mk-card", html: renderChart(block, theme), textContent: chartText(block) };
    case "diagram":
      return { className: "mk-block mk-diagram", html: escapeHtml(block.source), textContent: block.source };
    case "shape":
      return {
        className: "mk-block",
        html: escapeHtml(block.text ?? ""),
        textContent: block.text ?? "",
      };
    case "table":
      return { className: "mk-block mk-card", html: renderTable(block), textContent: [block.columns.join("\t"), ...block.rows.map((row) => row.join("\t"))].join("\n") };
    case "placeholder":
      return {
        className: "mk-block mk-placeholder",
        html: `${escapeHtml(block.label)}${block.prompt ? `<br><small>${escapeHtml(block.prompt)}</small>` : ""}`,
        textContent: `${block.label}${block.prompt ? `\n${block.prompt}` : ""}`,
      };
    case "group":
      return { className: "mk-block mk-placeholder", html: `Group: ${escapeHtml(block.childIds.join(", "))}`, textContent: block.childIds.join(", ") };
  }
}

function renderChart(block: ChartBlock, theme: ResolvedTheme) {
  const xKey = block.encoding?.x ?? "name";
  const yKey = block.encoding?.y ?? "value";
  const values = block.data.map((row) => Number(row[yKey] ?? 0));
  const max = Math.max(1, ...values);
  return `${block.title ? `<div class="mk-chart-title">${escapeHtml(block.title)}</div>` : ""}
${block.data.map((row) => {
  const value = Number(row[yKey] ?? 0);
  const label = String(row[xKey] ?? "");
  return `<div class="mk-chart-row"><span>${escapeHtml(label)}</span><span class="mk-chart-bar"><span class="mk-chart-fill" style="width:${Math.max(2, Math.round((value / max) * 100))}%;background:${escapeAttribute(theme.colors.primary)}"></span></span><strong>${escapeHtml(String(row[yKey] ?? ""))}</strong></div>`;
}).join("")}`;
}

function renderTable(block: TableBlock) {
  return `<table class="mk-table"><thead><tr>${block.columns.map((col) => `<th>${escapeHtml(col)}</th>`).join("")}</tr></thead><tbody>${block.rows.map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(String(cell))}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
}

function chartText(block: ChartBlock) {
  return `${block.title ?? "Chart"}\n${block.data.map((row) => Object.values(row).join("  ")).join("\n")}`.trim();
}

function resolveTheme(themeId: string, themes?: ThemeDefinition[]): ResolvedTheme {
  const theme = themes?.find((item) => item.id === themeId) ?? themes?.[0];
  if (!theme) return fallbackTheme;
  return {
    id: theme.id,
    name: theme.name,
    colors: { ...fallbackTheme.colors, ...theme.colors },
    typography: { ...fallbackTheme.typography, ...theme.typography },
    spacing: { ...fallbackTheme.spacing, ...theme.spacing },
    decorCss: theme.decorCss,
    fontImports: theme.fontImports,
  };
}

function mergeCompat(items: ExportCompatibility[]): ExportCompatibility {
  return {
    html: worstSupport(items.map((item) => item.html)),
    pdf: worstSupport(items.map((item) => item.pdf)),
    pptx: worstSupport(items.map((item) => item.pptx)),
  };
}

function worstSupport(values: ExportSupport[]): ExportSupport {
  if (values.includes("unsupported")) return "unsupported";
  if (values.includes("fallback")) return "fallback";
  if (values.includes("image-fallback")) return "image-fallback";
  return "native";
}

function joinUrlPath(base: string, rel: string) {
  if (/^https?:\/\//i.test(rel)) return rel;
  const cleanBase = base.replace(/\/+$/, "");
  const cleanRel = rel.replace(/^\/+/, "");
  return cleanBase ? `${cleanBase}/${cleanRel}` : cleanRel;
}

function sanitizeStyle(style?: Record<string, unknown>): Record<string, string | number> {
  const safe: Record<string, string | number> = {};
  if (!style) return safe;
  for (const [key, value] of Object.entries(style)) {
    if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(key)) continue;
    if (typeof value === "string" || typeof value === "number") safe[key] = value;
  }
  return safe;
}

function inlineStyle(style?: Record<string, unknown>) {
  if (!style) return "";
  const safe: string[] = [];
  for (const [key, value] of Object.entries(style)) {
    if (!/^[a-zA-Z-]+$/.test(key)) continue;
    if (typeof value !== "string" && typeof value !== "number") continue;
    safe.push(`${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}:${String(value).replace(/[;{}]/g, "")}`);
  }
  return safe.join(";");
}

function warn(id: string, severity: "info" | "warning" | "error", path: string, message: string): ValidationWarning {
  return { id, severity, path, message };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function base64(value: string) {
  if (typeof Buffer !== "undefined") return Buffer.from(value, "utf8").toString("base64");
  return btoa(unescape(encodeURIComponent(value)));
}
