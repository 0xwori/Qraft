import React from "react";
import { createRoot } from "react-dom/client";
import { CheckCircle2, Code2, Download, Film, Image as ImageIcon, Plus, RefreshCw, Save } from "lucide-react";
import "./styles.css";

type Client = { id: string; name: string };
type CampaignSummary = {
  id: string;
  title: string;
  durationMs: number;
  fps: number;
  variantCount: number;
  updatedAt: string;
};
type AdVariant = { id: string; label: string; width: number; height: number; placement: string };
type Campaign = {
  meta: {
    id: string;
    clientId: string;
    title: string;
    durationMs: number;
    fps: number;
    updatedAt: string;
    variants: AdVariant[];
  };
  source: string;
};

function App() {
  const [clients, setClients] = React.useState<Client[]>([]);
  const [clientId, setClientId] = React.useState("q-tapwise");
  const [campaigns, setCampaigns] = React.useState<CampaignSummary[]>([]);
  const [campaign, setCampaign] = React.useState<Campaign | null>(null);
  const [variantId, setVariantId] = React.useState("");
  const [timeMs, setTimeMs] = React.useState(0);
  const [status, setStatus] = React.useState("Ready");
  const [sourceDraft, setSourceDraft] = React.useState("");
  const [isDirty, setIsDirty] = React.useState(false);
  const [previewReady, setPreviewReady] = React.useState(false);

  React.useEffect(() => {
    void bootstrap();
  }, []);

  React.useEffect(() => {
    if (clientId) void refreshCampaigns(clientId);
  }, [clientId]);

  React.useEffect(() => {
    const protocol = location.protocol === "https:" ? "wss" : "ws";
    const socket = new WebSocket(`${protocol}://${location.host}/events`);
    socket.onmessage = () => {
      void refreshCampaigns(clientId);
      if (campaign) void openCampaign(campaign.meta.id);
    };
    return () => socket.close();
  }, [clientId, campaign?.meta.id]);

  async function bootstrap() {
    try {
      const payload = await api<{ clients: Client[] }>("/api/clients");
      setClients(payload.clients);
      const first = payload.clients[0]?.id ?? "q-tapwise";
      setClientId(first);
      await refreshCampaigns(first);
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }

  async function refreshCampaigns(nextClientId = clientId) {
    const payload = await api<{ campaigns: CampaignSummary[] }>(`/api/campaigns?clientId=${encodeURIComponent(nextClientId)}`);
    setCampaigns(payload.campaigns);
  }

  async function createCampaign() {
    const title = window.prompt("Campaign title", "Tapwise Study Help Ad");
    if (!title) return;
    const result = await api<{ meta: { id: string } }>("/api/campaigns", {
      method: "POST",
      body: { clientId, title },
    });
    await refreshCampaigns(clientId);
    await openCampaign(result.meta.id);
  }

  async function openCampaign(campaignId: string) {
    const opened = await api<Campaign>(`/api/campaigns/${encodeURIComponent(campaignId)}?clientId=${encodeURIComponent(clientId)}`);
    setCampaign(opened);
    setSourceDraft(opened.source);
    setIsDirty(false);
    setPreviewReady(false);
    setVariantId((current) => opened.meta.variants.some((variant) => variant.id === current) ? current : opened.meta.variants[0]?.id ?? "");
    setTimeMs(0);
    setStatus(`Opened ${opened.meta.title}`);
  }

  async function saveSource() {
    if (!campaign) return;
    setStatus("Saving JSX...");
    try {
      await api(`/api/campaigns/${encodeURIComponent(campaign.meta.id)}/source`, {
        method: "PUT",
        body: { clientId, source: sourceDraft },
      });
      const opened = await api<Campaign>(`/api/campaigns/${encodeURIComponent(campaign.meta.id)}?clientId=${encodeURIComponent(clientId)}`);
      setCampaign(opened);
      setSourceDraft(opened.source);
      setIsDirty(false);
      setPreviewReady(false);
      setStatus("Saved JSX. Preview reloaded.");
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }

  async function validateCampaign() {
    if (!campaign) return;
    if (isDirty) {
      setStatus("Save JSX before validating.");
      return;
    }
    setStatus("Validating campaign...");
    try {
      await api(`/api/campaigns/${encodeURIComponent(campaign.meta.id)}/validate`, {
        method: "POST",
        body: { clientId },
      });
      setStatus("Campaign bundles correctly.");
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }

  async function exportCampaign(format: "png" | "mp4") {
    if (!campaign || !variantId) return;
    if (isDirty) {
      setStatus("Save JSX and check the preview before exporting.");
      return;
    }
    if (!previewReady) {
      setStatus("Wait for the preview to load before exporting.");
      return;
    }
    setStatus(`Exporting ${format.toUpperCase()}...`);
    try {
      const result = await api<{ files: Array<{ path: string }>; uploadPackPath: string }>(`/api/campaigns/${encodeURIComponent(campaign.meta.id)}/export`, {
        method: "POST",
        body: { clientId, format, variantId, timeMs },
      });
      setStatus(`Exported ${result.files.length} file. Upload pack: ${result.uploadPackPath}`);
    } catch (error) {
      setStatus(errorMessage(error));
    }
  }

  const selectedVariant = campaign?.meta.variants.find((variant) => variant.id === variantId);
  const previewUrl = campaign && selectedVariant
    ? `/preview/${encodeURIComponent(clientId)}/${encodeURIComponent(campaign.meta.id)}?variant=${encodeURIComponent(selectedVariant.id)}&timeMs=${timeMs}&play=1&v=${encodeURIComponent(campaign.meta.updatedAt)}`
    : "";

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div>
            <h1>Ad Posters</h1>
            <p>Code-first ad campaigns</p>
          </div>
          <button className="icon-button" onClick={() => void refreshCampaigns(clientId)} title="Refresh">
            <RefreshCw size={16} />
          </button>
        </div>

        <label className="field">
          Client
          <select value={clientId} onChange={(event) => setClientId(event.target.value)}>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </label>

        <button className="primary-button" onClick={() => void createCampaign()}>
          <Plus size={16} /> New campaign
        </button>

        <div className="list">
          {campaigns.map((item) => (
            <button
              key={item.id}
              className={`campaign-card ${campaign?.meta.id === item.id ? "active" : ""}`}
              onClick={() => void openCampaign(item.id)}
            >
              <strong>{item.title}</strong>
              <span>{item.variantCount} variants · {item.durationMs / 1000}s</span>
            </button>
          ))}
          {campaigns.length === 0 ? <p className="empty">No campaigns yet.</p> : null}
        </div>
      </aside>

      <section className="workspace">
        {campaign && selectedVariant ? (
          <>
            <header className="toolbar">
              <div>
                <h2>{campaign.meta.title}</h2>
                <p>{selectedVariant.label} · {selectedVariant.width}x{selectedVariant.height}</p>
              </div>
              <div className="toolbar-actions">
                <button onClick={() => void validateCampaign()}><CheckCircle2 size={16} /> Validate</button>
                <button onClick={() => void exportCampaign("png")}><ImageIcon size={16} /> PNG</button>
                <button onClick={() => void exportCampaign("mp4")}><Film size={16} /> MP4</button>
              </div>
            </header>

            <div className="variant-row">
              {campaign.meta.variants.map((variant) => (
                <button
                  key={variant.id}
                  className={variant.id === variantId ? "selected" : ""}
                  onClick={() => {
                    setVariantId(variant.id);
                    setPreviewReady(false);
                  }}
                >
                  {variant.label}
                  <span>{variant.width}x{variant.height}</span>
                </button>
              ))}
            </div>

            <div className="workbench">
              <div className="preview-wrap">
                <div className="preview-frame" style={{ aspectRatio: `${selectedVariant.width} / ${selectedVariant.height}` }}>
                  <iframe title="Ad preview" src={previewUrl} onLoad={() => setPreviewReady(true)} />
                </div>
              </div>

              <aside className="editor-panel">
                <header>
                  <div>
                    <h3><Code2 size={16} /> JSX Source</h3>
                    <p>Edit, save, preview, then export.</p>
                  </div>
                  <button className="save-button" onClick={() => void saveSource()} disabled={!isDirty}>
                    <Save size={15} /> Save
                  </button>
                </header>
                <textarea
                  spellCheck={false}
                  value={sourceDraft}
                  onChange={(event) => {
                    setSourceDraft(event.target.value);
                    setIsDirty(true);
                    setPreviewReady(false);
                  }}
                />
              </aside>
            </div>

            <footer className="footer">
              <label>
                Poster frame
                <input
                  type="range"
                  min={0}
                  max={campaign.meta.durationMs}
                  step={100}
                  value={timeMs}
                  onChange={(event) => {
                    setTimeMs(Number(event.target.value));
                    setPreviewReady(false);
                  }}
                />
                <span>{(timeMs / 1000).toFixed(1)}s</span>
              </label>
              <div className="source-note">
                {isDirty ? "Unsaved JSX changes" : previewReady ? "Preview loaded" : "Preview loading"}
              </div>
            </footer>
          </>
        ) : (
          <div className="welcome">
            <Download size={36} />
            <h2>Choose or create a campaign</h2>
            <p>Codex writes the React campaign. This UI previews variants and exports upload-ready files.</p>
          </div>
        )}
      </section>

      <div className="status">{status}</div>
    </main>
  );
}

async function api<T>(url: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? response.statusText);
  return data as T;
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

createRoot(document.getElementById("root")!).render(<App />);
