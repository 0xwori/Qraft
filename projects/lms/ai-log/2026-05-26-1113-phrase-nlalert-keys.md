# Phrase NL-Alert Keys Lookup

## Actions

- Copied the old Accenture LMS Phrase `.env` into the Qraft LMS Phrase MCP folder.
- Found the active Phrase project named `NL-Alert App`.
- Updated the local Phrase MCP `PHRASE_PROJECT_ID` to the active NL-Alert project id.
- Queried Phrase for recently created keys in the NL-Alert project.

## Result

- Recent NL-Alert Phrase keys were returned from Phrase sorted by `created_at` descending.

## Follow-ups

- Keep real Phrase secrets only in `.env`.
- Use the local `lms-phrase` MCP setup for future read-only Phrase lookups.
