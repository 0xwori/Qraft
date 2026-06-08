import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

export interface TemplateBundle {
  js: string;
  css: string;
}

interface TemplateRegistryEntry {
  namespace: string;
  importPath: string;
  fixturesImportPath: string;
  stylesImportPath: string;
  width: number;
  height: number;
  variants: string[];
}

const TEMPLATE_REGISTRY: Record<string, TemplateRegistryEntry> = {
  "broadside": {
    namespace: "Broadside",
    importPath: "@micro-keynote/templates/broadside",
    fixturesImportPath: "@micro-keynote/templates/broadside/fixtures",
    stylesImportPath: "@micro-keynote/templates/broadside/styles.css",
    width: 1920,
    height: 1080,
    variants: [
      "Cover", "Chapter", "Statement", "Split",
      "ImageFull", "ImageLeft", "ImageRight", "DiagramFull", "DiagramLeft", "DiagramRight",
      "Stats", "FadeList", "List", "Quote", "Compare", "Chart", "Diagram", "Pie", "Pyramid",
      "VerticalTimeline", "Cycle", "End",
    ],
  },
  "studio": {
    namespace: "Studio",
    importPath: "@micro-keynote/templates/studio",
    fixturesImportPath: "@micro-keynote/templates/studio/fixtures",
    stylesImportPath: "@micro-keynote/templates/studio/styles.css",
    width: 1920,
    height: 1080,
    variants: [
      "Cover", "ChapterLight", "StatementDark", "Split", "Stats", "List",
      "ImageFull", "ImageLeft", "ImageRight", "DiagramFull", "DiagramLeft", "DiagramRight",
      "Quote", "Compare", "ChapterDark", "StatementLight", "Chart", "End",
    ],
  },
  "block-frame": {
    namespace: "BlockFrame",
    importPath: "@micro-keynote/templates/block-frame",
    fixturesImportPath: "@micro-keynote/templates/block-frame/fixtures",
    stylesImportPath: "@micro-keynote/templates/block-frame/styles.css",
    width: 1920,
    height: 1080,
    variants: [
      "Cover", "Overview", "Features", "ChartData", "Quote",
      "Split", "ImageFull", "ImageLeft", "ImageRight", "DiagramFull", "DiagramLeft", "DiagramRight",
      "Timeline", "Stats", "Team", "End",
    ],
  },
  "soft-editorial": {
    namespace: "SoftEditorial",
    importPath: "@micro-keynote/templates/soft-editorial",
    fixturesImportPath: "@micro-keynote/templates/soft-editorial/fixtures",
    stylesImportPath: "@micro-keynote/templates/soft-editorial/styles.css",
    width: 1920,
    height: 1080,
    variants: [
      "Cover", "Foreword", "Method", "Insights", "Closer", "Chapter", "Statement",
      "Numbers", "Stats", "Quote", "Next", "Split", "List", "Chart", "Process",
      "Matrix", "ImageFull", "ImageLeft", "ImageRight", "DiagramFull", "DiagramLeft", "DiagramRight",
      "Consult", "End",
    ],
  },
  "monochrome": {
    namespace: "Monochrome",
    importPath: "@micro-keynote/templates/monochrome",
    fixturesImportPath: "@micro-keynote/templates/monochrome/fixtures",
    stylesImportPath: "@micro-keynote/templates/monochrome/styles.css",
    width: 1920,
    height: 1080,
    variants: [
      "Cover", "Chapter", "Statement", "Split", "Stats", "List", "Compare", "Quote",
      "Dense", "Chart", "Diagram", "Pie", "VerticalTimeline", "Cycle", "Pyramid", "End",
      "ImageFull", "ImageLeft", "ImageRight",
    ],
  },
  "tap": {
    namespace: "Tap",
    importPath: "@micro-keynote/templates/tap",
    fixturesImportPath: "@micro-keynote/templates/tap/fixtures",
    stylesImportPath: "@micro-keynote/templates/tap/styles.css",
    width: 1920,
    height: 1080,
    variants: [
      "Cover", "ChapterLight", "ChapterDark", "StatementLight", "StatementDark",
      "Split", "ImageFull", "ImageLeft", "ImageRight",
      "DiagramFull", "DiagramLeft", "DiagramRight",
      "Stats", "List", "Quote", "Compare", "Chart", "End",
    ],
  },
};

export function getTemplateRegistry(): Record<string, { namespace: string; variants: string[]; width: number; height: number }> {
  const out: Record<string, { namespace: string; variants: string[]; width: number; height: number }> = {};
  for (const [k, v] of Object.entries(TEMPLATE_REGISTRY)) {
    out[k] = { namespace: v.namespace, variants: v.variants, width: v.width, height: v.height };
  }
  return out;
}

export async function bundleTemplateVariant(themeId: string, variant: string): Promise<TemplateBundle> {
  const entry = TEMPLATE_REGISTRY[themeId];
  if (!entry) throw new Error(`Unknown theme: ${themeId}`);
  if (!entry.variants.includes(variant)) throw new Error(`Unknown variant: ${variant} for theme ${themeId}`);
  const contents = `import { Deck } from "@micro-keynote/deck-runtime";
import { FIXTURES } from ${JSON.stringify(entry.fixturesImportPath)};
import ${JSON.stringify(entry.stylesImportPath)};
import { createRoot } from "react-dom/client";
const variant = ${JSON.stringify(variant)};
function Preview() {
  const slide = FIXTURES[variant];
  if (!slide) throw new Error("Missing fixture for variant: " + variant);
  return (
    <Deck theme=${JSON.stringify(themeId)} title="Preview" width={${entry.width}} height={${entry.height}}>
      {slide}
    </Deck>
  );
}
const mount = document.getElementById("root");
if (mount) createRoot(mount).render(<Preview />);
`;
  const result = await esbuild.build({
    stdin: {
      contents,
      resolveDir: path.dirname(fileURLToPath(import.meta.url)),
      loader: "tsx",
      sourcefile: `template-preview-${themeId}-${variant}.tsx`,
    },
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    target: ["es2022"],
    jsx: "automatic",
    sourcemap: "inline",
    outdir: "out",
    // Bundle React in so the preview is self-contained — no external CDN at view time.
    define: { "process.env.NODE_ENV": JSON.stringify("production") },
    loader: { ".tsx": "tsx", ".ts": "ts", ".css": "css" },
    nodePaths: nodeModulesSearchPaths(),
    logLevel: "silent",
  });
  const js = result.outputFiles?.find((f) => f.path.endsWith(".js"))?.text;
  const css = result.outputFiles?.find((f) => f.path.endsWith(".css"))?.text ?? "";
  if (!js) throw new Error("Template bundle produced no JS output");
  return { js, css };
}

export function templatePreviewHtml(themeId: string, variant: string): string {
  const entry = TEMPLATE_REGISTRY[themeId];
  const width = entry?.width ?? 1920;
  const bundleUrl = `/preview/templates/${encodeURIComponent(themeId)}/${encodeURIComponent(variant)}/bundle.js`;
  const cssUrl = `/preview/templates/${encodeURIComponent(themeId)}/${encodeURIComponent(variant)}/bundle.css`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Template Preview · ${themeId} · ${variant}</title>
  <link rel="stylesheet" href="${cssUrl}" />
  <style>
    html, body { margin: 0; padding: 0; background: #0a0a0a; }
    body { overflow: hidden; }
    #root { width: ${width}px; transform-origin: top left; }
    #mk-error { color: #f88; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; padding: 16px; max-width: 1000px; white-space: pre-wrap; }
  </style>
</head>
<body>
  <div id="root"></div>
  <pre id="mk-error" hidden></pre>
  <script>
    (function fit() {
      const root = document.getElementById("root");
      const W = ${width};
      function apply() {
        const s = window.innerWidth / W;
        root.style.transform = "scale(" + s + ")";
        document.body.style.height = (root.scrollHeight * s) + "px";
      }
      window.addEventListener("resize", apply);
      const ro = new ResizeObserver(apply);
      ro.observe(root);
      apply();
    })();
  </script>
  <script type="module">
    // The bundle is self-contained (React inlined) and self-mounts into #root.
    import(${JSON.stringify(bundleUrl)} + "?t=" + Date.now()).catch((err) => {
      const el = document.getElementById("mk-error");
      el.hidden = false;
      el.textContent = String(err && err.stack || err);
    });
  </script>
</body>
</html>`;
}

function nodeModulesSearchPaths(): string[] {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const out: string[] = [];
  let dir = here;
  for (let i = 0; i < 6; i += 1) {
    out.push(path.join(dir, "node_modules"));
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return out;
}
