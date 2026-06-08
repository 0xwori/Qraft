To: [BACKEND_GENERAL_STAKEHOLDERS]
CC: [OPTIONAL_CC]
Subject: Backend production update - BACKEND_BATCH_05.26

Hi all,

The backend batch BACKEND_BATCH_05.26 has been pushed to production.

This batch contains the following improvements:

- LMSMMA-728 - NL-Alert: added original-language fields to alert responses behind a disabled feature flag.
- LMSMMA-995 - NL-Alert app API: added a disabled feature flag for the lang query parameter on /alerts endpoints to support Akamai CDN caching.
- LMSMMA-996 - NL-Alert: configured backend access for the new meldkamer.nl domain.
- LMSMMA-1119 - AML: refactored the backend to Spring Boot reactive programming.

Jira release: https://jira-lms.wah-slv.nl/projects/LMSMMA/versions/15244

No action is needed from your side. This mail is only to keep you informed about the backend improvements that have been pushed to production this month.

Kind regards,
Wouter
