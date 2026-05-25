import * as React from "react";
import {
  Cover,
  ChapterLight,
  StatementDark,
  Split,
  ImageFull,
  ImageLeft,
  ImageRight,
  DiagramFull,
  DiagramLeft,
  DiagramRight,
  Stats,
  List,
  Quote,
  Compare,
  ChapterDark,
  StatementLight,
  Chart,
  End,
} from "./slides";

export const FIXTURES: Record<string, React.ReactElement> = {
  Cover: <Cover />,
  ChapterLight: <ChapterLight />,
  StatementDark: <StatementDark />,
  Split: <Split />,
  ImageFull: (
    <ImageFull
      title="Let the image carry the argument"
      body="A full-frame visual with one severe readout, built for evidence or campaign work."
      image="https://placehold.co/600x400"
    />
  ),
  ImageLeft: (
    <ImageLeft
      title="Image left, argument right"
      body="A stark split for product views, research artifacts, locations, or campaign references."
      image="https://placehold.co/600x400"
    />
  ),
  ImageRight: (
    <ImageRight
      title="Argument left, image right"
      body="Use this when the visual should resolve the thought after the headline lands."
      image="https://placehold.co/600x400"
    />
  ),
  DiagramFull: (
    <DiagramFull
      title="System map"
      body="A full-frame structure for process, architecture, operating models, or strategic flow."
    />
  ),
  DiagramLeft: (
    <DiagramLeft
      title="Diagram left, readout right"
      body="Use this when the structure needs to be read before the implication."
    />
  ),
  DiagramRight: (
    <DiagramRight
      title="Readout left, diagram right"
      body="Use this when the conclusion introduces the structure."
    />
  ),
  Stats: <Stats />,
  List: <List />,
  Quote: <Quote />,
  Compare: <Compare />,
  ChapterDark: <ChapterDark />,
  StatementLight: <StatementLight />,
  Chart: <Chart />,
  End: <End />,
};
