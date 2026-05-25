import { useEffect, useMemo, useState } from "react";
import type { Deck, DeckBlock, LayoutDefinition, ThemeDefinition } from "@micro-keynote/core";
import { Layout, Loader2 } from "lucide-react";
import { Toaster, toast } from "sonner";
import { api, deleteDeck as deleteDeckApi, listClients, listDecks, listLayouts, listThemes, openDeck, readFileBase64, type Client, type DeckSummary } from "@/api/client";
import { listSourceDecks } from "@/api/deckSource";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MonoEyebrow } from "@/components/ui/mono-eyebrow";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TooltipProvider } from "@/components/ui/tooltip";
import { EditorPage } from "@/components/editor/EditorPage";
import { SourceEditorPage } from "@/components/editor/SourceEditorPage";
import { LibraryPage } from "@/components/library/LibraryPage";
import { MasterTemplatesPage } from "@/components/master-templates/MasterTemplatesPage";
import { MasterTemplateDetailPage } from "@/components/master-templates/MasterTemplateDetailPage";

export default function App() {
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("tapwise");
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [deckPreviews, setDeckPreviews] = useState<Record<string, Deck>>({});
  const [deck, setDeck] = useState<Deck | null>(null);
  const [layouts, setLayouts] = useState<LayoutDefinition[]>([]);
  const [themes, setThemes] = useState<ThemeDefinition[]>([]);
  const [query, setQuery] = useState("");
  const [selectedSlideId, setSelectedSlideId] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [dragSlideId, setDragSlideId] = useState("");
  const [busy, setBusy] = useState(true);
  const [status, setStatus] = useState("Ready");
  const [sourceDeck, setSourceDeck] = useState<{ clientId: string; deckId: string; title: string } | null>(null);
  const [mastersView, setMastersView] = useState<{ themeId: string | null } | null>(null);

  const selectedSlide = useMemo(() => deck?.slides.find((slide) => slide.id === selectedSlideId) ?? deck?.slides[0], [deck, selectedSlideId]);
  const selectedBlock = selectedSlide?.blocks.find((block) => block.id === selectedBlockId);

  useEffect(() => {
    void bootstrap();
  }, []);

  useEffect(() => {
    if (clientId) void refreshDecks(clientId);
  }, [clientId]);

  useEffect(() => {
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${location.host}/events`);
    socket.onmessage = (event) => {
      const payload = JSON.parse(event.data) as { type: string; clientId: string; deckId: string };
      if (payload.clientId === clientId) void refreshDecks(clientId);
      if (deck && payload.deckId === deck.id) void reloadOpenDeck(deck.clientId, deck.id);
    };
    return () => socket.close();
  }, [clientId, deck?.id, selectedBlockId, selectedSlideId]);

  async function bootstrap() {
    try {
      setBusy(true);
      const [clientPayload, layoutPayload, themePayload] = await Promise.all([listClients(), listLayouts(), listThemes()]);
      setClients(clientPayload.clients);
      setLayouts(layoutPayload.layouts);
      setThemes(themePayload.themes);
      const params = new URLSearchParams(location.search);
      const paramClient = params.get("clientId");
      const paramDeck = params.get("deckId");
      const firstClient = paramClient ?? clientPayload.clients[0]?.id ?? "tapwise";
      setClientId(firstClient);
      await refreshDecks(firstClient);
      if (paramDeck) await loadDeck(firstClient, paramDeck);
      const pathname = location.pathname;
      const templatesMatch = pathname.match(/^\/templates(?:\/([^/]+))?\/?$/);
      if (templatesMatch) {
        setMastersView({ themeId: templatesMatch[1] ? decodeURIComponent(templatesMatch[1]) : null });
      }
    } catch (error) {
      notifyError(error);
    } finally {
      setBusy(false);
    }
  }

  async function refreshDecks(nextClientId = clientId) {
    const [payload, sourceDecks] = await Promise.all([
      listDecks(nextClientId),
      listSourceDecks(nextClientId).catch(() => []),
    ]);
    const sourceSummaries: DeckSummary[] = sourceDecks
      .filter((src) => !payload.decks.some((d) => d.id === src.id))
      .map((src) => ({
        id: src.id,
        title: src.title,
        themeId: "source",
        slideCount: src.slideCount,
        revision: "source",
        updatedAt: src.updatedAt,
      }));
    setDecks([...payload.decks, ...sourceSummaries]);
    const previewEntries = await Promise.all(payload.decks.slice(0, 12).map(async (summary) => {
      try {
        const opened = await openDeck(nextClientId, summary.id);
        return [summary.id, opened.deck] as const;
      } catch {
        return undefined;
      }
    }));
    setDeckPreviews(Object.fromEntries(previewEntries.filter(Boolean) as Array<readonly [string, Deck]>));
  }

  async function createDeck() {
    try {
      const result = await api<{ data: Deck }>("/api/decks", {
        method: "POST",
        body: { clientId, title: "Untitled Presentations deck", themeId: "soft-editorial" },
      });
      await refreshDecks(clientId);
      await loadDeck(clientId, result.data.id);
    } catch (error) {
      notifyError(error);
    }
  }

  async function loadDeck(nextClientId: string, deckId: string) {
    // React-source decks have a deck.tsx; fall through to the AST-driven
    // SourceEditorPage when present, else the legacy block-model EditorPage.
    try {
      const probe = await fetch(`/api/decks/${encodeURIComponent(deckId)}/source?clientId=${encodeURIComponent(nextClientId)}`);
      if (probe.ok) {
        const data = (await probe.json()) as { source: { file: string } };
        const summary = decks.find((d) => d.id === deckId);
        setSourceDeck({ clientId: nextClientId, deckId, title: summary?.title ?? deckId });
        setDeck(null);
        setStatus(`Opened ${summary?.title ?? deckId}`);
        history.replaceState(null, "", `/editor?clientId=${encodeURIComponent(nextClientId)}&deckId=${encodeURIComponent(deckId)}`);
        void data;
        return;
      }
    } catch {
      // ignore — fall through to legacy editor
    }
    const payload = await openDeck(nextClientId, deckId);
    setSourceDeck(null);
    applyDeck(payload.deck);
    setStatus(`Opened ${payload.deck.title}`);
    history.replaceState(null, "", `/editor?clientId=${encodeURIComponent(nextClientId)}&deckId=${encodeURIComponent(deckId)}`);
  }

  async function reloadOpenDeck(nextClientId: string, deckId: string) {
    const payload = await openDeck(nextClientId, deckId);
    applyDeck(payload.deck);
  }

  function applyDeck(nextDeck: Deck) {
    setDeck(nextDeck);
    setSelectedSlideId((current) => nextDeck.slides.some((slide) => slide.id === current) ? current : nextDeck.slides[0]?.id ?? "");
    setSelectedBlockId((current) => nextDeck.slides.some((slide) => slide.blocks.some((block) => block.id === current)) ? current : "");
  }

  async function mutate(endpoint: string, body: Record<string, unknown>, method = "POST") {
    if (!deck) return undefined;
    const payload = await api<{ data?: Deck }>(endpoint, {
      method,
      body: { ...body, clientId: deck.clientId, expectedRevision: deck.revision },
    });
    await reloadOpenDeck(deck.clientId, deck.id);
    setStatus("Saved");
    return payload;
  }

  async function addSlide(layoutId: string) {
    if (!deck) return;
    try {
      await mutate(`/api/decks/${deck.id}/slides`, { layoutId, title: "New slide" });
    } catch (error) {
      notifyError(error);
    }
  }

  async function deleteSlide(slideId: string) {
    if (!deck) return;
    try {
      await api(`/api/decks/${deck.id}/slides/${slideId}?clientId=${deck.clientId}&expectedRevision=${deck.revision}`, { method: "DELETE" });
      await reloadOpenDeck(deck.clientId, deck.id);
    } catch (error) {
      notifyError(error);
    }
  }

  async function addBlock(type: DeckBlock["type"]) {
    if (!deck || !selectedSlide) return;
    try {
      await mutate(`/api/decks/${deck.id}/slides/${selectedSlide.id}/blocks`, { type, block: blockDefaults(type) });
    } catch (error) {
      notifyError(error);
    }
  }

  async function updateBlock(blockId: string, patch: Record<string, unknown>) {
    if (!deck || !selectedSlide) return;
    try {
      await mutate(`/api/decks/${deck.id}/slides/${selectedSlide.id}/blocks/${blockId}`, { patch }, "PATCH");
    } catch (error) {
      notifyError(error);
    }
  }

  async function updateSlide(patch: Record<string, unknown>) {
    if (!deck || !selectedSlide) return;
    try {
      await mutate(`/api/decks/${deck.id}/slides/${selectedSlide.id}`, { patch }, "PATCH");
    } catch (error) {
      notifyError(error);
    }
  }

  async function deleteSelectedBlock() {
    if (!deck || !selectedSlide || !selectedBlock) return;
    try {
      await api(`/api/decks/${deck.id}/slides/${selectedSlide.id}/blocks/${selectedBlock.id}?clientId=${deck.clientId}&expectedRevision=${deck.revision}`, { method: "DELETE" });
      setSelectedBlockId("");
      await reloadOpenDeck(deck.clientId, deck.id);
    } catch (error) {
      notifyError(error);
    }
  }

  async function setTheme(themeId: string) {
    if (!deck) return;
    try {
      await mutate(`/api/decks/${deck.id}/theme`, { themeId });
    } catch (error) {
      notifyError(error);
    }
  }

  async function setDeckThemeFor(deckId: string, themeId: string) {
    const summary = decks.find((entry) => entry.id === deckId);
    if (!summary) return;
    try {
      await api(`/api/decks/${deckId}/theme`, {
        method: "POST",
        body: { clientId, themeId, expectedRevision: summary.revision },
      });
      await refreshDecks(clientId);
      setStatus(`Theme updated for ${summary.title}`);
    } catch (error) {
      notifyError(error);
    }
  }

  async function deleteDeckFromLibrary(deckId: string) {
    const summary = decks.find((entry) => entry.id === deckId);
    const title = summary?.title ?? deckId;
    if (!window.confirm(`Delete "${title}"? This removes the deck folder from the library.`)) return;
    try {
      await deleteDeckApi(clientId, deckId);
      if (deck?.id === deckId) setDeck(null);
      if (sourceDeck?.deckId === deckId) setSourceDeck(null);
      setDeckPreviews((current) => {
        const next = { ...current };
        delete next[deckId];
        return next;
      });
      await refreshDecks(clientId);
      setStatus(`Deleted ${title}`);
      history.replaceState(null, "", "/");
    } catch (error) {
      notifyError(error);
    }
  }

  function showLibrary() {
    setMastersView(null);
    setDeck(null);
    setSourceDeck(null);
    history.replaceState(null, "", "/");
  }

  async function reorderSlide(targetSlideId: string) {
    if (!deck || !dragSlideId || dragSlideId === targetSlideId) return;
    const slideIds = deck.slides.map((slide) => slide.id).filter((id) => id !== dragSlideId);
    const targetIndex = slideIds.indexOf(targetSlideId);
    slideIds.splice(targetIndex, 0, dragSlideId);
    setDragSlideId("");
    try {
      await mutate(`/api/decks/${deck.id}/slides/reorder`, { slideIds });
    } catch (error) {
      notifyError(error);
    }
  }

  async function uploadForSelectedBlock(file: File) {
    if (!deck || !selectedSlide || !selectedBlock) return;
    try {
      const dataBase64 = await readFileBase64(file);
      const result = await mutate(`/api/decks/${deck.id}/assets`, {
        fileName: file.name,
        mimeType: file.type,
        dataBase64,
        kind: "upload",
        altText: "altText" in selectedBlock ? selectedBlock.altText ?? file.name : file.name,
      });
      const nextDeck = result?.data;
      const asset = nextDeck?.assets[nextDeck.assets.length - 1];
      if (asset) await updateBlock(selectedBlock.id, { assetId: asset.id, altText: asset.altText ?? file.name });
    } catch (error) {
      notifyError(error);
    }
  }

  async function exportCurrent(format: "html" | "pdf" | "pptx") {
    if (!deck) return;
    try {
      setStatus(`Exporting ${format.toUpperCase()}`);
      const result = await api<{ path: string; validationWarnings: unknown[] }>(`/api/decks/${deck.id}/export`, {
        method: "POST",
        body: { clientId: deck.clientId, format },
      });
      setStatus(`Exported ${format.toUpperCase()}`);
      toast.success(`Exported ${format.toUpperCase()}`, { description: result.path });
    } catch (error) {
      notifyError(error);
    }
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col bg-ui-canvas-soft text-ui-ink">
        <header className="flex h-16 shrink-0 items-center gap-4 border-b border-ui-hairline bg-ui-canvas px-5">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-nav bg-ui-ink text-ui-on-primary">
              <Layout className="h-3.5 w-3.5" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-ui-ink">Presentations</span>
          </div>
          <span className="hidden h-5 w-px bg-ui-hairline md:block" />
          <div className="hidden items-center gap-2 md:flex">
            <MonoEyebrow>Client</MonoEyebrow>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="h-8 w-44"><SelectValue /></SelectTrigger>
              <SelectContent>{clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          {deck && (
            <>
              <span className="hidden h-5 w-px bg-ui-hairline md:block" />
              <Badge variant="mono">{deck.title}</Badge>
              <span className="text-xs text-ui-mute">rev {deck.revision}</span>
            </>
          )}
          <div className="flex-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={showLibrary}
          >
            Library
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setMastersView({ themeId: null });
              setDeck(null);
              setSourceDeck(null);
              history.replaceState(null, "", "/templates");
            }}
          >
            Master Templates
          </Button>
          <div className="flex items-center gap-2 text-xs text-ui-body">
            {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-ui-mute" />}
            <span className="hidden md:inline">{status}</span>
          </div>
        </header>
        {mastersView ? (
          mastersView.themeId ? (
            <MasterTemplateDetailPage
              themeId={mastersView.themeId}
              onBack={() => { setMastersView({ themeId: null }); history.replaceState(null, "", "/templates"); }}
              onSelectTheme={(themeId) => { setMastersView({ themeId }); history.replaceState(null, "", `/templates/${encodeURIComponent(themeId)}`); }}
            />
          ) : (
            <MasterTemplatesPage
              onSelectTheme={(themeId) => { setMastersView({ themeId }); history.replaceState(null, "", `/templates/${encodeURIComponent(themeId)}`); }}
              onBack={() => { setMastersView(null); history.replaceState(null, "", "/"); }}
            />
          )
        ) : sourceDeck ? (
          <SourceEditorPage
            clientId={sourceDeck.clientId}
            deckId={sourceDeck.deckId}
            title={sourceDeck.title}
            onBack={() => { setSourceDeck(null); history.replaceState(null, "", "/"); }}
          />
        ) : deck ? (
          <EditorPage
            deck={deck}
            layouts={layouts}
            themes={themes}
            selectedSlideId={selectedSlide?.id ?? ""}
            selectedBlockId={selectedBlockId}
            dragSlideId={dragSlideId}
            onBack={() => { setDeck(null); history.replaceState(null, "", "/"); }}
            onSelectSlide={(slideId) => { setSelectedSlideId(slideId); setSelectedBlockId(""); }}
            onSelectBlock={setSelectedBlockId}
            onSetDragSlide={setDragSlideId}
            onReorderSlide={reorderSlide}
            onAddSlide={addSlide}
            onDeleteSlide={deleteSlide}
            onAddBlock={addBlock}
            onUpdateSlide={(patch) => void updateSlide(patch)}
            onUpdateBlock={updateBlock}
            onDeleteBlock={() => void deleteSelectedBlock()}
            onSetTheme={(themeId) => void setTheme(themeId)}
            onUpload={(file) => void uploadForSelectedBlock(file)}
            onExport={(format) => void exportCurrent(format)}
          />
        ) : (
          <LibraryPage
            decks={decks}
            previews={deckPreviews}
            query={query}
            themes={themes}
            layouts={layouts}
            activeDeckId={undefined}
            onQuery={setQuery}
            onCreate={() => void createDeck()}
            onOpen={(deckId) => void loadDeck(clientId, deckId)}
            onDeleteDeck={(deckId) => void deleteDeckFromLibrary(deckId)}
            onSetDeckTheme={(deckId, themeId) => void setDeckThemeFor(deckId, themeId)}
          />
        )}
      </div>
      <Toaster richColors position="bottom-right" />
    </TooltipProvider>
  );
}

function blockDefaults(type: DeckBlock["type"]) {
  if (type === "chart") return { chartType: "bar", title: "Chart", data: [{ name: "A", value: 40 }, { name: "B", value: 64 }], encoding: { x: "name", y: "value" }, frame: { x: 160, y: 180, width: 760, height: 360 } };
  if (type === "diagram") return { source: "flowchart LR\nA[Start] --> B[Next]", frame: { x: 160, y: 180, width: 760, height: 360 } };
  if (type === "image") return { altText: "Image placeholder", prompt: "Describe the image to generate or upload.", frame: { x: 760, y: 160, width: 360, height: 360 } };
  if (type === "metric") return { value: "42%", label: "Metric", description: "Add the implication.", frame: { x: 160, y: 160, width: 320, height: 220 } };
  if (type === "quote") return { quote: "Add a memorable statement.", attribution: "Source", frame: { x: 160, y: 180, width: 720, height: 260 } };
  return { text: "New text", textRole: "body", frame: { x: 160, y: 160, width: 520, height: 160 } };
}

function notifyError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  toast.error(message);
}
