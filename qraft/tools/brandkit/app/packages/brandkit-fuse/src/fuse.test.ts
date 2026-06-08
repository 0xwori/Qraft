import { describe, it, expect } from "vitest";
import { fuseEvidence, buildCoverageReport } from "./fuse.js";
import type { EvidenceBundle } from "@qraft/brandkit-core";

const pptxBundle: EvidenceBundle = {
  source: "pptx",
  extractedAt: "2026-05-29T00:00:00.000Z",
  colors: {
    bg: { $type: "color", $value: "#FFFFFF", $extensions: { brandkit: { source: "pptx", confidence: 0.95 } } },
    primary: { $type: "color", $value: "#0B1F3A", $extensions: { brandkit: { source: "pptx", confidence: 0.95 } } },
    accent: { $type: "color", $value: "#FF6B5E", $extensions: { brandkit: { source: "pptx", confidence: 0.9 } } },
  },
  typography: {
    display: {
      $type: "typography",
      $value: { fontFamily: "Calibri Light" },
      $extensions: { brandkit: { source: "pptx", confidence: 0.9 } },
    },
  },
  spacing: {},
};

const websiteBundle: EvidenceBundle = {
  source: "website",
  extractedAt: "2026-05-29T00:00:00.000Z",
  colors: {
    // Website found a different primary — PPTX should win
    primary: { $type: "color", $value: "#AABBCC", $extensions: { brandkit: { source: "website", confidence: 0.6 } } },
    // Website also found muted which PPTX didn't have
    muted: { $type: "color", $value: "#888888", $extensions: { brandkit: { source: "website", confidence: 0.7 } } },
  },
  typography: {},
  spacing: {},
};

describe("fuseEvidence", () => {
  it("higher-priority source (pptx) wins over website for same key", () => {
    const fused = fuseEvidence([websiteBundle, pptxBundle]);
    expect(fused.colors.primary.$value).toBe("#0B1F3A"); // pptx wins
  });

  it("fills gaps from lower-priority source", () => {
    const fused = fuseEvidence([websiteBundle, pptxBundle]);
    expect(fused.colors.muted?.$value).toBe("#888888"); // website fills gap
  });

  it("always includes display/body/mono typography roles", () => {
    const fused = fuseEvidence([pptxBundle]);
    expect(fused.typography.display).toBeDefined();
    expect(fused.typography.body).toBeDefined();
    expect(fused.typography.mono).toBeDefined();
  });

  it("applies default fallback for missing typography roles", () => {
    const fused = fuseEvidence([pptxBundle]);
    // body and mono are not in pptxBundle, should have default fallbacks
    expect(fused.typography.body.$value.fontFamily).toBeTruthy();
    expect(fused.typography.mono.$value.fontFamily).toBeTruthy();
    // the defaults have low confidence
    expect(fused.typography.body.$extensions?.brandkit.confidence).toBeLessThan(0.5);
  });

  it("reports correct source priority order", () => {
    const fused = fuseEvidence([websiteBundle, pptxBundle]);
    expect(fused.sourcePriority[0]).toBe("pptx");
    expect(fused.sourcePriority[1]).toBe("website");
  });
});

describe("buildCoverageReport", () => {
  it("marks found color roles as found", () => {
    const fused = fuseEvidence([pptxBundle]);
    const report = buildCoverageReport(fused);
    const bgRole = report.colorRoles.find((r) => r.role === "bg");
    expect(bgRole?.found).toBe(true);
  });

  it("marks missing roles as not found", () => {
    const fused = fuseEvidence([pptxBundle]);
    const report = buildCoverageReport(fused);
    const secondaryRole = report.colorRoles.find((r) => r.role === "secondary");
    expect(secondaryRole?.found).toBe(false);
  });

  it("computes an overallConfidence between 0 and 1", () => {
    const fused = fuseEvidence([pptxBundle]);
    const report = buildCoverageReport(fused);
    expect(report.overallConfidence).toBeGreaterThanOrEqual(0);
    expect(report.overallConfidence).toBeLessThanOrEqual(1);
  });
});
