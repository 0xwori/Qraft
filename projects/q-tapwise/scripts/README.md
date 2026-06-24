# q-Tapwise Scripts

Store project helper scripts here.

Do not store secrets in scripts.

## Current Status

There are no runnable q-Tapwise scripts yet.

Future draft-only scripts can be marked safe in `manifest.json`.

Any script that posts social content, sends mail, changes ads, spends budget, or mutates an external system must use:

```json
{
  "mutatesExternalSystem": true,
  "requiresConfirmation": true
}
```
