import { useEffect, useState } from "react";
import { ChevronRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HeroBand } from "@/components/ui/hero-band";
import { MonoEyebrow } from "@/components/ui/mono-eyebrow";
import { listSourceThemes, type ThemeCatalogEntry } from "@/api/deckSource";

export function MasterTemplatesPage({
  onSelectTheme,
  onBack,
}: {
  onSelectTheme: (themeId: string) => void;
  onBack: () => void;
}) {
  const [themes, setThemes] = useState<ThemeCatalogEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSourceThemes()
      .then((t) => setThemes(t))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, []);

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-ui-canvas-soft">
      <HeroBand
        eyebrow={<MonoEyebrow>Master templates</MonoEyebrow>}
        title={<>Master Templates.</>}
        description="Browse the React templates the deck authoring system can compose. Pick a theme to see every layout it offers, rendered with sample content."
        actions={
          <Button variant="secondary" size="lg" onClick={onBack}>
            Back to library
          </Button>
        }
      />
      <section className="mx-auto max-w-6xl px-6 py-10">
        {error ? (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : themes === null ? (
          <div className="text-sm text-ui-mute">Loading templates…</div>
        ) : themes.length === 0 ? (
          <div className="text-sm text-ui-mute">No templates registered yet.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {themes.map((theme) => (
              <Card
                key={theme.themeId}
                className="group flex cursor-pointer flex-col gap-4 p-5 transition hover:border-ui-ink"
                onClick={() => onSelectTheme(theme.themeId)}
              >
                <div className="flex items-center gap-2 text-ui-mute">
                  <Layers className="h-4 w-4" />
                  <MonoEyebrow>{theme.themeId}</MonoEyebrow>
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-ui-ink">{theme.namespace}</h3>
                <div className="text-sm text-ui-body">{theme.variants.length} layouts</div>
                <div className="flex flex-wrap gap-1 text-xs text-ui-mute">
                  {theme.variants.slice(0, 8).map((v) => (
                    <span key={v} className="rounded bg-ui-canvas-soft px-2 py-0.5">{v}</span>
                  ))}
                  {theme.variants.length > 8 ? <span className="px-2 py-0.5">+{theme.variants.length - 8}</span> : null}
                </div>
                <div className="mt-auto flex items-center justify-end gap-1 text-sm font-medium text-ui-ink opacity-80 group-hover:opacity-100">
                  Open <ChevronRight className="h-4 w-4" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
