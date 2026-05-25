import { api } from "./client";

export interface SourceDeckSummary {
  id: string;
  title: string;
  updatedAt: string;
  slideCount: number;
}

export async function listSourceDecks(clientId: string): Promise<SourceDeckSummary[]> {
  const result = await api<{ decks: SourceDeckSummary[] }>(
    `/api/source-decks?clientId=${encodeURIComponent(clientId)}`,
  );
  return result.decks;
}

export interface DeckSourceProp {
  name: string;
  value: string | null;
  kind: "string" | "expression";
  line: number;
  col: number;
}

export interface DeckSourceSlide {
  index: number;
  component: string;
  line: number;
  props: DeckSourceProp[];
}

export interface DeckSource {
  file: string;
  slides: DeckSourceSlide[];
}

export async function getDeckSource(clientId: string, deckId: string): Promise<DeckSource> {
  const result = await api<{ source: DeckSource }>(
    `/api/decks/${encodeURIComponent(deckId)}/source?clientId=${encodeURIComponent(clientId)}`,
  );
  return result.source;
}

export async function patchDeckSource(input: {
  clientId: string;
  deckId: string;
  slideIndex: number;
  propName: string;
  value: string;
}): Promise<DeckSource> {
  const result = await api<{ source: DeckSource }>(
    `/api/decks/${encodeURIComponent(input.deckId)}/source`,
    {
      method: "PATCH",
      body: {
        clientId: input.clientId,
        slideIndex: input.slideIndex,
        propName: input.propName,
        value: input.value,
      },
    },
  );
  return result.source;
}

export async function reorderSourceSlides(input: {
  clientId: string;
  deckId: string;
  order: number[];
}): Promise<DeckSource> {
  const result = await api<{ source: DeckSource }>(
    `/api/decks/${encodeURIComponent(input.deckId)}/source/reorder`,
    { method: "POST", body: { clientId: input.clientId, order: input.order } },
  );
  return result.source;
}

export async function deleteSourceSlide(input: {
  clientId: string;
  deckId: string;
  slideIndex: number;
}): Promise<DeckSource> {
  const result = await api<{ source: DeckSource }>(
    `/api/decks/${encodeURIComponent(input.deckId)}/source/slides/${input.slideIndex}?clientId=${encodeURIComponent(input.clientId)}`,
    { method: "DELETE" },
  );
  return result.source;
}

export async function insertSourceSlide(input: {
  clientId: string;
  deckId: string;
  position: number;
  jsx: string;
}): Promise<DeckSource> {
  const result = await api<{ source: DeckSource }>(
    `/api/decks/${encodeURIComponent(input.deckId)}/source/slides`,
    {
      method: "POST",
      body: { clientId: input.clientId, position: input.position, jsx: input.jsx },
    },
  );
  return result.source;
}

export async function exportDeckSource(input: {
  clientId: string;
  deckId: string;
  format: "html" | "pdf";
}): Promise<{ path: string; format: string }> {
  return api<{ path: string; format: string }>(
    `/api/decks/${encodeURIComponent(input.deckId)}/source/export`,
    { method: "POST", body: { clientId: input.clientId, format: input.format } },
  );
}

export interface VariantMeta {
  variant: string;
  purpose: string;
  density: "low" | "medium" | "high";
  requiredProps: string[];
  optionalProps: string[];
  jsxTemplate: string;
}

export interface ThemeCatalogEntry {
  namespace: string;
  themeId: string;
  variants: string[];
  variantMeta: VariantMeta[];
}

export async function listSourceThemes(): Promise<ThemeCatalogEntry[]> {
  const result = await api<{ themes: ThemeCatalogEntry[] }>(`/api/source-themes`);
  return result.themes;
}

export interface ChangeThemeResult {
  source: DeckSource;
  unmappedSlides: Array<{ slideIndex: number; component: string }>;
}

export async function changeSourceTheme(input: {
  clientId: string;
  deckId: string;
  themeId: string;
}): Promise<ChangeThemeResult> {
  const result = await api<{
    source: DeckSource;
    unmappedSlides: Array<{ slideIndex: number; component: string }>;
  }>(`/api/decks/${encodeURIComponent(input.deckId)}/source/theme`, {
    method: "POST",
    body: { clientId: input.clientId, themeId: input.themeId },
  });
  return { source: result.source, unmappedSlides: result.unmappedSlides };
}

export async function uploadSourceAsset(input: {
  clientId: string;
  deckId: string;
  fileName: string;
  dataBase64: string;
}): Promise<{ fileName: string; url: string }> {
  return api<{ fileName: string; url: string }>(
    `/api/decks/${encodeURIComponent(input.deckId)}/source/assets`,
    {
      method: "POST",
      body: {
        clientId: input.clientId,
        fileName: input.fileName,
        dataBase64: input.dataBase64,
      },
    },
  );
}
