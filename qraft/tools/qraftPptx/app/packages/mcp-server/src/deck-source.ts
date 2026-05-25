import path from "node:path";
import { promises as fs } from "node:fs";
import {
  Project,
  SyntaxKind,
  Node,
  type SourceFile,
  type JsxElement,
  type JsxSelfClosingElement,
  type JsxAttribute,
} from "ts-morph";

export interface SourceSlideProp {
  name: string;
  /**
   * Editable string value when the prop is a string literal (or template
   * literal with no expressions). null when the prop is a complex expression
   * the simple editor can't safely round-trip.
   */
  value: string | null;
  kind: "string" | "expression";
  /** Source location of the value node (1-based line, 1-based col). */
  line: number;
  col: number;
}

export interface SourceSlide {
  /** 0-based child index inside the <Deck> root. */
  index: number;
  /** The JSX tag name as written (e.g. "Broadside.Cover"). */
  component: string;
  /** 1-based line of the opening tag. */
  line: number;
  props: SourceSlideProp[];
}

export interface DeckSource {
  file: string;
  slides: SourceSlide[];
}

export interface DeckSourceRef {
  /** Slide child index inside <Deck>. */
  slideIndex: number;
  /** Prop name as it appears in JSX. */
  propName: string;
}

const DECK_TAG = "Deck";

function findDeckElement(sf: SourceFile): JsxElement | undefined {
  return sf.getDescendantsOfKind(SyntaxKind.JsxElement).find((el) => {
    const open = el.getOpeningElement();
    return open.getTagNameNode().getText() === DECK_TAG;
  });
}

function jsxChildren(deck: JsxElement): Array<JsxElement | JsxSelfClosingElement> {
  const out: Array<JsxElement | JsxSelfClosingElement> = [];
  for (const child of deck.getJsxChildren()) {
    if (child.isKind(SyntaxKind.JsxElement) || child.isKind(SyntaxKind.JsxSelfClosingElement)) {
      out.push(child as JsxElement | JsxSelfClosingElement);
    }
  }
  return out;
}

function tagName(el: JsxElement | JsxSelfClosingElement): string {
  if (el.isKind(SyntaxKind.JsxElement)) return el.getOpeningElement().getTagNameNode().getText();
  return el.getTagNameNode().getText();
}

function attributes(el: JsxElement | JsxSelfClosingElement): JsxAttribute[] {
  const open = el.isKind(SyntaxKind.JsxElement) ? el.getOpeningElement() : el;
  return open
    .getAttributes()
    .filter((a): a is JsxAttribute => a.isKind(SyntaxKind.JsxAttribute));
}

function propValue(attr: JsxAttribute): SourceSlideProp {
  const name = attr.getNameNode().getText();
  const init = attr.getInitializer();
  if (!init) {
    const start = attr.getStartLineNumber();
    return { name, value: "true", kind: "expression", line: start, col: 1 };
  }
  if (init.isKind(SyntaxKind.StringLiteral) || init.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)) {
    const sf = attr.getSourceFile();
    const pos = sf.getLineAndColumnAtPos(init.getStart());
    return {
      name,
      value: init.getLiteralText(),
      kind: "string",
      line: pos.line,
      col: pos.column,
    };
  }
  if (init.isKind(SyntaxKind.JsxExpression)) {
    const expr = init.getExpression();
    if (expr && (expr.isKind(SyntaxKind.StringLiteral) || expr.isKind(SyntaxKind.NoSubstitutionTemplateLiteral))) {
      const sf = attr.getSourceFile();
      const pos = sf.getLineAndColumnAtPos(expr.getStart());
      return {
        name,
        value: expr.getLiteralText(),
        kind: "string",
        line: pos.line,
        col: pos.column,
      };
    }
  }
  const sf = attr.getSourceFile();
  const pos = sf.getLineAndColumnAtPos(init.getStart());
  return { name, value: null, kind: "expression", line: pos.line, col: pos.column };
}

export async function readDeckSource(deckTsxPath: string): Promise<DeckSource> {
  const project = new Project({ useInMemoryFileSystem: false, skipAddingFilesFromTsConfig: true });
  const sf = project.addSourceFileAtPath(deckTsxPath);
  const deck = findDeckElement(sf);
  if (!deck) return { file: deckTsxPath, slides: [] };
  const children = jsxChildren(deck);
  const slides: SourceSlide[] = children.map((child, index) => {
    const open = child.isKind(SyntaxKind.JsxElement) ? child.getOpeningElement() : child;
    const pos = sf.getLineAndColumnAtPos(open.getStart());
    return {
      index,
      component: tagName(child),
      line: pos.line,
      props: attributes(child).map(propValue),
    };
  });
  return { file: deckTsxPath, slides };
}

export interface PatchSourceInput {
  ref: DeckSourceRef;
  /** New string value to write into the prop. */
  value: string;
}

export interface PatchSourceResult {
  ok: true;
  source: DeckSource;
}

export async function patchDeckSource(
  deckTsxPath: string,
  input: PatchSourceInput,
): Promise<PatchSourceResult> {
  const project = new Project({ useInMemoryFileSystem: false, skipAddingFilesFromTsConfig: true });
  const sf = project.addSourceFileAtPath(deckTsxPath);
  const deck = findDeckElement(sf);
  if (!deck) throw new Error("deck.tsx does not contain a <Deck> root element");
  const children = jsxChildren(deck);
  const target = children[input.ref.slideIndex];
  if (!target) throw new Error(`Slide index ${input.ref.slideIndex} out of range`);
  const attr = attributes(target).find((a) => a.getNameNode().getText() === input.ref.propName);
  if (!attr) throw new Error(`Prop ${input.ref.propName} not found on slide ${input.ref.slideIndex}`);

  const init = attr.getInitializer();
  const literal = JSON.stringify(input.value);
  if (!init) {
    attr.setInitializer(literal);
  } else if (
    init.isKind(SyntaxKind.StringLiteral) ||
    init.isKind(SyntaxKind.NoSubstitutionTemplateLiteral)
  ) {
    attr.setInitializer(literal);
  } else if (init.isKind(SyntaxKind.JsxExpression)) {
    const expr = init.getExpression();
    if (
      expr &&
      (expr.isKind(SyntaxKind.StringLiteral) || expr.isKind(SyntaxKind.NoSubstitutionTemplateLiteral))
    ) {
      attr.setInitializer(literal);
    } else {
      throw new Error(`Prop ${input.ref.propName} is not a string literal — refuse to patch`);
    }
  } else {
    throw new Error(`Prop ${input.ref.propName} is not a string literal — refuse to patch`);
  }

  await sf.save();
  const after = await readDeckSource(deckTsxPath);
  return { ok: true, source: after };
}

export async function deckSourcePath(deckRoot: string): Promise<string | null> {
  const candidate = path.join(deckRoot, "deck.tsx");
  try {
    await fs.access(candidate);
    return candidate;
  } catch {
    return null;
  }
}

export interface ReorderInput {
  /** Final ordering of slides as 0-based current indices. Length must match slide count. */
  order: number[];
}

export async function reorderDeckSlides(
  deckTsxPath: string,
  input: ReorderInput,
): Promise<DeckSource> {
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const sf = project.addSourceFileAtPath(deckTsxPath);
  const deck = findDeckElement(sf);
  if (!deck) throw new Error("deck.tsx does not contain a <Deck> root element");
  const children = jsxChildren(deck);
  if (input.order.length !== children.length) {
    throw new Error(`order length ${input.order.length} != slide count ${children.length}`);
  }
  if (new Set(input.order).size !== input.order.length) {
    throw new Error("order contains duplicates");
  }
  for (const idx of input.order) {
    if (!Number.isInteger(idx) || idx < 0 || idx >= children.length) {
      throw new Error(`invalid index in order: ${idx}`);
    }
  }
  // Capture the source text of each slide JSX element, then rewrite the
  // <Deck> body with them in the new order.
  const texts = children.map((c) => c.getText());
  const newBody = input.order.map((i) => texts[i]).join("\n      ");
  // Replace the JSX children inside <Deck>...</Deck> by editing positions.
  const open = deck.getOpeningElement();
  const close = deck.getClosingElement();
  const start = open.getEnd();
  const end = close.getStart();
  sf.replaceText([start, end], `\n      ${newBody}\n    `);
  await sf.save();
  return readDeckSource(deckTsxPath);
}

export interface DeleteSlideInput {
  slideIndex: number;
}

export async function deleteDeckSlide(
  deckTsxPath: string,
  input: DeleteSlideInput,
): Promise<DeckSource> {
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const sf = project.addSourceFileAtPath(deckTsxPath);
  const deck = findDeckElement(sf);
  if (!deck) throw new Error("deck.tsx does not contain a <Deck> root element");
  const children = jsxChildren(deck);
  const target = children[input.slideIndex];
  if (!target) throw new Error(`Slide index ${input.slideIndex} out of range`);
  // Remove the node and any trailing whitespace/newline up to the next non-whitespace.
  const text = sf.getFullText();
  const nodeStart = target.getStart();
  let nodeEnd = target.getEnd();
  while (nodeEnd < text.length && (text[nodeEnd] === "\n" || text[nodeEnd] === "\r" || text[nodeEnd] === " ")) {
    nodeEnd += 1;
  }
  sf.replaceText([nodeStart, nodeEnd], "");
  await sf.save();
  return readDeckSource(deckTsxPath);
}

export interface InsertSlideInput {
  /** Index to insert at (0 = before first existing slide). */
  position: number;
  /** JSX text to insert (e.g. `<Broadside.Cover title="..." />`). */
  jsx: string;
}

export async function insertDeckSlide(
  deckTsxPath: string,
  input: InsertSlideInput,
): Promise<DeckSource> {
  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const sf = project.addSourceFileAtPath(deckTsxPath);
  const deck = findDeckElement(sf);
  if (!deck) throw new Error("deck.tsx does not contain a <Deck> root element");
  const children = jsxChildren(deck);
  const pos = Math.max(0, Math.min(input.position, children.length));
  if (children.length === 0) {
    const open = deck.getOpeningElement();
    sf.replaceText([open.getEnd(), open.getEnd()], `\n      ${input.jsx}\n    `);
  } else if (pos === children.length) {
    const last = children[children.length - 1]!;
    sf.replaceText([last.getEnd(), last.getEnd()], `\n      ${input.jsx}`);
  } else {
    const next = children[pos]!;
    sf.replaceText([next.getStart(), next.getStart()], `${input.jsx}\n      `);
  }
  await sf.save();
  return readDeckSource(deckTsxPath);
}


void Node;

export interface VariantMeta {
  variant: string;
  purpose: string;
  density: "low" | "medium" | "high";
  requiredProps: string[];
  optionalProps: string[];
  jsxTemplate: string;
}

export interface ThemeCatalog {
  namespace: string;
  themeId: string;
  variants: string[];
  variantMeta: VariantMeta[];
}

const BROADSIDE_VARIANTS = [
  "Cover", "Chapter", "Statement", "Split",
  "ImageFull", "ImageLeft", "ImageRight", "DiagramFull", "DiagramLeft", "DiagramRight",
  "Stats", "FadeList", "List", "Quote", "Compare", "Chart", "Diagram", "Pie", "Pyramid",
  "VerticalTimeline", "Cycle", "End",
];

const BROADSIDE_META: VariantMeta[] = [
  {
    variant: "Cover",
    purpose: "Fire-orange editorial cover with massive Barlow display type",
    density: "low",
    requiredProps: [],
    optionalProps: ["title", "subtitle", "number", "label", "author", "context"],
    jsxTemplate: `<Broadside.Cover\n  title="Broadside"\n  subtitle="A forceful editorial opening for manifestos, launches, or point-of-view decks."\n/>`,
  },
  {
    variant: "Chapter",
    purpose: "Orange chapter divider with oversized number and section title",
    density: "low",
    requiredProps: [],
    optionalProps: ["number", "title", "body"],
    jsxTemplate: `<Broadside.Chapter\n  number="02"\n  title="this is a chapter"\n  body="A loud punctuation slide for section breaks and editorial resets."\n/>`,
  },
  {
    variant: "Statement",
    purpose: "Dark manifesto statement with small editorial kicker and orange headline",
    density: "low",
    requiredProps: [],
    optionalProps: ["label", "page", "footer", "kicker", "title"],
    jsxTemplate: `<Broadside.Statement\n  kicker="Core Thesis"\n  title="The old rules were not built for the new terrain."\n/>`,
  },
  {
    variant: "Split",
    purpose: "Dark split slide pairing a strong argument with a supporting image",
    density: "medium",
    requiredProps: [],
    optionalProps: ["label", "page", "footer", "kicker", "title", "body", "bullets", "image", "alt", "caption"],
    jsxTemplate: `<Broadside.Split\n  title="The signal is already in the margins."\n  body="Pair a forceful argument with visual proof, context, or a cultural reference."\n  image="https://placehold.co/600x400"\n/>`,
  },
  {
    variant: "ImageFull",
    purpose: "Full-frame image slide with Broadside headline readout",
    density: "low",
    requiredProps: [],
    optionalProps: ["label", "page", "footer", "title", "body", "image", "alt", "caption", "surface"],
    jsxTemplate: `<Broadside.ImageFull\n  title="let the image do the shouting"\n  body="A full-frame visual for evidence, place, product, campaign, or cultural material."\n  image="https://placehold.co/600x400"\n/>`,
  },
  {
    variant: "ImageLeft",
    purpose: "Image on the left with Broadside copy on the right",
    density: "medium",
    requiredProps: [],
    optionalProps: ["label", "page", "footer", "title", "body", "image", "alt", "caption"],
    jsxTemplate: `<Broadside.ImageLeft\n  title="image and argument"\n  body="Use this when the visual and the editorial point need equal weight."\n  image="https://placehold.co/600x400"\n/>`,
  },
  {
    variant: "ImageRight",
    purpose: "Broadside copy on the left with image on the right",
    density: "medium",
    requiredProps: [],
    optionalProps: ["label", "page", "footer", "title", "body", "image", "alt", "caption"],
    jsxTemplate: `<Broadside.ImageRight\n  title="argument and image"\n  body="Use this when the conclusion should introduce the supporting visual."\n  image="https://placehold.co/600x400"\n/>`,
  },
  {
    variant: "DiagramFull",
    purpose: "Full-canvas Broadside diagram for systems, process, or operating model views",
    density: "medium",
    requiredProps: [],
    optionalProps: ["label", "page", "footer", "title", "body", "items", "surface"],
    jsxTemplate: `<Broadside.DiagramFull\n  title="from signal to system"\n  body="A full-canvas diagram for process, architecture, operating models, and argument flow."\n/>`,
  },
  {
    variant: "DiagramLeft",
    purpose: "Diagram on the left with Broadside readout on the right",
    density: "medium",
    requiredProps: [],
    optionalProps: ["label", "page", "footer", "title", "body", "items"],
    jsxTemplate: `<Broadside.DiagramLeft\n  title="diagram plus readout"\n  body="Use this when the structure needs to be read before the implication."\n/>`,
  },
  {
    variant: "DiagramRight",
    purpose: "Broadside readout on the left with diagram on the right",
    density: "medium",
    requiredProps: [],
    optionalProps: ["label", "page", "footer", "title", "body", "items"],
    jsxTemplate: `<Broadside.DiagramRight\n  title="readout plus diagram"\n  body="Use this when the conclusion should introduce the structure."\n/>`,
  },
  {
    variant: "Stats",
    purpose: "Three large statistic cards on orange editorial canvas",
    density: "medium",
    requiredProps: [],
    optionalProps: ["label", "page", "footer", "stats"],
    jsxTemplate: `<Broadside.Stats\n  stats={[\n    { value: "72%", label: "primary behavioral shift", note: "[Source] - [Year]" },\n    { value: "4.8x", label: "faster signal recognition", note: "Primary research" },\n    { value: "#1", label: "category attention driver", note: "Market charts" },\n  ]}\n/>`,
  },
  {
    variant: "FadeList",
    purpose: "Orange editorial sequence slide with three oversized terms",
    density: "low",
    requiredProps: [],
    optionalProps: ["items", "title"],
    jsxTemplate: `<Broadside.FadeList\n  items={["Before", "During", "After"]}\n  title="the sequence matters more than the moment"\n/>`,
  },
  {
    variant: "List",
    purpose: "Dark framework or agenda slide with slash-led list",
    density: "medium",
    requiredProps: [],
    optionalProps: ["label", "page", "footer", "kicker", "title", "items"],
    jsxTemplate: `<Broadside.List\n  kicker="Four rules"\n  title="how to read the moment"\n  items={["Start with the pressure", "Name the conflict", "Make the signal visible", "Build a repeatable language"]}\n/>`,
  },
  {
    variant: "Quote",
    purpose: "Large dark pull quote with orange editorial attribution",
    density: "low",
    requiredProps: [],
    optionalProps: ["quote", "attribution", "source"],
    jsxTemplate: `<Broadside.Quote\n  quote="A brand is not what it says. It is what people repeat when it leaves the room."\n  attribution="[Industry Leader]"\n  source="[Source] - [Year]"\n/>`,
  },
  {
    variant: "Compare",
    purpose: "Dark before-and-after comparison with two editorial panels",
    density: "high",
    requiredProps: [],
    optionalProps: ["label", "page", "footer", "left", "right"],
    jsxTemplate: `<Broadside.Compare\n  left={{ label: "Before", title: "fragmented attention", body: "Lots of motion, little memory.", bullets: ["Unclear position", "Generic category codes"] }}\n  right={{ label: "After", title: "a visible point of view", body: "A system people can recognize and repeat.", bullets: ["Sharper language", "Ownable visual field"] }}\n/>`,
  },
  {
    variant: "Chart",
    purpose: "Dark editorial bar chart with orange highlight",
    density: "high",
    requiredProps: [],
    optionalProps: ["label", "page", "footer", "title", "caption", "bars", "source"],
    jsxTemplate: `<Broadside.Chart\n  title="momentum compounds unevenly"\n  caption="Quarterly revenue"\n/>`,
  },
  {
    variant: "Diagram",
    purpose: "Alias of DiagramFull for quick system maps",
    density: "medium",
    requiredProps: [],
    optionalProps: ["label", "page", "footer", "title", "body", "items", "surface"],
    jsxTemplate: `<Broadside.Diagram\n  title="from signal to system"\n/>`,
  },
  {
    variant: "Pie",
    purpose: "Dark market-share style composition with circular mark and slash list",
    density: "high",
    requiredProps: [],
    optionalProps: ["label", "page", "footer", "title"],
    jsxTemplate: `<Broadside.Pie\n  title="one leader, many followers"\n/>`,
  },
  {
    variant: "Pyramid",
    purpose: "Dark hierarchy slide with stacked editorial layers",
    density: "medium",
    requiredProps: [],
    optionalProps: [],
    jsxTemplate: `<Broadside.Pyramid />`,
  },
  {
    variant: "VerticalTimeline",
    purpose: "Dark vertical timeline for narrative change over time",
    density: "medium",
    requiredProps: [],
    optionalProps: [],
    jsxTemplate: `<Broadside.VerticalTimeline />`,
  },
  {
    variant: "Cycle",
    purpose: "Dark four-step loop or feedback cycle",
    density: "medium",
    requiredProps: [],
    optionalProps: [],
    jsxTemplate: `<Broadside.Cycle />`,
  },
  {
    variant: "End",
    purpose: "Fire-orange closing slide with massive final line",
    density: "low",
    requiredProps: [],
    optionalProps: ["title", "body", "label"],
    jsxTemplate: `<Broadside.End\n  title="now make it impossible to ignore"\n  body="Close with a declaration, a next step, or the line the room should remember."\n/>`,
  },
];

const THEME_CATALOG: ThemeCatalog[] = [
  {
    namespace: "Broadside",
    themeId: "broadside",
    variants: BROADSIDE_VARIANTS,
    variantMeta: BROADSIDE_META,
  },
  {
    namespace: "Studio",
    themeId: "studio",
    variants: [
      "Cover", "ChapterLight", "StatementDark", "Split", "Stats", "List",
      "ImageFull", "ImageLeft", "ImageRight", "DiagramFull", "DiagramLeft", "DiagramRight",
      "Quote", "Compare", "ChapterDark", "StatementLight", "Chart", "End",
    ],
    variantMeta: [
      {
        variant: "Cover",
        purpose: "Full-image cover with massive acid-yellow display type and three-column metadata",
        density: "low",
        requiredProps: [],
        optionalProps: ["title", "image", "alt", "metaLeft", "metaCenter", "metaRight"],
        jsxTemplate: `<Studio.Cover\n  title="Proposal"\n  image="https://placehold.co/600x400"\n  metaLeft={<>[Studio Name] x [Client Name]<br />[Date]</>}\n  metaCenter="[Presentation Title]"\n  metaRight="[Studio Name]"\n/>`,
      },
      {
        variant: "ChapterLight",
        purpose: "Acid-yellow chapter divider with mono chapter number and oversized title",
        density: "low",
        requiredProps: [],
        optionalProps: ["chapter", "title"],
        jsxTemplate: `<Studio.ChapterLight\n  chapter="01 /"\n  title="Who we are"\n/>`,
      },
      {
        variant: "StatementDark",
        purpose: "Near-black full-slide manifesto statement in acid-yellow type",
        density: "low",
        requiredProps: [],
        optionalProps: ["title"],
        jsxTemplate: `<Studio.StatementDark\n  title="Great work doesn't happen by accident"\n/>`,
      },
      {
        variant: "Split",
        purpose: "Acid-yellow split slide with copy, dash bullets, and image panel",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "page", "footer", "kicker", "title", "body", "bullets", "image", "alt", "caption"],
        jsxTemplate: `<Studio.Split\n  label="Approach"\n  title="We build what others plan"\n  body="Our studio pairs strategic thinking with craft-level execution."\n  bullets={["Strategy before aesthetics", "Constraints as creative fuel", "Delivery on schedule"]}\n  image="https://placehold.co/600x400"\n/>`,
      },
      {
        variant: "ImageFull",
        purpose: "Full-frame image slide with oversized Studio readout",
        density: "low",
        requiredProps: [],
        optionalProps: ["label", "page", "footer", "title", "body", "image", "alt", "caption", "surface"],
        jsxTemplate: `<Studio.ImageFull\n  title="Let the image carry the argument"\n  body="A full-frame visual with one severe readout."\n  image="https://placehold.co/600x400"\n/>`,
      },
      {
        variant: "ImageLeft",
        purpose: "Image on the left with Studio copy on the right",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "page", "footer", "title", "body", "image", "alt", "caption"],
        jsxTemplate: `<Studio.ImageLeft\n  title="Image left, argument right"\n  body="A stark split for product views, artifacts, locations, or campaign references."\n  image="https://placehold.co/600x400"\n/>`,
      },
      {
        variant: "ImageRight",
        purpose: "Studio copy on the left with image on the right",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "page", "footer", "title", "body", "image", "alt", "caption"],
        jsxTemplate: `<Studio.ImageRight\n  title="Argument left, image right"\n  body="Use this when the visual should resolve the thought after the headline lands."\n  image="https://placehold.co/600x400"\n/>`,
      },
      {
        variant: "DiagramFull",
        purpose: "Full-frame Studio diagram for systems, process, architecture, or operating models",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "page", "footer", "title", "body", "items", "surface"],
        jsxTemplate: `<Studio.DiagramFull\n  title="System map"\n  body="A full-frame structure for process, architecture, operating models, or strategic flow."\n  items={[\n    { label: "01", title: "Input", body: "Signal, source, constraint, or brief." },\n    { label: "02", title: "System", body: "Rules, craft, and decisions." },\n    { label: "03", title: "Output", body: "Visible work, handoff, or business result." },\n  ]}\n/>`,
      },
      {
        variant: "DiagramLeft",
        purpose: "Diagram on the left with Studio interpretation on the right",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "page", "footer", "title", "body", "items"],
        jsxTemplate: `<Studio.DiagramLeft\n  title="Diagram left, readout right"\n  body="Use this when the structure needs to be read before the implication."\n/>`,
      },
      {
        variant: "DiagramRight",
        purpose: "Studio interpretation on the left with diagram on the right",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "page", "footer", "title", "body", "items"],
        jsxTemplate: `<Studio.DiagramRight\n  title="Readout left, diagram right"\n  body="Use this when the conclusion introduces the structure."\n/>`,
      },
      {
        variant: "Stats",
        purpose: "Three acid-yellow statistic cards with heavy numerals and mono notes",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "page", "footer", "title", "stats"],
        jsxTemplate: `<Studio.Stats\n  label="By the Numbers"\n  title="The studio"\n  stats={[\n    { value: "12", label: "Years of practice", note: "Founded [Year]" },\n    { value: "200+", label: "Projects delivered", note: "Across [N] industries" },\n    { value: "3", label: "Continents active", note: "Global practice" },\n  ]}\n/>`,
      },
      {
        variant: "List",
        purpose: "Near-black services or agenda slide with large headline and dash list",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "page", "footer", "title", "body", "items"],
        jsxTemplate: `<Studio.List\n  label="Services"\n  title="What we offer"\n  body="A focused set of services built for ambitious creative and commercial challenges."\n  items={["Brand strategy", "Campaign direction", "Digital experience", "Motion production"]}\n/>`,
      },
      {
        variant: "Quote",
        purpose: "Large near-black pull quote with mono attribution",
        density: "low",
        requiredProps: [],
        optionalProps: ["quote", "attribution", "role"],
        jsxTemplate: `<Studio.Quote\n  quote="They don't just make things look good. They make things work."\n  attribution="[Client Name]"\n  role="CMO · [Company] · [Year]"\n/>`,
      },
      {
        variant: "Compare",
        purpose: "Before/after comparison with two acid-yellow panels and dash bullets",
        density: "high",
        requiredProps: [],
        optionalProps: ["label", "page", "footer", "left", "right"],
        jsxTemplate: `<Studio.Compare\n  label="Before / After"\n  left={{ label: "Before", title: "Generic identity", body: "Nothing wrong. Nothing memorable.", bullets: ["No clear point of view", "Inconsistent execution"] }}\n  right={{ label: "After", title: "A distinctive voice", body: "Work that accumulates and builds memory.", bullets: ["Ownable territory", "System that scales"] }}\n/>`,
      },
      {
        variant: "ChapterDark",
        purpose: "Near-black chapter divider with mono chapter number and oversized title",
        density: "low",
        requiredProps: [],
        optionalProps: ["chapter", "title"],
        jsxTemplate: `<Studio.ChapterDark\n  chapter="02 /"\n  title="The work"\n/>`,
      },
      {
        variant: "StatementLight",
        purpose: "Acid-yellow full-slide manifesto statement in near-black type",
        density: "low",
        requiredProps: [],
        optionalProps: ["title"],
        jsxTemplate: `<Studio.StatementLight\n  title="Bold ideas deserve bold execution"\n/>`,
      },
      {
        variant: "Chart",
        purpose: "Near-black vertical bar chart with heavy yellow bars and mono source",
        density: "high",
        requiredProps: [],
        optionalProps: ["label", "page", "footer", "title", "caption", "bars", "source"],
        jsxTemplate: `<Studio.Chart\n  label="Project Output"\n  title="Projects by year"\n  bars={[\n    { label: "[Y-4]", value: 14 },\n    { label: "[Y-3]", value: 21 },\n    { label: "[Y-2]", value: 28 },\n    { label: "[Y-1]", value: 35 },\n    { label: "[Year]", value: 47 },\n  ]}\n/>`,
      },
      {
        variant: "End",
        purpose: "Acid-yellow closing slide with large question, contacts, and three-column metadata",
        density: "medium",
        requiredProps: [],
        optionalProps: ["title", "contacts", "metaLeft", "metaCenter", "metaRight"],
        jsxTemplate: `<Studio.End\n  title="Any questions or thoughts?"\n  contacts={[\n    { name: "[Name A]", email: "name@studio.com", phone: "+00 000 000 000" },\n    { name: "[Name B]", email: "name@studio.com", phone: "+00 000 000 000" },\n  ]}\n/>`,
      },
    ],
  },
  {
    namespace: "BlockFrame",
    themeId: "block-frame",
    variants: [
      "Cover", "Overview", "Features", "ChartData", "Quote",
      "Split", "ImageFull", "ImageLeft", "ImageRight", "DiagramFull", "DiagramLeft", "DiagramRight",
      "Timeline", "Stats", "Team", "End",
    ],
    variantMeta: [
      {
        variant: "Cover",
        purpose: "Neobrutalist title hero with bordered frame and decorative blocks",
        density: "low",
        requiredProps: [],
        optionalProps: ["label", "title", "subtitle", "cta"],
        jsxTemplate: `<BlockFrame.Cover\n  label="Presentation Template"\n  title={<>Neo-<br />Brutalism<br />Style</>}\n  subtitle="A bold, high-contrast template designed for maximum visual impact."\n  cta="Get Started"\n/>`,
      },
      {
        variant: "Overview",
        purpose: "Two-column overview with headline, pills, and stacked cards",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "title", "body", "pills", "cards"],
        jsxTemplate: `<BlockFrame.Overview\n  label="Overview"\n  title={<>What We<br />Deliver</>}\n  body="Short framing paragraph for the offer or idea."\n  pills={["12+ Years", "500+ Projects"]}\n  cards={[\n    { title: "Strategy First", body: "Short support copy." },\n    { title: "Design System", body: "Short support copy." },\n    { title: "Launch Ready", body: "Short support copy." },\n  ]}\n/>`,
      },
      {
        variant: "Features",
        purpose: "Three chunky feature cards with icon squares and card notches",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "cards"],
        jsxTemplate: `<BlockFrame.Features\n  label="Core Features"\n  cards={[\n    { icon: "A", title: "Modular Layouts", body: "Feature description.", tone: "pink" },\n    { icon: "B", title: "Responsive Ready", body: "Feature description.", tone: "blue" },\n    { icon: "C", title: "Data Friendly", body: "Feature description.", tone: "green" },\n  ]}\n/>`,
      },
      {
        variant: "ChartData",
        purpose: "Grouped bar chart with legend and three metric callouts",
        density: "high",
        requiredProps: [],
        optionalProps: ["label", "title", "xLabels", "series", "metrics"],
        jsxTemplate: `<BlockFrame.ChartData\n  label="Performance Data"\n  title="Quarterly Growth Metrics"\n  xLabels={["Q1", "Q2", "Q3", "Q4"]}\n  series={[\n    { label: "Revenue", tone: "pink", values: [35, 52, 68, 82] },\n    { label: "Users", tone: "blue", values: [26, 40, 56, 72] },\n    { label: "Retention", tone: "green", values: [44, 52, 64, 72] },\n  ]}\n  metrics={[\n    { value: "+142%", label: "Revenue Growth" },\n    { value: "2.4M", label: "Active Users" },\n    { value: "94%", label: "Retention Rate" },\n  ]}\n/>`,
      },
      {
        variant: "Quote",
        purpose: "Large uppercase statement or pull quote in a bordered frame",
        density: "low",
        requiredProps: [],
        optionalProps: ["quote", "attribution"],
        jsxTemplate: `<BlockFrame.Quote\n  quote="Design is how it works, how it feels, and how it lasts."\n  attribution="Core Principle, Version 4.0"\n/>`,
      },
      {
        variant: "Split",
        purpose: "Split visual placeholder and numbered method list",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "title", "visualLabel", "visualText", "buttonText", "items"],
        jsxTemplate: `<BlockFrame.Split\n  label="Methodology"\n  title={<>How We Structure<br />Every Project</>}\n  visualLabel="Visual System"\n  visualText="Image Placeholder"\n  buttonText="View Process"\n  items={[\n    "Discovery maps stakeholder needs.",\n    "Wireframes validate information architecture.",\n    "Prototypes test hierarchy with real content.",\n    "Handoff ships annotated specifications.",\n  ]}\n/>`,
      },
      {
        variant: "ImageFull",
        purpose: "Dominant image slide with compact caption and framed message",
        density: "low",
        requiredProps: [],
        optionalProps: ["label", "title", "body", "image", "alt", "caption", "tone"],
        jsxTemplate: `<BlockFrame.ImageFull\n  label="Field Note"\n  title="One visual can carry the argument."\n  body="Use this slide when the image is the evidence and copy only frames the point."\n  image="https://placehold.co/600x400"\n  alt="Brief image description"\n  tone="green"\n/>`,
      },
      {
        variant: "ImageLeft",
        purpose: "Image on the left with explanatory copy on the right",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "title", "body", "image", "alt", "caption", "tone"],
        jsxTemplate: `<BlockFrame.ImageLeft\n  label="Context"\n  title="Image left, narrative right."\n  body="Use this for screenshots, product views, locations, artifacts, or case examples."\n  image="https://placehold.co/600x400"\n  alt="Brief image description"\n  tone="pink"\n/>`,
      },
      {
        variant: "ImageRight",
        purpose: "Explanatory copy on the left with image on the right",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "title", "body", "image", "alt", "caption", "tone"],
        jsxTemplate: `<BlockFrame.ImageRight\n  label="Context"\n  title="Narrative left, image right."\n  body="Use this when the conclusion should introduce the supporting visual."\n  image="https://placehold.co/600x400"\n  alt="Brief image description"\n  tone="blue"\n/>`,
      },
      {
        variant: "DiagramFull",
        purpose: "Full-canvas diagram for systems, process, architecture, or operating model views",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "title", "body", "items"],
        jsxTemplate: `<BlockFrame.DiagramFull\n  label="System Map"\n  title="Diagram full frame"\n  body="Use this for architecture, process, operating models, or high-level flow."\n  items={[\n    { label: "01", title: "Input", body: "Signal, source, or trigger.", tone: "blue" },\n    { label: "02", title: "Transform", body: "Rules and work.", tone: "pink" },\n    { label: "03", title: "Output", body: "Decision or handoff.", tone: "green" },\n  ]}\n/>`,
      },
      {
        variant: "DiagramLeft",
        purpose: "Diagram on the left with interpretation on the right",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "title", "body", "items"],
        jsxTemplate: `<BlockFrame.DiagramLeft\n  label="Flow"\n  title="Diagram left, explanation right."\n  body="Use this when the structure needs to be read before the implication."\n  items={[\n    { label: "01", title: "Input", body: "Signal, source, or trigger.", tone: "blue" },\n    { label: "02", title: "Transform", body: "Rules and work.", tone: "pink" },\n    { label: "03", title: "Output", body: "Decision or handoff.", tone: "green" },\n  ]}\n/>`,
      },
      {
        variant: "DiagramRight",
        purpose: "Interpretation on the left with diagram on the right",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "title", "body", "items"],
        jsxTemplate: `<BlockFrame.DiagramRight\n  label="Flow"\n  title="Explanation left, diagram right."\n  body="Use this when the conclusion should introduce the diagram."\n  items={[\n    { label: "01", title: "Input", body: "Signal, source, or trigger.", tone: "blue" },\n    { label: "02", title: "Transform", body: "Rules and work.", tone: "pink" },\n    { label: "03", title: "Output", body: "Decision or handoff.", tone: "green" },\n  ]}\n/>`,
      },
      {
        variant: "Timeline",
        purpose: "Four-step roadmap with connected bordered panels",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "title", "steps"],
        jsxTemplate: `<BlockFrame.Timeline\n  label="Roadmap"\n  title="Project Timeline"\n  steps={[\n    { numeral: "01", title: "Research", body: "Foundation work.", tone: "blue" },\n    { numeral: "02", title: "Concept", body: "Directional exploration.", tone: "pink" },\n    { numeral: "03", title: "Build", body: "Detailed execution.", tone: "green" },\n    { numeral: "04", title: "Launch", body: "Release and optimize.", tone: "yellow" },\n  ]}\n/>`,
      },
      {
        variant: "Stats",
        purpose: "Four tilted statistic cards",
        density: "medium",
        requiredProps: [],
        optionalProps: ["label", "title", "stats"],
        jsxTemplate: `<BlockFrame.Stats\n  label="By The Numbers"\n  title="Impact at a Glance"\n  stats={[\n    { value: "98%", label: "Client Satisfaction", tone: "pink" },\n    { value: "14", label: "Industry Awards", tone: "blue" },\n    { value: "3.2x", label: "Avg. ROI Increase", tone: "green" },\n    { value: "50+", label: "Team Members", tone: "yellow" },\n  ]}\n/>`,
      },
      {
        variant: "Team",
        purpose: "Six-person team grid with square avatar blocks",
        density: "high",
        requiredProps: [],
        optionalProps: ["label", "title", "members"],
        jsxTemplate: `<BlockFrame.Team\n  label="The Team"\n  title="Meet the Crew"\n  members={[\n    { initials: "JD", name: "J. Doe", role: "Creative Lead", bio: "Short bio.", tone: "pink" },\n    { initials: "AS", name: "A. Smith", role: "Tech Director", bio: "Short bio.", tone: "blue" },\n  ]}\n/>`,
      },
      {
        variant: "End",
        purpose: "High-impact closing slide with dark frame and CTA",
        density: "low",
        requiredProps: [],
        optionalProps: ["title", "subtitle", "cta"],
        jsxTemplate: `<BlockFrame.End\n  title={<>Let's Build<br />Something Bold</>}\n  subtitle="Ready to start your next project?"\n  cta="Get In Touch"\n/>`,
      },
    ],
  },
  {
    namespace: "SoftEditorial",
    themeId: "soft-editorial",
    variants: [
      "Cover", "Foreword", "Method", "Insights", "Closer", "Chapter", "Statement",
      "Numbers", "Stats", "Quote", "Next", "Split", "List", "Chart", "Process",
      "Matrix", "ImageFull", "ImageLeft", "ImageRight", "DiagramFull", "DiagramLeft", "DiagramRight",
      "Consult", "End",
    ],
    variantMeta: [
      {
        variant: "Cover",
        purpose: "Opening title slide",
        density: "low",
        requiredProps: ["title"],
        optionalProps: ["kicker", "lede", "date", "volume", "eyebrow"],
        jsxTemplate: `<SoftEditorial.Cover\n  kicker="Kicker / edition label"\n  title="Main headline — required"\n  lede="Supporting sentence — optional"\n/>`,
      },
      {
        variant: "Foreword",
        purpose: "Editorial letter or preamble from the author",
        density: "medium",
        requiredProps: ["opener", "body"],
        optionalProps: ["signoff", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.Foreword\n  opener="Opening statement that frames the piece."\n  body={["First paragraph of body copy.", "Second paragraph."]}\n  signoff="Author Name"\n/>`,
      },
      {
        variant: "Method",
        purpose: "Step-by-step process or methodology (3–4 steps)",
        density: "medium",
        requiredProps: ["steps"],
        optionalProps: ["date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.Method\n  steps={[\n    { numeral: "01", title: "Step title", body: "Step description." },\n    { numeral: "02", title: "Step title", body: "Step description." },\n    { numeral: "03", title: "Step title", body: "Step description." },\n    { numeral: "04", title: "Step title", body: "Step description." },\n  ]}\n/>`,
      },
      {
        variant: "Insights",
        purpose: "3-card research or insight panel",
        density: "high",
        requiredProps: ["cards"],
        optionalProps: ["date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.Insights\n  cards={[\n    { label: "Insight label", sub: "Sub-label or context", body: "The insight body copy goes here." },\n    { label: "Insight label", sub: "Sub-label or context", body: "The insight body copy goes here." },\n    { label: "Insight label", sub: "Sub-label or context", body: "The insight body copy goes here." },\n  ]}\n/>`,
      },
      {
        variant: "Closer",
        purpose: "Full-bleed chapter transition or section divider",
        density: "low",
        requiredProps: ["title"],
        optionalProps: ["marker", "body", "background", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.Closer\n  marker="Chapter I"\n  title="Section title goes here."\n  body="Optional supporting sentence."\n  background="pink"\n/>`,
      },
      {
        variant: "Chapter",
        purpose: "Chapter intro with accent background (alias of Closer)",
        density: "low",
        requiredProps: ["title"],
        optionalProps: ["marker", "body", "background", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.Chapter\n  marker="Chapter II"\n  title="Chapter title goes here."\n  body="Optional supporting sentence."\n  background="lemon"\n/>`,
      },
      {
        variant: "Statement",
        purpose: "Manifesto or key claim with accent background",
        density: "low",
        requiredProps: ["title"],
        optionalProps: ["marker", "body", "background", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.Statement\n  marker="Manifesto"\n  title="The key claim goes here."\n  body="Optional elaboration."\n  background="blush"\n/>`,
      },
      {
        variant: "Numbers",
        purpose: "Hero metric with 2 supporting statistics",
        density: "low",
        requiredProps: ["hero", "stats"],
        optionalProps: ["date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.Numbers\n  hero={{ value: "72%", label: "Primary metric label" }}\n  stats={[\n    { value: "3.1×", label: "Second metric label" },\n    { value: "12",   label: "Third metric label" },\n  ]}\n/>`,
      },
      {
        variant: "Stats",
        purpose: "Hero metric with 2 supporting statistics (alias of Numbers)",
        density: "low",
        requiredProps: ["hero", "stats"],
        optionalProps: ["date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.Stats\n  hero={{ value: "91%", label: "Primary metric label" }}\n  stats={[\n    { value: "14",  label: "Second metric label" },\n    { value: "0",   label: "Third metric label" },\n  ]}\n/>`,
      },
      {
        variant: "Quote",
        purpose: "Large pull quote with attribution",
        density: "low",
        requiredProps: ["quote", "attribution"],
        optionalProps: ["role", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.Quote\n  quote="The quotable line goes here."\n  attribution="Author Name"\n  role="Title or Role"\n/>`,
      },
      {
        variant: "Next",
        purpose: "Title with 3 next-action items",
        density: "medium",
        requiredProps: ["title", "items"],
        optionalProps: ["body", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.Next\n  title="What we'll do next."\n  body="Optional framing sentence."\n  items={[\n    { numeral: "01", title: "Action title", body: "Action description." },\n    { numeral: "02", title: "Action title", body: "Action description." },\n    { numeral: "03", title: "Action title", body: "Action description." },\n  ]}\n/>`,
      },
      {
        variant: "Split",
        purpose: "Side-by-side narrative with 3 numbered items (alias of Next)",
        density: "medium",
        requiredProps: ["title", "items"],
        optionalProps: ["body", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.Split\n  title="How we'll measure it."\n  body="Optional framing sentence."\n  items={[\n    { numeral: "01", title: "Item title", body: "Item description." },\n    { numeral: "02", title: "Item title", body: "Item description." },\n    { numeral: "03", title: "Item title", body: "Item description." },\n  ]}\n/>`,
      },
      {
        variant: "List",
        purpose: "Numbered list of items (alias of Next)",
        density: "medium",
        requiredProps: ["title", "items"],
        optionalProps: ["body", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.List\n  title="House rules."\n  body="Optional framing sentence."\n  items={[\n    { numeral: "01", title: "Item title", body: "Item description." },\n    { numeral: "02", title: "Item title", body: "Item description." },\n    { numeral: "03", title: "Item title", body: "Item description." },\n  ]}\n/>`,
      },
      {
        variant: "Chart",
        purpose: "SVG line chart comparing 2 data series with narrative title",
        density: "high",
        requiredProps: ["title", "series"],
        optionalProps: ["body", "xTicks", "yTicks", "yLabel", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.Chart\n  title="Chart headline."\n  body="Optional narrative sentence below the title."\n  series={[\n    { label: "Series A", color: "var(--ink)",  points: "0,8 33,20 66,35 100,45", width: 1.1 },\n    { label: "Series B", color: "var(--pink)", points: "0,8 33,40 66,65 100,85" },\n  ]}\n/>`,
      },
      {
        variant: "Process",
        purpose: "4-node workflow diagram with optional timeline labels",
        density: "medium",
        requiredProps: ["title", "nodes"],
        optionalProps: ["sub", "timeline", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.Process\n  title="How we'll work."\n  sub="Optional subtitle sentence."\n  nodes={[\n    { numeral: "01", title: "Phase title", body: "Phase description." },\n    { numeral: "02", title: "Phase title", body: "Phase description." },\n    { numeral: "03", title: "Phase title", body: "Phase description." },\n    { numeral: "04", title: "Phase title", body: "Phase description." },\n  ]}\n  timeline={["Wk 1", "Wk 2", "Wk 3", "Wk 4"]}\n/>`,
      },
      {
        variant: "Matrix",
        purpose: "Comparison grid with pill indicators across columns and rows",
        density: "high",
        requiredProps: ["title", "columns", "rows"],
        optionalProps: ["sub", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.Matrix\n  title="Where attention lives."\n  sub="Optional subtitle sentence."\n  columns={["Col A", "Col B", "Col C"]}\n  rows={[\n    { label: "Row label", cells: [\n      { label: "Strong",  pill: "yes" },\n      { label: "Partial", pill: "part" },\n      { label: "Weak",    pill: "no" },\n    ]},\n    { label: "Row label", cells: [\n      { label: "Partial", pill: "part" },\n      { label: "Strong",  pill: "yes" },\n      { label: "n/a",     pill: "note" },\n    ]},\n  ]}\n/>`,
      },
      {
        variant: "ImageFull",
        purpose: "Full-image editorial slide with overlaid copy panel",
        density: "low",
        requiredProps: [],
        optionalProps: ["title", "body", "image", "alt", "caption", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.ImageFull\n  title="One visual can carry the argument."\n  body="Use this slide when the image is the evidence and copy only frames the point."\n  image="https://placehold.co/600x400"\n  alt="Brief image description"\n/>`,
      },
      {
        variant: "ImageLeft",
        purpose: "Image on the left with editorial copy on the right",
        density: "medium",
        requiredProps: [],
        optionalProps: ["title", "body", "image", "alt", "caption", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.ImageLeft\n  title="Image left, narrative right."\n  body="Use this for screenshots, product views, locations, artifacts, or case examples."\n  image="https://placehold.co/600x400"\n  alt="Brief image description"\n/>`,
      },
      {
        variant: "ImageRight",
        purpose: "Editorial copy on the left with image on the right",
        density: "medium",
        requiredProps: [],
        optionalProps: ["title", "body", "image", "alt", "caption", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.ImageRight\n  title="Narrative left, image right."\n  body="Use this when the conclusion should introduce the supporting visual."\n  image="https://placehold.co/600x400"\n  alt="Brief image description"\n/>`,
      },
      {
        variant: "DiagramFull",
        purpose: "Full-canvas editorial diagram for systems, processes, or operating models",
        density: "medium",
        requiredProps: [],
        optionalProps: ["title", "body", "items", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.DiagramFull\n  title="Diagram full frame"\n  body="Use this for architecture, process, operating models, or high-level flow."\n  items={[\n    { label: "01", title: "Input", body: "Signal, source, or trigger." },\n    { label: "02", title: "Transform", body: "Rules and work." },\n    { label: "03", title: "Output", body: "Decision or handoff." },\n  ]}\n/>`,
      },
      {
        variant: "DiagramLeft",
        purpose: "Diagram on the left with interpretation on the right",
        density: "medium",
        requiredProps: [],
        optionalProps: ["title", "body", "items", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.DiagramLeft\n  title="Diagram left, explanation right."\n  body="Use this when the structure needs to be read before the implication."\n  items={[\n    { label: "01", title: "Input", body: "Signal, source, or trigger." },\n    { label: "02", title: "Transform", body: "Rules and work." },\n    { label: "03", title: "Output", body: "Decision or handoff." },\n  ]}\n/>`,
      },
      {
        variant: "DiagramRight",
        purpose: "Interpretation on the left with diagram on the right",
        density: "medium",
        requiredProps: [],
        optionalProps: ["title", "body", "items", "date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.DiagramRight\n  title="Explanation left, diagram right."\n  body="Use this when the conclusion should introduce the diagram."\n  items={[\n    { label: "01", title: "Input", body: "Signal, source, or trigger." },\n    { label: "02", title: "Transform", body: "Rules and work." },\n    { label: "03", title: "Output", body: "Decision or handoff." },\n  ]}\n/>`,
      },
      {
        variant: "Consult",
        purpose: "Recommendation slide with 2–3 evidence columns and bullets",
        density: "high",
        requiredProps: ["actionTag", "actionTitle", "columns"],
        optionalProps: ["date", "volume", "eyebrow", "page"],
        jsxTemplate: `<SoftEditorial.Consult\n  actionTag="Recommendation"\n  actionTitle="Key finding that drives the action."\n  columns={[\n    {\n      heading: "What we saw",\n      bodyTop: "Background paragraph.",\n      bullets: [{ label: "Point A", body: "Detail." }],\n    },\n    {\n      heading: "What we propose",\n      bodyTop: "Proposal paragraph.",\n      bullets: [{ label: "Point B", body: "Detail." }],\n      meta: "Estimated lift",\n      source: "+18% based on A/B",\n    },\n  ]}\n/>`,
      },
      {
        variant: "End",
        purpose: "Closing or sign-off slide",
        density: "low",
        requiredProps: ["title"],
        optionalProps: ["kicker", "signoff", "date", "volume", "eyebrow"],
        jsxTemplate: `<SoftEditorial.End\n  kicker="Thank you."\n  title="Until the next issue."\n  signoff="— Closing note"\n/>`,
      },
    ],
  },
];

export function listThemeCatalog(): ThemeCatalog[] {
  return THEME_CATALOG;
}

export interface ChangeThemeInput {
  themeId: string;
}

export interface ChangeThemeResult {
  source: DeckSource;
  unmappedSlides: Array<{ slideIndex: number; component: string }>;
}

function findCatalogByThemeId(themeId: string): ThemeCatalog | undefined {
  return THEME_CATALOG.find((c) => c.themeId === themeId);
}

function findCatalogByNamespace(ns: string): ThemeCatalog | undefined {
  return THEME_CATALOG.find((c) => c.namespace === ns);
}

export async function changeDeckTheme(
  deckTsxPath: string,
  input: ChangeThemeInput,
): Promise<ChangeThemeResult> {
  const target = findCatalogByThemeId(input.themeId);
  if (!target) throw new Error(`Unknown themeId: ${input.themeId}`);

  const project = new Project({ skipAddingFilesFromTsConfig: true });
  const sf = project.addSourceFileAtPath(deckTsxPath);
  const deck = findDeckElement(sf);
  if (!deck) throw new Error("deck.tsx does not contain a <Deck> root element");

  const unmapped: Array<{ slideIndex: number; component: string }> = [];

  const children = jsxChildren(deck);
  children.forEach((child, slideIndex) => {
    const open = child.isKind(SyntaxKind.JsxElement) ? child.getOpeningElement() : child;
    const tagNode = open.getTagNameNode();
    if (!tagNode.isKind(SyntaxKind.PropertyAccessExpression)) return;
    const ns = tagNode.getExpression().getText();
    const variant = tagNode.getName();
    const sourceCatalog = findCatalogByNamespace(ns);
    if (!sourceCatalog) return;
    if (!target.variants.includes(variant)) {
      unmapped.push({ slideIndex, component: `${ns}.${variant}` });
      return;
    }
    tagNode.getExpression().replaceWithText(target.namespace);
    if (child.isKind(SyntaxKind.JsxElement)) {
      const closeTag = child.getClosingElement().getTagNameNode();
      if (closeTag.isKind(SyntaxKind.PropertyAccessExpression)) {
        closeTag.getExpression().replaceWithText(target.namespace);
      }
    }
  });

  const deckOpen = deck.getOpeningElement();
  const themeAttr = deckOpen
    .getAttributes()
    .filter((a): a is JsxAttribute => a.isKind(SyntaxKind.JsxAttribute))
    .find((a) => a.getNameNode().getText() === "theme");
  if (themeAttr) {
    themeAttr.setInitializer(JSON.stringify(target.themeId));
  }

  for (const decl of sf.getImportDeclarations()) {
    const spec = decl.getModuleSpecifierValue();
    if (spec === "@micro-keynote/templates") {
      for (const named of decl.getNamedImports()) {
        const name = named.getName();
        const sourceCatalog = findCatalogByNamespace(name);
        if (sourceCatalog) named.setName(target.namespace);
      }
    } else if (spec.startsWith("@micro-keynote/templates/") && spec.endsWith("/styles.css")) {
      decl.setModuleSpecifier(`@micro-keynote/templates/${target.themeId}/styles.css`);
    }
  }

  await sf.save();
  const after = await readDeckSource(deckTsxPath);
  return { source: after, unmappedSlides: unmapped };
}
