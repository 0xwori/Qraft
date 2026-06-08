import { Deck } from "@micro-keynote/deck-runtime";
import { Studio } from "@micro-keynote/templates";
import "@micro-keynote/templates/studio/styles.css";

const ETHEREUM_SIGNAL_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800'%3E%3Crect width='1200' height='800' fill='%231c1c1c'/%3E%3Cg fill='none' stroke='%23f5d200' stroke-width='3' opacity='.82'%3E%3Cpath d='M600 82 370 470 600 612 830 470 600 82Z'/%3E%3Cpath d='M600 330 370 470 600 612 830 470 600 330Z'/%3E%3Cpath d='M370 510 600 720 830 510'/%3E%3Cpath d='M600 82v638'/%3E%3C/g%3E%3Cg stroke='%23f5d200' opacity='.28'%3E%3Cpath d='M70 130h250M890 130h240M80 650h260M870 650h250'/%3E%3Cpath d='M170 230h120M910 250h170M120 520h160M950 540h120'/%3E%3C/g%3E%3C/svg%3E";

export default function GeneratedDeck() {
  return (
    <Deck theme="studio" title="Ethereum: The Programmable Settlement Layer" width={1920} height={1080}>
      <Studio.Cover
        title={<>Ethereum<br />Compute<br />Layer</>}
        image={ETHEREUM_SIGNAL_IMAGE}
        alt="Abstract Ethereum diamond and network lines"
        metaLeft={<>Accenture x LMS<br />May 2026</>}
        metaCenter="Ethereum briefing"
        metaRight="Studio theme"
      />
      <Studio.DiagramFull
        label="Network Model"
        page="02 / 03"
        footer="Ethereum briefing · Studio"
        title={<>Settlement,<br />Code,<br />Coordination</>}
        body="Ethereum extends a blockchain from value transfer into shared execution: accounts, smart contracts, and apps settle against the same public state."
        items={[
          { label: "01", title: "State", body: "The ledger stores accounts, balances, contract code, and application data." },
          { label: "02", title: "Execution", body: "Transactions call smart contracts; validators agree on the ordered result." },
          { label: "03", title: "Apps", body: "DeFi, identity, NFTs, DAOs, and rollups compose on top of shared primitives." },
          { label: "04", title: "Security", body: "Proof of stake aligns validators around finality, availability, and penalties." },
        ]}
      />
      <Studio.Compare
        label="Strategic Readout"
        page="03 / 03"
        footer="Ethereum briefing · Studio"
        left={{
          label: "Why it matters",
          title: <>A neutral runtime for digital agreements</>,
          body: "Ethereum makes logic, ownership, and settlement programmable without a single platform operator.",
          bullets: [
            "Smart contracts automate rules once deployed",
            "Open standards let apps and assets interoperate",
            "Layer-2 networks scale activity while anchoring to Ethereum",
          ],
        }}
        right={{
          label: "What to watch",
          title: <>Power comes with operating trade-offs</>,
          body: "The design is open and composable, but users and teams still manage complexity, fees, custody, and contract risk.",
          bullets: [
            "Key custody remains a user and enterprise control point",
            "Smart-contract bugs can become financial incidents",
            "Rollup and bridge choices affect trust, cost, and UX",
          ],
        }}
      />
    </Deck>
  );
}
