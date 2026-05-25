import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chokidar from "chokidar";
import cors from "cors";
import express from "express";
import { WebSocketServer } from "ws";
import { MicroKeynoteCore, type BlockType } from "@micro-keynote/core";
import { exportDeck } from "@micro-keynote/exporters";
import {
  deckSourcePath,
  deleteDeckSlide,
  insertDeckSlide,
  patchDeckSource,
  readDeckSource,
  reorderDeckSlides,
  changeDeckTheme,
  listThemeCatalog,
} from "./deck-source.js";
import { bundleDeckSource, previewHtml } from "./deck-preview.js";
import { bundleTemplateVariant, templatePreviewHtml } from "./template-preview.js";
import { closeExportBrowser, exportDeckSource } from "./deck-export.js";

export interface RuntimeOptions {
  core?: MicroKeynoteCore;
  port?: number;
  launchBrowser?: boolean;
}

export interface RuntimeHandle {
  url: string;
  port: number;
  close: () => Promise<void>;
}

let runtimePromise: Promise<RuntimeHandle> | undefined;

export async function startMicroKeynoteRuntime(options: RuntimeOptions = {}): Promise<RuntimeHandle> {
  if (runtimePromise) return runtimePromise;
  runtimePromise = startRuntime(options);
  return runtimePromise;
}

async function startRuntime(options: RuntimeOptions): Promise<RuntimeHandle> {
  const core = options.core ?? new MicroKeynoteCore({ defaultPort: options.port });
  await core.initialize();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "25mb" }));

  const webDist = webUiDist();
  app.use(express.static(webDist, { index: false }));

  app.get("/api/clients", asyncHandler(async (_req, res) => {
    res.json({ schemaVersion: 1, clients: await core.listClients() });
  }));

  app.get("/api/layouts", asyncHandler(async (_req, res) => {
    res.json({ schemaVersion: 1, layouts: await core.listLayouts() });
  }));

  app.get("/api/themes", asyncHandler(async (_req, res) => {
    res.json({ schemaVersion: 1, themes: await core.listThemes() });
  }));

  app.get("/api/context/:clientId", asyncHandler(async (req, res) => {
    res.json(await core.readContext(String(req.params.clientId), stringQuery(req.query.deckId)));
  }));

  app.patch("/api/context/:clientId", asyncHandler(async (req, res) => {
    res.json(await core.updateClientContext({
      clientId: String(req.params.clientId),
      productMd: req.body.productMd,
      designMd: req.body.designMd,
      explicitUserIntent: Boolean(req.body.explicitUserIntent),
    }));
  }));

  app.get("/api/decks", asyncHandler(async (req, res) => {
    res.json(await core.listDecks(requireQuery(req.query.clientId, "clientId")));
  }));

  app.post("/api/decks", asyncHandler(async (req, res) => {
    res.json(await core.createDeck({
      clientId: requireBody(req.body.clientId, "clientId"),
      title: String(req.body.title ?? "Untitled deck"),
      themeId: req.body.themeId,
      layoutId: req.body.layoutId,
      intent: req.body.intent ?? "Create deck from UI",
    }));
  }));

  app.get("/api/decks/:deckId", asyncHandler(async (req, res) => {
    res.json(await core.openDeck({
      clientId: requireQuery(req.query.clientId, "clientId"),
      deckId: String(req.params.deckId),
    }));
  }));

  app.post("/api/decks/:deckId/theme", asyncHandler(async (req, res) => {
    res.json(await core.setTheme({
      clientId: requireBody(req.body.clientId, "clientId"),
      deckId: String(req.params.deckId),
      themeId: requireBody(req.body.themeId, "themeId"),
      expectedRevision: req.body.expectedRevision,
      intent: "Set theme from UI",
    }));
  }));

  app.delete("/api/decks/:deckId", asyncHandler(async (req, res) => {
    res.json(await core.deleteDeck({
      clientId: requireQuery(req.query.clientId, "clientId"),
      deckId: String(req.params.deckId),
      intent: "Delete deck from UI",
    }));
  }));

  app.post("/api/decks/:deckId/duplicate", asyncHandler(async (req, res) => {
    res.json(await core.duplicateDeck({
      clientId: requireBody(req.body.clientId, "clientId"),
      deckId: String(req.params.deckId),
      title: req.body.title,
      expectedRevision: req.body.expectedRevision,
      intent: "Duplicate deck from UI",
    }));
  }));

  app.post("/api/decks/:deckId/memory", asyncHandler(async (req, res) => {
    res.json(await core.updateDeckMemory({
      clientId: requireBody(req.body.clientId, "clientId"),
      deckId: String(req.params.deckId),
      append: req.body.append,
      replace: req.body.replace,
      expectedRevision: req.body.expectedRevision,
      intent: "Update deck memory from UI",
    }));
  }));

  app.get("/api/decks/:deckId/validation", asyncHandler(async (req, res) => {
    const deck = await core.readDeck(requireQuery(req.query.clientId, "clientId"), String(req.params.deckId));
    res.json({ schemaVersion: 1, validationWarnings: core.validateDeck(deck) });
  }));

  app.post("/api/decks/:deckId/export", asyncHandler(async (req, res) => {
    res.json(await exportDeck(core, {
      clientId: requireBody(req.body.clientId, "clientId"),
      deckId: String(req.params.deckId),
      format: req.body.format,
    }));
  }));

  app.post("/api/decks/:deckId/slides", asyncHandler(async (req, res) => {
    res.json(await core.createSlide({
      clientId: requireBody(req.body.clientId, "clientId"),
      deckId: String(req.params.deckId),
      layoutId: req.body.layoutId,
      title: req.body.title,
      position: req.body.position,
      expectedRevision: req.body.expectedRevision,
      intent: "Create slide from UI",
    }));
  }));

  app.patch("/api/decks/:deckId/slides/:slideId", asyncHandler(async (req, res) => {
    res.json(await core.updateSlide({
      clientId: requireBody(req.body.clientId, "clientId"),
      deckId: String(req.params.deckId),
      slideId: String(req.params.slideId),
      patch: req.body.patch ?? {},
      expectedRevision: req.body.expectedRevision,
      intent: "Update slide from UI",
    }));
  }));

  app.delete("/api/decks/:deckId/slides/:slideId", asyncHandler(async (req, res) => {
    res.json(await core.deleteSlide({
      clientId: requireQuery(req.query.clientId, "clientId"),
      deckId: String(req.params.deckId),
      slideId: String(req.params.slideId),
      expectedRevision: stringQuery(req.query.expectedRevision),
      intent: "Delete slide from UI",
    }));
  }));

  app.post("/api/decks/:deckId/slides/reorder", asyncHandler(async (req, res) => {
    res.json(await core.reorderSlides({
      clientId: requireBody(req.body.clientId, "clientId"),
      deckId: String(req.params.deckId),
      slideIds: req.body.slideIds ?? [],
      expectedRevision: req.body.expectedRevision,
      intent: "Reorder slides from UI",
    }));
  }));

  app.post("/api/decks/:deckId/slides/:slideId/blocks", asyncHandler(async (req, res) => {
    res.json(await core.addBlock({
      clientId: requireBody(req.body.clientId, "clientId"),
      deckId: String(req.params.deckId),
      slideId: String(req.params.slideId),
      block: {
        type: String(req.body.type ?? req.body.block?.type ?? "text") as BlockType,
        ...(req.body.block ?? {}),
      },
      expectedRevision: req.body.expectedRevision,
      intent: "Add block from UI",
    }));
  }));

  app.patch("/api/decks/:deckId/slides/:slideId/blocks/:blockId", asyncHandler(async (req, res) => {
    res.json(await core.updateBlock({
      clientId: requireBody(req.body.clientId, "clientId"),
      deckId: String(req.params.deckId),
      slideId: String(req.params.slideId),
      blockId: String(req.params.blockId),
      patch: req.body.patch ?? {},
      expectedRevision: req.body.expectedRevision,
      intent: "Update block from UI",
    }));
  }));

  app.delete("/api/decks/:deckId/slides/:slideId/blocks/:blockId", asyncHandler(async (req, res) => {
    res.json(await core.deleteBlock({
      clientId: requireQuery(req.query.clientId, "clientId"),
      deckId: String(req.params.deckId),
      slideId: String(req.params.slideId),
      blockId: String(req.params.blockId),
      expectedRevision: stringQuery(req.query.expectedRevision),
      intent: "Delete block from UI",
    }));
  }));

  app.get("/api/decks/:deckId/assets", asyncHandler(async (req, res) => {
    res.json({ schemaVersion: 1, assets: await core.listAssets({ clientId: requireQuery(req.query.clientId, "clientId"), deckId: String(req.params.deckId) }) });
  }));

  app.post("/api/decks/:deckId/assets", asyncHandler(async (req, res) => {
    res.json(await core.addAsset({
      clientId: requireBody(req.body.clientId, "clientId"),
      deckId: String(req.params.deckId),
      fileName: req.body.fileName,
      mimeType: req.body.mimeType,
      dataBase64: req.body.dataBase64,
      kind: req.body.kind,
      altText: req.body.altText,
      prompt: req.body.prompt,
      expectedRevision: req.body.expectedRevision,
      intent: "Add asset from UI",
    }));
  }));

  app.patch("/api/decks/:deckId/assets/:assetId", asyncHandler(async (req, res) => {
    res.json(await core.replaceAsset({
      clientId: requireBody(req.body.clientId, "clientId"),
      deckId: String(req.params.deckId),
      assetId: String(req.params.assetId),
      fileName: req.body.fileName,
      mimeType: req.body.mimeType,
      dataBase64: requireBody(req.body.dataBase64, "dataBase64"),
      altText: req.body.altText,
      expectedRevision: req.body.expectedRevision,
      intent: "Replace asset from UI",
    }));
  }));

  app.delete("/api/decks/:deckId/assets/:assetId", asyncHandler(async (req, res) => {
    res.json(await core.deleteAsset({
      clientId: requireQuery(req.query.clientId, "clientId"),
      deckId: String(req.params.deckId),
      assetId: String(req.params.assetId),
      expectedRevision: stringQuery(req.query.expectedRevision),
      intent: "Delete asset from UI",
    }));
  }));

  app.get("/api/source-decks", asyncHandler(async (req, res) => {
    const clientId = requireQuery(req.query.clientId, "clientId");
    const clientRoot = await core.resolveClientRoot(clientId);
    const decksDir = path.join(clientRoot, "decks");
    const entries = await fs.readdir(decksDir, { withFileTypes: true }).catch(() => []);
    const decks = [] as Array<{ id: string; title: string; updatedAt: string; slideCount: number }>;
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const tsxPath = path.join(decksDir, entry.name, "deck.tsx");
      const metaPath = path.join(decksDir, entry.name, "deck.meta.json");
      try {
        await fs.access(tsxPath);
      } catch {
        continue;
      }
      let title = entry.name;
      let updatedAt = new Date().toISOString();
      try {
        const meta = JSON.parse(await fs.readFile(metaPath, "utf8")) as { title?: string; updatedAt?: string };
        if (meta.title) title = meta.title;
        if (meta.updatedAt) updatedAt = meta.updatedAt;
      } catch {
        // ignore — meta is optional
      }
      let slideCount = 0;
      try {
        const source = await readDeckSource(tsxPath);
        slideCount = source.slides.length;
      } catch {
        // ignore — broken decks still appear in the list
      }
      decks.push({ id: entry.name, title, updatedAt, slideCount });
    }
    res.json({ schemaVersion: 1, decks });
  }));

  app.get("/api/decks/:deckId/source", asyncHandler(async (req, res) => {
    const clientId = requireQuery(req.query.clientId, "clientId");
    const deckId = String(req.params.deckId);
    const deckRoot = await core.deckRoot(clientId, deckId);
    const file = await deckSourcePath(deckRoot);
    if (!file) {
      res.status(404).json({ error: "deck.tsx not found for deck", deckId });
      return;
    }
    const source = await readDeckSource(file);
    res.json({ schemaVersion: 1, source });
  }));

  app.patch("/api/decks/:deckId/source", asyncHandler(async (req, res) => {
    const clientId = requireBody(req.body.clientId, "clientId");
    const deckId = String(req.params.deckId);
    const deckRoot = await core.deckRoot(clientId, deckId);
    const file = await deckSourcePath(deckRoot);
    if (!file) {
      res.status(404).json({ error: "deck.tsx not found for deck", deckId });
      return;
    }
    const ref = {
      slideIndex: Number(req.body.slideIndex),
      propName: requireBody(req.body.propName, "propName"),
    };
    if (!Number.isInteger(ref.slideIndex) || ref.slideIndex < 0) {
      throw new Error("slideIndex must be a non-negative integer");
    }
    if (typeof req.body.value !== "string") {
      throw new Error("value must be a string");
    }
    const result = await patchDeckSource(file, { ref, value: req.body.value });
    res.json({ schemaVersion: 1, ...result });
  }));

  app.post("/api/decks/:deckId/source/reorder", asyncHandler(async (req, res) => {
    const clientId = requireBody(req.body.clientId, "clientId");
    const deckId = String(req.params.deckId);
    const deckRoot = await core.deckRoot(clientId, deckId);
    const file = await deckSourcePath(deckRoot);
    if (!file) {
      res.status(404).json({ error: "deck.tsx not found", deckId });
      return;
    }
    const order = Array.isArray(req.body.order) ? req.body.order.map((n: unknown) => Number(n)) : null;
    if (!order) throw new Error("order must be an array of integers");
    const source = await reorderDeckSlides(file, { order });
    res.json({ schemaVersion: 1, source });
  }));

  app.delete("/api/decks/:deckId/source/slides/:slideIndex", asyncHandler(async (req, res) => {
    const clientId = requireQuery(req.query.clientId, "clientId");
    const deckId = String(req.params.deckId);
    const slideIndex = Number(req.params.slideIndex);
    if (!Number.isInteger(slideIndex) || slideIndex < 0) throw new Error("slideIndex must be a non-negative integer");
    const deckRoot = await core.deckRoot(clientId, deckId);
    const file = await deckSourcePath(deckRoot);
    if (!file) {
      res.status(404).json({ error: "deck.tsx not found", deckId });
      return;
    }
    const source = await deleteDeckSlide(file, { slideIndex });
    res.json({ schemaVersion: 1, source });
  }));

  app.post("/api/decks/:deckId/source/slides", asyncHandler(async (req, res) => {
    const clientId = requireBody(req.body.clientId, "clientId");
    const deckId = String(req.params.deckId);
    const deckRoot = await core.deckRoot(clientId, deckId);
    const file = await deckSourcePath(deckRoot);
    if (!file) {
      res.status(404).json({ error: "deck.tsx not found", deckId });
      return;
    }
    const position = Number(req.body.position);
    const jsx = requireBody(req.body.jsx, "jsx");
    if (!Number.isInteger(position) || position < 0) throw new Error("position must be a non-negative integer");
    const source = await insertDeckSlide(file, { position, jsx });
    res.json({ schemaVersion: 1, source });
  }));

  app.post("/api/decks/:deckId/source/assets", asyncHandler(async (req, res) => {
    const clientId = requireBody(req.body.clientId, "clientId");
    const deckId = String(req.params.deckId);
    const fileName = String(req.body.fileName ?? "");
    const dataBase64 = String(req.body.dataBase64 ?? "");
    if (!fileName || !dataBase64) throw new Error("fileName and dataBase64 are required");
    if (fileName.includes("/") || fileName.includes("..") || fileName.startsWith(".")) {
      throw new Error("Invalid fileName");
    }
    const deckRoot = await core.deckRoot(clientId, deckId);
    const assetsDir = path.join(deckRoot, "assets");
    await fs.mkdir(assetsDir, { recursive: true });
    const ext = path.extname(fileName) || "";
    const stem = path.basename(fileName, ext).replace(/[^a-zA-Z0-9_-]/g, "_") || "asset";
    const stamp = Date.now().toString(36);
    const finalName = `${stem}-${stamp}${ext}`;
    const filePath = path.join(assetsDir, finalName);
    const buf = Buffer.from(dataBase64, "base64");
    await fs.writeFile(filePath, buf);
    const url = `/deck-assets/${encodeURIComponent(clientId)}/${encodeURIComponent(deckId)}/assets/${encodeURIComponent(finalName)}`;
    res.json({ schemaVersion: 1, fileName: finalName, url });
  }));

  app.get("/preview/:clientId/:deckId/bundle.js", asyncHandler(async (req, res) => {
    const clientId = String(req.params.clientId);
    const deckId = String(req.params.deckId);
    const deckRoot = await core.deckRoot(clientId, deckId);
    const file = await deckSourcePath(deckRoot);
    if (!file) {
      res.status(404).type("application/javascript").send(`throw new Error("deck.tsx not found");`);
      return;
    }
    try {
      const { js } = await bundleDeckSource(file);
      res.type("application/javascript").send(js);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).type("application/javascript").send(
        `throw new Error(${JSON.stringify(`Bundle failed: ${message}`)});`,
      );
    }
  }));

  app.get("/preview/:clientId/:deckId/bundle.css", asyncHandler(async (req, res) => {
    const clientId = String(req.params.clientId);
    const deckId = String(req.params.deckId);
    const deckRoot = await core.deckRoot(clientId, deckId);
    const file = await deckSourcePath(deckRoot);
    if (!file) {
      res.status(404).type("text/css").send(`/* deck.tsx not found */`);
      return;
    }
    try {
      const { css } = await bundleDeckSource(file);
      res.type("text/css").send(css);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).type("text/css").send(`/* Bundle failed: ${message.replace(/\*\//g, "*\\/")} */`);
    }
  }));

  app.get("/preview/:clientId/:deckId", (req, res) => {
    const clientId = String(req.params.clientId);
    const deckId = String(req.params.deckId);
    const slideIndex = req.query.slide !== undefined ? Number(req.query.slide) : undefined;
    res.type("text/html").send(previewHtml(clientId, deckId, { slideIndex }));
  });

  app.get("/preview/templates/:themeId/:variant/bundle.js", asyncHandler(async (req, res) => {
    const themeId = String(req.params.themeId);
    const variant = String(req.params.variant);
    try {
      const { js } = await bundleTemplateVariant(themeId, variant);
      res.type("application/javascript").send(js);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).type("application/javascript").send(
        `throw new Error(${JSON.stringify(`Template bundle failed: ${message}`)});`,
      );
    }
  }));

  app.get("/preview/templates/:themeId/:variant/bundle.css", asyncHandler(async (req, res) => {
    const themeId = String(req.params.themeId);
    const variant = String(req.params.variant);
    try {
      const { css } = await bundleTemplateVariant(themeId, variant);
      res.type("text/css").send(css);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).type("text/css").send(`/* Template bundle failed: ${message.replace(/\*\//g, "*\\/")} */`);
    }
  }));

  app.get("/preview/templates/:themeId/:variant", (req, res) => {
    const themeId = String(req.params.themeId);
    const variant = String(req.params.variant);
    res.type("text/html").send(templatePreviewHtml(themeId, variant));
  });

  app.post("/api/decks/:deckId/source/theme", asyncHandler(async (req, res) => {
    const clientId = requireBody(req.body.clientId, "clientId");
    const deckId = String(req.params.deckId);
    const themeId = requireBody(req.body.themeId, "themeId");
    const deckRoot = await core.deckRoot(clientId, deckId);
    const file = await deckSourcePath(deckRoot);
    if (!file) {
      res.status(404).json({ error: "deck.tsx not found", deckId });
      return;
    }
    const result = await changeDeckTheme(file, { themeId });
    res.json({ schemaVersion: 1, ...result });
  }));

  app.get("/api/source-themes", asyncHandler(async (_req, res) => {
    res.json({ schemaVersion: 1, themes: listThemeCatalog() });
  }));

  app.post("/api/decks/:deckId/source/export", asyncHandler(async (req, res) => {
    const clientId = requireBody(req.body.clientId, "clientId");
    const deckId = String(req.params.deckId);
    const format = req.body.format === "pdf" ? "pdf" : "html";
    const deckRoot = await core.deckRoot(clientId, deckId);
    const file = await deckSourcePath(deckRoot);
    if (!file) {
      res.status(404).json({ error: "deck.tsx not found", deckId });
      return;
    }
    const host = req.get("host") ?? `localhost:${port}`;
    const protocol = req.protocol || "http";
    const previewUrl = `${protocol}://${host}/preview/${encodeURIComponent(clientId)}/${encodeURIComponent(deckId)}`;
    const result = await exportDeckSource({
      previewUrl,
      deckRoot,
      format,
      stem: `${deckId}-${Date.now().toString(36)}`,
    });
    res.json({ schemaVersion: 1, path: result.path, format });
  }));

  app.get(/^\/deck-assets\/([^/]+)\/([^/]+)\/(.+)$/, asyncHandler(async (req, res) => {
    const params = req.params as unknown as Record<string, string>;
    const clientId = params[0] ?? "";
    const deckId = params[1] ?? "";
    const relPath = params[2] ?? "";
    if (!relPath || relPath.includes("..") || path.isAbsolute(relPath)) {
      res.status(400).json({ error: "Invalid asset path." });
      return;
    }
    const deckRoot = await core.deckRoot(clientId, deckId);
    const assetRoot = path.join(deckRoot, "assets");
    const candidate = path.resolve(deckRoot, relPath);
    const realAssetRoot = await fs.realpath(assetRoot);
    const realCandidate = await fs.realpath(candidate);
    const relative = path.relative(realAssetRoot, realCandidate);
    if (relative.startsWith("..") || path.isAbsolute(relative) || relative.startsWith(".")) {
      res.status(403).json({ error: "Asset path escapes the deck assets folder." });
      return;
    }
    res.sendFile(realCandidate);
  }));

  app.get(/^\/(?!api\/|preview\/|deck-assets\/).*/, (_req, res) => {
    res.sendFile(path.join(webDist, "index.html"));
  });

  const server = http.createServer(app);
  const port = await listen(server, options.port ?? Number(process.env.MICRO_KEYNOTE_PORT ?? 3456));
  const wss = new WebSocketServer({ server, path: "/events" });
  const broadcast = (event: unknown) => {
    const payload = JSON.stringify(event);
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) client.send(payload);
    }
  };
  core.events.on("deckChanged", broadcast);
  core.events.on("deckDeleted", broadcast);

  // Watch deck.tsx files across all registered clients. When Codex (or any
  // other editor) edits a deck source file, broadcast a deckSourceChanged
  // event so the UI iframe can refresh.
  const clientList = await core.listClients();
  const watchPaths: string[] = [];
  const clientRootMap = new Map<string, string>();
  for (const client of clientList) {
    try {
      const root = await core.resolveClientRoot(client.id);
      clientRootMap.set(root, client.id);
      watchPaths.push(path.join(root, "decks", "*", "deck.tsx"));
    } catch {
      // Skip unresolved clients; they'll be picked up on next restart once fixed.
    }
  }
  const sourceWatcher = chokidar.watch(watchPaths, {
    ignoreInitial: true,
    awaitWriteFinish: { stabilityThreshold: 80, pollInterval: 30 },
  });
  const onSourceChange = (changedPath: string) => {
    for (const [clientRoot, clientId] of clientRootMap) {
      const rel = path.relative(path.join(clientRoot, "decks"), changedPath);
      if (rel.startsWith("..") || path.isAbsolute(rel)) continue;
      const segments = rel.split(path.sep);
      const deckId = segments[0];
      if (!deckId) continue;
      broadcast({ type: "deckSourceChanged", clientId, deckId, file: changedPath });
      return;
    }
  };
  sourceWatcher.on("add", onSourceChange);
  sourceWatcher.on("change", onSourceChange);

  const url = `http://localhost:${port}`;
  if (options.launchBrowser !== false) openUrl(url);

  return {
    url,
    port,
    close: async () => {
      core.events.off("deckChanged", broadcast);
      core.events.off("deckDeleted", broadcast);
      await sourceWatcher.close();
      await closeExportBrowser();
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      runtimePromise = undefined;
    },
  };
}

function asyncHandler(fn: express.RequestHandler): express.RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      res.status(400).json({
        error: error instanceof Error ? error.message : String(error),
        details: error instanceof Error && "details" in error ? (error as Error & { details?: unknown }).details : undefined,
      });
    });
  };
}

async function listen(server: http.Server, preferredPort: number): Promise<number> {
  for (let port = preferredPort; port < preferredPort + 20; port += 1) {
    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (error: NodeJS.ErrnoException) => {
          server.off("listening", onListening);
          reject(error);
        };
        const onListening = () => {
          server.off("error", onError);
          resolve();
        };
        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(port, "127.0.0.1");
      });
      return port;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EADDRINUSE") throw error;
    }
  }
  throw new Error("No available qraftPptx runtime port found.");
}

function openUrl(url: string) {
  if (process.platform === "darwin") {
    const child = spawn("open", [url], { stdio: "ignore", detached: true });
    child.unref();
  }
}

function webUiDist() {
  const file = fileURLToPath(import.meta.url);
  const packageRoot = path.dirname(path.dirname(file));
  return path.resolve(packageRoot, "../web-ui/dist");
}

function requireQuery(value: unknown, label: string) {
  const text = stringQuery(value);
  if (!text) throw new Error(`Missing query parameter: ${label}`);
  return text;
}

function stringQuery(value: unknown) {
  return Array.isArray(value) ? String(value[0] ?? "") : value === undefined ? undefined : String(value);
}

function requireBody(value: unknown, label: string) {
  if (value === undefined || value === null || value === "") throw new Error(`Missing body field: ${label}`);
  return String(value);
}
