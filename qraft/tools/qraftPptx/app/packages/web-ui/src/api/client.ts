import type { Deck, LayoutDefinition, ThemeDefinition, ValidationWarning } from "@micro-keynote/core";

export type Client = { id: string; name: string; root: string; resolvedRoot?: string };
export type DeckSummary = { id: string; title: string; themeId: string; slideCount: number; revision: string; updatedAt: string };

export async function api<T = unknown>(url: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.error) throw new Error(payload.error ?? `HTTP ${response.status}`);
  return payload as T;
}

export function listClients() {
  return api<{ clients: Client[] }>("/api/clients");
}

export function listLayouts() {
  return api<{ layouts: LayoutDefinition[] }>("/api/layouts");
}

export function listThemes() {
  return api<{ themes: ThemeDefinition[] }>("/api/themes");
}

export function listDecks(clientId: string) {
  return api<{ decks: DeckSummary[] }>(`/api/decks?clientId=${encodeURIComponent(clientId)}`);
}

export function openDeck(clientId: string, deckId: string) {
  return api<{ deck: Deck; validationWarnings: ValidationWarning[] }>(`/api/decks/${deckId}?clientId=${encodeURIComponent(clientId)}`);
}

export function deleteDeck(clientId: string, deckId: string) {
  return api<{ deleted: true }>(`/api/decks/${encodeURIComponent(deckId)}?clientId=${encodeURIComponent(clientId)}`, { method: "DELETE" });
}

export function readFileBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
