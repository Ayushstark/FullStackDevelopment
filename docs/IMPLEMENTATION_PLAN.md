# DevRhythm implementation plan

## Product direction

Build a JavaScript application that analyzes coding activity and streaks from supported platforms. The product centers on platform activity, a normalized activity history, transparent streak calculations, and useful consistency summaries.

## Delivery phases

### Phase 1 — Foundation

- Keep the Vite + React frontend and Express + Node.js backend runnable locally.
- Document the current repository structure and JavaScript-only conventions.
- Define the shared activity shape and rules for dates, time zones, and duplicate activity.

### Phase 2 — Activity data

- Identify supported platforms and the permitted way to access their data.
- Implement platform adapters behind a server-side boundary.
- Normalize activity while retaining platform, source, retrieval time, and platform-specific meaning.
- Make loading, empty, stale, partial, and error states explicit.

### Phase 3 — Streak analysis

- Calculate daily activity and consecutive-day streaks with documented rules.
- Support platform-specific activity definitions where platforms measure progress differently.
- Validate time-zone boundaries, missing data, and duplicate events.

### Phase 4 — Dashboard

- Present cross-platform practice history and streak summaries.
- Let users inspect the source activity behind a summary.
- Add comparisons over time that remain explainable and grounded in available data.

### Phase 5 — Quality and release

- Cover normalization, calculations, and integration failures with tests.
- Keep lint, tests, production dependency audit, and build checks in CI.
- Document configuration, platform limitations, data handling, and deployment.

## Engineering guardrails

- Use JavaScript and JSX; do not introduce TypeScript.
- Follow the Airbnb JavaScript Style Guide through the repository ESLint baseline.
- Keep platform secrets on the server.
- Validate external data and preserve its source attribution.
- Do not present sample or stale data as live, and do not infer activity the source does not provide.
- Keep platform-specific behavior in its adapter and shared analysis behavior in focused modules.

## Definition of done

A feature is ready when its success and failure cases are handled, relevant tests and lint pass, data freshness and source are clear, and the documentation describes its behavior and limitations.
