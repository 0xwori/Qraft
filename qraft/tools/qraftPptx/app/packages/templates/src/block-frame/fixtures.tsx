import * as React from "react";
import {
  Cover,
  Overview,
  Features,
  ChartData,
  Quote,
  Split,
  ImageFull,
  ImageLeft,
  ImageRight,
  DiagramFull,
  DiagramLeft,
  DiagramRight,
  Timeline,
  Stats,
  Team,
  End,
} from "./slides";

export const FIXTURES: Record<string, React.ReactElement> = {
  Cover: <Cover />,
  Overview: <Overview />,
  Features: <Features />,
  ChartData: <ChartData />,
  Quote: <Quote />,
  Split: <Split />,
  ImageFull: (
    <ImageFull
      label="Field Note"
      title="One visual can carry the whole argument."
      body="Use this when the image is the evidence and the copy only needs to frame what matters."
      image="https://placehold.co/600x400"
      tone="green"
    />
  ),
  ImageLeft: (
    <ImageLeft
      label="Context"
      title="Image left, narrative right."
      body="A balanced layout for case examples, product views, screenshots, or photographed evidence."
      image="https://placehold.co/600x400"
      tone="pink"
    />
  ),
  ImageRight: (
    <ImageRight
      label="Context"
      title="Narrative left, image right."
      body="Use this when a compact argument needs a strong supporting visual beside it."
      image="https://placehold.co/600x400"
      tone="blue"
    />
  ),
  DiagramFull: (
    <DiagramFull
      label="System Map"
      title="Diagram full frame"
      body="A high-impact structure slide for process, architecture, flow, or operating model views."
    />
  ),
  DiagramLeft: (
    <DiagramLeft
      label="Flow"
      title="Diagram left, explanation right."
      body="Use this when the structure needs to be read before the implication."
    />
  ),
  DiagramRight: (
    <DiagramRight
      label="Flow"
      title="Explanation left, diagram right."
      body="Use this when the conclusion introduces the structure."
    />
  ),
  Timeline: <Timeline />,
  Stats: <Stats />,
  Team: <Team />,
  End: <End />,
};
