/**
 * Figma extractor stub — Phase 3 implementation.
 * Returns an empty evidence bundle.
 */

import type { EvidenceBundle } from "@qraft/brandkit-core";

export async function extractFigma(
  _fileKey: string,
  _pat: string,
  _assetsDir: string,
  _tokensStudioJsonPath?: string,
): Promise<EvidenceBundle> {
  return {
    source: "figma",
    extractedAt: new Date().toISOString(),
    colors: {},
    typography: {},
    spacing: {},
    assets: [],
  };
}
