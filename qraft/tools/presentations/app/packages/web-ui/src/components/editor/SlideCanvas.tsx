import { useMemo, useState } from "react";
import type { Deck, Frame, LayoutDefinition, Slide, ThemeDefinition } from "@micro-keynote/core";
import { renderScopedCss, renderSlideHtml, resolveDeckRenderScene, SLIDE_HEIGHT, SLIDE_WIDTH } from "@micro-keynote/renderer";
import { cn } from "@/lib/utils";

const SCALE = 0.625;
const GRID = 8;

export function SlideCanvas({
  deck,
  slide,
  themes,
  layouts,
  selectedBlockId,
  onSelectBlock,
  onCommitBlock,
}: {
  deck: Deck;
  slide: Slide;
  themes: ThemeDefinition[];
  layouts: LayoutDefinition[];
  selectedBlockId: string;
  onSelectBlock: (id: string) => void;
  onCommitBlock: (id: string, patch: Record<string, unknown>) => Promise<void>;
}) {
  const [drag, setDrag] = useState<{ id: string; startX: number; startY: number; frame: Frame; mode: "move" | "resize" } | null>(null);
  const [previewFrame, setPreviewFrame] = useState<Frame | null>(null);
  const renderSlide = useMemo(() => {
    const scene = resolveDeckRenderScene(deck, {
      themes,
      layouts,
      assetBasePath: `/deck-assets/${deck.clientId}/${deck.id}`,
      mode: "preview",
    });
    const found = scene.slides.find((item) => item.id === slide.id) ?? scene.slides[0];
    return found ? `<style>${renderScopedCss(scene.theme)}</style>${renderSlideHtml(found)}` : "";
  }, [deck, layouts, slide.id, themes]);

  const selectedBlock = slide.blocks.find((block) => block.id === selectedBlockId);
  const selectedFrame = previewFrame ?? selectedBlock?.frame;

  function pointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drag) return;
    const dx = (event.clientX - drag.startX) / SCALE;
    const dy = (event.clientY - drag.startY) / SCALE;
    if (drag.mode === "resize") {
      setPreviewFrame({
        ...drag.frame,
        width: Math.max(32, snap(drag.frame.width + dx)),
        height: Math.max(32, snap(drag.frame.height + dy)),
      });
      return;
    }
    setPreviewFrame({
      ...drag.frame,
      x: snap(drag.frame.x + dx),
      y: snap(drag.frame.y + dy),
    });
  }

  async function pointerUp() {
    if (!drag) return;
    const next = previewFrame;
    const id = drag.id;
    setDrag(null);
    setPreviewFrame(null);
    if (next) await onCommitBlock(id, { frame: next });
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>{slide.title}</span>
        <span>{Math.round(SCALE * 100)}% · snap {GRID}px</span>
      </div>
      <div className="grid min-h-0 flex-1 place-items-center overflow-auto rounded-md border border-border bg-[#1f1f1f] p-6">
        <div
          className="relative"
          style={{ width: SLIDE_WIDTH * SCALE, height: SLIDE_HEIGHT * SCALE }}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerLeave={pointerUp}
        >
          <div className="mk-viewer-scope origin-top-left" style={{ transform: `scale(${SCALE})`, width: SLIDE_WIDTH, height: SLIDE_HEIGHT }} dangerouslySetInnerHTML={{ __html: renderSlide }} />
          {slide.blocks.map((block) => (
            <button
              key={block.id}
              className={cn("absolute rounded-sm border border-transparent outline-none", selectedBlockId === block.id && "border-primary ring-2 ring-primary/25")}
              style={{
                left: (previewFrame && drag?.id === block.id ? previewFrame.x : block.frame.x) * SCALE,
                top: (previewFrame && drag?.id === block.id ? previewFrame.y : block.frame.y) * SCALE,
                width: (previewFrame && drag?.id === block.id ? previewFrame.width : block.frame.width) * SCALE,
                height: (previewFrame && drag?.id === block.id ? previewFrame.height : block.frame.height) * SCALE,
              }}
              onPointerDown={(event) => {
                event.stopPropagation();
                onSelectBlock(block.id);
                setDrag({ id: block.id, startX: event.clientX, startY: event.clientY, frame: { ...block.frame }, mode: "move" });
              }}
              aria-label={`Select ${block.type} block`}
            >
              {selectedBlockId === block.id && (
                <span
                  className="absolute -bottom-1.5 -right-1.5 h-3 w-3 rounded-sm border border-card bg-primary"
                  onPointerDown={(event) => {
                    event.stopPropagation();
                    setDrag({ id: block.id, startX: event.clientX, startY: event.clientY, frame: { ...block.frame }, mode: "resize" });
                  }}
                />
              )}
            </button>
          ))}
          {selectedFrame && (
            <div
              className="pointer-events-none absolute rounded-sm border border-primary/70"
              style={{ left: selectedFrame.x * SCALE, top: selectedFrame.y * SCALE, width: selectedFrame.width * SCALE, height: selectedFrame.height * SCALE }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function snap(value: number) {
  return Math.round(value / GRID) * GRID;
}
