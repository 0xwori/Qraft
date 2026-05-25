import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, PanelRight, Plus, Trash2, Upload, X, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonoEyebrow } from "@/components/ui/mono-eyebrow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { readFileBase64 } from "@/api/client";
import {
  deleteSourceSlide,
  exportDeckSource,
  getDeckSource,
  insertSourceSlide,
  listSourceThemes,
  patchDeckSource,
  reorderSourceSlides,
  uploadSourceAsset,
  type DeckSource,
  type DeckSourceProp,
  type ThemeCatalogEntry,
  type VariantMeta,
} from "@/api/deckSource";

export interface SourceEditorPageProps {
  clientId: string;
  deckId: string;
  title: string;
  onBack: () => void;
}

interface VariantTemplate {
  label: string;
  variant: string;
  jsx: string;
}

// Sidebar is w-60 = 240px; with px-2 content = 224px wide thumbnails
const THUMB_SCALE = 224 / 1920;
const THUMB_H = Math.round(1080 * THUMB_SCALE);
// Picker 2-column grid: (224 - 16 padding - 8 gap) / 2 = 100px per card
const PICKER_SCALE = 100 / 1920;

function variantsFromCatalog(theme: ThemeCatalogEntry | undefined): VariantTemplate[] {
  if (!theme?.variantMeta?.length) return [];
  return theme.variantMeta.map((m: VariantMeta) => ({
    label: `${theme.namespace}.${m.variant}`,
    variant: m.variant,
    jsx: m.jsxTemplate,
  }));
}

function isImageProp(name: string): boolean {
  const n = name.toLowerCase();
  return n === "image" || n === "src" || n === "imageurl" || n.endsWith("image");
}

export function SourceEditorPage({ clientId, deckId, title, onBack }: SourceEditorPageProps) {
  const [source, setSource] = useState<DeckSource | null>(null);
  const [selectedSlideIndex, setSelectedSlideIndex] = useState(0);
  const [showInsertPicker, setShowInsertPicker] = useState(false);
  const [dragSlideIndex, setDragSlideIndex] = useState<number | null>(null);
  const [themes, setThemes] = useState<ThemeCatalogEntry[]>([]);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    listSourceThemes().then(setThemes).catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await getDeckSource(clientId, deckId);
        if (!cancelled) setSource(next);
      } catch (err) {
        if (!cancelled) toast.error(err instanceof Error ? err.message : String(err));
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [clientId, deckId]);

  useEffect(() => {
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${location.host}/events`);
    socket.onmessage = (event) => {
      let payload: { type?: string; clientId?: string; deckId?: string };
      try {
        payload = JSON.parse(event.data);
      } catch {
        return;
      }
      if (payload.type !== "deckSourceChanged") return;
      if (payload.clientId !== clientId || payload.deckId !== deckId) return;
      void refreshSource();
      reloadIframe();
    };
    return () => socket.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, deckId]);

  async function refreshSource() {
    try {
      const next = await getDeckSource(clientId, deckId);
      setSource(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  function reloadIframe() {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const url = buildPreviewUrl(clientId, deckId, selectedSlideIndex, Date.now());
    iframe.src = url;
  }

  async function handlePropChange(slideIndex: number, propName: string, value: string) {
    try {
      const next = await patchDeckSource({ clientId, deckId, slideIndex, propName, value });
      setSource(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleImageUpload(slideIndex: number, propName: string, file: File) {
    try {
      const dataBase64 = await readFileBase64(file);
      const upload = await uploadSourceAsset({ clientId, deckId, fileName: file.name, dataBase64 });
      const next = await patchDeckSource({ clientId, deckId, slideIndex, propName, value: upload.url });
      setSource(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDelete(slideIndex: number) {
    try {
      const next = await deleteSourceSlide({ clientId, deckId, slideIndex });
      setSource(next);
      setSelectedSlideIndex((idx) => Math.max(0, Math.min(idx, next.slides.length - 1)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleInsert(variant: VariantTemplate, position: number) {
    try {
      const next = await insertSourceSlide({ clientId, deckId, position, jsx: variant.jsx });
      setSource(next);
      setSelectedSlideIndex(position);
      setShowInsertPicker(false);
      reloadIframe();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleDrop(targetIndex: number) {
    if (dragSlideIndex === null || !source || dragSlideIndex === targetIndex) {
      setDragSlideIndex(null);
      return;
    }
    const order = source.slides.map((s) => s.index);
    const [moved] = order.splice(dragSlideIndex, 1);
    order.splice(targetIndex, 0, moved);
    setDragSlideIndex(null);
    try {
      const next = await reorderSourceSlides({ clientId, deckId, order });
      setSource(next);
      setSelectedSlideIndex(targetIndex);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  async function handleExport(format: "html" | "pdf") {
    try {
      const result = await exportDeckSource({ clientId, deckId, format });
      toast.success(`Exported ${format.toUpperCase()}`, { description: result.path });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    }
  }

  const slides = source?.slides ?? [];
  const selectedSlide = slides[selectedSlideIndex] ?? slides[0];
  const previewUrl = useMemo(
    () => buildPreviewUrl(clientId, deckId, selectedSlideIndex),
    [clientId, deckId, selectedSlideIndex],
  );

  const currentNamespace = useMemo(() => {
    for (const s of slides) {
      const dot = s.component.indexOf(".");
      if (dot > 0) return s.component.slice(0, dot);
    }
    return themes[0]?.namespace ?? "Broadside";
  }, [slides, themes]);
  const currentTheme = useMemo(
    () => themes.find((t) => t.namespace === currentNamespace),
    [themes, currentNamespace],
  );
  const variants = useMemo(() => variantsFromCatalog(currentTheme), [currentTheme]);

  return (
    <main className="flex min-h-0 flex-1">
      <aside className="flex w-60 shrink-0 flex-col border-r border-ui-hairline bg-ui-canvas">
        <div className="flex flex-col gap-2 border-b border-ui-hairline p-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="self-start">
            <ChevronLeft className="h-4 w-4" /> Library
          </Button>
          <div className="text-sm font-medium leading-tight">{title}</div>
          <MonoEyebrow>Slides · {slides.length}</MonoEyebrow>
          <div className="rounded border border-ui-hairline bg-ui-canvas-soft px-2 py-1 text-xs text-ui-mute">
            {currentTheme?.namespace ?? currentNamespace}
          </div>
          <div className="flex gap-1">
            <Button size="sm" variant="ghost" className="flex-1" onClick={() => void handleExport("html")}>
              <Download className="h-3.5 w-3.5" /> HTML
            </Button>
            <Button size="sm" variant="ghost" className="flex-1" onClick={() => void handleExport("pdf")}>
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
          </div>
        </div>

        {showInsertPicker ? (
          /* ── Add-slide picker ── */
          <>
            <div className="flex items-center justify-between border-b border-ui-hairline px-3 py-2">
              <MonoEyebrow>Add slide</MonoEyebrow>
              <button
                onClick={() => setShowInsertPicker(false)}
                className="rounded p-0.5 text-ui-mute hover:bg-ui-canvas-soft hover:text-ui-ink"
                title="Cancel"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <ScrollArea className="min-h-0 flex-1">
              <div className="grid grid-cols-2 gap-2 p-2">
                {variants.map((v) => (
                  <button
                    key={v.variant}
                    onClick={() => void handleInsert(v, selectedSlideIndex + 1)}
                    className="group flex flex-col gap-1 rounded-md p-1 text-left hover:bg-ui-canvas-soft"
                  >
                    <div
                      className="w-full overflow-hidden rounded ring-1 ring-ui-hairline group-hover:ring-ui-ink/30"
                      style={{ aspectRatio: "16/9", position: "relative", background: "#0a0a0a" }}
                    >
                      {currentTheme ? (
                        <iframe
                          src={`/preview/templates/${encodeURIComponent(currentTheme.themeId)}/${encodeURIComponent(v.variant)}`}
                          style={{
                            position: "absolute", top: 0, left: 0,
                            width: 1920, height: 1080,
                            transform: `scale(${PICKER_SCALE})`,
                            transformOrigin: "top left",
                            border: "none", pointerEvents: "none",
                          }}
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <span className="truncate px-0.5 text-[10px] text-ui-mute group-hover:text-ui-ink">
                      {v.variant}
                    </span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          /* ── Slide thumbnail rail ── */
          <>
            <ScrollArea className="min-h-0 flex-1 px-2 py-2">
              <div className="flex flex-col gap-1.5">
                {slides.map((slide) => (
                  <div
                    key={slide.index}
                    draggable
                    onDragStart={() => setDragSlideIndex(slide.index)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => void handleDrop(slide.index)}
                    onClick={() => setSelectedSlideIndex(slide.index)}
                    className={`group cursor-pointer select-none overflow-hidden rounded-md ring-2 transition-shadow ${
                      slide.index === selectedSlideIndex
                        ? "ring-blue-500 shadow-md"
                        : "ring-transparent hover:ring-ui-hairline"
                    } ${dragSlideIndex === slide.index ? "opacity-40" : ""}`}
                  >
                    {/* Thumbnail */}
                    <div
                      style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", position: "relative", background: "#111" }}
                    >
                      <iframe
                        src={`/preview/${encodeURIComponent(clientId)}/${encodeURIComponent(deckId)}?slide=${slide.index}`}
                        style={{
                          position: "absolute", top: 0, left: 0,
                          width: 1920, height: 1080,
                          transform: `scale(${THUMB_SCALE})`,
                          transformOrigin: "top left",
                          border: "none", pointerEvents: "none",
                        }}
                        loading="lazy"
                      />
                      <span className="absolute bottom-1 left-1.5 select-none text-[9px] text-white/50">
                        {slide.index + 1}
                      </span>
                      <button
                        className="absolute right-1 top-1 rounded bg-black/50 p-0.5 opacity-0 transition group-hover:opacity-100"
                        onClick={(e) => { e.stopPropagation(); void handleDelete(slide.index); }}
                        title="Delete slide"
                      >
                        <Trash2 className="h-3 w-3 text-white" />
                      </button>
                    </div>
                    {/* Label */}
                    <div className="bg-ui-canvas px-2 py-1 text-[10px] text-ui-mute">
                      {slide.component.split(".")[1] ?? slide.component}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t border-ui-hairline p-2">
              <Button size="sm" variant="secondary" className="w-full" onClick={() => setShowInsertPicker(true)}>
                <Plus className="h-3.5 w-3.5" /> Add slide
              </Button>
            </div>
          </>
        )}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-[#404040]">
        <div className="flex flex-1 items-center justify-center overflow-hidden p-6">
          <div
            className="relative shadow-[0_8px_48px_rgba(0,0,0,0.7)] ring-1 ring-black/20"
            style={{
              width: "min(100%, calc((100dvh - 12rem) * 16 / 9))",
              maxWidth: "100%",
              maxHeight: "100%",
              aspectRatio: "16 / 9",
            }}
          >
            <iframe
              ref={iframeRef}
              src={previewUrl}
              title="Deck preview"
              className="absolute inset-0 h-full w-full border-0"
            />
          </div>
        </div>
        <div className="flex h-7 shrink-0 items-center justify-center gap-4 border-t border-white/10 text-[11px] text-white/40 select-none">
          <span>Slide {selectedSlideIndex + 1} / {slides.length}</span>
          <span className="opacity-50">·</span>
          <span>{currentTheme?.themeId ?? "—"}</span>
        </div>
      </section>

      {/* Inspector drawer */}
      <aside
        className={`flex shrink-0 flex-col border-l border-ui-hairline bg-ui-canvas transition-[width] duration-200 overflow-hidden ${
          inspectorOpen ? "w-80" : "w-9"
        }`}
      >
        {inspectorOpen ? (
          <>
            <div className="flex items-center justify-between border-b border-ui-hairline px-3 py-2">
              <div>
                <MonoEyebrow>Inspector</MonoEyebrow>
                {selectedSlide ? (
                  <div className="mt-1 text-sm font-medium leading-tight">{selectedSlide.component}</div>
                ) : null}
              </div>
              <button
                onClick={() => setInspectorOpen(false)}
                className="rounded p-1 text-ui-mute hover:bg-ui-canvas-soft hover:text-ui-ink"
                title="Collapse inspector"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <ScrollArea className="min-h-0 flex-1 p-3">
              <div className="space-y-3">
                {selectedSlide?.props.map((prop) => (
                  <PropEditor
                    key={prop.name}
                    prop={prop}
                    onChange={(next) => handlePropChange(selectedSlide.index, prop.name, next)}
                    onUpload={(file) => handleImageUpload(selectedSlide.index, prop.name, file)}
                  />
                ))}
                {selectedSlide && selectedSlide.props.length === 0 ? (
                  <div className="text-xs text-ui-mute">No props on this slide.</div>
                ) : null}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center pt-2">
            <button
              onClick={() => setInspectorOpen(true)}
              className="rounded p-1.5 text-ui-mute hover:bg-ui-canvas-soft hover:text-ui-ink"
              title="Open inspector"
            >
              <PanelRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </aside>
    </main>
  );
}

function buildPreviewUrl(clientId: string, deckId: string, slideIndex: number, cacheBust?: number) {
  const params = new URLSearchParams({ slide: String(Math.max(0, slideIndex)) });
  if (cacheBust !== undefined) params.set("t", String(cacheBust));
  return `/preview/${encodeURIComponent(clientId)}/${encodeURIComponent(deckId)}?${params.toString()}`;
}

function PropEditor({
  prop,
  onChange,
  onUpload,
}: {
  prop: DeckSourceProp;
  onChange: (value: string) => void;
  onUpload: (file: File) => void;
}) {
  const [draft, setDraft] = useState(prop.value ?? "");
  useEffect(() => {
    setDraft(prop.value ?? "");
  }, [prop.value]);

  if (prop.kind !== "string" || prop.value === null) {
    return (
      <div className="space-y-1">
        <label className="text-xs uppercase tracking-wider text-ui-foreground-muted">
          {prop.name}
        </label>
        <div className="rounded border border-dashed border-ui-hairline p-2 text-xs text-ui-foreground-muted">
          Complex expression — edit in deck.tsx directly
        </div>
      </div>
    );
  }

  const isLong = (prop.value ?? "").length > 80;
  const imageLike = isImageProp(prop.name);

  return (
    <div className="space-y-1">
      <label htmlFor={`prop-${prop.name}`} className="text-xs uppercase tracking-wider text-ui-foreground-muted">
        {prop.name}
      </label>
      {isLong ? (
        <Textarea
          id={`prop-${prop.name}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft !== prop.value) onChange(draft);
          }}
          rows={3}
        />
      ) : (
        <Input
          id={`prop-${prop.name}`}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft !== prop.value) onChange(draft);
          }}
        />
      )}
      {imageLike ? (
        <label className="mt-1 flex cursor-pointer items-center gap-1.5 text-xs text-ui-foreground-muted hover:text-ui-foreground">
          <Upload className="h-3 w-3" />
          Upload image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUpload(file);
              e.target.value = "";
            }}
          />
        </label>
      ) : null}
    </div>
  );
}
