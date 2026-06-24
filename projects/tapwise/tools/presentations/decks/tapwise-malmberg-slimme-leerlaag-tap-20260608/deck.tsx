import { Deck } from "@micro-keynote/deck-runtime";
import { Tap } from "@micro-keynote/templates";
import "@micro-keynote/templates/tap/styles.css";

const footer = "Tapwise x Malmberg";
const assetBase = "/deck-assets/tapwise/tapwise-malmberg-slimme-leerlaag-tap-20260608/assets";
const asset = (name: string) => `${assetBase}/${name}`;

export default function GeneratedDeck() {
  return (
    <Deck theme="tap" title="Tapwise x Malmberg - Slimme leerlaag" width={1920} height={1080}>
      <Tap.Cover
        title="Tapwise x Malmberg"
        image={asset("tapwise-hero-learning-layer.svg")}
        alt="Illustratie van een slimme leerlaag bovenop Malmberg-lesmateriaal"
        metaLeft={<>Voor Malmberg<br />Conceptpresentatie</>}
        metaCenter="TapEngine voor educatie"
        metaRight="Tapwise"
      />

      <Tap.List
        label="TapEngine"
        page="02 / 11"
        footer={footer}
        title="TapEngine"
        body="Centraal AI-systeem dat digitale content maakt van lesmateriaal."
        items={[
          "Upload lesmateriaal, hoofdstukken en afbeeldingen.",
          "Zet de inhoud om naar een doorzoekbare kennislaag, zodat AI antwoorden geeft vanuit de juiste bron.",
          "Slaat de volgorde en structuur van het boek op, zodat de leerroute logisch blijft.",
        ]}
      />

      <Tap.List
        label="MCP-systeem"
        page="03 / 11"
        footer={footer}
        title="TapEngine"
        body="MCP-systeem voor educatie. Per hoofdstuk kunnen we automatisch leeronderdelen maken."
        items={[
          "Podcasts",
          "Quizzen en adaptieve quizzen",
          "Open vragen met nakijkhulp",
          "Werkboeken",
          "Presentaties met hergebruik van afbeeldingen",
          "Korte videoscribes",
          "Chat met een specifiek hoofdstuk of met het hele boek, inclusief bronverwijzing.",
          "Opbouw van een AI-leerlingprofiel: wat beheerst de leerling, en waar is extra uitleg nodig?",
        ]}
      />

      <Tap.StatementLight
        title="Technische voorbeelden"
      />

      <Tap.DiagramFull
        label="Skills"
        page="05 / 11"
        footer={footer}
        title="TapEngine"
        body="MCP-systeem voor educatie: losse skills die samen een leerervaring vormen."
        items={[
          { label: "01", title: "Samenvatten", body: "Lesmateriaal omzetten naar duidelijke uitleg." },
          { label: "02", title: "Genereren", body: "Vragen, quizzen, werkboeken en presentaties maken." },
          { label: "03", title: "Controleren", body: "Bronnen en kwaliteit bewaken voor educatief gebruik." },
          { label: "04", title: "Bijsturen", body: "Leerlingdata vertalen naar passende vervolgstappen." },
        ]}
      />

      <Tap.Split
        label="Manier 1"
        page="06 / 11"
        footer={footer}
        kicker="Pilotomgeving"
        title="Zo kan het eruitzien"
        body="Manier 1: Tapwise UI. Een aparte Tapwise-omgeving om snel te testen met leerlingen."
        image={asset("tapwise-ui-pilot.svg")}
        alt="Illustratie van een Tapwise pilotomgeving voor leerlingen"
        caption="Tapwise UI als snelle pilot"
        bullets={[
          "Snelle pilot zonder grote technische integratie",
          "Malmberg-content in een begeleide route",
          "Direct zichtbaar hoe leerlingen oefenen",
        ]}
      />

      <Tap.Split
        label="Manier 2"
        page="07 / 11"
        footer={footer}
        kicker="Integratie"
        title="Ingebouwd in Malmberg"
        body="Manier 2: integratie. TapEngine draait achter de schermen en voedt onderdelen in de Malmberg-omgeving."
        image={asset("tapwise-integration.svg")}
        alt="Illustratie van TapEngine als integratielaag tussen content en leeromgeving"
        caption="TapEngine achter de schermen"
        bullets={[
          "Malmberg bepaalt wat zichtbaar wordt",
          "AI-functionaliteit stap voor stap toevoegen",
          "Bestaande leeromgeving blijft leidend",
        ]}
      />

      <Tap.Split
        label="Manier 3"
        page="08 / 11"
        footer={footer}
        kicker="Kanalen"
        title="Hulp op plekken die leerlingen al gebruiken"
        body="Manier 3: WhatsApp, Snapchat, Telegram of een ander kanaal."
        image={asset("tapwise-chat-channels.svg")}
        alt="Illustratie van meerdere leerkanalen die verbonden zijn met dezelfde bron"
        caption="Een bron, meerdere voordeuren"
        bullets={[
          "Leerlingen stellen vragen in een kanaal dat ze al gebruiken",
          "Antwoorden blijven gekoppeld aan de Malmberg-bron",
          "Handig voor korte herhaling, uitleg en reminders",
        ]}
      />

      <Tap.Compare
        label="Kanalen"
        page="09 / 11"
        footer={footer}
        left={{
          label: "Zelfde inhoud",
          title: "De bron blijft Malmberg",
          body: "De leerlaag gebruikt dezelfde gecontroleerde content.",
          bullets: ["Boek", "Hoofdstuk", "Leerdoel"],
        }}
        right={{
          label: "Andere voordeur",
          title: "Het kanaal kan verschillen",
          body: "De leerling kan de hulp krijgen op een plek die logisch voelt.",
          bullets: ["Tapwise UI", "Malmberg-integratie", "Chatkanaal"],
        }}
      />

      <Tap.Split
        label="Kwaliteit"
        page="10 / 11"
        footer={footer}
        kicker="Kwaliteitscontrole"
        title="Human in the loop backend"
        body="AI maakt voorwerk, mensen bewaken kwaliteit."
        image={asset("tapwise-review-loop.svg")}
        alt="Illustratie van docent of redacteur die AI-output controleert"
        caption="Review voordat leerlingen ermee werken"
        bullets={[
          "Docenten, redactie of vakexperts kunnen AI-output controleren.",
          "Nieuwe content krijgt review-gates voordat leerlingen ermee werken.",
          "Bronnen, wijzigingen en beslissingen blijven terug te vinden.",
        ]}
      />

      <Tap.End
        title="Samenwerking"
        contacts={[
          { name: "TapEngine", email: "AI-infrastructuur voor de educatiemarkt", phone: "" },
        ]}
        metaLeft={<>Slide 11<br />Tapwise x Malmberg</>}
        metaCenter="Samenwerking"
        metaRight="Tapwise"
      />
    </Deck>
  );
}
