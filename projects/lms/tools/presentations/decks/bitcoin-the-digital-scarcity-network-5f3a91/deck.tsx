import { Deck } from "@micro-keynote/deck-runtime";
import { BlockFrame } from "@micro-keynote/templates";
import "@micro-keynote/templates/block-frame/styles.css";

export default function GeneratedDeck() {
  return (
    <Deck theme="block-frame" title="Bitcoin: The Digital Scarcity Network" width={1920} height={1080}>
      <BlockFrame.Cover
        kicker="A five-slide explainer"
        title="Bitcoin: the digital scarcity network"
        lede="A concise view of what Bitcoin is, how it works, where it fits, and what trade-offs matter."
        date="May 2026"
        volume="Bitcoin Briefing"
      />
      <SoftEditorial.Process
        title="Bitcoin turns shared rules into a settlement network."
        sub="No central operator decides ownership; the network accepts transactions that follow the protocol."
        nodes={[
          { numeral: "01", title: "Keys", body: "Users control coins with private keys and sign transactions from their wallets." },
          { numeral: "02", title: "Nodes", body: "Independent nodes check signatures, balances, and protocol rules." },
          { numeral: "03", title: "Mining", body: "Miners compete to add the next block through proof of work." },
          { numeral: "04", title: "Blocks", body: "Valid transactions are grouped, timestamped, and linked to prior blocks." },
          { numeral: "05", title: "Finality", body: "Confidence grows as more blocks build on top of a transaction." },
        ]}
        timeline={["Wallet", "Mempool", "Miner", "Block", "Chain"]}
        eyebrow="Mechanism"
        page="02"
        date="May 2026"
        volume="Bitcoin Briefing"
      />
      <SoftEditorial.Numbers
        hero={{ value: "21M", label: "Maximum bitcoin supply encoded in the protocol" }}
        stats={[
          { value: "~10 min", label: "Target average time between new blocks" },
          { value: "210k", label: "Blocks between scheduled issuance halvings" },
        ]}
        eyebrow="Monetary Design"
        page="03"
        date="May 2026"
        volume="Bitcoin Briefing"
      />
      <SoftEditorial.Matrix
        title="Bitcoin is strongest when the problem is trust minimization."
        sub="Optimized for scarcity and censorship resistance, not every payment use case."
        columns={["Strength", "Watch-out", "Practical read"]}
        rows={[
          { label: "Supply", cells: [
            { label: "Fixed cap", pill: "yes" },
            { label: "Policy is rigid", pill: "note" },
            { label: "Digital scarcity", pill: "yes" },
          ]},
          { label: "Settlement", cells: [
            { label: "Global and open", pill: "yes" },
            { label: "Fees vary", pill: "part" },
            { label: "Base-layer value transfer", pill: "part" },
          ]},
          { label: "Custody", cells: [
            { label: "Self-sovereign", pill: "yes" },
            { label: "Key loss risk", pill: "note" },
            { label: "Operational discipline required", pill: "part" },
          ]},
        ]}
        eyebrow="Trade-offs"
        page="04"
        date="May 2026"
        volume="Bitcoin Briefing"
      />
      <BlockFrame.End
        kicker="Bottom line"
        title={<>Read Bitcoin as infrastructure,<br />not just a ticker.</>}
        signoff="The core idea is a neutral ledger with predictable issuance, open verification, and real operational trade-offs."
        eyebrow="Closing"
        date="May 2026"
        volume="Bitcoin Briefing"
      />
    </Deck>
  );
}
