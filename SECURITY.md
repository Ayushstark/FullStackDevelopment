# Security policy

## Reporting a vulnerability

Please use [GitHub private vulnerability reporting](https://github.com/DARK-1926/FullStackDevelopment/security/advisories/new). Do not open a public issue for credentials, personal data, exploit details, or other sensitive material.

Include affected versions or commits, reproduction steps, impact, and a suggested mitigation when safe to do so.

## Engineering controls

- Keep secrets server-side and use least-privilege tokens.
- Validate all external data at integration boundaries.
- Keep platform credentials and access tokens secret and server-side.
- Preserve source attribution and do not present derived streak calculations as platform-reported facts.
- Dependency review, CodeQL, linting, tests, and production builds run in CI.
