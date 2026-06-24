import { Deck } from "@micro-keynote/deck-runtime";
import { Broadside } from "@micro-keynote/templates";
import "@micro-keynote/templates/broadside/styles.css";
import "./deck.css";

const footer = "Tapwise x Malmberg";

export default function GeneratedDeck() {
  return (
    <Deck theme="broadside" title="Tapwise x Malmberg: AI-leerlaag" width={1920} height={1080}>
      <Broadside.Cover
        number="01"
        label="Discovery deck"
        author="Tapwise"
        context="Malmberg gesprek"
        title={<>AI-<br />leerlaag</>}
        subtitle="Van examenstof naar persoonlijke leerinterventies bovenop betrouwbare uitgeverscontent."
      />

      <Broadside.Statement
        label="Reality check"
        page="02"
        footer={footer}
        kicker="Geen blanco markt"
        title={<>Malmberg weet al dat AI belangrijk is.</>}
      />

      <Broadside.List
        label="Tapwise vandaag"
        page="03"
        footer={footer}
        kicker="Smal, concreet, meetbaar"
        title={<>slimme examenbundeltrainer</>}
        items={[
          "digitale oefenbundels met echte CE-vragen",
          "quizzen en adaptive practice",
          "uitleg, podcasts en persoonlijke voortgang",
          "AI-chat binnen de context van de bundel",
          "niet nog een map met materiaal, maar een begeleide route",
        ]}
      />

      <Broadside.DiagramFull
        label="Technologie"
        page="04"
        footer={footer}
        surface="orange"
        title={<>van bron naar leerervaring</>}
        body="De waarde zit niet alleen in genereren. De waarde zit in de feedbackloop: oefenen, meten, aanpassen en adviseren."
        items={[
          { label: "01", title: "Structuur", body: "Bronmateriaal wordt gekoppeld aan leerdoelen en skills." },
          { label: "02", title: "Oefenen", body: "Leerlingen werken via quizzen, uitleg en adaptive practice." },
          { label: "03", title: "Meten", body: "Gedrag maakt zichtbaar waar iemand vastloopt." },
          { label: "04", title: "Interventie", body: "AI helpt de juiste volgende stap te kiezen." },
        ]}
      />

      <Broadside.Compare
        label="Uitgeverswaarde"
        page="05"
        footer={footer}
        left={{
          label: "Malmberg brengt",
          title: "bron van waarheid",
          body: "Sterke content, vakdidactiek, redactionele kwaliteit en toegang tot scholen.",
          bullets: ["methodecontent", "leerdoelen", "schoolrelaties", "distributie"],
        }}
        right={{
          label: "Tapwise onderzoekt",
          title: "leerlaag erboven",
          body: "Een interactieve, meetbare en adaptieve laag die leerlinggedrag omzet naar vervolgstappen.",
          bullets: ["oefenroutes", "AI-feedback", "multimodale uitleg", "leerlingdata"],
        }}
      />

      <Broadside.DiagramFull
        label="AI-interventies"
        page="06"
        footer={footer}
        surface="dark"
        title={<>van fout antwoord naar passende uitleg</>}
        body="De ambitie is niet dat AI zomaar content blijft maken. De ambitie is dat AI op basis van gedrag de juiste interventie kiest."
        items={[
          { label: "01", title: "Fout", body: "De leerling maakt een fout of loopt vast." },
          { label: "02", title: "Patroon", body: "Tapwise herkent een zwak leerdoel of misconceptie." },
          { label: "03", title: "Uitleg", body: "AI kiest een passende uitlegvorm." },
          { label: "04", title: "Check", body: "Nieuwe vragen meten of het begrip verbetert." },
        ]}
      />

      <Broadside.List
        label="Whiteboard"
        page="07"
        footer={footer}
        kicker="Wanneer tekst niet genoeg is"
        title={<>korte visuele uitleg als remedie</>}
        items={[
          "biologie: fotosynthese, osmose, bloedsomloop",
          "natuurkunde: krachten, elektriciteit, lenzen",
          "wiskunde: formules, grafieken, stappenplannen",
          "economie en geschiedenis: oorzaak, gevolg en dynamiek",
          "na de video volgen checkvragen om effect te meten",
        ]}
      />

      <Broadside.Compare
        label="Pilot"
        page="08"
        footer={footer}
        left={{
          label: "Scope",
          title: "klein genoeg om te leren",
          body: "Een afgebakende pilot houdt kwaliteit, risico en meting beheersbaar.",
          bullets: ["een vak", "een niveau", "een onderwerp", "docentcontrole vooraf"],
        }}
        right={{
          label: "Succes",
          title: "bewijs dat het helpt",
          body: "De pilot moet laten zien of dit waarde toevoegt naast bestaande Malmberg-tools.",
          bullets: ["beter begrip", "docenttijd besparen", "betrouwbare AI-uitleg", "nieuwe inzichten"],
        }}
      />

      <Broadside.List
        label="Discovery"
        page="09"
        footer={footer}
        kicker="Vragen voor Malmberg"
        title={<>waar zoeken jullie versnelling?</>}
        items={[
          "is examenvoorbereiding strategisch interessant?",
          "welke leerlingdata mag vervolgstappen adviseren?",
          "meer materiaal of betere interventie-adviezen?",
          "waarde in korte visuele AI-uitleg?",
          "bestaand platform of eerst losse pilot?",
          "welke review-gates zijn minimaal nodig?",
        ]}
      />

      <Broadside.End
        label="Open vraag"
        title={<>waar past Tapwise?</>}
        body="Waar zit volgens jullie het grootste gat tussen de bestaande digitale leeromgeving, de AI-roadmap en wat scholen nu nodig hebben?"
      />
    </Deck>
  );
}
