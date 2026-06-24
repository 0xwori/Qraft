# Skill: q-Tapwise Ad Poster Engine

Use this skill when Wouter asks to make animated ad banners, social ad creatives, campaign variants, PNG exports, or MP4 exports.

## Role

Act as a code-first creative developer for Tapwise ads.

Wouter prompts the idea. Codex writes or edits `campaign.tsx`. The Ad Posters browser UI is only for preview and export.

## How It Works

- Each campaign is React/HTML first.
- Motion is written in React/CSS code.
- The source file is `projects/q-tapwise/tools/ad-posters/campaigns/<campaign-id>/campaign.tsx`.
- The stdio MCP server is the function layer Codex can call to create, open, update, validate, preview, and export campaigns.
- Export PNG or MP4 through the Ad Posters tool.

## MCP Workflow

- `read_context` before creating or editing a q-Tapwise campaign.
- `list_ad_sizes` when Wouter asks for specific placements.
- `create_campaign` to create the campaign folder and starter React source.
- `open_campaign` to read the current `campaign.tsx`.
- `update_campaign_source` after Codex writes the design code.
- `validate_campaign` before preview/export.
- `launch_ui` when Wouter wants to preview in the browser.
- Preview the selected variant in the browser before exporting.
- Only call `export_campaign` after Wouter has seen the preview or explicitly says export.

## Design Check Rules

- Use the Impeccable context check before shaping or revising an ad.
- Use real Tapwise assets when available, especially logo and product/learning imagery.
- Use icons for steps, upload, documents, quizzes, summaries, and CTA support when they help scanning.
- Avoid ads that are mostly text. Every banner should include at least one visual system element: logo, product image, illustration, icon set, or motion-led product mockup.
- If using generated or edited imagery, keep it aligned with the Tapwise warm educational style and store it in the campaign `assets/` folder.

## Default Sizes

Use the performance pack unless Wouter asks for fewer sizes:

- 1080x1920
- 1080x1350
- 1080x1080
- 1200x628
- 300x250
- 300x600
- 728x90
- 970x250
- 160x600
- 320x50

## Creative Rules

- Keep one main idea per ad.
- Make text readable at the smallest size.
- Keep CTA clear.
- Use Tapwise style from `projects/q-tapwise/design.md`.
- Use ad-specific style from `projects/q-tapwise/tools/ad-posters/DESIGN.md`.
- Match the real Tapwise landing/frontend style: warm stone canvas, Geist Sans, Tapwise orange `#fd6521`, muted educational copy, subtle borders, and soft product cards.
- For larger ads, show a simple Tapwise product/workflow mockup when it helps the message.
- For small banners, simplify to brand, headline, and CTA.
- Use simple purposeful motion.
- Do not overpromise learning results.
- Do not use generic AI visuals, neon gradients, cold enterprise-blue chrome, or random colors.

## Output Rule

When creating or editing an ad, explain simply:

- what campaign was changed
- which sizes are included
- what motion was added
- where exports are saved

Do not post or launch ads from this skill.
