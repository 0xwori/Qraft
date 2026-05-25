import { Deck } from "@micro-keynote/deck-runtime";
import { BlockFrame } from "@micro-keynote/templates";
import "@micro-keynote/templates/block-frame/styles.css";

type DoneItem = {
  key: string;
  title: string;
  assignee: string;
};

const generation: DoneItem[] = [
  { key: "TAP-110", title: "Improvement - Content is verslechterd v2 structuur", assignee: "Berry" },
  { key: "TAP-92", title: "Start generation from spec, only selected outcomes", assignee: "Berry" },
  { key: "TAP-90", title: "Enrichment selection screen if PDF is too small", assignee: "Berry" },
  { key: "TAP-89", title: "Level selection screen", assignee: "Berry" },
  { key: "TAP-88", title: "Size selection screen: quick, normal, extensive, blank start", assignee: "Berry" },
  { key: "TAP-86", title: "Dynamic onboarding routing, only show missing screens", assignee: "Berry" },
  { key: "TAP-85", title: "Infer onboarding fields from prompt with AI check", assignee: "Berry" },
  { key: "TAP-84", title: "Define the Spec contract, includes outline and placement", assignee: "Berry" },
  { key: "TAP-83", title: "Define the Spec contract, outline and placement", assignee: "Berry" },
];

const usage: DoneItem[] = [
  { key: "TAP-42", title: "Provider-native usage measurements", assignee: "Berry" },
  { key: "TAP-41", title: "Manage usage limits", assignee: "Berry" },
  { key: "TAP-40", title: "Workspace usage dashboard", assignee: "Berry" },
  { key: "TAP-39", title: "Topic debug analytics", assignee: "Berry" },
  { key: "TAP-38", title: "Usage metrics API", assignee: "Berry" },
  { key: "TAP-37", title: "Daily usage rollups", assignee: "Berry" },
  { key: "TAP-36", title: "Track product usage events", assignee: "Berry" },
  { key: "TAP-35", title: "Track AI usage and cost", assignee: "Berry" },
];

const learningUx: DoneItem[] = [
  { key: "TAP-64", title: "Open questions point systeem", assignee: "Berry" },
  { key: "TAP-26", title: "Toggle from outcome-based to chapter-based", assignee: "Unassigned" },
  { key: "TAP-25", title: "Slides frontend: add subtle audio player", assignee: "Unassigned" },
  { key: "TAP-24", title: "Slides backend: generate narration", assignee: "Unassigned" },
  { key: "TAP-23", title: "Slides backend: transcript generation", assignee: "Unassigned" },
  { key: "TAP-20", title: "Publisher Prompter settings", assignee: "Unassigned" },
  { key: "TAP-18", title: "Toggle between Publisher and Normal prompter", assignee: "Unassigned" },
];

const allDone = [...generation, ...usage, ...learningUx];

function IssueBoard({
  label,
  title,
  items,
  tone,
}: {
  label: string;
  title: string;
  items: DoneItem[];
  tone: "blue" | "green" | "pink" | "yellow";
}) {
  return (
    <section className={`bf-slide bf-${tone}`} style={{ flexDirection: "column", gap: 22, padding: 54 }}>
      <header className="bf-slide-header" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 36 }}>
        <div>
          <div className="bf-label bf-white">{label}</div>
          <h2 className="bf-heading-md" style={{ marginTop: 20, maxWidth: 1180, fontSize: 56, lineHeight: 1 }}>{title}</h2>
        </div>
        <div className="bf-data-box bf-white" style={{ width: 230, padding: 20 }}>
          <span>{items.length}</span>
          <small>Done stories</small>
        </div>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
        {items.map((item) => (
          <article
            key={item.key}
            style={{
              display: "grid",
              gridTemplateColumns: "140px 1fr 118px",
              alignItems: "center",
              gap: 18,
              border: "4px solid #000",
              background: "#fffdf5",
              boxShadow: "6px 6px 0 #000",
              padding: "10px 18px",
              minHeight: 48,
            }}
          >
            <strong
              style={{
                fontFamily: "Space Grotesk, ui-monospace, monospace",
                fontSize: 21,
                background: "#000",
                color: "#fff",
                padding: "8px 10px",
                textAlign: "center",
              }}
            >
              {item.key}
            </strong>
            <p style={{ margin: 0, fontSize: 21, fontWeight: 800, lineHeight: 1.12 }}>{item.title}</p>
            <small style={{ fontSize: 14, fontWeight: 800, textTransform: "uppercase", textAlign: "right" }}>{item.assignee}</small>
          </article>
        ))}
      </div>

      <p style={{ margin: "auto 0 0", fontSize: 15, fontWeight: 800 }}>
        Source: Tapwise Jira, fetched 2026-05-25. Filter used in this deck: returned Jira status name equals Done.
      </p>
    </section>
  );
}

export default function GeneratedDeck() {
  return (
    <Deck theme="block-frame" title="Tapwise Done Jira Stories" width={1920} height={1080}>
      <BlockFrame.Cover
        label="Tapwise Jira"
        title={<>Done<br />Stories</>}
        subtitle="A blockform overview of the Jira stories currently shown as Done for Tapwise."
        cta="24 completed items"
      />

      <BlockFrame.Stats
        label="Done Snapshot"
        title="What is complete"
        stats={[
          { value: String(allDone.length), label: "Done Jira stories", tone: "pink" },
          { value: String(generation.length), label: "Generation and onboarding", tone: "blue" },
          { value: String(usage.length), label: "Usage and analytics", tone: "green" },
          { value: String(learningUx.length), label: "Learning UX and slides", tone: "yellow" },
        ]}
      />

      <BlockFrame.Overview
        label="Workstreams"
        title={<>The done work<br />clusters into three blocks</>}
        body="The completed stories mostly build a better generation flow, stronger usage visibility, and richer learning outputs."
        pills={["Jira status: Done", "Fetched 2026-05-25"]}
        cards={[
          { title: "Generation and onboarding", body: "Spec contract, selected outcomes, level and size screens, and smarter onboarding routing." },
          { title: "Usage and analytics", body: "Usage events, AI cost tracking, rollups, dashboards, limits, and debug analytics." },
          { title: "Learning UX and slides", body: "Slide transcript, narration, audio player, prompter mode, and quiz/open-question work." },
        ]}
      />

      <IssueBoard
        label="Done Block 01"
        title="Generation and onboarding work made topic creation more controlled."
        tone="blue"
        items={generation}
      />

      <IssueBoard
        label="Done Block 02"
        title="Usage and analytics work added visibility into activity, cost, and limits."
        tone="green"
        items={usage}
      />

      <IssueBoard
        label="Done Block 03"
        title="Learning UX and slide work improved the student-facing outputs."
        tone="yellow"
        items={learningUx}
      />

      <BlockFrame.DiagramFull
        label="Product Meaning"
        title="The completed base reduces friction and improves control"
        body="In simple terms: Tapwise can ask better setup questions, generate from clearer specs, measure what users and AI consume, and make learning outputs richer."
        items={[
          { label: "01", title: "Ask", body: "Level, size, enrichment, and prompt inference shape setup.", tone: "blue" },
          { label: "02", title: "Generate", body: "Spec-driven generation targets selected outcomes.", tone: "pink" },
          { label: "03", title: "Measure", body: "Usage, costs, limits, rollups, and dashboards are trackable.", tone: "green" },
          { label: "04", title: "Teach", body: "Slides, narration, audio, prompts, and questions improve output quality.", tone: "yellow" },
        ]}
      />

      <BlockFrame.End
        title={<>Done list<br />ready for review</>}
        subtitle="The deck is built in qraftPptx with the BlockFrame style."
        cta="Tapwise Jira"
      />
    </Deck>
  );
}
