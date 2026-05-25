# Qraft

Qraft is a Codex plugin and workfolder in one.

It gives Codex a clear way to work per project:

- read the right project context
- use the right project assets
- run safe local scripts
- call shared tools like the Presentations tool
- keep notes and outputs in predictable folders

## Folder Rules

```text
qraft/      Qraft product engine, commands, skills, templates, and shared tools
projects/   project-specific context, scripts, assets, and logs
```

Inside `qraft/`:

```text
registry/    project and tool registries
scripts/     local setup, health check, and project commands
skills/      Codex command routing for Qraft
templates/   starter files for new projects
tools/       shared tools that can be reused by projects
```

## Main Commands

```bash
npm run qraft:init
npm run qraft:doctor
npm run qraft:project -- list
npm run qraft:project -- show tapwise
npm run qraft:project -- create new-project
npm run qraft:project -- run tapwise atlassian-basic-auth
npm run presentations:ui
```

The easier aliases are:

```bash
npm run qraft:setup
npm run qraft:check
npm run qraft:projects
npm run qraft:open -- tapwise
```

Inside Codex, use:

- `Qraft`
- `Qraft setup`
- `Qraft check`
- `Qraft projects`
- `Qraft open Tapwise`
- `Qraft presentations`
- `Qraft run Tapwise atlassian-basic-auth`

## Project Shape

Each project should use this structure:

```text
projects/<project>/
├── AGENTS.md
├── Memory.md
├── context.md
├── assets/
├── scripts/
├── skills/
├── mcp/
├── tools/
├── outputs/
└── ai-log/
```

## Safety Rules

- Do not commit `.env` files.
- Put real secrets only in local `.env` files.
- Use `.env.example` to document which variables are needed.
- Scripts that change external systems should be marked with `requiresConfirmation: true`.
- Generated files should go in `outputs/` or a project tool folder.

## Presentations

Presentations is the first shared Qraft tool. It creates, edits, previews, and exports local presentation decks.

The app source lives in:

```text
qraft/tools/presentations/app/
```

The shared Presentations workspace lives in:

```text
qraft/tools/presentations/workspace/
```

Project decks live inside the project:

```text
projects/<project>/tools/presentations/
```
