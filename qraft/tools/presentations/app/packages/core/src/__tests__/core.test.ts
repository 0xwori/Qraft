import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MicroKeynoteCore, MicroKeynoteError } from "../index.js";

let tempRoot: string;
let core: MicroKeynoteCore;

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), "Presentations-"));
  core = new MicroKeynoteCore({ centralRoot: path.join(tempRoot, "qraft", "tools", "presentations"), defaultPort: 3456 });
  await core.initialize();
});

afterEach(async () => {
  await rm(tempRoot, { recursive: true, force: true });
});

describe("MicroKeynoteCore", () => {
  it("creates Tapwise context, deck JSON, revisions, logs, and index entries", async () => {
    const created = await core.createDeck({ clientId: "tapwise", title: "Test Deck" });
    const deck = created.data!;

    expect(deck.schemaVersion).toBe(1);
    expect(deck.slides).toHaveLength(1);
    expect(created.revisionBefore).toBe("0000");
    expect(created.revisionAfter).toBe("0001");

    const opened = await core.openDeck({ clientId: "tapwise", deckId: deck.id });
    expect(opened.deck.id).toBe(deck.id);

    const index = await core.listDecks("tapwise");
    expect(index.decks.some((item) => item.id === deck.id)).toBe(true);
  });

  it("serializes mutations and rejects stale destructive edits", async () => {
    const created = await core.createDeck({ clientId: "tapwise", title: "Mutation Deck" });
    const deck = created.data!;
    const slideId = deck.slides[0]!.id;

    const updated = await core.addBlock({
      clientId: "tapwise",
      deckId: deck.id,
      slideId,
      block: { type: "text", text: "Hello" },
      expectedRevision: deck.revision,
    });
    expect(updated.revisionAfter).toBe("0002");

    await expect(core.deleteSlide({
      clientId: "tapwise",
      deckId: deck.id,
      slideId,
      expectedRevision: "0001",
    })).rejects.toBeInstanceOf(MicroKeynoteError);
  });

  it("rejects unregistered clients and unsafe deck ids", async () => {
    await expect(core.listDecks("Unknown")).rejects.toBeInstanceOf(MicroKeynoteError);
    await expect(core.openDeck({ clientId: "tapwise", deckId: "../escape" })).rejects.toBeInstanceOf(MicroKeynoteError);
  });

  it("prevents registry roots from escaping the Qraft root", async () => {
    await writeFile(
      path.join(core.workspaceRoot, "client.registry.json"),
      JSON.stringify({ schemaVersion: 1, clients: [{ id: "BAD", name: "Bad", root: "../../../../.." }] }),
    );
    await expect(core.listDecks("BAD")).rejects.toBeInstanceOf(MicroKeynoteError);
  });

  it("rejects symlink-style client roots that point into app source through registry validation", async () => {
    const appLink = path.join(tempRoot, "projects", "tapwise", "tools", "presentations");
    await rm(path.dirname(appLink), { recursive: true, force: true });
    await mkdir(core.appRoot, { recursive: true });
    await mkdir(path.dirname(appLink), { recursive: true });
    await symlink(core.appRoot, appLink);
    await expect(core.ensureClientContext("tapwise")).rejects.toBeInstanceOf(MicroKeynoteError);
  });
});
