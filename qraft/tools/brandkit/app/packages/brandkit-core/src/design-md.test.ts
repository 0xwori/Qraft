import { describe, it, expect } from "vitest";
import { emitDesignMd } from "./design-md.js";
import { resolveColorRoles } from "./contract.js";
import type { FusedTokenBundle } from "./dtcg.js";

const mockBundle: FusedTokenBundle = {
  fusedAt: "2026-05-29T00:00:00.000Z",
  sourcePriority: ["pptx"],
  colors: {
    bg: {
      $type: "color",
      $value: "#FFFFFF",
      $extensions: { brandkit: { source: "pptx", confidence: 0.95 } },
    },
    primary: {
      $type: "color",
      $value: "#0B1F3A",
      $extensions: { brandkit: { source: "pptx", confidence: 0.95 } },
    },
    accent: {
      $type: "color",
      $value: "#FF6B5E",
      $extensions: { brandkit: { source: "pptx", confidence: 0.9 } },
    },
    text: {
      $type: "color",
      $value: "#111111",
      $extensions: { brandkit: { source: "pptx", confidence: 0.9 } },
    },
  },
  typography: {
    display: {
      $type: "typography",
      $value: { fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: "5vw" },
      $extensions: { brandkit: { source: "pptx", confidence: 0.95 } },
    },
    body: {
      $type: "typography",
      $value: { fontFamily: "Georgia, serif", fontWeight: 400 },
      $extensions: { brandkit: { source: "pptx", confidence: 0.95 } },
    },
    mono: {
      $type: "typography",
      $value: { fontFamily: "JetBrains Mono, monospace" },
      $extensions: { brandkit: { source: "pptx", confidence: 0.5 } },
    },
  },
  spacing: {
    radius: {
      $type: "dimension",
      $value: 6,
      $extensions: { brandkit: { source: "pptx", confidence: 0.8 } },
    },
  },
};

describe("emitDesignMd", () => {
  it("emits valid YAML frontmatter containing color keys", () => {
    const { content } = emitDesignMd(mockBundle, {
      slug: "test-brand",
      name: "Test Brand",
    });
    expect(content).toContain("name: Test Brand");
    expect(content).toContain("#FFFFFF");
    expect(content).toContain("#0B1F3A");
    expect(content).toContain("#FF6B5E");
  });

  it("includes PROSE-TODO marker", () => {
    const { content } = emitDesignMd(mockBundle, {
      slug: "test-brand",
      name: "Test Brand",
    });
    expect(content).toContain("PROSE-TODO");
  });

  it("includes token-reference table with all color keys", () => {
    const { content } = emitDesignMd(mockBundle, {
      slug: "test-brand",
      name: "Test Brand",
    });
    expect(content).toContain("| `bg`");
    expect(content).toContain("| `primary`");
    expect(content).toContain("| `accent`");
  });

  it("reports covered and missing color roles", () => {
    const { coveredColorRoles, missingColorRoles } = emitDesignMd(mockBundle, {
      slug: "test-brand",
      name: "Test Brand",
    });
    expect(coveredColorRoles).toContain("bg");
    expect(coveredColorRoles).toContain("primary");
    expect(coveredColorRoles).toContain("accent");
    // secondary, card, border, etc. not in mock bundle → should be missing
    expect(missingColorRoles.length).toBeGreaterThan(0);
  });

  it("typography block includes display/body/mono", () => {
    const { content } = emitDesignMd(mockBundle, {
      slug: "test-brand",
      name: "Test Brand",
    });
    expect(content).toContain("Inter, sans-serif");
    expect(content).toContain("Georgia, serif");
  });
});

describe("resolveColorRoles (contract round-trip)", () => {
  it("maps bg, primary, accent, text roles from flat colors", () => {
    const flat = { bg: "#FFF", primary: "#123", accent: "#F00", text: "#000" };
    const roles = resolveColorRoles(flat);
    expect(roles.bg).toBe("#FFF");
    expect(roles.primary).toBe("#123");
    expect(roles.accent).toBe("#F00");
    expect(roles.text).toBe("#000");
  });

  it("resolves 'paper' to bg role via alias candidates", () => {
    const flat = { paper: "#FAFAFA" };
    const roles = resolveColorRoles(flat);
    expect(roles.bg).toBe("#FAFAFA");
  });

  it("resolves 'navy' to primary role via alias candidates", () => {
    const flat = { navy: "#13315C" };
    const roles = resolveColorRoles(flat);
    expect(roles.primary).toBe("#13315C");
  });
});
