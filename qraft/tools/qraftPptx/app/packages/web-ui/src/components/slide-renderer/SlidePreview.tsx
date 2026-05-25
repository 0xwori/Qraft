import { useMemo } from "react";
import type { Deck, LayoutDefinition, Slide, ThemeDefinition } from "@micro-keynote/core";
import { renderScopedCss, renderSlideHtml, resolveDeckRenderScene, SLIDE_HEIGHT, SLIDE_WIDTH } from "@micro-keynote/renderer";
import { cn } from "@/lib/utils";

export function SlidePreview({
  deck,
  slide,
  themes,
  layouts,
  scale = 0.2,
  className,
}: {
  deck: Deck;
  slide: Slide;
  themes: ThemeDefinition[];
  layouts: LayoutDefinition[];
  scale?: number;
  className?: string;
}) {
  const markup = useMemo(() => {
    const scene = resolveDeckRenderScene(deck, {
      themes,
      layouts,
      assetBasePath: `/deck-assets/${deck.clientId}/${deck.id}`,
      mode: "thumbnail",
    });
    const renderSlide = scene.slides.find((item) => item.id === slide.id) ?? scene.slides[0];
    return renderSlide ? `<style>${renderScopedCss(scene.theme)}</style>${renderSlideHtml(renderSlide)}` : "";
  }, [deck, layouts, slide.id, themes]);

  return (
    <div className={cn("overflow-hidden rounded-md border border-ui-hairline bg-ui-canvas shadow-card-1", className)} style={{ width: SLIDE_WIDTH * scale, height: SLIDE_HEIGHT * scale }}>
      <div className="mk-viewer-scope origin-top-left" style={{ transform: `scale(${scale})`, width: SLIDE_WIDTH, height: SLIDE_HEIGHT }} dangerouslySetInnerHTML={{ __html: markup }} />
    </div>
  );
}
