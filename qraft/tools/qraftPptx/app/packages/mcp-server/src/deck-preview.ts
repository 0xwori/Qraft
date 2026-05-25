import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

export interface DeckBundle {
  js: string;
  css: string;
}

/**
 * Compile a deck.tsx to an ESM module that imports React from a peer URL
 * (resolved via the iframe's importmap). The templates package and any
 * deck-local imports are bundled inline. CSS imports are bundled into a
 * separate stylesheet returned alongside the JS.
 */
export async function bundleDeckSource(deckTsxPath: string): Promise<DeckBundle> {
  const result = await esbuild.build({
    entryPoints: [deckTsxPath],
    bundle: true,
    write: false,
    format: "esm",
    platform: "browser",
    target: ["es2022"],
    jsx: "automatic",
    sourcemap: "inline",
    outdir: "out",
    external: ["react", "react/jsx-runtime", "react-dom", "react-dom/client"],
    loader: { ".tsx": "tsx", ".ts": "ts", ".css": "css" },
    nodePaths: nodeModulesSearchPaths(),
    logLevel: "silent",
  });
  const js = result.outputFiles?.find((f) => f.path.endsWith(".js"))?.text;
  const css = result.outputFiles?.find((f) => f.path.endsWith(".css"))?.text ?? "";
  if (!js) throw new Error("Deck bundle produced no JS output");
  return { js, css };
}

const REACT_VERSION = "18.3.1";

export interface PreviewOptions {
  /** Logical deck stage width in px (matches <Deck width=...>). Default 1920. */
  width?: number;
  /** Logical deck stage height in px. Default 1080. */
  height?: number;
  /** When set, render only this slide index (0-based). Used for thumbnails. */
  slideIndex?: number;
}

export function previewHtml(clientId: string, deckId: string, opts: PreviewOptions = {}): string {
  const width = opts.width ?? 1920;
  const height = opts.height ?? 1080;
  const slideIndex = opts.slideIndex;
  const isSingle = slideIndex !== undefined;
  const bundleUrl = `/preview/${encodeURIComponent(clientId)}/${encodeURIComponent(deckId)}/bundle.js`;
  const cssUrl = `/preview/${encodeURIComponent(clientId)}/${encodeURIComponent(deckId)}/bundle.css`;
  const reactBase = `https://esm.sh/react@${REACT_VERSION}`;
  const reactDomBase = `https://esm.sh/react-dom@${REACT_VERSION}`;
  const importmap = JSON.stringify({
    imports: {
      react: reactBase,
      "react/jsx-runtime": `${reactBase}/jsx-runtime`,
      "react-dom": reactDomBase,
      "react-dom/client": `${reactDomBase}/client`,
    },
  });
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Deck Preview</title>
  <link rel="stylesheet" href="${cssUrl}" />
  <style>
    html, body { margin: 0; padding: 0; background: #0a0a0a; }
    body { overflow: ${isSingle ? "hidden" : "auto"}; overflow-x: hidden; }
    #root {
      width: ${width}px;
      transform-origin: top left;
    }
    ${isSingle ? "" : "#root .mk-stage { box-shadow: 0 0 0 1px rgba(255,255,255,.06); margin-bottom: 24px; }"}
    #mk-error { color: #f88; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; padding: 16px; max-width: 1000px; white-space: pre-wrap; }
  </style>
  <script type="importmap">${importmap}</script>
</head>
<body>
  <div id="root"></div>
  <pre id="mk-error" hidden></pre>
  <script>
    (function fit() {
      const root = document.getElementById("root");
      const W = ${width};
      const H = ${height};
      const SI = ${isSingle ? slideIndex : "null"};
      const GAP = 24;
      function apply() {
        const s = window.innerWidth / W;
        if (SI !== null) {
          const offsetY = SI * H;
          root.style.transform = "scale(" + s + ") translateY(-" + offsetY + "px)";
          document.body.style.height = (H * s) + "px";
        } else {
          root.style.transform = "scale(" + s + ")";
          document.body.style.height = (root.scrollHeight * s) + "px";
        }
      }
      window.addEventListener("resize", apply);
      const ro = new ResizeObserver(apply);
      ro.observe(root);
      apply();
    })();
  </script>
  <script type="module">
    try {
      const React = await import("react");
      const ReactDOMClient = await import("react-dom/client");
      const mod = await import(${JSON.stringify(bundleUrl)} + "?t=" + Date.now());
      const Deck = mod.default;
      if (!Deck) throw new Error("deck.tsx must default-export the deck component");
      ReactDOMClient.createRoot(document.getElementById("root")).render(React.createElement(Deck));
    } catch (err) {
      const el = document.getElementById("mk-error");
      el.hidden = false;
      el.textContent = String(err && err.stack || err);
    }
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
