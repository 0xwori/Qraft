import * as React from "react";

const IMAGE_PLACEHOLDER = "https://placehold.co/600x400";

/* ── Shared chrome ─────────────────────────────────────────────────────── */

export interface ChromeProps {
  label?: string;
  page?: string;
  footer?: string;
  footerRight?: string;
}

function Chrome({ label, page }: { label?: string; page?: string }) {
  return (
    <header className="mono-chrome">
      <span className="mono-label mono-muted">{label}</span>
      <span className="mono-label mono-muted">{page}</span>
    </header>
  );
}

function Foot({ left, right }: { left?: string; right?: string }) {
  return (
    <footer className="mono-foot">
      <span className="mono-label mono-muted">{left}</span>
      <span className="mono-label mono-muted">{right}</span>
    </footer>
  );
}

function donutGradient(segments: PieSegment[]): string {
  let acc = 0;
  const stops: string[] = [];
  for (const seg of segments) {
    const start = acc;
    acc += seg.value;
    stops.push(`${seg.color} ${start}% ${acc}%`);
  }
  return `conic-gradient(${stops.join(", ")})`;
}

/* ── 1. Cover ──────────────────────────────────────────────────────────── */

export interface CoverProps {
  topLabel?: string;
  title?: React.ReactNode;
  lead?: React.ReactNode;
  metaLeft?: string;
  metaRight?: string;
}

export function Cover({
  topLabel = "User Research Synthesis / [Month, Year]",
  title = (
    <>
      User Research
      <br />
      Synthesis
    </>
  ),
  lead = "What we learned from 24 interviews and what it means for the product.",
  metaLeft = "Research Team · [Month, Year]",
  metaRight = "Round [N] · Internal",
}: CoverProps) {
  return (
    <section className="mono-slide mono-light mono-cover">
      <div className="mono-cover-toplabel">
        <span className="mono-label mono-muted">{topLabel}</span>
      </div>
      <div className="mono-cover-body">
        <h1 className="mono-display">{title}</h1>
        <div className="mono-rule" style={{ margin: "16px 0" }} />
        <p className="mono-lead mono-muted mono-cover-lead">{lead}</p>
      </div>
      <div className="mono-cover-meta">
        <span className="mono-label mono-muted">{metaLeft}</span>
        <span className="mono-label mono-muted">{metaRight}</span>
      </div>
    </section>
  );
}

/* ── 2. Chapter ────────────────────────────────────────────────────────── */

export interface ChapterProps {
  number?: string;
  title?: React.ReactNode;
  body?: React.ReactNode;
}

export function Chapter({
  number = "01 · Context",
  title = (
    <>
      Why we went back
      <br />
      to users
    </>
  ),
  body = "Three months after launch, retention numbers told us something the metrics couldn't.",
}: ChapterProps) {
  return (
    <section className="mono-slide mono-dark mono-chapter">
      <div className="mono-chapter-num">{number}</div>
      <div className="mono-chapter-rule" />
      <h2 className="mono-h1">{title}</h2>
      <p className="mono-lead mono-chapter-lead">{body}</p>
    </section>
  );
}

/* ── 3. Statement ──────────────────────────────────────────────────────── */

export interface StatementProps extends ChromeProps {
  kicker?: string;
  title?: React.ReactNode;
}

export function Statement({
  label = "Key Finding",
  page = "03",
  footer = "User Research Synthesis",
  footerRight = "Research Team",
  kicker = "Primary objective · Round [N] synthesis",
  title = "Users don't leave because they lose interest. They leave because they don't know what to do next.",
}: StatementProps) {
  return (
    <section className="mono-slide mono-light mono-statement">
      <Chrome label={label} page={page} />
      <div className="mono-body mono-statement-body">
        <p className="mono-kicker">{kicker}</p>
        <h2 className="mono-h1 mono-statement-title">{title}</h2>
        <div className="mono-rule" />
      </div>
      <Foot left={footer} right={footerRight} />
    </section>
  );
}

/* ── 4. Split ──────────────────────────────────────────────────────────── */

export interface SplitProps extends ChromeProps {
  kicker?: string;
  title?: React.ReactNode;
  lead?: React.ReactNode;
  bullets?: string[];
  image?: string;
  caption?: string;
}

export function Split({
  label = "User Behavior",
  page = "04",
  footer = "User Research Synthesis",
  footerRight = "Research Team",
  kicker = "The Pattern",
  title = "The first 48 hours determine everything",
  lead = "Users who complete three core actions in their first two days have a 4× higher 90-day retention rate. Most never get there.",
  bullets = [
    "Onboarding drop-off peaks at step 3",
    '"What do I do next?" is the most common exit trigger',
    "Users who invite a teammate retain at 2× the rate",
  ],
  image,
  caption = "Session recording review · [Month of study]",
}: SplitProps) {
  return (
    <section className="mono-slide mono-light mono-split">
      <Chrome label={label} page={page} />
      <div className="mono-body mono-split-body">
        <div className="mono-split-text">
          <p className="mono-kicker">{kicker}</p>
          <h2 className="mono-h2">{title}</h2>
          <p className="mono-lead mono-muted">{lead}</p>
          <ul className="mono-bullets mono-bullets-sm">
            {bullets.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
        <div className="mono-split-image">
          {image ? (
            <img src={image} alt="" />
          ) : (
            <div className="mono-img-ph">Image placeholder</div>
          )}
          <p className="mono-img-caption">{caption}</p>
        </div>
      </div>
      <Foot left={footer} right={footerRight} />
    </section>
  );
}

/* ── 5. Stats ──────────────────────────────────────────────────────────── */

export interface StatItem {
  value: string;
  label: string;
  note?: string;
}

export interface StatsProps extends ChromeProps {
  title?: React.ReactNode;
  stats?: StatItem[];
}

export function Stats({
  label = "By the Numbers",
  page = "05",
  footer = "User Research Synthesis",
  footerRight = "Research Team",
  title = "What the data showed",
  stats = [
    { value: "68%", label: "of users churned within 14 days — up from 54% in cohort 2", note: "[Analytics tool] · [Launch month]" },
    { value: "3.2min", label: "Average time before abandonment on the setup flow", note: "Session recordings · n=240" },
    { value: "4×", label: "Higher 90-day retention for users who complete onboarding fully", note: "Cohort analysis" },
  ],
}: StatsProps) {
  return (
    <section className="mono-slide mono-light mono-stats">
      <Chrome label={label} page={page} />
      <div className="mono-body mono-stats-body">
        <h2 className="mono-h2">{title}</h2>
        <div className="mono-stats-grid">
          {stats.map((s, i) => (
            <div className="mono-stat-card" key={i}>
              <div className="mono-stat-value">{s.value}</div>
              <p className="mono-stat-label mono-muted">{s.label}</p>
              {s.note ? <p className="mono-stat-note">{s.note}</p> : null}
            </div>
          ))}
        </div>
      </div>
      <Foot left={footer} right={footerRight} />
    </section>
  );
}

/* ── 6. List ───────────────────────────────────────────────────────────── */

export interface ListProps extends ChromeProps {
  kicker?: string;
  title?: React.ReactNode;
  intro?: React.ReactNode;
  bullets?: string[];
}

export function List({
  label = "Recommendations",
  page = "06",
  footer = "User Research Synthesis",
  footerRight = "Research Team",
  kicker = "What to fix",
  title = "Five changes, ordered by impact",
  intro = "We recommend addressing these sequentially — later ones depend on the first landing.",
  bullets = [
    "Redesign the setup flow to three steps maximum",
    'Add a "start here" prompt on day one based on user type',
    "Surface the collaboration invite after first meaningful action",
    "Replace feature tour with outcome demonstration",
    "Build a 7-day email sequence that mirrors in-product progress",
  ],
}: ListProps) {
  return (
    <section className="mono-slide mono-light mono-list">
      <Chrome label={label} page={page} />
      <div className="mono-body mono-list-body">
        <div className="mono-list-head">
          <p className="mono-kicker">{kicker}</p>
          <h2 className="mono-h2">{title}</h2>
          <p className="mono-copy mono-muted">{intro}</p>
        </div>
        <ul className="mono-bullets">
          {bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </div>
      <Foot left={footer} right={footerRight} />
    </section>
  );
}

/* ── 7. Compare ────────────────────────────────────────────────────────── */

export interface ComparePanel {
  label: string;
  title: string;
  lead: string;
  bullets: string[];
}

export interface CompareProps extends ChromeProps {
  left?: ComparePanel;
  right?: ComparePanel;
}

export function Compare({
  label = "Current · Proposed",
  page = "07",
  footer = "User Research Synthesis",
  footerRight = "Research Team",
  left = {
    label: "Current Onboarding",
    title: "9-step setup, any order",
    lead: "Users choose their own path through setup. Most choose wrong.",
    bullets: [
      "Average 3.2 minutes to first value",
      "Step 6 is where 41% abandon",
      "No adaptive logic based on user type",
    ],
  },
  right = {
    label: "Proposed Flow",
    title: "3-step guided path, adaptive",
    lead: "User type detected at signup. Path adjusts. First value in under 90 seconds.",
    bullets: [
      "Target: 90 seconds to first value",
      "Eliminate decision paralysis at step entry",
      "Inline help triggered at abandonment signals",
    ],
  },
}: CompareProps) {
  const panel = (data: ComparePanel, side: "mono-left" | "mono-right", after: boolean) => (
    <div className={`mono-compare-panel ${side}`}>
      <div className={`mono-compare-label${after ? " mono-after" : ""}`}>{data.label}</div>
      <h3 className="mono-h3">{data.title}</h3>
      <p className="mono-lead mono-muted">{data.lead}</p>
      <ul className="mono-bullets mono-bullets-sm">
        {data.bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    </div>
  );
  return (
    <section className="mono-slide mono-light mono-compare">
      <Chrome label={label} page={page} />
      <div className="mono-body mono-compare-body">
        {panel(left, "mono-left", false)}
        {panel(right, "mono-right", true)}
      </div>
      <Foot left={footer} right={footerRight} />
    </section>
  );
}

/* ── 8. Quote ──────────────────────────────────────────────────────────── */

export interface QuoteProps {
  quote?: React.ReactNode;
  attribution?: string;
  context?: string;
}

export function Quote({
  quote = '"I kept opening the app and then closing it again. I didn\'t know what I was supposed to do."',
  attribution = "Participant 14 · 28 years old, Product Designer",
  context = "Interview · [Month of study]",
}: QuoteProps) {
  return (
    <section className="mono-slide mono-dark mono-quote">
      <p className="mono-quote-text">{quote}</p>
      <div className="mono-quote-attr">
        <span className="mono-label">{attribution}</span>
        <span className="mono-label">{context}</span>
      </div>
    </section>
  );
}

/* ── 9. Dense ──────────────────────────────────────────────────────────── */

export interface DenseColumn {
  heading: string;
  paragraphs: string[];
}

export interface DenseProps extends ChromeProps {
  title?: React.ReactNode;
  left?: DenseColumn;
  right?: DenseColumn;
}

export function Dense({
  label = "Analysis",
  page = "09",
  footer = "User Research Synthesis",
  footerRight = "Research Team",
  title = "Why onboarding problems compound over time",
  left = {
    heading: "The Activation Trap",
    paragraphs: [
      "Activation is the moment a user experiences the core value of a product for the first time. When that moment is delayed or never arrives, the user's mental model of the product never fully forms.",
      "Each session that ends without activation reinforces the exit pattern. The gap between download and habit is where most products lose users permanently.",
      "Users who hit activation in session one have a 3× higher probability of returning in week two. The window is narrow.",
    ],
  },
  right = {
    heading: "The Network Effect Delay",
    paragraphs: [
      "Collaboration products face a compounding problem: value increases with each teammate, but users must cross the value threshold alone before they think to invite anyone.",
      "The median user does not discover the invitation flow until session four — by which point 60% have already churned.",
      "The solution is to design the single-player experience as an explicit bridge to the collaborative one.",
    ],
  },
}: DenseProps) {
  const col = (data: DenseColumn) => (
    <div className="mono-dense-col">
      <h4>{data.heading}</h4>
      {data.paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
  return (
    <section className="mono-slide mono-light mono-dense">
      <Chrome label={label} page={page} />
      <h2 className="mono-dense-hl">{title}</h2>
      <div className="mono-body">
        <div className="mono-dense-cols">
          {col(left)}
          {col(right)}
        </div>
      </div>
      <Foot left={footer} right={footerRight} />
    </section>
  );
}

/* ── 10. Chart ─────────────────────────────────────────────────────────── */

export interface ChartBar {
  value: string;
  label: string;
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
  label = "Retention Analysis",
  page = "11",
  footer = "Research Team · [Month, Year]",
  footerRight = "11 / 18",
  title = "90-day retention by onboarding cohort",
  caption = "% retained · n=480 · [Q1 of study period]",
  bars = [
    { value: "34%", label: "Cohort 1", height: 108 },
    { value: "41%", label: "Cohort 2", height: 140 },
    { value: "48%", label: "Cohort 3", height: 173 },
    { value: "67%", label: "Proposed", height: 238, accent: true },
  ],
  source = "Source: [Analytics tool] · Cohort analysis · Proposed target based on redesigned onboarding flow",
}: ChartProps) {
  return (
    <section className="mono-slide mono-light mono-chart">
      <Chrome label={label} page={page} />
      <div className="mono-body mono-chart-body">
        <div className="mono-chart-header">
          <h2 className="mono-h2" style={{ fontWeight: 200 }}>
            {title}
          </h2>
          <span className="mono-caption mono-muted">{caption}</span>
        </div>
        <div className="mono-chart-wrapper">
          <div className="mono-bar-track">
            {bars.map((bar, i) => (
              <div className="mono-bar-col" key={i}>
                <span className={`mono-bar-val${bar.accent ? " mono-hi" : ""}`}>{bar.value}</span>
                <div
                  className={`mono-bar-fill${bar.accent ? " mono-accent" : ""}`}
                  style={{ height: bar.height }}
                />
                <span className="mono-bar-x">{bar.label}</span>
              </div>
            ))}
          </div>
          <div className="mono-chart-baseline" />
        </div>
        <p className="mono-chart-source">{source}</p>
      </div>
      <Foot left={footer} right={footerRight} />
    </section>
  );
}

/* ── 11. Diagram (flow) ────────────────────────────────────────────────── */

export interface FlowStep {
  num: string;
  title: string;
  desc: string;
}

export interface DiagramProps extends ChromeProps {
  title?: React.ReactNode;
  steps?: FlowStep[];
}

export function Diagram({
  label = "Methodology",
  page = "12",
  footer = "Research Team · [Month, Year]",
  footerRight = "12 / 18",
  title = "How this research was conducted",
  steps = [
    { num: "01", title: "Recruit", desc: "24 participants screened from the active user base. Mix of power, casual, and churned users within 90 days." },
    { num: "02", title: "Interview", desc: "60-minute moderated sessions. Cognitive walkthrough of key flows. Think-aloud protocol throughout." },
    { num: "03", title: "Analyse", desc: "Affinity mapping across 340 observations. Pattern clustering by behaviour type, not stated preference." },
    { num: "04", title: "Validate", desc: "Key findings stress-tested against session recordings and support ticket data before synthesis." },
  ],
}: DiagramProps) {
  return (
    <section className="mono-slide mono-light mono-diagram">
      <Chrome label={label} page={page} />
      <div className="mono-body mono-diagram-body">
        <h2 className="mono-h2" style={{ fontWeight: 200 }}>
          {title}
        </h2>
        <div className="mono-flow">
          {steps.map((step, i) => (
            <div className="mono-flow-step" key={i}>
              <div className="mono-flow-num">{step.num}</div>
              <div className="mono-flow-title">{step.title}</div>
              <div className="mono-flow-desc">{step.desc}</div>
            </div>
          ))}
        </div>
      </div>
      <Foot left={footer} right={footerRight} />
    </section>
  );
}

/* ── 12. Pie (donut) ───────────────────────────────────────────────────── */

export interface PieSegment {
  label: string;
  value: number;
  color: string;
}

export interface PieProps extends ChromeProps {
  title?: React.ReactNode;
  segments?: PieSegment[];
  total?: string;
  source?: string;
}

export function Pie({
  label = "Participant Breakdown",
  page = "13",
  footer = "[Research Team] · [Month, Year]",
  title = "Who we spoke with",
  segments = [
    { label: "Power Users", value: 38, color: "#1a1a16" },
    { label: "Casual Users", value: 25, color: "#5e5e54" },
    { label: "Churned Users", value: 22, color: "#8a8a80" },
    { label: "Prospects", value: 15, color: "#f0f0d4" },
  ],
  total = "Total participants: [N] · [Study period]",
  source = "Source: Recruitment screener · [Study period]",
}: PieProps) {
  return (
    <section className="mono-slide mono-light mono-pie">
      <Chrome label={label} page={page} />
      <div className="mono-body mono-pie-body">
        <h2 className="mono-h2" style={{ fontWeight: 200 }}>
          {title}
        </h2>
        <div className="mono-pie-row">
          <div className="mono-pie-donut" style={{ background: donutGradient(segments) }} />
          <div className="mono-pie-legend">
            {segments.map((seg, i) => (
              <div className="mono-pie-item" key={i}>
                <div className="mono-pie-swatch" style={{ background: seg.color }} />
                <span className="mono-pie-item-label">{seg.label}</span>
                <span className="mono-pie-item-val">{seg.value}%</span>
              </div>
            ))}
            <p className="mono-pie-total">{total}</p>
          </div>
        </div>
        <p className="mono-chart-source">{source}</p>
      </div>
      <Foot left={footer} right="" />
    </section>
  );
}

/* ── 13. Vertical timeline ─────────────────────────────────────────────── */

export interface TimelineRow {
  date: string;
  title: string;
  body: string;
}

export interface VerticalTimelineProps extends ChromeProps {
  title?: React.ReactNode;
  rows?: TimelineRow[];
}

export function VerticalTimeline({
  label = "Process",
  page = "14",
  footer = "[Research Team] · [Month, Year]",
  footerRight = "14",
  title = "From research to recommendation",
  rows = [
    { date: "[Week 1]", title: "Recruitment", body: "Screened [N]+ applicants, selected [N] participants across user segments." },
    { date: "[Week 2–3]", title: "Fieldwork", body: "[N] moderated sessions. Think-aloud protocol. All sessions recorded and transcribed." },
    { date: "[Week 4]", title: "Synthesis", body: "Affinity mapping across [N]+ observations. Pattern clustering by behaviour type." },
    { date: "[Week 5]", title: "Validation", body: "Findings stress-tested against [analytics tool] data and [N] support ticket samples." },
  ],
}: VerticalTimelineProps) {
  return (
    <section className="mono-slide mono-light mono-vtimeline-slide">
      <Chrome label={label} page={page} />
      <h2 className="mono-vt-hl">{title}</h2>
      <div className="mono-body">
        <div className="mono-vtimeline">
          {rows.map((row, i) => (
            <React.Fragment key={i}>
              <div className="mono-vt-date">{row.date}</div>
              <div className="mono-vt-spine" />
              <div className="mono-vt-content">
                <div className="mono-vt-title">{row.title}</div>
                <p className="mono-vt-body">{row.body}</p>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
      <Foot left={footer} right={footerRight} />
    </section>
  );
}

/* ── 14. Cycle ─────────────────────────────────────────────────────────── */

export interface CycleStep {
  num: string;
  title: string;
  desc: string;
}

export interface CycleProps extends ChromeProps {
  title?: React.ReactNode;
  steps?: CycleStep[];
}

export function Cycle({
  label = "Design Process",
  page = "15",
  footer = "[Research Team] · [Month, Year]",
  footerRight = "15",
  title = "The design thinking cycle",
  steps = [
    { num: "01", title: "Empathise", desc: "Understand users in their own context. Suspend assumptions. Observe before interpreting." },
    { num: "02", title: "Define", desc: "Reframe the problem as a point of view. One sentence. Testable. Grounded in observation." },
    { num: "03", title: "Prototype", desc: "Build to think, not to ship. The lowest fidelity that answers the question." },
    { num: "04", title: "Test", desc: "Put prototypes in front of real users. Capture what they do, not what they say." },
  ],
}: CycleProps) {
  const step = (data: CycleStep) => (
    <div className="mono-cycle-step">
      <div className="mono-cycle-num">{data.num}</div>
      <div className="mono-cycle-title">{data.title}</div>
      <p className="mono-cycle-desc">{data.desc}</p>
    </div>
  );
  const [s1, s2, s3, s4] = steps;
  return (
    <section className="mono-slide mono-light mono-cycle">
      <Chrome label={label} page={page} />
      <div className="mono-body mono-cycle-body">
        <h2 className="mono-h2" style={{ fontWeight: 200 }}>
          {title}
        </h2>
        <div className="mono-cycle-grid">
          {step(s1)}
          <div className="mono-cycle-arrow">→</div>
          {step(s2)}
          <div className="mono-cycle-arrow">↓</div>
          <div />
          <div className="mono-cycle-arrow">↓</div>
          {step(s4)}
          <div className="mono-cycle-arrow">←</div>
          {step(s3)}
        </div>
      </div>
      <Foot left={footer} right={footerRight} />
    </section>
  );
}

/* ── 15. Pyramid ───────────────────────────────────────────────────────── */

export interface PyramidProps extends ChromeProps {
  kicker?: string;
  title?: React.ReactNode;
  lead?: React.ReactNode;
  levels?: string[];
}

export function Pyramid({
  label = "Research Framework",
  page = "17",
  footer = "User Research Synthesis",
  footerRight = "Research Team",
  kicker = "Research Framework",
  title = "Analysis Hierarchy",
  lead = "From raw observations to strategic insight",
  levels = ["Strategic Insight", "Behavioral Patterns", "Synthesized Themes", "Coded Observations", "Raw Field Notes"],
}: PyramidProps) {
  return (
    <section className="mono-slide mono-light mono-pyramid">
      <Chrome label={label} page={page} />
      <div className="mono-body mono-pyr-body">
        <p className="mono-kicker">{kicker}</p>
        <h2 className="mono-h2">{title}</h2>
        <p className="mono-lead mono-muted">{lead}</p>
        <div className="mono-pyr-wrap">
          {levels.map((level, i) => (
            <div className="mono-pyr-level" key={i}>
              {level}
            </div>
          ))}
        </div>
      </div>
      <Foot left={footer} right={footerRight} />
    </section>
  );
}

/* ── 16. End ───────────────────────────────────────────────────────────── */

export interface EndProps {
  kicker?: string;
  title?: React.ReactNode;
  lead?: React.ReactNode;
}

export function End({
  kicker = "Research Team",
  title = "Questions, feedback, and next steps",
  lead = "[research@org.com] · [Slack #research] · Full report at [link]",
}: EndProps) {
  return (
    <section className="mono-slide mono-light mono-end">
      <p className="mono-kicker">{kicker}</p>
      <div className="mono-rule" style={{ margin: "16px 0" }} />
      <h2 className="mono-h1 mono-end-title">{title}</h2>
      <p className="mono-lead mono-muted mono-end-lead">{lead}</p>
    </section>
  );
}

/* ── 17–19. Image variants ─────────────────────────────────────────────── */

export interface ImageProps extends ChromeProps {
  kicker?: string;
  title?: React.ReactNode;
  body?: React.ReactNode;
  image?: string;
  caption?: string;
}

function Figure({ image, caption }: { image?: string; caption?: string }) {
  return (
    <figure className="mono-fig">
      {image ? <img src={image} alt="" /> : <div className="mono-img-ph">Image placeholder</div>}
      {caption ? <p className="mono-img-caption">{caption}</p> : null}
    </figure>
  );
}

export function ImageFull({
  label = "Exhibit",
  page = "",
  footer = "User Research Synthesis",
  footerRight = "Research Team",
  title = "Let the image carry the point",
  image = IMAGE_PLACEHOLDER,
  caption = "Image caption or source · [Year]",
}: ImageProps) {
  return (
    <section className="mono-slide mono-light mono-imgfull">
      <Chrome label={label} page={page} />
      <div className="mono-body mono-imgfull-body">
        {title ? <h3 className="mono-h3">{title}</h3> : null}
        <Figure image={image} caption={caption} />
      </div>
      <Foot left={footer} right={footerRight} />
    </section>
  );
}

export function ImageLeft({
  label = "Evidence",
  page = "",
  footer = "User Research Synthesis",
  footerRight = "Research Team",
  kicker = "In context",
  title = "Image and argument, side by side",
  body = "Use this when the visual and the editorial point need equal weight.",
  image = IMAGE_PLACEHOLDER,
  caption = "Image caption or source · [Year]",
}: ImageProps) {
  return (
    <section className="mono-slide mono-light mono-imgleft">
      <Chrome label={label} page={page} />
      <div className="mono-body mono-imgrow-body">
        <Figure image={image} caption={caption} />
        <div className="mono-imgrow-text">
          <p className="mono-kicker">{kicker}</p>
          <h2 className="mono-h2">{title}</h2>
          <p className="mono-lead mono-muted">{body}</p>
        </div>
      </div>
      <Foot left={footer} right={footerRight} />
    </section>
  );
}

export function ImageRight({
  label = "Evidence",
  page = "",
  footer = "User Research Synthesis",
  footerRight = "Research Team",
  kicker = "In context",
  title = "Argument first, then the image",
  body = "Use this when the conclusion should introduce the supporting visual.",
  image = IMAGE_PLACEHOLDER,
  caption = "Image caption or source · [Year]",
}: ImageProps) {
  return (
    <section className="mono-slide mono-light mono-imgright">
      <Chrome label={label} page={page} />
      <div className="mono-body mono-imgrow-body">
        <div className="mono-imgrow-text">
          <p className="mono-kicker">{kicker}</p>
          <h2 className="mono-h2">{title}</h2>
          <p className="mono-lead mono-muted">{body}</p>
        </div>
        <Figure image={image} caption={caption} />
      </div>
      <Foot left={footer} right={footerRight} />
    </section>
  );
}
