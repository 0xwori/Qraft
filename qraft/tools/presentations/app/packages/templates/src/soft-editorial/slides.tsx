import * as React from "react";

/**
 * Soft Editorial — slide layout components, ported 1:1 from
 * beautiful-html-templates/soft-editorial/template.html.
 *
 * Render at a 1920×1080 logical stage. The Deck author should pass
 * <Deck width={1920} height={1080}> when using this template.
 */

const DEFAULT_DATE = "April 29, 2026";
const DEFAULT_VOLUME = "Field Notes · Vol. III";
const IMAGE_PLACEHOLDER_SRC = "https://placehold.co/600x400";

interface ChromeProps {
  date?: string;
  volume?: string;
  page?: string;
  eyebrow?: string;
}

function Chrome({ date = DEFAULT_DATE, volume = DEFAULT_VOLUME, page, eyebrow }: ChromeProps) {
  return (
    <>
      {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
      {page ? <div className="pagedot">{page}</div> : null}
      <div className="footer">
        <span>{date}</span>
        <span>{volume}</span>
      </div>
    </>
  );
}

/* ============== COVER ============== */

export interface CoverProps extends ChromeProps {
  kicker?: string;
  title: React.ReactNode;
  lede?: React.ReactNode;
}

export function Cover({ kicker, title, lede, eyebrow = "Field Notes", date, volume }: CoverProps) {
  return (
    <section className="slide s-cover">
      <div className="eyebrow">{eyebrow}</div>
      <div className="swatches" aria-hidden="true">
        <i style={{ background: "var(--pink)" }} />
        <i style={{ background: "var(--lemon)" }} />
        <i style={{ background: "var(--blush)" }} />
      </div>
      <div className="stack">
        {kicker ? <div className="kicker">{kicker}</div> : null}
        <h1>{title}</h1>
        {lede ? <div className="lede">{lede}</div> : null}
      </div>
      <Chrome date={date} volume={volume} />
    </section>
  );
}

/* ============== FOREWORD (Statement) ============== */

export interface ForewordProps extends ChromeProps {
  opener: React.ReactNode;
  body: React.ReactNode[];
  signoff?: string;
}

export function Foreword({
  opener,
  body,
  signoff,
  eyebrow = "Foreword",
  page = "ii",
  date,
  volume,
}: ForewordProps) {
  return (
    <section className="slide s-foreword">
      <div className="col-l">
        <p className="opener">{opener}</p>
      </div>
      <div className="col-r">
        {body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {signoff ? <div className="signoff">— {signoff}</div> : null}
      </div>
      <Chrome eyebrow={eyebrow} page={page} date={date} volume={volume} />
    </section>
  );
}

/* ============== METHOD (List · 4-step) ============== */

export type SoftEditorialPalette = "pink" | "lemon" | "blush" | "sage" | "lilac";

export interface MethodStep {
  numeral: string;
  title: string;
  body: string;
  color?: SoftEditorialPalette;
}

export interface MethodProps extends ChromeProps {
  steps: MethodStep[];
}

const DEFAULT_METHOD_PALETTE: SoftEditorialPalette[] = ["pink", "lemon", "blush", "sage"];

export function Method({ steps, eyebrow = "The Method", page = "iii", date, volume }: MethodProps) {
  return (
    <section className="slide s-method">
      <div className="grid">
        {steps.map((step, i) => (
          <div key={i} className={`step ${step.color ?? DEFAULT_METHOD_PALETTE[i % DEFAULT_METHOD_PALETTE.length]}`}>
            <div className="n">{step.numeral}</div>
            <div>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </div>
          </div>
        ))}
      </div>
      <Chrome eyebrow={eyebrow} page={page} date={date} volume={volume} />
    </section>
  );
}

/* ============== INSIGHTS (3-card reference) ============== */

export interface InsightCard {
  label: string;
  sub: string;
  body: string;
  color?: SoftEditorialPalette;
}

export interface InsightsProps extends ChromeProps {
  cards: InsightCard[];
}

const DEFAULT_INSIGHTS_PALETTE: SoftEditorialPalette[] = ["pink", "lemon", "blush"];

export function Insights({ cards, eyebrow = "Insights", page = "iv", date, volume }: InsightsProps) {
  return (
    <section className="slide s-insights">
      <div className="row">
        {cards.map((c, i) => (
          <div key={i} className={`card ${c.color ?? DEFAULT_INSIGHTS_PALETTE[i % DEFAULT_INSIGHTS_PALETTE.length]}`}>
            <div className="head">
              <h3 className="serif">{c.label}</h3>
              <div className="sub">{c.sub}</div>
            </div>
            <p>{c.body}</p>
          </div>
        ))}
      </div>
      <Chrome eyebrow={eyebrow} page={page} date={date} volume={volume} />
    </section>
  );
}

/* ============== CLOSER (full-bleed Chapter / Statement) ============== */

export interface CloserProps extends ChromeProps {
  marker?: string;
  title: React.ReactNode;
  body?: React.ReactNode;
  background?: SoftEditorialPalette;
}

export function Closer({
  marker,
  title,
  body,
  background = "pink",
  eyebrow,
  page,
  date,
  volume,
}: CloserProps) {
  return (
    <section className={`slide s-closer ${background}`}>
      <div className="center">
        {marker ? <div className="marker">{marker}</div> : null}
        <h2>{title}</h2>
        {body ? <p>{body}</p> : null}
      </div>
      <Chrome eyebrow={eyebrow} page={page} date={date} volume={volume} />
    </section>
  );
}

export const Chapter = Closer;
export const Statement = Closer;
export type ChapterProps = CloserProps;
export type StatementProps = CloserProps;

/* ============== NUMBERS (Stats) ============== */

export interface NumbersProps extends ChromeProps {
  hero: { value: React.ReactNode; label: React.ReactNode };
  stats: { value: React.ReactNode; label: React.ReactNode }[];
}

export function Numbers({ hero, stats, eyebrow = "By the numbers", page = "vi", date, volume }: NumbersProps) {
  return (
    <section className="slide s-numbers">
      <div className="grid">
        <div className="stat a">
          <div className="lab serif-it" style={{ fontSize: 30 }}>
            {hero.label}
          </div>
          <div className="v">{hero.value}</div>
        </div>
        {stats.slice(0, 2).map((s, i) => (
          <div key={i} className={`stat ${i === 0 ? "b" : "c"}`}>
            <div className="v">{s.value}</div>
            <div className="lab">{s.label}</div>
          </div>
        ))}
      </div>
      <Chrome eyebrow={eyebrow} page={page} date={date} volume={volume} />
    </section>
  );
}

export const Stats = Numbers;
export type StatsProps = NumbersProps;

/* ============== QUOTE ============== */

export interface QuoteProps extends ChromeProps {
  quote: React.ReactNode;
  attribution: string;
  role?: string;
}

export function Quote({ quote, attribution, role, eyebrow = "In their words", page = "vii", date, volume }: QuoteProps) {
  return (
    <section className="slide s-quote">
      <div className="center">
        <div className="qmark">"</div>
        <blockquote>{quote}</blockquote>
        <div className="attr">
          {attribution}
          {role ? <span className="role">{role}</span> : null}
        </div>
      </div>
      <Chrome eyebrow={eyebrow} page={page} date={date} volume={volume} />
    </section>
  );
}

/* ============== NEXT (Split: title + 3-item list) ============== */

export interface NextItem {
  numeral: string;
  title: string;
  body: string;
  color?: SoftEditorialPalette;
}

export interface NextProps extends ChromeProps {
  title: React.ReactNode;
  body?: React.ReactNode;
  items: NextItem[];
}

const DEFAULT_NEXT_PALETTE: SoftEditorialPalette[] = ["pink", "lemon", "blush"];

export function Next({ title, body, items, eyebrow = "What we'll do next", page = "viii", date, volume }: NextProps) {
  return (
    <section className="slide s-next">
      <div className="grid">
        <div className="panel l">
          <h2>{title}</h2>
          {body ? <p>{body}</p> : null}
        </div>
        <div className="panel r">
          {items.map((item, i) => (
            <div key={i} className={`item ${item.color ?? DEFAULT_NEXT_PALETTE[i % DEFAULT_NEXT_PALETTE.length]}`}>
              <div className="n">{item.numeral}</div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Chrome eyebrow={eyebrow} page={page} date={date} volume={volume} />
    </section>
  );
}

export const Split = Next;
export const List = Next;
export type SplitProps = NextProps;
export type ListProps = NextProps;

/* ============== CHART ============== */

export interface ChartSeries {
  label: string;
  color: string;
  points: string;
  width?: number;
}

export interface ChartProps extends ChromeProps {
  title: React.ReactNode;
  body?: React.ReactNode;
  series: ChartSeries[];
  xTicks?: string[];
  yTicks?: string[];
  yLabel?: string;
}

const DEFAULT_X = ["D0", "D7", "D14", "D30", "D45", "D60", "D90"];
const DEFAULT_Y = ["100", "75", "50", "25", "0"];

export function Chart({
  title,
  body,
  series,
  xTicks = DEFAULT_X,
  yTicks = DEFAULT_Y,
  yLabel = "% of cohort active, by day",
  eyebrow = "Retention, by cohort",
  page = "x",
  date,
  volume,
}: ChartProps) {
  return (
    <section className="slide s-chart">
      <div className="left">
        <h2>{title}</h2>
        {body ? <p>{body}</p> : null}
        <div className="legend">
          {series.map((s, i) => (
            <div key={i} className="li">
              <i style={{ background: s.color }} /> {s.label}
            </div>
          ))}
        </div>
      </div>
      <div className="right">
        <div className="yhead">{yLabel}</div>
        <div className="plot">
          <div className="yticks">
            {yTicks.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </div>
          {[0, 25, 50, 75].map((p) => (
            <div key={p} className="gline" style={{ top: `${p}%` }} />
          ))}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            {series.map((s, i) => (
              <polyline
                key={i}
                fill="none"
                stroke={s.color}
                strokeWidth={s.width ?? 0.9}
                strokeLinecap="round"
                strokeLinejoin="round"
                points={s.points}
              />
            ))}
          </svg>
        </div>
        <div className="xticks">
          {xTicks.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </div>
      <Chrome eyebrow={eyebrow} page={page} date={date} volume={volume} />
    </section>
  );
}

/* ============== PROCESS ============== */

export interface ProcessNode {
  numeral: string;
  title: string;
  body: string;
}

export interface ProcessProps extends ChromeProps {
  title: React.ReactNode;
  sub?: React.ReactNode;
  nodes: ProcessNode[];
  timeline?: string[];
}

export function Process({
  title,
  sub,
  nodes,
  timeline,
  eyebrow = "How we'll work",
  page = "xi",
  date,
  volume,
}: ProcessProps) {
  return (
    <section className="slide s-process">
      <div className="head">
        <h2>{title}</h2>
        {sub ? <div className="sub">{sub}</div> : null}
      </div>
      <div className="flow">
        {nodes.map((n, i) => (
          <div key={i} className={`node n${i + 1}`}>
            <div className="n">{n.numeral}</div>
            <h3>{n.title}</h3>
            <p>{n.body}</p>
            <svg
              className={`arrow${i === nodes.length - 1 ? " last" : ""}`}
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M6 16 H26 M20 9 L26 16 L20 23" />
            </svg>
          </div>
        ))}
      </div>
      {timeline ? (
        <div className="timeline">
          {timeline.map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
      ) : null}
      <Chrome eyebrow={eyebrow} page={page} date={date} volume={volume} />
    </section>
  );
}

/* ============== MATRIX ============== */

export type MatrixPill = "yes" | "part" | "no" | "note";

export interface MatrixCell {
  label: React.ReactNode;
  pill?: MatrixPill;
}

export interface MatrixProps extends ChromeProps {
  title: React.ReactNode;
  sub?: React.ReactNode;
  columns: string[];
  rows: { label: string; cells: MatrixCell[] }[];
}

export function Matrix({
  title,
  sub,
  columns,
  rows,
  eyebrow = "Comparison",
  page = "xii",
  date,
  volume,
}: MatrixProps) {
  const totalCols = columns.length + 1;
  const tableStyle: React.CSSProperties = {
    gridTemplateColumns: `1.4fr ${columns.map(() => "1fr").join(" ")}`,
  };
  return (
    <section className="slide s-matrix">
      <div className="head">
        <h2>{title}</h2>
        {sub ? <div className="sub">{sub}</div> : null}
      </div>
      <div className="table" style={tableStyle}>
        <div className="cell head-row">Lever</div>
        {columns.map((c, i) => (
          <div
            key={i}
            className={`cell head-row${i === columns.length - 1 ? " last-col" : ""}`}
          >
            {c}
          </div>
        ))}
        {rows.map((row, ri) => {
          const isLast = ri === rows.length - 1;
          return (
            <React.Fragment key={ri}>
              <div className={`cell row-label${isLast ? " last" : ""}`}>{row.label}</div>
              {row.cells.map((cell, ci) => {
                const lastCol = ci === row.cells.length - 1;
                return (
                  <div
                    key={ci}
                    className={[
                      "cell",
                      isLast ? "last" : "",
                      lastCol ? "last-col" : "",
                    ].filter(Boolean).join(" ")}
                  >
                    {cell.pill ? <span className={`pill ${cell.pill}`}>{cell.label}</span> : cell.label}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>
      <Chrome eyebrow={eyebrow} page={page} date={date} volume={volume} />
      {/* width tracking just to keep tsc happy when totalCols is unused */}
      <span hidden>{totalCols}</span>
    </section>
  );
}

/* ============== MEDIA + DIAGRAM STANDARD ================= */

export interface ImageSlideProps extends ChromeProps {
  label?: string;
  title?: React.ReactNode;
  body?: React.ReactNode;
  image?: string;
  alt?: string;
  caption?: React.ReactNode;
}

function ImageBlock({ image, alt, caption }: Pick<ImageSlideProps, "image" | "alt" | "caption">) {
  return (
    <div className="media-frame">
      <img src={image ?? IMAGE_PLACEHOLDER_SRC} alt={alt ?? ""} />
      {caption ? <div className="media-caption">{caption}</div> : null}
    </div>
  );
}

export function ImageFull({
  label = "Image",
  title = "A full-bleed visual moment.",
  body = "Use this slide when the image carries the story and the text should stay quiet.",
  image,
  alt,
  caption,
  eyebrow = "Image Full",
  page = "xiii",
  date,
  volume,
}: ImageSlideProps) {
  return (
    <section className="slide s-image-full">
      <ImageBlock image={image} alt={alt} caption={caption} />
      <div className="copy-panel">
        <div className="label">{label}</div>
        <h2>{title}</h2>
        {body ? <p>{body}</p> : null}
      </div>
      <Chrome eyebrow={eyebrow} page={page} date={date} volume={volume} />
    </section>
  );
}

function ImageSide({
  side,
  label = "Image",
  title = "A composed image and narrative split.",
  body = "Use this slide for a visual artifact with enough room for context, interpretation, or a short argument.",
  image,
  alt,
  caption,
  eyebrow,
  page,
  date,
  volume,
}: ImageSlideProps & { side: "left" | "right" }) {
  const media = <ImageBlock image={image} alt={alt} caption={caption} />;
  const copy = (
    <div className="copy">
      <div className="label">{label}</div>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
  return (
    <section className={`slide s-image-side ${side}`}>
      <div className="grid">
        {side === "left" ? media : copy}
        {side === "left" ? copy : media}
      </div>
      <Chrome eyebrow={eyebrow} page={page} date={date} volume={volume} />
    </section>
  );
}

export function ImageLeft(props: ImageSlideProps) {
  return <ImageSide {...props} side="left" eyebrow={props.eyebrow ?? "Image Left"} page={props.page ?? "xiv"} />;
}

export function ImageRight(props: ImageSlideProps) {
  return <ImageSide {...props} side="right" eyebrow={props.eyebrow ?? "Image Right"} page={props.page ?? "xv"} />;
}

export interface DiagramItem {
  label: string;
  title: string;
  body: string;
}

export interface DiagramSlideProps extends ChromeProps {
  label?: string;
  title?: React.ReactNode;
  body?: React.ReactNode;
  items?: DiagramItem[];
}

const DEFAULT_DIAGRAM_ITEMS: DiagramItem[] = [
  { label: "01", title: "Input", body: "The signal, source, or trigger that starts the system." },
  { label: "02", title: "Transform", body: "The work that changes raw material into something useful." },
  { label: "03", title: "Output", body: "The visible result, decision, or handoff that follows." },
];

function DiagramPanel({ items = DEFAULT_DIAGRAM_ITEMS }: { items?: DiagramItem[] }) {
  return (
    <div className="diagram-panel">
      {items.slice(0, 4).map((item, index) => (
        <div key={`${item.label}-${item.title}`} className="diagram-node">
          <div className="n">{item.label}</div>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
          {index < Math.min(items.length, 4) - 1 ? <div className="connector" /> : null}
        </div>
      ))}
    </div>
  );
}

export function DiagramFull({
  label = "Diagram",
  title = "A system view, end to end.",
  body = "Use this slide for flows, operating models, architecture, or decision logic.",
  items = DEFAULT_DIAGRAM_ITEMS,
  eyebrow = "Diagram Full",
  page = "xvi",
  date,
  volume,
}: DiagramSlideProps) {
  return (
    <section className="slide s-diagram-full">
      <div className="head">
        <div>
          <div className="label">{label}</div>
          <h2>{title}</h2>
        </div>
        {body ? <p>{body}</p> : null}
      </div>
      <DiagramPanel items={items} />
      <Chrome eyebrow={eyebrow} page={page} date={date} volume={volume} />
    </section>
  );
}

function DiagramSide({
  side,
  label = "Diagram",
  title = "Explain the model beside the flow.",
  body = "Use this slide when the audience needs both a diagram and a clear written read-out.",
  items = DEFAULT_DIAGRAM_ITEMS,
  eyebrow,
  page,
  date,
  volume,
}: DiagramSlideProps & { side: "left" | "right" }) {
  const diagram = <DiagramPanel items={items} />;
  const copy = (
    <div className="copy">
      <div className="label">{label}</div>
      <h2>{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
  return (
    <section className={`slide s-diagram-side ${side}`}>
      <div className="grid">
        {side === "left" ? diagram : copy}
        {side === "left" ? copy : diagram}
      </div>
      <Chrome eyebrow={eyebrow} page={page} date={date} volume={volume} />
    </section>
  );
}

export function DiagramLeft(props: DiagramSlideProps) {
  return <DiagramSide {...props} side="left" eyebrow={props.eyebrow ?? "Diagram Left"} page={props.page ?? "xvii"} />;
}

export function DiagramRight(props: DiagramSlideProps) {
  return <DiagramSide {...props} side="right" eyebrow={props.eyebrow ?? "Diagram Right"} page={props.page ?? "xviii"} />;
}

/* ============== CONSULT (Detail) ============== */

export interface ConsultColumn {
  heading: string;
  bodyTop?: React.ReactNode;
  bullets?: { label: string; body: string }[];
  meta?: string;
  source?: string;
}

export interface ConsultProps extends ChromeProps {
  actionTag: string;
  actionTitle: React.ReactNode;
  columns: ConsultColumn[];
}

export function Consult({
  actionTag,
  actionTitle,
  columns,
  eyebrow = "Findings · Detail",
  page = "ix",
  date,
  volume,
}: ConsultProps) {
  return (
    <section className="slide s-consult">
      <div className="action">
        <div className="tag">{actionTag}</div>
        <h2>{actionTitle}</h2>
      </div>
      <div className="body-grid">
        {columns.map((col, i) => (
          <div key={i} className="col">
            <h3>{col.heading}</h3>
            {col.bodyTop ? <p>{col.bodyTop}</p> : null}
            {col.bullets && col.bullets.length ? (
              <ul>
                {col.bullets.map((b, bi) => (
                  <li key={bi}>
                    <strong>{b.label}</strong> — {b.body}
                  </li>
                ))}
              </ul>
            ) : null}
            {col.meta ? <div className="meta">{col.meta}</div> : null}
            {col.source ? <div className="source">{col.source}</div> : null}
          </div>
        ))}
      </div>
      <Chrome eyebrow={eyebrow} page={page} date={date} volume={volume} />
    </section>
  );
}

/* ============== END (cover-style sign-off) ============== */

export interface EndProps extends ChromeProps {
  kicker?: string;
  title: React.ReactNode;
  signoff?: string;
}

export function End({ kicker = "Thank you.", title, signoff, eyebrow = "End", date, volume }: EndProps) {
  return (
    <section className="slide s-cover">
      <div className="eyebrow">{eyebrow}</div>
      <div className="stack">
        <div className="kicker">{kicker}</div>
        <h1>{title}</h1>
        {signoff ? <div className="lede">{signoff}</div> : null}
      </div>
      <Chrome date={date} volume={volume} />
    </section>
  );
}
