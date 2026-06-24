#!/usr/bin/env node
import path from "node:path";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { AdPostersCore, PERFORMANCE_SIZE_PACK } from "@qraft-ad-posters/core";
import { exportAd } from "@qraft-ad-posters/exporters";
import { bundleCampaignSource } from "./campaign-preview.js";
import { startAdPostersRuntime } from "./runtime.js";

const core = new AdPostersCore();
await core.initialize();

const server = new McpServer({
  name: "ad-posters",
  version: "0.1.0",
});

const AdSizeInputSchema = z.object({
  id: z.string(),
  label: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  placement: z.string(),
});

register("list_clients", "List registered Ad Posters clients.", {}, true, async () => ({ clients: await core.listClients() }));
register("list_ad_sizes", "List the default performance ad sizes.", {}, true, async () => ({
  schemaVersion: 1,
  sizes: PERFORMANCE_SIZE_PACK,
}));
register("list_campaigns", "List campaigns for a registered client.", {
  clientId: z.string(),
}, true, async ({ clientId }) => core.listCampaigns(String(clientId)));
register("create_campaign", "Create a code-first React ad campaign.", {
  clientId: z.string(),
  title: z.string(),
  durationMs: z.number().int().positive().optional(),
  fps: z.number().int().positive().optional(),
  variants: z.array(AdSizeInputSchema).optional(),
}, false, async (args) => core.createCampaign(args as never));
register("open_campaign", "Open a campaign and return meta, React source, and preview URL.", {
  clientId: z.string(),
  campaignId: z.string(),
}, true, async ({ clientId, campaignId }) => core.openCampaign(String(clientId), String(campaignId)));
register("update_campaign_source", "Replace campaign.tsx source for a campaign after Codex creates or edits the React design.", {
  clientId: z.string(),
  campaignId: z.string(),
  source: z.string().min(1),
}, false, async (args) => core.updateCampaignSource(args as never));
register("validate_campaign", "Bundle campaign.tsx and report whether the browser preview source compiles.", {
  clientId: z.string(),
  campaignId: z.string(),
}, true, async ({ clientId, campaignId }) => {
  const campaignRoot = await core.campaignRoot(String(clientId), String(campaignId));
  const bundle = await bundleCampaignSource(path.join(campaignRoot, "campaign.tsx"));
  return {
    schemaVersion: 1,
    ok: true,
    campaignId,
    jsBytes: Buffer.byteLength(bundle.js, "utf8"),
    cssBytes: Buffer.byteLength(bundle.css, "utf8"),
  };
});
register("delete_campaign", "Delete a campaign folder inside a registered client workspace.", {
  clientId: z.string(),
  campaignId: z.string(),
}, false, async ({ clientId, campaignId }) => core.deleteCampaign(String(clientId), String(campaignId)));
register("rebuild_campaign_index", "Rebuild a client's campaign.index.json cache.", {
  clientId: z.string(),
}, false, async ({ clientId }) => core.rebuildCampaignIndex(String(clientId)));
register("read_context", "Read global and client ad-poster context.", {
  clientId: z.string(),
  campaignId: z.string().optional(),
}, true, async ({ clientId, campaignId }) => core.readContext(String(clientId), campaignId as string | undefined));
register("upload_asset", "Upload an asset into a campaign using base64 data.", {
  clientId: z.string(),
  campaignId: z.string(),
  fileName: z.string(),
  dataBase64: z.string(),
}, false, async (args) => core.uploadAsset(args as never));
register("export_campaign", "Export campaign variants to PNG or MP4. Does not post or publish ads.", {
  clientId: z.string(),
  campaignId: z.string(),
  format: z.enum(["png", "mp4"]),
  variantId: z.string().optional(),
  timeMs: z.number().int().nonnegative().optional(),
}, false, async ({ clientId, campaignId, format, variantId, timeMs }) => {
  const runtime = await startAdPostersRuntime({ core, launchBrowser: false });
  const opened = await core.openCampaign(String(clientId), String(campaignId));
  const previewUrl = `${runtime.url}/preview/${encodeURIComponent(String(clientId))}/${encodeURIComponent(String(campaignId))}`;
  return exportAd({
    previewUrl,
    campaignRoot: opened.campaignRoot,
    meta: opened.meta,
    format: format === "mp4" ? "mp4" : "png",
    variantId: variantId as string | undefined,
    timeMs: timeMs as number | undefined,
  });
});
register("launch_ui", "Launch the local Ad Posters browser UI.", {
  port: z.number().int().min(1024).max(65535).optional(),
  openBrowser: z.boolean().default(true),
}, false, async ({ port, openBrowser }) => {
  const runtime = await startAdPostersRuntime({ core, port: port as number | undefined, launchBrowser: Boolean(openBrowser) });
  return { url: runtime.url, port: runtime.port };
});

registerResources();

await server.connect(new StdioServerTransport());

function register(
  name: string,
  description: string,
  inputSchema: Record<string, z.ZodTypeAny>,
  readOnly: boolean,
  handler: (args: Record<string, unknown>) => Promise<unknown>,
) {
  server.registerTool(
    name,
    {
      title: titleFromName(name),
      description,
      inputSchema,
      annotations: {
        readOnlyHint: readOnly,
        destructiveHint: !readOnly,
        idempotentHint: readOnly,
        openWorldHint: false,
      },
    },
    async (args) => {
      try {
        return jsonResult(await handler(args as Record<string, unknown>));
      } catch (error) {
        return errorResult(error);
      }
    },
  );
}

function registerResources() {
  server.registerResource("clients", "ad-posters://clients", {
    title: "Ad Posters Clients",
    mimeType: "application/json",
  }, async (uri) => resourceResult(uri.href, { clients: await core.listClients() }));

  server.registerResource("sizes", "ad-posters://sizes", {
    title: "Ad Posters Default Sizes",
    mimeType: "application/json",
  }, async (uri) => resourceResult(uri.href, { schemaVersion: 1, sizes: PERFORMANCE_SIZE_PACK }));

  server.registerResource("client-context", new ResourceTemplate("ad-posters://client/{clientId}/context", { list: undefined }), {
    title: "Ad Posters Client Context",
    mimeType: "application/json",
  }, async (uri, variables) => resourceResult(uri.href, await core.readContext(String(variables.clientId))));

  server.registerResource("campaign", new ResourceTemplate("ad-posters://campaign/{clientId}/{campaignId}", { list: undefined }), {
    title: "Ad Posters Campaign",
    mimeType: "application/json",
  }, async (uri, variables) => resourceResult(uri.href, await core.openCampaign(String(variables.clientId), String(variables.campaignId))));
}

function jsonResult(data: unknown) {
  return {
    structuredContent: data as Record<string, unknown>,
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

function resourceResult(uri: string, data: unknown) {
  return {
    contents: [{ uri, mimeType: "application/json", text: JSON.stringify(data, null, 2) }],
  };
}

function titleFromName(name: string) {
  return name.split("_").map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`).join(" ");
}
