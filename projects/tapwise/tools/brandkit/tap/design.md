---
version: alpha
name: Tapwise
description: Tapwise maakt examenstof oefenbaar via AI-quizzen, uitleg, podcasts en adaptieve practice.
colors:
  primary: "#F26B1D"
  bg: "#F9F6F1"
  surface: "#FFFFFF"
  surface-alt: "#EEF7EE"
  border: "#E5E0D8"
  text: "#1A1A1A"
  text-muted: "#6B6B6B"
  tag-bg: "#FFF3EB"
  tag-text: "#F26B1D"
typography:
  display:
    fontFamily: Inter, sans-serif
    fontWeight: 700
    fontSize: 2.5rem
  body:
    fontFamily: Inter, sans-serif
    fontWeight: 400
    fontSize: 1rem
  mono:
    fontFamily: monospace
    fontWeight: 400
spacing:
  radius: 8
canvas:
  width: 100vw
  height: 100vh
---

<!-- BRANDKIT-GENERATED: frontmatter is machine-written; prose below is agent-written -->

## Token Reference

### Colors

| Key | Value | Canonical role |
|-----|-------|----------------|
| `primary` | `#F26B1D` | ✓ |
| `bg` | `#F9F6F1` | ✓ |
| `surface` | `#FFFFFF` |  |
| `surface-alt` | `#EEF7EE` |  |
| `border` | `#E5E0D8` | ✓ |
| `text` | `#1A1A1A` | ✓ |
| `text-muted` | `#6B6B6B` |  |
| `tag-bg` | `#FFF3EB` |  |
| `tag-text` | `#F26B1D` |  |

### Typography

| Token | fontFamily | fontSize | fontWeight |
|-------|-----------|----------|------------|
| `display` | Inter, sans-serif | 2.5rem | 700 |
| `body` | Inter, sans-serif | 1rem | 400 |
| `mono` | monospace | — | 400 |

> **Extraction:** 2026-06-08T11:15:57.764Z · sources: image > website

## Overview

Tapwise is a warm-neutral Dutch EdTech brand. The default surface is `#F9F6F1` — a cream that reads warmer than white without signalling warmth as a theme. Against it, `#1A1A1A` text carries full authority and `#F26B1D` orange fires as the single chromatic accent: logo mark, interactive labels, section tags, and call-to-action elements. Everything else stays achromatic.

The type is Inter at two weights. Bold 700 for display headings — large, tight, direct. Regular 400 for all supporting copy. No all-caps, no decorative treatments, no second typeface. The result is a system that reads as a product, not a campaign.

Cards sit on `#FFFFFF` white set into the `#F9F6F1` cream field, edged by `#E5E0D8` hairline borders. The `#EEF7EE` soft mint appears as a section-level background variant — a gentle contrast shift, not a palette departure. Tapwise's visual distinctiveness comes from restraint: one orange against an otherwise warm grayscale world.

## Colors

`bg` `#F9F6F1` is the slide default — use it as the base surface for every light slide. Never substitute pure white as the background; the warmth is structural.

`primary` `#F26B1D` is the orange. One per slide as an emphasis signal. Use it for labels, tags, icon fills, and single-word CTA accents. Do not fill large areas with it.

`surface` `#FFFFFF` is for inset card elements — content blocks, stat cells, image frames — that need to lift off the cream background.

`surface-alt` `#EEF7EE` is the soft mint variant for section backgrounds or split-layout panels. Use it when a second surface is needed; keep it away from orange.

`border` `#E5E0D8` is the hairline value. Apply to card edges and dividers at 1px. No heavier rules.

`text` `#1A1A1A` is the primary text color for all headings, labels, and body copy.

`text-muted` `#6B6B6B` is for secondary text: captions, metadata, attributions.

`tag-bg` `#FFF3EB` and `tag-text` `#F26B1D` form the pill/tag pair. Use for inline labels and section chips.

## Typography

Inter is the only typeface. Two weights carry the full type system.

| Token | Size | Family | Weight | Use |
|-------|------|--------|--------|-----|
| `display` | 5vw | Inter | 700 | Slide headlines, cover titles |
| `body` | 1.4vw | Inter | 400 | Body copy, descriptions, bullets |
| `mono` | monospace | — | 400 | Labels, metadata, data values |

Headlines are set in Inter 700 at large viewport-relative sizes. No tracking adjustments, no forced line breaks. Body copy runs at 1.4vw with normal line height. No italic, no underline, no text-shadow.

## Layout

Canvas is 100vw × 100vh. Default horizontal padding: 6vw on each side. Default vertical padding: 5vh top and bottom. Chrome (label, page number, footer) occupies a 3vh bar at the top and a 3vh bar at the bottom, leaving the main content zone between them.

Content blocks use an 8px base grid. Cards have 16px border-radius. The system is content-dense but breathing — slides carry one primary message, supported by secondary content at lower visual weight.

## Depth and Elevation

The design is flat. No drop shadows. No gradients. Depth is created exclusively by surface contrast: `#F9F6F1` → `#FFFFFF` card → `#E5E0D8` hairline border. Border-radius is consistently 8px on interactive elements and 16px on larger card containers.

## Do's and Don'ts

**Do:**
- Use `#F9F6F1` as the slide background, not white
- Use `#F26B1D` orange for exactly one accent element per slide
- Set cards and inset elements on `#FFFFFF` with a `#E5E0D8` hairline border
- Use Inter 700 for all headlines and Inter 400 for all body text
- Use `#EEF7EE` for alternate-surface panels or split-layout backgrounds
- Keep labels and section chips in the `tag-bg`/`tag-text` pair

**Don't:**
- Introduce any second chromatic color (no blue, green, purple, red)
- Use `#F26B1D` orange as a large fill or slide background
- Use pure white `#FFFFFF` as the slide background
- Apply gradients, shadows, or glass effects
- Use more than two font weights on a single slide
- Use all-caps headings or decorative type treatments