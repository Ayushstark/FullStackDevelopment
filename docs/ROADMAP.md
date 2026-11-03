# DevRhythm roadmap

## Product goal

Build a focused analyzer that brings coding activity from supported platforms into one view and helps users understand their practice streaks and consistency. Platform coverage will depend on reliable, permitted access to activity data.

## Delivery stages

### 1. Foundation

- Keep local setup and the JavaScript development workflow reliable.
- Define a common activity record with platform, activity date, metric, source reference, and retrieval time.
- Keep sample data clearly distinguishable from live platform data.

### 2. Platform activity

- Select platform integrations based on available APIs and access rules.
- Normalize platform activity into the common record while retaining its original meaning and source.
- Handle unavailable, partial, stale, and rate-limited platform responses.

### 3. Streak analysis

- Calculate daily activity and streaks using documented rules.
- Show cross-platform activity over time without double-counting the same activity where it can be identified.
- Explain how summaries are derived and represent missing days or unknown values honestly.

### 4. Dashboard and insights

- Present platform activity, streak history, and consistency summaries in a responsive dashboard.
- Allow users to inspect the underlying platform and date for summarized activity.
- Add useful comparisons over time while avoiding unsupported predictions or rankings.

### 5. Quality and release

- Test date boundaries, time zones, duplicate events, incomplete data, and integration failures.
- Run lint, tests, dependency audit, and production build in CI.
- Document platform limitations, data handling, setup, and deployment operations.

## Guardrails

- Use JavaScript and JSX throughout the application.
- Keep provider credentials server-side and never commit secrets.
- Respect platform terms, rate limits, and API permissions; do not scrape where access is not permitted.
- Preserve source attribution and retrieval timestamps.
- Keep raw platform facts distinct from derived streak calculations.
- Treat sample data as sample data; never present it as a user's live activity.

## Definition of done

A feature is ready when its success and failure paths are covered, JavaScript lint and relevant tests pass, stale or missing source data is clear, and documentation describes the user-visible behavior and its limitations.
