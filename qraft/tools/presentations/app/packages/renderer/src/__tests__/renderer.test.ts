import { describe, expect, it } from "vitest";
import type { Deck, LayoutDefinition, ThemeDefinition } from "@micro-keynote/core";
import { renderDeckHtml, resolveDeckRenderScene } from "../index.js";

const theme: ThemeDefinition = {
  schemaVersion: 1,
  id: "test-theme",
  name: "Test Theme",
  sourceTemplateId: "test",
  colors: {
    bg: "#ffffff",
    primary: "#0055ff",
    text: "#111111",
    muted: "#666666",
    card: "#f3f5ff",
    border: "#cbd5ff",
  },
  typography: { display: "Inter", body: "Inter", mono: "monospace" },
  spacing: { radius: 8 },
  exportCompatibility: { html: "native", pdf: "native", pptx: "native" },
};

const layout: LayoutDefinition = {
  schemaVersion: 1,
  id: "cover",
  name: "Cover",
  purpose: "test",
  slots: [],
  defaultBlocks: [],
  themeTokens: [],
  exportCompatibility: { html: "native", pdf: "native", pptx: "native" },
};

const deck: Deck = {
  schemaVersion: 1,
  id: "deck-1",
  clientId: "tapwise",
  title: "Renderer Test",
  themeId: "test-theme",
  revision: "0003",
  createdAt: "2026-05-20T00:00:00.000Z",
  updatedAt: "2026-05-20T00:00:00.000Z",
  slides: [{
    id: "slide-1",
    layoutId: "cover",
    title: "Slide 1",
    createdAt: "2026-05-20T00:00:00.000Z",
    updatedAt: "2026-05-20T00:00:00.000Z",
    blocks: [{
      id: "block-title",
      type: "text",
      text: "Same visual source",
      textRole: "title",
      frame: { x: 80, y: 80, width: 640, height: 120 },
      style: {},
      exportCompatibility: { html: "native", pdf: "native", pptx: "native" },
      createdAt: "2026-05-20T00:00:00.000Z",
      updatedAt: "2026-05-20T00:00:00.000Z",
    }],
  }],
  assets: [],
  metadata: {
    productContextSource: "client",
    designContextSource: "client",
    importedTemplateIds: ["test-theme"],
  },
};

describe("renderer", () => {
  it("resolves a stable render scene from deck.json data", () => {
    const scene = resolveDeckRenderScene(deck, { themes: [theme], layouts: [layout], assetBasePath: ".." });
    expect(scene.deckRevision).toBe("0003");
    expect(scene.theme.colors.primary).toBe("#0055ff");
    expect(scene.slides[0]?.blocks[0]?.frame).toEqual({ x: 80, y: 80, width: 640, height: 120 });
    expect(scene.slides[0]?.blocks[0]?.textContent).toBe("Same visual source");
  });

  it("renders standalone HTML from the same resolved scene", () => {
    const scene = resolveDeckRenderScene(deck, { themes: [theme], layouts: [layout], assetBasePath: ".." });
    const html = renderDeckHtml(scene, { standalone: true });
    expect(html).toContain('data-deck-id="deck-1"');
    expect(html).toContain('data-block-id="block-title"');
    expect(html).toContain("Same visual source");
    expect(html).toContain("--mk-primary: #0055ff");
  });
});
