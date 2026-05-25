#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { MicroKeynoteCore, type BlockType } from "@micro-keynote/core";
import { exportDeck } from "@micro-keynote/exporters";
import { startMicroKeynoteRuntime } from "./runtime.js";
import { deckSourcePath, insertDeckSlide, listThemeCatalog } from "./deck-source.js";

const core = new MicroKeynoteCore();
await core.initialize();

const server = new McpServer({
  name: "qraftPptx",
  version: packageVersion(),
});

const JsonObject = z.record(z.unknown());
const OptionalJsonObject = JsonObject.optional();
const BlockTypeSchema = z.enum(["text", "image", "chart", "diagram", "shape", "table", "metric", "quote", "group", "placeholder"]);
const ExportFormatSchema = z.enum(["html", "pdf", "pptx"]);

register("list_clients", "List registered qraftPptx clients.", {}, true, async () => ({ clients: await core.listClients() }));
register("list_decks", "List decks for a registered client.", {
  clientId: z.string(),
}, true, async ({ clientId }) => core.listDecks(String(clientId)));
register("create_deck", "Create a deck in a registered client workspace.", {
  clientId: z.string(),
  title: z.string(),
  themeId: z.string().optional(),
  layoutId: z.string().optional(),
  intent: z.string().optional(),
}, false, async (args) => core.createDeck(args as never));
register("open_deck", "Open a deck and return its structured state, context, warnings, and preview URL.", {
  clientId: z.string(),
  deckId: z.string(),
}, true, async (args) => core.openDeck(args as never));
register("duplicate_deck", "Duplicate a deck.", {
  clientId: z.string(),
  deckId: z.string(),
  title: z.string().optional(),
  expectedRevision: z.string().optional(),
  intent: z.string().optional(),
}, false, async (args) => core.duplicateDeck(args as never));
register("delete_deck", "Delete a deck folder inside a registered client workspace.", {
  clientId: z.string(),
  deckId: z.string(),
  intent: z.string().optional(),
}, false, async (args) => core.deleteDeck(args as never));
register("rebuild_deck_index", "Rebuild a client's deck.index.json cache from deck.json files.", {
  clientId: z.string(),
}, false, async ({ clientId }) => core.rebuildDeckIndex(String(clientId)));

register("create_slide", "Create a slide from a normalized layout.", {
  clientId: z.string(),
  deckId: z.string(),
  layoutId: z.string().optional(),
  title: z.string().optional(),
  position: z.number().int().optional(),
  expectedRevision: z.string().optional(),
  intent: z.string().optional(),
}, false, async (args) => core.createSlide(args as never));
register("update_slide", "Update slide metadata such as title, notes, background, or layout.", {
  clientId: z.string(),
  deckId: z.string(),
  slideId: z.string(),
  patch: OptionalJsonObject,
  expectedRevision: z.string().optional(),
  intent: z.string().optional(),
}, false, async (args) => core.updateSlide({ ...(args as Record<string, unknown>), patch: (args.patch ?? {}) } as never));
register("delete_slide", "Delete a slide.", {
  clientId: z.string(),
  deckId: z.string(),
  slideId: z.string(),
  expectedRevision: z.string().optional(),
  intent: z.string().optional(),
}, false, async (args) => core.deleteSlide(args as never));
register("reorder_slides", "Reorder all slides by full slide ID list.", {
  clientId: z.string(),
  deckId: z.string(),
  slideIds: z.array(z.string()),
  expectedRevision: z.string().optional(),
  intent: z.string().optional(),
}, false, async (args) => core.reorderSlides(args as never));

register("add_block", "Add a structured block to a slide.", {
  clientId: z.string(),
  deckId: z.string(),
  slideId: z.string(),
  type: BlockTypeSchema,
  block: OptionalJsonObject,
  expectedRevision: z.string().optional(),
  intent: z.string().optional(),
}, false, async (args) => core.addBlock({
  clientId: String(args.clientId),
  deckId: String(args.deckId),
  slideId: String(args.slideId),
  block: { type: args.type as BlockType, ...(args.block as Record<string, unknown> | undefined ?? {}) } as never,
  expectedRevision: args.expectedRevision as string | undefined,
  intent: args.intent as string | undefined,
}));
register("update_block", "Update a structured block.", {
  clientId: z.string(),
  deckId: z.string(),
  slideId: z.string(),
  blockId: z.string(),
  patch: OptionalJsonObject,
  expectedRevision: z.string().optional(),
  intent: z.string().optional(),
}, false, async (args) => core.updateBlock({ ...(args as Record<string, unknown>), patch: (args.patch ?? {}) } as never));
register("delete_block", "Delete a block from a slide.", {
  clientId: z.string(),
  deckId: z.string(),
  slideId: z.string(),
  blockId: z.string(),
  expectedRevision: z.string().optional(),
  intent: z.string().optional(),
}, false, async (args) => core.deleteBlock(args as never));
register("move_block", "Move a block to a new x/y position.", {
  clientId: z.string(),
  deckId: z.string(),
  slideId: z.string(),
  blockId: z.string(),
  x: z.number(),
  y: z.number(),
  expectedRevision: z.string().optional(),
  intent: z.string().optional(),
}, false, async (args) => core.moveBlock(args as never));
register("resize_block", "Resize a block.", {
  clientId: z.string(),
  deckId: z.string(),
  slideId: z.string(),
  blockId: z.string(),
  width: z.number(),
  height: z.number(),
  expectedRevision: z.string().optional(),
  intent: z.string().optional(),
}, false, async (args) => core.resizeBlock(args as never));

register("list_assets", "List deck assets.", {
  clientId: z.string(),
  deckId: z.string(),
}, true, async (args) => ({ assets: await core.listAssets(args as never) }));
register("add_asset", "Add an uploaded/generated/placeholder asset. Use base64 data, not arbitrary file paths.", {
  clientId: z.string(),
  deckId: z.string(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  dataBase64: z.string().optional(),
  kind: z.enum(["upload", "generated", "placeholder"]).optional(),
  altText: z.string().optional(),
  prompt: z.string().optional(),
  expectedRevision: z.string().optional(),
  intent: z.string().optional(),
}, false, async (args) => core.addAsset(args as never));
register("replace_asset", "Replace an existing asset with base64 data.", {
  clientId: z.string(),
  deckId: z.string(),
  assetId: z.string(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  dataBase64: z.string(),
  altText: z.string().optional(),
  expectedRevision: z.string().optional(),
  intent: z.string().optional(),
}, false, async (args) => core.replaceAsset(args as never));
register("delete_asset", "Delete an asset and its local file.", {
  clientId: z.string(),
  deckId: z.string(),
  assetId: z.string(),
  expectedRevision: z.string().optional(),
  intent: z.string().optional(),
}, false, async (args) => core.deleteAsset(args as never));

register("ensure_context", "Ensure client context files exist for a registered client.", {
  clientId: z.string(),
}, false, async ({ clientId }) => ({ clientRoot: await core.ensureClientContext(String(clientId)) }));
register("read_context", "Read global, client, and optional deck context.", {
  clientId: z.string(),
  deckId: z.string().optional(),
}, true, async ({ clientId, deckId }) => core.readContext(String(clientId), deckId as string | undefined));
register("update_client_context", "Update client PRODUCT.md and/or DESIGN.md. Requires explicit user intent.", {
  clientId: z.string(),
  productMd: z.string().optional(),
  designMd: z.string().optional(),
  explicitUserIntent: z.literal(true),
}, false, async (args) => core.updateClientContext(args as never));
register("update_deck_memory", "Append or replace deck-specific memory.md.", {
  clientId: z.string(),
  deckId: z.string(),
  append: z.string().optional(),
  replace: z.string().optional(),
  expectedRevision: z.string().optional(),
  intent: z.string().optional(),
}, false, async (args) => core.updateDeckMemory(args as never));
register("list_layouts", "List normalized layout registry entries.", {}, true, async () => ({ layouts: await core.listLayouts() }));
register("list_themes", "List normalized theme registry entries.", {}, true, async () => ({ themes: await core.listThemes() }));
register(
  "list_source_variants",
  "List all slide variants for a React source deck theme. Returns purpose, density, required/optional props, and a ready-to-paste jsxTemplate. Call this before inserting slides with add_source_slide.",
  { themeId: z.string().optional() },
  true,
  async ({ themeId }) => {
    const catalog = listThemeCatalog();
    const result = themeId ? catalog.filter((c) => c.themeId === String(themeId)) : catalog;
    return { themes: result };
  },
);
register(
  "add_source_slide",
  "Insert a JSX slide into a React source deck (deck.tsx) at a given zero-based position. Use list_source_variants first to get the jsxTemplate, then fill in the required props.",
  {
    clientId: z.string(),
    deckId: z.string(),
    position: z.number().int().min(0),
    jsx: z.string(),
    intent: z.string().optional(),
  },
  false,
  async (args) => {
    const deckRoot = await core.deckRoot(String(args.clientId), String(args.deckId));
    const file = await deckSourcePath(deckRoot);
    if (!file) throw new Error(`deck.tsx not found for deck "${String(args.deckId)}"`);
    const source = await insertDeckSlide(file, { position: Number(args.position), jsx: String(args.jsx) });
    return { source };
  },
);
register("set_theme", "Set a deck theme by themeId.", {
  clientId: z.string(),
  deckId: z.string(),
  themeId: z.string(),
  expectedRevision: z.string().optional(),
  intent: z.string().optional(),
}, false, async (args) => core.setTheme(args as never));
register("validate_deck", "Validate a deck for missing assets, layout/theme issues, export support, and safety warnings.", {
  clientId: z.string(),
  deckId: z.string(),
}, true, async (args) => {
  const deck = await core.readDeck(String(args.clientId), String(args.deckId));
  return { validationWarnings: core.validateDeck(deck) };
});
register("export_deck", "Export deck from structured deck.json to html, pdf, or pptx.", {
  clientId: z.string(),
  deckId: z.string(),
  format: ExportFormatSchema,
}, false, async (args) => exportDeck(core, args as never));
register("launch_ui", "Launch the local qraftPptx browser UI.", {
  port: z.number().int().min(1024).max(65535).optional(),
  openBrowser: z.boolean().default(true),
}, false, async ({ port, openBrowser }) => {
  const runtime = await startMicroKeynoteRuntime({ core, port: port as number | undefined, launchBrowser: Boolean(openBrowser) });
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
  server.registerResource("clients", "qraftPptx://clients", {
    title: "qraftPptx Clients",
    mimeType: "application/json",
  }, async (uri) => resourceResult(uri.href, { clients: await core.listClients() }));

  server.registerResource("layouts", "qraftPptx://layouts", {
    title: "qraftPptx Layout Registry",
    mimeType: "application/json",
  }, async (uri) => resourceResult(uri.href, { layouts: await core.listLayouts() }));

  server.registerResource("themes", "qraftPptx://themes", {
    title: "qraftPptx Theme Registry",
    mimeType: "application/json",
  }, async (uri) => resourceResult(uri.href, { themes: await core.listThemes() }));

  server.registerResource("client-context", new ResourceTemplate("qraftPptx://client/{clientId}/context", { list: undefined }), {
    title: "qraftPptx Client Context",
    mimeType: "application/json",
  }, async (uri, variables) => resourceResult(uri.href, await core.readContext(String(variables.clientId))));

  server.registerResource("deck", new ResourceTemplate("qraftPptx://deck/{clientId}/{deckId}", { list: undefined }), {
    title: "qraftPptx Deck",
    mimeType: "application/json",
  }, async (uri, variables) => resourceResult(uri.href, await core.openDeck({ clientId: String(variables.clientId), deckId: String(variables.deckId) })));

  server.registerResource("slide", new ResourceTemplate("qraftPptx://deck/{clientId}/{deckId}/slide/{slideId}", { list: undefined }), {
    title: "qraftPptx Slide",
    mimeType: "application/json",
  }, async (uri, variables) => {
    const deck = await core.readDeck(String(variables.clientId), String(variables.deckId));
    const slide = deck.slides.find((item) => item.id === String(variables.slideId));
    return resourceResult(uri.href, { slide });
  });

  server.registerResource("validation", new ResourceTemplate("qraftPptx://validation/{clientId}/{deckId}", { list: undefined }), {
    title: "qraftPptx Deck Validation",
    mimeType: "application/json",
  }, async (uri, variables) => {
    const deck = await core.readDeck(String(variables.clientId), String(variables.deckId));
    return resourceResult(uri.href, { validationWarnings: core.validateDeck(deck) });
  });
}

function jsonResult(data: unknown) {
  return {
    structuredContent: data as Record<string, unknown>,
    content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
  };
}

function errorResult(error: unknown) {
  const payload =
    error instanceof Error
      ? { error: error.message, details: "details" in error ? (error as Error & { details?: unknown }).details : undefined }
      : { error: String(error) };
  return {
    isError: true,
    content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
  };
}

function resourceResult(uri: string, data: unknown) {
  return {
    contents: [{
      uri,
      mimeType: "application/json",
      text: JSON.stringify(data, null, 2),
    }],
  };
}

function titleFromName(name: string) {
  return name.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function packageVersion() {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const packageJson = JSON.parse(readFileSync(path.resolve(__dirname, "../package.json"), "utf8")) as { version?: string };
    return packageJson.version ?? "0.1.0";
  } catch {
    return "0.1.0";
  }
}
