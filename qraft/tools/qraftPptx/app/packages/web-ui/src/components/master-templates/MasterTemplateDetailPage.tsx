import { useEffect, useState } from "react";
import { ArrowLeft, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MonoEyebrow } from "@/components/ui/mono-eyebrow";
import { listSourceThemes, type ThemeCatalogEntry } from "@/api/deckSource";

export function MasterTemplateDetailPage({
  themeId,
  onBack,
}: {
  themeId: string;
  onBack: () => void;
  onSelectTheme: (themeId: string) => void;
}) {
  const [theme, setTheme] = useState<ThemeCatalogEntry | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listSourceThemes()
      .then((all) => {
        const match = all.find((t) => t.themeId === themeId);
        if (!match) setError(`Theme not found: ${themeId}`);
        else setTheme(match);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [themeId]);

  function copyJsx(variant: string) {
    if (!theme) return;
    const meta = theme.variantMeta.find((entry) => entry.variant === variant);
    const snippet = meta?.jsxTemplate ?? `<${theme.namespace}.${variant} />`;
    void navigator.clipboard.writeText(snippet).then(
      () => toast.success(`Copied ${variant}`),
      () => toast.error("Copy failed"),
    );
  }

  return (
    <main className="min-h-0 flex-1 overflow-auto bg-ui-canvas-soft">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-ui-hairline bg-ui-canvas/90 px-6 py-3 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> All templates
        </Button>
        <span className="h-5 w-px bg-ui-hairline" />
        <MonoEyebrow>Theme</MonoEyebrow>
        <h2 className="text-lg font-semibold tracking-tight text-ui-ink">{theme?.namespace ?? themeId}</h2>
        {theme ? <span className="text-xs text-ui-mute">{theme.variants.length} layouts</span> : null}
      </header>
      <section className="mx-auto max-w-7xl px-6 py-8">
        {error ? (
          <div className="rounded-md border border-red-300 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        ) : !theme ? (
          <div className="text-sm text-ui-mute">Loading…</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {theme.variants.map((variant) => (
              <Card key={variant} className="flex flex-col overflow-hidden p-0">
                <div className="relative bg-[#0a0a0a]" style={{ aspectRatio: "16 / 9" }}>
                  <iframe
                    title={`${themeId} · ${variant}`}
                    src={`/preview/templates/${encodeURIComponent(themeId)}/${encodeURIComponent(variant)}`}
                    className="absolute inset-0 h-full w-full border-0"
                    loading="lazy"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-ui-hairline px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-ui-ink">{variant}</div>
                    <div className="text-xs text-ui-mute">{theme.namespace}.{variant}</div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => copyJsx(variant)}>
                    <Copy className="h-3.5 w-3.5" /> Copy JSX
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
