import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AdPostersCore, PERFORMANCE_SIZE_PACK } from "./index";

describe("AdPostersCore", () => {
  it("creates a code-first campaign and rebuilds the campaign index", async () => {
    const centralRoot = await mkdtemp(path.join(os.tmpdir(), "ad-posters-core-"));
    await writeFile(
      path.join(centralRoot, "workspace", "client.registry.json"),
      JSON.stringify({
        schemaVersion: 1,
        clients: [{ id: "test", name: "Test", root: "client" }],
      }),
      { encoding: "utf8" },
    ).catch(async () => {
      await import("node:fs/promises").then((fs) => fs.mkdir(path.join(centralRoot, "workspace"), { recursive: true }));
      await writeFile(
        path.join(centralRoot, "workspace", "client.registry.json"),
        JSON.stringify({
          schemaVersion: 1,
          clients: [{ id: "test", name: "Test", root: "client" }],
        }),
        "utf8",
      );
    });

    const core = new AdPostersCore({ centralRoot });
    await core.initialize();
    const created = await core.createCampaign({ clientId: "test", title: "Study Help" });
    expect(created.meta.variants).toHaveLength(PERFORMANCE_SIZE_PACK.length);

    const opened = await core.openCampaign("test", created.meta.id);
    expect(opened.source).toContain("AdCampaign");
    expect(opened.source).toContain("Tapwise");

    const updated = await core.updateCampaignSource({
      clientId: "test",
      campaignId: created.meta.id,
      source: opened.source.replace("Probeer Tapwise", "Start oefenen"),
    });
    expect(updated.meta.revision).toBe("0002");

    const reopened = await core.openCampaign("test", created.meta.id);
    expect(reopened.source).toContain("Start oefenen");

    const index = await core.listCampaigns("test");
    expect(index.campaigns).toHaveLength(1);
    expect(index.campaigns[0]?.title).toBe("Study Help");
  });
});
