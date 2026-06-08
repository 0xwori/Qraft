---
name: presentations
description: Create, edit, preview, and export presentation decks through Qraft's local Presentations tool.
---

# Presentations

Presentations is bundled in Qraft at `qraft/tools/presentations`.

## Setup

Run setup when dependencies or builds are missing:

```bash
bash qraft/tools/presentations/scripts/setup.sh
```

Start the MCP server:

```bash
bash qraft/tools/presentations/scripts/start-mcp.sh
```

Start the local UI:

```bash
bash qraft/tools/presentations/scripts/start-ui.sh
```

## Easy Codex Commands

```text
$qraft:presentations setup
$qraft:presentations start
$qraft:presentations open ui
$qraft:presentations list decks
$qraft:presentations export deck
```

## Path Rules

- App source lives in `qraft/tools/presentations/app`.
- Shared templates and global context live in `qraft/tools/presentations/workspace`.
- Project deck data lives in `projects/<project>/tools/presentations`.
- Do not put project deck data inside the shared app source.
- Do not hardcode machine-specific paths.

## Common Commands

From `qraft/tools/presentations/app`:

```bash
npm run build
npm test
npm run start:mcp
npm run start:ui
```

## Images

Slides built from the React themes (Monochrome, Broadside, Studio, etc.) take an `image` prop on
image-bearing variants — `Split`, `ImageFull`, `ImageLeft`, `ImageRight`. By default these point at a
placeholder (`https://placehold.co/600x400`); swap in the real image with the MCP tools below.

**Put an image on a slide (one step):**

```text
set_slide_image { clientId, deckId, slideIndex, <one of: filePath | url | dataBase64> }
```

It ingests the image, saves it under the deck's `assets/` folder, and sets the slide's `image` prop
to the served URL (adding the prop if the slide didn't have one). Options: `propName` (defaults to
`image`), `altText` (sets the slide's `alt`/`caption` if it has one), `fileName`.

- **Slide numbers are 1-based for people, 0-based for the tool** — slide #3 is `slideIndex: 2`. Use
  the deck source listing / `list_source_variants` to confirm which slide and that it has an `image`
  prop.
- A reachable **URL** can also be dropped straight into an `image` prop as-is (the renderer passes
  `http(s)://` URLs through), so for a public URL you can skip the asset step.

**Building a deck with several images:** ingest each with `add_source_asset`
(`{ clientId, deckId, <filePath|url|dataBase64> } → { url }`), then use those URLs as `image` prop
values when adding slides (`add_source_slide`) or via `set_slide_image`.

**Pasted/copied images (the important constraint):** an image *pasted into chat* is given to the
model as pixels, **not as bytes on disk** — it cannot be embedded byte-for-byte. It has to land as a
**file or URL** first. On macOS, if the image is on the clipboard, dump it to a file in your session
and then ingest it:

```text
! pngpaste /tmp/qraft-img.png        # brew install pngpaste
# fallback (no install):
! osascript -e 'set f to (open for access POSIX file "/tmp/qraft-img.png" with write permission)' \
            -e 'write (the clipboard as «class PNGf») to f' -e 'close access f'
```

then `set_slide_image { …, filePath: "/tmp/qraft-img.png" }`. If an image was only pasted into chat
(never copied to the clipboard or saved), ask for a file path or URL.
