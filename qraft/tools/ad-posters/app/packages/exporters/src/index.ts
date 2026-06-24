import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { chromium, type Browser } from "playwright";
import type { CampaignMeta, ExportFormat } from "@qraft-ad-posters/core";

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
  }
  return browserPromise;
}

export async function closeExportBrowser(): Promise<void> {
  if (!browserPromise) return;
  const browser = await browserPromise.catch(() => null);
  browserPromise = null;
  if (browser) await browser.close().catch(() => undefined);
}

export interface ExportAdInput {
  previewUrl: string;
  campaignRoot: string;
  meta: CampaignMeta;
  variantId?: string;
  format: ExportFormat;
  timeMs?: number;
}

export interface ExportAdResult {
  schemaVersion: number;
  format: ExportFormat;
  files: Array<{
    path: string;
    variantId: string;
    width: number;
    height: number;
  }>;
  uploadPackPath: string;
}

export async function exportAd(input: ExportAdInput): Promise<ExportAdResult> {
  const variants = input.variantId
    ? input.meta.variants.filter((variant) => variant.id === input.variantId)
    : input.meta.variants;
  if (variants.length === 0) throw new Error(`Variant not found: ${input.variantId ?? ""}`);

  const files = [];
  for (const variant of variants) {
    const path = input.format === "png"
      ? await exportPng(input, variant)
      : await exportMp4(input, variant);
    files.push({ path, variantId: variant.id, width: variant.width, height: variant.height });
  }

  const uploadPackPath = await writeManualUploadPack(input, files);
  return { schemaVersion: 1, format: input.format, files, uploadPackPath };
}

async function exportPng(input: ExportAdInput, variant: CampaignMeta["variants"][number]) {
  const browser = await getBrowser();
  const context = await browser.newContext({ viewport: { width: variant.width, height: variant.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  try {
    await page.goto(withParams(input.previewUrl, { variant: variant.id, timeMs: String(input.timeMs ?? 0) }), { waitUntil: "networkidle", timeout: 30_000 });
    await waitForAd(page);
    const outDir = path.join(input.campaignRoot, ".export");
    await fs.mkdir(outDir, { recursive: true });
    const file = path.join(outDir, `${input.meta.id}-${variant.id}-${Date.now().toString(36)}.png`);
    await page.locator("[data-ad-root]").screenshot({ path: file, animations: "disabled" });
    return file;
  } finally {
    await context.close().catch(() => undefined);
  }
}

async function exportMp4(input: ExportAdInput, variant: CampaignMeta["variants"][number]) {
  await ensureFfmpeg();
  const browser = await getBrowser();
  const context = await browser.newContext({ viewport: { width: variant.width, height: variant.height }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  const frameRoot = await fs.mkdtemp(path.join(os.tmpdir(), `ad-posters-${input.meta.id}-${variant.id}-`));
  try {
    await page.goto(withParams(input.previewUrl, { variant: variant.id, timeMs: "0" }), { waitUntil: "networkidle", timeout: 30_000 });
    await waitForAd(page);
    const fps = input.meta.fps;
    const frameCount = Math.max(1, Math.ceil(input.meta.durationMs / 1000 * fps));
    for (let frame = 0; frame < frameCount; frame += 1) {
      const timeMs = Math.min(input.meta.durationMs, Math.round(frame / fps * 1000));
      await page.evaluate((nextTime) => {
        const setter = (window as typeof window & { __QRAFT_AD_SET_TIME?: (timeMs: number) => void }).__QRAFT_AD_SET_TIME;
        setter?.(nextTime);
      }, timeMs);
      await page.waitForTimeout(16);
      await page.locator("[data-ad-root]").screenshot({
        path: path.join(frameRoot, `frame-${String(frame + 1).padStart(5, "0")}.png`),
        animations: "disabled",
      });
    }
    const outDir = path.join(input.campaignRoot, ".export");
    await fs.mkdir(outDir, { recursive: true });
    const file = path.join(outDir, `${input.meta.id}-${variant.id}-${Date.now().toString(36)}.mp4`);
    await runFfmpeg([
      "-y",
      "-framerate", String(fps),
      "-i", path.join(frameRoot, "frame-%05d.png"),
      "-c:v", "libx264",
      "-pix_fmt", "yuv420p",
      "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2",
      "-movflags", "+faststart",
      file,
    ]);
    return file;
  } finally {
    await context.close().catch(() => undefined);
    await fs.rm(frameRoot, { recursive: true, force: true }).catch(() => undefined);
  }
}

async function waitForAd(page: import("playwright").Page) {
  await page.waitForSelector("[data-ad-root]", { timeout: 15_000 });
  await page.waitForFunction(() => {
    const root = document.querySelector("[data-ad-root]");
    return Boolean(root && root.clientWidth > 0 && root.clientHeight > 0);
  }, undefined, { timeout: 15_000 });
}

async function writeManualUploadPack(
  input: ExportAdInput,
  files: Array<{ path: string; variantId: string; width: number; height: number }>,
) {
  const outDir = path.join(input.campaignRoot, ".export");
  await fs.mkdir(outDir, { recursive: true });
  const file = path.join(outDir, "manual-upload-pack.md");
  const lines = [
    `# Manual Upload Pack - ${input.meta.title}`,
    "",
    "This pack is for manual upload. It does not publish ads or call ad platform APIs.",
    "",
    "## Exported Files",
    "",
    ...files.map((item) => `- ${item.variantId} (${item.width}x${item.height}, ${input.format.toUpperCase()}): \`${item.path}\``),
    "",
    "## Upload Checklist",
    "",
    "- Confirm copy and CTA.",
    "- Confirm target audience.",
    "- Confirm placement and size.",
    "- Upload the exported creative manually.",
    "- Check platform preview before publishing.",
    "- Get Wouter's approval before spending budget.",
    "",
  ];
  await fs.writeFile(file, lines.join("\n"), "utf8");
  return file;
}

function withParams(url: string, params: Record<string, string>) {
  const parsed = new URL(url);
  for (const [key, value] of Object.entries(params)) parsed.searchParams.set(key, value);
  return parsed.toString();
}

async function ensureFfmpeg() {
  await runFfmpeg(["-version"], { quiet: true }).catch(() => {
    throw new Error("ffmpeg is required for MP4 export. Install ffmpeg and make sure it is available on PATH.");
  });
}

async function runFfmpeg(args: string[], opts: { quiet?: boolean } = {}) {
  await new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: opts.quiet ? "ignore" : ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr?.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `ffmpeg exited with code ${code}`));
    });
  });
}
