import type { Deck, DeckBlock, LayoutDefinition, ThemeDefinition } from "@micro-keynote/core";
import { BarChart3, ChevronLeft, Download, FileText, Image, LayoutDashboard, Shapes, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MonoEyebrow } from "@/components/ui/mono-eyebrow";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SlideCanvas } from "@/components/editor/SlideCanvas";
import { Inspector } from "@/components/inspector/Inspector";
import { SlidePreview } from "@/components/slide-renderer/SlidePreview";
import { ThemePicker } from "@/components/library/ThemePicker";
import { cn } from "@/lib/utils";

export function EditorPage({
  deck,
  layouts,
  themes,
  selectedSlideId,
  selectedBlockId,
  dragSlideId,
  onBack,
  onSelectSlide,
  onSelectBlock,
  onSetDragSlide,
  onReorderSlide,
  onAddSlide,
  onDeleteSlide,
  onAddBlock,
  onUpdateSlide,
  onUpdateBlock,
  onDeleteBlock,
  onSetTheme,
  onUpload,
  onExport,
}: {
  deck: Deck;
  layouts: LayoutDefinition[];
  themes: ThemeDefinition[];
  selectedSlideId: string;
  selectedBlockId: string;
  dragSlideId: string;
  onBack: () => void;
  onSelectSlide: (slideId: string) => void;
  onSelectBlock: (blockId: string) => void;
  onSetDragSlide: (slideId: string) => void;
  onReorderSlide: (targetSlideId: string) => void;
  onAddSlide: (layoutId: string) => void;
  onDeleteSlide: (slideId: string) => void;
  onAddBlock: (type: DeckBlock["type"]) => void;
  onUpdateSlide: (patch: Record<string, unknown>) => void;
  onUpdateBlock: (blockId: string, patch: Record<string, unknown>) => Promise<void>;
  onDeleteBlock: () => void;
  onSetTheme: (themeId: string) => void;
  onUpload: (file: File) => void;
  onExport: (format: "html" | "pdf" | "pptx") => void;
}) {
  const selectedSlide = deck.slides.find((slide) => slide.id === selectedSlideId) ?? deck.slides[0];
  const selectedBlock = selectedSlide?.blocks.find((block) => block.id === selectedBlockId);
  return (
    <main className="flex min-h-0 flex-1">
      <aside className="flex w-60 shrink-0 flex-col border-r border-ui-hairline bg-ui-canvas">
        <div className="flex flex-col gap-2 border-b border-ui-hairline p-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="self-start">
            <ChevronLeft className="h-4 w-4" /> Library
          </Button>
          <MonoEyebrow>Add slide</MonoEyebrow>
          <Select onValueChange={onAddSlide}>
            <SelectTrigger className="h-8 min-w-0 flex-1"><SelectValue placeholder="Choose layout" /></SelectTrigger>
            <SelectContent>{layouts.map((layout) => <SelectItem key={layout.id} value={layout.id}>{layout.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="px-3 pt-3">
          <MonoEyebrow>Slides · {deck.slides.length}</MonoEyebrow>
        </div>
        <ScrollArea className="min-h-0 flex-1 px-3 py-2">
          <div className="space-y-2">
            {deck.slides.map((slide, index) => (
              <button
                key={slide.id}
                draggable
                onDragStart={() => onSetDragSlide(slide.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => onReorderSlide(slide.id)}
                onClick={() => onSelectSlide(slide.id)}
                className={cn(
                  "w-full rounded-md border p-2 text-left transition",
                  slide.id === selectedSlide?.id
                    ? "border-ui-ink bg-ui-canvas-soft shadow-card-2"
                    : "border-ui-hairline bg-ui-canvas hover:border-ui-hairline-strong",
                  dragSlideId === slide.id && "opacity-60",
                )}
              >
                <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-wider text-ui-mute">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <span className="font-mono">{slide.layoutId}</span>
                </div>
                <SlidePreview deck={deck} slide={slide} themes={themes} layouts={layouts} scale={0.135} />
                <div className="mt-2 truncate text-xs font-medium text-ui-ink">{slide.title}</div>
              </button>
            ))}
          </div>
        </ScrollArea>
        {selectedSlide && (
          <div className="border-t border-ui-hairline p-3">
            <Button variant="destructive" size="sm" className="w-full" onClick={() => onDeleteSlide(selectedSlide.id)}>
              <Trash2 className="h-3.5 w-3.5" /> Delete slide
            </Button>
          </div>
        )}
      </aside>

      <section className="flex min-w-0 flex-1 flex-col bg-ui-canvas-soft">
        <div className="flex h-12 items-center gap-1 border-b border-ui-hairline bg-ui-canvas px-3">
          <MonoEyebrow className="mr-3">Insert</MonoEyebrow>
          <Button variant="ghost" size="nav" onClick={() => onAddBlock("text")}><FileText className="h-3.5 w-3.5" /> Text</Button>
          <Button variant="ghost" size="nav" onClick={() => onAddBlock("image")}><Image className="h-3.5 w-3.5" /> Image</Button>
          <Button variant="ghost" size="nav" onClick={() => onAddBlock("chart")}><BarChart3 className="h-3.5 w-3.5" /> Chart</Button>
          <Button variant="ghost" size="nav" onClick={() => onAddBlock("diagram")}><Shapes className="h-3.5 w-3.5" /> Diagram</Button>
          <Button variant="ghost" size="nav" onClick={() => onAddBlock("metric")}><LayoutDashboard className="h-3.5 w-3.5" /> Metric</Button>
          <div className="flex-1" />
          <ThemePicker themes={themes} themeId={deck.themeId} onSetTheme={onSetTheme} compact />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="nav-primary" size="nav"><Download className="h-3.5 w-3.5" /> Export</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onExport("html")}>HTML</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("pdf")}>PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onExport("pptx")}>PPTX</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="min-h-0 flex-1 bg-ui-ink p-6">
          <div className="mx-auto h-full w-full max-w-[1400px] overflow-hidden rounded-lg bg-ui-canvas shadow-card-5">
            {selectedSlide && (
              <SlideCanvas
                deck={deck}
                slide={selectedSlide}
                themes={themes}
                layouts={layouts}
                selectedBlockId={selectedBlockId}
                onSelectBlock={onSelectBlock}
                onCommitBlock={onUpdateBlock}
              />
            )}
          </div>
        </div>
      </section>

      <Inspector
        slide={selectedSlide}
        block={selectedBlock}
        themes={themes}
        themeId={deck.themeId}
        layouts={layouts}
        onUpdateSlide={onUpdateSlide}
        onUpdateBlock={(patch) => selectedBlock && void onUpdateBlock(selectedBlock.id, patch)}
        onDeleteBlock={onDeleteBlock}
        onSetTheme={onSetTheme}
        onUpload={onUpload}
      />
    </main>
  );
}
