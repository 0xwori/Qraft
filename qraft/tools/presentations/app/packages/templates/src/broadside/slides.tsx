import * as React from "react";

const IMAGE_PLACEHOLDER_SRC = "https://placehold.co/600x400";

type Surface = "dark" | "orange";

export interface ChromeProps {
  label?: string;
  page?: string;
  footer?: string;
}

export interface CoverProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  number?: string;
  label?: string;
  author?: string;
  context?: string;
}

export function Cover({
  title = "broadside",
  subtitle = "A dark editorial system with one fire-orange accent and massive graphic type.",
  number = "01",
  label = "Manifesto",
  author = "[Author Name]",
  context = "[Year] · Context",
}: CoverProps) {
  return (
    <section className="broad-slide broad-orange broad-cover">
      <Top number={number} label={label} />
      <div className="broad-cover-body">
        <h1 className="broad-display">{title}</h1>
        <p className="broad-lead">{subtitle}</p>
      </div>
      <div className="broad-cover-meta">
        <span>{author}</span>
        <span>{context}</span>
      </div>
    </section>
  );
}

export interface ChapterProps {
  number?: string;
  title?: React.ReactNode;
  body?: React.ReactNode;
}

export function Chapter({
  number = "02",
  title = "this is a chapter",
  body = "A loud punctuation slide for section breaks and editorial resets.",
}: ChapterProps) {
  return (
    <section className="broad-slide broad-orange broad-chapter">
      <div className="broad-num">{number}</div>
      <h2 className="broad-h1">{title}</h2>
      <p className="broad-lead">{body}</p>
    </section>
  );
}

export interface StatementProps extends ChromeProps {
  kicker?: string;
  title?: React.ReactNode;
}

export function Statement({
  label = "The Argument",
  page = "03",
  footer = "Broadside",
  kicker = "Core Thesis",
  title = "The old rules were not built for the new terrain.",
}: StatementProps) {
  return (
    <section className="broad-slide broad-dark broad-statement">
      <Chrome label={label} page={page} />
      <div className="broad-statement-body">
        <p className="broad-kicker">{kicker}</p>
        <div className="broad-rule" />
        <h2 className="broad-h1 broad-accent">{title}</h2>
      </div>
      <Foot footer={footer} page="[Author Name]" />
    </section>
  );
}

export interface SplitProps extends ChromeProps {
  kicker?: string;
  title?: React.ReactNode;
  body?: React.ReactNode;
  bullets?: string[];
  image?: string;
  alt?: string;
  caption?: React.ReactNode;
}

export function Split({
  label = "Details",
  page = "04",
  footer = "Broadside",
  kicker = "Context",
  title = "The signal is already in the margins.",
  body = "A split slide for pairing a forceful argument with visual proof, context, or a cultural reference.",
  bullets = ["Read what people do, not what they say", "Find patterns before they become language", "Make the frame impossible to ignore"],
  image = IMAGE_PLACEHOLDER_SRC,
  alt = "",
  caption = "Image caption or source · Year",
}: SplitProps) {
  return (
    <section className="broad-slide broad-dark broad-split">
      <Chrome label={label} page={page} />
      <div className="broad-split-body">
        <div className="broad-split-copy">
          <p className="broad-kicker">{kicker}</p>
          <div className="broad-rule" />
          <h2 className="broad-h2">{title}</h2>
          <p className="broad-lead broad-muted">{body}</p>
          <SlashList items={bullets} />
        </div>
        <BroadImage image={image} alt={alt} caption={caption} />
      </div>
      <Foot footer={footer} page="[Author Name]" />
    </section>
  );
}

export interface ImageSlideProps extends ChromeProps {
  title?: React.ReactNode;
  body?: React.ReactNode;
  image?: string;
  alt?: string;
  caption?: React.ReactNode;
  surface?: Surface;
}

export function ImageFull({
  label = "Image",
  page = "I / 03",
  footer = "Broadside",
  title = "let the image do the shouting",
  body = "A full-frame visual for evidence, place, product, campaign, or cultural material.",
  image = IMAGE_PLACEHOLDER_SRC,
  alt = "",
  caption = "Image source · Year",
  surface = "dark",
}: ImageSlideProps) {
  return (
    <section className={`broad-slide broad-${surface} broad-image-full`}>
      <Chrome label={label} page={page} />
      <BroadImage image={image} alt={alt} caption={caption} />
      <div className="broad-image-readout">
        <h2 className="broad-h2">{title}</h2>
        {body ? <p className="broad-lead broad-muted">{body}</p> : null}
      </div>
      <Foot footer={footer} page="[Author Name]" />
    </section>
  );
}

function ImageSide({
  side,
  label = "Image",
  page = "I / 02",
  footer = "Broadside",
  title = "image and argument",
  body = "Use this when the visual and the editorial point need equal weight.",
  image = IMAGE_PLACEHOLDER_SRC,
  alt = "",
  caption = "Image source · Year",
}: ImageSlideProps & { side: "left" | "right" }) {
  const media = <BroadImage image={image} alt={alt} caption={caption} />;
  const copy = (
    <div className="broad-required-copy">
      <h2 className="broad-h2">{title}</h2>
      {body ? <p className="broad-lead broad-muted">{body}</p> : null}
    </div>
  );
  return (
    <section className={`broad-slide broad-dark broad-image-side broad-${side}`}>
      <Chrome label={label} page={page} />
      <div className="broad-required-grid">
        {side === "left" ? media : copy}
        {side === "left" ? copy : media}
      </div>
      <Foot footer={footer} page="[Author Name]" />
    </section>
  );
}

export function ImageLeft(props: ImageSlideProps) {
  return <ImageSide {...props} side="left" />;
}

export function ImageRight(props: ImageSlideProps) {
  return <ImageSide {...props} side="right" />;
}

export interface DiagramItem {
  label: string;
  title: string;
  body: string;
}

export interface DiagramSlideProps extends ChromeProps {
  title?: React.ReactNode;
  body?: React.ReactNode;
  items?: DiagramItem[];
  surface?: Surface;
}

const DEFAULT_DIAGRAM_ITEMS: DiagramItem[] = [
  { label: "01", title: "Discover", body: "Read the terrain and map what is actually happening." },
  { label: "02", title: "Define", body: "Name the force, constraint, or argument worth building around." },
  { label: "03", title: "Design", body: "Turn the argument into a system people can recognize." },
  { label: "04", title: "Deploy", body: "Ship the work into channels where it can accumulate meaning." },
];

function BroadDiagram({ items = DEFAULT_DIAGRAM_ITEMS }: { items?: DiagramItem[] }) {
  return (
    <div className="broad-diagram">
      {items.slice(0, 4).map((item, index) => (
        <React.Fragment key={`${item.label}-${item.title}`}>
          <article className="broad-diagram-step">
            <div className="broad-diagram-num">{item.label}</div>
            <div className="broad-diagram-title">{item.title}</div>
            <p>{item.body}</p>
          </article>
          {index < Math.min(items.length, 4) - 1 ? <div className="broad-diagram-arrow">→</div> : null}
        </React.Fragment>
      ))}
    </div>
  );
}

export function DiagramFull({
  label = "The Process",
  page = "D / 03",
  footer = "Broadside",
  title = "from signal to system",
  body = "A full-canvas diagram for process, architecture, operating models, and argument flow.",
  items = DEFAULT_DIAGRAM_ITEMS,
  surface = "orange",
}: DiagramSlideProps) {
  return (
    <section className={`broad-slide broad-${surface} broad-diagram-full`}>
      <Chrome label={label} page={page} />
      <div className="broad-diagram-head">
        <h2 className="broad-h2">{title}</h2>
        {body ? <p className="broad-lead">{body}</p> : null}
      </div>
      <BroadDiagram items={items} />
      <Foot footer={footer} page="[Author Name]" />
    </section>
  );
}

function DiagramSide({
  side,
  label = "The Process",
  page = "D / 02",
  footer = "Broadside",
  title = "diagram plus readout",
  body = "Use this when the structure and the implication need to sit side by side.",
  items = DEFAULT_DIAGRAM_ITEMS,
}: DiagramSlideProps & { side: "left" | "right" }) {
  const diagram = <BroadDiagram items={items.slice(0, 3)} />;
  const copy = (
    <div className="broad-required-copy">
      <h2 className="broad-h2">{title}</h2>
      {body ? <p className="broad-lead broad-muted">{body}</p> : null}
    </div>
  );
  return (
    <section className={`broad-slide broad-dark broad-diagram-side broad-${side}`}>
      <Chrome label={label} page={page} />
      <div className="broad-required-grid">
        {side === "left" ? diagram : copy}
        {side === "left" ? copy : diagram}
      </div>
      <Foot footer={footer} page="[Author Name]" />
    </section>
  );
}

export function DiagramLeft(props: DiagramSlideProps) {
  return <DiagramSide {...props} side="left" />;
}

export function DiagramRight(props: DiagramSlideProps) {
  return <DiagramSide {...props} side="right" />;
}

export interface StatItem {
  value: string;
  label: string;
  note?: string;
}

export interface StatsProps extends ChromeProps {
  stats?: StatItem[];
}

export function Stats({
  label = "By the numbers",
  page = "05",
  footer = "Broadside",
  stats = [
    { value: "72%", label: "primary behavioral shift", note: "[Source] · [Year]" },
    { value: "4.8x", label: "faster signal recognition", note: "Primary research" },
    { value: "#1", label: "category attention driver", note: "Market charts" },
  ],
}: StatsProps) {
  return (
    <section className="broad-slide broad-orange broad-stats">
      <Chrome label={label} page={page} />
      <div className="broad-stats-grid">
        {stats.slice(0, 3).map((stat) => (
          <article className="broad-stat-card" key={`${stat.value}-${stat.label}`}>
            <div className="broad-stat-value">{stat.value}</div>
            <div className="broad-body">{stat.label}</div>
            {stat.note ? <div className="broad-note">{stat.note}</div> : null}
          </article>
        ))}
      </div>
      <Foot footer={footer} page="[Author Name]" />
    </section>
  );
}

export interface FadeListProps {
  items?: string[];
  title?: React.ReactNode;
}

export function FadeList({
  items = ["Before", "During", "After"],
  title = "the sequence matters more than the moment",
}: FadeListProps) {
  return (
    <section className="broad-slide broad-orange broad-fadelist">
      <div className="broad-fade-items">
        {items.slice(0, 3).map((item) => <span key={item}>{item}</span>)}
      </div>
      <h2 className="broad-fade-title">{title}</h2>
    </section>
  );
}

export interface ListProps extends ChromeProps {
  kicker?: string;
  title?: React.ReactNode;
  items?: string[];
}

export function List({
  label = "The Framework",
  page = "07",
  footer = "Broadside",
  kicker = "Four rules",
  title = "how to read the moment",
  items = ["Start with the pressure", "Name the conflict", "Make the signal visible", "Build a repeatable language"],
}: ListProps) {
  return (
    <section className="broad-slide broad-dark broad-list">
      <Chrome label={label} page={page} />
      <div className="broad-list-body">
        <div>
          <p className="broad-kicker">{kicker}</p>
          <h2 className="broad-h2">{title}</h2>
        </div>
        <SlashList items={items} />
      </div>
      <Foot footer={footer} page="[Author Name]" />
    </section>
  );
}

export interface QuoteProps {
  quote?: React.ReactNode;
  attribution?: string;
  source?: string;
}

export function Quote({
  quote = "A brand is not what it says. It is what people repeat when it leaves the room.",
  attribution = "[Industry Leader]",
  source = "[Source] · [Year]",
}: QuoteProps) {
  return (
    <section className="broad-slide broad-dark broad-quote">
      <p className="broad-kicker broad-accent">Quoted</p>
      <div className="broad-quote-text">{quote}</div>
      <div className="broad-quote-attr">
        <span>{attribution}</span>
        <span>{source}</span>
      </div>
    </section>
  );
}

export interface ComparePanel {
  label: string;
  title: React.ReactNode;
  body: React.ReactNode;
  bullets: string[];
}

export interface CompareProps extends ChromeProps {
  left?: ComparePanel;
  right?: ComparePanel;
}

export function Compare({
  label = "Before · After",
  page = "09",
  footer = "Broadside",
  left = { label: "Before", title: "fragmented attention", body: "Lots of motion, little memory.", bullets: ["Unclear position", "Generic category codes", "Work that disappears"] },
  right = { label: "After", title: "a visible point of view", body: "A system people can recognize and repeat.", bullets: ["Sharper language", "Ownable visual field", "Compounding campaign memory"] },
}: CompareProps) {
  return (
    <section className="broad-slide broad-dark broad-compare">
      <Chrome label={label} page={page} />
      <div className="broad-compare-body">
        <CompareCard panel={left} />
        <CompareCard panel={right} accent />
      </div>
      <Foot footer={footer} page="[Author Name]" />
    </section>
  );
}

export interface ChartBar {
  label: string;
  value: string;
  height: number;
  accent?: boolean;
}

export interface ChartProps extends ChromeProps {
  title?: React.ReactNode;
  caption?: string;
  bars?: ChartBar[];
  source?: string;
}

export function Chart({
  label = "Growth Metrics",
  page = "11",
  footer = "Broadside",
  title = "momentum compounds unevenly",
  caption = "Quarterly revenue",
  bars = [
    { label: "Q1", value: "$1.2M", height: 32 },
    { label: "Q2", value: "$1.7M", height: 46 },
    { label: "Q3", value: "$2.1M", height: 58 },
    { label: "Q4", value: "$2.8M", height: 78, accent: true },
  ],
  source = "Source: internal tracking · [Year]",
}: ChartProps) {
  return (
    <section className="broad-slide broad-dark broad-chart">
      <Chrome label={label} page={page} />
      <div className="broad-chart-body">
        <div className="broad-chart-head">
          <h2 className="broad-h2">{title}</h2>
          <span>{caption}</span>
        </div>
        <div className="broad-bars">
          {bars.map((bar) => (
            <div className="broad-bar-col" key={bar.label}>
              <span className={bar.accent ? "broad-accent" : undefined}>{bar.value}</span>
              <div className={bar.accent ? "broad-bar broad-bar-accent" : "broad-bar"} style={{ height: `${bar.height}%` }} />
              <small>{bar.label}</small>
            </div>
          ))}
          <div className="broad-chart-baseline" />
        </div>
        <p className="broad-note">{source}</p>
      </div>
      <Foot footer={footer} page="[Author Name]" />
    </section>
  );
}

export function Diagram(props: DiagramSlideProps) {
  return <DiagramFull {...props} />;
}

export interface PieProps extends ChromeProps {
  title?: React.ReactNode;
}

export function Pie({ label = "Market Share", page = "13", footer = "[Author]", title = "one leader, many followers" }: PieProps) {
  return (
    <section className="broad-slide broad-dark broad-pie">
      <Chrome label={label} page={page} />
      <div className="broad-pie-body">
        <h2 className="broad-h2">{title}</h2>
        <div className="broad-pie-mark" />
        <SlashList items={["Leader 40%", "Challenger 28%", "Followers 20%", "Other 12%"]} />
      </div>
      <Foot footer={footer} page="[Year]" />
    </section>
  );
}

export function Pyramid() {
  return (
    <section className="broad-slide broad-dark broad-pyramid">
      <Chrome label="The Hierarchy" page="14" />
      <h2 className="broad-h2">what sits above the work</h2>
      <div className="broad-pyramid-stack">
        {["mission", "strategy", "product", "growth", "operations"].map((item) => <div key={item}>{item}<span>why this layer matters</span></div>)}
      </div>
      <Foot footer="[Author]" page="[Year]" />
    </section>
  );
}

export function VerticalTimeline() {
  return (
    <section className="broad-slide broad-dark broad-vtimeline">
      <Chrome label="The Story" page="15" />
      <h2 className="broad-h2">how the story changed</h2>
      <div className="broad-timeline">
        {["the idea", "first product", "the pivot", "now"].map((item, index) => (
          <div key={item}><span>[Year {index - 3}]</span><b>{item}</b><p>The short version of what changed at this point.</p></div>
        ))}
      </div>
      <Foot footer="[Author] / [Year]" page="15" />
    </section>
  );
}

export function Cycle() {
  return (
    <section className="broad-slide broad-dark broad-cycle">
      <Chrome label="The Loop" page="16" />
      <h2 className="broad-h2">the loop gets sharper each pass</h2>
      <div className="broad-cycle-grid">
        {["build", "measure", "decide", "learn"].map((item, index) => <div key={item}><span>{`0${index + 1}`}</span><b>{item}</b><p>Short description of the step.</p></div>)}
      </div>
      <Foot footer="[Author] / [Year]" page="16" />
    </section>
  );
}

export interface EndProps {
  title?: React.ReactNode;
  body?: React.ReactNode;
  label?: string;
}

export function End({
  title = "now make it impossible to ignore",
  body = "Close with a declaration, a next step, or the line the room should remember.",
  label = "Closing",
}: EndProps) {
  return (
    <section className="broad-slide broad-orange broad-end">
      <Top number="20" label={label} />
      <h1 className="broad-display">{title}</h1>
      <p className="broad-lead">{body}</p>
      <div className="broad-cover-meta">
        <span>[Author Name]</span>
        <span>[Year]</span>
      </div>
    </section>
  );
}

function Chrome({ label, page }: Required<Pick<ChromeProps, "label" | "page">>) {
  return (
    <header className="broad-chrome">
      <span>{label}</span>
      <span>{page}</span>
    </header>
  );
}

function Foot({ footer, page }: { footer: React.ReactNode; page: React.ReactNode }) {
  return (
    <footer className="broad-foot">
      <span>{footer}</span>
      <span>{page}</span>
    </footer>
  );
}

function Top({ number, label }: { number: string; label: string }) {
  return (
    <div className="broad-top">
      <span>{number}</span>
      <span>{label}</span>
    </div>
  );
}

function BroadImage({ image = IMAGE_PLACEHOLDER_SRC, alt = "", caption }: { image?: string; alt?: string; caption?: React.ReactNode }) {
  return (
    <figure className="broad-image">
      <img src={image} alt={alt} />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

function SlashList({ items }: { items: string[] }) {
  return (
    <ul className="broad-slash-list">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

function CompareCard({ panel, accent }: { panel: ComparePanel; accent?: boolean }) {
  return (
    <article className={accent ? "broad-compare-card broad-compare-accent" : "broad-compare-card"}>
      <div>{panel.label}</div>
      <h3 className="broad-h3">{panel.title}</h3>
      <p className="broad-lead broad-muted">{panel.body}</p>
      <SlashList items={panel.bullets} />
    </article>
  );
}
