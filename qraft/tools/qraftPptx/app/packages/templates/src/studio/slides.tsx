import * as React from "react";

const IMAGE_PLACEHOLDER_SRC = "https://placehold.co/600x400";

export interface StudioChromeProps {
  label?: string;
  page?: string;
  footer?: string;
}

export interface CoverProps {
  title?: React.ReactNode;
  image?: string;
  alt?: string;
  metaLeft?: React.ReactNode;
  metaCenter?: React.ReactNode;
  metaRight?: React.ReactNode;
}

export function Cover({
  title = "Proposal",
  image = IMAGE_PLACEHOLDER_SRC,
  alt = "",
  metaLeft = <>[Studio Name] x [Client Name]<br />[Date]</>,
  metaCenter = "[Presentation Title]",
  metaRight = "[Studio Name]",
}: CoverProps) {
  return (
    <section className="studio-slide studio-dark studio-cover">
      <div className="studio-cover-media">
        <img src={image} alt={alt} />
      </div>
      <h1 className="studio-display">{title}</h1>
      <div className="studio-cover-meta">
        <span>{metaLeft}</span>
        <span>{metaCenter}</span>
        <span>{metaRight}</span>
      </div>
    </section>
  );
}

export interface ChapterProps {
  chapter?: string;
  title?: React.ReactNode;
  surface?: "light" | "dark";
}

function Chapter({ chapter = "01 /", title = "Who we are", surface = "light" }: ChapterProps) {
  return (
    <section className={`studio-slide studio-${surface} studio-chapter`}>
      <div className="studio-chapter-num">{chapter}</div>
      <h1 className="studio-h1">{title}</h1>
    </section>
  );
}

export function ChapterLight(props: Omit<ChapterProps, "surface">) {
  return <Chapter {...props} surface="light" />;
}

export function ChapterDark(props: Omit<ChapterProps, "surface">) {
  return <Chapter {...props} chapter={props.chapter ?? "02 /"} title={props.title ?? "The work"} surface="dark" />;
}

export interface StatementProps {
  title?: React.ReactNode;
  surface?: "light" | "dark";
}

function Statement({ title = "Great work doesn't happen by accident", surface = "dark" }: StatementProps) {
  return (
    <section className={`studio-slide studio-${surface} studio-statement`}>
      <div className="studio-statement-body">
        <h1 className="studio-h1">{title}</h1>
      </div>
    </section>
  );
}

export function StatementDark(props: Omit<StatementProps, "surface">) {
  return <Statement {...props} surface="dark" />;
}

export function StatementLight(props: Omit<StatementProps, "surface">) {
  return <Statement {...props} title={props.title ?? "Bold ideas deserve bold execution"} surface="light" />;
}

export interface SplitProps extends StudioChromeProps {
  kicker?: string;
  title?: React.ReactNode;
  body?: React.ReactNode;
  bullets?: string[];
  image?: string;
  alt?: string;
  caption?: React.ReactNode;
}

export function Split({
  label = "Approach",
  page = "04 / 12",
  footer = "[Studio Name] · [Date]",
  kicker = "Our work",
  title = "We build what others plan",
  body = "Our studio pairs strategic thinking with craft-level execution. Every project begins with a question: what needs to be true for this to work?",
  bullets = ["Strategy before aesthetics", "Constraints as creative fuel", "Delivery on schedule, not on someday"],
  image = IMAGE_PLACEHOLDER_SRC,
  alt = "",
  caption = "[Caption — project name, year]",
}: SplitProps) {
  return (
    <section className="studio-slide studio-light studio-split">
      <Chrome label={label} page={page} />
      <div className="studio-split-body">
        <div className="studio-split-copy">
          <div className="studio-label studio-muted">{kicker}</div>
          <h2 className="studio-h2">{title}</h2>
          <p className="studio-lead">{body}</p>
          <DashList items={bullets} />
        </div>
        <figure className="studio-image-panel">
          <img src={image} alt={alt} />
          {caption ? <figcaption>{caption}</figcaption> : null}
        </figure>
      </div>
      <Foot footer={footer} page={page} />
    </section>
  );
}

export interface ImageSlideProps extends StudioChromeProps {
  title?: React.ReactNode;
  body?: React.ReactNode;
  image?: string;
  alt?: string;
  caption?: React.ReactNode;
  surface?: "light" | "dark";
}

function StudioImage({ image = IMAGE_PLACEHOLDER_SRC, alt = "", caption }: Pick<ImageSlideProps, "image" | "alt" | "caption">) {
  return (
    <figure className="studio-required-image">
      <img src={image} alt={alt} />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export function ImageFull({
  label = "Image",
  page = "I / 03",
  footer = "[Studio Name] · [Date]",
  title = "Let the image carry the argument",
  body = "A full-frame visual with one severe readout, built for evidence, product, campaign, place, or artifact slides.",
  image = IMAGE_PLACEHOLDER_SRC,
  alt = "",
  caption = "Image source · [Year]",
  surface = "dark",
}: ImageSlideProps) {
  return (
    <section className={`studio-slide studio-${surface} studio-image-full`}>
      <Chrome label={label} page={page} />
      <StudioImage image={image} alt={alt} caption={caption} />
      <div className="studio-image-full-copy">
        <h2 className="studio-h2">{title}</h2>
        {body ? <p className="studio-lead">{body}</p> : null}
      </div>
      <Foot footer={footer} page={page} />
    </section>
  );
}

function ImageSide({
  side,
  label = "Image",
  page = "I / 02",
  footer = "[Studio Name] · [Date]",
  title = "Image and point of view",
  body = "Use this split for a visual plus the sharp interpretation that gives it meaning.",
  image = IMAGE_PLACEHOLDER_SRC,
  alt = "",
  caption = "Image source · [Year]",
}: ImageSlideProps & { side: "left" | "right" }) {
  const media = <StudioImage image={image} alt={alt} caption={caption} />;
  const copy = (
    <div className="studio-required-copy">
      <h2 className="studio-h2">{title}</h2>
      {body ? <p className="studio-lead">{body}</p> : null}
    </div>
  );
  return (
    <section className={`studio-slide studio-light studio-image-side studio-${side}`}>
      <Chrome label={label} page={page} />
      <div className="studio-required-grid">
        {side === "left" ? media : copy}
        {side === "left" ? copy : media}
      </div>
      <Foot footer={footer} page={page} />
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

export interface DiagramSlideProps extends StudioChromeProps {
  title?: React.ReactNode;
  body?: React.ReactNode;
  items?: DiagramItem[];
  surface?: "light" | "dark";
}

const DEFAULT_DIAGRAM_ITEMS: DiagramItem[] = [
  { label: "01", title: "Input", body: "Signal, source, constraint, or brief." },
  { label: "02", title: "System", body: "The rules, craft, and decisions that transform it." },
  { label: "03", title: "Output", body: "The visible work, handoff, or business result." },
];

function StudioDiagram({ items = DEFAULT_DIAGRAM_ITEMS }: { items?: DiagramItem[] }) {
  return (
    <div className="studio-diagram">
      {items.slice(0, 4).map((item, index) => (
        <article className="studio-diagram-node" key={`${item.label}-${item.title}`}>
          <div className="studio-diagram-index">{item.label}</div>
          <h3 className="studio-h3">{item.title}</h3>
          <p className="studio-body">{item.body}</p>
          {index < Math.min(items.length, 4) - 1 ? <span className="studio-diagram-line" /> : null}
        </article>
      ))}
    </div>
  );
}

export function DiagramFull({
  label = "Diagram",
  page = "D / 03",
  footer = "[Studio Name] · [Date]",
  title = "System map",
  body = "A full-frame structure for process, architecture, operating models, or strategic flow.",
  items = DEFAULT_DIAGRAM_ITEMS,
  surface = "dark",
}: DiagramSlideProps) {
  return (
    <section className={`studio-slide studio-${surface} studio-diagram-full`}>
      <Chrome label={label} page={page} />
      <div className="studio-diagram-head">
        <h2 className="studio-h2">{title}</h2>
        {body ? <p className="studio-lead">{body}</p> : null}
      </div>
      <StudioDiagram items={items} />
      <Foot footer={footer} page={page} />
    </section>
  );
}

function DiagramSide({
  side,
  label = "Diagram",
  page = "D / 02",
  footer = "[Studio Name] · [Date]",
  title = "Model plus readout",
  body = "Use this when the diagram and the implication need equal weight.",
  items = DEFAULT_DIAGRAM_ITEMS,
}: DiagramSlideProps & { side: "left" | "right" }) {
  const diagram = <StudioDiagram items={items} />;
  const copy = (
    <div className="studio-required-copy">
      <h2 className="studio-h2">{title}</h2>
      {body ? <p className="studio-lead">{body}</p> : null}
    </div>
  );
  return (
    <section className={`studio-slide studio-light studio-diagram-side studio-${side}`}>
      <Chrome label={label} page={page} />
      <div className="studio-required-grid">
        {side === "left" ? diagram : copy}
        {side === "left" ? copy : diagram}
      </div>
      <Foot footer={footer} page={page} />
    </section>
  );
}

export function DiagramLeft(props: DiagramSlideProps) {
  return <DiagramSide {...props} side="left" />;
}

export function DiagramRight(props: DiagramSlideProps) {
  return <DiagramSide {...props} side="right" />;
}

export interface StudioStat {
  value: string;
  label: string;
  note?: string;
}

export interface StatsProps extends StudioChromeProps {
  title?: React.ReactNode;
  stats?: StudioStat[];
}

export function Stats({
  label = "By the Numbers",
  page = "05 / 12",
  footer = "[Studio Name] · [Date]",
  title = "The studio",
  stats = [
    { value: "12", label: "Years of practice", note: "[Studio Name] founded [Year]" },
    { value: "200+", label: "Projects delivered", note: "Across [N] industries" },
    { value: "3", label: "Continents active", note: "[City A], [City B], [City C]" },
  ],
}: StatsProps) {
  return (
    <section className="studio-slide studio-light studio-stats">
      <Chrome label={label} page={page} />
      <div className="studio-stats-body">
        <h2 className="studio-h2">{title}</h2>
        <div className="studio-stats-grid">
          {stats.slice(0, 3).map((stat) => (
            <article className="studio-stat-card" key={`${stat.value}-${stat.label}`}>
              <div className="studio-stat-value">{stat.value}</div>
              <div className="studio-stat-label">{stat.label}</div>
              {stat.note ? <div className="studio-stat-note">{stat.note}</div> : null}
            </article>
          ))}
        </div>
      </div>
      <Foot footer={footer} page={page} />
    </section>
  );
}

export interface ListProps extends StudioChromeProps {
  title?: React.ReactNode;
  body?: React.ReactNode;
  items?: string[];
}

export function List({
  label = "Services",
  page = "06 / 12",
  footer = "[Studio Name] · [Date]",
  title = "What we offer",
  body = "A focused set of services built for ambitious creative and commercial challenges.",
  items = [
    "Brand strategy and identity systems",
    "Campaign and content direction",
    "Digital experience design and build",
    "Motion and video production",
    "Ongoing creative partnership and retainer",
  ],
}: ListProps) {
  return (
    <section className="studio-slide studio-dark studio-list">
      <Chrome label={label} page={page} />
      <div className="studio-list-body">
        <div className="studio-list-head">
          <h2 className="studio-h2">{title}</h2>
          <p className="studio-lead">{body}</p>
        </div>
        <DashList items={items} />
      </div>
      <Foot footer={footer} page={page} />
    </section>
  );
}

export interface QuoteProps {
  quote?: React.ReactNode;
  attribution?: string;
  role?: string;
}

export function Quote({
  quote = "They don't just make things look good. They make things work.",
  attribution = "[Client Name]",
  role = "CMO · [Company] · [Year]",
}: QuoteProps) {
  return (
    <section className="studio-slide studio-dark studio-quote">
      <p className="studio-quote-text">{quote}</p>
      <div className="studio-quote-attr">
        <span className="studio-label">{attribution}</span>
        <span className="studio-label studio-muted">{role}</span>
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

export interface CompareProps extends StudioChromeProps {
  left?: ComparePanel;
  right?: ComparePanel;
}

export function Compare({
  label = "Before / After",
  page = "08 / 12",
  footer = "[Studio Name] · [Date]",
  left = {
    label: "Before",
    title: "Generic identity, forgettable campaigns",
    body: "A brand built by committee, refined to inoffensiveness. Nothing wrong. Nothing memorable.",
    bullets: ["No clear point of view", "Inconsistent execution across touchpoints", "Campaigns that launched and disappeared"],
  },
  right = {
    label: "After",
    title: "A distinctive voice people recognize",
    body: "A brand with a defined perspective. Work that accumulates, building memory and trust.",
    bullets: ["Ownable visual and verbal territory", "System that scales without diluting", "Campaigns that created lasting recall"],
  },
}: CompareProps) {
  return (
    <section className="studio-slide studio-light studio-compare">
      <Chrome label={label} page={page} />
      <div className="studio-compare-body">
        {[left, right].map((panel) => (
          <article className="studio-compare-panel" key={panel.label}>
            <div className="studio-compare-label">{panel.label}</div>
            <h3 className="studio-h3">{panel.title}</h3>
            <p className="studio-body">{panel.body}</p>
            <DashList items={panel.bullets} />
          </article>
        ))}
      </div>
      <Foot footer={footer} page={page} />
    </section>
  );
}

export interface ChartBar {
  label: string;
  value: number;
}

export interface ChartProps extends StudioChromeProps {
  title?: React.ReactNode;
  caption?: React.ReactNode;
  bars?: ChartBar[];
  source?: string;
}

export function Chart({
  label = "Project Output",
  page = "11 / 12",
  footer = "[Studio Name] · [Date]",
  title = "Projects by year",
  caption = "Count · [Studio Name] Portfolio",
  bars = [
    { label: "[Y-4]", value: 14 },
    { label: "[Y-3]", value: 21 },
    { label: "[Y-2]", value: 28 },
    { label: "[Y-1]", value: 35 },
    { label: "[Year]", value: 47 },
  ],
  source = "Source: [Studio Name] internal tracking · [Year]",
}: ChartProps) {
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  return (
    <section className="studio-slide studio-dark studio-chart">
      <Chrome label={label} page={page} />
      <div className="studio-chart-body">
        <div className="studio-chart-header">
          <h2 className="studio-h2">{title}</h2>
          <p className="studio-label studio-muted">{caption}</p>
        </div>
        <div className="studio-chart-wrapper">
          {bars.map((bar) => (
            <div className="studio-chart-bar" key={bar.label}>
              <div className="studio-chart-fill" style={{ height: `${Math.max(12, (bar.value / max) * 100)}%` }} />
              <span>{bar.value}</span>
              <small>{bar.label}</small>
            </div>
          ))}
          <div className="studio-chart-baseline" />
        </div>
        <p className="studio-chart-source">{source}</p>
      </div>
      <Foot footer={footer} page={page} />
    </section>
  );
}

export interface EndContact {
  name: string;
  email: string;
  phone: string;
}

export interface EndProps {
  title?: React.ReactNode;
  contacts?: EndContact[];
  metaLeft?: React.ReactNode;
  metaCenter?: React.ReactNode;
  metaRight?: React.ReactNode;
}

export function End({
  title = "Any questions or thoughts?",
  contacts = [
    { name: "[Name A]", email: "name@studio.com", phone: "+00 000 000 000" },
    { name: "[Name B]", email: "name@studio.com", phone: "+00 000 000 000" },
  ],
  metaLeft = <>Page 12<br />[Studio Name] x [Client Name]</>,
  metaCenter = "[Presentation title]",
  metaRight = "[Studio Name]",
}: EndProps) {
  return (
    <section className="studio-slide studio-light studio-end">
      <h1 className="studio-h1">{title}</h1>
      <div className="studio-end-contacts">
        {contacts.map((contact) => (
          <p className="studio-body" key={`${contact.name}-${contact.email}`}>
            Contact {contact.name} via email on {contact.email} or via phone on {contact.phone}
          </p>
        ))}
      </div>
      <div className="studio-cover-meta studio-end-meta">
        <span>{metaLeft}</span>
        <span>{metaCenter}</span>
        <span>{metaRight}</span>
      </div>
    </section>
  );
}

function Chrome({ label, page }: Required<Pick<StudioChromeProps, "label" | "page">>) {
  return (
    <div className="studio-chrome">
      <span className="studio-label studio-muted">{label}</span>
      <span className="studio-label studio-muted">{page}</span>
    </div>
  );
}

function Foot({ footer, page }: Required<Pick<StudioChromeProps, "footer" | "page">>) {
  return (
    <div className="studio-foot">
      <span className="studio-label studio-muted">{footer}</span>
      <span className="studio-label studio-muted">{page}</span>
    </div>
  );
}

function DashList({ items }: { items: string[] }) {
  return (
    <ul className="studio-dash-list">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}
