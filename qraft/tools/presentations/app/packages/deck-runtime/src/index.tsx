import * as React from "react";

export interface DeckMeta {
  theme: string;
  title: string;
  width?: number;
  height?: number;
}

export interface DeckProps extends DeckMeta {
  children: React.ReactNode;
}

const DeckMetaContext = React.createContext<DeckMeta | null>(null);

export function useDeckMeta(): DeckMeta {
  const ctx = React.useContext(DeckMetaContext);
  if (!ctx) throw new Error("useDeckMeta must be used inside <Deck>");
  return ctx;
}

/**
 * Top-level deck component. Wraps the deck in a theme-scoped root,
 * sets the slide stage size, and renders each child slide as a
 * full-bleed page in the deck.
 */
export function Deck({ theme, title, width = 1280, height = 720, children }: DeckProps) {
  const meta = React.useMemo<DeckMeta>(() => ({ theme, title, width, height }), [theme, title, width, height]);
  const slides = React.Children.toArray(children);
  return (
    <DeckMetaContext.Provider value={meta}>
      <div className={`mk-deck mk-theme-${theme}`} data-mk-deck-title={title}>
        {slides.map((child, index) => (
          <SlideStage key={index} index={index} total={slides.length}>
            {child}
          </SlideStage>
        ))}
      </div>
    </DeckMetaContext.Provider>
  );
}

interface SlideStageProps {
  index: number;
  total: number;
  children: React.ReactNode;
}

/**
 * Frames a single slide at the deck's configured dimensions.
 * Slides render at logical pixels and the host UI scales the
 * iframe to fit. This keeps every template's px/vw math working
 * the same way it does in the original template.html.
 */
export function SlideStage({ index, total, children }: SlideStageProps) {
  const meta = useDeckMeta();
  return (
    <section
      className="mk-stage"
      data-mk-slide-index={index}
      data-mk-slide-total={total}
      style={{
        width: meta.width,
        height: meta.height,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {children}
    </section>
  );
}

/**
 * Low-level escape hatch for free-form slides that don't use a
 * template variant. Templates should never use this — they should
 * render their own root elements.
 */
export function Slide({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={["mk-slide", className].filter(Boolean).join(" ")} {...rest}>
      {children}
    </div>
  );
}

export const __DECK_RUNTIME_VERSION__ = "0.1.0";
