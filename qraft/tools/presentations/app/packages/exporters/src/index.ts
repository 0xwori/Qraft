import { promises as fs } from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import pptxgenjs from "pptxgenjs";
import {
  type Deck,
  type ShapeBlock,
  type ExportTarget,
  type MicroKeynoteCore,
  type ValidationWarning,
} from "@micro-keynote/core";
import {
  chartBlockToSvgDataUri,
  renderDeckHtml,
  resolveDeckRenderScene,
  SLIDE_HEIGHT,
  SLIDE_WIDTH,
  type RenderBlock,
  type RenderScene,
} from "@micro-keynote/renderer";

export interface ExportDeckInput {
  clientId: string;
  deckId: string;
  format: ExportTarget;
}

export interface ExportDeckResult {
  schemaVersion: number;
  format: ExportTarget;
  path: string;
  validationWarnings: ValidationWarning[];
  rendererVersion: number;
  renderSceneRevision: string;
}

const PPTX_WIDTH = 13.333;
const PPTX_HEIGHT = 7.5;

export async function exportDeck(core: MicroKeynoteCore, input: ExportDeckInput): Promise<ExportDeckResult> {
  const deck = await core.readDeck(input.clientId, input.deckId);
  const scene = await buildScene(core, deck);
  const warnings = [...core.validateDeck(deck), ...scene.warnings];
  if (input.format === "html") return exportHtml(core, deck, scene, warnings);
  if (input.format === "pdf") return exportPdf(core, deck, scene, warnings);
  if (input.format === "pptx") return exportPptx(core, deck, scene, warnings);
  throw new Error(`Unsupported export format: ${String(input.format)}`);
}

async function buildScene(core: MicroKeynoteCore, deck: Deck) {
  const [themes, layouts] = await Promise.all([core.listThemes(), core.listLayouts()]);
  return resolveDeckRenderScene(deck, { themes, layouts, assetBasePath: "..", mode: "export" });
}

async function exportHtml(core: MicroKeynoteCore, deck: Deck, scene: RenderScene, warnings: ValidationWarning[]): Promise<ExportDeckResult> {
  const html = renderDeckHtml(scene, { standalone: true });
  const outPath = await core.writeDeckForExport(deck.clientId, deck.id, `${deck.id}.html`, html);
  return result("html", outPath, scene, warnings);
}

async function exportPdf(core: MicroKeynoteCore, deck: Deck, scene: RenderScene, warnings: ValidationWarning[]): Promise<ExportDeckResult> {
  const exportsDir = await core.exportDir(deck.clientId, deck.id);
  const html = renderDeckHtml(scene, { standalone: true, exportMode: true });
  const htmlPath = path.join(exportsDir, ".pdf-render.html");
  const pdfPath = path.join(exportsDir, `${deck.id}.pdf`);
  await fs.writeFile(htmlPath, html, "utf8");

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: SLIDE_WIDTH, height: SLIDE_HEIGHT } });
    await page.goto(`file://${htmlPath}`, { waitUntil: "networkidle" });
    await page.pdf({
      path: pdfPath,
      width: `${PPTX_WIDTH}in`,
      height: `${PPTX_HEIGHT}in`,
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
  } finally {
    await browser.close();
    await fs.rm(htmlPath, { force: true });
  }

  return result("pdf", pdfPath, scene, warnings);
}

async function exportPptx(core: MicroKeynoteCore, deck: Deck, scene: RenderScene, warnings: ValidationWarning[]): Promise<ExportDeckResult> {
  const PptxGenCtor = pptxgenjs as unknown as { new (): any };
  const pptx = new PptxGenCtor();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "presentations";
  pptx.subject = deck.title;
  pptx.title = deck.title;
  pptx.company = "Qraft";
  pptx.lang = "en-US";
  pptx.theme = {
    headFontFace: pptxFont(scene.theme.typography.display),
    bodyFontFace: pptxFont(scene.theme.typography.body),
    lang: "en-US",
  };

  const exportDir = await core.exportDir(deck.clientId, deck.id);
  const deckRoot = path.dirname(exportDir);
  for (const slideModel of scene.slides) {
    const slide = pptx.addSlide();
    slide.background = { color: hex(slideModel.background) };
    for (const block of slideModel.blocks) {
      await addPptxBlock(slide, block, deckRoot, scene);
    }
  }

  const outPath = path.join(exportDir, `${deck.id}.pptx`);
  await pptx.writeFile({ fileName: outPath });
  return result(
    "pptx",
    outPath,
    scene,
    [
      ...warnings,
      ...scene.slides.flatMap((slide) =>
        slide.blocks
          .filter((block) => block.pptxSupport === "image-fallback" || block.pptxSupport === "fallback")
          .map((block) => ({
            id: "pptx-image-fallback",
            severity: "warning" as const,
            path: `slides.${slide.id}.blocks.${block.id}`,
            message: `${block.type} exports to PPTX using a renderer-derived fallback, so editability is limited.`,
          })),
      ),
    ],
  );
}

async function addPptxBlock(slide: any, block: RenderBlock, deckRoot: string, scene: RenderScene) {
  const box = toPptxBox(block.frame);
  switch (block.type) {
    case "text":
      slide.addText(block.textContent, {
        ...box,
        fontFace: pptxFont(block.style.fontFamily),
        fontSize: pxToPt(block.style.fontSize),
        bold: block.style.fontWeight >= 700,
        color: hex(block.style.color),
        fit: "shrink",
        valign: "mid",
        breakLine: false,
      });
      break;
    case "metric":
      slide.addText([
        { text: `${line(block.textContent, 0)}\n`, options: { bold: true, fontSize: 32, color: hex(scene.theme.colors.primary) } },
        { text: `${line(block.textContent, 1)}\n`, options: { bold: true, fontSize: 15, color: hex(scene.theme.colors.text) } },
        { text: line(block.textContent, 2), options: { fontSize: 11, color: hex(scene.theme.colors.muted) } },
      ], { ...box, fit: "shrink", margin: 0.12, breakLine: false });
      break;
    case "quote":
      slide.addText(block.textContent, {
        ...box,
        fontFace: pptxFont(scene.theme.typography.display),
        fontSize: 24,
        color: hex(scene.theme.colors.text),
        fit: "shrink",
        breakLine: false,
      });
      break;
    case "image": {
      if (block.asset) {
        const imagePath = path.join(deckRoot, block.asset.localPath);
        slide.addImage({ path: imagePath, ...box });
      } else {
        slide.addText(block.textContent || "Image placeholder", { ...box, fontSize: 14, color: hex(scene.theme.colors.muted), breakLine: false });
      }
      break;
    }
    case "shape":
      slide.addShape((block.source as ShapeBlock).shape === "ellipse" ? "ellipse" : "rect", {
        ...box,
        fill: { color: hex(block.style.background ?? scene.theme.colors.primary), transparency: Math.round((1 - (block.style.opacity ?? 0.12)) * 100) },
        line: { color: hex(block.style.borderColor ?? scene.theme.colors.primary), transparency: 70 },
      });
      if (block.textContent) slide.addText(block.textContent, { ...box, fontSize: 12, color: hex(scene.theme.colors.text), breakLine: false });
      break;
    case "table":
      slide.addTable(block.textContent.split("\n").map((row) => row.split("\t")), {
        ...box,
        border: { type: "solid", color: hex(scene.theme.colors.border), pt: 0.5 },
        fontSize: 10,
        color: hex(scene.theme.colors.text),
      });
      break;
    case "chart":
      slide.addImage({ data: chartBlockToSvgDataUri(block, scene.theme), ...box });
      break;
    case "diagram":
      slide.addImage({ data: chartBlockToSvgDataUri(block, scene.theme), ...box });
      break;
    case "placeholder":
      slide.addText(block.textContent, { ...box, fontSize: 14, color: hex(scene.theme.colors.muted), breakLine: false });
      break;
    case "group":
      slide.addText(`Group: ${block.textContent}`, { ...box, fontSize: 10, color: hex(scene.theme.colors.muted), breakLine: false });
      break;
  }
}

function toPptxBox(frame: { x: number; y: number; width: number; height: number }) {
  return {
    x: (frame.x / SLIDE_WIDTH) * PPTX_WIDTH,
    y: (frame.y / SLIDE_HEIGHT) * PPTX_HEIGHT,
    w: (frame.width / SLIDE_WIDTH) * PPTX_WIDTH,
    h: (frame.height / SLIDE_HEIGHT) * PPTX_HEIGHT,
  };
}

function result(format: ExportTarget, outPath: string, scene: RenderScene, validationWarnings: ValidationWarning[]): ExportDeckResult {
  return {
    schemaVersion: 1,
    format,
    path: outPath,
    validationWarnings,
    rendererVersion: scene.rendererVersion,
    renderSceneRevision: scene.deckRevision,
  };
}

function pxToPt(px: number) {
  return Math.max(6, Math.round(px * 0.62));
}

function pptxFont(fontFamily: string) {
  return fontFamily.split(",")[0]?.replace(/["']/g, "").trim() || "Aptos";
}

function hex(value: string) {
  const match = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!match) return "111111";
  const text = match[1]!;
  if (text.length === 3) return text.split("").map((char) => `${char}${char}`).join("").toUpperCase();
  return text.toUpperCase();
}

function line(value: string, index: number) {
  return value.split("\n")[index] ?? "";
}
