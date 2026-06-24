import * as React from "react";

export interface AdCampaignProps {
  title: string;
  durationMs: number;
  fps?: number;
  children: React.ReactNode;
}

export interface AdVariantProps {
  id: string;
  label: string;
  width: number;
  height: number;
  placement?: string;
  children: React.ReactNode;
}

interface AdTimeContextValue {
  timeMs: number;
  durationMs: number;
  progress: number;
}

const AdTimeContext = React.createContext<AdTimeContextValue | null>(null);

declare global {
  interface Window {
    __QRAFT_AD_SET_TIME?: (timeMs: number) => void;
  }
}

export function AdCampaign({ title, durationMs, children }: AdCampaignProps) {
  const variants = React.Children.toArray(children).filter(React.isValidElement) as Array<React.ReactElement<AdVariantProps>>;
  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
  const requestedVariant = params.get("variant") ?? "";
  const play = params.get("play") === "1";
  const initialTime = clamp(Number(params.get("timeMs") ?? 0), 0, durationMs);
  const active = variants.find((variant) => variant.props.id === requestedVariant) ?? variants[0];
  const [timeMs, setTimeMs] = React.useState(initialTime);

  React.useEffect(() => {
    window.__QRAFT_AD_SET_TIME = (nextTimeMs: number) => {
      setTimeMs(clamp(nextTimeMs, 0, durationMs));
    };
    return () => {
      delete window.__QRAFT_AD_SET_TIME;
    };
  }, [durationMs]);

  React.useEffect(() => {
    if (!play) return;
    let raf = 0;
    const started = performance.now();
    const startTime = timeMs;
    const tick = () => {
      const elapsed = performance.now() - started;
      setTimeMs((startTime + elapsed) % durationMs);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [durationMs, play]);

  if (!active) {
    return <div data-ad-empty>No variants in campaign</div>;
  }

  const progress = durationMs > 0 ? clamp(timeMs / durationMs, 0, 1) : 0;
  const value = React.useMemo(() => ({ timeMs, durationMs, progress }), [timeMs, durationMs, progress]);

  return (
    <AdTimeContext.Provider value={value}>
      <main
        data-ad-campaign-title={title}
        data-ad-active-variant={active.props.id}
        style={{
          margin: 0,
          width: active.props.width,
          height: active.props.height,
          overflow: "hidden",
          background: "#faf8f6",
        }}
      >
        {active}
      </main>
    </AdTimeContext.Provider>
  );
}

export function AdVariant({ id, label, width, height, placement, children }: AdVariantProps) {
  return (
    <section
      data-ad-root
      data-ad-variant-id={id}
      data-ad-variant-label={label}
      data-ad-placement={placement ?? ""}
      style={{
        width,
        height,
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {children}
    </section>
  );
}

export function useAdTime(): number {
  return useAdTimeline().timeMs;
}

export function useAdTimeline(): AdTimeContextValue {
  const context = React.useContext(AdTimeContext);
  if (!context) throw new Error("useAdTime must be used inside <AdCampaign>");
  return context;
}

export function interpolate(
  value: number,
  input: [number, number],
  output: [number, number],
): number {
  const [inMin, inMax] = input;
  const [outMin, outMax] = output;
  if (inMax === inMin) return outMax;
  const t = clamp((value - inMin) / (inMax - inMin), 0, 1);
  return outMin + (outMax - outMin) * t;
}

export function ease(value: number): number {
  const t = clamp(value, 0, 1);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function stagger(index: number, stepMs = 120): number {
  return index * stepMs;
}

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
