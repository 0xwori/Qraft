import * as React from "react";
import { Cover, ChapterLight, ChapterDark, StatementLight, StatementDark, Split, ImageFull, ImageLeft, ImageRight, DiagramFull, DiagramLeft, DiagramRight, Stats, List, Quote, Compare, Chart, End } from "./slides";

export const FIXTURES: Record<string, React.ReactElement> = {
  Cover: <Cover />,
  ChapterLight: <ChapterLight />,
  ChapterDark: <ChapterDark />,
  StatementLight: <StatementLight />,
  StatementDark: <StatementDark />,
  Split: <Split />,
  ImageFull: <ImageFull />,
  ImageLeft: <ImageLeft />,
  ImageRight: <ImageRight />,
  DiagramFull: <DiagramFull />,
  DiagramLeft: <DiagramLeft />,
  DiagramRight: <DiagramRight />,
  Stats: <Stats />,
  List: <List />,
  Quote: <Quote />,
  Compare: <Compare />,
  Chart: <Chart />,
  End: <End />,
};
