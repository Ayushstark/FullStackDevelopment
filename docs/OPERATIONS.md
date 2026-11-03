# DevRhythm operations handbook

## Environments

- **Local:** development configuration, sample or test activity, no production credentials or data.
- **Preview:** pull-request deployment with isolated configuration and safe test data.
- **Production:** protected environment, least-privilege secrets, monitoring, and an approved release.

## Release path

1. Open feature pull requests into `dev`.
2. Let `dev` CI and CodeQL validate the integration branch.
3. Open a reviewed promotion pull request from `dev` into `main`.
4. After promotion merges, CI and CodeQL validate `main`.
5. The deployment workflow publishes the frontend artifact to GitHub Pages.
6. Verify the deployed page, navigation, API/configuration health, and error handling.
7. Record release notes and known platform-data limitations.

## Platform data operations

- Keep credentials and tokens in protected server-side configuration.
- Respect platform terms, permissions, quotas, and rate limits.
- Record source platform and retrieval time for imported activity.
- Make failed refreshes visible and avoid silently presenting old data as current.
- Do not treat unavailable platform data as proof of inactivity.

## Incident response

1. Confirm impact and protect users first; disable a failing platform integration if needed.
2. Capture the deployment SHA, affected route or integration, error, time window, and relevant logs without secrets.
3. Roll back to the last known-good deployment or revert the change.
4. Open a follow-up issue with root cause, user impact, and prevention work.

## Production readiness

Before live platform integrations ship, add health checks, structured logs, error tracking, rate limits, database backup/restore verification where persistent storage is used, data-retention rules, and documented secret rotation.
