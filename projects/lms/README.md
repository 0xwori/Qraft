# LMS Workspace

Operational workspace for LMS / Politie MMA Team.

```text
LMS/
├── AGENTS.md                 # LMS working instructions
├── README.md                 # Folder map
├── context.md                # Current LMS context
├── memory.md                 # Durable PM memory
├── stakeholders.md           # Stakeholder groups and contacts
├── apps/                     # Product notes for 112NL, Burgernet, NL-Alert
├── affine/                   # Affine board references
├── ai-log/                   # Timestamped Codex work notes
├── figma/                    # Figma design links
├── jira/                     # Jira workflows, JQL, and exports
├── mail-templates/           # Reusable stakeholder mail templates
├── mcp/                      # Local MCP setup notes and server projects
├── procedures/               # Mandatory steps for recurring LMS work
├── releases/                 # Release planning and release records
└── skills/                   # LMS-specific reusable Codex skills
```

## Placement Guide

- App-specific product notes go in `apps/`.
- Release planning, go-live notes, and cadence release records go in `releases/`.
- Jira exports and backlog snapshots go in `jira/exports/`.
- Reusable stakeholder mails go in `mail-templates/`.
- Mandatory recurring-work procedures go in `procedures/`.
- Tool setup notes and local MCP server projects stay in `mcp/`.
- Working logs from Codex sessions go in `ai-log/`.
- Real credentials stay only in `.env` files and must not be copied into markdown.
