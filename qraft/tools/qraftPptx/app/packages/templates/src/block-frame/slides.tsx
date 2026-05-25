import * as React from "react";

export type BlockFrameTone = "pink" | "blue" | "green" | "yellow" | "cream" | "white";

const IMAGE_PLACEHOLDER_SRC = "https://placehold.co/600x400";

export interface BlockFrameCard {
  title: string;
  body: string;
}

export interface BlockFrameFeature {
  icon: string;
  title: string;
  body: string;
  tone?: BlockFrameTone;
}

export interface BlockFrameMetric {
  value: string;
  label: string;
  tone?: BlockFrameTone;
}

export interface BlockFrameStep {
  numeral: string;
  title: string;
  body: string;
  tone?: BlockFrameTone;
}

export interface BlockFramePerson {
  initials: string;
  name: string;
  role: string;
  bio: string;
  tone?: BlockFrameTone;
}

export interface ChartSeries {
  label: string;
  tone?: BlockFrameTone;
  values: number[];
}

export interface CoverProps {
  label?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  cta?: string;
}

export function Cover({
  label = "Presentation Template",
  title = <>Neo-<br />Brutalism<br />Style</>,
  subtitle = "A bold, high-contrast template designed for maximum visual impact and uncompromising clarity.",
  cta = "Get Started",
}: CoverProps) {
  return (
    <section className="bf-slide bf-cover">
      <div className="bf-dot-field" />
      <div className="bf-hero-frame">
        <CornerBrackets />
        <Label>{label}</Label>
        <h1 className="bf-heading-xl">{title}</h1>
        <p className="bf-subtitle">{subtitle}</p>
        <div className="bf-deco-rect" />
        <div className="bf-deco-circle" />
        <div className="bf-deco-tab">{cta}</div>
      </div>
    </section>
  );
}

export interface OverviewProps {
  label?: string;
  title?: React.ReactNode;
  body?: React.ReactNode;
  pills?: string[];
  cards?: BlockFrameCard[];
}

export function Overview({
  label = "Overview",
  title = <>What We<br />Deliver</>,
  body = "Every project follows a rigorous process that balances creative exploration with systematic execution. The result is work that stands out while remaining fully functional.",
  pills = ["12+ Years", "500+ Projects"],
  cards = [
    { title: "Strategy First", body: "Deep research and stakeholder alignment make every decision traceable to clear objectives." },
    { title: "Design System", body: "A modular visual system creates consistency while leaving room for expression." },
    { title: "Launch Ready", body: "Production-tested deliverables arrive documented and ready to hand off." },
  ],
}: OverviewProps) {
  return (
    <section className="bf-slide bf-overview">
      <div className="bf-column">
        <Label tone="yellow">{label}</Label>
        <h2 className="bf-heading-lg">{title}</h2>
        <p className="bf-body bf-measure">{body}</p>
        <div className="bf-pill-row">
          {pills.map((pill) => <span key={pill} className="bf-pill">{pill}</span>)}
        </div>
      </div>
      <div className="bf-card-stack">
        {cards.map((card) => (
          <article key={card.title} className="bf-small-card">
            <h3>{card.title}</h3>
            <p>{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export interface FeaturesProps {
  label?: string;
  cards?: BlockFrameFeature[];
}

export function Features({
  label = "Core Features",
  cards = [
    { icon: "A", title: "Modular Layouts", body: "Mix and match components to build unique presentations without starting from scratch.", tone: "pink" },
    { icon: "B", title: "Responsive Ready", body: "Adapts to different screens while keeping the bold visual character intact.", tone: "blue" },
    { icon: "C", title: "Data Friendly", body: "Built-in styles for charts, statistics, and dense information that remain readable.", tone: "green" },
  ],
}: FeaturesProps) {
  return (
    <section className="bf-slide bf-features">
      <header className="bf-slide-header">
        <Label tone="pink">{label}</Label>
      </header>
      <div className="bf-feature-row">
        {cards.slice(0, 3).map((card) => (
          <article key={card.title} className="bf-feature-card">
            <div className="bf-card-notch" />
            <div className={`bf-icon bf-${card.tone ?? "pink"}`}>{card.icon}</div>
            <h3>{card.title}</h3>
            <p>{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export interface ChartDataProps {
  label?: string;
  title?: React.ReactNode;
  xLabels?: string[];
  series?: ChartSeries[];
  metrics?: BlockFrameMetric[];
}

export function ChartData({
  label = "Performance Data",
  title = "Quarterly Growth Metrics",
  xLabels = ["Q1", "Q2", "Q3", "Q4", "Q5"],
  series = [
    { label: "Revenue", tone: "pink", values: [35, 52, 68, 82, 92] },
    { label: "Users", tone: "blue", values: [26, 40, 56, 72, 80] },
    { label: "Retention", tone: "green", values: [44, 52, 64, 72, 79] },
  ],
  metrics = [
    { value: "+142%", label: "Revenue Growth" },
    { value: "2.4M", label: "Active Users" },
    { value: "94%", label: "Retention Rate" },
  ],
}: ChartDataProps) {
  const groups = xLabels.map((_, i) => series.map((s) => s.values[i] ?? 0));
  return (
    <section className="bf-slide bf-chart">
      <header className="bf-slide-header">
        <Label tone="blue">{label}</Label>
      </header>
      <div className="bf-chart-frame">
        <div className="bf-chart-head">
          <h2 className="bf-heading-md">{title}</h2>
          <div className="bf-legend">
            {series.map((item) => (
              <span key={item.label} className="bf-legend-item">
                <i className={`bf-swatch bf-${item.tone ?? "pink"}`} /> {item.label}
              </span>
            ))}
          </div>
        </div>
        <div className="bf-chart-body">
          <svg className="bf-chart-svg" viewBox="0 0 820 380" role="img" aria-label="Grouped bar chart">
            <line x1="60" y1="20" x2="60" y2="285" />
            <line x1="60" y1="285" x2="790" y2="285" />
            {[80, 150, 215].map((y) => <line key={y} className="bf-grid-line" x1="60" y1={y} x2="790" y2={y} />)}
            {[0, 33, 66, 100].map((tick, i) => (
              <text key={tick} x="48" y={[290, 220, 155, 85][i]} textAnchor="end">{tick}</text>
            ))}
            {groups.map((values, groupIndex) => {
              const baseX = 84 + groupIndex * 144;
              return values.map((value, seriesIndex) => {
                const h = Math.max(12, Math.min(245, value * 2.45));
                const y = 285 - h;
                const tone = series[seriesIndex]?.tone ?? "pink";
                return <rect key={`${groupIndex}-${seriesIndex}`} className={`bf-bar bf-${tone}`} x={baseX + seriesIndex * 38} y={y} width="32" height={h} />;
              });
            })}
            {xLabels.map((x, i) => <text key={x} className="bf-x-label" x={134 + i * 144} y="340" textAnchor="middle">{x}</text>)}
          </svg>
          <div className="bf-data-column">
            {metrics.slice(0, 3).map((metric) => (
              <div key={metric.label} className={`bf-data-box bf-${metric.tone ?? "cream"}`}>
                <span>{metric.value}</span>
                <small>{metric.label}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export interface QuoteProps {
  quote?: React.ReactNode;
  attribution?: string;
}

export function Quote({
  quote = "Design is not just what it looks like. Design is how it works, how it feels, and how it lasts.",
  attribution = "Core Principle, Version 4.0",
}: QuoteProps) {
  return (
    <section className="bf-slide bf-quote">
      <div className="bf-quote-frame">
        <div className="bf-quote-mark">"</div>
        <CornerBrackets />
        <p>{quote}</p>
        <cite>{attribution}</cite>
      </div>
      <div className="bf-stripes" />
    </section>
  );
}

export interface SplitProps {
  label?: string;
  title?: React.ReactNode;
  visualLabel?: string;
  visualText?: string;
  buttonText?: string;
  items?: string[];
}

export function Split({
  label = "Methodology",
  title = <>How We Structure<br />Every Project</>,
  visualLabel = "Visual System",
  visualText = "Image Placeholder",
  buttonText = "View Process",
  items = [
    "Discovery maps stakeholder needs and technical constraints before visual work begins.",
    "Iterative wireframing validates information architecture early.",
    "High-fidelity prototyping uses real content to test hierarchy.",
    "Production handoff ships annotated specifications and a living style guide.",
  ],
}: SplitProps) {
  return (
    <section className="bf-slide bf-split">
      <div className="bf-visual-panel">
        <div className="bf-visual-box"><span>{visualText}</span></div>
        <div className="bf-visual-label">{visualLabel}</div>
      </div>
      <div className="bf-split-content">
        <Label tone="green">{label}</Label>
        <h2 className="bf-heading-md">{title}</h2>
        <ol className="bf-number-list">
          {items.slice(0, 4).map((item, i) => (
            <li key={item}><span>{String(i + 1).padStart(2, "0")}</span>{item}</li>
          ))}
        </ol>
        <div><span className="bf-button">{buttonText}</span></div>
      </div>
    </section>
  );
}

export interface TimelineProps {
  label?: string;
  title?: React.ReactNode;
  steps?: BlockFrameStep[];
}

export function Timeline({
  label = "Roadmap",
  title = "Project Timeline",
  steps = [
    { numeral: "01", title: "Research", body: "Market analysis, user interviews, and competitive audits establish the foundation.", tone: "blue" },
    { numeral: "02", title: "Concept", body: "Mood boards, sketches, and directional explorations define the visual language.", tone: "pink" },
    { numeral: "03", title: "Build", body: "Detailed execution with weekly reviews and continuous stakeholder alignment.", tone: "green" },
    { numeral: "04", title: "Launch", body: "Deployment support, monitoring, and post-launch optimization.", tone: "yellow" },
  ],
}: TimelineProps) {
  return (
    <section className="bf-slide bf-timeline">
      <header className="bf-slide-header">
        <Label tone="cream">{label}</Label>
        <h2 className="bf-heading-lg">{title}</h2>
      </header>
      <div className="bf-timeline-row">
        {steps.slice(0, 4).map((step, i) => (
          <article key={step.numeral} className={`bf-step-card bf-${step.tone ?? "white"}`}>
            {i < steps.length - 1 ? <div className="bf-connector" /> : null}
            <div className="bf-step-num">{step.numeral}</div>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export interface StatsProps {
  label?: string;
  title?: React.ReactNode;
  stats?: BlockFrameMetric[];
}

export function Stats({
  label = "By The Numbers",
  title = "Impact at a Glance",
  stats = [
    { value: "98%", label: "Client Satisfaction", tone: "pink" },
    { value: "14", label: "Industry Awards", tone: "blue" },
    { value: "3.2x", label: "Avg. ROI Increase", tone: "green" },
    { value: "50+", label: "Team Members", tone: "yellow" },
  ],
}: StatsProps) {
  return (
    <section className="bf-slide bf-stats">
      <header className="bf-slide-header">
        <Label tone="green">{label}</Label>
        <h2 className="bf-heading-lg">{title}</h2>
      </header>
      <div className="bf-stats-grid">
        {stats.slice(0, 4).map((stat) => (
          <article key={stat.label} className="bf-stat-card">
            <i className={`bf-dot bf-${stat.tone ?? "pink"}`} />
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </div>
    </section>
  );
}

export interface TeamProps {
  label?: string;
  title?: React.ReactNode;
  members?: BlockFramePerson[];
}

export function Team({
  label = "The Team",
  title = "Meet the Crew",
  members = [
    { initials: "JD", name: "J. Doe", role: "Creative Lead", bio: "Owns visual direction and keeps every project narratively coherent.", tone: "pink" },
    { initials: "AS", name: "A. Smith", role: "Tech Director", bio: "Turns design systems into scalable technical architecture.", tone: "blue" },
    { initials: "MK", name: "M. Kim", role: "Strategist", bio: "Connects business objectives to user needs through research.", tone: "green" },
    { initials: "RL", name: "R. Lee", role: "Producer", bio: "Manages timelines, budgets, and cross-functional delivery.", tone: "yellow" },
    { initials: "TP", name: "T. Patel", role: "Designer", bio: "Crafts interfaces and interactions with detailed precision.", tone: "pink" },
    { initials: "SC", name: "S. Chen", role: "Developer", bio: "Builds front-end systems that bring static designs to life.", tone: "blue" },
  ],
}: TeamProps) {
  return (
    <section className="bf-slide bf-team">
      <header className="bf-slide-header">
        <Label tone="pink">{label}</Label>
        <h2 className="bf-heading-lg">{title}</h2>
      </header>
      <div className="bf-team-grid">
        {members.slice(0, 6).map((member) => (
          <article key={member.name} className="bf-team-card">
            <div className={`bf-avatar bf-${member.tone ?? "pink"}`}>{member.initials}</div>
            <h3>{member.name}</h3>
            <div>{member.role}</div>
            <p>{member.bio}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export interface EndProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  cta?: string;
}

export function End({
  title = <>Let's Build<br />Something Bold</>,
  subtitle = "Ready to start your next project?",
  cta = "Get In Touch",
}: EndProps) {
  return (
    <section className="bf-slide bf-end">
      <div className="bf-end-dots" />
      <div className="bf-end-frame">
        <div className="bf-star" />
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <span>{cta}</span>
      </div>
    </section>
  );
}

/* ============== MEDIA + DIAGRAM STANDARD ================= */

export interface ImageSlideProps {
  label?: string;
  title?: React.ReactNode;
  body?: React.ReactNode;
  image?: string;
  alt?: string;
  caption?: React.ReactNode;
  tone?: BlockFrameTone;
}

function MediaBlock({ image, alt, caption, tone = "blue" }: Pick<ImageSlideProps, "image" | "alt" | "caption" | "tone">) {
  return (
    <div className={`bf-media-block bf-${tone}`}>
      <img src={image ?? IMAGE_PLACEHOLDER_SRC} alt={alt ?? ""} />
      {caption ? <div className="bf-media-caption">{caption}</div> : null}
    </div>
  );
}

export function ImageFull({
  label = "Image Full",
  title = "Full-frame visual",
  body = "Use this slide when the image should dominate and the copy only needs to anchor the meaning.",
  image,
  alt,
  caption,
  tone = "blue",
}: ImageSlideProps) {
  return (
    <section className={`bf-slide bf-image-full bf-${tone}`}>
      <MediaBlock image={image} alt={alt} caption={caption} tone={tone} />
      <div className="bf-image-copy">
        <Label tone="white">{label}</Label>
        <h2 className="bf-heading-md">{title}</h2>
        {body ? <p>{body}</p> : null}
      </div>
    </section>
  );
}

function ImageSide({
  side,
  label = "Image Split",
  title = "Image and argument",
  body = "A reusable split layout for product visuals, research artifacts, people, places, and screenshots.",
  image,
  alt,
  caption,
  tone = "blue",
}: ImageSlideProps & { side: "left" | "right" }) {
  const media = <MediaBlock image={image} alt={alt} caption={caption} tone={tone} />;
  const copy = (
    <div className="bf-media-copy">
      <Label tone="yellow">{label}</Label>
      <h2 className="bf-heading-md">{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
  return (
    <section className={`bf-slide bf-image-side ${side}`}>
      {side === "left" ? media : copy}
      {side === "left" ? copy : media}
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
  tone?: BlockFrameTone;
}

export interface DiagramSlideProps {
  label?: string;
  title?: React.ReactNode;
  body?: React.ReactNode;
  items?: DiagramItem[];
}

const DEFAULT_DIAGRAM_ITEMS: DiagramItem[] = [
  { label: "01", title: "Input", body: "Signal, source, or trigger.", tone: "blue" },
  { label: "02", title: "Transform", body: "Rules and work that change the input.", tone: "pink" },
  { label: "03", title: "Output", body: "The resulting decision or handoff.", tone: "green" },
];

function DiagramBlock({ items = DEFAULT_DIAGRAM_ITEMS }: { items?: DiagramItem[] }) {
  return (
    <div className="bf-diagram-block">
      {items.slice(0, 4).map((item, index) => (
        <article key={`${item.label}-${item.title}`} className={`bf-diagram-node bf-${item.tone ?? "white"}`}>
          {index < Math.min(items.length, 4) - 1 ? <div className="bf-diagram-connector" /> : null}
          <div>{item.label}</div>
          <h3>{item.title}</h3>
          <p>{item.body}</p>
        </article>
      ))}
    </div>
  );
}

export function DiagramFull({
  label = "Diagram Full",
  title = "System map",
  body = "Use this slide for architecture, process, operating models, or any diagram that needs the full canvas.",
  items = DEFAULT_DIAGRAM_ITEMS,
}: DiagramSlideProps) {
  return (
    <section className="bf-slide bf-diagram-full">
      <header className="bf-slide-header">
        <Label tone="cream">{label}</Label>
        <h2 className="bf-heading-lg">{title}</h2>
        {body ? <p>{body}</p> : null}
      </header>
      <DiagramBlock items={items} />
    </section>
  );
}

function DiagramSide({
  side,
  label = "Diagram Split",
  title = "Model plus read-out",
  body = "Use this slide when the diagram and the interpretation need equal weight.",
  items = DEFAULT_DIAGRAM_ITEMS,
}: DiagramSlideProps & { side: "left" | "right" }) {
  const diagram = <DiagramBlock items={items} />;
  const copy = (
    <div className="bf-diagram-copy">
      <Label tone="green">{label}</Label>
      <h2 className="bf-heading-md">{title}</h2>
      {body ? <p>{body}</p> : null}
    </div>
  );
  return (
    <section className={`bf-slide bf-diagram-side ${side}`}>
      {side === "left" ? diagram : copy}
      {side === "left" ? copy : diagram}
    </section>
  );
}

export function DiagramLeft(props: DiagramSlideProps) {
  return <DiagramSide {...props} side="left" />;
}

export function DiagramRight(props: DiagramSlideProps) {
  return <DiagramSide {...props} side="right" />;
}

function Label({ children, tone = "white" }: { children: React.ReactNode; tone?: BlockFrameTone }) {
  return <div className={`bf-label bf-${tone}`}>{children}</div>;
}

function CornerBrackets() {
  return (
    <>
      <i className="bf-corner tl" />
      <i className="bf-corner tr" />
      <i className="bf-corner bl" />
      <i className="bf-corner br" />
    </>
  );
}
