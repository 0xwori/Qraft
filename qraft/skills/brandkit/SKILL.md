---
name: brandkit
description: Extract a brand's design system from assets (PPTX, website, Figma) and produce a design.md that the Presentations tool imports as a branded template. Use when the user says "Brandkit", "brand intake", "extract brand", or "brand design.md".
---

# Brandkit

Brandkit is a Qraft tool at `qraft/tools/brandkit` that ingests brand assets and
produces a `design.md` the Presentations template-importer consumes to create a
branded deck template.

## Pipeline

```
1. brandkit_create_brand  — scaffold the per-brand folder
2. brandkit_add_source    — register PPTX / website URL / Figma fileKey
3. brandkit_extract       — run extractors → evidence/*.dtcg.json
4. brandkit_fuse          — merge evidence → tokens.dtcg.json + coverage.json
5. brandkit_emit          — write design.md frontmatter + token tables + PROSE-TODO
6. [agent prose step]     — read tokens resource; write the design.md prose body
7. brandkit_handoff       — copy into Presentations + run importer → theme JSON
```

## Commands

| Command | Purpose |
|---|---|
| `Qraft brandkit create <project> <slug> <name>` | Scaffold a new brand. |
| `Qraft brandkit add source <project> <slug>` | Register a source (PPTX path / URL / Figma key). |
| `Qraft brandkit extract <project> <slug>` | Run all registered extractors. |
| `Qraft brandkit fuse <project> <slug>` | Merge evidence and generate tokens + coverage. |
| `Qraft brandkit emit <project> <slug>` | Emit design.md + template files. |
| `Qraft brandkit prose <project> <slug>` | Write the design.md prose body (agent step). |
| `Qraft brandkit handoff <project> <slug>` | Hand off to Presentations. |
| `Qraft brandkit run <project> <slug>` | Run the full pipeline end-to-end. |

## Agent prose workflow (step 6)

After `brandkit_emit` writes the frontmatter + token tables + PROSE-TODO sections:

1. Read the tokens resource:
   `brandkit://brand/{projectId}/{slug}/tokens`
2. Read the coverage report:
   `brandkit://brand/{projectId}/{slug}/coverage`
3. Write the prose body of `design.md` replacing each `<!-- TODO:` block.
   - Every hex value MUST come from the token table. No invented values.
   - Name the aesthetic register in the Overview (one concrete sentence).
   - Follow the house style of the existing templates in
     `qraft/tools/presentations/workspace/templates/sources/`.
   - Apply the `qraft/skills/impeccable/reference/brand.md` anti-slop guidance.
4. Update `template.json` mood/tone/occasion/formality fields to match the
   extracted brand character.

## Path rules

- App source: `qraft/tools/brandkit/app`
- Workspace: `qraft/tools/brandkit/workspace`
- Per-brand output: `projects/<project>/tools/brandkit/<slug>/`
- Hands off to: `qraft/tools/presentations/workspace/templates/sources/<slug>/`

## Setup

```bash
bash qraft/tools/brandkit/scripts/setup.sh
```

## Start MCP

```bash
bash qraft/tools/brandkit/scripts/start-mcp.sh
```
