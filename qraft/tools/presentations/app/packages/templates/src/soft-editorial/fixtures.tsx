import * as React from "react";
import {
  Cover,
  Foreword,
  Method,
  Insights,
  Closer,
  Chapter,
  Statement,
  Numbers,
  Stats,
  Quote,
  Next,
  Split,
  List,
  Chart,
  Process,
  Matrix,
  ImageFull,
  ImageLeft,
  ImageRight,
  DiagramFull,
  DiagramLeft,
  DiagramRight,
  Consult,
  End,
} from "./slides";

const lede =
  "A quiet, deliberate look at how small teams design with restraint — built on cream paper, set in Cormorant Garamond, scored with the occasional pop of blush and lemon.";

export const FIXTURES: Record<string, React.ReactElement> = {
  Cover: (
    <Cover
      kicker="Issue 03 · Soft Editorial"
      title={<>The quiet brief</>}
      lede={lede}
    />
  ),

  Foreword: (
    <Foreword
      opener={<>Slow design is a refusal — a posture, not a style.</>}
      body={[
        "We started Field Notes to push back, gently, against the loudness of the dashboard era. Not nostalgia for print, but a borrowing of its manners: generous margins, considered hierarchy, the patience of a serif.",
        "What follows is a short collection of methods, examples, and arguments we keep returning to. Read it the way you would a magazine — out of order, with a pencil, willing to disagree.",
      ]}
      signoff="The Editors"
    />
  ),

  Method: (
    <Method
      steps={[
        { numeral: "01", title: "Listen first", body: "Two weeks of interviews before a single artifact. Lines of dialog beat lines of code." },
        { numeral: "02", title: "Sketch in pairs", body: "Designer and engineer at one whiteboard. Tradeoffs surface before they become tickets." },
        { numeral: "03", title: "Prototype small", body: "One screen, one flow, one weekend. Throw it away on Monday if it does not earn its keep." },
        { numeral: "04", title: "Ship in chapters", body: "Release shaped like a magazine issue — themed, edited, and never the last word." },
      ]}
    />
  ),

  Insights: (
    <Insights
      cards={[
        { label: "Time to first edit", sub: "Onboarding, week 1", body: "Median dropped from 9 minutes to 2:40 once we removed the welcome modal and let the empty state do the teaching." },
        { label: "Weekly returns", sub: "Cohort: March", body: "Readers who saved a piece in their first session returned at 3.4× the rate of those who did not. Saving is the new signup." },
        { label: "Quiet hours", sub: "Engagement window", body: "Most thoughtful comments arrive between 8 and 10pm local. We stopped batching notifications across that window." },
      ]}
    />
  ),

  Closer: (
    <Closer
      marker="Chapter II"
      title={<>A page is a promise.</>}
      body="Every empty rectangle on the screen is asking you to make a decision. Make fewer, larger ones."
      background="pink"
    />
  ),

  Chapter: (
    <Chapter
      marker="Chapter III"
      title={<>On restraint.</>}
      body="The strongest argument for less is that it is harder. Anyone can add."
      background="lemon"
    />
  ),

  Statement: (
    <Statement
      marker="Manifesto"
      title={<>Slow software, by design.</>}
      body="We build tools at the speed of attention, not the speed of the feed."
      background="blush"
    />
  ),

  Numbers: (
    <Numbers
      hero={{ value: "62%", label: <em>of readers finish the piece</em> }}
      stats={[
        { value: "2:40", label: "median time to first edit" },
        { value: "3.4×", label: "return rate, savers vs. non-savers" },
      ]}
    />
  ),

  Stats: (
    <Stats
      hero={{ value: "91%", label: <em>shipped without a meeting</em> }}
      stats={[
        { value: "14", label: "issues per year, on Fridays" },
        { value: "0", label: "dashboards on the homepage" },
      ]}
    />
  ),

  Quote: (
    <Quote
      quote={<>The best interface is a paragraph someone wanted to write.</>}
      attribution="Mira Okafor"
      role="Editor-in-Chief, Field Notes"
    />
  ),

  Next: (
    <Next
      title={<>What we'll do next.</>}
      body="Three small bets for the next issue. Each one fits on a single Friday afternoon."
      items={[
        { numeral: "01", title: "Reading mode", body: "A single column, generous leading, no sidebar. The piece, and only the piece." },
        { numeral: "02", title: "Saved drawer", body: "A quiet shelf for the things you'll come back to. No counts, no badges." },
        { numeral: "03", title: "Weekly letter", body: "One short note on Sunday. Hand-signed by the editor on duty." },
      ]}
    />
  ),

  Split: (
    <Split
      title={<>How we'll measure it.</>}
      body="We don't measure attention with the same tools that fragment it."
      items={[
        { numeral: "01", title: "Finish rate", body: "Did the reader get to the end? More honest than time-on-page." },
        { numeral: "02", title: "Return within 7", body: "A second visit inside a week is the closest thing we have to a vote." },
        { numeral: "03", title: "Replies, not reactions", body: "Sentences in, sentences out. We count words, not thumbs." },
      ]}
    />
  ),

  List: (
    <List
      title={<>House rules.</>}
      body="The short list we hand to every new collaborator on day one."
      items={[
        { numeral: "01", title: "Write the headline first", body: "If you cannot, the piece isn't ready and the meeting isn't either." },
        { numeral: "02", title: "Cut the second adjective", body: "And usually the first. Nouns and verbs carry the weight." },
        { numeral: "03", title: "Ship on Friday", body: "Leave the weekend to argue with the work, gently." },
      ]}
    />
  ),

  Chart: (
    <Chart
      title={<>Retention, by cohort.</>}
      body="Readers who saved a piece in their first session stay. Everyone else churns by day 30."
      series={[
        { label: "Savers (first session)", color: "var(--ink)", points: "0,8 14,14 28,20 42,28 57,33 71,37 100,42", width: 1.1 },
        { label: "Non-savers", color: "var(--pink)", points: "0,8 14,30 28,52 42,68 57,78 71,86 100,92" },
      ]}
    />
  ),

  Process: (
    <Process
      title={<>How we'll work.</>}
      sub="Four short phases, each a single week. We don't carry work over."
      nodes={[
        { numeral: "01", title: "Listen", body: "Eight interviews, two themes, one shared transcript." },
        { numeral: "02", title: "Frame", body: "Pick the smallest cut of the problem worth shipping." },
        { numeral: "03", title: "Build", body: "One screen on Tuesday, one flow by Thursday." },
        { numeral: "04", title: "Send", body: "Ship on Friday. Read the replies on Monday." },
      ]}
      timeline={["Wk 1", "Wk 2", "Wk 3", "Wk 4"]}
    />
  ),

  Matrix: (
    <Matrix
      title={<>Where attention lives.</>}
      sub="A read of where the team should spend the next six weeks, by lever."
      columns={["Reading", "Saving", "Sharing", "Replying"]}
      rows={[
        { label: "Editorial pacing", cells: [
          { label: "Strong", pill: "yes" },
          { label: "Strong", pill: "yes" },
          { label: "Partial", pill: "part" },
          { label: "Weak", pill: "no" },
        ]},
        { label: "Empty states", cells: [
          { label: "Strong", pill: "yes" },
          { label: "Partial", pill: "part" },
          { label: "Weak", pill: "no" },
          { label: "n/a", pill: "note" },
        ]},
        { label: "Notifications", cells: [
          { label: "Weak", pill: "no" },
          { label: "Partial", pill: "part" },
          { label: "Strong", pill: "yes" },
          { label: "Strong", pill: "yes" },
        ]},
      ]}
    />
  ),

  ImageFull: (
    <ImageFull
      label="Visual"
      title={<>Let the image carry the room.</>}
      body="A full-slide image structure with a calm editorial caption panel."
      image="https://placehold.co/600x400"
    />
  ),

  ImageLeft: (
    <ImageLeft
      label="Artifact"
      title={<>Image on the left.</>}
      body="A balanced split for product shots, research artifacts, or location imagery with interpretation on the side."
      image="https://placehold.co/600x400"
    />
  ),

  ImageRight: (
    <ImageRight
      label="Artifact"
      title={<>Image on the right.</>}
      body="Use the mirrored split when the narrative needs to lead and the visual should resolve the thought."
      image="https://placehold.co/600x400"
    />
  ),

  DiagramFull: (
    <DiagramFull
      label="System"
      title={<>A diagram can be the slide.</>}
      body="Use this variant for architecture, operating models, or any flow that needs the full canvas."
    />
  ),

  DiagramLeft: (
    <DiagramLeft
      label="Model"
      title={<>Diagram first, read-out second.</>}
      body="A left-side model with concise interpretation beside it."
    />
  ),

  DiagramRight: (
    <DiagramRight
      label="Model"
      title={<>Read-out first, diagram second.</>}
      body="A mirrored structure for a short argument that resolves into a flow."
    />
  ),

  Consult: (
    <Consult
      actionTag="Recommendation"
      actionTitle={<>Move the save action to the body.</>}
      columns={[
        {
          heading: "What we saw",
          bodyTop: "The current save sits in the top toolbar, beside three other icons of equal weight.",
          bullets: [
            { label: "Discovery", body: "Only 8% of readers found it in the first session." },
            { label: "Recall", body: "Of those, half forgot it existed by week two." },
          ],
        },
        {
          heading: "What we propose",
          bodyTop: "A single, generous save chip at the end of each piece — set in the same serif as the body.",
          bullets: [
            { label: "Placement", body: "After the last paragraph, before the byline." },
            { label: "Affordance", body: "Plain text with a hairline border. No icon." },
          ],
          meta: "Estimated lift",
          source: "+18% to 7-day return, based on March A/B",
        },
      ]}
    />
  ),

  End: (
    <End
      kicker="Thank you."
      title={<>Until the next issue.</>}
      signoff="— Field Notes will return in autumn."
    />
  ),
};
