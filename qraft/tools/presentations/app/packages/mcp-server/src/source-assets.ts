import { promises as fs } from "node:fs";
import path from "node:path";
import type { MicroKeynoteCore } from "@micro-keynote/core";

/**
 * Helpers for getting image bytes into a React **source deck** (deck.tsx).
 *
 * A slide's `image` prop is just a URL string; relative URLs are served by the
 * runtime at `/deck-assets/<clientId>/<deckId>/assets/<file>`. To put an image
 * in a deck we need its bytes on disk — from a local file, a remote URL, or
 * base64 — saved under the deck's `assets/` folder. `saveSourceAsset` writes the
 * bytes and returns the served URL; `ingestImage` resolves bytes from whichever
 * source was provided.
 */

const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB

const EXT_BY_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
  "image/bmp": ".bmp",
  "image/tiff": ".tiff",
};

export interface SaveSourceAssetInput {
  clientId: string;
  deckId: string;
  /** Original (or derived) file name; sanitized and stamped before writing. */
  fileName: string;
  data: Buffer;
}

export interface SaveSourceAssetResult {
  fileName: string;
  url: string;
  absPath: string;
}

/** Write image bytes into the deck's assets folder and return the served URL. */
export async function saveSourceAsset(
  core: MicroKeynoteCore,
  input: SaveSourceAssetInput,
): Promise<SaveSourceAssetResult> {
  const { clientId, deckId, fileName, data } = input;
  if (!fileName) throw new Error("fileName is required");
  if (fileName.includes("/") || fileName.includes("\\") || fileName.includes("..") || fileName.startsWith(".")) {
    throw new Error("Invalid fileName");
  }
  const deckRoot = await core.deckRoot(clientId, deckId);
  const assetsDir = path.join(deckRoot, "assets");
  await fs.mkdir(assetsDir, { recursive: true });
  const ext = path.extname(fileName) || "";
  const stem = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, "_") || "asset";
  const stamp = Date.now().toString(36);
  const finalName = `${stem}-${stamp}${ext}`;
  const absPath = path.join(assetsDir, finalName);
  await fs.writeFile(absPath, data);
  const url = `/deck-assets/${encodeURIComponent(clientId)}/${encodeURIComponent(deckId)}/assets/${encodeURIComponent(finalName)}`;
  return { fileName: finalName, url, absPath };
}

export interface IngestImageInput {
  /** Absolute or relative path to an image file already on disk. */
  filePath?: string;
  /** A publicly reachable image URL to fetch. */
  url?: string;
  /** Raw base64 or a data: URI. */
  dataBase64?: string;
  /** Optional preferred file name (extension is otherwise derived). */
  fileName?: string;
}

export interface IngestedImage {
  data: Buffer;
  fileName: string;
}

function stripBase64Prefix(value: string): string {
  return value.replace(/^data:[^;]+;base64,/, "");
}

function mimeFromDataUri(value: string): string | undefined {
  const m = /^data:([^;]+);base64,/.exec(value);
  return m?.[1]?.toLowerCase();
}

/** Resolve image bytes from exactly one of filePath | url | dataBase64. */
export async function ingestImage(input: IngestImageInput): Promise<IngestedImage> {
  const provided = [input.filePath, input.url, input.dataBase64].filter(
    (v): v is string => typeof v === "string" && v.length > 0,
  );
  if (provided.length !== 1) {
    throw new Error("Provide exactly one image source: filePath, url, or dataBase64.");
  }

  if (input.filePath) {
    const abs = path.resolve(input.filePath);
    let data: Buffer;
    try {
      data = await fs.readFile(abs);
    } catch {
      throw new Error(`Image file not found or unreadable: ${abs}`);
    }
    if (data.byteLength === 0) throw new Error(`Image file is empty: ${abs}`);
    if (data.byteLength > MAX_IMAGE_BYTES) throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} bytes: ${abs}`);
    return { data, fileName: input.fileName || path.basename(abs) || "image" };
  }

  if (input.url) {
    let res: Response;
    try {
      res = await fetch(input.url);
    } catch (err) {
      throw new Error(`Failed to fetch image URL: ${(err as Error).message}`);
    }
    if (!res.ok) throw new Error(`Failed to fetch image URL: ${res.status} ${res.statusText}`);
    const contentType = (res.headers.get("content-type") ?? "").split(";")[0]?.trim().toLowerCase();
    if (!contentType || !contentType.startsWith("image/")) {
      throw new Error(`URL did not return an image (content-type: ${contentType || "unknown"})`);
    }
    const data = Buffer.from(await res.arrayBuffer());
    if (data.byteLength === 0) throw new Error("Fetched image is empty.");
    if (data.byteLength > MAX_IMAGE_BYTES) throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} bytes.`);
    let fileName = input.fileName;
    if (!fileName) {
      const urlName = path.basename(new URL(input.url).pathname);
      fileName = urlName && path.extname(urlName) ? urlName : `image${EXT_BY_MIME[contentType] ?? ".png"}`;
    }
    return { data, fileName };
  }

  const raw = input.dataBase64 as string;
  const mime = mimeFromDataUri(raw);
  const data = Buffer.from(stripBase64Prefix(raw), "base64");
  if (data.byteLength === 0) throw new Error("dataBase64 decoded to an empty buffer.");
  if (data.byteLength > MAX_IMAGE_BYTES) throw new Error(`Image exceeds ${MAX_IMAGE_BYTES} bytes.`);
  const fileName = input.fileName || `image${(mime && EXT_BY_MIME[mime]) || ".png"}`;
  return { data, fileName };
}
