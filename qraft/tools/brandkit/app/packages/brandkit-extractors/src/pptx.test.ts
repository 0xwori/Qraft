/**
 * PPTX extractor integration test.
 * Creates a minimal valid .pptx ZIP in memory and asserts the extractor
 * reads the correct hex values and font names.
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import JSZip from "jszip";
import { extractPptx } from "./pptx.js";

const THEME_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="TestTheme">
  <a:themeElements>
    <a:clrScheme name="TestScheme">
      <a:dk1><a:srgbClr val="111111"/></a:dk1>
      <a:lt1><a:srgbClr val="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="0B1F3A"/></a:dk2>
      <a:lt2><a:srgbClr val="E8E8E8"/></a:lt2>
      <a:accent1><a:srgbClr val="FF6B5E"/></a:accent1>
      <a:accent2><a:srgbClr val="4A90D9"/></a:accent2>
      <a:accent3><a:srgbClr val="50C878"/></a:accent3>
      <a:accent4><a:srgbClr val="FFD700"/></a:accent4>
      <a:accent5><a:srgbClr val="9B59B6"/></a:accent5>
      <a:accent6><a:srgbClr val="E67E22"/></a:accent6>
      <a:hlink><a:srgbClr val="0066CC"/></a:hlink>
      <a:folHlink><a:srgbClr val="551A8B"/></a:folHlink>
    </a:clrScheme>
    <a:fontScheme name="TestFonts">
      <a:majorFont>
        <a:latin typeface="Inter"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:majorFont>
      <a:minorFont>
        <a:latin typeface="Source Serif 4"/>
        <a:ea typeface=""/>
        <a:cs typeface=""/>
      </a:minorFont>
    </a:fontScheme>
    <a:fmtScheme name="Office"/>
  </a:themeElements>
</a:theme>`;

let tmpDir: string;
let pptxPath: string;
let assetsDir: string;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "brandkit-pptx-test-"));
  assetsDir = path.join(tmpDir, "assets");

  // Build a minimal valid .pptx ZIP
  const zip = new JSZip();
  zip.file("ppt/theme/theme1.xml", THEME_XML);
  // Add a fake media file
  zip.file("ppt/media/logo.png", Buffer.from([0x89, 0x50, 0x4e, 0x47])); // PNG magic bytes

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  pptxPath = path.join(tmpDir, "test-brand.pptx");
  await fs.writeFile(pptxPath, buffer);
});

afterAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("extractPptx", () => {
  it("extracts dk2 (primary brand color) correctly", async () => {
    const bundle = await extractPptx(pptxPath, assetsDir);
    // dk2 maps to "primary" role in our slot mapping
    expect(bundle.colors.primary?.$value).toBe("#0B1F3A");
  });

  it("extracts lt1 (background) correctly", async () => {
    const bundle = await extractPptx(pptxPath, assetsDir);
    expect(bundle.colors.bg?.$value).toBe("#FFFFFF");
  });

  it("extracts accent1 correctly", async () => {
    const bundle = await extractPptx(pptxPath, assetsDir);
    expect(bundle.colors.accent?.$value).toBe("#FF6B5E");
  });

  it("extracts majorFont as display typography", async () => {
    const bundle = await extractPptx(pptxPath, assetsDir);
    expect(bundle.typography.display?.$value.fontFamily).toBe("Inter");
  });

  it("extracts minorFont as body typography", async () => {
    const bundle = await extractPptx(pptxPath, assetsDir);
    expect(bundle.typography.body?.$value.fontFamily).toBe("Source Serif 4");
  });

  it("copies media files to assets dir", async () => {
    await extractPptx(pptxPath, assetsDir);
    const files = await fs.readdir(assetsDir).catch(() => []);
    expect(files).toContain("logo.png");
  });

  it("sets source = pptx and high confidence on all tokens", async () => {
    const bundle = await extractPptx(pptxPath, assetsDir);
    for (const token of Object.values(bundle.colors)) {
      expect(token.$extensions?.brandkit.source).toBe("pptx");
      expect(token.$extensions?.brandkit.confidence).toBeGreaterThan(0.8);
    }
  });
});
