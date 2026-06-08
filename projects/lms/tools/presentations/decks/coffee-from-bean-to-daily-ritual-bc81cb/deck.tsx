import { Deck } from "@micro-keynote/deck-runtime";
import { SoftEditorial } from "@micro-keynote/templates";
import "@micro-keynote/templates/soft-editorial/styles.css";

export default function GeneratedDeck() {
  return (
    <Deck theme="soft-editorial" title="Coffee, From Bean to Daily Ritual" width={1920} height={1080}>
      <SoftEditorial.Cover
  kicker="A short tasting deck"
  title="Coffee, from bean to daily ritual"
  lede="Five slides on origin, roast, brewing, flavor, and the small rituals that make coffee work."
  date="May 2026"
/>
      <SoftEditorial.Process
  title="The cup starts long before the kettle."
  sub="Coffee quality is shaped across a chain of small decisions."
  nodes={[
    { numeral: "01", title: "Grow", body: "Altitude, variety, soil, and shade set the baseline for sweetness and acidity." },
    { numeral: "02", title: "Process", body: "Washed, natural, and honey methods change body, clarity, and fruit notes." },
    { numeral: "03", title: "Roast", body: "Heat turns stored chemistry into aroma, color, and structure." },
    { numeral: "04", title: "Brew", body: "Grind, ratio, water, and time decide what finally lands in the cup." },
    { numeral: "05", title: "Serving tips", body: "Serve soon after brewing, pre-warm the cup, and pair milk or sugar with the roast profile." },
  ]}
  timeline={["Farm", "Mill", "Roastery", "Kitchen", "Table"]}
/>
      <SoftEditorial.Insights
  cards={[
    { label: "Arabica", sub: "Bright and aromatic", body: "Often prized for florals, citrus, stone fruit, and a cleaner finish." },
    { label: "Robusta", sub: "Bold and resilient", body: "Brings heavier body, more crema, and a punchier bitter edge." },
    { label: "Blend", sub: "Designed balance", body: "Roasters combine origins to stabilize sweetness, texture, and espresso performance." },
  ]}
/>
      <SoftEditorial.Matrix
  title="Every brew method trades clarity, body, and effort."
  sub="The best method depends on the morning you are solving for."
  columns={["Clarity", "Body", "Control"]}
  rows={[
    { label: "Pour-over", cells: [
      { label: "High", pill: "yes" },
      { label: "Light", pill: "part" },
      { label: "High", pill: "yes" },
    ]},
    { label: "French press", cells: [
      { label: "Soft", pill: "part" },
      { label: "Heavy", pill: "yes" },
      { label: "Medium", pill: "part" },
    ]},
    { label: "Espresso", cells: [
      { label: "Intense", pill: "yes" },
      { label: "Dense", pill: "yes" },
      { label: "Demanding", pill: "note" },
    ]},
  ]}
/>
      <SoftEditorial.End
  kicker="Closing note"
  title="Good coffee is repeatable attention."
  signoff="Use fresh beans, clean water, a consistent recipe, and one variable at a time."
/>
    
      </Deck>
  );
}
