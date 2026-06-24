import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chokidar from "chokidar";
import cors from "cors";
import express from "express";
import { WebSocketServer } from "ws";
import { AdPostersCore } from "@qraft-ad-posters/core";
import { closeExportBrowser, exportAd } from "@qraft-ad-posters/exporters";
import { bundleCampaignSource, previewHtml } from "./campaign-preview.js";

export interface RuntimeOptions {
  core?: AdPostersCore;
  port?: number;
  launchBrowser?: boolean;
}

export interface RuntimeHandle {
  url: string;
  port: number;
  close: () => Promise<void>;
}

let runtimePromise: Promise<RuntimeHandle> | undefined;

export async function startAdPostersRuntime(options: RuntimeOptions = {}): Promise<RuntimeHandle> {
  if (runtimePromise) return runtimePromise;
  runtimePromise = startRuntime(options);
  return runtimePromise;
}

async function startRuntime(options: RuntimeOptions): Promise<RuntimeHandle> {
  const core = options.core ?? new AdPostersCore({ defaultPort: options.port });
  await core.initialize();

  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "25mb" }));
  const webDist = webUiDist();
  app.use(express.static(webDist, { index: false }));

  app.get("/api/clients", asyncHandler(async (_req, res) => {
    res.json({ schemaVersion: 1, clients: await core.listClients() });
  }));

  app.get("/api/context/:clientId", asyncHandler(async (req, res) => {
    res.json(await core.readContext(String(req.params.clientId), stringQuery(req.query.campaignId)));
  }));

  app.get("/api/campaigns", asyncHandler(async (req, res) => {
    res.json(await core.listCampaigns(requireQuery(req.query.clientId, "clientId")));
  }));

  app.post("/api/campaigns", asyncHandler(async (req, res) => {
    res.json(await core.createCampaign({
      clientId: requireBody(req.body.clientId, "clientId"),
      title: String(req.body.title ?? "Untitled ad campaign"),
      durationMs: req.body.durationMs ? Number(req.body.durationMs) : undefined,
      fps: req.body.fps ? Number(req.body.fps) : undefined,
    }));
  }));

  app.get("/api/campaigns/:campaignId", asyncHandler(async (req, res) => {
    res.json(await core.openCampaign(requireQuery(req.query.clientId, "clientId"), String(req.params.campaignId)));
  }));

  app.put("/api/campaigns/:campaignId/source", asyncHandler(async (req, res) => {
    res.json(await core.updateCampaignSource({
      clientId: requireBody(req.body.clientId, "clientId"),
      campaignId: String(req.params.campaignId),
      source: requireBody(req.body.source, "source"),
    }));
  }));

  app.post("/api/campaigns/:campaignId/validate", asyncHandler(async (req, res) => {
    const clientId = requireBody(req.body.clientId, "clientId");
    const campaignId = String(req.params.campaignId);
    const campaignRoot = await core.campaignRoot(clientId, campaignId);
    const { bundleCampaignSource } = await import("./campaign-preview.js");
    const bundle = await bundleCampaignSource(path.join(campaignRoot, "campaign.tsx"));
    res.json({
      schemaVersion: 1,
      ok: true,
      campaignId,
      jsBytes: Buffer.byteLength(bundle.js, "utf8"),
      cssBytes: Buffer.byteLength(bundle.css, "utf8"),
    });
  }));

  app.delete("/api/campaigns/:campaignId", asyncHandler(async (req, res) => {
    res.json(await core.deleteCampaign(requireQuery(req.query.clientId, "clientId"), String(req.params.campaignId)));
  }));

  app.post("/api/campaigns/:campaignId/assets", asyncHandler(async (req, res) => {
    res.json(await core.uploadAsset({
      clientId: requireBody(req.body.clientId, "clientId"),
      campaignId: String(req.params.campaignId),
      fileName: requireBody(req.body.fileName, "fileName"),
      dataBase64: requireBody(req.body.dataBase64, "dataBase64"),
    }));
  }));

  app.post("/api/campaigns/:campaignId/export", asyncHandler(async (req, res) => {
    const clientId = requireBody(req.body.clientId, "clientId");
    const campaignId = String(req.params.campaignId);
    const opened = await core.openCampaign(clientId, campaignId);
    const host = req.get("host") ?? `localhost:${port}`;
    const protocol = req.protocol || "http";
    const previewUrl = `${protocol}://${host}/preview/${encodeURIComponent(clientId)}/${encodeURIComponent(campaignId)}`;
    res.json(await exportAd({
      previewUrl,
      campaignRoot: opened.campaignRoot,
      meta: opened.meta,
      variantId: req.body.variantId ? String(req.body.variantId) : undefined,
      format: req.body.format === "mp4" ? "mp4" : "png",
      timeMs: req.body.timeMs ? Number(req.body.timeMs) : undefined,
    }));
  }));

  app.get("/preview/:clientId/:campaignId/bundle.js", asyncHandler(async (req, res) => {
    const campaignRoot = await core.campaignRoot(String(req.params.clientId), String(req.params.campaignId));
    try {
      const { js } = await bundleCampaignSource(path.join(campaignRoot, "campaign.tsx"));
      res.type("application/javascript").send(js);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).type("application/javascript").send(`throw new Error(${JSON.stringify(`Bundle failed: ${message}`)});`);
    }
  }));

  app.get("/preview/:clientId/:campaignId/bundle.css", asyncHandler(async (req, res) => {
    const campaignRoot = await core.campaignRoot(String(req.params.clientId), String(req.params.campaignId));
    try {
      const { css } = await bundleCampaignSource(path.join(campaignRoot, "campaign.tsx"));
      res.type("text/css").send(css);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(500).type("text/css").send(`/* Bundle failed: ${message.replace(/\*\//g, "*\\/")} */`);
    }
  }));

  app.get("/preview/:clientId/:campaignId", (req, res) => {
    res.type("text/html").send(previewHtml(String(req.params.clientId), String(req.params.campaignId)));
  });

  app.get(/^\/campaign-assets\/([^/]+)\/([^/]+)\/(.+)$/, asyncHandler(async (req, res) => {
    const params = req.params as unknown as Record<string, string>;
    const clientId = params[0] ?? "";
    const campaignId = params[1] ?? "";
    const relPath = params[2] ?? "";
    const filePath = await core.resolveAssetPath(clientId, campaignId, relPath);
    res.sendFile(filePath);
  }));

  app.get(/^\/(?!api\/|preview\/|campaign-assets\/).*/, (_req, res) => {
    res.sendFile(path.join(webDist, "index.html"));
  });

  const server = http.createServer(app);
  const port = await listen(server, options.port ?? core.defaultPort);
  const wss = new WebSocketServer({ server, path: "/events" });
  const broadcast = (event: unknown) => {
    const payload = JSON.stringify(event);
    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) client.send(payload);
    }
  };
  core.events.on("campaignChanged", broadcast);
  core.events.on("campaignDeleted", broadcast);

  const watchPaths: string[] = [];
  const clientRootMap = new Map<string, string>();
  for (const client of await core.listClients()) {
    try {
      const root = await core.resolveClientRoot(client.id);
      clientRootMap.set(root, client.id);
      watchPaths.push(path.join(root, "campaigns", "*", "campaign.tsx"));
      watchPaths.push(path.join(root, "campaigns", "*", "campaign.meta.json"));
    } catch {
      // Skip unresolved clients.
    }
  }
  const watcher = chokidar.watch(watchPaths, { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 80, pollInterval: 30 } });
  const onSourceChange = async (changedPath: string) => {
    for (const [clientRoot, clientId] of clientRootMap) {
      const rel = path.relative(path.join(clientRoot, "campaigns"), changedPath);
      if (rel.startsWith("..") || path.isAbsolute(rel)) continue;
      const campaignId = rel.split(path.sep)[0];
      if (!campaignId) continue;
      await core.rebuildCampaignIndex(clientId).catch(() => undefined);
      broadcast({ type: "campaignSourceChanged", clientId, campaignId, file: changedPath });
      return;
    }
  };
  watcher.on("add", onSourceChange);
  watcher.on("change", onSourceChange);

  const url = `http://localhost:${port}`;
  if (options.launchBrowser !== false) openUrl(url);

  return {
    url,
    port,
    close: async () => {
      core.events.off("campaignChanged", broadcast);
      core.events.off("campaignDeleted", broadcast);
      await watcher.close();
      await closeExportBrowser();
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
      runtimePromise = undefined;
    },
  };
}

function asyncHandler(fn: express.RequestHandler): express.RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
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
  throw new Error("No available Ad Posters runtime port found.");
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
