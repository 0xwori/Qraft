# q-Tapwise Ad Posters Guide

This folder stores code-first ad campaigns for q-Tapwise.

The source of truth for each campaign is `campaign.tsx`.

## How To Work Here

- Codex edits React/HTML/CSS code.
- The browser UI previews and exports only.
- Campaigns live under `campaigns/`.
- Exported PNG and MP4 files live inside each campaign's `.export/` folder.
- Use `PRODUCT.md` and `DESIGN.md` as campaign context.
- Do not store secrets, customer data, raw email bodies, or ad-platform tokens here.

## Publishing Safety

This tool does not publish ads or spend money.

Manual upload is the first workflow. Any future tool that posts, launches campaigns, changes budgets, or calls ad APIs must ask Wouter first.
