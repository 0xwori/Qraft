import * as React from "react";

const IMAGE_PLACEHOLDER_SRC = "https://placehold.co/600x400";

export interface TapChromeProps {
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
  title = "Van examenstof naar een slimme oefenroute",
  image = IMAGE_PLACEHOLDER_SRC,
  alt = "",
  metaLeft = <>Tapwise<br />Examenbundel</>,
  metaCenter = "Slim oefenen",
  metaRight = "Tapwise",
}: CoverProps) {
  return (
    <section className="tap-slide tap-light tap-cover">
      <div className="tap-cover-media">
        <img src={image} alt={alt} />
      </div>
      <h1 className="tap-display">{title}</h1>
      <div className="tap-cover-meta">
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

function Chapter({ chapter = "01 /", title = "Examenstof", surface = "light" }: ChapterProps) {
  return (
    <section className={`tap-slide tap-${surface} tap-chapter`}>
      <div className="tap-chapter-num">{chapter}</div>
      <h1 className="tap-h1">{title}</h1>
    </section>
  );
}

export function ChapterLight(props: Omit<ChapterProps, "surface">) {
  return <Chapter {...props} surface="light" />;
}

export function ChapterDark(props: Omit<ChapterProps, "surface">) {
  return <Chapter {...props} chapter={props.chapter ?? "02 /"} title={props.title ?? "Oefenvragen"} surface="dark" />;
}

export interface StatementProps {
  title?: React.ReactNode;
  surface?: "light" | "dark";
}

function Statement({ title = "Van examenstof naar een slimme oefenroute", surface = "light" }: StatementProps) {
  return (
    <section className={`tap-slide tap-${surface} tap-statement`}>
      <div className="tap-statement-body">
        <h1 className="tap-h1">{title}</h1>
      </div>
    </section>
  );
}

export function StatementLight(props: Omit<StatementProps, "surface">) {
  return <Statement {...props} surface="light" />;
}

export function StatementDark(props: Omit<StatementProps, "surface">) {
  return <Statement {...props} title={props.title ?? "Slimmer oefenen, beter scoren"} surface="dark" />;
}

export interface SplitProps extends TapChromeProps {
  kicker?: string;
  title?: React.ReactNode;
  body?: React.ReactNode;
  bullets?: string[];
  image?: string;
  alt?: string;
  caption?: React.ReactNode;
}

export function Split({
  label = "Aanpak",
  page = "04 / 12",
  footer = "Tapwise · [Datum]",
  kicker = "Onze aanpak",
  title = "Gericht oefenen op jouw niveau",
  body = "Tapwise combineert AI-quizzen, uitleg en podcasts om examenstof direct toepasbaar te maken. Elke oefensessie past zich aan jouw voortgang aan.",
  bullets = ["Adaptieve vragen per les", "Direct feedback na elk antwoord", "Podcasts voor onderweg"],
  image = IMAGE_PLACEHOLDER_SRC,
  alt = "",
  caption = "[Schermafbeelding · Tapwise app]",
}: SplitProps) {
  return (
    <section className="tap-slide tap-light tap-split">
      <Chrome label={label} page={page} />
      <div className="tap-split-body">
        <div className="tap-split-copy">
          <div className="tap-label tap-muted">{kicker}</div>
          <h2 className="tap-h2">{title}</h2>
          <p className="tap-lead">{body}</p>
          <TagList items={bullets} />
        </div>
        <figure className="tap-image-panel">
          <img src={image} alt={alt} />
          {caption ? <figcaption>{caption}</figcaption> : null}
        </figure>
      </div>
      <Foot footer={footer} page={page} />
    </section>
  );
}

export interface ImageSlideProps extends TapChromeProps {
  title?: React.ReactNode;
  body?: React.ReactNode;
  image?: string;
  alt?: string;
  caption?: React.ReactNode;
  surface?: "light" | "dark";
}

function TapImage({ image = IMAGE_PLACEHOLDER_SRC, alt = "", caption }: Pick<ImageSlideProps, "image" | "alt" | "caption">) {
  return (
    <figure className="tap-required-image">
      <img src={image} alt={alt} />
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}

export function ImageFull({
  label = "Beeld",
  page = "I / 03",
  footer = "Tapwise · [Datum]",
  title = "Laat het beeld de boodschap dragen",
  body = "Een full-frame visual voor product, campagne of resultaat.",
  image = IMAGE_PLACEHOLDER_SRC,
  alt = "",
  caption = "Tapwise · [Jaar]",
  surface = "light",
}: ImageSlideProps) {
  return (
    <section className={`tap-slide tap-${surface} tap-image-full`}>
      <Chrome label={label} page={page} />
      <TapImage image={image} alt={alt} caption={caption} />
      <div className="tap-image-full-copy">
        <h2 className="tap-h2">{title}</h2>
        {body ? <p className="tap-lead">{body}</p> : null}
      </div>
      <Foot footer={footer} page={page} />
    </section>
  );
}

function ImageSide({
  side,
  label = "Beeld",
  page = "I / 02",
  footer = "Tapwise · [Datum]",
  title = "Beeld en perspectief",
  body = "Gebruik deze lay-out voor een visual plus de toelichting die er betekenis aan geeft.",
  image = IMAGE_PLACEHOLDER_SRC,
  alt = "",
  caption = "Tapwise · [Jaar]",
}: ImageSlideProps & { side: "left" | "right" }) {
  const media = <TapImage image={image} alt={alt} caption={caption} />;
  const copy = (
    <div className="tap-required-copy">
      <h2 className="tap-h2">{title}</h2>
      {body ? <p className="tap-lead">{body}</p> : null}
    </div>
  );
  return (
    <section className={`tap-slide tap-light tap-image-side tap-${side}`}>
      <Chrome label={label} page={page} />
      <div className="tap-required-grid">
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

export interface DiagramSlideProps extends TapChromeProps {
  title?: React.ReactNode;
  body?: React.ReactNode;
  items?: DiagramItem[];
  surface?: "light" | "dark";
}

const DEFAULT_DIAGRAM_ITEMS: DiagramItem[] = [
  { label: "01", title: "Materiaal", body: "Upload je syllabus, bijlage of lesstof." },
  { label: "02", title: "AI-bundel", body: "Tapwise bouwt quizzen, uitleg en podcasts." },
  { label: "03", title: "Oefenen", body: "Leer gericht op jouw niveau en tempo." },
];

function TapDiagram({ items = DEFAULT_DIAGRAM_ITEMS }: { items?: DiagramItem[] }) {
  return (
    <div className="tap-diagram">
      {items.slice(0, 4).map((item, index) => (
        <article className="tap-diagram-node" key={`${item.label}-${item.title}`}>
          <div className="tap-diagram-top">
            <div className="tap-diagram-index">{item.label}</div>
            <div className="tap-diagram-icon" aria-hidden="true">
              <NodeIcon index={index} />
            </div>
          </div>
          <h3 className="tap-h3">{item.title}</h3>
          <p className="tap-body">{item.body}</p>
          {index < Math.min(items.length, 4) - 1 ? <span className="tap-diagram-line" /> : null}
        </article>
      ))}
    </div>
  );
}

export function DiagramFull({
  label = "Diagram",
  page = "D / 03",
  footer = "Tapwise · [Datum]",
  title = "Hoe het werkt",
  body = "Van ruwe lesstof naar een slimme oefenbundel in drie stappen.",
  items = DEFAULT_DIAGRAM_ITEMS,
  surface = "light",
}: DiagramSlideProps) {
  return (
    <section className={`tap-slide tap-${surface} tap-diagram-full`}>
      <Chrome label={label} page={page} />
      <div className="tap-diagram-head">
        <h2 className="tap-h2">{title}</h2>
        {body ? <p className="tap-lead">{body}</p> : null}
      </div>
      <TapDiagram items={items} />
      <Foot footer={footer} page={page} />
    </section>
  );
}

function DiagramSide({
  side,
  label = "Diagram",
  page = "D / 02",
  footer = "Tapwise · [Datum]",
  title = "Model en toelichting",
  body = "Gebruik dit wanneer het diagram en de conclusie gelijk gewicht verdienen.",
  items = DEFAULT_DIAGRAM_ITEMS,
}: DiagramSlideProps & { side: "left" | "right" }) {
  const diagram = <TapDiagram items={items} />;
  const copy = (
    <div className="tap-required-copy">
      <h2 className="tap-h2">{title}</h2>
      {body ? <p className="tap-lead">{body}</p> : null}
    </div>
  );
  return (
    <section className={`tap-slide tap-light tap-diagram-side tap-${side}`}>
      <Chrome label={label} page={page} />
      <div className="tap-required-grid">
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

export interface TapStat {
  value: string;
  label: string;
  note?: string;
}

export interface StatsProps extends TapChromeProps {
  title?: React.ReactNode;
  stats?: TapStat[];
}

export function Stats({
  label = "Cijfers",
  page = "05 / 12",
  footer = "Tapwise · [Datum]",
  title = "Tapwise in cijfers",
  stats = [
    { value: "50k+", label: "Actieve leerlingen", note: "Groeit elke maand" },
    { value: "200+", label: "Vakken beschikbaar", note: "VMBO t/m VWO" },
    { value: "4.8", label: "Gemiddelde beoordeling", note: "App Store & Google Play" },
  ],
}: StatsProps) {
  return (
    <section className="tap-slide tap-light tap-stats">
      <Chrome label={label} page={page} />
      <div className="tap-stats-body">
        <h2 className="tap-h2">{title}</h2>
        <div className="tap-stats-grid">
          {stats.slice(0, 3).map((stat) => (
            <article className="tap-stat-card" key={`${stat.value}-${stat.label}`}>
              <div className="tap-stat-value">{stat.value}</div>
              <div className="tap-stat-label">{stat.label}</div>
              {stat.note ? <div className="tap-stat-note">{stat.note}</div> : null}
            </article>
          ))}
        </div>
      </div>
      <Foot footer={footer} page={page} />
    </section>
  );
}

export interface ListProps extends TapChromeProps {
  title?: React.ReactNode;
  body?: React.ReactNode;
  items?: string[];
}

export function List({
  label = "Functies",
  page = "06 / 12",
  footer = "Tapwise · [Datum]",
  title = "Wat zit er in een bundel?",
  body = "Elke bundel is samengesteld voor een specifiek vak en niveau — met alle tools die je nodig hebt voor je CE.",
  items = [
    "Adaptieve quizzen per onderwerp",
    "AI-chat voor directe uitleg",
    "Podcasts voor onderweg",
    "Voortgangsdashboard",
    "Officieel examenprogramma als basis",
  ],
}: ListProps) {
  return (
    <section className="tap-slide tap-light tap-list">
      <Chrome label={label} page={page} />
      <div className="tap-list-body">
        <div className="tap-list-head">
          <h2 className="tap-h2">{title}</h2>
          <p className="tap-lead">{body}</p>
        </div>
        <TagList items={items} />
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
  quote = "Tapwise maakt oefenen zo makkelijk dat ik het eigenlijk niet meer uitstelde.",
  attribution = "[Naam leerling]",
  role = "VWO 6 · [School] · [Jaar]",
}: QuoteProps) {
  return (
    <section className="tap-slide tap-light tap-quote">
      <p className="tap-quote-text">{quote}</p>
      <div className="tap-quote-attr">
        <span className="tap-label">{attribution}</span>
        <span className="tap-label tap-muted">{role}</span>
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

export interface CompareProps extends TapChromeProps {
  left?: ComparePanel;
  right?: ComparePanel;
}

export function Compare({
  label = "Vergelijking",
  page = "08 / 12",
  footer = "Tapwise · [Datum]",
  left = {
    label: "Traditioneel",
    title: "Losse PDF's en eindeloos samenvatten",
    body: "Studeren vanuit dikke boeken en onduidelijke samenvattingen. Geen idee of je het echt begrijpt.",
    bullets: ["Geen feedbackloop", "Moeilijk bij te houden per onderwerp", "Saaie herhaling zonder structuur"],
  },
  right = {
    label: "Met Tapwise",
    title: "Gerichte oefenroute op jouw niveau",
    body: "Tapwise levert direct de juiste vragen, uitleg en podcasts — afgestemd op jouw voortgang.",
    bullets: ["Directe feedback per vraag", "Adaptief per vak en niveau", "Leren ook zonder wifi, via podcast"],
  },
}: CompareProps) {
  return (
    <section className="tap-slide tap-light tap-compare">
      <Chrome label={label} page={page} />
      <div className="tap-compare-body">
        {[left, right].map((panel) => (
          <article className="tap-compare-panel" key={panel.label}>
            <div className="tap-compare-label">{panel.label}</div>
            <h3 className="tap-h3">{panel.title}</h3>
            <p className="tap-body">{panel.body}</p>
            <TagList items={panel.bullets} />
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

export interface ChartProps extends TapChromeProps {
  title?: React.ReactNode;
  caption?: React.ReactNode;
  bars?: ChartBar[];
  source?: string;
}

export function Chart({
  label = "Groei",
  page = "11 / 12",
  footer = "Tapwise · [Datum]",
  title = "Gebruikers per kwartaal",
  caption = "Aantal actieve leerlingen · Tapwise",
  bars = [
    { label: "Q1", value: 8000 },
    { label: "Q2", value: 15000 },
    { label: "Q3", value: 28000 },
    { label: "Q4", value: 41000 },
    { label: "Nu", value: 50000 },
  ],
  source = "Bron: Tapwise intern · [Jaar]",
}: ChartProps) {
  const max = Math.max(...bars.map((bar) => bar.value), 1);
  return (
    <section className="tap-slide tap-light tap-chart">
      <Chrome label={label} page={page} />
      <div className="tap-chart-body">
        <div className="tap-chart-header">
          <h2 className="tap-h2">{title}</h2>
          <p className="tap-label tap-muted">{caption}</p>
        </div>
        <div className="tap-chart-wrapper">
          {bars.map((bar) => (
            <div className="tap-chart-bar" key={bar.label}>
              <div className="tap-chart-fill" style={{ height: `${Math.max(12, (bar.value / max) * 100)}%` }} />
              <span>{bar.value.toLocaleString("nl-NL")}</span>
              <small>{bar.label}</small>
            </div>
          ))}
          <div className="tap-chart-baseline" />
        </div>
        <p className="tap-chart-source">{source}</p>
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
  title = "Vragen of opmerkingen?",
  contacts = [
    { name: "[Naam A]", email: "naam@tapwise.nl", phone: "+31 6 00 000 000" },
    { name: "[Naam B]", email: "naam@tapwise.nl", phone: "+31 6 00 000 000" },
  ],
  metaLeft = <>Pagina 12<br />Tapwise · [Datum]</>,
  metaCenter = "[Presentatietitel]",
  metaRight = "Tapwise",
}: EndProps) {
  return (
    <section className="tap-slide tap-light tap-end">
      <h1 className="tap-h1">{title}</h1>
      <div className="tap-end-contacts">
        {contacts.map((contact) => (
          <p className="tap-body" key={`${contact.name}-${contact.email}`}>
            Neem contact op met {contact.name}
            {contact.email ? <> via {contact.email}</> : null}
            {contact.phone ? <> of bel {contact.phone}</> : null}
          </p>
        ))}
      </div>
      <div className="tap-cover-meta tap-end-meta">
        <span>{metaLeft}</span>
        <span>{metaCenter}</span>
        <span>{metaRight}</span>
      </div>
    </section>
  );
}

function Chrome({ label, page }: Required<Pick<TapChromeProps, "label" | "page">>) {
  return (
    <div className="tap-chrome">
      <span className="tap-label tap-muted">{label}</span>
      <span className="tap-label tap-muted">{page}</span>
    </div>
  );
}

function Foot({ footer, page }: Required<Pick<TapChromeProps, "footer" | "page">>) {
  return (
    <div className="tap-foot">
      <span className="tap-label tap-muted">{footer}</span>
      <span className="tap-label tap-muted">{page}</span>
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <ul className="tap-tag-list">
      {items.map((item) => (
        <li key={item}>
          <span className="tap-tag-icon" aria-hidden="true">
            <CheckIcon />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      <path d="M5 12.5 10 17 19 7" />
    </svg>
  );
}

function NodeIcon({ index }: { index: number }) {
  const icons = [
    <path key="doc" d="M7 4h8l4 4v12H7V4Zm8 0v5h4M10 13h6M10 16h5" />,
    <path key="spark" d="M12 4v5M12 15v5M4 12h5M15 12h5M7 7l3 3M14 14l3 3M17 7l-3 3M10 14l-3 3" />,
    <path key="check" d="M5 12.5 10 17 19 7M4 4h16v16H4z" />,
    <path key="route" d="M6 6h.1M18 18h.1M7 6c7 0 10 3 10 10M14 16h4v-4" />,
  ];
  return (
    <svg viewBox="0 0 24 24" focusable="false">
      {icons[index % icons.length]}
    </svg>
  );
}
