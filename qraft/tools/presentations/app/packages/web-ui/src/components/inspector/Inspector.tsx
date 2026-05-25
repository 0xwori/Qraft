import type { ReactNode } from "react";
import type { DeckBlock, LayoutDefinition, Slide, ThemeDefinition } from "@micro-keynote/core";
import { Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonoEyebrow } from "@/components/ui/mono-eyebrow";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { parseCsv } from "@/lib/csv";

export function Inspector({
  slide,
  block,
  themes,
  themeId,
  layouts,
  onUpdateSlide,
  onUpdateBlock,
  onDeleteBlock,
  onSetTheme,
  onUpload,
}: {
  slide?: Slide;
  block?: DeckBlock;
  themes: ThemeDefinition[];
  themeId?: string;
  layouts: LayoutDefinition[];
  onUpdateSlide: (patch: Record<string, unknown>) => void;
  onUpdateBlock: (patch: Record<string, unknown>) => void;
  onDeleteBlock: () => void;
  onSetTheme: (themeId: string) => void;
  onUpload: (file: File) => void;
}) {
  return (
    <aside className="flex min-h-0 w-80 shrink-0 flex-col border-l border-ui-hairline bg-ui-canvas">
      <div className="border-b border-ui-hairline px-4 py-3">
        <MonoEyebrow>Inspector</MonoEyebrow>
        <h2 className="ui-display-sm mt-1 text-ui-ink">{block ? blockHeading(block) : slide?.title ?? "Slide"}</h2>
      </div>
      <Tabs defaultValue="block" className="min-h-0 flex-1 overflow-hidden p-3">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="block">Block</TabsTrigger>
          <TabsTrigger value="slide">Slide</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>
        <TabsContent value="block" className="h-[calc(100%-44px)] overflow-auto pr-1">
          {block ? (
            <BlockFields block={block} onUpdate={onUpdateBlock} onDelete={onDeleteBlock} onUpload={onUpload} />
          ) : (
            <div className="rounded-md border border-dashed border-ui-hairline bg-ui-canvas-soft p-4 text-sm text-ui-body">
              Select a block to edit content, position, and export behavior.
            </div>
          )}
        </TabsContent>
        <TabsContent value="slide" className="space-y-3">
          {slide && (
            <>
              <Field label="Slide title"><Input value={slide.title} onChange={(event) => onUpdateSlide({ title: event.target.value })} /></Field>
              <Field label="Layout">
                <Select value={slide.layoutId} onValueChange={(layoutId) => onUpdateSlide({ layoutId })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{layouts.map((layout) => <SelectItem key={layout.id} value={layout.id}>{layout.name}</SelectItem>)}</SelectContent>
                </Select>
              </Field>
              <Field label="Background"><Input value={slide.background ?? ""} placeholder="Theme default" onChange={(event) => onUpdateSlide({ background: event.target.value })} /></Field>
            </>
          )}
        </TabsContent>
        <TabsContent value="theme" className="space-y-3">
          <Field label="Deck theme">
            <Select value={themeId} onValueChange={onSetTheme}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{themes.map((theme) => <SelectItem key={theme.id} value={theme.id}>{theme.name}</SelectItem>)}</SelectContent>
            </Select>
          </Field>
          {themes.find((item) => item.id === themeId) && (
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(themes.find((item) => item.id === themeId)!.colors).slice(0, 8).map(([name, value]) => (
                <div key={name} className="space-y-1">
                  <div className="h-9 rounded-md border border-ui-hairline" style={{ background: value }} />
                  <div className="truncate text-[10px] text-ui-mute">{name}</div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="notes">
          {slide && <Field label="Speaker notes"><Textarea value={slide.notes ?? ""} onChange={(event) => onUpdateSlide({ notes: event.target.value })} /></Field>}
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function blockHeading(block: DeckBlock): string {
  if (block.type === "text") return "Text block";
  if (block.type === "image") return "Image block";
  if (block.type === "chart") return "Chart block";
  if (block.type === "diagram") return "Diagram block";
  if (block.type === "metric") return "Metric block";
  if (block.type === "quote") return "Quote block";
  return "Block";
}

function BlockFields({ block, onUpdate, onDelete, onUpload }: {
  block: DeckBlock;
  onUpdate: (patch: Record<string, unknown>) => void;
  onDelete: () => void;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Badge variant="mono">{block.type}</Badge>
        <Badge variant={block.exportCompatibility.pptx === "native" ? "default" : "info"}>
          PPTX {block.exportCompatibility.pptx}
        </Badge>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {(["x", "y", "width", "height"] as const).map((key) => (
          <Field key={key} label={key.toUpperCase()}>
            <Input type="number" value={Math.round(block.frame[key])} onChange={(event) => onUpdate({ frame: { ...block.frame, [key]: Number(event.target.value) } })} />
          </Field>
        ))}
      </div>
      {block.type === "text" && <Field label="Text"><Textarea value={block.text} onChange={(event) => onUpdate({ text: event.target.value })} /></Field>}
      {block.type === "image" && (
        <>
          <Field label="Alt text"><Input value={block.altText ?? ""} onChange={(event) => onUpdate({ altText: event.target.value })} /></Field>
          <Field label="Prompt"><Textarea value={block.prompt ?? ""} onChange={(event) => onUpdate({ prompt: event.target.value })} /></Field>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-ui-hairline bg-ui-canvas px-3 py-2 text-sm text-ui-ink shadow-card-1 hover:bg-ui-canvas-soft">
            <Upload className="h-4 w-4" /> Upload image
            <input className="hidden" type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && onUpload(event.target.files[0])} />
          </label>
        </>
      )}
      {block.type === "chart" && (
        <>
          <Field label="Title"><Input value={block.title ?? ""} onChange={(event) => onUpdate({ title: event.target.value })} /></Field>
          <Field label="Data JSON"><Textarea value={JSON.stringify(block.data ?? [], null, 2)} onChange={(event) => {
            try { onUpdate({ data: JSON.parse(event.target.value) }); } catch { /* wait for valid JSON */ }
          }} /></Field>
          <Field label="Paste CSV"><Textarea placeholder="name,value" onBlur={(event) => {
            if (event.target.value.trim()) onUpdate({ data: parseCsv(event.target.value), encoding: { x: "name", y: "value" } });
          }} /></Field>
        </>
      )}
      {block.type === "diagram" && <Field label="Mermaid source"><Textarea value={block.source} onChange={(event) => onUpdate({ source: event.target.value })} /></Field>}
      {block.type === "metric" && (
        <>
          <Field label="Value"><Input value={block.value} onChange={(event) => onUpdate({ value: event.target.value })} /></Field>
          <Field label="Label"><Input value={block.label} onChange={(event) => onUpdate({ label: event.target.value })} /></Field>
          <Field label="Description"><Textarea value={block.description ?? ""} onChange={(event) => onUpdate({ description: event.target.value })} /></Field>
        </>
      )}
      {block.type === "quote" && (
        <>
          <Field label="Quote"><Textarea value={block.quote} onChange={(event) => onUpdate({ quote: event.target.value })} /></Field>
          <Field label="Attribution"><Input value={block.attribution ?? ""} onChange={(event) => onUpdate({ attribution: event.target.value })} /></Field>
        </>
      )}
      <Button variant="destructive" className="w-full" onClick={onDelete}><Trash2 className="h-4 w-4" /> Delete block</Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <MonoEyebrow className="block">{label}</MonoEyebrow>
      {children}
    </label>
  );
}
