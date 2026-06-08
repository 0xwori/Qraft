import { Deck } from "@micro-keynote/deck-runtime";
import { BlockFrame } from "@micro-keynote/templates";
import "@micro-keynote/templates/block-frame/styles.css";

export default function GeneratedDeck() {
  return (
    <Deck theme="block-frame" title="Bitcoin: Digital Scarcity in BlockFrame" width={1920} height={1080}>
      <BlockFrame.Cover
        label="Bitcoin briefing"
        title={<>Digital<br />Scarcity<br />Network</>}
        subtitle="A bold five-slide view of what Bitcoin is, how it works, where it fits, and what trade-offs matter."
        cta="May 2026"
      />
      <BlockFrame.Timeline
        label="Mechanism"
        title="How The Network Settles Value"
        steps={[
          { numeral: "01", title: "Keys", body: "Users control coins with private keys and sign transactions from their wallets.", tone: "blue" },
          { numeral: "02", title: "Nodes", body: "Independent nodes check signatures, balances, and protocol rules.", tone: "pink" },
          { numeral: "03", title: "Mining", body: "Miners compete to add the next valid block through proof of work.", tone: "green" },
          { numeral: "04", title: "Blocks", body: "Transactions are timestamped, linked, and gain confidence as blocks build on top.", tone: "yellow" },
        ]}
      />
      <BlockFrame.Stats
        label="Monetary Design"
        title="Scarcity By The Numbers"
        stats={[
          { value: "21M", label: "Maximum bitcoin supply", tone: "pink" },
          { value: "~10", label: "Minutes per target block", tone: "blue" },
          { value: "210k", label: "Blocks between halvings", tone: "green" },
          { value: "Open", label: "Anyone can verify rules", tone: "yellow" },
        ]}
      />
      <BlockFrame.Features
        label="Trade-Offs"
        cards={[
          { icon: "S", title: "Supply", body: "Fixed issuance creates digital scarcity, but monetary policy is intentionally rigid.", tone: "pink" },
          { icon: "G", title: "Global Settlement", body: "The base layer is open and borderless, while fees and confirmation times can vary.", tone: "blue" },
          { icon: "C", title: "Custody", body: "Self-custody reduces reliance on institutions, but key management becomes operationally critical.", tone: "green" },
        ]}
      />
      <BlockFrame.End
        title={<>Infrastructure,<br />Not Just<br />A Ticker</>}
        subtitle="The core idea is a neutral ledger with predictable issuance, open verification, and real operational trade-offs."
        cta="Bitcoin Briefing"
      />
    </Deck>
  );
}
