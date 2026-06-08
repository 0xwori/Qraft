# Brandkit — Shared Intake Guidance

Use this file for guidance that applies to all brand extractions.

## Prose body quality bar

When writing the design.md prose after `brandkit_emit`:

- Every hex value, font name, and size referenced in prose MUST appear in the
  token-reference table. Do not invent values.
- Apply the Impeccable `brand.md` anti-slop guidance: name the aesthetic register,
  describe what makes the brand visually distinctive in one sentence, do not
  default to editorial-magazine aesthetics unless the brief calls for it.
- Follow the house style of the existing Presentations templates (studio,
  broadside, soft-editorial): Overview → Colors → Typography → Layout →
  Depth & Elevation → Do's & Don'ts → Iteration Guide.
- `{colors.<name>}` and `{typography.<token>}` refs in prose resolve at render
  time — use them for any hex or font-stack mention.

## Coverage thresholds

| Score | Recommendation |
|-------|---------------|
| 0.8 + | Safe to hand off |
| 0.5–0.8 | Review missing roles; add a manual source if critical |
| < 0.5 | Add more sources before emitting |
