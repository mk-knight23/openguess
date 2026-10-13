# Security

OpenGuess v1 is a static app. Guessing runs in the browser; it does not require login, payments, API keys or a remote learning endpoint. Preferences and statistics stored in the browser should be treated as untrusted and non-secret. Users can clear them through browser settings.

React escapes rendered text by default. Maintain this protection: do not render catalog or proposal text as raw HTML. Validate any new import format before using it, including types, allowed values and reasonable size limits. Exported contribution JSON must be reviewed before becoming catalog source. Dependencies and the build pipeline still matter even when gameplay has no backend.

Run `npm audit --audit-level=high` when changing dependencies; CI checks this threshold alongside tests and a production build. An audit is one check, not a guarantee of security.

If a future version adds shared submissions or accounts, it needs a separate security design covering moderation, authorization, abuse controls, retention and privacy. Do not assume the local proposal flow supplies these protections.

Report a suspected vulnerability through GitHub's private vulnerability reporting if enabled. If unavailable, open an issue requesting a private contact without including exploit details or sensitive data. Do not post credentials or personal information in public issues.
