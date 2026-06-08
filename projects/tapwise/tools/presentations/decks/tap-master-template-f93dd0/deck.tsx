import { Deck } from "@micro-keynote/deck-runtime";
import { SoftEditorial } from "@micro-keynote/templates";
import "@micro-keynote/templates/soft-editorial/styles.css";

export default function GeneratedDeck() {
  return (
    <Deck theme="soft-editorial" title="Tap — Master Template" width={1920} height={1080}>
      <SoftEditorial.Cover
  kicker="Tapwise · Tap Template"
  title="Van examenstof naar een slimme oefenroute"
  lede="Tapwise maakt examenstof oefenbaar met quizzen, uitleg, adaptive practice en AI-chat."
/>
      <SoftEditorial.Chapter
  marker="Tap — Slide Master"
  title="Sectie divider"
  body="Gebruik deze slide om een nieuw hoofdstuk of onderdeel te introduceren."
  background="blush"
/>
      <SoftEditorial.Next
  title="Content slide"
  body="Gebruik deze slide voor uitleg, bevindingen of een gestructureerd verhaal in drie stappen."
  items={[
    { numeral: "01", title: "Eerste punt", body: "Korte toelichting op het eerste onderdeel." },
    { numeral: "02", title: "Tweede punt", body: "Korte toelichting op het tweede onderdeel." },
    { numeral: "03", title: "Derde punt", body: "Korte toelichting op het derde onderdeel." },
  ]}
/>
      <SoftEditorial.Consult
  actionTag="Vergelijking"
  actionTitle="Tapwise gaat verder dan losse examenhulp"
  columns={[
    {
      heading: "Gewone examenhulp",
      bodyTop: "Je krijgt materiaal, maar weinig structuur.",
      bullets: [
        { label: "✗", body: "Veel zelf uitzoeken" },
        { label: "✗", body: "Lezen en oefenen los van elkaar" },
        { label: "✗", body: "Zelf onthouden wat lastig was" },
      ],
    },
    {
      heading: "Tapwise",
      bodyTop: "Je krijgt een slimme oefenroute met duidelijke stappen.",
      bullets: [
        { label: "✓", body: "Start met duidelijke stappen" },
        { label: "✓", body: "Quizzen, uitleg en herhaling in één bundel" },
        { label: "✓", body: "Adaptive practice laat lastige stof terugkomen" },
      ],
      meta: "Resultaat",
      source: "Gerichter oefenen, hogere slagingskans",
    },
  ]}
/>
      <SoftEditorial.Numbers
  hero={{ value: "87%", label: "Van leerlingen scoort hoger na gerichte oefening" }}
  stats={[
    { value: "4×", label: "Meer herhaling bij adaptive practice vs. zelf studeren" },
    { value: "3 stappen", label: "Zo werkt een Tapwise examenbundel" },
  ]}
/>
      <SoftEditorial.Process
  title="Zo werkt een examenbundel"
  sub="Kies, oefen, leer — in drie stappen klaar voor je CE."
  nodes={[
    { numeral: "01", title: "Kies je bundel", body: "Selecteer je vak en niveau. Elke bundel bevat examens van meerdere jaren." },
    { numeral: "02", title: "Maak oefenvragen", body: "Oefen met echte CE-vragen en quizzen op jouw niveau." },
    { numeral: "03", title: "Vraag AI om uitleg", body: "De AI-chat legt fouten uit binnen de context van jouw bundel." },
    { numeral: "04", title: "Zie waar je staat", body: "Het voortgangsdashboard toont wat je al beheerst en wat herhaling nodig heeft." },
  ]}
  timeline={["Stap 1", "Stap 2", "Stap 3", "Stap 4"]}
/>
      <SoftEditorial.Quote
  quote="Ik wist niet waar ik moest beginnen met leren. Tapwise gaf me eindelijk een duidelijke oefenroute."
  attribution="Leerling, HAVO 5"
  role="Gebruiker Tapwise examenbundel"
/>
      <SoftEditorial.End
  kicker="Klaar om te starten?"
  title="Bekijk de examenbundels voor jouw vak en niveau."
  signoff="tapwise.app"
/>
      <SoftEditorial.Cover
        kicker="New deck"
        title="Tap — Master Template"
      />
    </Deck>
  );
}
