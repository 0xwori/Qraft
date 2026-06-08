# Tapwise — Design Context (Tap theme)

## Brand Identity
Tapwise is een Nederlandse edtech app voor eindexamenvoorbereiding. De visuele stijl is warm, toegankelijk en helder — geen academische stijfheid, maar een friendly leerplatform dat motiverend aanvoelt. De sfeer is clean en modern, met een opvallend oranje accent dat energie en actie uitstraalt.

---

## Kleurpalet

| Rol        | Hex       | Gebruik |
|------------|-----------|---------|
| `bg`       | `#FFFFFF` | Slide achtergrond (primair) |
| `surface`  | `#F8F7F4` | Secondaire achtergrond, warm off-white |
| `primary`  | `#FF6B35` | Tapwise oranje — CTA's, accenten, highlights |
| `primary-dark` | `#E55A24` | Hover / donkere variant oranje |
| `secondary` | `#1A1A2E` | Kopteksten, dark navy-black |
| `text`     | `#1A1A2E` | Bodytekst (donker) |
| `muted`    | `#6B7280` | Subtekst, captions, labels |
| `light`    | `#F3F4F6` | Achtergrond voor kaarten, lichte vlakken |
| `card`     | `#FFFFFF` | Kaartachtergrond met subtiele border |
| `border`   | `#E5E3DF` | Warme border kleur, consistent met surface |
| `accent`   | `#FF6B35` | Zelfde als primary — gebruik spaarzaam |
| `positive` | `#22C55E` | Groen voor succes, check-marks |
| `negative` | `#EF4444` | Rood voor fouten of negatieve vergelijking |

### Primaire kleur
Oranje (`#FF6B35`) is het hart van de Tapwise identiteit. Gebruik het voor: titelbalk accenten, CTA-knoppen op slides, highlight-bars, en icoon kleuren.

### Achtergronden
Gebruik bijna altijd wit (`#FFFFFF`) als slideachtergrond. Het warme off-white (`#F8F7F4`) werkt goed voor sectie-dividers of full-bleed achtergrondslides.

---

## Typografie

**Font family:** Inter (system-ui als fallback)  
Inter is de enige font-stack voor zowel display als body. Gebruik gewichten consequent.

| Stijl        | Gewicht | Grootte  | Gebruik |
|--------------|---------|----------|---------|
| Display H1   | 700     | 48–56px  | Titelpagina hoofdtitel |
| Slide H1     | 700     | 36–40px  | Slide titels |
| H2           | 600     | 24–28px  | Sectie headers |
| H3           | 600     | 18–20px  | Kaart/blok titels |
| Body         | 400     | 16px     | Lopende tekst |
| Caption/Label | 500    | 12–14px  | Labels, tags, subtekst |
| CTA          | 600     | 16px     | Knoptekst |

Letter-spacing voor H1/display: `-0.02em` (tight). Body: `0`.  
Line-height body: `1.6`. Headings: `1.2`.

---

## Layout & Spacing

- **Grid:** 12 kolommen, 24px gutter, 48px marge links/rechts
- **Slide padding:** 56px horizontaal, 48px verticaal
- **Border radius:** Cards: `12px`. Knoppen: `9999px` (pill). Tags: `6px`.
- **Schaduw:** Subtiel — `0 2px 8px rgba(0,0,0,0.06)` voor kaarten

---

## Visuele stijl — richtlijnen voor slides

1. **Witruimte is een designkeuze** — gebruik ruim. Niet elke slide hoeft vol.
2. **Oranje als spotlight** — gebruik `#FF6B35` voor max. 1–2 elementen per slide (titel accent, highlight bar, of icoon). Nooit als achtergrondvlak op een volledige slide.
3. **Vergelijkingstabellen** — gebruik groene ✓ (`#22C55E`) en rode ✗ (`#EF4444`) iconen, zoals op de website. Positieve features Tapwise rechts, negatief links.
4. **Illustraties** — Tapwise gebruikt lichte, warme sketch-stijl illustraties (geen foto's). Als er illustraties in slides worden gebruikt, kies dan voor line-art of flat icons in oranje/grijs palet.
5. **Knoppen/badges** — pill-shaped, oranje fill met witte tekst, of outline-variant met oranje tekst.
6. **Sections** — gebruik een subtiele horizontale lijn of kleurvlak in `#F8F7F4` om secties te scheiden.

---

## Slide templates aanbevolen voor Tapwise

- **Title slide:** groot wit vlak, Tapwise oranje accent-bar linksboven, display H1 in `#1A1A2E`
- **Content slide:** titel in `#1A1A2E`, body Inter Regular, eventueel highlight-woorden in oranje
- **Comparison slide:** 2-koloms layout met groen/rood iconen, geïnspireerd op website vergelijkingstabel
- **Feature card slide:** 2–3 kaarten per rij, card background `#FFFFFF`, border `#E5E3DF`, icoon in oranje
- **Quote/callout slide:** groot oranje quote-teken, italic body text, centered
- **Stats/data slide:** grote getallen in oranje, label in muted grijs

---

## Wat te vermijden

- Geen donkere achtergrondslides (past niet bij de Tapwise identiteit)
- Geen serif fonts
- Oranje nooit als volledige slideachtergrond
- Geen gebruik van meer dan 3 kleuren per slide
- Geen drukke backgrounds of patronen
