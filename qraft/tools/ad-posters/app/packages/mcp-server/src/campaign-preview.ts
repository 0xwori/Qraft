import path from "node:path";
import { fileURLToPath } from "node:url";
import * as esbuild from "esbuild";

export interface CampaignBundle {
  js: string;
  css: string;
}

export async function bundleCampaignSource(campaignTsxPath: string): Promise<CampaignBundle> {
  const result = await esbuild.build({
    entryPoints: [campaignTsxPath],
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
  const js = result.outputFiles?.find((file) => file.path.endsWith(".js"))?.text;
  const css = result.outputFiles?.find((file) => file.path.endsWith(".css"))?.text ?? "";
  if (!js) throw new Error("Campaign bundle produced no JS output.");
  return { js, css };
}

const REACT_VERSION = "18.3.1";

export function previewHtml(clientId: string, campaignId: string): string {
  const bundleUrl = `/preview/${encodeURIComponent(clientId)}/${encodeURIComponent(campaignId)}/bundle.js`;
  const cssUrl = `/preview/${encodeURIComponent(clientId)}/${encodeURIComponent(campaignId)}/bundle.css`;
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
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Ad Preview</title>
  <link rel="stylesheet" href="${cssUrl}" />
  <style>
    html, body { margin: 0; padding: 0; background: #111; overflow: hidden; }
    #viewport { width: 100vw; height: 100vh; overflow: hidden; position: relative; }
    #root { transform-origin: top left; }
    #ad-error { color: #f99; font: 12px ui-monospace, SFMono-Regular, Menlo, monospace; padding: 16px; white-space: pre-wrap; }
  </style>
  <script type="importmap">${importmap}</script>
</head>
<body>
  <div id="viewport"><div id="root"></div></div>
  <pre id="ad-error" hidden></pre>
  <script>
    function fitAd() {
      const root = document.getElementById("root");
      const ad = document.querySelector("[data-ad-root]");
      if (!root || !ad) return;
      const w = ad.clientWidth || 1;
      const h = ad.clientHeight || 1;
      const scale = Math.min(window.innerWidth / w, window.innerHeight / h);
      root.style.width = w + "px";
      root.style.height = h + "px";
      root.style.transform = "translate(" + Math.max(0, (window.innerWidth - w * scale) / 2) + "px, " + Math.max(0, (window.innerHeight - h * scale) / 2) + "px) scale(" + scale + ")";
    }
    window.addEventListener("resize", fitAd);
    window.__QRAFT_AD_FIT = fitAd;
  </script>
  <script type="module">
    try {
      const React = await import("react");
      const ReactDOMClient = await import("react-dom/client");
      const mod = await import(${JSON.stringify(bundleUrl)} + "?t=" + Date.now());
      const Campaign = mod.default;
      if (!Campaign) throw new Error("campaign.tsx must default-export the campaign component");
      ReactDOMClient.createRoot(document.getElementById("root")).render(React.createElement(Campaign));
      setTimeout(() => window.__QRAFT_AD_FIT && window.__QRAFT_AD_FIT(), 30);
      setTimeout(() => window.__QRAFT_AD_FIT && window.__QRAFT_AD_FIT(), 250);
    } catch (err) {
      const el = document.getElementById("ad-error");
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
  for (let i = 0; i < 7; i += 1) {
    out.push(path.join(dir, "node_modules"));
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return out;
}
