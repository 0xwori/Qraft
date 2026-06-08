import { Deck } from "@micro-keynote/deck-runtime";
import { SoftEditorial } from "@micro-keynote/templates";
import "@micro-keynote/templates/soft-editorial/styles.css";

export default function GeneratedDeck() {
  return (
    <Deck theme="soft-editorial" title="Sprint 93.1 — Stories Overview" width={1920} height={1080}>
      <BlockFrame.Cover
  label="LMSMMA Board · Sprint 93.1"
  title={<>Stories<br />Overview</>}
  subtitle="May 27 – June 10, 2026 · 41 issues across Backend, Frontend, Android, iOS & SA"
  cta="Active Sprint"
/>
      <SoftEditorial.Cover
        kicker="New deck"
        title="Sprint 93.1 — Stories Overview"
      />
    </Deck>
  );
}
