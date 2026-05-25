import type { Deck, LayoutDefinition, ThemeDefinition } from "@micro-keynote/core";
import { FileText, Plus, Search, Trash2 } from "lucide-react";
import type { DeckSummary } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HeroBand } from "@/components/ui/hero-band";
import { Input } from "@/components/ui/input";
import { MonoEyebrow } from "@/components/ui/mono-eyebrow";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SlidePreview } from "@/components/slide-renderer/SlidePreview";
import { ThemePicker } from "@/components/library/ThemePicker";
import { cn } from "@/lib/utils";

export function LibraryPage({
  decks,
  previews,
  query,
  themes,
  layouts,
  activeDeckId,
  onQuery,
  onCreate,
  onOpen,
  onDeleteDeck,
  onSetDeckTheme,
}: {
  decks: DeckSummary[];
  previews: Record<string, Deck>;
  query: string;
  themes: ThemeDefinition[];
  layouts: LayoutDefinition[];
  activeDeckId?: string;
  onQuery: (value: string) => void;
  onCreate: () => void;
  onOpen: (deckId: string) => void;
  onDeleteDeck?: (deckId: string) => void;
  onSetDeckTheme?: (deckId: string, themeId: string) => void;
}) {
  const lowered = query.toLowerCase();
  const filtered = decks.filter(
    (deck) => deck.title.toLowerCase().includes(lowered) || deck.id.includes(query),
  );
  const families = bucketByFamily(filtered);
  const tabs: Array<{ id: string; label: string }> = [
    { id: "all", label: `All · ${filtered.length}` },
    ...Object.entries(families).map(([id, items]) => ({ id, label: `${prettyFamily(id)} · ${items.length}` })),
  ];

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-ui-canvas-soft">
      <HeroBand
        eyebrow={<MonoEyebrow>Deck library</MonoEyebrow>}
        title={<>The decks you can open, restyle, and ship.</>}
        description="Local client decks, indexed from the Presentations workspace. Pick a theme on any card to swap its visual language without leaving the page."
        actions={
          <>
            <Button size="lg" onClick={onCreate}>
              <Plus className="h-4 w-4" /> Create deck
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <a href="#decks">Browse decks</a>
            </Button>
          </>
        }
      />

      <section id="decks" className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pt-10 pb-16">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <Tabs defaultValue="all">
            <TabsList variant="ghost" className="flex-wrap">
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} variant="ghost" value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="relative w-full md:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ui-mute" />
            <Input
              className="pl-9"
              value={query}
              onChange={(event) => onQuery(event.target.value)}
              placeholder="Search decks"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((deck) => {
            const preview = previews[deck.id];
            const isActive = activeDeckId === deck.id;
            return (
              <Card
                key={deck.id}
                variant={isActive ? "featured" : "default"}
                padding="sm"
                className={cn(
                  "group cursor-pointer transition-shadow hover:shadow-card-4",
                  isActive && "ring-1 ring-ui-ink",
                )}
                onClick={() => onOpen(deck.id)}
              >
                {preview?.slides[0] ? (
                  <SlidePreview
                    deck={preview}
                    slide={preview.slides[0]}
                    themes={themes}
                    layouts={layouts}
                    scale={0.205}
                    className="mb-3"
                  />
                ) : (
                  <div
                    className={cn(
                      "mb-3 grid h-[147px] place-items-center rounded-md border",
                      isActive
                        ? "border-white/20 bg-white/5"
                        : "border-ui-hairline bg-ui-canvas-soft-2",
                    )}
                  >
                    <FileText className="h-8 w-8 text-ui-mute" />
                  </div>
                )}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2
                      className={cn(
                        "ui-display-sm truncate",
                        isActive ? "text-ui-on-primary" : "text-ui-ink",
                      )}
                    >
                      {deck.title}
                    </h2>
                    <p
                      className={cn(
                        "text-xs",
                        isActive ? "text-white/70" : "text-ui-body",
                      )}
                    >
                      {deck.slideCount} slides · rev {deck.revision}
                    </p>
                  </div>
                  {onDeleteDeck && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "shrink-0",
                        isActive
                          ? "text-white/70 hover:bg-white/10"
                          : "text-ui-mute hover:text-ui-error",
                      )}
                      title={`Delete ${deck.title}`}
                      aria-label={`Delete ${deck.title}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteDeck(deck.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <MonoEyebrow
                    className={cn(isActive && "!text-white/70")}
                  >
                    {deck.themeId}
                  </MonoEyebrow>
                  <span
                    className={cn(
                      "text-[11px]",
                      isActive ? "text-white/60" : "text-ui-mute",
                    )}
                  >
                    {new Date(deck.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                {onSetDeckTheme && (
                  <div
                    className="mt-3 border-t border-ui-hairline/50 pt-3"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <ThemePicker
                      themes={themes}
                      themeId={deck.themeId}
                      onSetTheme={(themeId) => onSetDeckTheme(deck.id, themeId)}
                      compact
                    />
                  </div>
                )}
              </Card>
            );
          })}
          {filtered.length === 0 && (
            <Card variant="soft" padding="lg" className="col-span-full text-center">
              <p className="text-sm text-ui-body">
                No matching decks. Create one or clear the search.
              </p>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}

function bucketByFamily(decks: DeckSummary[]): Record<string, DeckSummary[]> {
  const buckets: Record<string, DeckSummary[]> = {};
  for (const deck of decks) {
    const family = familyOf(deck.themeId);
    if (!buckets[family]) buckets[family] = [];
    buckets[family].push(deck);
  }
  return buckets;
}

function familyOf(themeId: string): string {
  if (/blue|navy|professional|corporate/i.test(themeId)) return "professional";
  if (/creative|playful|color|bold|neo/i.test(themeId)) return "expressive";
  if (/editorial|serif|book/i.test(themeId)) return "editorial";
  if (/retro|pixel|crt|orbit|arcade/i.test(themeId)) return "retro";
  return "other";
}

function prettyFamily(id: string): string {
  return id.charAt(0).toUpperCase() + id.slice(1);
}
