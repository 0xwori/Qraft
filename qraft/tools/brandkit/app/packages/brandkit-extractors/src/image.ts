/**
 * Image extractor — finds brand images in a folder.
 *
 * Does NOT call any external API. The actual visual analysis is done by the
 * host Claude / Codex app that calls the MCP tools. This module just locates
 * the image files; the MCP server returns them as visual content blocks so
 * Claude can see them and extract tokens directly.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

export const IMAGE_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp", ".gif"];

/** Return all image file paths found in a folder. */
export async function findBrandImages(imageFolder: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(imageFolder);
    return entries
      .filter((f) => IMAGE_EXTENSIONS.some((ext) => f.toLowerCase().endsWith(ext)))
      .map((f) => path.join(imageFolder, f));
  } catch {
    return [];
  }
}

/** Copy image files into assetsDir. Returns the list of copied basenames. */
export async function copyImagesToAssets(
  imagePaths: string[],
  assetsDir: string,
): Promise<string[]> {
  await fs.mkdir(assetsDir, { recursive: true });
  const copied: string[] = [];
  for (const src of imagePaths) {
    const dest = path.join(assetsDir, path.basename(src));
    await fs.copyFile(src, dest).catch(() => {});
    copied.push(path.basename(src));
  }
  return copied;
}
