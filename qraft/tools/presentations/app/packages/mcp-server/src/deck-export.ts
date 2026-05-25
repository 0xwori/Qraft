import path from "node:path";
import { promises as fs } from "node:fs";
import { chromium, type Browser } from "playwright";

let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = chromium.launch({ headless: true });
  }
  return browserPromise;
}

export async function closeExportBrowser(): Promise<void> {
  if (!browserPromise) return;
  const b = await browserPromise.catch(() => null);
  browserPromise = null;
  if (b) await b.close().catch(() => undefined);
}

export interface ExportInput {
  /** Preview URL the export will render (e.g. http://localhost:PORT/preview/c/d). */
  previewUrl: string;
  /** Deck root folder; output is written to `<deckRoot>/.export/`. */
  deckRoot: string;
  format: "html" | "pdf";
  /** File name stem (without extension). */
  stem: string;
}

export interface ExportResult {
  path: string;
}

export async function exportDeckSource(input: ExportInput): Promise<ExportResult> {
  const browser = await getBrowser();
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  try {
    await page.goto(input.previewUrl, { waitUntil: "networkidle", timeout: 30_000 });
    // Wait for the deck root to have at least one slide rendered.
    await page.waitForFunction(
      () => {
        const root = document.getElementById("root");
        return Boolean(root && root.children.length > 0);
      },
      undefined,
      { timeout: 15_000 },
    ).catch(() => undefined);

    const outDir = path.join(input.deckRoot, ".export");
    await fs.mkdir(outDir, { recursive: true });

    if (input.format === "html") {
      const html = await page.content();
      const file = path.join(outDir, `${input.stem}.html`);
      await fs.writeFile(file, html, "utf8");
      return { path: file };
    }

    const file = path.join(outDir, `${input.stem}.pdf`);
    await page.pdf({
      path: file,
      width: "1280px",
      height: "720px",
      printBackground: true,
      pageRanges: "1",
    });
    return { path: file };
  } finally {
    await context.close().catch(() => undefined);
  }
}
